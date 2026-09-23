from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.notification import NotificationSendRequest, NotificationResponse
from app.models.user import User
from app.models.service import Service
from app.api.deps import get_current_user
from app.services.notification_service import NotificationService

router = APIRouter()

@router.post("/send", response_model=NotificationResponse)
def send_notification(
    req: NotificationSendRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Service).filter(Service.id == req.servicio_id)
    if current_user.rol.nombre != "SUPERADMIN":
        query = query.filter(Service.empresa_id == current_user.empresa_id)
        
    service = query.first()
    if not service:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Servicio no encontrado")
        
    notif = NotificationService.send_internal_notification(
        db=db,
        cliente_id=service.cliente_id,
        servicio_id=service.id,
        mensaje=req.mensaje,
        usuario_id=current_user.id,
        empresa_id=service.empresa_id
    )
    return notif