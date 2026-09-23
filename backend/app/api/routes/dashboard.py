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
from app.models.user import User
from app.api.deps import get_current_user

router = APIRouter()

@router.get("/stats", response_model=DashboardStats)
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    empresa_id = current_user.empresa_id
    
    cl_q = db.query(func.count(Client.id)).filter(Client.activo == True)
    srv_rec = db.query(func.count(Service.id)).filter(Service.estado == ServiceStatus.RECIBIDO)
    srv_proc = db.query(func.count(Service.id)).filter(Service.estado == ServiceStatus.EN_PROCESO)
    srv_term = db.query(func.count(Service.id)).filter(Service.estado == ServiceStatus.TERMINADO)
    stk_q = db.query(func.count(Product.id)).filter(Product.activo == True, Product.stock <= Product.stock_minimo)
    
    today = datetime.now(timezone.utc).date()
    pay_q = db.query(func.sum(Payment.monto)).filter(func.date(Payment.fecha) == today)

    if current_user.rol.nombre != "SUPERADMIN" and empresa_id:
        cl_q = cl_q.filter(Client.empresa_id == empresa_id)
        srv_rec = srv_rec.filter(Service.empresa_id == empresa_id)
        srv_proc = srv_proc.filter(Service.empresa_id == empresa_id)
        srv_term = srv_term.filter(Service.empresa_id == empresa_id)
        stk_q = stk_q.filter(Product.empresa_id == empresa_id)
        pay_q = pay_q.filter(Payment.empresa_id == empresa_id)

    total_clients = cl_q.scalar() or 0
    recibidos = srv_rec.scalar() or 0
    en_proceso = srv_proc.scalar() or 0
    terminados = srv_term.scalar() or 0
    stock_bajo = stk_q.scalar() or 0
    ingresos_hoy = pay_q.scalar() or 0.0

    return {
        "total_clientes": total_clients,
        "servicios_pendientes": recibidos,
        "servicios_en_proceso": en_proceso,
        "servicios_terminados": terminados,
        "productos_stock_bajo": stock_bajo,
        "ingresos_hoy": float(ingresos_hoy)
    }