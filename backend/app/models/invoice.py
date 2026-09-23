from datetime import datetime, timezone
from decimal import Decimal
from typing import Optional, List
from sqlalchemy import (
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    Enum as SQLEnum,
    Index,
)
import enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.session import Base

class InvoiceType(str, enum.Enum):
    BOLETA = "BOLETA"
    FACTURA = "FACTURA"
    NOTA_VENTA = "NOTA_VENTA"

class InvoiceStatus(str, enum.Enum):
    EMITIDO = "EMITIDO"
    ANULADO = "ANULADO"

class Invoice(Base):
    __tablename__ = "invoices"
    __table_args__ = (
        Index("ix_invoices_empresa_tipo_serie_numero", "empresa_id", "tipo_comprobante", "serie", "numero", unique=True),
        Index("ix_invoices_empresa_id_id", "empresa_id", "id"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    empresa_id: Mapped[int] = mapped_column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, default=1, index=True)
    servicio_id: Mapped[int] = mapped_column(ForeignKey("services.id"), nullable=False, unique=True, index=True)
    cliente_id: Mapped[int] = mapped_column(ForeignKey("clients.id"), nullable=False, index=True)
    usuario_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    tipo_comprobante: Mapped[InvoiceType] = mapped_column(SQLEnum(InvoiceType), nullable=False, index=True)
    serie: Mapped[str] = mapped_column(String(10), nullable=False)
    numero: Mapped[int] = mapped_column(Integer, nullable=False)
    fecha_emision: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False, index=True)
    cliente_nombre: Mapped[str] = mapped_column(String(200), nullable=False)
    cliente_documento: Mapped[str] = mapped_column(String(20), nullable=False)
    cliente_direccion: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    subtotal: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    total: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    estado: Mapped[InvoiceStatus] = mapped_column(SQLEnum(InvoiceStatus), nullable=False, default=InvoiceStatus.EMITIDO, index=True)
    observaciones: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    servicio: Mapped["Service"] = relationship("Service", back_populates="comprobante")
    cliente: Mapped["Client"] = relationship("Client")
    usuario: Mapped["User"] = relationship("User")
    detalles: Mapped[List["InvoiceItem"]] = relationship("InvoiceItem", back_populates="comprobante", cascade="all, delete-orphan")

class InvoiceItem(Base):
    __tablename__ = "invoice_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    comprobante_id: Mapped[int] = mapped_column(ForeignKey("invoices.id", ondelete="CASCADE"), nullable=False, index=True)
    producto_id: Mapped[Optional[int]] = mapped_column(ForeignKey("products.id"), nullable=True, index=True)
    concepto: Mapped[str] = mapped_column(String(255), nullable=False)
    cantidad: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    precio_unitario: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    subtotal: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)

    comprobante: Mapped["Invoice"] = relationship("Invoice", back_populates="detalles")
    producto: Mapped[Optional["Product"]] = relationship("Product")