from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.session import get_db
from app.models.user import User
from app.models.company import Company
from app.schemas.user import UserCreate, UserUpdate, UserResponse
from app.api.deps import get_current_user, require_admin
from app.core.security import get_password_hash
from app.services.audit_service import log_audit

router = APIRouter()

@router.get("/", response_model=List[UserResponse])
def get_users(
    empresa_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    query = db.query(User)
    
    # Si es SUPERADMIN, puede filtrar por cualquier empresa o listar todos
    if current_user.rol.nombre == "SUPERADMIN":
        if empresa_id:
            query = query.filter(User.empresa_id == empresa_id)
    else:
        # Si es ADMIN de empresa, filtrar estrictamente por su propia empresa
        query = query.filter(User.empresa_id == current_user.empresa_id)
        
    return query.order_by(User.created_at.desc()).all()

@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    user_in: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    target_empresa_id = current_user.empresa_id
    if current_user.rol.nombre == "SUPERADMIN":
        target_empresa_id = user_in.empresa_id or current_user.empresa_id

    if not target_empresa_id and current_user.rol.nombre != "SUPERADMIN":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Debe especificar la empresa para el usuario"
        )
        
    # Verificar límite de usuarios de la empresa
    if target_empresa_id:
        company = db.query(Company).filter(Company.id == target_empresa_id).first()
        if company:
            current_count = db.query(User).filter(User.empresa_id == target_empresa_id).count()
            if current_count >= company.limite_usuarios:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Ha alcanzado el límite máximo de usuarios ({company.limite_usuarios}) permitido para su suscripción."
                )

    existing = db.query(User).filter(User.email == user_in.email).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El correo ya se encuentra registrado")
        
    user = User(
        empresa_id=target_empresa_id,
        nombre=user_in.nombre,
        email=user_in.email,
        password_hash=get_password_hash(user_in.password),
        rol_id=user_in.rol_id,
        permisos=user_in.permisos,
        activo=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    log_audit(
        db,
        usuario_id=current_user.id,
        empresa_id=target_empresa_id,
        accion="CREAR_USUARIO",
        entidad="User",
        entidad_id=user.id,
        descripcion=f"Usuario creado: {user.email}"
    )
    return user

@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    user_in: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    query = db.query(User).filter(User.id == user_id)
    if current_user.rol.nombre != "SUPERADMIN":
        query = query.filter(User.empresa_id == current_user.empresa_id)
        
    user = query.first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")

    update_data = user_in.model_dump(exclude_unset=True)
    if "password" in update_data and update_data["password"]:
        update_data["password_hash"] = get_password_hash(update_data.pop("password"))
    elif "password" in update_data:
        update_data.pop("password")

    for field, value in update_data.items():
        setattr(user, field, value)

    db.commit()
    db.refresh(user)

    log_audit(
        db,
        usuario_id=current_user.id,
        empresa_id=user.empresa_id,
        accion="ACTUALIZAR_USUARIO",
        entidad="User",
        entidad_id=user.id,
        descripcion=f"Usuario actualizado: {user.email}"
    )
    return user