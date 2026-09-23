from datetime import datetime, timezone
from typing import Optional, List
from sqlalchemy import String, Boolean, DateTime, Integer, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.session import Base

class Company(Base):
    __tablename__ = "companies"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    nombre: Mapped[str] = mapped_column(String(150), nullable=False, index=True)
    ruc_documento: Mapped[Optional[str]] = mapped_column(String(20), nullable=True, index=True)
    email_contacto: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    telefono: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    direccion: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    activo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False, index=True)
    limite_usuarios: Mapped[int] = mapped_column(Integer, default=10, nullable=False)
    modulos_permitidos: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    users: Mapped[List["User"]] = relationship("User", back_populates="empresa")
