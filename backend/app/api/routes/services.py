
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List
from datetime import datetime, timezone

from app.models.client import Client
from app.models.equipment import Equipment

from app.db.session import get_db
from app.models.service import Service, ServiceStatus
from app.models.service_item import ServiceItem
from app.models.product import Product
from app.models.inventory import InventoryMovement, MovementType
from app.schemas.service import (
    ServiceCreate,
    ServiceUpdateStatus,
    AddProductToService,
    ServiceResponse,
)
from app.core.rbac import RoleChecker
from app.models.user import User
from app.services.audit_service import log_audit


router = APIRouter()


@router.get("/", response_model=List[ServiceResponse])
def get_services(
    cliente_id: int = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        RoleChecker(["ADMIN", "TECNICO", "VENDEDOR"])
    ),
):
    query = (
        db.query(Service)
        .options(
            joinedload(Service.items)
        )
    )

    if cliente_id:
        query = query.filter(Service.cliente_id == cliente_id)

    return query.order_by(Service.id.desc()).all()


@router.get("/{service_id}", response_model=ServiceResponse)
def get_service(
    service_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        RoleChecker(["ADMIN", "TECNICO"])
    ),
):
    service = (
        db.query(Service)
        .options(
            joinedload(Service.items)
        )
        .filter(Service.id == service_id)
        .first()
    )

    if not service:
        raise HTTPException(
            status_code=404,
            detail="Servicio no encontrado",
        )

    return service


@router.post("/", response_model=ServiceResponse)
def create_service(
    service_in: ServiceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        RoleChecker(["ADMIN", "TECNICO"])
    ),
):
    client = (
        db.query(Client)
        .filter(Client.id == service_in.cliente_id)
        .first()
    )

    if not client:
        raise HTTPException(
            status_code=404,
            detail="Cliente no encontrado",
        )

    if service_in.equipo_id is not None:
        equipment = (
            db.query(Equipment)
            .filter(
                Equipment.id == service_in.equipo_id,
                Equipment.cliente_id == service_in.cliente_id,
            )
            .first()
        )

        if not equipment:
            raise HTTPException(
                status_code=400,
                detail="El equipo no existe o no pertenece al cliente seleccionado",
            )

    service = Service(
        cliente_id=service_in.cliente_id,
        equipo_id=service_in.equipo_id,
        tipo_servicio=service_in.tipo_servicio,
        descripcion=service_in.descripcion,
        fecha_estimada=service_in.fecha_estimada,
        usuario_responsable_id=service_in.usuario_responsable_id,
        monto=service_in.monto or 0.00,
    )

    db.add(service)
    db.commit()
    db.refresh(service)

    log_audit(
        db,
        usuario_id=current_user.id,
        accion="CREAR",
        entidad="Service",
        entidad_id=service.id,
        descripcion=(
            f"Orden de servicio creada #{service.id} "
            f"tipo={service.tipo_servicio}"
        ),
    )

    return service

@router.patch("/{service_id}/status", response_model=ServiceResponse)
def update_service_status(
    service_id: int,
    status_in: ServiceUpdateStatus,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        RoleChecker(["ADMIN", "TECNICO"])
    ),
):
    service = (
        db.query(Service)
        .filter(Service.id == service_id)
        .first()
    )

    if not service:
        raise HTTPException(
            status_code=404,
            detail="Servicio no encontrado",
        )

    service.estado = status_in.estado

    if status_in.diagnostico is not None:
        service.diagnostico = status_in.diagnostico

    if status_in.monto is not None:
        service.monto = status_in.monto

    if status_in.estado in [
        ServiceStatus.TERMINADO,
        ServiceStatus.ENTREGADO,
    ]:
        service.fecha_finalizacion = datetime.now(timezone.utc)

    db.commit()
    db.refresh(service)

    log_audit(
        db,
        usuario_id=current_user.id,
        accion="CAMBIO_ESTADO",
        entidad="Service",
        entidad_id=service.id,
        descripcion=(
            f"Servicio #{service.id} cambió a estado "
            f"{service.estado}"
        ),
    )

    return service


@router.post("/{service_id}/products")
def add_product_to_service(
    service_id: int,
    prod_in: AddProductToService,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        RoleChecker(["ADMIN", "TECNICO"])
    ),
):
    if prod_in.cantidad <= 0:
        raise HTTPException(
            status_code=400,
            detail="La cantidad debe ser mayor que cero",
        )

    service = (
        db.query(Service)
        .filter(Service.id == service_id)
        .first()
    )

    if not service:
        raise HTTPException(
            status_code=404,
            detail="Servicio no encontrado",
        )

    product = (
        db.query(Product)
        .filter(
            Product.id == prod_in.producto_id,
            Product.activo == True,
        )
        .with_for_update()
        .first()
    )

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Producto no encontrado o inactivo",
        )

    if product.stock < prod_in.cantidad:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Stock insuficiente. Stock actual: "
                f"{product.stock}"
            ),
        )

    precio_unitario = float(product.precio_venta)
    subtotal = precio_unitario * prod_in.cantidad

    product.stock -= prod_in.cantidad

    movement = InventoryMovement(
        producto_id=product.id,
        tipo=MovementType.SALIDA,
        cantidad=prod_in.cantidad,
        servicio_id=service.id,
        usuario_id=current_user.id,
        observacion=(
            f"Producto utilizado en servicio #{service.id}"
        ),
    )

    service_item = ServiceItem(
        servicio_id=service.id,
        producto_id=product.id,
        cantidad=prod_in.cantidad,
        precio_unitario=precio_unitario,
        subtotal=subtotal,
    )

    db.add(movement)
    db.add(service_item)

    log_audit(
        db,
        usuario_id=current_user.id,
        accion="SALIDA_INVENTARIO",
        entidad="Service",
        entidad_id=service.id,
        descripcion=(
            f"Producto #{product.id} agregado al servicio "
            f"#{service.id}. Cantidad: {prod_in.cantidad}"
        ),
    )

    db.commit()

    db.refresh(service_item)

    return {
        "message": "Producto agregado y stock descontado con éxito",
        "service_item": {
            "id": service_item.id,
            "servicio_id": service_item.servicio_id,
            "producto_id": service_item.producto_id,
            "cantidad": service_item.cantidad,
            "precio_unitario": service_item.precio_unitario,
            "subtotal": service_item.subtotal,
            "created_at": service_item.created_at,
        },
        "stock_actual": product.stock,
    }

