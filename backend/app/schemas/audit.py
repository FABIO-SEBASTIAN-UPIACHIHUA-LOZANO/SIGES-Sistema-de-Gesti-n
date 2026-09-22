from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class AuditResponse(BaseModel):
    id: int
    usuario_id: Optional[int] = None
    accion: str
    entidad: str
    entidad_id: Optional[int] = None
    descripcion: str
    fecha: datetime
    model_config = ConfigDict(from_attributes=True)