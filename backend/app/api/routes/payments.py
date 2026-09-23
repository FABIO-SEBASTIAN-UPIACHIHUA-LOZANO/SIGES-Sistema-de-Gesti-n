from decimal import Decimal, ROUND_HALF_UP
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.payment import Payment, PaymentStatus
from app.models.service import Service
from app.schemas.payment import (
    PaymentCreate,
    PaymentFinancialSummary,
    PaymentListResponse,
    PaymentResponse,
)
from app.models.user import User
from app.api.deps import get_current_user, check_permission
from app.services.audit_service import log_audit

router = APIRouter()

def money(value) -> Decimal:
    return Decimal(str(value or 0)).quantize(
        Decimal("0.01"),
        rounding=ROUND_HALF_UP,
    )

def calculate_service_totals(service: Service):
    mano_de_obra = money(service.monto)

    total_productos = money(
        sum(
            money(item.subtotal)
            for item in (service.items or [])
        )
    )

    total_servicio = money(
        mano_de_obra + total_productos
    )

    total_pagado = money(
        sum(
            money(payment.monto)
            for payment in (service.pagos or [])
            if payment.estado == PaymentStatus.PAGADO
        )
    )

    saldo_pendiente = money(
        total_servicio - total_pagado
    )

    if saldo_pendiente <= Decimal("0.00"):
        saldo_pendiente = Decimal("0.00")
        estado_financiero = "PAGADO"
    elif total_pagado > Decimal("0.00"):
        estado_financiero = "PARCIAL"
    else:
        estado_financiero = "PENDIENTE"

    return (
        mano_de_obra,
        total_productos,
        total_servicio,
        total_pagado,
        saldo_pendiente,
        estado_financiero,
    )

@router.get("/", response_model=List[PaymentResponse])
def list_payments(
    db: Session = Depends(get_db),
    current_user: User = Depends(check_permission("pagos", "ver")),
):
    query = db.query(Payment)
    if current_user.rol.nombre != "SUPERADMIN":
        query = query.filter(Payment.empresa_id == current_user.empresa_id)
    return query.order_by(Payment.fecha.desc()).all()

@router.get("/service/{servicio_id}", response_model=PaymentListResponse)
def get_service_payments(
    servicio_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_permission("pagos", "ver")),
):
    query = db.query(Service).filter(Service.id == servicio_id)
    if current_user.rol.nombre != "SUPERADMIN":
        query = query.filter(Service.empresa_id == current_user.empresa_id)
        
    service = query.first()

    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Servicio no encontrado",
        )

    (
        mano_de_obra,
        total_productos,
        total_servicio,
        total_pagado,
        saldo_pendiente,
        estado_financiero,
    ) = calculate_service_totals(service)

    resumen = PaymentFinancialSummary(
        servicio_id=service.id,
        mano_de_obra=float(mano_de_obra),
        total_productos=float(total_productos),
        total_servicio=float(total_servicio),
        total_pagado=float(total_pagado),
        saldo_pendiente=float(saldo_pendiente),
        estado_financiero=estado_financiero,
    )

    return PaymentListResponse(
        pagos=service.pagos,
        resumen=resumen,
    )

@router.post("/", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED)
def register_payment(
    payment_in: PaymentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_permission("pagos", "crear")),
):
    query = db.query(Service).filter(Service.id == payment_in.servicio_id)
    if current_user.rol.nombre != "SUPERADMIN":
        query = query.filter(Service.empresa_id == current_user.empresa_id)
        
    service = query.first()

    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Servicio no encontrado",
        )

    if service.estado.value in ["CANCELADO"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se pueden registrar pagos de un servicio cancelado",
        )

    (
        mano_de_obra,
        total_productos,
        total_servicio,
        total_pagado,
        saldo_pendiente,
        estado_financiero,
    ) = calculate_service_totals(service)

    monto_pago = money(payment_in.monto)

    if monto_pago <= Decimal("0.00"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El monto del pago debe ser mayor que cero",
        )

    if monto_pago > saldo_pendiente:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"El pago excede el saldo pendiente. "
                f"Saldo disponible: S/ {saldo_pendiente:.2f}"
            ),
        )

    payment = Payment(
        empresa_id=service.empresa_id,
        servicio_id=service.id,
        monto=monto_pago,
        metodo_pago=payment_in.metodo_pago,
        estado=PaymentStatus.PAGADO,
        usuario_id=current_user.id,
    )

    db.add(payment)
    db.commit()
    db.refresh(payment)

    log_audit(
        db,
        usuario_id=current_user.id,
        empresa_id=service.empresa_id,
        accion="REGISTRAR_PAGO",
        entidad="Payment",
        entidad_id=payment.id,
        descripcion=f"Pago registrado por S/ {monto_pago:.2f} vía {payment.metodo_pago.value} para servicio #{service.id}",
    )

    return payment

@router.patch("/{payment_id}/anular", response_model=PaymentResponse)
def cancel_payment(
    payment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_permission("pagos", "editar")),
):
    query = db.query(Payment).filter(Payment.id == payment_id)
    if current_user.rol.nombre != "SUPERADMIN":
        query = query.filter(Payment.empresa_id == current_user.empresa_id)
        
    payment = query.first()

    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pago no encontrado",
        )

    if payment.estado == PaymentStatus.ANULADO:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El pago ya está anulado",
        )

    payment.estado = PaymentStatus.ANULADO

    db.commit()
    db.refresh(payment)

    log_audit(
        db,
        usuario_id=current_user.id,
        empresa_id=payment.empresa_id,
        accion="ANULAR_PAGO",
        entidad="Payment",
        entidad_id=payment.id,
        descripcion=f"Pago #{payment.id} anulado por S/ {payment.monto:.2f} del servicio #{payment.servicio_id}",
    )

    return payment