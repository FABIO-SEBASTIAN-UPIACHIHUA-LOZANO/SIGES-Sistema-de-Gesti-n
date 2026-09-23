from sqlalchemy.orm import Session
from app.models.audit import Audit
from typing import Optional

def log_audit(
    db: Session,
    usuario_id: Optional[int],
    accion: str,
    entidad: str,
    entidad_id: Optional[int],
    descripcion: str,
    empresa_id: Optional[int] = None
):
    audit_entry = Audit(
        empresa_id=empresa_id,
        usuario_id=usuario_id,
        accion=accion,
        entidad=entidad,
        entidad_id=entidad_id,
        descripcion=descripcion
    )
    db.add(audit_entry)
    db.commit()