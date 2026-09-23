from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.session import get_db
from app.models.equipment import Equipment
from app.models.client import Client
from app.schemas.equipment import EquipmentCreate, EquipmentResponse
from app.models.user import User
from app.api.deps import get_current_user, check_permission
from app.services.audit_service import log_audit

router = APIRouter()

@router.get("/", response_model=List[EquipmentResponse])
def get_equipment(
    cliente_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_permission("equipos", "ver"))
):
    query = db.query(Equipment)
    if current_user.rol.nombre != "SUPERADMIN":
        query = query.filter(Equipment.empresa_id == current_user.empresa_id)
        
    if cliente_id:
        query = query.filter(Equipment.cliente_id == cliente_id)
    return query.order_by(Equipment.created_at.desc()).all()

@router.post("/", response_model=EquipmentResponse, status_code=status.HTTP_201_CREATED)
def create_equipment(
    eq_in: EquipmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_permission("equipos", "crear"))
):
    empresa_id = current_user.empresa_id or 1
    client_query = db.query(Client).filter(Client.id == eq_in.cliente_id)
    if current_user.rol.nombre != "SUPERADMIN":
        client_query = client_query.filter(Client.empresa_id == empresa_id)
        
    client = client_query.first()
    if not client:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="El cliente indicado no pertenece a su empresa o no existe")
        
    equipment = Equipment(**eq_in.model_dump(), empresa_id=empresa_id)
    db.add(equipment)
    db.commit()
    db.refresh(equipment)
    
    log_audit(
        db,
        usuario_id=current_user.id,
        empresa_id=empresa_id,
        accion="CREAR_EQUIPO",
        entidad="Equipment",
        entidad_id=equipment.id,
        descripcion=f"Equipo registrado: {equipment.tipo} {equipment.marca} {equipment.modelo}"
    )
    return equipment