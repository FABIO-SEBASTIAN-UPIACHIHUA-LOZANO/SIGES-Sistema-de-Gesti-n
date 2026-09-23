from logging.config import fileConfig
import sys
from pathlib import Path

from sqlalchemy import engine_from_config
from sqlalchemy import pool

from alembic import context


# ============================================================
# PYTHON PATH
# ============================================================

BASE_DIR = Path(__file__).resolve().parents[1]

if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))


# ============================================================
# APP IMPORTS
# ============================================================

from app.db.session import Base

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
    service_item,
)


# ============================================================
# ALEMBIC CONFIG
# ============================================================

config = context.config


if config.config_file_name is not None:
    fileConfig(config.config_file_name)


target_metadata = Base.metadata


# ============================================================
# OFFLINE
# ============================================================

def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")

    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={
            "paramstyle": "named"
        },
    )

    with context.begin_transaction():
        context.run_migrations()


# ============================================================
# ONLINE
# ============================================================

def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
        )

        with context.begin_transaction():
            context.run_migrations()


# ============================================================
# EXECUTE
# ============================================================

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()