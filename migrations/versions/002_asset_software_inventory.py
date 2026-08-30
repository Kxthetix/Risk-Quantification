"""add asset and software inventory

Revision ID: 002_asset_software_inventory
Revises: 001_initial_schema
Create Date: 2026-08-28 16:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "002_asset_software_inventory"
down_revision: Union[str, None] = "001_initial_schema"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ------------------------------------------------------------------
    # 1. Create enum types (PostgreSQL)
    # ------------------------------------------------------------------
    op.execute("CREATE TYPE asset_type_enum AS ENUM ("
               "'SERVER','WORKSTATION','LAPTOP','DESKTOP','DATABASE',"
               "'WEB_APPLICATION','API','NETWORK_DEVICE','FIREWALL',"
               "'ROUTER','SWITCH','IOT_DEVICE','CLOUD_RESOURCE',"
               "'CONTAINER','VIRTUAL_MACHINE','OTHER')")

    op.execute("CREATE TYPE asset_environment_enum AS ENUM ("
               "'PRODUCTION','STAGING','DEVELOPMENT','TESTING',"
               "'DISASTER_RECOVERY','OTHER')")

    op.execute("CREATE TYPE asset_criticality_enum AS ENUM ("
               "'LOW','MEDIUM','HIGH','CRITICAL')")

    op.execute("CREATE TYPE data_classification_enum AS ENUM ("
               "'PUBLIC','INTERNAL','CONFIDENTIAL','RESTRICTED')")

    op.execute("CREATE TYPE asset_status_enum AS ENUM ("
               "'ACTIVE','INACTIVE','MAINTENANCE','DECOMMISSIONED','UNKNOWN')")

    op.execute("CREATE TYPE software_source_enum AS ENUM ("
               "'manual','scan','import','api','agent')")

    op.execute("CREATE TYPE architecture_enum AS ENUM ("
               "'x86','x86_64','arm','arm64','mips','other','unknown')")

    op.execute("CREATE TYPE package_manager_enum AS ENUM ("
               "'apt','yum','rpm','dnf','pip','npm','yarn','brew',"
               "'chocolatey','snap','flatpak','docker','manual','other','unknown')")

    op.execute("CREATE TYPE audit_action_enum AS ENUM ("
               "'ASSET_CREATED','ASSET_UPDATED','ASSET_DELETED','ASSET_VIEWED',"
               "'SOFTWARE_CREATED','SOFTWARE_UPDATED','SOFTWARE_DELETED',"
               "'SOFTWARE_ATTACHED','SOFTWARE_DETACHED',"
               "'INVENTORY_IMPORTED','INVENTORY_EXPORTED')")

    # ------------------------------------------------------------------
    # 2. Create assets table
    # ------------------------------------------------------------------
    op.create_table(
        "assets",
        sa.Column("id", sa.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("organization_id", sa.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("asset_type", sa.String(50), nullable=False),
        sa.Column("hostname", sa.String(255), nullable=True),
        sa.Column("ip_address", sa.String(45), nullable=True),
        sa.Column("mac_address", sa.String(17), nullable=True),
        sa.Column("operating_system", sa.String(100), nullable=True),
        sa.Column("os_version", sa.String(50), nullable=True),
        sa.Column("environment", sa.String(30), nullable=False, server_default="OTHER"),
        sa.Column("criticality", sa.String(20), nullable=False, server_default="MEDIUM"),
        sa.Column("data_classification", sa.String(20), nullable=False, server_default="INTERNAL"),
        sa.Column("business_value", sa.Numeric(precision=20, scale=2), nullable=True),
        sa.Column("internet_exposed", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("status", sa.String(20), nullable=False, server_default="ACTIVE"),
        sa.Column("location", sa.String(255), nullable=True),
        sa.Column("owner", sa.String(255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"], ondelete="CASCADE"),
        sa.CheckConstraint("business_value IS NULL OR business_value >= 0", name="chk_asset_business_value_non_negative"),
        sa.UniqueConstraint("organization_id", "hostname", name="uq_asset_org_hostname"),
    )
    op.create_index(op.f("ix_assets_id"), "assets", ["id"])
    op.create_index(op.f("ix_assets_organization_id"), "assets", ["organization_id"])
    op.create_index(op.f("ix_assets_name"), "assets", ["name"])
    op.create_index(op.f("ix_assets_hostname"), "assets", ["hostname"])
    op.create_index(op.f("ix_assets_ip_address"), "assets", ["ip_address"])
    op.create_index(op.f("ix_assets_asset_type"), "assets", ["asset_type"])
    op.create_index(op.f("ix_assets_criticality"), "assets", ["criticality"])
    op.create_index(op.f("ix_assets_environment"), "assets", ["environment"])
    op.create_index(op.f("ix_assets_status"), "assets", ["status"])
    op.create_index(op.f("ix_assets_internet_exposed"), "assets", ["internet_exposed"])
    op.create_index(op.f("ix_assets_data_classification"), "assets", ["data_classification"])
    op.create_index("ix_assets_org_type", "assets", ["organization_id", "asset_type"])
    op.create_index("ix_assets_org_criticality", "assets", ["organization_id", "criticality"])
    op.create_index("ix_assets_org_env", "assets", ["organization_id", "environment"])
    op.create_index("ix_assets_org_status", "assets", ["organization_id", "status"])
    op.create_index("ix_assets_org_exposed", "assets", ["organization_id", "internet_exposed"])

    # ------------------------------------------------------------------
    # 3. Create software table
    # ------------------------------------------------------------------
    op.create_table(
        "software",
        sa.Column("id", sa.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("organization_id", sa.UUID(as_uuid=True), nullable=False),
        sa.Column("vendor", sa.String(255), nullable=False),
        sa.Column("product_name", sa.String(255), nullable=False),
        sa.Column("product_version", sa.String(100), nullable=False),
        sa.Column("edition", sa.String(100), nullable=True),
        sa.Column("architecture", sa.String(20), nullable=False, server_default="unknown"),
        sa.Column("package_manager", sa.String(20), nullable=False, server_default="unknown"),
        sa.Column("cpe", sa.String(500), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.UniqueConstraint(
            "organization_id", "vendor", "product_name", "product_version",
            name="uq_software_org_vendor_product_version",
        ),
    )
    op.create_index(op.f("ix_software_id"), "software", ["id"])
    op.create_index(op.f("ix_software_organization_id"), "software", ["organization_id"])
    op.create_index(op.f("ix_software_vendor"), "software", ["vendor"])
    op.create_index(op.f("ix_software_product_name"), "software", ["product_name"])
    op.create_index(op.f("ix_software_product_version"), "software", ["product_version"])
    op.create_index(op.f("ix_software_cpe"), "software", ["cpe"])
    op.create_index("ix_software_org_vendor", "software", ["organization_id", "vendor"])
    op.create_index("ix_software_org_product", "software", ["organization_id", "product_name"])
    op.create_index("ix_software_org_version", "software", ["organization_id", "product_version"])

    # ------------------------------------------------------------------
    # 4. Create asset_software junction table
    # ------------------------------------------------------------------
    op.create_table(
        "asset_software",
        sa.Column("id", sa.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("asset_id", sa.UUID(as_uuid=True), nullable=False),
        sa.Column("software_id", sa.UUID(as_uuid=True), nullable=False),
        sa.Column("installed_version", sa.String(100), nullable=True),
        sa.Column("installation_path", sa.String(500), nullable=True),
        sa.Column("source", sa.String(20), nullable=False, server_default="manual"),
        sa.Column("first_seen", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("last_seen", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["asset_id"], ["assets.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["software_id"], ["software.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("asset_id", "software_id", name="uq_asset_software_pair"),
    )
    op.create_index(op.f("ix_asset_software_id"), "asset_software", ["id"])
    op.create_index("ix_asset_software_asset", "asset_software", ["asset_id"])
    op.create_index("ix_asset_software_software", "asset_software", ["software_id"])
    op.create_index("ix_asset_software_active", "asset_software", ["asset_id", "is_active"])

    # ------------------------------------------------------------------
    # 5. Create audit_logs table
    # ------------------------------------------------------------------
    op.create_table(
        "audit_logs",
        sa.Column("id", sa.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("organization_id", sa.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", sa.UUID(as_uuid=True), nullable=False),
        sa.Column("action", sa.String(50), nullable=False),
        sa.Column("resource_type", sa.String(50), nullable=False),
        sa.Column("resource_id", sa.String(36), nullable=True),
        sa.Column("metadata", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index(op.f("ix_audit_logs_id"), "audit_logs", ["id"])
    op.create_index("ix_audit_org_action", "audit_logs", ["organization_id", "action"])
    op.create_index("ix_audit_user", "audit_logs", ["user_id"])
    op.create_index("ix_audit_resource", "audit_logs", ["resource_type", "resource_id"])


def downgrade() -> None:
    op.drop_table("audit_logs")
    op.drop_index("ix_asset_software_active", table_name="asset_software")
    op.drop_index("ix_asset_software_software", table_name="asset_software")
    op.drop_index("ix_asset_software_asset", table_name="asset_software")
    op.drop_index(op.f("ix_asset_software_id"), table_name="asset_software")
    op.drop_table("asset_software")
    op.drop_index("ix_software_org_version", table_name="software")
    op.drop_index("ix_software_org_product", table_name="software")
    op.drop_index("ix_software_org_vendor", table_name="software")
    op.drop_index(op.f("ix_software_cpe"), table_name="software")
    op.drop_index(op.f("ix_software_product_version"), table_name="software")
    op.drop_index(op.f("ix_software_product_name"), table_name="software")
    op.drop_index(op.f("ix_software_vendor"), table_name="software")
    op.drop_index(op.f("ix_software_organization_id"), table_name="software")
    op.drop_index(op.f("ix_software_id"), table_name="software")
    op.drop_table("software")
    op.drop_index("ix_assets_org_exposed", table_name="assets")
    op.drop_index("ix_assets_org_status", table_name="assets")
    op.drop_index("ix_assets_org_env", table_name="assets")
    op.drop_index("ix_assets_org_criticality", table_name="assets")
    op.drop_index("ix_assets_org_type", table_name="assets")
    op.drop_index(op.f("ix_assets_internet_exposed"), table_name="assets")
    op.drop_index(op.f("ix_assets_status"), table_name="assets")
    op.drop_index(op.f("ix_assets_environment"), table_name="assets")
    op.drop_index(op.f("ix_assets_criticality"), table_name="assets")
    op.drop_index(op.f("ix_assets_asset_type"), table_name="assets")
    op.drop_index(op.f("ix_assets_data_classification"), table_name="assets")
    op.drop_index(op.f("ix_assets_ip_address"), table_name="assets")
    op.drop_index(op.f("ix_assets_hostname"), table_name="assets")
    op.drop_index(op.f("ix_assets_name"), table_name="assets")
    op.drop_index(op.f("ix_assets_organization_id"), table_name="assets")
    op.drop_index(op.f("ix_assets_id"), table_name="assets")
    op.drop_table("assets")
    # Drop enum types
    op.execute("DROP TYPE IF EXISTS audit_action_enum")
    op.execute("DROP TYPE IF EXISTS package_manager_enum")
    op.execute("DROP TYPE IF EXISTS architecture_enum")
    op.execute("DROP TYPE IF EXISTS software_source_enum")
    op.execute("DROP TYPE IF EXISTS asset_status_enum")
    op.execute("DROP TYPE IF EXISTS data_classification_enum")
    op.execute("DROP TYPE IF EXISTS asset_criticality_enum")
    op.execute("DROP TYPE IF EXISTS asset_environment_enum")
    op.execute("DROP TYPE IF EXISTS asset_type_enum")
