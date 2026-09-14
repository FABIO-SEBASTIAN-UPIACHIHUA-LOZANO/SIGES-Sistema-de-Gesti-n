from pydantic import BaseModel

class DashboardStats(BaseModel):
    total_clientes: int
    servicios_pendientes: int
    servicios_en_proceso: int
    servicios_terminados: int
    productos_stock_bajo: int
    ingresos_hoy: float