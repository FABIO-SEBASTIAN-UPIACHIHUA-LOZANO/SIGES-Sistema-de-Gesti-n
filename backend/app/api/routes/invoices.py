from decimal import Decimal, ROUND_HALF_UP
from typing import List
from io import BytesIO
from xml.sax.saxutils import escape

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session, joinedload

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    KeepTogether,
)

from app.db.session import get_db
from app.models.client import Client
from app.models.invoice import (
    Invoice,
    InvoiceItem,
    InvoiceStatus,
)
from app.models.service import Service, ServiceStatus
from app.schemas.invoice import (
    InvoiceCreate,
    InvoiceListResponse,
    InvoiceResponse,
)
from app.core.rbac import RoleChecker
from app.models.user import User
from app.services.audit_service import log_audit


router = APIRouter()


# ============================================================
# UTILIDADES
# ============================================================

def money(value) -> Decimal:
    return Decimal(str(value or 0)).quantize(
        Decimal("0.01"),
        rounding=ROUND_HALF_UP,
    )


def get_next_invoice_number(
    db: Session,
    tipo_comprobante,
    serie: str,
) -> int:
    ultimo = (
        db.query(Invoice)
        .filter(
            Invoice.tipo_comprobante == tipo_comprobante,
            Invoice.serie == serie,
        )
        .order_by(Invoice.numero.desc())
        .first()
    )

    if not ultimo:
        return 1

    return ultimo.numero + 1


def safe_text(value) -> str:
    """
    Evita problemas si los datos reales contienen
    caracteres especiales para ReportLab.
    """
    if value is None:
        return ""

    return escape(str(value))


def money_text(value) -> str:
    return f"S/ {Decimal(str(value or 0)):.2f}"


# ============================================================
# LISTADO
# ============================================================

@router.get(
    "/",
    response_model=List[InvoiceListResponse],
)
def list_invoices(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        RoleChecker(["ADMIN", "VENDEDOR"])
    ),
):
    return (
        db.query(Invoice)
        .order_by(Invoice.fecha_emision.desc())
        .all()
    )


# ============================================================
# OBTENER COMPROBANTE
# ============================================================

@router.get(
    "/{invoice_id}",
    response_model=InvoiceResponse,
)
def get_invoice(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        RoleChecker(["ADMIN", "VENDEDOR"])
    ),
):
    invoice = (
        db.query(Invoice)
        .options(
            joinedload(Invoice.detalles)
        )
        .filter(Invoice.id == invoice_id)
        .first()
    )

    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comprobante no encontrado",
        )

    return invoice


# ============================================================
# CREAR COMPROBANTE
# ============================================================

