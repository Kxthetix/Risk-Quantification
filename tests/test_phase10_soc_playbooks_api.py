"""Automated test suite for Phase 10: SOC, Playbooks, Approvals, Executions & Cases API."""
import pytest
from httpx import AsyncClient, ASGITransport
from datetime import datetime, timezone
import uuid

from app.main import app
from app.core.dependencies import get_current_user
from app.models.user import User


@pytest.fixture
def mock_user():
    user = User(
        id=uuid.uuid4(),
        email="soc_lead@enterprise.com",
        full_name="SOC Commander Lead",
        password_hash="dummy_hash",
        role="ADMIN",
        is_active=True,
        organization_id=uuid.uuid4(),
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    app.dependency_overrides[get_current_user] = lambda: user
    yield user
    app.dependency_overrides.pop(get_current_user, None)


@pytest.mark.asyncio
async def test_soc_dashboard_and_metrics_endpoints(mock_user):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Dashboard
        dash_res = await client.get("/api/v1/soc/dashboard")
        assert dash_res.status_code == 200
        dash_data = dash_res.json()
        assert "critical_alerts" in dash_data
        assert "open_incidents" in dash_data
        assert "financial_exposure" in dash_data
        assert len(dash_data["recent_timeline"]) > 0

        # Metrics
        metrics_res = await client.get("/api/v1/soc/metrics")
        assert metrics_res.status_code == 200
        metrics_data = metrics_res.json()
        assert "mttd_minutes" in metrics_data
        assert "mtta_minutes" in metrics_data
        assert "mttc_minutes" in metrics_data
        assert "mttr_minutes" in metrics_data
        assert metrics_data["playbook_success_rate_pct"] > 0

        # Trends
        trends_res = await client.get("/api/v1/soc/trends?period=30d")
        assert trends_res.status_code == 200
        trends_data = trends_res.json()
        assert len(trends_data["trends"]) > 0

        # Risk Map
        risk_map_res = await client.get("/api/v1/soc/risk-map")
        assert risk_map_res.status_code == 200
        assert len(risk_map_res.json()["items"]) > 0


@pytest.mark.asyncio
async def test_soc_incident_triage_investigation_and_tasks(mock_user):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Triage
        triage_payload = {
            "decision": "CONFIRMED",
            "reason": "Confirmed Cobalt Strike beacon signature match",
            "assigned_to": "Marcus Vance",
            "severity": "CRITICAL",
        }
        triage_res = await client.post("/api/v1/soc/incidents/inc-001/triage", json=triage_payload)
        assert triage_res.status_code == 200
        triage_data = triage_res.json()
        assert triage_data["decision"] == "CONFIRMED"
        assert triage_data["status"] == "INVESTIGATING"

        # Assignment
        assign_payload = {
            "assigned_to": "Sarah Chen",
            "assigned_team": "SOC Tier 2",
            "role": "INCIDENT_COMMANDER",
        }
        assign_res = await client.post("/api/v1/soc/incidents/inc-001/assign", json=assign_payload)
        assert assign_res.status_code == 200
        assert assign_res.json()["status"] == "ASSIGNED"

        # Add Investigation Note
        note_payload = {
            "note_type": "FINDING",
            "content": "Malicious DLL sideloading detected in `C:\\ProgramData\\update.dll`.",
        }
        note_res = await client.post("/api/v1/soc/incidents/inc-001/notes", json=note_payload)
        assert note_res.status_code == 201
        assert note_res.json()["note_type"] == "FINDING"

        # Get Notes
        notes_res = await client.get("/api/v1/soc/incidents/inc-001/notes")
        assert notes_res.status_code == 200
        assert len(notes_res.json()) >= 1

        # Post-Incident Review
        review_payload = {
            "root_cause_category": "Vulnerability",
            "root_cause_description": "CVE-2024-3400 unauthenticated PAN-OS gateway buffer overflow.",
            "contributing_factors": ["Missing emergency patch"],
            "affected_controls": ["NIST PR.IP-1"],
            "lessons_learned": "Automate patch staging for edge security appliances.",
            "corrective_actions": ["Deploy microsegmentation rule"],
        }
        review_res = await client.post("/api/v1/soc/incidents/inc-001/review", json=review_payload)
        assert review_res.status_code == 200
        assert review_res.json()["root_cause_category"] == "Vulnerability"

        # Communication
        comm_payload = {
            "communication_type": "INTERNAL_UPDATE",
            "subject": "Critical Incident INC-2026-089 Contained",
            "message": "Gateway node successfully isolated; no database traversal detected.",
            "recipients": ["executive-team@enterprise.com"],
        }
        comm_res = await client.post("/api/v1/soc/incidents/inc-001/communications", json=comm_payload)
        assert comm_res.status_code == 200

        # Graph
        graph_res = await client.get("/api/v1/soc/incidents/inc-001/relationship-graph")
        assert graph_res.status_code == 200
        assert len(graph_res.json()["nodes"]) > 0
        assert len(graph_res.json()["edges"]) > 0

        # Tasks
        task_res = await client.get("/api/v1/soc/tasks")
        assert task_res.status_code == 200

        new_task = await client.post(
            "/api/v1/soc/tasks",
            json={"incident_id": "inc-001", "task": "Rotate edge SSL certificate", "owner": "Marcus Vance"},
        )
        assert new_task.status_code == 201


@pytest.mark.asyncio
async def test_playbooks_executions_approvals_and_cases(mock_user):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Playbooks list
        pb_res = await client.get("/api/v1/playbooks/")
        assert pb_res.status_code == 200
        pbs = pb_res.json()
        assert len(pbs) >= 3

        # Playbook detail
        pb_detail = await client.get("/api/v1/playbooks/pb-ransomware-01")
        assert pb_detail.status_code == 200
        assert len(pb_detail.json()["steps"]) >= 4

        # Execute Playbook (Dry Run)
        exec_dry = await client.post(
            "/api/v1/playbooks/pb-ransomware-01/execute",
            json={"incident_id": "inc-001", "dry_run": True},
        )
        assert exec_dry.status_code == 200
        dry_data = exec_dry.json()
        assert dry_data["dry_run"] is True
        assert dry_data["status"] == "SUCCEEDED"

        # Execute Playbook (Live Execution)
        exec_live = await client.post(
            "/api/v1/playbooks/pb-ransomware-01/execute",
            json={"incident_id": "inc-001", "dry_run": False},
        )
        assert exec_live.status_code == 200
        live_data = exec_live.json()
        assert "execution_id" in live_data

        # Get execution detail
        exec_get = await client.get(f"/api/v1/response-executions/{live_data['execution_id']}")
        assert exec_get.status_code == 200

        # Approvals list
        appr_res = await client.get("/api/v1/approvals/")
        assert appr_res.status_code == 200
        apprs = appr_res.json()
        assert len(apprs) >= 1

        # Approve action
        first_appr_id = apprs[0]["id"]
        appr_action = await client.post(
            f"/api/v1/approvals/{first_appr_id}/action",
            json={
                "decision": "APPROVE",
                "justification": "Approved isolation of DMZ node during active intrusion incident.",
                "confirmed_destructive_risk": True,
            },
        )
        assert appr_action.status_code == 200
        assert appr_action.json()["status"] == "APPROVED"

        # Cases list & detail
        cases_res = await client.get("/api/v1/cases/")
        assert cases_res.status_code == 200
        cases = cases_res.json()
        assert len(cases) >= 1

        case_detail = await client.get(f"/api/v1/cases/{cases[0]['id']}")
        assert case_detail.status_code == 200
        assert "linked_incidents" in case_detail.json()

        # SOC Remediations
        rem_res = await client.get("/api/v1/soc-remediations/")
        assert rem_res.status_code == 200
        rems = rem_res.json()
        assert len(rems) >= 1

        rem_verify = await client.post(
            f"/api/v1/soc-remediations/{rems[0]['id']}/verify",
            json={"verifier_notes": "Live network vulnerability re-scan passed with zero findings."},
        )
        assert rem_verify.status_code == 200
        assert rem_verify.json()["threat_cleared"] is True
