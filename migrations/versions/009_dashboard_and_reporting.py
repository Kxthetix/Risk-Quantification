"""Add dashboard_snapshots, alerts, and report_jobs (Phase 9).

Revision ID: 009_dashboard_and_reporting
Revises: 008_remediation_and_optimization
Create Date: 2026-08-29 04:00:00.000000

"""
from typing import Sequence, Union
import uuid

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from alembic import op

revision: str = "009_dashboard_and_reporting"
down_revision: Union[str, None] = "008_remediation_and_optimization"
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
            "CREATE TYPE report_type AS ENUM "
            "('EXECUTIVE_RISK','CYBER_RISK','FINANCIAL_RISK','VULNERABILITY','ATTACK_PATH','REMEDIATION','SECURITY_INVESTMENT','COMPLIANCE')"
        )
        op.execute(
            "CREATE TYPE report_format AS ENUM "
            "('PDF','JSON','CSV','XLSX')"
        )
        op.execute(
            "CREATE TYPE report_status AS ENUM "
            "('QUEUED','PROCESSING','COMPLETED','FAILED')"
        )
        op.execute(
            "CREATE TYPE alert_severity AS ENUM "
            "('INFO','LOW','MEDIUM','HIGH','CRITICAL')"
        )
        op.execute(
            "CREATE TYPE alert_type AS ENUM "
            "('CRITICAL_RISK_INCREASE','NEW_CRITICAL_ATTACK_PATH','FINANCIAL_RISK_INCREASE','SLA_BREACH','CONTROL_COVERAGE_DROP','RISK_ACCEPTANCE_EXPIRING','NEW_CRITICAL_VULNERABILITY','RISK_REGRESSION')"
        )

    uuid_type = postgresql.UUID(as_uuid=True) if is_postgres else sa.String(36)
    json_type = postgresql.JSONB() if is_postgres else sa.JSON()

    rep_type_enum = (
        sa.Enum(
            "EXECUTIVE_RISK",
            "CYBER_RISK",
            "FINANCIAL_RISK",
            "VULNERABILITY",
            "ATTACK_PATH",
            "REMEDIATION",
            "SECURITY_INVESTMENT",
            "COMPLIANCE",
            name="report_type",
        )
        if is_postgres
        else sa.String(32)
    )
    rep_format_enum = (
        sa.Enum("PDF", "JSON", "CSV", "XLSX", name="report_format")
        if is_postgres
        else sa.String(16)
    )
    rep_status_enum = (
        sa.Enum("QUEUED", "PROCESSING", "COMPLETED", "FAILED", name="report_status")
        if is_postgres
        else sa.String(32)
    )
    alert_sev_enum = (
        sa.Enum("INFO", "LOW", "MEDIUM", "HIGH", "CRITICAL", name="alert_severity")
        if is_postgres
        else sa.String(16)
    )
    alert_type_enum = (
        sa.Enum(
            "CRITICAL_RISK_INCREASE",
            "NEW_CRITICAL_ATTACK_PATH",
            "FINANCIAL_RISK_INCREASE",
            "SLA_BREACH",
            "CONTROL_COVERAGE_DROP",
            "RISK_ACCEPTANCE_EXPIRING",
            "NEW_CRITICAL_VULNERABILITY",
            "RISK_REGRESSION",
            name="alert_type",
        )
        if is_postgres
        else sa.String(64)
    )

    # ------------------------------------------------------------------
    # 2. Table: dashboard_snapshots
    # ------------------------------------------------------------------
    op.create_table(
        "dashboard_snapshots",
        sa.Column("id", uuid_type, primary_key=True),
        sa.Column("organization_id", uuid_type, sa.ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False),
        sa.Column("snapshot_date", sa.DateTime(timezone=True), nullable=False),
        sa.Column("risk_score", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("expected_loss", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("p50_loss", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("p90_loss", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("p95_loss", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("critical_findings", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("critical_assets", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("critical_attack_paths", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("open_remediations", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("overdue_remediations", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("security_investment", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("risk_reduction", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("control_coverage", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("metrics_data", json_type, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
    )
    op.create_index("ix_dashboard_snapshots_organization_id", "dashboard_snapshots", ["organization_id"])
    op.create_index("ix_dashboard_snapshots_snapshot_date", "dashboard_snapshots", ["snapshot_date"])
    op.create_index("ix_snapshots_org_date", "dashboard_snapshots", ["organization_id", "snapshot_date"])

    # ------------------------------------------------------------------
    # 3. Table: alerts
    # ------------------------------------------------------------------
    op.create_table(
        "alerts",
        sa.Column("id", uuid_type, primary_key=True),
        sa.Column("organization_id", uuid_type, sa.ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False),
        sa.Column("alert_type", alert_type_enum, nullable=False, server_default="CRITICAL_RISK_INCREASE"),
        sa.Column("severity", alert_sev_enum, nullable=False, server_default="HIGH"),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("source", sa.String(100), nullable=False, server_default="RISK_ENGINE"),
        sa.Column("acknowledged", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("acknowledged_by", sa.String(255), nullable=True),
        sa.Column("acknowledged_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("metadata_json", json_type, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
    )
    op.create_index("ix_alerts_organization_id", "alerts", ["organization_id"])
    op.create_index("ix_alerts_acknowledged", "alerts", ["acknowledged"])
    op.create_index("ix_alerts_org_ack", "alerts", ["organization_id", "acknowledged"])
    op.create_index("ix_alerts_org_sev", "alerts", ["organization_id", "severity"])

    # ------------------------------------------------------------------
    # 4. Table: report_jobs
    # ------------------------------------------------------------------
    op.create_table(
        "report_jobs",
        sa.Column("id", uuid_type, primary_key=True),
        sa.Column("organization_id", uuid_type, sa.ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", uuid_type, sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("report_type", rep_type_enum, nullable=False, server_default="EXECUTIVE_RISK"),
        sa.Column("period", sa.String(32), nullable=False, server_default="30d"),
        sa.Column("report_format", rep_format_enum, nullable=False, server_default="JSON"),
        sa.Column("status", rep_status_enum, nullable=False, server_default="QUEUED"),
        sa.Column("file_path", sa.String(512), nullable=True),
        sa.Column("file_size", sa.Integer(), nullable=True),
        sa.Column("report_data", json_type, nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
    )
    op.create_index("ix_report_jobs_organization_id", "report_jobs", ["organization_id"])
    op.create_index("ix_report_jobs_user_id", "report_jobs", ["user_id"])
    op.create_index("ix_report_jobs_status", "report_jobs", ["status"])
    op.create_index("ix_reports_org_status", "report_jobs", ["organization_id", "status"])
    op.create_index("ix_reports_org_type", "report_jobs", ["organization_id", "report_type"])


def downgrade() -> None:
    bind = op.get_bind()
    is_postgres = bind.dialect.name == "postgresql"

    op.drop_table("report_jobs")
    op.drop_table("alerts")
    op.drop_table("dashboard_snapshots")

    if is_postgres:
        op.execute("DROP TYPE IF EXISTS alert_type")
        op.execute("DROP TYPE IF EXISTS alert_severity")
        op.execute("DROP TYPE IF EXISTS report_status")
        op.execute("DROP TYPE IF EXISTS report_format")
        op.execute("DROP TYPE IF EXISTS report_type")
