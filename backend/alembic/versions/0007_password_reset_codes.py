"""Add password reset codes.

Revision ID: 0007
Revises: 0006
"""

from alembic import op
import sqlalchemy as sa


revision = "0007"
down_revision = "0006"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "password_reset_codes",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("code_hash", sa.String(length=64), nullable=False),
        sa.Column("attempts", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("used_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_password_reset_codes_id", "password_reset_codes", ["id"], unique=False)
    op.create_index("ix_password_reset_codes_user_id", "password_reset_codes", ["user_id"], unique=False)
    op.create_index("ix_password_reset_codes_expires_at", "password_reset_codes", ["expires_at"], unique=False)


def downgrade():
    op.drop_index("ix_password_reset_codes_expires_at", table_name="password_reset_codes")
    op.drop_index("ix_password_reset_codes_user_id", table_name="password_reset_codes")
    op.drop_index("ix_password_reset_codes_id", table_name="password_reset_codes")
    op.drop_table("password_reset_codes")
