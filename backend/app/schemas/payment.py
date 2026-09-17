from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.payment import PaymentMethod, PaymentStatus


class PaymentCreate(BaseModel):
    servicio_id: int
    monto: float = Field(gt=0)
    metodo_pago: PaymentMethod


class PaymentResponse(BaseModel):
    id: int
    servicio_id: int
    monto: float
    metodo_pago: PaymentMethod
    estado: PaymentStatus
    fecha: datetime
    usuario_id: int

    model_config = ConfigDict(from_attributes=True)


class PaymentFinancialSummary(BaseModel):
    servicio_id: int
    mano_de_obra: float
    total_productos: float
    total_servicio: float
    total_pagado: float
    saldo_pendiente: float
    estado_financiero: str


class PaymentListResponse(BaseModel):
    pagos: list[PaymentResponse]
    resumen: PaymentFinancialSummary