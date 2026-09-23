from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.security import verify_password, create_access_token
from app.models.user import User
from app.schemas.auth import Token, LoginRequest
from app.services.audit_service import log_audit
from app.api.deps import get_current_user
from app.schemas.user import UserResponse

router = APIRouter()

@router.post("/login", response_model=Token)
def login(login_req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_req.email).first()
    if not user or not verify_password(login_req.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales de acceso incorrectas"
        )
    if not user.activo:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Usuario inactivo")
    
    # Si pertenece a una empresa, verificar estado activo de la empresa
    if user.empresa_id and user.empresa and not user.empresa.activo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="La empresa se encuentra suspendida o inactiva"
        )
        
    access_token = create_access_token(subject=user.id, role=user.rol.nombre, empresa_id=user.empresa_id)
    log_audit(
        db,
        usuario_id=user.id,
        empresa_id=user.empresa_id,
        accion="LOGIN",
        entidad="User",
        entidad_id=user.id,
        descripcion=f"Inicio de sesión exitoso ({user.email})"
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user.id,
        "nombre": user.nombre,
        "email": user.email,
        "rol": user.rol.nombre,
        "empresa_id": user.empresa_id,
        "empresa_nombre": user.empresa.nombre if user.empresa else "SaaS Global",
        "permisos": user.permisos
    }

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user