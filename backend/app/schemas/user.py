from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional, Dict, Any
from datetime import datetime

class RoleSchema(BaseModel):
    id: int
    nombre: str
    model_config = ConfigDict(from_attributes=True)

class UserBase(BaseModel):
    nombre: str
    email: EmailStr
    rol_id: int
    permisos: Optional[Dict[str, Any]] = None

class UserCreate(UserBase):
    password: str
    empresa_id: Optional[int] = None

class UserUpdate(BaseModel):
    nombre: Optional[str] = None
    email: Optional[EmailStr] = None
    rol_id: Optional[int] = None
    password: Optional[str] = None
    activo: Optional[bool] = None
    permisos: Optional[Dict[str, Any]] = None

class UserResponse(UserBase):
    id: int
    empresa_id: Optional[int] = None
    activo: bool
    rol: RoleSchema
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)