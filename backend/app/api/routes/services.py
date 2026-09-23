from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
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
from app.models.user import User
from app.api.deps import get_current_user, check_permission
from app.services.audit_service import log_audit

router = APIRouter()

@router.get("/", response_model=List[ServiceResponse])
def get_services(
    cliente_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_permission("servicios", "ver")),
):
    query = db.query(Service).options(joinedload(Service.items))
    if current_user.rol.nombre != "SUPERADMIN":
        query = query.filter(Service.empresa_id == current_user.empresa_id)

    if cliente_id:
        query = query.filter(Service.cliente_id == cliente_id)

    return query.order_by(Service.id.desc()).all()

@router.get("/{service_id}", response_model=ServiceResponse)
def get_service(
    service_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_permission("servicios", "ver")),
):
    query = db.query(Service).options(joinedload(Service.items)).filter(Service.id == service_id)
    if current_user.rol.nombre != "SUPERADMIN":
        query = query.filter(Service.empresa_id == current_user.empresa_id)

    service = query.first()

    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Servicio no encontrado o no pertenece a su empresa",
        )

    return service

@router.post("/", response_model=ServiceResponse, status_code=status.HTTP_201_CREATED)
def create_service(
    service_in: ServiceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_permission("servicios", "crear")),
):
    empresa_id = current_user.empresa_id or 1
    
    client_q = db.query(Client).filter(Client.id == service_in.cliente_id)
    if current_user.rol.nombre != "SUPERADMIN":
        client_q = client_q.filter(Client.empresa_id == empresa_id)
    
    client = client_q.first()

    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El cliente indicado no pertenece a su empresa o no existe",
        )

    if service_in.equipo_id is not None:
        eq_q = db.query(Equipment).filter(
            Equipment.id == service_in.equipo_id,
            Equipment.cliente_id == service_in.cliente_id,
        )
        if current_user.rol.nombre != "SUPERADMIN":
            eq_q = eq_q.filter(Equipment.empresa_id == empresa_id)
            
        equipment = eq_q.first()

        if not equipment:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El equipo no existe o no pertenece al cliente seleccionado",
            )

        if equipment and service_in.imagen_url:
            equipment.imagen_url = service_in.imagen_url

    service = Service(
        empresa_id=empresa_id,
        cliente_id=service_in.cliente_id,
        equipo_id=service_in.equipo_id,
        tipo_servicio=service_in.tipo_servicio,
        descripcion=service_in.descripcion,
        fecha_estimada=service_in.fecha_estimada,
        usuario_responsable_id=service_in.usuario_responsable_id,
        monto=service_in.monto or 0.00,
        imagen_url=service_in.imagen_url,
    )

    db.add(service)
    db.commit()
    db.refresh(service)

    log_audit(
        db,
        usuario_id=current_user.id,
        empresa_id=empresa_id,
        accion="CREAR_SERVICIO",
        entidad="Service",
        entidad_id=service.id,
        descripcion=f"Orden de servicio creada #{service.id} tipo={service.tipo_servicio}",
    )

    return service

@router.patch("/{service_id}/status", response_model=ServiceResponse)
def update_service_status(
    service_id: int,
    status_in: ServiceUpdateStatus,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_permission("servicios", "editar")),
):
    query = db.query(Service).filter(Service.id == service_id)
    if current_user.rol.nombre != "SUPERADMIN":
        query = query.filter(Service.empresa_id == current_user.empresa_id)

    service = query.first()

    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
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
        empresa_id=service.empresa_id,
        accion="CAMBIO_ESTADO_SERVICIO",
        entidad="Service",
        entidad_id=service.id,
        descripcion=f"Servicio #{service.id} cambió a estado {service.estado}",
    )

    return service

@router.post("/{service_id}/products")
def add_product_to_service(
    service_id: int,
    prod_in: AddProductToService,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_permission("servicios", "editar")),
):
    if prod_in.cantidad <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La cantidad debe ser mayor que cero",
        )

    query = db.query(Service).filter(Service.id == service_id)
    if current_user.rol.nombre != "SUPERADMIN":
        query = query.filter(Service.empresa_id == current_user.empresa_id)

    service = query.first()

    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Servicio no encontrado",
        )

    prod_q = db.query(Product).filter(
        Product.id == prod_in.producto_id,
        Product.activo == True,
    )
    if current_user.rol.nombre != "SUPERADMIN":
        prod_q = prod_q.filter(Product.empresa_id == current_user.empresa_id)

    product = prod_q.with_for_update().first()

    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Producto no encontrado en su inventario",
        )

    if product.stock < prod_in.cantidad:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Stock insuficiente. Stock actual: {product.stock}",
        )

    precio_unitario = float(product.precio_venta)
    subtotal = precio_unitario * prod_in.cantidad

    product.stock -= prod_in.cantidad

    movement = InventoryMovement(
        empresa_id=service.empresa_id,
        producto_id=product.id,
        tipo=MovementType.SALIDA,
        cantidad=prod_in.cantidad,
        servicio_id=service.id,
        usuario_id=current_user.id,
        observacion=f"Producto utilizado en servicio #{service.id}",
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
        empresa_id=service.empresa_id,
        accion="SALIDA_INVENTARIO",
        entidad="Service",
        entidad_id=service.id,
        descripcion=f"Producto #{product.id} ({product.nombre}) agregado al servicio #{service.id}. Cantidad: {prod_in.cantidad}",
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
