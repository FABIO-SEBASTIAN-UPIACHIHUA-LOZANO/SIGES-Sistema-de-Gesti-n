from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.models.client import Client
from app.schemas.client import ClientCreate, ClientUpdate, ClientResponse
from app.core.rbac import RoleChecker
from app.models.user import User
from app.services.audit_service import log_audit

router = APIRouter()

@router.get("/", response_model=List[ClientResponse])
def get_clients(
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["ADMIN", "TECNICO", "VENDEDOR"]))
):
    return db.query(Client).filter(Client.activo == True).all()

@router.post("/", response_model=ClientResponse, status_code=status.HTTP_201_CREATED)
def create_client(
    client_in: ClientCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["ADMIN", "VENDEDOR"]))
):
    existing = db.query(Client).filter(Client.documento == client_in.documento).first()
    if existing:
        raise HTTPException(status_code=400, detail="Ya existe un cliente con este documento")
    
    client = Client(**client_in.model_dump())
    db.add(client)
    db.commit()
    db.refresh(client)
    
    log_audit(db, usuario_id=current_user.id, accion="CREAR", entidad="Client", entidad_id=client.id, descripcion=f"Cliente registrado: {client.nombres} {client.apellidos}")
    return client

@router.put("/{client_id}", response_model=ClientResponse)
def update_client(
    client_id: int,
    client_in: ClientUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["ADMIN", "VENDEDOR"]))
):
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
        
    for field, value in client_in.model_dump(exclude_unset=True).items():
        setattr(client, field, value)
        
    db.commit()
    db.refresh(client)
    log_audit(db, usuario_id=current_user.id, accion="ACTUALIZAR", entidad="Client", entidad_id=client.id, descripcion=f"Cliente actualizado ID #{client.id}")
    return client