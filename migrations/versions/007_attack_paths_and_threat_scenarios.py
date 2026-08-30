"""Add network relationships, attack paths, nodes, edges, techniques, and threat scenarios (Phase 7).

Revision ID: 007_attack_paths_and_threat_scenarios
Revises: 006_financial_impact_and_simulation
Create Date: 2026-08-29 02:00:00.000000

"""
from typing import Sequence, Union
import uuid

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from alembic import op

revision: str = "007_attack_paths_and_threat_scenarios"
down_revision: Union[str, None] = "006_financial_impact_and_simulation"
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
            "CREATE TYPE network_relationship_type AS ENUM "
            "('NETWORK_REACHABILITY','DEPENDS_ON','CONNECTS_TO','TRUSTS','AUTHENTICATES_TO','HOSTS','COMMUNICATES_WITH')"
        )
        op.execute(
            "CREATE TYPE network_direction AS ENUM "
            "('INBOUND','OUTBOUND','BIDIRECTIONAL')"
        )
        op.execute(
            "CREATE TYPE attacker_profile AS ENUM "
            "('EXTERNAL_ATTACKER','INSIDER','COMPROMISED_ACCOUNT','THIRD_PARTY','RANSOMWARE_GROUP','OPPORTUNISTIC_ATTACKER')"
        )
        op.execute(
            "CREATE TYPE attack_path_node_type AS ENUM "
            "('ENTRY_POINT','ASSET','VULNERABILITY','IDENTITY','PRIVILEGE','BUSINESS_SERVICE','TARGET')"
        )
        op.execute(
            "CREATE TYPE attack_path_edge_type AS ENUM "
            "('EXPLOITS','REACHES','AUTHENTICATES','LATERAL_MOVEMENT','ESCALATES','ACCESSES','DEPENDS_ON')"
        )
        op.execute(
            "CREATE TYPE attack_path_status AS ENUM "
            "('POSSIBLE','HIGH_CONFIDENCE','BLOCKED')"
        )
        op.execute(
            "CREATE TYPE threat_scenario_status AS ENUM "
            "('DRAFT','ACTIVE','ARCHIVED')"
        )

    uuid_type = postgresql.UUID(as_uuid=True) if is_postgres else sa.String(36)
    json_type = postgresql.JSONB() if is_postgres else sa.JSON()

    net_rel_type = (
        sa.Enum(
            "NETWORK_REACHABILITY",
            "DEPENDS_ON",
            "CONNECTS_TO",
            "TRUSTS",
            "AUTHENTICATES_TO",
            "HOSTS",
            "COMMUNICATES_WITH",
            name="network_relationship_type",
        )
        if is_postgres
        else sa.String(32)
    )
    net_dir_type = (
        sa.Enum("INBOUND", "OUTBOUND", "BIDIRECTIONAL", name="network_direction")
        if is_postgres
        else sa.String(32)
    )
    attacker_prof_type = (
        sa.Enum(
            "EXTERNAL_ATTACKER",
            "INSIDER",
            "COMPROMISED_ACCOUNT",
            "THIRD_PARTY",
            "RANSOMWARE_GROUP",
            "OPPORTUNISTIC_ATTACKER",
            name="attacker_profile",
        )
        if is_postgres
        else sa.String(32)
    )
    node_type_enum = (
        sa.Enum(
            "ENTRY_POINT",
            "ASSET",
            "VULNERABILITY",
            "IDENTITY",
            "PRIVILEGE",
            "BUSINESS_SERVICE",
            "TARGET",
            name="attack_path_node_type",
        )
        if is_postgres
        else sa.String(32)
    )
    edge_type_enum = (
        sa.Enum(
            "EXPLOITS",
            "REACHES",
            "AUTHENTICATES",
            "LATERAL_MOVEMENT",
            "ESCALATES",
            "ACCESSES",
            "DEPENDS_ON",
            name="attack_path_edge_type",
        )
        if is_postgres
        else sa.String(32)
    )
    path_status_enum = (
        sa.Enum("POSSIBLE", "HIGH_CONFIDENCE", "BLOCKED", name="attack_path_status")
        if is_postgres
        else sa.String(32)
    )
    scenario_status_enum = (
        sa.Enum("DRAFT", "ACTIVE", "ARCHIVED", name="threat_scenario_status")
        if is_postgres
        else sa.String(32)
    )

    # ------------------------------------------------------------------
    # 2. Table: network_relationships
    # ------------------------------------------------------------------
    op.create_table(
        "network_relationships",
        sa.Column("id", uuid_type, primary_key=True),
        sa.Column("organization_id", uuid_type, sa.ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False),
        sa.Column("source_asset_id", uuid_type, sa.ForeignKey("assets.id", ondelete="CASCADE"), nullable=False),
        sa.Column("destination_asset_id", uuid_type, sa.ForeignKey("assets.id", ondelete="CASCADE"), nullable=False),
        sa.Column("relationship_type", net_rel_type, nullable=False, server_default="NETWORK_REACHABILITY"),
        sa.Column("protocol", sa.String(32), nullable=True),
        sa.Column("port", sa.Integer(), nullable=True),
        sa.Column("direction", net_dir_type, nullable=False, server_default="OUTBOUND"),
        sa.Column("verified", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("confidence", sa.Float(), nullable=False, server_default="1.0"),
        sa.Column("evidence", json_type, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.CheckConstraint("confidence >= 0.0 AND confidence <= 1.0", name="chk_network_rel_confidence_range"),
        sa.CheckConstraint("port IS NULL OR (port >= 1 AND port <= 65535)", name="chk_network_rel_port_range"),
    )
    op.create_index("ix_network_relationships_organization_id", "network_relationships", ["organization_id"])
    op.create_index("ix_network_relationships_source_asset_id", "network_relationships", ["source_asset_id"])
    op.create_index("ix_network_relationships_destination_asset_id", "network_relationships", ["destination_asset_id"])
    op.create_index("ix_network_rel_org_source_dest", "network_relationships", ["organization_id", "source_asset_id", "destination_asset_id"])

    # ------------------------------------------------------------------
    # 3. Table: attack_techniques
    # ------------------------------------------------------------------
    op.create_table(
        "attack_techniques",
        sa.Column("id", uuid_type, primary_key=True),
        sa.Column("technique_id", sa.String(32), nullable=False, unique=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("tactic", sa.String(64), nullable=False),
        sa.Column("source", sa.String(64), nullable=False, server_default="MITRE ATT&CK"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
    )
    op.create_index("ix_attack_techniques_technique_id", "attack_techniques", ["technique_id"])
    op.create_index("ix_attack_technique_tactic", "attack_techniques", ["tactic"])

    # ------------------------------------------------------------------
    # 4. Table: threat_scenarios
    # ------------------------------------------------------------------
    op.create_table(
        "threat_scenarios",
        sa.Column("id", uuid_type, primary_key=True),
        sa.Column("organization_id", uuid_type, sa.ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("attacker_profile", attacker_prof_type, nullable=False, server_default="EXTERNAL_ATTACKER"),
        sa.Column("objective", sa.String(255), nullable=True),
        sa.Column("entry_point", sa.String(255), nullable=True),
        sa.Column("target_asset_id", uuid_type, sa.ForeignKey("assets.id", ondelete="SET NULL"), nullable=True),
        sa.Column("target_asset_name", sa.String(255), nullable=True),
        sa.Column("probability", sa.Float(), nullable=False, server_default="0.5"),
        sa.Column("confidence", sa.Float(), nullable=False, server_default="0.8"),
        sa.Column("risk_score", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("financial_assessment_id", uuid_type, sa.ForeignKey("financial_assessments.id", ondelete="SET NULL"), nullable=True),
        sa.Column("status", scenario_status_enum, nullable=False, server_default="ACTIVE"),
        sa.Column("scenario_metadata", json_type, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.CheckConstraint("probability >= 0.0 AND probability <= 1.0", name="chk_threat_scenario_prob"),
        sa.CheckConstraint("confidence >= 0.0 AND confidence <= 1.0", name="chk_threat_scenario_conf"),
        sa.CheckConstraint("risk_score >= 0.0 AND risk_score <= 100.0", name="chk_threat_scenario_risk"),
    )
    op.create_index("ix_threat_scenarios_organization_id", "threat_scenarios", ["organization_id"])
    op.create_index("ix_threat_scenarios_target_asset_id", "threat_scenarios", ["target_asset_id"])
    op.create_index("ix_threat_scenarios_org_status", "threat_scenarios", ["organization_id", "status"])

    # ------------------------------------------------------------------
    # 5. Table: attack_paths
    # ------------------------------------------------------------------
    op.create_table(
        "attack_paths",
        sa.Column("id", uuid_type, primary_key=True),
        sa.Column("organization_id", uuid_type, sa.ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False),
        sa.Column("scenario_id", uuid_type, sa.ForeignKey("threat_scenarios.id", ondelete="SET NULL"), nullable=True),
        sa.Column("source_node", sa.String(255), nullable=False),
        sa.Column("target_node", sa.String(255), nullable=False),
        sa.Column("target_asset_id", uuid_type, sa.ForeignKey("assets.id", ondelete="SET NULL"), nullable=True),
        sa.Column("path_score", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("likelihood", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("impact", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("financial_exposure", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("confidence", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("path_length", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("status", path_status_enum, nullable=False, server_default="POSSIBLE"),
        sa.Column("is_blocked", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("blocking_control", sa.String(255), nullable=True),
        sa.Column("raw_path", json_type, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.CheckConstraint("path_score >= 0.0 AND path_score <= 100.0", name="chk_attack_path_score"),
        sa.CheckConstraint("likelihood >= 0.0 AND likelihood <= 1.0", name="chk_attack_path_likelihood"),
        sa.CheckConstraint("confidence >= 0.0 AND confidence <= 1.0", name="chk_attack_path_confidence"),
    )
    op.create_index("ix_attack_paths_organization_id", "attack_paths", ["organization_id"])
    op.create_index("ix_attack_paths_org_score", "attack_paths", ["organization_id", "path_score"])
    op.create_index("ix_attack_paths_org_target", "attack_paths", ["organization_id", "target_asset_id"])

    # ------------------------------------------------------------------
    # 6. Table: attack_path_nodes
    # ------------------------------------------------------------------
    op.create_table(
        "attack_path_nodes",
        sa.Column("id", uuid_type, primary_key=True),
        sa.Column("attack_path_id", uuid_type, sa.ForeignKey("attack_paths.id", ondelete="CASCADE"), nullable=False),
        sa.Column("node_type", node_type_enum, nullable=False, server_default="ASSET"),
        sa.Column("asset_id", uuid_type, sa.ForeignKey("assets.id", ondelete="SET NULL"), nullable=True),
        sa.Column("vulnerability_id", uuid_type, sa.ForeignKey("vulnerabilities.id", ondelete="SET NULL"), nullable=True),
        sa.Column("technique_id", uuid_type, sa.ForeignKey("attack_techniques.id", ondelete="SET NULL"), nullable=True),
        sa.Column("label", sa.String(255), nullable=True),
        sa.Column("sequence", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("score", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("node_metadata", json_type, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
    )
    op.create_index("ix_attack_path_nodes_attack_path_id", "attack_path_nodes", ["attack_path_id"])
    op.create_index("ix_attack_path_nodes_asset_id", "attack_path_nodes", ["asset_id"])
    op.create_index("ix_attack_path_node_seq", "attack_path_nodes", ["attack_path_id", "sequence"])

    # ------------------------------------------------------------------
    # 7. Table: attack_path_edges
    # ------------------------------------------------------------------
    op.create_table(
        "attack_path_edges",
        sa.Column("id", uuid_type, primary_key=True),
        sa.Column("attack_path_id", uuid_type, sa.ForeignKey("attack_paths.id", ondelete="CASCADE"), nullable=False),
        sa.Column("source_node_id", uuid_type, sa.ForeignKey("attack_path_nodes.id", ondelete="CASCADE"), nullable=False),
        sa.Column("destination_node_id", uuid_type, sa.ForeignKey("attack_path_nodes.id", ondelete="CASCADE"), nullable=False),
        sa.Column("edge_type", edge_type_enum, nullable=False, server_default="LATERAL_MOVEMENT"),
        sa.Column("probability", sa.Float(), nullable=False, server_default="1.0"),
        sa.Column("confidence", sa.Float(), nullable=False, server_default="1.0"),
        sa.Column("evidence", json_type, nullable=True),
        sa.Column("is_blocked", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("blocking_reason", sa.String(255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.CheckConstraint("probability >= 0.0 AND probability <= 1.0", name="chk_attack_edge_prob"),
        sa.CheckConstraint("confidence >= 0.0 AND confidence <= 1.0", name="chk_attack_edge_conf"),
    )
    op.create_index("ix_attack_path_edges_attack_path_id", "attack_path_edges", ["attack_path_id"])
    op.create_index("ix_attack_edge_path_src_dst", "attack_path_edges", ["attack_path_id", "source_node_id", "destination_node_id"])


def downgrade() -> None:
    bind = op.get_bind()
    is_postgres = bind.dialect.name == "postgresql"

    op.drop_table("attack_path_edges")
    op.drop_table("attack_path_nodes")
    op.drop_table("attack_paths")
    op.drop_table("threat_scenarios")
    op.drop_table("attack_techniques")
    op.drop_table("network_relationships")

    if is_postgres:
        op.execute("DROP TYPE IF EXISTS threat_scenario_status")
        op.execute("DROP TYPE IF EXISTS attack_path_status")
        op.execute("DROP TYPE IF EXISTS attack_path_edge_type")
        op.execute("DROP TYPE IF EXISTS attack_path_node_type")
        op.execute("DROP TYPE IF EXISTS attacker_profile")
        op.execute("DROP TYPE IF EXISTS network_direction")
        op.execute("DROP TYPE IF EXISTS network_relationship_type")
