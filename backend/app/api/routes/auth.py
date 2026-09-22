from datetime import datetime, timedelta, timezone
import hashlib
import hmac
import secrets

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.security import verify_password, create_access_token, get_password_hash
from app.models.user import User
from app.models.password_reset import PasswordResetCode
from app.schemas.auth import (
    EmailUpdateRequest,
    LoginRequest,
    PasswordResetConfirm,
    PasswordResetRequest,
    PasswordUpdateRequest,
    Token,
)
from app.services.audit_service import log_audit
from app.services.email_service import send_password_reset_code
from app.api.deps import get_current_user
from app.schemas.user import UserResponse
from app.core.config import settings

router = APIRouter()


def hash_reset_code(user_id: int, code: str) -> str:
    value = f"{settings.SECRET_KEY}:{user_id}:{code}".encode("utf-8")
    return hashlib.sha256(value).hexdigest()

@router.post("/login", response_model=Token)
def login(login_req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_req.email).first()
    if not user or not verify_password(login_req.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales de acceso incorrectas"
        )
    if not user.activo:
        raise HTTPException(status_code=400, detail="Usuario inactivo")
        
    access_token = create_access_token(subject=user.id, role=user.rol.nombre)
    log_audit(db, usuario_id=user.id, accion="LOGIN", entidad="User", entidad_id=user.id, descripcion="Inicio de sesión exitoso")
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user.id,
        "nombre": user.nombre,
        "email": user.email,
        "rol": user.rol.nombre
    }

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.post("/password-reset/request")
def request_password_reset(payload: PasswordResetRequest, db: Session = Depends(get_db)):
    if not settings.SMTP_HOST or not settings.SMTP_FROM_EMAIL:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="El servicio de recuperación por correo aún no está configurado.",
        )

    generic_response = {
        "message": "Si el correo está registrado, recibirás un código de recuperación."
    }
    normalized_email = payload.email.strip().lower()
    user = db.query(User).filter(func.lower(User.email) == normalized_email, User.activo.is_(True)).first()

    if not user:
        return generic_response

    now = datetime.now(timezone.utc)
    recent_code = (
        db.query(PasswordResetCode)
        .filter(
            PasswordResetCode.user_id == user.id,
            PasswordResetCode.created_at > now - timedelta(seconds=60),
        )
        .first()
    )
    if recent_code:
        return generic_response

    code = f"{secrets.randbelow(1_000_000):06d}"
    reset_code = PasswordResetCode(
        user_id=user.id,
        code_hash=hash_reset_code(user.id, code),
        expires_at=now + timedelta(minutes=settings.PASSWORD_RESET_CODE_MINUTES),
    )
    db.add(reset_code)
    db.commit()
    db.refresh(reset_code)

    try:
        send_password_reset_code(user.email, code)
    except Exception:
        db.delete(reset_code)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="No fue posible enviar el correo. Verifica la configuración SMTP.",
        )

    return generic_response

@router.post("/password-reset/confirm")
def confirm_password_reset(payload: PasswordResetConfirm, db: Session = Depends(get_db)):
    if payload.new_password != payload.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Las nuevas contraseñas no coinciden",
        )

    normalized_email = payload.email.strip().lower()
    user = db.query(User).filter(func.lower(User.email) == normalized_email, User.activo.is_(True)).first()
    invalid_code_error = HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="El código es inválido o ha vencido",
    )
    if not user:
        raise invalid_code_error

    now = datetime.now(timezone.utc)
    reset_code = (
        db.query(PasswordResetCode)
        .filter(
            PasswordResetCode.user_id == user.id,
            PasswordResetCode.used_at.is_(None),
            PasswordResetCode.expires_at > now,
        )
        .order_by(PasswordResetCode.created_at.desc())
        .first()
    )
    if not reset_code or reset_code.attempts >= 5:
        raise invalid_code_error

    supplied_hash = hash_reset_code(user.id, payload.code)
    if not hmac.compare_digest(reset_code.code_hash, supplied_hash):
        reset_code.attempts += 1
        db.commit()
        raise invalid_code_error

    if verify_password(payload.new_password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La nueva contraseña debe ser diferente de la anterior",
        )

    user.password_hash = get_password_hash(payload.new_password)
    db.query(PasswordResetCode).filter(
        PasswordResetCode.user_id == user.id,
        PasswordResetCode.used_at.is_(None),
    ).update({PasswordResetCode.used_at: now}, synchronize_session=False)
    db.add(user)
    db.flush()

    log_audit(
        db,
        usuario_id=user.id,
        accion="ACTUALIZAR",
        entidad="User",
        entidad_id=user.id,
        descripcion="Contraseña restablecida mediante código de correo",
    )
    return {"message": "Contraseña restablecida correctamente"}

@router.patch("/me/email", response_model=UserResponse)
def update_my_email(
    payload: EmailUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not verify_password(payload.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La contraseña actual es incorrecta",
        )

    normalized_email = payload.email.strip().lower()
    existing_user = (
        db.query(User)
        .filter(
            func.lower(User.email) == normalized_email,
            User.id != current_user.id,
        )
        .first()
    )
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="El correo electrónico ya se encuentra registrado",
        )

    previous_email = current_user.email
    current_user.email = normalized_email
    db.add(current_user)
    db.flush()

    log_audit(
        db,
        usuario_id=current_user.id,
        accion="ACTUALIZAR",
        entidad="User",
        entidad_id=current_user.id,
        descripcion=f"Correo de cuenta actualizado: {previous_email} -> {normalized_email}",
    )
    db.refresh(current_user)
    return current_user

@router.patch("/me/password")
def update_my_password(
    payload: PasswordUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not verify_password(payload.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La contraseña actual es incorrecta",
        )

    if payload.new_password != payload.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La confirmación de la nueva contraseña no coincide",
        )

    if verify_password(payload.new_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La nueva contraseña debe ser diferente de la actual",
        )

    current_user.password_hash = get_password_hash(payload.new_password)
    db.add(current_user)
    db.flush()

    log_audit(
        db,
        usuario_id=current_user.id,
        accion="ACTUALIZAR",
        entidad="User",
        entidad_id=current_user.id,
        descripcion="Contraseña de cuenta actualizada",
    )
    return {"message": "Contraseña actualizada correctamente"}
