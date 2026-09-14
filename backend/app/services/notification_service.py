from sqlalchemy.orm import Session
from app.models.notification import Notification
from app.services.audit_service import log_audit

class NotificationService:
    @staticmethod
    def send_internal_notification(
        db: Session, cliente_id: int, servicio_id: int, mensaje: str, usuario_id: int
    ) -> Notification:
        # Capa desacoplada para futuras integraciones (WhatsApp, Mail, Evolution API)
        notif = Notification(
            cliente_id=cliente_id,
            servicio_id=servicio_id,
            tipo="INTERNA",
            mensaje=mensaje,
            estado="ENVIADO"
        )
        db.add(notif)
        log_audit(
            db, usuario_id=usuario_id, accion="NOTIFICACION",
            entidad="Notification", entidad_id=servicio_id,
            descripcion=f"Notificación enviada al cliente #{cliente_id} por servicio #{servicio_id}"
        )
        db.commit()
        db.refresh(notif)
        return notif