@router.post(
    "/",
    response_model=InvoiceResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_invoice(
    invoice_in: InvoiceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        RoleChecker(["ADMIN", "VENDEDOR"])
    ),
):
    service = (
        db.query(Service)
        .options(
            joinedload(Service.items)
        )
        .filter(Service.id == invoice_in.servicio_id)
        .first()
    )

    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Servicio no encontrado",
        )

    if service.estado == ServiceStatus.CANCELADO:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "No se puede emitir un comprobante "
                "para un servicio cancelado"
            ),
        )

    existing_invoice = (
        db.query(Invoice)
        .filter(Invoice.servicio_id == service.id)
        .first()
    )

    if existing_invoice:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"El servicio #{service.id} ya tiene "
                f"el comprobante #{existing_invoice.id}"
            ),
        )

    client = (
        db.query(Client)
        .filter(Client.id == service.cliente_id)
        .first()
    )

    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cliente no encontrado",
        )

    mano_de_obra = money(service.monto)

    total_productos = money(
        sum(
            money(item.subtotal)
            for item in (service.items or [])
        )
    )

    total = money(
        mano_de_obra + total_productos
    )

    serie = invoice_in.serie.strip().upper()

    numero = get_next_invoice_number(
        db,
        invoice_in.tipo_comprobante,
        serie,
    )

    cliente_nombre = (
        f"{client.nombres} {client.apellidos}"
    ).strip()

    invoice = Invoice(
        servicio_id=service.id,
        cliente_id=client.id,
        usuario_id=current_user.id,
        tipo_comprobante=invoice_in.tipo_comprobante,
        serie=serie,
        numero=numero,
        cliente_nombre=cliente_nombre,
        cliente_documento=client.documento,
        cliente_direccion=client.direccion,
        subtotal=total,
        total=total,
        estado=InvoiceStatus.EMITIDO,
        observaciones=invoice_in.observaciones,
    )

    db.add(invoice)
    db.flush()

    # Mano de obra / servicio
    if mano_de_obra > Decimal("0.00"):
        db.add(
            InvoiceItem(
                comprobante_id=invoice.id,
                producto_id=None,
                concepto=f"Servicio - {service.tipo_servicio}",
                cantidad=Decimal("1.00"),
                precio_unitario=mano_de_obra,
                subtotal=mano_de_obra,
            )
        )

    # Productos utilizados
    for item in service.items or []:
        db.add(
            InvoiceItem(
                comprobante_id=invoice.id,
                producto_id=item.producto_id,
                concepto=f"Producto #{item.producto_id}",
                cantidad=money(item.cantidad),
                precio_unitario=money(item.precio_unitario),
                subtotal=money(item.subtotal),
            )
        )

    log_audit(
        db,
        usuario_id=current_user.id,
        accion="EMITIR_COMPROBANTE",
        entidad="Invoice",
        entidad_id=invoice.id,
        descripcion=(
            f"Comprobante {invoice.tipo_comprobante.value} "
            f"{invoice.serie}-{invoice.numero} emitido "
            f"para servicio #{service.id} "
            f"por S/ {total:.2f}"
        ),
    )

    db.commit()
    db.refresh(invoice)

    return invoice


# ============================================================
# ANULAR COMPROBANTE
# ============================================================

@router.patch(
    "/{invoice_id}/anular",
    response_model=InvoiceResponse,
)
def cancel_invoice(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        RoleChecker(["ADMIN"])
    ),
):
    invoice = (
        db.query(Invoice)
        .options(
            joinedload(Invoice.detalles)
        )
        .filter(Invoice.id == invoice_id)
        .first()
    )

    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comprobante no encontrado",
        )

    if invoice.estado == InvoiceStatus.ANULADO:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El comprobante ya está anulado",
        )

    invoice.estado = InvoiceStatus.ANULADO

    log_audit(
        db,
        usuario_id=current_user.id,
        accion="ANULAR_COMPROBANTE",
        entidad="Invoice",
        entidad_id=invoice.id,
        descripcion=(
            f"Comprobante {invoice.tipo_comprobante.value} "
            f"{invoice.serie}-{invoice.numero} anulado"
        ),
    )

    db.commit()
    db.refresh(invoice)

    return invoice


# ============================================================
# PDF PROFESIONAL
# ============================================================

