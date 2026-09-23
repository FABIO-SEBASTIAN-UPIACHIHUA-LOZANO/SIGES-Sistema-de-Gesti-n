from datetime import datetime, timezone
from typing import Optional, List
from sqlalchemy import String, Boolean, DateTime, ForeignKey, Integer, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.session import Base

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    empresa_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=True, index=True)
    nombre: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(150), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    rol_id: Mapped[int] = mapped_column(ForeignKey("roles.id"), nullable=False)
    activo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    permisos: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    empresa: Mapped[Optional["Company"]] = relationship("Company", back_populates="users")
    rol: Mapped["Role"] = relationship("Role", back_populates="users")
    servicios_asignados: Mapped[List["Service"]] = relationship("Service", back_populates="usuario_responsable")
    pagos_registrados: Mapped[List["Payment"]] = relationship("Payment", back_populates="usuario")
    auditorias: Mapped[List["Audit"]] = relationship("Audit", back_populates="usuario")