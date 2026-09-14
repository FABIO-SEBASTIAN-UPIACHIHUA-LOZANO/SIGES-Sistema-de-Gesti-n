from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timezone
from app.db.session import get_db
from app.models.client import Client
from app.models.service import Service, ServiceStatus
from app.models.product import Product
from app.models.payment import Payment
from app.schemas.dashboard import DashboardStats
from app.core.rbac import RoleChecker
from app.models.user import User

router = APIRouter()

@router.get("/stats", response_model=DashboardStats)
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["ADMIN", "TECNICO", "VENDEDOR"]))
):
    total_clients = db.query(func.count(Client.id)).filter(Client.activo == True).scalar() or 0
    recibidos = db.query(func.count(Service.id)).filter(Service.estado == ServiceStatus.RECIBIDO).scalar() or 0
    en_proceso = db.query(func.count(Service.id)).filter(Service.estado == ServiceStatus.EN_PROCESO).scalar() or 0
    terminados = db.query(func.count(Service.id)).filter(Service.estado == ServiceStatus.TERMINADO).scalar() or 0
    
    stock_bajo = db.query(func.count(Product.id)).filter(
        Product.activo == True, Product.stock <= Product.stock_minimo
    ).scalar() or 0
    
    today = datetime.now(timezone.utc).date()
    ingresos_hoy = db.query(func.sum(Payment.monto)).filter(
        func.date(Payment.fecha) == today
    ).scalar() or 0.0
    
    return {
        "total_clientes": total_clients,
        "servicios_pendientes": recibidos,
        "servicios_en_proceso": en_proceso,
        "servicios_terminados": terminados,
        "productos_stock_bajo": stock_bajo,
        "ingresos_hoy": float(ingresos_hoy)
    }