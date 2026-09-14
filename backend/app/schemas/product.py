from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class ProductBase(BaseModel):
    nombre: str
    categoria: str
    codigo: str
    stock: int
    stock_minimo: int = 2
    precio_compra: float
    precio_venta: float

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    nombre: Optional[str] = None
    categoria: Optional[str] = None
    codigo: Optional[str] = None
    stock: Optional[int] = None
    stock_minimo: Optional[int] = None
    precio_compra: Optional[float] = None
    precio_venta: Optional[float] = None
    activo: Optional[bool] = None

class ProductResponse(ProductBase):
    id: int
    activo: bool
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)