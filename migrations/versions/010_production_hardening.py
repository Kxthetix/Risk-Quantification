"""Add user_sessions and background_jobs for production hardening (Phase 10).

Revision ID: 010_production_hardening
Revises: 009_dashboard_and_reporting
Create Date: 2026-08-29 05:00:00.000000

"""
from typing import Sequence, Union
import uuid

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from alembic import op

revision: str = "010_production_hardening"
down_revision: Union[str, None] = "009_dashboard_and_reporting"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    is_postgres = bind.dialect.name == "postgresql"

    # ------------------------------------------------------------------
    # 1. Create Enums (PostgreSQL only)
    # ------------------------------------------------------------------
    if is_postgres:
        op.execute(
            "CREATE TYPE job_status_enum AS ENUM "
            "('QUEUED','RUNNING','COMPLETED','FAILED','CANCELLED','RETRYING')"
        )
        op.execute(
            "CREATE TYPE job_type_enum AS ENUM "
            "('MONTE_CARLO','OPTIMIZATION','DASHBOARD_SNAPSHOT','REPORT_GENERATION',"
            "'ATTACK_PATH_CALCULATION','RISK_RECALCULATION','IMPORT_PROCESSING','BACKUP_VERIFICATION')"
        )

    guid_type = postgresql.UUID(as_uuid=True) if is_postgres else sa.String(36)

    # ------------------------------------------------------------------
    # 2. Table: user_sessions
    # ------------------------------------------------------------------
    op.create_table(
        "user_sessions",
        sa.Column("id", guid_type, primary_key=True, default=uuid.uuid4),
        sa.Column("organization_id", guid_type, sa.ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", guid_type, sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("token_hash", sa.String(255), nullable=False, unique=True),
        sa.Column("device_info", sa.String(500), nullable=True),
        sa.Column("ip_address", sa.String(45), nullable=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("revoked", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
    )
    op.create_index("ix_user_sessions_org_id", "user_sessions", ["organization_id"])
    op.create_index("ix_user_sessions_user_id", "user_sessions", ["user_id"])
    op.create_index("ix_user_sessions_token_hash", "user_sessions", ["token_hash"])
    op.create_index("ix_user_sessions_user_active", "user_sessions", ["user_id", "revoked", "expires_at"])

    # ------------------------------------------------------------------
    # 3. Table: background_jobs
    # ------------------------------------------------------------------
    job_type_col = sa.Enum(
        "MONTE_CARLO", "OPTIMIZATION", "DASHBOARD_SNAPSHOT", "REPORT_GENERATION",
        "ATTACK_PATH_CALCULATION", "RISK_RECALCULATION", "IMPORT_PROCESSING", "BACKUP_VERIFICATION",
        name="job_type_enum",
        create_type=False,
    ) if is_postgres else sa.String(50)

    job_status_col = sa.Enum(
        "QUEUED", "RUNNING", "COMPLETED", "FAILED", "CANCELLED", "RETRYING",
        name="job_status_enum",
        create_type=False,
    ) if is_postgres else sa.String(50)

    op.create_table(
        "background_jobs",
        sa.Column("id", guid_type, primary_key=True, default=uuid.uuid4),
        sa.Column("organization_id", guid_type, sa.ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False),
        sa.Column("job_type", job_type_col, nullable=False),
        sa.Column("idempotency_key", sa.String(255), nullable=True),
        sa.Column("status", job_status_col, server_default="QUEUED", nullable=False),
        sa.Column("progress_percentage", sa.Integer(), server_default="0", nullable=False),
        sa.Column("attempts", sa.Integer(), server_default="0", nullable=False),
        sa.Column("max_attempts", sa.Integer(), server_default="3", nullable=False),
        sa.Column("payload", sa.JSON(), nullable=True),
        sa.Column("result_data", sa.JSON(), nullable=True),
        sa.Column("error_code", sa.String(100), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
    )
    op.create_index("ix_background_jobs_org_id", "background_jobs", ["organization_id"])
    op.create_index("ix_background_jobs_status", "background_jobs", ["status"])
    op.create_index("ix_background_jobs_org_type_status", "background_jobs", ["organization_id", "job_type", "status"])
    op.create_index("ix_background_jobs_idempotency", "background_jobs", ["organization_id", "idempotency_key"])


def downgrade() -> None:
    bind = op.get_bind()
    is_postgres = bind.dialect.name == "postgresql"

    op.drop_table("background_jobs")
    op.drop_table("user_sessions")

    if is_postgres:
        op.execute("DROP TYPE IF EXISTS job_type_enum")
        op.execute("DROP TYPE IF EXISTS job_status_enum")
