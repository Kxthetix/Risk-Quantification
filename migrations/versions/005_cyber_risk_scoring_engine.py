"""add cyber risk scoring engine, risk assessments, factors, rules, and history

Revision ID: 005_cyber_risk_scoring_engine
Revises: 004_vulnerability_validation_and_evidence
Create Date: 2026-08-29 00:30:00.000000

"""
from typing import Sequence, Union
import uuid

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from alembic import op

revision: str = "005_cyber_risk_scoring_engine"
down_revision: Union[str, None] = "004_vulnerability_validation_and_evidence"
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
            "CREATE TYPE risk_level_enum AS ENUM "
            "('LOW','MEDIUM','HIGH','VERY_HIGH','CRITICAL')"
        )

    uuid_type = postgresql.UUID(as_uuid=True) if is_postgres else sa.String(36)
    json_type = postgresql.JSONB() if is_postgres else sa.JSON()

    # ------------------------------------------------------------------
    # 2. Table: risk_rules
    # ------------------------------------------------------------------
    op.create_table(
        "risk_rules",
        sa.Column("id", uuid_type, primary_key=True),
        sa.Column(
            "organization_id",
            uuid_type,
            sa.ForeignKey("organizations.id", ondelete="CASCADE"),
            nullable=True,
        ),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("factor", sa.String(64), nullable=False),
        sa.Column("weight", sa.Float(), nullable=False, server_default="1.0"),
        sa.Column("enabled", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("parameters", json_type, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_risk_rules_factor", "risk_rules", ["factor"])
    op.create_index("ix_risk_rules_org_id", "risk_rules", ["organization_id"])

    # ------------------------------------------------------------------
    # 3. Table: risk_assessments
    # ------------------------------------------------------------------
    risk_level_type = (
        sa.Enum("LOW", "MEDIUM", "HIGH", "VERY_HIGH", "CRITICAL", name="risk_level_enum")
        if is_postgres
        else sa.String(32)
    )

    op.create_table(
        "risk_assessments",
        sa.Column("id", uuid_type, primary_key=True),
        sa.Column(
            "organization_id",
            uuid_type,
            sa.ForeignKey("organizations.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "asset_id",
            uuid_type,
            sa.ForeignKey("assets.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "asset_vulnerability_id",
            uuid_type,
            sa.ForeignKey("asset_vulnerabilities.id", ondelete="CASCADE"),
            nullable=False,
            unique=True,
        ),
        sa.Column("likelihood_score", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("impact_score", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("exposure_score", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("exploitability_score", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("validation_score", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("control_score", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("business_criticality_score", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("final_risk_score", sa.Float(), nullable=False),
        sa.Column("risk_level", risk_level_type, nullable=False),
        sa.Column("risk_method", sa.String(64), nullable=False, server_default="CONTEXTUAL_WEIGHTED"),
        sa.Column("risk_model_version", sa.String(32), nullable=False, server_default="1.0"),
        sa.Column("explanation", json_type, nullable=True),
        sa.Column("factors_snapshot", json_type, nullable=True),
        sa.Column("configuration_snapshot", json_type, nullable=True),
        sa.Column("input_snapshot", json_type, nullable=True),
        sa.Column("calculated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_risk_assessments_org_id", "risk_assessments", ["organization_id"])
    op.create_index("ix_risk_assessments_asset_id", "risk_assessments", ["asset_id"])
    op.create_index("ix_risk_assessments_final_risk_score", "risk_assessments", ["final_risk_score"])
    op.create_index("ix_risk_assessments_risk_level", "risk_assessments", ["risk_level"])
    op.create_index("ix_risk_assessments_org_score", "risk_assessments", ["organization_id", "final_risk_score"])
    op.create_index("ix_risk_assessments_org_level", "risk_assessments", ["organization_id", "risk_level"])
    op.create_index("ix_risk_assessments_asset_score", "risk_assessments", ["asset_id", "final_risk_score"])

    # ------------------------------------------------------------------
    # 4. Table: risk_factors
    # ------------------------------------------------------------------
    op.create_table(
        "risk_factors",
        sa.Column("id", uuid_type, primary_key=True),
        sa.Column(
            "risk_assessment_id",
            uuid_type,
            sa.ForeignKey("risk_assessments.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("factor_name", sa.String(64), nullable=False),
        sa.Column("raw_value", sa.String(255), nullable=True),
        sa.Column("normalized_value", sa.Float(), nullable=False),
        sa.Column("weight", sa.Float(), nullable=False),
        sa.Column("contribution", sa.Float(), nullable=False),
        sa.Column("extra_metadata", json_type, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_risk_factors_assessment_id", "risk_factors", ["risk_assessment_id"])
    op.create_index("ix_risk_factors_factor_name", "risk_factors", ["factor_name"])

    # ------------------------------------------------------------------
    # 5. Table: risk_history
    # ------------------------------------------------------------------
    op.create_table(
        "risk_history",
        sa.Column("id", uuid_type, primary_key=True),
        sa.Column(
            "risk_assessment_id",
            uuid_type,
            sa.ForeignKey("risk_assessments.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("previous_score", sa.Float(), nullable=True),
        sa.Column("new_score", sa.Float(), nullable=False),
        sa.Column("previous_level", sa.String(32), nullable=True),
        sa.Column("new_level", sa.String(32), nullable=False),
        sa.Column("reason", sa.String(1024), nullable=True),
        sa.Column(
            "changed_by",
            uuid_type,
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("changed_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_risk_history_assessment_id", "risk_history", ["risk_assessment_id"])


def downgrade() -> None:
    bind = op.get_bind()
    is_postgres = bind.dialect.name == "postgresql"

    op.drop_table("risk_history")
    op.drop_table("risk_factors")
    op.drop_table("risk_assessments")
    op.drop_table("risk_rules")

    if is_postgres:
        op.execute("DROP TYPE IF EXISTS risk_level_enum")
