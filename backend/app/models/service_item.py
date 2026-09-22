from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class ServiceItem(Base):
    __tablename__ = "service_items"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    servicio_id: Mapped[int] = mapped_column(
        ForeignKey("services.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    producto_id: Mapped[int] = mapped_column(
        ForeignKey("products.id"),
        nullable=False,
        index=True,
    )

    cantidad: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    precio_unitario: Mapped[float] = mapped_column(
        Numeric(10, 2),
        nullable=False,
    )

    subtotal: Mapped[float] = mapped_column(
        Numeric(10, 2),
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    servicio: Mapped["Service"] = relationship(
        "Service",
        back_populates="items",
    )

    producto: Mapped["Product"] = relationship(
        "Product",
    )