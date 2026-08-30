"""Add financial impact analysis, business services, Monte Carlo simulation, and profiles (Phase 6).

Revision ID: 006_financial_impact_and_simulation
Revises: 005_cyber_risk_scoring_engine
Create Date: 2026-08-29 01:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from alembic import op

revision: str = "006_financial_impact_and_simulation"
down_revision: Union[str, None] = "005_cyber_risk_scoring_engine"
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
            "CREATE TYPE simulation_status_enum AS ENUM "
            "('QUEUED','PROCESSING','COMPLETED','FAILED')"
        )

    uuid_type = postgresql.UUID(as_uuid=True) if is_postgres else sa.String(36)
    json_type = postgresql.JSONB() if is_postgres else sa.JSON()
    simulation_status_type = (
        sa.Enum("QUEUED", "PROCESSING", "COMPLETED", "FAILED", name="simulation_status_enum")
        if is_postgres
        else sa.String(32)
    )
    asset_criticality_type = (
        sa.Enum("LOW", "MEDIUM", "HIGH", "CRITICAL", name="asset_criticality_enum", create_type=False)
        if is_postgres
        else sa.String(32)
    )

    # ------------------------------------------------------------------
    # 2. Table: business_services
    # ------------------------------------------------------------------
    op.create_table(
        "business_services",
        sa.Column("id", uuid_type, primary_key=True),
        sa.Column(
            "organization_id",
            uuid_type,
            sa.ForeignKey("organizations.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("revenue_dependency", sa.Float(), nullable=False, server_default="1.0"),
        sa.Column("criticality", asset_criticality_type, nullable=False, server_default="HIGH"),
        sa.Column("daily_transaction_count", sa.BigInteger(), nullable=True, server_default="0"),
        sa.Column("average_transaction_value", sa.Float(), nullable=True, server_default="0.0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_business_services_org_id", "business_services", ["organization_id"])
    op.create_index("ix_business_services_name", "business_services", ["name"])
    op.create_index("ix_business_services_org_name", "business_services", ["organization_id", "name"])

    # ------------------------------------------------------------------
    # 3. Alter assets table: add business_service_id & financial_dependency_factor
    # ------------------------------------------------------------------
    op.add_column(
        "assets",
        sa.Column("business_service_id", uuid_type, sa.ForeignKey("business_services.id", ondelete="SET NULL"), nullable=True),
    )
    op.add_column(
        "assets",
        sa.Column("financial_dependency_factor", sa.Float(), nullable=False, server_default="1.0"),
    )
    op.create_index("ix_assets_business_service_id", "assets", ["business_service_id"])

    # ------------------------------------------------------------------
    # 4. Table: financial_profiles
    # ------------------------------------------------------------------
    op.create_table(
        "financial_profiles",
        sa.Column("id", uuid_type, primary_key=True),
        sa.Column(
            "organization_id",
            uuid_type,
            sa.ForeignKey("organizations.id", ondelete="CASCADE"),
            unique=True,
            nullable=False,
        ),
        sa.Column("currency", sa.String(3), nullable=False, server_default="INR"),
        sa.Column("annual_revenue", sa.Numeric(precision=20, scale=2), nullable=False, server_default="0.0"),
        sa.Column("operating_days_per_year", sa.Integer(), nullable=False, server_default="250"),
        sa.Column("hours_per_day", sa.Integer(), nullable=False, server_default="8"),
        sa.Column("daily_revenue", sa.Numeric(precision=20, scale=2), nullable=False, server_default="0.0"),
        sa.Column("hourly_revenue", sa.Numeric(precision=20, scale=2), nullable=False, server_default="0.0"),
        sa.Column("average_hourly_revenue", sa.Numeric(precision=20, scale=2), nullable=False, server_default="0.0"),
        sa.Column("average_hourly_profit", sa.Numeric(precision=20, scale=2), nullable=False, server_default="0.0"),
        sa.Column("employee_count", sa.Integer(), nullable=False, server_default="100"),
        sa.Column("average_hourly_employee_cost", sa.Numeric(precision=20, scale=2), nullable=False, server_default="350.0"),
        sa.Column("incident_response_hourly_cost", sa.Numeric(precision=20, scale=2), nullable=False, server_default="2500.0"),
        sa.Column("security_team_size", sa.Integer(), nullable=False, server_default="5"),
        sa.Column("backup_recovery_hourly_cost", sa.Numeric(precision=20, scale=2), nullable=False, server_default="1800.0"),
        sa.Column("customer_count", sa.Integer(), nullable=False, server_default="1000"),
        sa.Column("average_customer_value", sa.Numeric(precision=20, scale=2), nullable=False, server_default="5000.0"),
        sa.Column("cost_per_record", sa.Numeric(precision=20, scale=2), nullable=False, server_default="250.0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_financial_profiles_org_id", "financial_profiles", ["organization_id"])

    # ------------------------------------------------------------------
    # 5. Table: financial_assessments
    # ------------------------------------------------------------------
    op.create_table(
        "financial_assessments",
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
            nullable=True,
        ),
        sa.Column(
            "risk_assessment_id",
            uuid_type,
            sa.ForeignKey("risk_assessments.id", ondelete="CASCADE"),
            nullable=True,
        ),
        sa.Column("estimated_loss", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("expected_loss", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("annual_expected_loss", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("minimum_loss", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("maximum_loss", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("p10_loss", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("p25_loss", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("p50_loss", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("p75_loss", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("p90_loss", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("p95_loss", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("downtime_cost", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("revenue_loss", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("response_cost", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("forensics_cost", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("recovery_cost", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("productivity_cost", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("data_breach_cost", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("regulatory_cost", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("customer_cost", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("third_party_cost", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("reputational_cost", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("simulation_count", sa.Integer(), nullable=False, server_default="10000"),
        sa.Column("random_seed", sa.Integer(), nullable=False, server_default="42"),
        sa.Column("currency", sa.String(3), nullable=False, server_default="INR"),
        sa.Column("model_version", sa.String(32), nullable=False, server_default="1.0"),
        sa.Column("simulation_engine_version", sa.String(32), nullable=False, server_default="1.0"),
        sa.Column("input_snapshot", json_type, nullable=True),
        sa.Column("configuration_snapshot", json_type, nullable=True),
        sa.Column("calculated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_financial_assessments_org_loss", "financial_assessments", ["organization_id", "expected_loss"])
    op.create_index("ix_financial_assessments_org_ale", "financial_assessments", ["organization_id", "annual_expected_loss"])
    op.create_index("ix_financial_assessments_asset_loss", "financial_assessments", ["asset_id", "expected_loss"])
    op.create_index("ix_financial_assessments_av_id", "financial_assessments", ["asset_vulnerability_id"])
    op.create_index("ix_financial_assessments_risk_id", "financial_assessments", ["risk_assessment_id"])

    # ------------------------------------------------------------------
    # 6. Table: financial_factors
    # ------------------------------------------------------------------
    op.create_table(
        "financial_factors",
        sa.Column("id", uuid_type, primary_key=True),
        sa.Column(
            "financial_assessment_id",
            uuid_type,
            sa.ForeignKey("financial_assessments.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("factor_type", sa.String(64), nullable=False),
        sa.Column("distribution_type", sa.String(32), nullable=False, server_default="TRIANGULAR"),
        sa.Column("minimum_value", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("most_likely_value", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("maximum_value", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("probability", sa.Float(), nullable=False, server_default="1.0"),
        sa.Column("expected_value", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("contribution", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("extra_metadata", json_type, nullable=True),
    )
    op.create_index("ix_financial_factors_fa_id", "financial_factors", ["financial_assessment_id"])
    op.create_index("ix_financial_factors_type", "financial_factors", ["factor_type"])

    # ------------------------------------------------------------------
    # 7. Table: financial_assumptions
    # ------------------------------------------------------------------
    op.create_table(
        "financial_assumptions",
        sa.Column("id", uuid_type, primary_key=True),
        sa.Column(
            "financial_assessment_id",
            uuid_type,
            sa.ForeignKey("financial_assessments.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("parameter", sa.String(128), nullable=False),
        sa.Column("value", sa.String(255), nullable=False),
        sa.Column("unit", sa.String(32), nullable=True),
        sa.Column("source", sa.String(128), nullable=False, server_default="organization_input"),
        sa.Column("confidence", sa.Float(), nullable=False, server_default="1.0"),
        sa.Column("user_provided", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("default_value", sa.String(255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_financial_assumptions_fa_id", "financial_assumptions", ["financial_assessment_id"])

    # ------------------------------------------------------------------
    # 8. Table: financial_distributions
    # ------------------------------------------------------------------
    op.create_table(
        "financial_distributions",
        sa.Column("id", uuid_type, primary_key=True),
        sa.Column(
            "financial_assessment_id",
            uuid_type,
            sa.ForeignKey("financial_assessments.id", ondelete="CASCADE"),
            unique=True,
            nullable=False,
        ),
        sa.Column("bins", json_type, nullable=False),
        sa.Column("frequencies", json_type, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_financial_distributions_fa_id", "financial_distributions", ["financial_assessment_id"])

    # ------------------------------------------------------------------
    # 9. Table: simulation_jobs
    # ------------------------------------------------------------------
    op.create_table(
        "simulation_jobs",
        sa.Column("id", uuid_type, primary_key=True),
        sa.Column(
            "organization_id",
            uuid_type,
            sa.ForeignKey("organizations.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "financial_assessment_id",
            uuid_type,
            sa.ForeignKey("financial_assessments.id", ondelete="CASCADE"),
            nullable=True,
        ),
        sa.Column("status", simulation_status_type, nullable=False, server_default="QUEUED"),
        sa.Column("progress", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("simulations_completed", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("total_simulations", sa.Integer(), nullable=False, server_default="10000"),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_simulation_jobs_org_status", "simulation_jobs", ["organization_id", "status"])


def downgrade() -> None:
    bind = op.get_bind()
    is_postgres = bind.dialect.name == "postgresql"

    op.drop_table("simulation_jobs")
    op.drop_table("financial_distributions")
    op.drop_table("financial_assumptions")
    op.drop_table("financial_factors")
    op.drop_table("financial_assessments")
    op.drop_table("financial_profiles")

    op.drop_index("ix_assets_business_service_id", table_name="assets")
    op.drop_column("assets", "financial_dependency_factor")
    op.drop_column("assets", "business_service_id")

    op.drop_table("business_services")

    if is_postgres:
        op.execute("DROP TYPE IF EXISTS simulation_status_enum")
