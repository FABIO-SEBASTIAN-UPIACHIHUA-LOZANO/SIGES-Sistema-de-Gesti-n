from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.models.equipment import Equipment
from app.models.client import Client
from app.schemas.equipment import EquipmentCreate, EquipmentResponse
from app.core.rbac import RoleChecker
from app.models.user import User
from app.services.audit_service import log_audit

router = APIRouter()

@router.get("/", response_model=List[EquipmentResponse])
def get_equipment(
    cliente_id: int = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["ADMIN", "TECNICO", "VENDEDOR"]))
):
    query = db.query(Equipment)
    if cliente_id:
        query = query.filter(Equipment.cliente_id == cliente_id)
    return query.all()

@router.post("/", response_model=EquipmentResponse)
def create_equipment(
    eq_in: EquipmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["ADMIN", "TECNICO", "VENDEDOR"]))
):
    client = db.query(Client).filter(Client.id == eq_in.cliente_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="El cliente indicado no existe")
        
    equipment = Equipment(**eq_in.model_dump())
    db.add(equipment)
    db.commit()
    db.refresh(equipment)
    
    log_audit(db, usuario_id=current_user.id, accion="CREAR", entidad="Equipment", entidad_id=equipment.id, descripcion=f"Equipo registrado: {equipment.tipo} {equipment.marca}")
    return equipment