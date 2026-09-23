from typing import Callable
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from app.core.config import settings
from app.db.session import get_db
from app.models.user import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")

def get_current_user(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudo validar las credenciales",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        raise credentials_exception
    if not user.activo:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Usuario inactivo")
    
    # Validar que si el usuario pertenece a una empresa, la empresa esté activa
    if user.empresa_id and user.empresa and not user.empresa.activo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="La empresa a la que pertenece se encuentra inactiva o suspendida"
        )
        
    return user

def require_superadmin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.rol.nombre != "SUPERADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operación permitida únicamente para el SUPERADMIN global"
        )
    return current_user

def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.rol.nombre not in ["SUPERADMIN", "ADMIN"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operación permitida únicamente para el Administrador"
        )
    return current_user

def check_permission(modulo: str, accion: str) -> Callable:
    def dependency(current_user: User = Depends(get_current_user)) -> User:
        # SUPERADMIN y ADMIN tienen permisos completos por defecto
        if current_user.rol.nombre in ["SUPERADMIN", "ADMIN"]:
            return current_user
        
        # Si el usuario tiene diccionario de permisos configurado
        if current_user.permisos and isinstance(current_user.permisos, dict):
            mod_perms = current_user.permisos.get(modulo)
            if isinstance(mod_perms, dict) and mod_perms.get(accion) is True:
                return current_user
        
        # Si no tiene permiso explícito granuradizado, bloqueamos acceso
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"No tienes permiso de '{accion}' en el módulo '{modulo}'"
        )
    return dependency