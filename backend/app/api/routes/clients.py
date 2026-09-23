from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.models.client import Client
from app.schemas.client import ClientCreate, ClientUpdate, ClientResponse
from app.models.user import User
from app.api.deps import get_current_user, check_permission
from app.services.audit_service import log_audit

router = APIRouter()

@router.get("/", response_model=List[ClientResponse])
def get_clients(
    db: Session = Depends(get_db),
    current_user: User = Depends(check_permission("clientes", "ver"))
):
    query = db.query(Client).filter(Client.activo == True)
    if current_user.rol.nombre != "SUPERADMIN":
        query = query.filter(Client.empresa_id == current_user.empresa_id)
    return query.order_by(Client.created_at.desc()).all()

@router.post("/", response_model=ClientResponse, status_code=status.HTTP_201_CREATED)
def create_client(
    client_in: ClientCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_permission("clientes", "crear"))
):
    empresa_id = current_user.empresa_id or 1
    existing = db.query(Client).filter(
        Client.empresa_id == empresa_id,
        Client.documento == client_in.documento
    ).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Ya existe un cliente con este documento en la empresa")
    
    client = Client(**client_in.model_dump(), empresa_id=empresa_id)
    db.add(client)
    db.commit()
    db.refresh(client)
    
    log_audit(
        db,
        usuario_id=current_user.id,
        empresa_id=empresa_id,
        accion="CREAR_CLIENTE",
        entidad="Client",
        entidad_id=client.id,
        descripcion=f"Cliente registrado: {client.nombres} {client.apellidos}"
    )
    return client

@router.put("/{client_id}", response_model=ClientResponse)
def update_client(
    client_id: int,
    client_in: ClientUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_permission("clientes", "editar"))
):
    query = db.query(Client).filter(Client.id == client_id)
    if current_user.rol.nombre != "SUPERADMIN":
        query = query.filter(Client.empresa_id == current_user.empresa_id)
        
    client = query.first()
    if not client:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cliente no encontrado")
        
    for field, value in client_in.model_dump(exclude_unset=True).items():
        setattr(client, field, value)
        
    db.commit()
    db.refresh(client)
    log_audit(
        db,
        usuario_id=current_user.id,
        empresa_id=client.empresa_id,
        accion="ACTUALIZAR_CLIENTE",
        entidad="Client",
        entidad_id=client.id,
        descripcion=f"Cliente actualizado ID #{client.id}"
    )
    return client