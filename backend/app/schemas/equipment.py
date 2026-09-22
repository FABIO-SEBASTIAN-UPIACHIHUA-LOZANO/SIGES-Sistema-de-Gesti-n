from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class EquipmentBase(BaseModel):
    cliente_id: int
    tipo: str
    marca: str
    modelo: str
    numero_serie: Optional[str] = None
    descripcion: Optional[str] = None

class EquipmentCreate(EquipmentBase):
    pass

# IMPLEMENTACIÓN: esquema parcial para permitir editar un equipo sin
# duplicar las reglas del formulario de creación.
class EquipmentUpdate(BaseModel):
    cliente_id: Optional[int] = None
    tipo: Optional[str] = None
    marca: Optional[str] = None
    modelo: Optional[str] = None
    numero_serie: Optional[str] = None
    descripcion: Optional[str] = None

class EquipmentResponse(EquipmentBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
