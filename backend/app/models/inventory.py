from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import String, DateTime, ForeignKey, Integer, Enum as SQLEnum
import enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.session import Base

class MovementType(str, enum.Enum):
    ENTRADA = "ENTRADA"
    SALIDA = "SALIDA"

class InventoryMovement(Base):
    __tablename__ = "inventory_movements"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    producto_id: Mapped[int] = mapped_column(ForeignKey("products.id"), nullable=False, index=True)
    tipo: Mapped[MovementType] = mapped_column(SQLEnum(MovementType), nullable=False)
    cantidad: Mapped[int] = mapped_column(Integer, nullable=False)
    servicio_id: Mapped[Optional[int]] = mapped_column(ForeignKey("services.id"), nullable=True, index=True)
    usuario_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    fecha: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    observacion: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    producto: Mapped["Product"] = relationship("Product", back_populates="movimientos")
    servicio: Mapped[Optional["Service"]] = relationship("Service", back_populates="movimientos_inventario")