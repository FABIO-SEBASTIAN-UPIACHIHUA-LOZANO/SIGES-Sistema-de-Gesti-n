from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict

from app.models.service import ServiceStatus
from app.schemas.service_item import ServiceItemResponse


class ServiceBase(BaseModel):
    cliente_id: int
    equipo_id: Optional[int] = None
    tipo_servicio: str
    descripcion: str
    fecha_estimada: Optional[datetime] = None
    imagen_url: Optional[str] = None


class ServiceCreate(ServiceBase):
    usuario_responsable_id: Optional[int] = None
    monto: Optional[float] = 0.00


class ServiceUpdateStatus(BaseModel):
    estado: ServiceStatus
    diagnostico: Optional[str] = None
    monto: Optional[float] = None
    imagen_url: Optional[str] = None


class AddProductToService(BaseModel):
    producto_id: int
    cantidad: int


class ServiceResponse(ServiceBase):
    id: int
    usuario_responsable_id: Optional[int] = None
    diagnostico: Optional[str] = None
    estado: ServiceStatus
    monto: float
    fecha_ingreso: datetime
    fecha_estimada: Optional[datetime] = None
    fecha_finalizacion: Optional[datetime] = None
    imagen_url: Optional[str] = None
    created_at: datetime
    items: List[ServiceItemResponse] = []

    model_config = ConfigDict(from_attributes=True)