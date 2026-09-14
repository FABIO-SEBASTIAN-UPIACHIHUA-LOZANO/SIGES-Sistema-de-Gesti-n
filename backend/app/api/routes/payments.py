from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.models.payment import Payment
from app.models.service import Service
from app.schemas.payment import PaymentCreate, PaymentResponse
from app.core.rbac import RoleChecker
from app.models.user import User
from app.services.audit_service import log_audit

router = APIRouter()

@router.post("/", response_model=PaymentResponse)
def register_payment(
    payment_in: PaymentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["ADMIN", "VENDEDOR"]))
):
    service = db.query(Service).filter(Service.id == payment_in.servicio_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Servicio no encontrado")
        
    payment = Payment(
        servicio_id=payment_in.servicio_id,
        monto=payment_in.monto,
        metodo_pago=payment_in.metodo_pago,
        usuario_id=current_user.id
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)
    
    log_audit(db, usuario_id=current_user.id, accion="REGISTRAR_PAGO", entidad="Payment", entidad_id=payment.id, descripcion=f"Pago registrado S/ {payment.monto} vía {payment.metodo_pago} para servicio #{service.id}")
    return payment