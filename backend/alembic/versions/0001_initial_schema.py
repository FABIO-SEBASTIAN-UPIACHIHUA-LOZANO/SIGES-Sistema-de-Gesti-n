"""Initial schema

Revision ID: 0001
Revises:
Create Date: 2026-09-13
"""

from alembic import op

from app.db.session import Base

# Importar todos los modelos para que SQLAlchemy los registre
from app.models import (
    role,
    user,
    client,
    equipment,
    service,
    product,
    inventory,
    payment,
    notification,
    audit,
)

# Identificadores de revisión de Alembic
revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    """Crear todas las tablas iniciales."""
    bind = op.get_bind()
    Base.metadata.create_all(bind=bind)


def downgrade():
    """Eliminar todas las tablas creadas por esta migración."""
    bind = op.get_bind()
    Base.metadata.drop_all(bind=bind)