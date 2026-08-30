"""Development seed data script.

Usage:
    python scripts/seed_data.py

Creates a demo organization, users, assets, and software for local development.
DO NOT run in production.
"""
import asyncio
import sys
import uuid
from pathlib import Path

# Ensure project root is on path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings
from app.core.security import hash_password
from app.models.asset import Asset
from app.models.asset_software import AssetSoftware
from app.models.enums import (
    Architecture,
    AssetCriticality,
    AssetEnvironment,
    AssetStatus,
    AssetType,
    DataClassification,
    PackageManager,
    SoftwareSource,
)
from app.models.organization import Organization
from app.models.software import Software
from app.models.user import User, UserRole


SEED_ORG_NAME = "SIH Demo Organization"


async def seed(session: AsyncSession) -> None:
    from sqlalchemy import select

    # Check if already seeded
    existing = (await session.execute(
        select(Organization).where(Organization.name == SEED_ORG_NAME)
    )).scalar_one_or_none()
    if existing:
        print("[INFO] Seed data already present. Skipping.")
        return

    print("[INFO] Seeding development data...")

    # Organization
    org = Organization(
        id=uuid.uuid4(),
        name=SEED_ORG_NAME,
        description="Smart India Hackathon demonstration organization",
        industry="Technology",
    )
    session.add(org)
    await session.flush()

    # Users
    admin = User(
        id=uuid.uuid4(),
        organization_id=org.id,
        full_name="Demo Admin / CISO",
        email="admin@sih-demo.local",
        password_hash=hash_password("Admin@1234!"),
        role=UserRole.ADMIN,
        is_active=True,
    )
    analyst = User(
        id=uuid.uuid4(),
        organization_id=org.id,
        full_name="SecOps Analyst",
        email="analyst@sih-demo.local",
        password_hash=hash_password("Analyst@1234!"),
        role=UserRole.SECURITY_ANALYST,
        is_active=True,
    )
    risk_officer = User(
        id=uuid.uuid4(),
        organization_id=org.id,
        full_name="Risk Officer",
        email="risk.officer@sih-demo.local",
        password_hash=hash_password("Risk@1234!"),
        role=UserRole.MANAGER,
        is_active=True,
    )
    auditor = User(
        id=uuid.uuid4(),
        organization_id=org.id,
        full_name="Compliance Auditor",
        email="auditor@sih-demo.local",
        password_hash=hash_password("Audit@1234!"),
        role=UserRole.VIEWER,
        is_active=True,
    )
    session.add_all([admin, analyst, risk_officer, auditor])
    await session.flush()

    # Assets
    assets_data = [
        dict(name="Production Web Server", asset_type=AssetType.SERVER,
             hostname="prod-web-01", ip_address="10.10.1.20",
             operating_system="Ubuntu", os_version="22.04",
             environment=AssetEnvironment.PRODUCTION, criticality=AssetCriticality.CRITICAL,
             data_classification=DataClassification.CONFIDENTIAL,
             business_value=500000, internet_exposed=True, status=AssetStatus.ACTIVE,
             location="Chennai DC", owner="IT Operations"),
        dict(name="Production Database", asset_type=AssetType.DATABASE,
             hostname="prod-db-01", ip_address="10.10.1.30",
             operating_system="Ubuntu", os_version="22.04",
             environment=AssetEnvironment.PRODUCTION, criticality=AssetCriticality.CRITICAL,
             data_classification=DataClassification.RESTRICTED,
             business_value=800000, internet_exposed=False, status=AssetStatus.ACTIVE,
             location="Chennai DC", owner="DBA Team"),
        dict(name="Development Server", asset_type=AssetType.SERVER,
             hostname="dev-srv-01", ip_address="192.168.10.10",
             operating_system="Ubuntu", os_version="20.04",
             environment=AssetEnvironment.DEVELOPMENT, criticality=AssetCriticality.LOW,
             data_classification=DataClassification.INTERNAL,
             business_value=50000, internet_exposed=False, status=AssetStatus.ACTIVE,
             location="Office", owner="Development Team"),
        dict(name="Network Firewall", asset_type=AssetType.FIREWALL,
             hostname="fw-core-01", ip_address="10.0.0.1",
             operating_system="FortiOS", os_version="7.4",
             environment=AssetEnvironment.PRODUCTION, criticality=AssetCriticality.CRITICAL,
             data_classification=DataClassification.CONFIDENTIAL,
             business_value=300000, internet_exposed=True, status=AssetStatus.ACTIVE,
             location="Chennai DC", owner="Network Team"),
    ]

    asset_objects = []
    for a in assets_data:
        asset = Asset(id=uuid.uuid4(), organization_id=org.id, **a)
        session.add(asset)
        asset_objects.append(asset)
    await session.flush()

    # Software
    software_data = [
        dict(vendor="Apache", product_name="HTTP Server", product_version="2.4.49",
             architecture=Architecture.X86_64, package_manager=PackageManager.APT,
             cpe="cpe:2.3:a:apache:http_server:2.4.49:*:*:*:*:*:*:*"),
        dict(vendor="Nginx", product_name="nginx", product_version="1.24.0",
             architecture=Architecture.X86_64, package_manager=PackageManager.APT,
             cpe="cpe:2.3:a:nginx:nginx:1.24.0:*:*:*:*:*:*:*"),
        dict(vendor="PostgreSQL", product_name="PostgreSQL", product_version="15.3",
             architecture=Architecture.X86_64, package_manager=PackageManager.APT,
             cpe="cpe:2.3:a:postgresql:postgresql:15.3:*:*:*:*:*:*:*"),
        dict(vendor="OpenBSD", product_name="OpenSSH", product_version="8.9p1",
             architecture=Architecture.X86_64, package_manager=PackageManager.APT,
             cpe="cpe:2.3:a:openbsd:openssh:8.9p1:*:*:*:*:*:*:*"),
        dict(vendor="Canonical", product_name="Ubuntu", product_version="22.04",
             architecture=Architecture.X86_64, package_manager=PackageManager.APT,
             cpe=None, description="Ubuntu 22.04 LTS Jammy Jellyfish"),
    ]

    sw_objects = []
    for s in software_data:
        sw = Software(id=uuid.uuid4(), organization_id=org.id, **s)
        session.add(sw)
        sw_objects.append(sw)
    await session.flush()

    # Link software to assets (web server gets Apache + OpenSSH + Ubuntu)
    web_server = asset_objects[0]
    links = [
        AssetSoftware(id=uuid.uuid4(), asset_id=web_server.id, software_id=sw_objects[0].id,
                      installed_version="2.4.49", installation_path="/usr/sbin/apache2",
                      source=SoftwareSource.MANUAL, is_active=True),
        AssetSoftware(id=uuid.uuid4(), asset_id=web_server.id, software_id=sw_objects[3].id,
                      installed_version="8.9p1", installation_path="/usr/sbin/sshd",
                      source=SoftwareSource.MANUAL, is_active=True),
        AssetSoftware(id=uuid.uuid4(), asset_id=web_server.id, software_id=sw_objects[4].id,
                      installed_version="22.04", source=SoftwareSource.MANUAL, is_active=True),
    ]
    session.add_all(links)
    await session.commit()

    print(f"[SUCCESS] Seeded organization: {SEED_ORG_NAME}")
    print(f"   [+] admin@sih-demo.local (Admin@1234!) - Role: ADMIN")
    print(f"   [+] analyst@sih-demo.local (Analyst@1234!) - Role: SECURITY_ANALYST")
    print(f"   [+] risk.officer@sih-demo.local (Risk@1234!) - Role: MANAGER")
    print(f"   [+] auditor@sih-demo.local (Audit@1234!) - Role: VIEWER")
    print(f"   [+] {len(asset_objects)} assets, {len(sw_objects)} software records")


async def main() -> None:
    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    session_factory = async_sessionmaker(bind=engine, expire_on_commit=False)
    async with session_factory() as session:
        await seed(session)
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
