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

class EquipmentResponse(EquipmentBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)