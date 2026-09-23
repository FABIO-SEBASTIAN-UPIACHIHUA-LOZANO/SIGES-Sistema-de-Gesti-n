from datetime import datetime, timezone
from typing import Optional, List
import enum
from sqlalchemy import (
    String,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    Enum as SQLEnum,
    Index,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.session import Base

class ServiceStatus(str, enum.Enum):
    RECIBIDO = "RECIBIDO"
    DIAGNOSTICO = "DIAGNOSTICO"
    EN_PROCESO = "EN_PROCESO"
    ESPERA = "ESPERA"
    TERMINADO = "TERMINADO"
    ENTREGADO = "ENTREGADO"
    CANCELADO = "CANCELADO"

class Service(Base):
    __tablename__ = "services"
    __table_args__ = (
        Index("ix_services_empresa_estado", "empresa_id", "estado"),
        Index("ix_services_empresa_id_id", "empresa_id", "id"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    empresa_id: Mapped[int] = mapped_column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, default=1, index=True)
    cliente_id: Mapped[int] = mapped_column(ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True)
    equipo_id: Mapped[Optional[int]] = mapped_column(ForeignKey("equipment.id", ondelete="SET NULL"), nullable=True, index=True)
    usuario_responsable_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    tipo_servicio: Mapped[str] = mapped_column(String(50), nullable=False)
    descripcion: Mapped[str] = mapped_column(String(500), nullable=False)
    diagnostico: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    estado: Mapped[ServiceStatus] = mapped_column(SQLEnum(ServiceStatus), default=ServiceStatus.RECIBIDO, nullable=False, index=True)
    monto: Mapped[float] = mapped_column(Numeric(10, 2), default=0.00, nullable=False)
    fecha_ingreso: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    fecha_estimada: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    fecha_finalizacion: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    imagen_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    cliente: Mapped["Client"] = relationship("Client", back_populates="servicios")
    equipo: Mapped[Optional["Equipment"]] = relationship("Equipment", back_populates="servicios")
    usuario_responsable: Mapped[Optional["User"]] = relationship("User", back_populates="servicios_asignados")
    movimientos_inventario: Mapped[List["InventoryMovement"]] = relationship("InventoryMovement", back_populates="servicio")
    items: Mapped[List["ServiceItem"]] = relationship("ServiceItem", back_populates="servicio", cascade="all, delete-orphan")
    pagos: Mapped[List["Payment"]] = relationship("Payment", back_populates="servicio")
    notificaciones: Mapped[List["Notification"]] = relationship("Notification", back_populates="servicio")
    comprobante: Mapped[Optional["Invoice"]] = relationship("Invoice", back_populates="servicio", uselist=False)