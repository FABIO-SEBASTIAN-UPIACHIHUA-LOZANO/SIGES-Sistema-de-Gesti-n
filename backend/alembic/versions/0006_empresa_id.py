"""Sincronizar empresa_id en instalaciones existentes.

Revision ID: 0006
Revises: 0005
"""

from alembic import op
import sqlalchemy as sa


revision = "0006"
down_revision = "0005"
branch_labels = None
depends_on = None


def upgrade():
    inspector = sa.inspect(op.get_bind())
    for table in ("users", "clients", "equipment", "services", "products"):
        columns = {column["name"] for column in inspector.get_columns(table)}
        if "empresa_id" not in columns:
            op.add_column(table, sa.Column("empresa_id", sa.Integer(), nullable=True))
            op.execute(sa.text(f"UPDATE {table} SET empresa_id = 1 WHERE empresa_id IS NULL"))
        indexes = {index["name"] for index in inspector.get_indexes(table)}
        if f"ix_{table}_empresa_id" not in indexes:
            op.create_index(f"ix_{table}_empresa_id", table, ["empresa_id"])


def downgrade():
    # Los valores pueden pertenecer a datos existentes: no se eliminan automáticamente.
    pass
