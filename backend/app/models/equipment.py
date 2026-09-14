from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import String, ForeignKey, Integer, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.session import Base

class Equipment(Base):
    __tablename__ = "equipment"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    empresa_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True, default=1, index=True)
    cliente_id: Mapped[int] = mapped_column(ForeignKey("clients.id"), nullable=False, index=True)
    tipo: Mapped[str] = mapped_column(String(50), nullable=False)  # Laptop, Celular, PC, etc.
    marca: Mapped[str] = mapped_column(String(50), nullable=False)
    modelo: Mapped[str] = mapped_column(String(50), nullable=False)
    numero_serie: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, index=True)
    descripcion: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    cliente: Mapped["Client"] = relationship("Client", back_populates="equipos")
    servicios: Mapped[list["Service"]] = relationship("Service", back_populates="equipo")