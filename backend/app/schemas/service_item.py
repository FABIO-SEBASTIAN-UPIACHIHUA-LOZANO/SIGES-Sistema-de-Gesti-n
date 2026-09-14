from datetime import datetime
from pydantic import BaseModel, ConfigDict


class ServiceItemCreate(BaseModel):
    producto_id: int
    cantidad: int


class ServiceItemResponse(BaseModel):
    id: int
    servicio_id: int
    producto_id: int
    cantidad: int
    precio_unitario: float
    subtotal: float
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)