from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserResponse
from app.core.rbac import RoleChecker
from app.core.security import get_password_hash
from app.services.audit_service import log_audit

router = APIRouter()

@router.get("/", response_model=List[UserResponse])
def get_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["ADMIN"]))
):
    return db.query(User).all()

@router.post("/", response_model=UserResponse)
def create_user(
    user_in: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["ADMIN"]))
):
    existing = db.query(User).filter(User.email == user_in.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="El correo ya se encuentra registrado")
        
    user = User(
        nombre=user_in.nombre,
        email=user_in.email,
        password_hash=get_password_hash(user_in.password),
        rol_id=user_in.rol_id
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    log_audit(db, usuario_id=current_user.id, accion="CREAR", entidad="User", entidad_id=user.id, descripcion=f"Usuario creado: {user.email}")
    return user