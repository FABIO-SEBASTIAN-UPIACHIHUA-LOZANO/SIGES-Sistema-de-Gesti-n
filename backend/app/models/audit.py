from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import String, DateTime, ForeignKey, Integer, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.session import Base

class Audit(Base):
    __tablename__ = "audit_logs"
    __table_args__ = (
        Index("ix_audit_logs_empresa_id_id", "empresa_id", "id"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    empresa_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=True, index=True)
    usuario_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    accion: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    entidad: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    entidad_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    descripcion: Mapped[str] = mapped_column(String(500), nullable=False)
    fecha: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    usuario: Mapped[Optional["User"]] = relationship("User", back_populates="auditorias")