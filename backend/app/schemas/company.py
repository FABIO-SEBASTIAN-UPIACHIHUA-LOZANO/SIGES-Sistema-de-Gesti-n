from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, EmailStr

class CompanyBase(BaseModel):
    nombre: str
    ruc_documento: Optional[str] = None
    email_contacto: Optional[EmailStr] = None
    telefono: Optional[str] = None
    direccion: Optional[str] = None
    limite_usuarios: int = 10
    modulos_permitidos: Optional[Dict[str, Any]] = None

class CompanyCreate(CompanyBase):
    pass

class CompanyUpdate(BaseModel):
    nombre: Optional[str] = None
    ruc_documento: Optional[str] = None
    email_contacto: Optional[EmailStr] = None
    telefono: Optional[str] = None
    direccion: Optional[str] = None
    activo: Optional[bool] = None
    limite_usuarios: Optional[int] = None
    modulos_permitidos: Optional[Dict[str, Any]] = None

class CompanyResponse(CompanyBase):
    id: int
    activo: bool
    total_usuarios: Optional[int] = 0
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class CompanyWithAdminCreate(BaseModel):
    nombre: str
    ruc_documento: Optional[str] = None
    email_contacto: Optional[EmailStr] = None
    telefono: Optional[str] = None
    direccion: Optional[str] = None
    limite_usuarios: int = 10
    
    # Credenciales del Administrador de la Empresa
    admin_nombre: str
    admin_email: EmailStr
    admin_password: str
