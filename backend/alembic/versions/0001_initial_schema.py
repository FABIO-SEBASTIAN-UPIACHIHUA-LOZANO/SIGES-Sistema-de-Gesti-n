"""Initial schema

Revision ID: 0001
Revises:
Create Date: 2026-09-13
"""

from alembic import op
from app.db.session import Base
import app.models  # Registra todos los modelos en la metadata.


revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # Las tablas de estas entidades se incorporan en migraciones posteriores.
    later_tables = {"service_items", "invoices", "invoice_items"}
    tables = [table for name, table in Base.metadata.tables.items() if name not in later_tables]
    Base.metadata.create_all(bind=op.get_bind(), tables=tables, checkfirst=True)


def downgrade():
    later_tables = {"service_items", "invoices", "invoice_items"}
    tables = [table for name, table in Base.metadata.tables.items() if name not in later_tables]
    Base.metadata.drop_all(bind=op.get_bind(), tables=tables, checkfirst=True)
