"""Tests for CSV import and export functionality."""
import pytest
from httpx import AsyncClient

from app.models.user import User


VALID_CSV = b"""name,asset_type,hostname,ip_address,operating_system,os_version,criticality,environment,internet_exposed,owner
Web Server,SERVER,csv-web-01,10.10.1.20,Ubuntu,22.04,CRITICAL,PRODUCTION,true,IT Ops
Database Server,DATABASE,csv-db-01,10.10.1.30,Ubuntu,22.04,HIGH,PRODUCTION,false,DBA Team
Dev Machine,LAPTOP,csv-dev-01,192.168.10.5,Windows,11,LOW,DEVELOPMENT,false,Developer
"""

MISSING_REQUIRED_CSV = b"""hostname,ip_address
web-only,10.0.0.1
"""

INVALID_ENUM_CSV = b"""name,asset_type,hostname,criticality,environment
Bad Asset,INVALID_TYPE,bad-host,CRITICAL,PRODUCTION
"""

INVALID_IP_CSV = b"""name,asset_type,hostname,ip_address,criticality,environment
IP Test,SERVER,ip-test-host,999.999.999.999,CRITICAL,PRODUCTION
"""

NEGATIVE_BV_CSV = b"""name,asset_type,hostname,criticality,environment,business_value
BV Asset,SERVER,bv-host-01,LOW,DEVELOPMENT,-5000
"""

PARTIAL_ERROR_CSV = b"""name,asset_type,hostname,ip_address,criticality,environment
Good Row,SERVER,good-host-01,10.1.1.1,HIGH,STAGING
Bad Row,INVALID_TYPE,bad-host,,CRITICAL,PRODUCTION
"""


@pytest.mark.asyncio
async def test_import_valid_csv(client: AsyncClient, analyst_headers: dict):
    response = await client.post(
        "/api/v1/assets/import",
        files={"file": ("assets.csv", VALID_CSV, "text/csv")},
        headers=analyst_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["total_rows"] == 3
    assert data["successful"] == 3
    assert data["failed"] == 0
    assert data["errors"] == []


@pytest.mark.asyncio
async def test_import_missing_required_headers(client: AsyncClient, analyst_headers: dict):
    response = await client.post(
        "/api/v1/assets/import",
        files={"file": ("bad.csv", MISSING_REQUIRED_CSV, "text/csv")},
        headers=analyst_headers,
    )
    assert response.status_code == 400
    assert response.json()["error_code"] == "CSV_PARSE_ERROR"


@pytest.mark.asyncio
async def test_import_invalid_enum(client: AsyncClient, analyst_headers: dict):
    response = await client.post(
        "/api/v1/assets/import",
        files={"file": ("enum.csv", INVALID_ENUM_CSV, "text/csv")},
        headers=analyst_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["failed"] == 1
    assert any("Invalid asset_type" in err["message"] for err in data["errors"])


@pytest.mark.asyncio
async def test_import_invalid_ip(client: AsyncClient, analyst_headers: dict):
    response = await client.post(
        "/api/v1/assets/import",
        files={"file": ("ip.csv", INVALID_IP_CSV, "text/csv")},
        headers=analyst_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["failed"] == 1
    assert any("valid IP" in err["message"] for err in data["errors"])


@pytest.mark.asyncio
async def test_import_negative_business_value(client: AsyncClient, analyst_headers: dict):
    response = await client.post(
        "/api/v1/assets/import",
        files={"file": ("bv.csv", NEGATIVE_BV_CSV, "text/csv")},
        headers=analyst_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["failed"] == 1
    assert any("negative" in err["message"] for err in data["errors"])


@pytest.mark.asyncio
async def test_import_partial_errors(client: AsyncClient, analyst_headers: dict):
    """Some rows succeed, some fail — partial import is acceptable."""
    response = await client.post(
        "/api/v1/assets/import",
        files={"file": ("partial.csv", PARTIAL_ERROR_CSV, "text/csv")},
        headers=analyst_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["total_rows"] == 2
    assert data["successful"] == 1
    assert data["failed"] == 1


@pytest.mark.asyncio
async def test_import_viewer_forbidden(client: AsyncClient, viewer_headers: dict):
    response = await client.post(
        "/api/v1/assets/import",
        files={"file": ("assets.csv", VALID_CSV, "text/csv")},
        headers=viewer_headers,
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_import_invalid_file_type(client: AsyncClient, analyst_headers: dict):
    fake_exe = b"MZ\x90\x00\x03\x00\x00\x00"  # fake exe header
    response = await client.post(
        "/api/v1/assets/import",
        files={"file": ("malware.exe", fake_exe, "application/octet-stream")},
        headers=analyst_headers,
    )
    assert response.status_code == 400
    assert response.json()["error_code"] == "INVALID_FILE_TYPE"


@pytest.mark.asyncio
async def test_import_oversized_file(client: AsyncClient, analyst_headers: dict):
    """File larger than 10 MB should be rejected."""
    large_csv = b"name,asset_type,criticality,environment\n"
    large_csv += b"A" * (11 * 1024 * 1024)  # 11MB of junk
    response = await client.post(
        "/api/v1/assets/import",
        files={"file": ("large.csv", large_csv, "text/csv")},
        headers=analyst_headers,
    )
    # Either 400 (CSV_PARSE_ERROR) or 413 is acceptable
    assert response.status_code in (400, 413)


@pytest.mark.asyncio
async def test_export_returns_csv(client: AsyncClient, analyst_headers: dict):
    # Create an asset first
    await client.post(
        "/api/v1/assets",
        json={
            "name": "Export Test Asset",
            "asset_type": "SERVER",
            "hostname": "export-host-01",
            "environment": "PRODUCTION",
            "criticality": "HIGH",
        },
        headers=analyst_headers,
    )
    response = await client.get("/api/v1/assets/export", headers=analyst_headers)
    assert response.status_code == 200
    assert "text/csv" in response.headers.get("content-type", "")
    csv_content = response.text
    assert "Export Test Asset" in csv_content
    assert "name" in csv_content  # header row present


@pytest.mark.asyncio
async def test_export_only_own_org(
    client: AsyncClient,
    analyst_headers: dict,
    other_org_headers: dict,
):
    await client.post(
        "/api/v1/assets",
        json={"name": "Org A Asset", "asset_type": "SERVER", "hostname": "org-a-host",
              "environment": "PRODUCTION", "criticality": "LOW"},
        headers=analyst_headers,
    )
    await client.post(
        "/api/v1/assets",
        json={"name": "Org B Asset", "asset_type": "DATABASE", "hostname": "org-b-host",
              "environment": "PRODUCTION", "criticality": "LOW"},
        headers=other_org_headers,
    )
    response = await client.get("/api/v1/assets/export", headers=analyst_headers)
    assert "Org A Asset" in response.text
    assert "Org B Asset" not in response.text
