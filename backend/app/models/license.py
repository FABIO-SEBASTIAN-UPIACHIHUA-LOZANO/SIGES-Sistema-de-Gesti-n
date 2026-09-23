from datetime import datetime, date, timezone
from typing import Optional
from sqlalchemy import String, ForeignKey, Integer, DateTime, Date, Boolean, Text, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.session import Base

class License(Base):
    __tablename__ = "licenses"
    __table_args__ = (
        Index("ix_licenses_empresa_categoria", "empresa_id", "categoria"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    empresa_id: Mapped[int] = mapped_column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    cliente_id: Mapped[Optional[int]] = mapped_column(ForeignKey("clients.id", ondelete="SET NULL"), nullable=True, index=True)
    equipo_id: Mapped[Optional[int]] = mapped_column(ForeignKey("equipment.id", ondelete="SET NULL"), nullable=True, index=True)
    
    categoria: Mapped[str] = mapped_column(String(50), nullable=False, default="ANTIVIRUS") # ANTIVIRUS, OFFICE, WINDOWS, OTROS
    nombre_producto: Mapped[str] = mapped_column(String(150), nullable=False)
    clave_licencia: Mapped[str] = mapped_column(String(255), nullable=False)
    cantidad_dispositivos: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    
    es_permanente: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    fecha_inicio: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    fecha_fin: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    
    proveedor: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    notas: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    cliente: Mapped[Optional["Client"]] = relationship("Client")
    equipo: Mapped[Optional["Equipment"]] = relationship("Equipment")
