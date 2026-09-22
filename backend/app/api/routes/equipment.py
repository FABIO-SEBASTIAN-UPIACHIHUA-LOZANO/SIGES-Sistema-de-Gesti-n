from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.models.equipment import Equipment
from app.models.client import Client
from app.schemas.equipment import EquipmentCreate, EquipmentUpdate, EquipmentResponse
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

@router.put("/{equipment_id}", response_model=EquipmentResponse)
def update_equipment(
    equipment_id: int,
    eq_in: EquipmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["ADMIN", "TECNICO", "VENDEDOR"]))
):
    equipment = db.query(Equipment).filter(Equipment.id == equipment_id).first()
    if not equipment:
        raise HTTPException(status_code=404, detail="Equipo no encontrado")

    changes = eq_in.model_dump(exclude_unset=True)
    if "cliente_id" in changes:
        client = db.query(Client).filter(Client.id == changes["cliente_id"], Client.activo == True).first()
        if not client:
            raise HTTPException(status_code=404, detail="El cliente indicado no existe")

    # IMPLEMENTACIÓN: la actualización usa el mismo modelo y auditoría del
    # módulo, preservando la arquitectura actual de rutas/servicios.
    for field, value in changes.items():
        setattr(equipment, field, value)

    db.commit()
    db.refresh(equipment)
    log_audit(db, usuario_id=current_user.id, accion="ACTUALIZAR", entidad="Equipment", entidad_id=equipment.id, descripcion=f"Equipo actualizado ID #{equipment.id}")
    return equipment

@router.delete("/{equipment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_equipment(
    equipment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["ADMIN", "TECNICO", "VENDEDOR"]))
):
    equipment = db.query(Equipment).filter(Equipment.id == equipment_id).first()
    if not equipment:
        raise HTTPException(status_code=404, detail="Equipo no encontrado")

    description = f"Equipo eliminado: {equipment.tipo} {equipment.marca} {equipment.modelo}"
    try:
        db.delete(equipment)
        db.flush()
        log_audit(db, usuario_id=current_user.id, accion="ELIMINAR", entidad="Equipment", entidad_id=equipment_id, descripcion=description)
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="No se puede eliminar el equipo porque tiene servicios asociados")
    return None
