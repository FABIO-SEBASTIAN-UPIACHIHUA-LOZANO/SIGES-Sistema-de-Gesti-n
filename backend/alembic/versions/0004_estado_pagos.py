"""agregar estado a pagos"""

from alembic import op
import sqlalchemy as sa


revision = "0004"
down_revision = "0003_equipo_opcional"
branch_labels = None
depends_on = None


def upgrade():
    payment_status_enum = sa.Enum(
        "PAGADO",
        "ANULADO",
        name="paymentstatus",
    )

    payment_status_enum.create(
        op.get_bind(),
        checkfirst=True,
    )

    op.add_column(
        "payments",
        sa.Column(
            "estado",
            payment_status_enum,
            nullable=False,
            server_default="PAGADO",
        ),
    )

    op.create_index(
        "ix_payments_estado",
        "payments",
        ["estado"],
    )


def downgrade():
    op.drop_index(
        "ix_payments_estado",
        table_name="payments",
    )

    op.drop_column(
        "payments",
        "estado",
    )

    payment_status_enum = sa.Enum(
        "PAGADO",
        "ANULADO",
        name="paymentstatus",
    )

    payment_status_enum.drop(
        op.get_bind(),
        checkfirst=True,
    )