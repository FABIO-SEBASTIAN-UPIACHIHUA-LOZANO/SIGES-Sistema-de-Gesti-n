from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.models.audit import Audit
from app.schemas.audit import AuditResponse
from app.models.user import User
from app.api.deps import require_admin

router = APIRouter()

@router.get("/", response_model=List[AuditResponse])
def get_audit_logs(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    query = db.query(Audit)
    if current_user.rol.nombre != "SUPERADMIN":
        query = query.filter(Audit.empresa_id == current_user.empresa_id)
    return query.order_by(Audit.id.desc()).limit(100).all()