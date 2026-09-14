from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.models.audit import Audit
from app.schemas.audit import AuditResponse
from app.core.rbac import RoleChecker
from app.models.user import User

router = APIRouter()

@router.get("/", response_model=List[AuditResponse])
def get_audit_logs(
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["ADMIN"]))
):
    return db.query(Audit).order_by(Audit.id.desc()).limit(100).all()