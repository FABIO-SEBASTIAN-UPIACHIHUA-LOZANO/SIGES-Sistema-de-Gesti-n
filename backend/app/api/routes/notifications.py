from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.notification import NotificationSendRequest, NotificationResponse
from app.core.rbac import RoleChecker
from app.models.user import User
from app.models.service import Service
from app.services.notification_service import NotificationService

router = APIRouter()

@router.post("/send", response_model=NotificationResponse)
def send_notification(
    req: NotificationSendRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["ADMIN", "VENDEDOR", "TECNICO"]))
):
    service = db.query(Service).filter(Service.id == req.servicio_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Servicio no encontrado")
        
    notif = NotificationService.send_internal_notification(
        db=db,
        cliente_id=service.cliente_id,
        servicio_id=service.id,
        mensaje=req.mensaje,
        usuario_id=current_user.id
    )
    return notif