"""hacer equipo opcional en servicios"""

from alembic import op


revision = "0003_equipo_opcional"
down_revision = "0002"
branch_labels = None
depends_on = None


def upgrade():
    op.alter_column(
        "services",
        "equipo_id",
        nullable=True,
    )


def downgrade():
    op.alter_column(
        "services",
        "equipo_id",
        nullable=False,
    )