"""Phase 11 – Executive API Tests (with service mocking for no-DB test environment)."""
import pytest
from httpx import AsyncClient, ASGITransport
from datetime import datetime, timezone
from unittest.mock import AsyncMock, patch
import uuid

from app.main import app
from app.core.dependencies import get_current_user
from app.core.database import get_db
from app.models.user import User


def _make_user(org_id=None):
    org_id = org_id or uuid.uuid4()
    return User(
        id=uuid.uuid4(),
        email="ciso@enterprise.com",
        full_name="Chief Information Security Officer",
        password_hash="dummy_hash",
        role="ADMIN",
        is_active=True,
        organization_id=org_id,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )


@pytest.fixture
def mock_user():
    user = _make_user()
    app.dependency_overrides[get_current_user] = lambda: user
    # Provide a no-op async db session mock
    mock_db = AsyncMock()
    app.dependency_overrides[get_db] = lambda: mock_db
    yield user
    app.dependency_overrides.pop(get_current_user, None)
    app.dependency_overrides.pop(get_db, None)


# ─── Patch targets ────────────────────────────────────────────────────────────
RISK_SUMMARY = {"overall_risk_score": 68.5, "risk_level": "High"}
RISK_DIST = {"critical": 3, "high": 8, "medium": 15, "low": 22}
FIN_SUMMARY = {"total_potential_loss": 15_000_000.0, "annual_expected_loss": 3_500_000.0}

_patch_risk_summary = lambda: patch(
    "app.services.executive_service.risk_service.get_organization_risk_summary",
    return_value=RISK_SUMMARY,
)
_patch_risk_dist = lambda: patch(
    "app.services.executive_service.risk_service.get_risk_distribution",
    return_value=RISK_DIST,
)
_patch_fin_summary = lambda: patch(
    "app.services.executive_service.financial_service.get_organization_financial_summary",
    return_value=FIN_SUMMARY,
)


class MockRisk:
    def __init__(self):
        self.id = uuid.uuid4()
        self.title = "Mock Risk"
        self.category = "Threat"
        self.asset_name = "asset-1"
        self.likelihood = 0.6
        self.impact = 0.8
        self.risk_score = 75.0


_patch_top_risks = lambda: patch(
    "app.services.executive_service.risk_service.get_top_risks",
    return_value=[MockRisk()],
)



# ─────────────────────────────────────────────────────────────────────────────
# Dashboard & KPIs
# ─────────────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_executive_dashboard(mock_user):
    with _patch_risk_summary(), _patch_risk_dist(), _patch_fin_summary():
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.get("/api/v1/executive/dashboard")
    assert resp.status_code == 200
    data = resp.json()
    assert "risk_score" in data
    assert "financial" in data
    assert "critical_risks" in data
    assert "freshness" in data
    assert data["risk_score"]["current_score"] >= 0


@pytest.mark.asyncio
async def test_executive_kpis(mock_user):
    with _patch_risk_summary(), _patch_risk_dist(), _patch_fin_summary():
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.get("/api/v1/executive/kpis")
    assert resp.status_code == 200
    kpis = resp.json()
    assert isinstance(kpis, list)
    assert len(kpis) > 0
    keys = {k["kpi_key"] for k in kpis}
    assert "cyber_risk" in keys
    assert "financial_exposure" in keys


# ─────────────────────────────────────────────────────────────────────────────
# Risk Trend & Drivers
# ─────────────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_risk_trend_default(mock_user):
    with _patch_risk_summary(), _patch_risk_dist(), _patch_fin_summary():
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.get("/api/v1/executive/risk-trend")
    assert resp.status_code == 200
    data = resp.json()
    assert data["period_days"] == 30
    assert len(data["points"]) == 31


@pytest.mark.asyncio
async def test_risk_trend_7d(mock_user):
    with _patch_risk_summary(), _patch_risk_dist(), _patch_fin_summary():
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.get("/api/v1/executive/risk-trend?period_days=7")
    assert resp.status_code == 200
    assert resp.json()["period_days"] == 7


@pytest.mark.asyncio
async def test_risk_drivers(mock_user):
    with _patch_risk_summary(), _patch_risk_dist(), _patch_fin_summary():
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.get("/api/v1/executive/risk-drivers")
    assert resp.status_code == 200
    data = resp.json()
    assert "total_risk" in data
    assert "drivers" in data
    driver_names = {d["driver"] for d in data["drivers"]}
    assert "Vulnerability" in driver_names
    assert "Threat" in driver_names


