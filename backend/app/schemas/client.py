from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional
from datetime import datetime

class ClientBase(BaseModel):
    nombres: str
    apellidos: str
    documento: str
    telefono: str
    email: Optional[EmailStr] = None
    direccion: Optional[str] = None

class ClientCreate(ClientBase):
    pass

class ClientUpdate(BaseModel):
    nombres: Optional[str] = None
    apellidos: Optional[str] = None
    documento: Optional[str] = None
    telefono: Optional[str] = None
    email: Optional[EmailStr] = None
    direccion: Optional[str] = None
    activo: Optional[bool] = None

class ClientResponse(ClientBase):
    id: int
    activo: bool
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)