from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, model_validator

class LicenseBase(BaseModel):
    cliente_id: Optional[int] = None
    equipo_id: Optional[int] = None
    categoria: str = "ANTIVIRUS" # ANTIVIRUS, OFFICE, WINDOWS, OTROS
    nombre_producto: str
    clave_licencia: str
    cantidad_dispositivos: int = 1
    es_permanente: bool = False
    fecha_inicio: Optional[date] = None
    fecha_fin: Optional[date] = None
    proveedor: Optional[str] = None
    notas: Optional[str] = None

class LicenseCreate(LicenseBase):
    @model_validator(mode="after")
    def validate_antivirus_and_dates(self):
        cat = str(self.categoria).upper()
        if cat == "ANTIVIRUS":
            if self.es_permanente:
                raise ValueError("Las licencias de Antivirus no pueden ser permanentes. Deben tener fecha de vencimiento.")
            if not self.fecha_inicio or not self.fecha_fin:
                raise ValueError("Las licencias de Antivirus requieren obligatoriamente fecha de inicio y fecha de finalización.")
        
        if not self.es_permanente and self.fecha_inicio and self.fecha_fin:
            if self.fecha_fin < self.fecha_inicio:
                raise ValueError("La fecha de finalización no puede ser anterior a la fecha de inicio.")
        
        return self

class LicenseUpdate(BaseModel):
    cliente_id: Optional[int] = None
    equipo_id: Optional[int] = None
    categoria: Optional[str] = None
    nombre_producto: Optional[str] = None
    clave_licencia: Optional[str] = None
    cantidad_dispositivos: Optional[int] = None
    es_permanente: Optional[bool] = None
    fecha_inicio: Optional[date] = None
    fecha_fin: Optional[date] = None
    proveedor: Optional[str] = None
    notas: Optional[str] = None

class LicenseResponse(LicenseBase):
    id: int
    empresa_id: int
    cliente_nombre: Optional[str] = None
    equipo_info: Optional[str] = None
    dias_restantes: Optional[int] = None
    estado_vencimiento: str = "ACTIVA" # ACTIVA, POR_VENCER, VENCIDA, PERMANENTE
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