# ─────────────────────────────────────────────────────────────────────────────
# Financial Risk
# ─────────────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_executive_financial_risk(mock_user):
    with _patch_risk_summary(), _patch_risk_dist(), _patch_fin_summary():
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.get("/api/v1/executive/financial-risk")
    assert resp.status_code == 200
    data = resp.json()
    assert "current_exposure" in data
    assert "expected_annual_loss" in data
    assert "downtime_exposure" in data


@pytest.mark.asyncio
async def test_financial_trend(mock_user):
    with _patch_risk_summary(), _patch_risk_dist(), _patch_fin_summary():
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.get("/api/v1/executive/financial-risk/trend?period_days=30")
    assert resp.status_code == 200
    data = resp.json()
    assert data["period_days"] == 30
    assert len(data["points"]) == 31


@pytest.mark.asyncio
async def test_loss_distribution(mock_user):
    with _patch_risk_summary(), _patch_risk_dist(), _patch_fin_summary():
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.get("/api/v1/executive/loss-distribution")
    assert resp.status_code == 200
    data = resp.json()
    assert "percentiles" in data
    pcts = [p["percentile"] for p in data["percentiles"]]
    assert "P50" in pcts
    assert "P95" in pcts
    assert "P99" in pcts


# ─────────────────────────────────────────────────────────────────────────────
# Aggregated Risk Views
# ─────────────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_business_service_risk(mock_user):
    with _patch_risk_summary(), _patch_risk_dist(), _patch_fin_summary():
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.get("/api/v1/executive/business-services")
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data
    assert isinstance(data["items"], list)


@pytest.mark.asyncio
async def test_asset_risk(mock_user):
    with _patch_risk_summary(), _patch_risk_dist(), _patch_fin_summary():
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.get("/api/v1/executive/asset-risk")
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data
    assert "critical_assets" in data


@pytest.mark.asyncio
async def test_business_unit_risk(mock_user):
    with _patch_risk_summary(), _patch_risk_dist(), _patch_fin_summary():
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.get("/api/v1/executive/business-units")
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data


@pytest.mark.asyncio
async def test_top_risks(mock_user):
    with _patch_risk_summary(), _patch_risk_dist(), _patch_fin_summary(), _patch_top_risks():
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.get("/api/v1/executive/top-risks")
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data
    assert "total_count" in data


@pytest.mark.asyncio
async def test_attack_path_risk(mock_user):
    with _patch_risk_summary(), _patch_risk_dist(), _patch_fin_summary():
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.get("/api/v1/executive/attack-path-risk")
    assert resp.status_code == 200
    data = resp.json()
    assert "critical_attack_paths" in data
    assert "financial_exposure" in data


# ─────────────────────────────────────────────────────────────────────────────
# Domain Risk Views
# ─────────────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_vulnerability_risk(mock_user):
    with _patch_risk_summary(), _patch_risk_dist(), _patch_fin_summary():
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.get("/api/v1/executive/vulnerability-risk")
    assert resp.status_code == 200
    data = resp.json()
    assert "critical_vulnerabilities" in data
    assert "financial_exposure" in data


@pytest.mark.asyncio
async def test_threat_risk(mock_user):
    with _patch_risk_summary(), _patch_risk_dist(), _patch_fin_summary():
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.get("/api/v1/executive/threat-risk")
    assert resp.status_code == 200
    data = resp.json()
    assert "critical_threats" in data
    assert "active_threat_actors" in data


@pytest.mark.asyncio
async def test_incident_risk(mock_user):
    with _patch_risk_summary(), _patch_risk_dist(), _patch_fin_summary():
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.get("/api/v1/executive/incident-risk")
    assert resp.status_code == 200
    data = resp.json()
    assert "open_incidents" in data
    assert "cost_analysis" in data
    assert "total_estimated_cost" in data["cost_analysis"]


@pytest.mark.asyncio
async def test_control_effectiveness(mock_user):
    with _patch_risk_summary(), _patch_risk_dist(), _patch_fin_summary():
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.get("/api/v1/executive/control-effectiveness")
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data
    assert "overall_effectiveness_pct" in data


@pytest.mark.asyncio
async def test_compliance_risk(mock_user):
    with _patch_risk_summary(), _patch_risk_dist(), _patch_fin_summary():
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.get("/api/v1/executive/compliance-risk")
    assert resp.status_code == 200
    data = resp.json()
    assert "overall_compliance_risk" in data
    assert "frameworks" in data


# ─────────────────────────────────────────────────────────────────────────────
# Recommendations & Summary
# ─────────────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_recommendations(mock_user):
    with _patch_risk_summary(), _patch_risk_dist(), _patch_fin_summary():
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.get("/api/v1/executive/recommendations")
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data
    assert len(data["items"]) > 0
    item = data["items"][0]
    assert "title" in item
    assert "priority" in item
    assert "risk_impact" in item


