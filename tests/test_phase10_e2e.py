"""End-to-end full incident response, SOAR playbook execution & recovery lifecycle test (Phase 10)."""
import pytest
from httpx import AsyncClient, ASGITransport
from datetime import datetime, timezone
import uuid

from app.main import app
from app.core.dependencies import get_current_user
from app.models.user import User


@pytest.fixture
def mock_soc_commander():
    user = User(
        id=uuid.uuid4(),
        email="soc_commander@enterprise.com",
        full_name="SOC Commander",
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
async def test_full_phase10_detection_to_response_recovery_lifecycle(mock_soc_commander):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Step 1: Open SOC Dashboard & Check Operational Telemetry
        dash_res = await client.get("/api/v1/soc/dashboard")
        assert dash_res.status_code == 200
        assert dash_res.json()["open_incidents"] > 0

        # Step 2: Analyst Performs Incident Triage
        triage_res = await client.post(
            "/api/v1/soc/incidents/inc-001/triage",
            json={
                "decision": "CONFIRMED",
                "reason": "Observed automated lateral movement attempt towards core DB.",
                "assigned_to": "Sarah Chen",
                "severity": "CRITICAL",
            },
        )
        assert triage_res.status_code == 200
        assert triage_res.json()["status"] == "INVESTIGATING"

        # Step 3: Record Forensic Notes
        note_res = await client.post(
            "/api/v1/soc/incidents/inc-001/notes",
            json={
                "note_type": "FINDING",
                "content": "Attacker exfiltrated encrypted archive staging to /tmp/dump.tar.gz before interface severed.",
            },
        )
        assert note_res.status_code == 201

        # Step 4: Dispatch Response Playbook
        exec_res = await client.post(
            "/api/v1/playbooks/pb-ransomware-01/execute",
            json={"incident_id": "inc-001", "dry_run": False},
        )
        assert exec_res.status_code == 200
        exec_data = exec_res.json()
        exec_id = exec_data["execution_id"]

        # Step 5: Process High-Risk Approval
        approvals = (await client.get("/api/v1/approvals/")).json()
        target_appr = approvals[0]
        appr_res = await client.post(
            f"/api/v1/approvals/{target_appr['id']}/action",
            json={
                "decision": "APPROVE",
                "justification": "Authorized emergency isolation of compromised DMZ host.",
                "confirmed_destructive_risk": True,
            },
        )
        assert appr_res.status_code == 200

        # Step 6: Step Retry / Execution Verification
        retry_res = await client.post(
            f"/api/v1/response-executions/{exec_id}/retry",
            json={"step_id": "step-02", "force_override": True},
        )
        assert retry_res.status_code == 200

        # Step 7: Automated Remediation Verification & Risk Recalculation
        rems = (await client.get("/api/v1/soc-remediations/")).json()
        verify_res = await client.post(
            f"/api/v1/soc-remediations/{rems[0]['id']}/verify",
            json={"verifier_notes": "Applied KB99201 update and confirmed 0 active beacon sessions."},
        )
        assert verify_res.status_code == 200
        verify_data = verify_res.json()
        assert verify_data["threat_cleared"] is True
        assert verify_data["financial_exposure_after"] < verify_data["financial_exposure_before"]

        # Step 8: Post-Incident Review & Root Cause Analysis
        review_res = await client.post(
            "/api/v1/soc/incidents/inc-001/review",
            json={
                "root_cause_category": "Vulnerability",
                "root_cause_description": "CVE-2024-3400 unauthenticated PAN-OS gateway buffer overflow.",
                "contributing_factors": ["Missing emergency patch", "Direct DMZ internet exposure"],
                "affected_controls": ["NIST PR.IP-1"],
                "lessons_learned": "Enforce automated patch validation and egress inspection.",
                "corrective_actions": ["Deploy microsegmentation rule"],
            },
        )
        assert review_res.status_code == 200

        # Step 9: Stakeholder Communication
        comm_res = await client.post(
            "/api/v1/soc/incidents/inc-001/communications",
            json={
                "communication_type": "EXECUTIVE_BRIEF",
                "subject": "Incident INC-2026-089 Post-Remediation Status",
                "message": "Incident successfully contained and remediated. Financial exposure reduced from $2.8M to $450K.",
                "recipients": ["ciso@enterprise.com", "board-risk@enterprise.com"],
            },
        )
        assert comm_res.status_code == 200
