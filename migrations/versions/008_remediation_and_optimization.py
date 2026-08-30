"""Add remediations, remediation costs, controls, control effectiveness, investment scenarios, and optimization results (Phase 8).

Revision ID: 008_remediation_and_optimization
Revises: 007_attack_paths_and_threat_scenarios
Create Date: 2026-08-29 03:00:00.000000

"""
from typing import Sequence, Union
import uuid

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from alembic import op

revision: str = "008_remediation_and_optimization"
down_revision: Union[str, None] = "007_attack_paths_and_threat_scenarios"
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
            "CREATE TYPE remediation_type AS ENUM "
            "('PATCH','UPGRADE','CONFIGURATION_CHANGE','NETWORK_SEGMENTATION','ACCESS_CONTROL','MFA','WAF_RULE','FIREWALL_RULE','VIRTUAL_PATCH','COMPENSATING_CONTROL','ASSET_RETIREMENT')"
        )
        op.execute(
            "CREATE TYPE remediation_status AS ENUM "
            "('OPEN','PLANNED','IN_PROGRESS','COMPLETED','VERIFIED','ACCEPTED_RISK','REJECTED')"
        )
        op.execute(
            "CREATE TYPE remediation_priority_level AS ENUM "
            "('LOW','MEDIUM','HIGH','CRITICAL')"
        )
        op.execute(
            "CREATE TYPE control_type AS ENUM "
            "('WAF','EDR','MFA','NETWORK_SEGMENTATION','PAM','IDS_IPS','BACKUP','ZERO_TRUST_ACCESS','SIEM')"
        )
        op.execute(
            "CREATE TYPE investment_scenario_status AS ENUM "
            "('DRAFT','ACTIVE','ARCHIVED')"
        )
        op.execute(
            "CREATE TYPE optimization_algorithm AS ENUM "
            "('GREEDY','KNAPSACK')"
        )

    uuid_type = postgresql.UUID(as_uuid=True) if is_postgres else sa.String(36)
    json_type = postgresql.JSONB() if is_postgres else sa.JSON()

    rem_type_enum = (
        sa.Enum(
            "PATCH",
            "UPGRADE",
            "CONFIGURATION_CHANGE",
            "NETWORK_SEGMENTATION",
            "ACCESS_CONTROL",
            "MFA",
            "WAF_RULE",
            "FIREWALL_RULE",
            "VIRTUAL_PATCH",
            "COMPENSATING_CONTROL",
            "ASSET_RETIREMENT",
            name="remediation_type",
        )
        if is_postgres
        else sa.String(32)
    )
    rem_status_enum = (
        sa.Enum(
            "OPEN",
            "PLANNED",
            "IN_PROGRESS",
            "COMPLETED",
            "VERIFIED",
            "ACCEPTED_RISK",
            "REJECTED",
            name="remediation_status",
        )
        if is_postgres
        else sa.String(32)
    )
    rem_priority_enum = (
        sa.Enum("LOW", "MEDIUM", "HIGH", "CRITICAL", name="remediation_priority_level")
        if is_postgres
        else sa.String(32)
    )
    ctrl_type_enum = (
        sa.Enum(
            "WAF",
            "EDR",
            "MFA",
            "NETWORK_SEGMENTATION",
            "PAM",
            "IDS_IPS",
            "BACKUP",
            "ZERO_TRUST_ACCESS",
            "SIEM",
            name="control_type",
        )
        if is_postgres
        else sa.String(32)
    )
    inv_status_enum = (
        sa.Enum("DRAFT", "ACTIVE", "ARCHIVED", name="investment_scenario_status")
        if is_postgres
        else sa.String(32)
    )
    opt_algo_enum = (
        sa.Enum("GREEDY", "KNAPSACK", name="optimization_algorithm")
        if is_postgres
        else sa.String(32)
    )

    # ------------------------------------------------------------------
    # 2. Table: remediations
    # ------------------------------------------------------------------
    op.create_table(
        "remediations",
        sa.Column("id", uuid_type, primary_key=True),
        sa.Column("organization_id", uuid_type, sa.ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False),
        sa.Column("asset_vulnerability_id", uuid_type, sa.ForeignKey("asset_vulnerabilities.id", ondelete="SET NULL"), nullable=True),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("remediation_type", rem_type_enum, nullable=False, server_default="PATCH"),
        sa.Column("status", rem_status_enum, nullable=False, server_default="OPEN"),
        sa.Column("priority_score", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("priority_level", rem_priority_enum, nullable=False, server_default="MEDIUM"),
        sa.Column("estimated_cost", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("estimated_duration_hours", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("risk_reduction", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("expected_loss_reduction", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("owner", sa.String(255), nullable=True),
        sa.Column("due_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("depends_on_remediation_id", uuid_type, sa.ForeignKey("remediations.id", ondelete="SET NULL"), nullable=True),
        sa.Column("risk_acceptance_reason", sa.Text(), nullable=True),
        sa.Column("risk_accepted_by", sa.String(255), nullable=True),
        sa.Column("risk_accepted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("risk_acceptance_expiry", sa.DateTime(timezone=True), nullable=True),
        sa.Column("verification_evidence", json_type, nullable=True),
        sa.Column("verification_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.CheckConstraint("priority_score >= 0.0 AND priority_score <= 100.0", name="chk_remediation_priority_score"),
        sa.CheckConstraint("risk_reduction >= 0.0", name="chk_remediation_risk_reduction"),
        sa.CheckConstraint("expected_loss_reduction >= 0.0", name="chk_remediation_loss_reduction"),
    )
    op.create_index("ix_remediations_organization_id", "remediations", ["organization_id"])
    op.create_index("ix_remediations_asset_vuln_id", "remediations", ["asset_vulnerability_id"])
    op.create_index("ix_remediations_org_status", "remediations", ["organization_id", "status"])
    op.create_index("ix_remediations_org_priority", "remediations", ["organization_id", "priority_score"])

    # ------------------------------------------------------------------
    # 3. Table: remediation_costs
    # ------------------------------------------------------------------
    op.create_table(
        "remediation_costs",
        sa.Column("id", uuid_type, primary_key=True),
        sa.Column("remediation_id", uuid_type, sa.ForeignKey("remediations.id", ondelete="CASCADE"), nullable=False, unique=True),
        sa.Column("minimum_cost", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("most_likely_cost", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("maximum_cost", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("currency", sa.String(8), nullable=False, server_default="INR"),
        sa.Column("labor_cost", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("technology_cost", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("consulting_cost", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("downtime_cost", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("licensing_cost", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("recurring_cost", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("one_time_cost", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("confidence", sa.Float(), nullable=False, server_default="0.8"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.CheckConstraint("minimum_cost <= most_likely_cost AND most_likely_cost <= maximum_cost", name="chk_remediation_cost_order"),
        sa.CheckConstraint("confidence >= 0.0 AND confidence <= 1.0", name="chk_remediation_cost_conf"),
    )
    op.create_index("ix_remediation_costs_remediation_id", "remediation_costs", ["remediation_id"])

    # ------------------------------------------------------------------
    # 4. Table: controls
    # ------------------------------------------------------------------
    op.create_table(
        "controls",
        sa.Column("id", uuid_type, primary_key=True),
        sa.Column("organization_id", uuid_type, sa.ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("control_type", ctrl_type_enum, nullable=False, server_default="WAF"),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("implementation_cost", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("annual_cost", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("effectiveness", sa.Float(), nullable=False, server_default="0.8"),
        sa.Column("enabled", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.CheckConstraint("effectiveness >= 0.0 AND effectiveness <= 1.0", name="chk_control_effectiveness"),
        sa.CheckConstraint("implementation_cost >= 0.0", name="chk_control_impl_cost"),
        sa.CheckConstraint("annual_cost >= 0.0", name="chk_control_annual_cost"),
    )
    op.create_index("ix_controls_organization_id", "controls", ["organization_id"])
    op.create_index("ix_controls_org_type", "controls", ["organization_id", "control_type"])

    # ------------------------------------------------------------------
    # 5. Table: control_effectiveness
    # ------------------------------------------------------------------
    op.create_table(
        "control_effectiveness",
        sa.Column("id", uuid_type, primary_key=True),
        sa.Column("control_id", uuid_type, sa.ForeignKey("controls.id", ondelete="CASCADE"), nullable=False),
        sa.Column("threat_type", sa.String(64), nullable=False),
        sa.Column("risk_factor", sa.String(64), nullable=False),
        sa.Column("reduction_factor", sa.Float(), nullable=False, server_default="0.5"),
        sa.Column("confidence", sa.Float(), nullable=False, server_default="0.8"),
        sa.Column("evidence", json_type, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.CheckConstraint("reduction_factor >= 0.0 AND reduction_factor <= 1.0", name="chk_ctrl_eff_reduction"),
        sa.CheckConstraint("confidence >= 0.0 AND confidence <= 1.0", name="chk_ctrl_eff_conf"),
    )
    op.create_index("ix_control_effectiveness_control_id", "control_effectiveness", ["control_id"])
    op.create_index("ix_ctrl_eff_control_threat", "control_effectiveness", ["control_id", "threat_type"])

    # ------------------------------------------------------------------
    # 6. Table: investment_scenarios
    # ------------------------------------------------------------------
    op.create_table(
        "investment_scenarios",
        sa.Column("id", uuid_type, primary_key=True),
        sa.Column("organization_id", uuid_type, sa.ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("budget", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("currency", sa.String(8), nullable=False, server_default="INR"),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("status", inv_status_enum, nullable=False, server_default="DRAFT"),
        sa.Column("horizon_years", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("discount_rate", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("scenario_metadata", json_type, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.CheckConstraint("budget >= 0.0", name="chk_investment_budget"),
        sa.CheckConstraint("horizon_years IN (1, 3, 5)", name="chk_investment_horizon"),
    )
    op.create_index("ix_investment_scenarios_organization_id", "investment_scenarios", ["organization_id"])
    op.create_index("ix_investment_scenarios_org_status", "investment_scenarios", ["organization_id", "status"])

    # ------------------------------------------------------------------
    # 7. Table: optimization_results
    # ------------------------------------------------------------------
    op.create_table(
        "optimization_results",
        sa.Column("id", uuid_type, primary_key=True),
        sa.Column("organization_id", uuid_type, sa.ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False),
        sa.Column("scenario_id", uuid_type, sa.ForeignKey("investment_scenarios.id", ondelete="SET NULL"), nullable=True),
        sa.Column("algorithm", opt_algo_enum, nullable=False, server_default="KNAPSACK"),
        sa.Column("budget", sa.Float(), nullable=False),
        sa.Column("total_cost", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("expected_loss_before", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("expected_loss_after", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("expected_loss_reduction", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("roi", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("risk_reduction_per_rupee", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("critical_paths_reduced", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("selected_actions", json_type, nullable=False),
        sa.Column("input_snapshot", json_type, nullable=True),
        sa.Column("risk_snapshot", json_type, nullable=True),
        sa.Column("financial_snapshot", json_type, nullable=True),
        sa.Column("optimization_model_version", sa.String(32), nullable=False, server_default="1.0"),
        sa.Column("risk_model_version", sa.String(32), nullable=False, server_default="1.0"),
        sa.Column("financial_model_version", sa.String(32), nullable=False, server_default="1.0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.CheckConstraint("budget >= 0.0", name="chk_opt_budget"),
        sa.CheckConstraint("total_cost >= 0.0", name="chk_opt_cost"),
    )
    op.create_index("ix_optimization_results_organization_id", "optimization_results", ["organization_id"])
    op.create_index("ix_opt_org_created", "optimization_results", ["organization_id", "created_at"])


def downgrade() -> None:
    bind = op.get_bind()
    is_postgres = bind.dialect.name == "postgresql"

    op.drop_table("optimization_results")
    op.drop_table("investment_scenarios")
    op.drop_table("control_effectiveness")
    op.drop_table("controls")
    op.drop_table("remediation_costs")
    op.drop_table("remediations")

    if is_postgres:
        op.execute("DROP TYPE IF EXISTS optimization_algorithm")
        op.execute("DROP TYPE IF EXISTS investment_scenario_status")
        op.execute("DROP TYPE IF EXISTS control_type")
        op.execute("DROP TYPE IF EXISTS remediation_priority_level")
        op.execute("DROP TYPE IF EXISTS remediation_status")
        op.execute("DROP TYPE IF EXISTS remediation_type")
