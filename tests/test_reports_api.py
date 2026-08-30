"""Tests for Report Generation and Export REST endpoints (Phase 9)."""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token
from app.models.organization import Organization
from app.models.user import User


@pytest.mark.asyncio
async def test_executive_report_generation_lifecycle(
    client: AsyncClient,
    db_session: AsyncSession,
    test_org: Organization,
    admin_user: User,
):
    token = create_access_token(data={"sub": str(admin_user.id)})
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Test direct document endpoint
    doc_res = await client.get("/api/v1/reports/executive-document", headers=headers)
    assert doc_res.status_code == 200
    doc = doc_res.json()
    assert doc["organization_name"] == test_org.name
    assert "section_1_executive_summary" in doc
    assert "section_2_overall_cyber_risk" in doc
    assert "section_3_financial_risk" in doc
    assert "section_12_methodology" in doc

    # 2. Trigger Async JSON Report Compilation
    json_req = {
        "report_type": "EXECUTIVE_RISK",
        "period": "30d",
        "format": "JSON",
    }
    create_res = await client.post("/api/v1/reports", json=json_req, headers=headers)
    assert create_res.status_code == 202
    job_data = create_res.json()
    job_id = job_data["id"]
    assert job_data["status"] in ("QUEUED", "COMPLETED")

    # 3. Retrieve Report Job Status
    job_res = await client.get(f"/api/v1/reports/{job_id}", headers=headers)
    assert job_res.status_code == 200
    res_data = job_res.json()
    assert res_data["status"] == "COMPLETED"
    assert res_data["file_path"] is not None

    # 4. Download Report File
    dl_res = await client.get(f"/api/v1/reports/{job_id}/download", headers=headers)
    assert dl_res.status_code == 200
    assert len(dl_res.content) > 0


@pytest.mark.asyncio
async def test_csv_report_generation(
    client: AsyncClient,
    db_session: AsyncSession,
    test_org: Organization,
    admin_user: User,
):
    token = create_access_token(data={"sub": str(admin_user.id)})
    headers = {"Authorization": f"Bearer {token}"}

    csv_req = {
        "report_type": "FINANCIAL_RISK",
        "period": "30d",
        "format": "CSV",
    }
    create_res = await client.post("/api/v1/reports", json=csv_req, headers=headers)
    assert create_res.status_code == 202
    job_id = create_res.json()["id"]

    # Download CSV
    dl_res = await client.get(f"/api/v1/reports/{job_id}/download", headers=headers)
    assert dl_res.status_code == 200
    assert "Executive Summary" in dl_res.text
