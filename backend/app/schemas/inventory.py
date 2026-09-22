from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime
from app.models.inventory import MovementType

class InventoryMovementCreate(BaseModel):
    producto_id: int
    tipo: MovementType
    cantidad: int
    observacion: Optional[str] = None

class InventoryMovementResponse(BaseModel):
    id: int
    producto_id: int
    tipo: MovementType
    cantidad: int
    servicio_id: Optional[int] = None
    usuario_id: int
    fecha: datetime
    observacion: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)