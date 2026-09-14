from pydantic import BaseModel, ConfigDict
from datetime import datetime

class NotificationSendRequest(BaseModel):
    servicio_id: int
    mensaje: str

class NotificationResponse(BaseModel):
    id: int
    cliente_id: int
    servicio_id: int
    tipo: str
    mensaje: str
    estado: str
    fecha: datetime
    model_config = ConfigDict(from_attributes=True)