from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional
from datetime import datetime

class RoleSchema(BaseModel):
    id: int
    nombre: str
    model_config = ConfigDict(from_attributes=True)

class UserBase(BaseModel):
    nombre: str
    email: EmailStr
    rol_id: int

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    nombre: Optional[str] = None
    email: Optional[EmailStr] = None
    rol_id: Optional[int] = None
    password: Optional[str] = None
    activo: Optional[bool] = None

class UserResponse(UserBase):
    id: int
    activo: bool
    rol: RoleSchema
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)