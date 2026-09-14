from pydantic import BaseModel, ConfigDict
from datetime import datetime
from app.models.payment import PaymentMethod

class PaymentCreate(BaseModel):
    servicio_id: int
    monto: float
    metodo_pago: PaymentMethod

class PaymentResponse(PaymentCreate):
    id: int
    fecha: datetime
    usuario_id: int
    model_config = ConfigDict(from_attributes=True)