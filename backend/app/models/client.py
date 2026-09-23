from datetime import datetime, timezone
from typing import Optional, List
from sqlalchemy import String, Boolean, DateTime, Integer, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.session import Base

class Client(Base):
    __tablename__ = "clients"
    __table_args__ = (
        Index("ix_clients_empresa_documento", "empresa_id", "documento", unique=True),
        Index("ix_clients_empresa_id_id", "empresa_id", "id"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    empresa_id: Mapped[int] = mapped_column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, default=1, index=True)
    nombres: Mapped[str] = mapped_column(String(100), nullable=False)
    apellidos: Mapped[str] = mapped_column(String(100), nullable=False)
    documento: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    telefono: Mapped[str] = mapped_column(String(20), nullable=False)
    email: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    direccion: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    activo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    equipos: Mapped[List["Equipment"]] = relationship("Equipment", back_populates="cliente")
    servicios: Mapped[List["Service"]] = relationship("Service", back_populates="cliente")
    notificaciones: Mapped[List["Notification"]] = relationship("Notification", back_populates="cliente")