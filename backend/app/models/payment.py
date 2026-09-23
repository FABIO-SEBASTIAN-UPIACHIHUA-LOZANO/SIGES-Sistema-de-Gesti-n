from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import String, DateTime, ForeignKey, Integer, Numeric, Enum as SQLEnum, Index
import enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.session import Base

class PaymentMethod(str, enum.Enum):
    EFECTIVO = "EFECTIVO"
    YAPE = "YAPE"
    PLIN = "PLIN"
    TRANSFERENCIA = "TRANSFERENCIA"
    TARJETA = "TARJETA"
    OTRO = "OTRO"

class PaymentStatus(str, enum.Enum):
    PAGADO = "PAGADO"
    ANULADO = "ANULADO"

class Payment(Base):
    __tablename__ = "payments"
    __table_args__ = (
        Index("ix_payments_empresa_id_id", "empresa_id", "id"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    empresa_id: Mapped[int] = mapped_column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, default=1, index=True)
    servicio_id: Mapped[int] = mapped_column(ForeignKey("services.id", ondelete="CASCADE"), nullable=False, index=True)
    monto: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    metodo_pago: Mapped[PaymentMethod] = mapped_column(SQLEnum(PaymentMethod), nullable=False)
    estado: Mapped[PaymentStatus] = mapped_column(SQLEnum(PaymentStatus), nullable=False, default=PaymentStatus.PAGADO, index=True)
    fecha: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    usuario_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)

    servicio: Mapped["Service"] = relationship("Service", back_populates="pagos")
    usuario: Mapped["User"] = relationship("User", back_populates="pagos_registrados")