from datetime import datetime, timezone
from typing import Optional, List
from sqlalchemy import String, Boolean, DateTime, Integer, Numeric, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.session import Base

class Product(Base):
    __tablename__ = "products"
    __table_args__ = (
        Index("ix_products_empresa_codigo", "empresa_id", "codigo", unique=True),
        Index("ix_products_empresa_id_id", "empresa_id", "id"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    empresa_id: Mapped[int] = mapped_column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, default=1, index=True)
    nombre: Mapped[str] = mapped_column(String(150), nullable=False, index=True)
    categoria: Mapped[str] = mapped_column(String(50), nullable=False)
    codigo: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    stock: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    stock_minimo: Mapped[int] = mapped_column(Integer, default=2, nullable=False)
    precio_compra: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    precio_venta: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    activo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    movimientos: Mapped[List["InventoryMovement"]] = relationship("InventoryMovement", back_populates="producto")