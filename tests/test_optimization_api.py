"""Integration tests for Phase 8 Controls & Investment Optimization APIs."""
import uuid
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token
from app.models.enums import ControlType, RemediationPriorityLevel, RemediationStatus, RemediationType
from app.models.organization import Organization
from app.models.remediation import Remediation
from app.models.user import User


@pytest.mark.asyncio
async def test_controls_api_crud_and_seed(
    client: AsyncClient,
    db_session: AsyncSession,
    test_org: Organization,
    admin_user: User,
):
    """Test creating, listing, updating, and seeding defensive security controls."""
    token = create_access_token(data={"sub": str(admin_user.id)})
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Seed defaults
    seed_res = await client.post("/api/v1/controls/seed-defaults", headers=headers)
    assert seed_res.status_code == 200
    controls = seed_res.json()
    assert len(controls) >= 4

    # 2. List controls
    list_res = await client.get("/api/v1/controls", headers=headers)
    assert list_res.status_code == 200
    assert len(list_res.json()) >= 4

    # 3. Create a custom control
    create_res = await client.post(
        "/api/v1/controls",
        json={
            "name": "Privileged Access Management (CyberArk PAM)",
            "control_type": "PAM",
            "description": "Vaults domain admin credentials with session recording.",
            "implementation_cost": 500000.0,
            "annual_cost": 120000.0,
            "effectiveness": 0.90,
            "effectiveness_mappings": [
                {
                    "threat_type": "CREDENTIAL_THEFT",
                    "risk_factor": "EXPLOITATION_LIKELIHOOD",
                    "reduction_factor": 0.90,
                }
            ],
        },
        headers=headers,
    )
    assert create_res.status_code == 201
    pam_ctrl = create_res.json()
    assert pam_ctrl["name"] == "Privileged Access Management (CyberArk PAM)"
    assert len(pam_ctrl["effectiveness_mappings"]) == 1


@pytest.mark.asyncio
async def test_optimization_run_what_if_and_budget_curve(
    client: AsyncClient,
    db_session: AsyncSession,
    test_org: Organization,
    admin_user: User,
):
    """Test optimization execution, what-if analysis, budget curve, and executive summary."""
    token = create_access_token(data={"sub": str(admin_user.id)})
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Create a set of remediations
    rem1 = Remediation(
        organization_id=test_org.id,
        title="Patch Critical SQL Injection",
        remediation_type=RemediationType.PATCH,
        status=RemediationStatus.OPEN,
        priority_score=95.0,
        estimated_cost=50000.0,
        expected_loss_reduction=2500000.0,
        risk_reduction=40.0,
    )
    rem2 = Remediation(
        organization_id=test_org.id,
        title="Migrate Web API to Isolated VLAN",
        remediation_type=RemediationType.NETWORK_SEGMENTATION,
        status=RemediationStatus.OPEN,
        priority_score=85.0,
        estimated_cost=150000.0,
        expected_loss_reduction=3000000.0,
        risk_reduction=35.0,
    )
    rem3 = Remediation(
        organization_id=test_org.id,
        title="Upgrade Legacy Database Engine",
        remediation_type=RemediationType.UPGRADE,
        status=RemediationStatus.OPEN,
        priority_score=70.0,
        estimated_cost=300000.0,
        expected_loss_reduction=1200000.0,
        risk_reduction=20.0,
    )
    db_session.add_all([rem1, rem2, rem3])
    await db_session.commit()

    # 2. Run Optimization via API
    opt_res = await client.post(
        "/api/v1/optimization/run",
        json={"budget": 200000.0, "algorithm": "KNAPSACK", "horizon_years": 1},
        headers=headers,
    )
    assert opt_res.status_code == 200
    opt_data = opt_res.json()
    assert opt_data["budget"] == 200000.0
    assert opt_data["total_cost"] <= 200000.0
    assert opt_data["expected_loss_reduction"] >= 2500000.0
    assert opt_data["roi"] > 0
    assert len(opt_data["selected_actions"]) >= 1

    # 3. Run What-If Simulation
    whatif_res = await client.post(
        "/api/v1/optimization/what-if",
        json={"remediation_ids": [str(rem1.id), str(rem2.id)], "horizon_years": 1},
        headers=headers,
    )
    assert whatif_res.status_code == 200
    whatif_data = whatif_res.json()
    assert whatif_data["investment"] == 200000.0
    assert whatif_data["risk_reduction"] >= 5000000.0

    # 4. Strategic Alternatives
    alt_res = await client.get("/api/v1/optimization/alternatives?budget=300000.0", headers=headers)
    assert alt_res.status_code == 200
    alts = alt_res.json()["alternatives"]
    assert len(alts) == 4

    # 5. Budget Curve
    curve_res = await client.get("/api/v1/optimization/budget-curve?max_budget=1000000.0&steps=5", headers=headers)
    assert curve_res.status_code == 200
    curve_data = curve_res.json()
    assert len(curve_data["points"]) == 5

    # 6. Executive Summary
    exec_res = await client.get("/api/v1/optimization/executive-summary", headers=headers)
    assert exec_res.status_code == 200
    exec_data = exec_res.json()
    assert exec_data["security_investment"] >= 0.0
    assert exec_data["top_recommended_action"] is not None
