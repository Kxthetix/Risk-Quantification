"""Phase 11 – End-to-End Executive, Reports & Scenarios Flow."""
import pytest
from httpx import AsyncClient, ASGITransport
from datetime import datetime, timezone
import uuid
from unittest.mock import AsyncMock, patch

from app.main import app
from app.core.dependencies import get_current_user
from app.models.user import User


@pytest.fixture
def mock_user():
    user = User(
        id=uuid.uuid4(),
        email="ciso@enterprise.com",
        full_name="Chief Information Security Officer",
        password_hash="dummy_hash",
        role="ADMIN",
        is_active=True,
        organization_id=uuid.uuid4(),
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    app.dependency_overrides[get_current_user] = lambda: user
    # Provide a no-op async db session mock
    from app.core.database import get_db
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

from app.models.report_job import ReportJob
from app.models.enums import ReportStatus, ReportFormat, ReportType

async def mock_create_report_job(db, organization_id, user, payload):
    return ReportJob(
        id=uuid.uuid4(),
        organization_id=organization_id,
        user_id=user.id,
        report_type=payload.report_type,
        period=payload.period,
        report_format=payload.format,
        status=ReportStatus.QUEUED,
        created_at=datetime.now(timezone.utc),
    )

async def mock_process_report_job(db, job_id):
    return ReportJob(
        id=job_id,
        organization_id=uuid.uuid4(),
        user_id=uuid.uuid4(),
        report_type=ReportType.EXECUTIVE_RISK,
        period="30d",
        report_format=ReportFormat.JSON,
        status=ReportStatus.COMPLETED,
        created_at=datetime.now(timezone.utc),
    )

async def mock_list_report_jobs(db, organization_id, page=1, page_size=20):
    return [
        ReportJob(
            id=uuid.uuid4(),
            organization_id=organization_id,
            user_id=uuid.uuid4(),
            report_type=ReportType.EXECUTIVE_RISK,
            period="30d",
            report_format=ReportFormat.JSON,
            status=ReportStatus.COMPLETED,
            created_at=datetime.now(timezone.utc),
        )
    ]

_patch_create_job = lambda: patch(
    "app.services.reporting_service.ReportingService.create_report_job",
    side_effect=mock_create_report_job,
)
_patch_process_job = lambda: patch(
    "app.services.reporting_service.ReportingService.process_report_job",
    side_effect=mock_process_report_job,
)
_patch_list_jobs = lambda: patch(
    "app.services.reporting_service.ReportingService.list_report_jobs",
    side_effect=mock_list_report_jobs,
)


@pytest.fixture
def unauth_app():
    """Reset dependency override so auth fails."""
    app.dependency_overrides.pop(get_current_user, None)
    yield
    app.dependency_overrides.pop(get_current_user, None)


@pytest.mark.asyncio
async def test_full_executive_workflow(mock_user):
    """
    Full e2e: dashboard → KPIs → trend → financial risk →
    loss distribution → top risks → recommendations →
    summary → forecast → scenario → report.
    """
    with _patch_risk_summary(), _patch_risk_dist(), _patch_fin_summary(), _patch_top_risks(), \
         _patch_create_job(), _patch_process_job(), _patch_list_jobs():
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            # 1. Executive dashboard
            dash = await client.get("/api/v1/executive/dashboard")
            assert dash.status_code == 200

            dashboard = dash.json()
            assert dashboard["risk_score"]["current_score"] >= 0
            assert dashboard["financial"]["expected_annual_loss"] >= 0

            # 2. KPIs
            kpis = await client.get("/api/v1/executive/kpis")
            assert kpis.status_code == 200
            assert len(kpis.json()) >= 5

            # 3. Risk trend (30 days)
            trend = await client.get("/api/v1/executive/risk-trend?period_days=30")
            assert trend.status_code == 200
            assert trend.json()["period_days"] == 30

            # 4. Financial risk
            fin = await client.get("/api/v1/executive/financial-risk")
            assert fin.status_code == 200
            assert fin.json()["current_exposure"] >= 0

            # 5. Loss distribution (Monte Carlo)
            dist = await client.get("/api/v1/executive/loss-distribution")
            assert dist.status_code == 200
            pcts = {p["percentile"] for p in dist.json()["percentiles"]}
            assert {"P50", "P90", "P99"}.issubset(pcts)

            # 6. Top risks drilldown
            risks = await client.get("/api/v1/executive/top-risks?limit=5")
            assert risks.status_code == 200

            # 7. Recommendations
            recs = await client.get("/api/v1/executive/recommendations")
            assert recs.status_code == 200
            assert len(recs.json()["items"]) > 0

            # 8. Executive summary
            summary = await client.get("/api/v1/executive/summary")
            assert summary.status_code == 200
            assert summary.json()["narrative"] is not None

            # 9. Forecast
            forecast = await client.get("/api/v1/executive/forecast?period_days=90")
            assert forecast.status_code == 200
            forecast_data = forecast.json()
            assert len(forecast_data["projected"]) == 90
            assert len(forecast_data["scenarios"]) == 3

            # 10. What-if scenario
            scenario = await client.post(
                "/api/v1/executive/scenarios",
                json={
                    "name": "Patch Critical Vulns",
                    "scenario_type": "remediation",
                    "parameters": {"reduction_factor": 0.25, "cost": 40000},
                },
            )
            assert scenario.status_code == 202
            scenario_data = scenario.json()
            assert scenario_data["projected_state"]["risk_score"] < scenario_data["current_state"]["risk_score"]

            # 11. Generate report
            report = await client.post(
                "/api/v1/reports",
                json={"report_type": "EXECUTIVE_RISK", "period": "30d", "format": "JSON"},
            )
            assert report.status_code == 202
            assert "id" in report.json()

            # 12. List reports
            list_r = await client.get("/api/v1/reports")
            assert list_r.status_code == 200

            # 13. Report history
            hist = await client.get("/api/v1/reports/history")
            assert hist.status_code == 200
            assert "items" in hist.json()


@pytest.mark.asyncio
async def test_executive_requires_auth(unauth_app):
    """Unauthenticated requests should be rejected."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.get("/api/v1/executive/dashboard")
        assert resp.status_code == 401


@pytest.mark.asyncio
async def test_kpis_require_auth(unauth_app):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.get("/api/v1/executive/kpis")
        assert resp.status_code == 401


@pytest.mark.asyncio
async def test_scenarios_require_auth(unauth_app):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.post(
            "/api/v1/executive/scenarios",
            json={"name": "x", "scenario_type": "remediation", "parameters": {}},
        )
        assert resp.status_code == 401


@pytest.mark.asyncio
async def test_schedule_lifecycle(mock_user):
    """Report schedule lifecycle: create → update → delete."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Create
        create = await client.post(
            "/api/v1/reports/schedules",
            json={
                "report_name": "Monthly Board Report",
                "report_type": "executive_risk",
                "frequency": "monthly",
                "recipients": ["board@corp.com"],
            },
        )
        assert create.status_code == 201
        schedule_id = create.json()["id"]

        # Update frequency
        update = await client.put(
            f"/api/v1/reports/schedules/{schedule_id}",
            json={"frequency": "weekly"},
        )
        assert update.status_code == 200
        assert update.json()["frequency"] == "weekly"

        # Delete
        delete = await client.delete(f"/api/v1/reports/schedules/{schedule_id}")
        assert delete.status_code == 204

        # Verify removed from listing
        list_r = await client.get("/api/v1/reports/schedules")
        assert schedule_id not in [s["id"] for s in list_r.json()]
