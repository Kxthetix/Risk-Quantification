"""Tests for Trends, Snapshots, Alerts, and Compliance API routers (Phase 9)."""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token
from app.models.enums import AlertSeverity, AlertType
from app.models.organization import Organization
from app.models.user import User


@pytest.mark.asyncio
async def test_trends_and_snapshot_endpoints(
    client: AsyncClient,
    db_session: AsyncSession,
    test_org: Organization,
    admin_user: User,
):
    token = create_access_token(data={"sub": str(admin_user.id)})
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Create a Snapshot
    snap_res = await client.post("/api/v1/trends/snapshots", headers=headers)
    assert snap_res.status_code == 201
    snap = snap_res.json()
    assert snap["organization_id"] == str(test_org.id)
    assert "risk_score" in snap

    # 2. Test /trends/risk
    rt_res = await client.get("/api/v1/trends/risk", headers=headers)
    assert rt_res.status_code == 200
    rt = rt_res.json()
    assert "points" in rt
    assert "trend_direction" in rt

    # 3. Test /trends/financial
    ft_res = await client.get("/api/v1/trends/financial", headers=headers)
    assert ft_res.status_code == 200
    ft = ft_res.json()
    assert "points" in ft

    # 4. Test /trends/new-risks and /regressions
    nr_res = await client.get("/api/v1/trends/new-risks", headers=headers)
    assert nr_res.status_code == 200
    reg_res = await client.get("/api/v1/trends/regressions", headers=headers)
    assert reg_res.status_code == 200


@pytest.mark.asyncio
async def test_alerts_lifecycle(
    client: AsyncClient,
    db_session: AsyncSession,
    test_org: Organization,
    admin_user: User,
):
    token = create_access_token(data={"sub": str(admin_user.id)})
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Create Alert
    payload = {
        "alert_type": "CRITICAL_RISK_INCREASE",
        "severity": "HIGH",
        "title": "Abnormal Financial Risk Spike",
        "message": "Financial loss exposure jumped by 35% in payment processing service.",
        "source": "FINANCIAL_MODEL",
    }
    create_res = await client.post("/api/v1/alerts", json=payload, headers=headers)
    assert create_res.status_code == 201
    alert_data = create_res.json()
    alert_id = alert_data["id"]
    assert alert_data["acknowledged"] is False

    # 2. List Alerts
    list_res = await client.get("/api/v1/alerts", headers=headers)
    assert list_res.status_code == 200
    alerts = list_res.json()
    assert alerts["total"] >= 1

    # 3. Acknowledge Alert
    ack_res = await client.post(f"/api/v1/alerts/{alert_id}/acknowledge", headers=headers)
    assert ack_res.status_code == 200
    ack_data = ack_res.json()
    assert ack_data["acknowledged"] is True
    assert ack_data["acknowledged_by"] == admin_user.email


@pytest.mark.asyncio
async def test_compliance_endpoints(
    client: AsyncClient,
    db_session: AsyncSession,
    test_org: Organization,
    admin_user: User,
):
    token = create_access_token(data={"sub": str(admin_user.id)})
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Frameworks list
    f_res = await client.get("/api/v1/compliance/frameworks", headers=headers)
    assert f_res.status_code == 200
    frameworks = f_res.json()
    framework_names = [f["name"] if isinstance(f, dict) else f for f in frameworks]
    assert any("ISO" in name for name in framework_names)

    # 2. Specific framework evaluation
    iso_res = await client.get("/api/v1/compliance/ISO%2FIEC%2027001", headers=headers)
    assert iso_res.status_code == 200
    iso = iso_res.json()
    assert iso["framework"] == "ISO/IEC 27001"
    assert "coverage" in iso
    assert "requirements" in iso

    # 3. Gaps
    gap_res = await client.get("/api/v1/compliance/ISO%2FIEC%2027001/gaps", headers=headers)
    assert gap_res.status_code == 200
    gaps = gap_res.json()
    assert "gaps" in gaps
