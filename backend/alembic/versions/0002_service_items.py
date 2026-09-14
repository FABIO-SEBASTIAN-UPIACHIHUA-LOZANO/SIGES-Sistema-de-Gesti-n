"""Create service_items table

Revision ID: 0002
Revises: 0001
Create Date: 2026-09-14
"""

from alembic import op
import sqlalchemy as sa


revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "service_items",

        sa.Column(
            "id",
            sa.Integer(),
            primary_key=True,
        ),

        sa.Column(
            "servicio_id",
            sa.Integer(),
            sa.ForeignKey(
                "services.id",
                ondelete="CASCADE",
            ),
            nullable=False,
        ),

        sa.Column(
            "producto_id",
            sa.Integer(),
            sa.ForeignKey("products.id"),
            nullable=False,
        ),

        sa.Column(
            "cantidad",
            sa.Integer(),
            nullable=False,
        ),

        sa.Column(
            "precio_unitario",
            sa.Numeric(10, 2),
            nullable=False,
        ),

        sa.Column(
            "subtotal",
            sa.Numeric(10, 2),
            nullable=False,
        ),

        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )

    op.create_index(
        "ix_service_items_id",
        "service_items",
        ["id"],
    )

    op.create_index(
        "ix_service_items_servicio_id",
        "service_items",
        ["servicio_id"],
    )

    op.create_index(
        "ix_service_items_producto_id",
        "service_items",
        ["producto_id"],
    )


def downgrade():
    op.drop_index(
        "ix_service_items_producto_id",
        table_name="service_items",
    )

    op.drop_index(
        "ix_service_items_servicio_id",
        table_name="service_items",
    )

    op.drop_index(
        "ix_service_items_id",
        table_name="service_items",
    )

    op.drop_table("service_items")