@router.get(
    "/{invoice_id}/pdf",
)
def generate_invoice_pdf(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        RoleChecker(["ADMIN", "VENDEDOR"])
    ),
):
    invoice = (
        db.query(Invoice)
        .options(
            joinedload(Invoice.detalles),
            joinedload(Invoice.cliente),
            joinedload(Invoice.servicio),
        )
        .filter(Invoice.id == invoice_id)
        .first()
    )

    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comprobante no encontrado",
        )

    # --------------------------------------------------------
    # CONFIGURACIÓN DEL DOCUMENTO
    # --------------------------------------------------------

    buffer = BytesIO()

    document = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=15 * mm,
        leftMargin=15 * mm,
        topMargin=13 * mm,
        bottomMargin=15 * mm,
        title=(
            f"{invoice.tipo_comprobante.value} "
            f"{invoice.serie}-{invoice.numero}"
        ),
        author="SIGES",
        subject="Comprobante generado por SIGES",
    )

    styles = getSampleStyleSheet()

    # Paleta
    primary = colors.HexColor("#4338CA")
    primary_dark = colors.HexColor("#312E81")
    primary_light = colors.HexColor("#EEF2FF")

    slate_900 = colors.HexColor("#0F172A")
    slate_700 = colors.HexColor("#334155")
    slate_600 = colors.HexColor("#475569")
    slate_500 = colors.HexColor("#64748B")
    slate_400 = colors.HexColor("#94A3B8")
    slate_300 = colors.HexColor("#CBD5E1")
    slate_200 = colors.HexColor("#E2E8F0")
    slate_100 = colors.HexColor("#F1F5F9")
    slate_50 = colors.HexColor("#F8FAFC")

    white = colors.white

    # --------------------------------------------------------
    # ESTILOS
    # --------------------------------------------------------

    brand_style = ParagraphStyle(
        "Brand",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=22,
        leading=24,
        textColor=primary,
        alignment=TA_LEFT,
    )

    brand_subtitle = ParagraphStyle(
        "BrandSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8,
        leading=10,
        textColor=slate_500,
        alignment=TA_LEFT,
    )

    document_type_style = ParagraphStyle(
        "DocumentType",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=12,
        leading=15,
        textColor=primary,
        alignment=TA_CENTER,
    )

    document_number_style = ParagraphStyle(
        "DocumentNumber",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=15,
        leading=18,
        textColor=slate_900,
        alignment=TA_CENTER,
    )

    section_style = ParagraphStyle(
        "SectionTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=9,
        leading=11,
        textColor=slate_700,
        alignment=TA_LEFT,
        spaceAfter=5,
    )

    label_style = ParagraphStyle(
        "Label",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=7.5,
        leading=10,
        textColor=slate_500,
    )

    value_style = ParagraphStyle(
        "Value",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=11,
        textColor=slate_900,
    )

    value_bold_style = ParagraphStyle(
        "ValueBold",
        parent=value_style,
        fontName="Helvetica-Bold",
    )

    table_header_style = ParagraphStyle(
        "TableHeader",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=7.5,
        leading=9,
        textColor=primary_dark,
    )

    table_cell_style = ParagraphStyle(
        "TableCell",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8,
        leading=10,
        textColor=slate_700,
    )

    table_cell_right_style = ParagraphStyle(
        "TableCellRight",
        parent=table_cell_style,
        alignment=TA_RIGHT,
    )

    total_label_style = ParagraphStyle(
        "TotalLabel",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=9,
        leading=11,
        textColor=slate_700,
        alignment=TA_RIGHT,
    )

    total_value_style = ParagraphStyle(
        "TotalValue",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=17,
        leading=20,
        textColor=primary,
        alignment=TA_RIGHT,
    )

    footer_style = ParagraphStyle(
        "Footer",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=7,
        leading=9,
        textColor=slate_400,
        alignment=TA_CENTER,
    )

    small_center_style = ParagraphStyle(
        "SmallCenter",
        parent=value_style,
        fontSize=7.5,
        alignment=TA_CENTER,
    )

    story = []

    # --------------------------------------------------------
    # TIPO DE COMPROBANTE
    # --------------------------------------------------------

    tipo_label = {
        "BOLETA": "BOLETA DE VENTA",
        "FACTURA": "FACTURA",
        "NOTA_VENTA": "NOTA DE VENTA",
    }.get(
        invoice.tipo_comprobante.value,
        invoice.tipo_comprobante.value,
    )

    numero_completo = (
        f"{invoice.serie}-{int(invoice.numero):06d}"
    )

    # --------------------------------------------------------
    # ENCABEZADO PRINCIPAL
    # --------------------------------------------------------

    brand_block = [
        Paragraph("SIGES", brand_style),
        Paragraph(
            "Sistema de Gestión Empresarial",
            brand_subtitle,
        ),
        Spacer(1, 2),
        Paragraph(
            "Gestión de servicios, clientes e inventario",
            ParagraphStyle(
                "BrandDescription",
                parent=brand_subtitle,
                fontSize=7,
            ),
        ),
    ]

    document_block = [
        Paragraph(
            tipo_label,
            document_type_style,
        ),
        Spacer(1, 3),
        Paragraph(
            numero_completo,
            document_number_style,
        ),
        Spacer(1, 4),
        Paragraph(
            "COMPROBANTE",
            ParagraphStyle(
                "MiniLabel",
                parent=label_style,
                alignment=TA_CENTER,
            ),
        ),
    ]

    header_table = Table(
        [
            [
                brand_block,
                document_block,
            ]
        ],
        colWidths=[105 * mm, 70 * mm],
    )

    header_table.setStyle(
        TableStyle(
            [
                (
                    "VALIGN",
                    (0, 0),
                    (-1, -1),
                    "MIDDLE",
                ),
                (
                    "LEFTPADDING",
                    (0, 0),
                    (0, 0),
                    5,
                ),
                (
                    "RIGHTPADDING",
                    (0, 0),
                    (0, 0),
                    8,
                ),
                (
                    "LEFTPADDING",
                    (1, 0),
                    (1, 0),
                    8,
                ),
                (
                    "RIGHTPADDING",
                    (1, 0),
                    (1, 0),
                    8,
                ),
                (
                    "TOPPADDING",
                    (0, 0),
                    (-1, -1),
                    8,
                ),
                (
                    "BOTTOMPADDING",
                    (0, 0),
                    (-1, -1),
                    8,
                ),
                (
                    "BOX",
                    (1, 0),
                    (1, 0),
                    1,
                    primary,
                ),
                (
                    "BACKGROUND",
                    (1, 0),
                    (1, 0),
                    primary_light,
                ),
            ]
        )
    )

    story.append(header_table)
    story.append(Spacer(1, 10))

    # --------------------------------------------------------
    # LÍNEA INFORMATIVA
    # --------------------------------------------------------

    fecha_emision = invoice.fecha_emision.strftime(
        "%d/%m/%Y %H:%M"
    )

    estado_texto = invoice.estado.value

    estado_color = (
        colors.HexColor("#15803D")
        if invoice.estado == InvoiceStatus.EMITIDO
        else colors.HexColor("#B91C1C")
    )

    estado_bg = (
        colors.HexColor("#DCFCE7")
        if invoice.estado == InvoiceStatus.EMITIDO
        else colors.HexColor("#FEE2E2")
    )

    status_style = ParagraphStyle(
        "Status",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=7.5,
        leading=9,
        textColor=estado_color,
        alignment=TA_CENTER,
    )

    info_table = Table(
        [
            [
                [
                    Paragraph("FECHA DE EMISIÓN", label_style),
                    Paragraph(fecha_emision, value_style),
                ],
                [
                    Paragraph("SERVICIO", label_style),
                    Paragraph(
                        f"#{invoice.servicio_id}",
                        value_bold_style,
                    ),
                ],
                [
                    Paragraph("ESTADO", label_style),
                    Paragraph(
                        estado_texto,
                        status_style,
                    ),
                ],
                [
                    Paragraph("ID INTERNO", label_style),
                    Paragraph(
                        f"#{invoice.id}",
                        value_style,
                    ),
                ],
            ]
        ],
        colWidths=[
            45 * mm,
            40 * mm,
            45 * mm,
            45 * mm,
        ],
    )

    info_table.setStyle(
        TableStyle(
            [
                (
                    "BACKGROUND",
                    (0, 0),
                    (-1, -1),
                    slate_50,
                ),
                (
                    "BOX",
                    (0, 0),
                    (-1, -1),
                    0.6,
                    slate_200,
                ),
                (
                    "INNERGRID",
                    (0, 0),
                    (-1, -1),
                    0.4,
                    slate_200,
                ),
                (
                    "VALIGN",
                    (0, 0),
                    (-1, -1),
                    "MIDDLE",
                ),
                (
                    "TOPPADDING",
                    (0, 0),
                    (-1, -1),
                    7,
                ),
                (
                    "BOTTOMPADDING",
                    (0, 0),
                    (-1, -1),
                    7,
                ),
                (
                    "LEFTPADDING",
                    (0, 0),
                    (-1, -1),
                    8,
                ),
                (
                    "RIGHTPADDING",
                    (0, 0),
                    (-1, -1),
                    8,
                ),
            ]
        )
    )

    # Celda de estado
    info_table.setStyle(
        TableStyle(
            [
                (
                    "BACKGROUND",
                    (2, 0),
                    (2, 0),
                    estado_bg,
                ),
            ]
        )
    )

    story.append(info_table)
    story.append(Spacer(1, 13))

    # --------------------------------------------------------
    # DATOS DEL CLIENTE
    # --------------------------------------------------------

    story.append(
        Paragraph(
            "DATOS DEL CLIENTE",
            section_style,
        )
    )

    cliente_nombre = safe_text(invoice.cliente_nombre)
    cliente_documento = safe_text(invoice.cliente_documento)
    cliente_direccion = safe_text(
        invoice.cliente_direccion or "No registrada"
    )

    cliente_table = Table(
        [
            [
                [
                    Paragraph("NOMBRE / RAZÓN SOCIAL", label_style),
                    Paragraph(cliente_nombre, value_bold_style),
                ],
                [
                    Paragraph("DOCUMENTO", label_style),
                    Paragraph(cliente_documento, value_style),
                ],
                [
                    Paragraph("DIRECCIÓN", label_style),
                    Paragraph(cliente_direccion, value_style),
                ],
            ]
        ],
        colWidths=[
            70 * mm,
            40 * mm,
            65 * mm,
        ],
    )

    cliente_table.setStyle(
        TableStyle(
            [
                (
                    "BACKGROUND",
                    (0, 0),
                    (-1, -1),
                    white,
                ),
                (
                    "BOX",
                    (0, 0),
                    (-1, -1),
                    0.6,
                    slate_200,
                ),
                (
                    "INNERGRID",
                    (0, 0),
                    (-1, -1),
                    0.4,
                    slate_200,
                ),
                (
                    "VALIGN",
                    (0, 0),
                    (-1, -1),
                    "MIDDLE",
                ),
                (
                    "TOPPADDING",
                    (0, 0),
                    (-1, -1),
                    8,
                ),
                (
                    "BOTTOMPADDING",
                    (0, 0),
                    (-1, -1),
                    8,
                ),
                (
                    "LEFTPADDING",
                    (0, 0),
                    (-1, -1),
                    8,
                ),
                (
                    "RIGHTPADDING",
                    (0, 0),
                    (-1, -1),
                    8,
                ),
            ]
        )
    )

    story.append(cliente_table)
    story.append(Spacer(1, 13))

    # --------------------------------------------------------
    # SERVICIO
    # --------------------------------------------------------

    if invoice.servicio:
        servicio_tipo = safe_text(
            invoice.servicio.tipo_servicio
        )

        servicio_descripcion = safe_text(
            invoice.servicio.descripcion
        )

        servicio_data = [
            [
                Paragraph(
                    "SERVICIO REALIZADO",
                    label_style,
                ),
                Paragraph(
                    servicio_tipo,
                    value_bold_style,
                ),
            ],
            [
                Paragraph(
                    "DESCRIPCIÓN",
                    label_style,
                ),
                Paragraph(
                    servicio_descripcion,
                    value_style,
                ),
            ],
        ]

        servicio_table = Table(
            servicio_data,
            colWidths=[
                45 * mm,
                130 * mm,
            ],
        )

        servicio_table.setStyle(
            TableStyle(
                [
                    (
                        "BACKGROUND",
                        (0, 0),
                        (0, -1),
                        slate_50,
                    ),
                    (
                        "GRID",
                        (0, 0),
                        (-1, -1),
                        0.5,
                        slate_200,
                    ),
                    (
                        "VALIGN",
                        (0, 0),
                        (-1, -1),
                        "MIDDLE",
                    ),
                    (
                        "TOPPADDING",
                        (0, 0),
                        (-1, -1),
                        7,
                    ),
                    (
                        "BOTTOMPADDING",
                        (0, 0),
                        (-1, -1),
                        7,
                    ),
                    (
                        "LEFTPADDING",
                        (0, 0),
                        (-1, -1),
                        8,
                    ),
                    (
                        "RIGHTPADDING",
                        (0, 0),
                        (-1, -1),
                        8,
                    ),
                ]
            )
        )

        story.append(
            Paragraph(
                "INFORMACIÓN DEL SERVICIO",
                section_style,
            )
        )

        story.append(servicio_table)
        story.append(Spacer(1, 13))

    # --------------------------------------------------------
    # DETALLE DE PRODUCTOS / SERVICIO
    # --------------------------------------------------------

    story.append(
        Paragraph(
            "DETALLE DEL COMPROBANTE",
            section_style,
        )
    )

    table_data = [
        [
            Paragraph("CONCEPTO", table_header_style),
            Paragraph(
                "CANT.",
                ParagraphStyle(
                    "QtyHeader",
                    parent=table_header_style,
                    alignment=TA_RIGHT,
                ),
            ),
            Paragraph(
                "P. UNITARIO",
                ParagraphStyle(
                    "PriceHeader",
                    parent=table_header_style,
                    alignment=TA_RIGHT,
                ),
            ),
            Paragraph(
                "IMPORTE",
                ParagraphStyle(
                    "AmountHeader",
                    parent=table_header_style,
                    alignment=TA_RIGHT,
                ),
            ),
        ]
    ]

    for item in invoice.detalles or []:
        table_data.append(
            [
                Paragraph(
                    safe_text(item.concepto),
                    table_cell_style,
                ),
                Paragraph(
                    f"{Decimal(str(item.cantidad)):.2f}",
                    table_cell_right_style,
                ),
                Paragraph(
                    money_text(item.precio_unitario),
                    table_cell_right_style,
                ),
                Paragraph(
                    money_text(item.subtotal),
                    table_cell_right_style,
                ),
            ]
        )

    # Si no existen detalles, mantener estructura válida
    if len(table_data) == 1:
        table_data.append(
            [
                Paragraph(
                    "Sin detalles registrados",
                    table_cell_style,
                ),
                Paragraph(
                    "-",
                    table_cell_right_style,
                ),
                Paragraph(
                    "-",
                    table_cell_right_style,
                ),
                Paragraph(
                    money_text(invoice.total),
                    table_cell_right_style,
                ),
            ]
        )

    detail_table = Table(
        table_data,
        colWidths=[
            82 * mm,
            23 * mm,
            35 * mm,
            35 * mm,
        ],
        repeatRows=1,
    )

    detail_table.setStyle(
        TableStyle(
            [
                (
                    "BACKGROUND",
                    (0, 0),
                    (-1, 0),
                    primary_light,
                ),
                (
                    "TEXTCOLOR",
                    (0, 0),
                    (-1, 0),
                    primary_dark,
                ),
                (
                    "GRID",
                    (0, 0),
                    (-1, -1),
                    0.45,
                    slate_200,
                ),
                (
                    "ROWBACKGROUNDS",
                    (0, 1),
                    (-1, -1),
                    [
                        white,
                        slate_50,
                    ],
                ),
                (
                    "VALIGN",
                    (0, 0),
                    (-1, -1),
                    "MIDDLE",
                ),
                (
                    "TOPPADDING",
                    (0, 0),
                    (-1, -1),
                    8,
                ),
                (
                    "BOTTOMPADDING",
                    (0, 0),
                    (-1, -1),
                    8,
                ),
                (
                    "LEFTPADDING",
                    (0, 0),
                    (-1, -1),
                    7,
                ),
                (
                    "RIGHTPADDING",
                    (0, 0),
                    (-1, -1),
                    7,
                ),
            ]
        )
    )

    story.append(detail_table)
    story.append(Spacer(1, 12))

    # --------------------------------------------------------
    # RESUMEN DE TOTALES
    # --------------------------------------------------------

    subtotal = money(invoice.subtotal)
    total = money(invoice.total)

    totals_data = [
        [
            "",
            Paragraph(
                "SUBTOTAL",
                total_label_style,
            ),
            Paragraph(
                money_text(subtotal),
                ParagraphStyle(
                    "SubtotalValue",
                    parent=table_cell_right_style,
                    fontName="Helvetica-Bold",
                    fontSize=9,
                    textColor=slate_700,
                ),
            ),
        ],
        [
            "",
            Paragraph(
                "TOTAL A PAGAR",
                ParagraphStyle(
                    "FinalLabel",
                    parent=total_label_style,
                    fontSize=10,
                    textColor=slate_900,
                ),
            ),
            Paragraph(
                money_text(total),
                total_value_style,
            ),
        ],
    ]

    totals_table = Table(
        totals_data,
        colWidths=[
            80 * mm,
            60 * mm,
            35 * mm,
        ],
    )

    totals_table.setStyle(
        TableStyle(
            [
                (
                    "LINEABOVE",
                    (1, 0),
                    (-1, 0),
                    0.8,
                    slate_300,
                ),
                (
                    "BACKGROUND",
                    (1, 1),
                    (-1, 1),
                    primary_light,
                ),
                (
                    "BOX",
                    (1, 1),
                    (-1, 1),
                    0.8,
                    colors.HexColor("#C7D2FE"),
                ),
                (
                    "VALIGN",
                    (0, 0),
                    (-1, -1),
                    "MIDDLE",
                ),
                (
                    "TOPPADDING",
                    (0, 0),
                    (-1, -1),
                    8,
                ),
                (
                    "BOTTOMPADDING",
                    (0, 0),
                    (-1, -1),
                    8,
                ),
                (
                    "LEFTPADDING",
                    (0, 0),
                    (-1, -1),
                    8,
                ),
                (
                    "RIGHTPADDING",
                    (0, 0),
                    (-1, -1),
                    8,
                ),
            ]
        )
    )

    story.append(totals_table)

    # --------------------------------------------------------
    # OBSERVACIONES
    # --------------------------------------------------------

    if invoice.observaciones:
        story.append(Spacer(1, 13))

        story.append(
            Paragraph(
                "OBSERVACIONES",
                section_style,
            )
        )

        observations_table = Table(
            [
                [
                    Paragraph(
                        safe_text(invoice.observaciones),
                        value_style,
                    )
                ]
            ],
            colWidths=[175 * mm],
        )

        observations_table.setStyle(
            TableStyle(
                [
                    (
                        "BACKGROUND",
                        (0, 0),
                        (-1, -1),
                        slate_50,
                    ),
                    (
                        "BOX",
                        (0, 0),
                        (-1, -1),
                        0.5,
                        slate_200,
                    ),
                    (
                        "LEFTPADDING",
                        (0, 0),
                        (-1, -1),
                        9,
                    ),
                    (
                        "RIGHTPADDING",
                        (0, 0),
                        (-1, -1),
                        9,
                    ),
                    (
                        "TOPPADDING",
                        (0, 0),
                        (-1, -1),
                        8,
                    ),
                    (
                        "BOTTOMPADDING",
                        (0, 0),
                        (-1, -1),
                        8,
                    ),
                ]
            )
        )

        story.append(observations_table)

    # --------------------------------------------------------
    # PIE
    # --------------------------------------------------------

    story.append(Spacer(1, 18))

    footer_table = Table(
        [
            [
                Paragraph(
                    "SIGES",
                    ParagraphStyle(
                        "FooterBrand",
                        parent=footer_style,
                        fontName="Helvetica-Bold",
                        textColor=primary,
                        fontSize=8,
                    ),
                ),
                Paragraph(
                    "Documento generado por el Sistema de Gestión Empresarial",
                    footer_style,
                ),
                Paragraph(
                    numero_completo,
                    ParagraphStyle(
                        "FooterNumber",
                        parent=footer_style,
                        fontName="Helvetica-Bold",
                        alignment=TA_RIGHT,
                    ),
                ),
            ]
        ],
        colWidths=[
            25 * mm,
            125 * mm,
            25 * mm,
        ],
    )

    footer_table.setStyle(
        TableStyle(
            [
                (
                    "LINEABOVE",
                    (0, 0),
                    (-1, 0),
                    0.6,
                    slate_200,
                ),
                (
                    "VALIGN",
                    (0, 0),
                    (-1, -1),
                    "MIDDLE",
                ),
                (
                    "TOPPADDING",
                    (0, 0),
                    (-1, -1),
                    7,
                ),
                (
                    "BOTTOMPADDING",
                    (0, 0),
                    (-1, -1),
                    4,
                ),
            ]
        )
    )

    story.append(footer_table)

    story.append(
        Spacer(1, 4)
    )

    story.append(
        Paragraph(
            "Este documento corresponde a un comprobante interno/comercial generado por SIGES. "
            "No constituye por sí mismo un comprobante electrónico validado por SUNAT.",
            footer_style,
        )
    )

    # --------------------------------------------------------
    # GENERAR PDF
    # --------------------------------------------------------

    document.build(story)

    buffer.seek(0)

    filename = (
        f"{invoice.tipo_comprobante.value.lower()}_"
        f"{invoice.serie}_{invoice.numero}.pdf"
    )

    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": (
                f'attachment; filename="{filename}"'
            )
        },
    )