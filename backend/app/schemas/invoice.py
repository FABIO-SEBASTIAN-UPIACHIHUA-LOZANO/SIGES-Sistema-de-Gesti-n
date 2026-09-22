from datetime import datetime
from decimal import Decimal
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models.invoice import InvoiceType, InvoiceStatus


class InvoiceItemCreate(BaseModel):
    producto_id: Optional[int] = None
    concepto: str = Field(min_length=1, max_length=255)
    cantidad: Decimal = Field(gt=0)
    precio_unitario: Decimal = Field(ge=0)


class InvoiceItemResponse(BaseModel):
    id: int
    comprobante_id: int
    producto_id: Optional[int] = None
    concepto: str
    cantidad: Decimal
    precio_unitario: Decimal
    subtotal: Decimal

    model_config = ConfigDict(from_attributes=True)


class InvoiceCreate(BaseModel):
    servicio_id: int
    tipo_comprobante: InvoiceType
    serie: str = Field(min_length=1, max_length=10)
    observaciones: Optional[str] = None


class InvoiceResponse(BaseModel):
    id: int
    servicio_id: int
    cliente_id: int
    usuario_id: int
    tipo_comprobante: InvoiceType
    serie: str
    numero: int
    fecha_emision: datetime
    cliente_nombre: str
    cliente_documento: str
    cliente_direccion: Optional[str] = None
    subtotal: Decimal
    total: Decimal
    estado: InvoiceStatus
    observaciones: Optional[str] = None
    created_at: datetime
    detalles: List[InvoiceItemResponse] = []

    model_config = ConfigDict(from_attributes=True)


class InvoiceListResponse(BaseModel):
    id: int
    servicio_id: int
    cliente_id: int
    tipo_comprobante: InvoiceType
    serie: str
    numero: int
    fecha_emision: datetime
    cliente_nombre: str
    cliente_documento: str
    subtotal: Decimal
    total: Decimal
    estado: InvoiceStatus

    model_config = ConfigDict(from_attributes=True)
