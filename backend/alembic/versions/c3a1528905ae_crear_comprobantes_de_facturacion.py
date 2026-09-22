"""crear comprobantes de facturacion"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "0005"
down_revision = "0004"
branch_labels = None
depends_on = None


def upgrade():
    existing_tables = sa.inspect(op.get_bind()).get_table_names()
    if "invoices" in existing_tables and "invoice_items" in existing_tables:
        return

    # ============================================================
    # ENUM: tipo de comprobante
    # ============================================================

    op.execute(
        """
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1
                FROM pg_type
                WHERE typname = 'invoicetype'
            ) THEN
                CREATE TYPE invoicetype AS ENUM (
                    'BOLETA',
                    'FACTURA',
                    'NOTA_VENTA'
                );
            END IF;
        END
        $$;
        """
    )

    # ============================================================
    # ENUM: estado del comprobante
    # ============================================================

    op.execute(
        """
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1
                FROM pg_type
                WHERE typname = 'invoicestatus'
            ) THEN
                CREATE TYPE invoicestatus AS ENUM (
                    'EMITIDO',
                    'ANULADO'
                );
            END IF;
        END
        $$;
        """
    )

    # ============================================================
    # TABLA invoices
    # ============================================================

    invoice_type = postgresql.ENUM(
        "BOLETA",
        "FACTURA",
        "NOTA_VENTA",
        name="invoicetype",
        create_type=False,
    )

    invoice_status = postgresql.ENUM(
        "EMITIDO",
        "ANULADO",
        name="invoicestatus",
        create_type=False,
    )

    op.create_table(
        "invoices",

        sa.Column(
            "id",
            sa.Integer(),
            primary_key=True,
            nullable=False,
        ),

        sa.Column(
            "servicio_id",
            sa.Integer(),
            nullable=False,
        ),

        sa.Column(
            "cliente_id",
            sa.Integer(),
            nullable=False,
        ),

        sa.Column(
            "usuario_id",
            sa.Integer(),
            nullable=False,
        ),

        sa.Column(
            "tipo_comprobante",
            invoice_type,
            nullable=False,
        ),

        sa.Column(
            "serie",
            sa.String(length=10),
            nullable=False,
        ),

        sa.Column(
            "numero",
            sa.Integer(),
            nullable=False,
        ),

        sa.Column(
            "fecha_emision",
            sa.DateTime(timezone=True),
            nullable=False,
        ),

        sa.Column(
            "cliente_nombre",
            sa.String(length=200),
            nullable=False,
        ),

        sa.Column(
            "cliente_documento",
            sa.String(length=20),
            nullable=False,
        ),

        sa.Column(
            "cliente_direccion",
            sa.String(length=255),
            nullable=True,
        ),

        sa.Column(
            "subtotal",
            sa.Numeric(10, 2),
            nullable=False,
        ),

        sa.Column(
            "total",
            sa.Numeric(10, 2),
            nullable=False,
        ),

        sa.Column(
            "estado",
            invoice_status,
            nullable=False,
        ),

        sa.Column(
            "observaciones",
            sa.Text(),
            nullable=True,
        ),

        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
        ),

        sa.ForeignKeyConstraint(
            ["servicio_id"],
            ["services.id"],
        ),

        sa.ForeignKeyConstraint(
            ["cliente_id"],
            ["clients.id"],
        ),

        sa.ForeignKeyConstraint(
            ["usuario_id"],
            ["users.id"],
        ),

        sa.UniqueConstraint(
            "servicio_id",
            name="uq_invoices_servicio_id",
        ),
    )

    # ============================================================
    # ÍNDICES invoices
    # ============================================================

    op.create_index(
        "ix_invoices_id",
        "invoices",
        ["id"],
        unique=False,
    )

    op.create_index(
        "ix_invoices_servicio_id",
        "invoices",
        ["servicio_id"],
        unique=True,
    )

    op.create_index(
        "ix_invoices_cliente_id",
        "invoices",
        ["cliente_id"],
        unique=False,
    )

    op.create_index(
        "ix_invoices_usuario_id",
        "invoices",
        ["usuario_id"],
        unique=False,
    )

    op.create_index(
        "ix_invoices_tipo_comprobante",
        "invoices",
        ["tipo_comprobante"],
        unique=False,
    )

    op.create_index(
        "ix_invoices_fecha_emision",
        "invoices",
        ["fecha_emision"],
        unique=False,
    )

    op.create_index(
        "ix_invoices_estado",
        "invoices",
        ["estado"],
        unique=False,
    )

    # ============================================================
    # TABLA invoice_items
    # ============================================================

    op.create_table(
        "invoice_items",

        sa.Column(
            "id",
            sa.Integer(),
            primary_key=True,
            nullable=False,
        ),

        sa.Column(
            "comprobante_id",
            sa.Integer(),
            nullable=False,
        ),

        sa.Column(
            "producto_id",
            sa.Integer(),
            nullable=True,
        ),

        sa.Column(
            "concepto",
            sa.String(length=255),
            nullable=False,
        ),

        sa.Column(
            "cantidad",
            sa.Numeric(10, 2),
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

        sa.ForeignKeyConstraint(
            ["comprobante_id"],
            ["invoices.id"],
            ondelete="CASCADE",
        ),

        sa.ForeignKeyConstraint(
            ["producto_id"],
            ["products.id"],
        ),
    )

    # ============================================================
    # ÍNDICES invoice_items
    # ============================================================

    op.create_index(
        "ix_invoice_items_id",
        "invoice_items",
        ["id"],
        unique=False,
    )

    op.create_index(
        "ix_invoice_items_comprobante_id",
        "invoice_items",
        ["comprobante_id"],
        unique=False,
    )

    op.create_index(
        "ix_invoice_items_producto_id",
        "invoice_items",
        ["producto_id"],
        unique=False,
    )


def downgrade():
    # invoice_items
    op.drop_index(
        "ix_invoice_items_producto_id",
        table_name="invoice_items",
    )

    op.drop_index(
        "ix_invoice_items_comprobante_id",
        table_name="invoice_items",
    )

    op.drop_index(
        "ix_invoice_items_id",
        table_name="invoice_items",
    )

    op.drop_table("invoice_items")

    # invoices
    op.drop_index(
        "ix_invoices_estado",
        table_name="invoices",
    )

    op.drop_index(
        "ix_invoices_fecha_emision",
        table_name="invoices",
    )

    op.drop_index(
        "ix_invoices_tipo_comprobante",
        table_name="invoices",
    )

    op.drop_index(
        "ix_invoices_usuario_id",
        table_name="invoices",
    )

    op.drop_index(
        "ix_invoices_cliente_id",
        table_name="invoices",
    )

    op.drop_index(
        "ix_invoices_servicio_id",
        table_name="invoices",
    )

    op.drop_index(
        "ix_invoices_id",
        table_name="invoices",
    )

    op.drop_table("invoices")

    # ENUM
    op.execute("DROP TYPE IF EXISTS invoicestatus")
    op.execute("DROP TYPE IF EXISTS invoicetype")
