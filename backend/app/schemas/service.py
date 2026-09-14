from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime
from app.models.service import ServiceStatus
from app.schemas.service_item import ServiceItemResponse    


class ServiceBase(BaseModel):
    cliente_id: int
    equipo_id: int
    tipo_servicio: str
    descripcion: str
    fecha_estimada: Optional[datetime] = None

class ServiceCreate(ServiceBase):
    usuario_responsable_id: Optional[int] = None

class ServiceUpdateStatus(BaseModel):
    estado: ServiceStatus
    diagnostico: Optional[str] = None
    monto: Optional[float] = None

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
    created_at: datetime
    items: List[ServiceItemResponse] = []
    model_config = ConfigDict(from_attributes=True)