@pytest.mark.asyncio
async def test_executive_summary(mock_user):
    with _patch_risk_summary(), _patch_risk_dist(), _patch_fin_summary():
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.get("/api/v1/executive/summary")
    assert resp.status_code == 200
    data = resp.json()
    assert "current_risk" in data
    assert "risk_level" in data
    assert "financial_exposure" in data
    assert "recommended_actions" in data


# ─────────────────────────────────────────────────────────────────────────────
# Forecast & Investments
# ─────────────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_forecast(mock_user):
    with _patch_risk_summary(), _patch_risk_dist(), _patch_fin_summary():
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.get("/api/v1/executive/forecast?period_days=90")
    assert resp.status_code == 200
    data = resp.json()
    assert "historical" in data
    assert "projected" in data
    assert "scenarios" in data
    for p in data["projected"]:
        assert p["is_projection"] is True


@pytest.mark.asyncio
async def test_security_investments(mock_user):
    with _patch_risk_summary(), _patch_risk_dist(), _patch_fin_summary():
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.get("/api/v1/executive/security-investments")
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data
    assert "total_investment" in data
    assert "total_loss_avoided" in data


# ─────────────────────────────────────────────────────────────────────────────
# Scenarios
# ─────────────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_run_what_if_scenario(mock_user):
    with _patch_risk_summary(), _patch_risk_dist(), _patch_fin_summary():
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            payload = {
                "name": "Test Scenario",
                "scenario_type": "remediation",
                "parameters": {"reduction_factor": 0.2, "cost": 50000},
            }
            resp = await client.post("/api/v1/executive/scenarios", json=payload)
    assert resp.status_code == 202
    data = resp.json()
    assert data["status"] == "completed"
    assert "current_state" in data
    assert "projected_state" in data
    assert data["projected_state"]["risk_reduction_pct"] > 0


# ─────────────────────────────────────────────────────────────────────────────
# Risk Acceptance
# ─────────────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_create_risk_acceptance(mock_user):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        payload = {
            "risk_id": str(uuid.uuid4()),
            "reason": "Low exploitability at this time",
            "business_justification": "Product launch deadline requires accepting this risk",
            "acceptance_duration_days": 90,
            "approver_id": str(uuid.uuid4()),
        }
        resp = await client.post("/api/v1/executive/risk-acceptance", json=payload)
    assert resp.status_code == 201
    data = resp.json()
    assert data["status"] == "PENDING"
    assert data["reason"] == payload["reason"]


@pytest.mark.asyncio
async def test_approve_risk_acceptance(mock_user):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        acc_id = str(uuid.uuid4())
        resp = await client.put(
            f"/api/v1/executive/risk-acceptance/{acc_id}/approve",
            json={"notes": "Approved after review"},
        )
    assert resp.status_code == 200
    assert resp.json()["status"] == "APPROVED"


@pytest.mark.asyncio
async def test_reject_risk_acceptance(mock_user):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        acc_id = str(uuid.uuid4())
        resp = await client.put(
            f"/api/v1/executive/risk-acceptance/{acc_id}/reject",
            json={"notes": "Risk is too high"},
        )
    assert resp.status_code == 200
    assert resp.json()["status"] == "REJECTED"


# ─────────────────────────────────────────────────────────────────────────────
# Report Schedules
# ─────────────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_create_and_list_schedule(mock_user):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        payload = {
            "report_name": "Weekly Executive Summary",
            "report_type": "executive_risk",
            "frequency": "weekly",
            "recipients": ["ciso@example.com", "ceo@example.com"],
        }
        create_resp = await client.post("/api/v1/reports/schedules", json=payload)
        assert create_resp.status_code == 201
        created = create_resp.json()
        assert created["frequency"] == "weekly"
        assert len(created["recipients"]) == 2

        list_resp = await client.get("/api/v1/reports/schedules")
        assert list_resp.status_code == 200
        schedules = list_resp.json()
        assert isinstance(schedules, list)
        assert any(s["id"] == created["id"] for s in schedules)


@pytest.mark.asyncio
async def test_delete_schedule(mock_user):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        payload = {
            "report_name": "To Be Deleted",
            "report_type": "vulnerability",
            "frequency": "daily",
            "recipients": ["sec@example.com"],
        }
        create_resp = await client.post("/api/v1/reports/schedules", json=payload)
        created = create_resp.json()

        del_resp = await client.delete(f"/api/v1/reports/schedules/{created['id']}")
        assert del_resp.status_code == 204


@pytest.mark.asyncio
async def test_report_history(mock_user):
    with patch(
        "app.services.reporting_service.ReportingService.list_report_jobs",
        return_value=[],
    ):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.get("/api/v1/reports/history")
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data
    assert "total" in data
