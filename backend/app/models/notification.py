from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import String, DateTime, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.session import Base

class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    cliente_id: Mapped[int] = mapped_column(ForeignKey("clients.id"), nullable=False, index=True)
    servicio_id: Mapped[int] = mapped_column(ForeignKey("services.id"), nullable=False, index=True)
    tipo: Mapped[str] = mapped_column(String(50), default="INTERNA", nullable=False)
    mensaje: Mapped[str] = mapped_column(String(500), nullable=False)
    estado: Mapped[str] = mapped_column(String(20), default="ENVIADO", nullable=False)
    fecha: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    cliente: Mapped["Client"] = relationship("Client", back_populates="notificaciones")
    servicio: Mapped["Service"] = relationship("Service", back_populates="notificaciones")