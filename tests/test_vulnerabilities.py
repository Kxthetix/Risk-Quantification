"""Tests for Vulnerability intelligence, search, filtering, and dashboard statistics."""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import ExploitAvailability, VulnerabilitySeverity
from app.services.vulnerability_service import vulnerability_service

SAMPLE_CVE_PAYLOAD_1 = {
    "cve_id": "CVE-2021-41773",
    "description": "Path traversal in Apache HTTP Server 2.4.49",
    "source": "NVD",
    "severity": VulnerabilitySeverity.HIGH,
    "cvss_score": 7.5,
    "cvss_version": "3.1",
    "cvss_vector": "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:N/A:N",
    "attack_vector": "NETWORK",
    "exploit_available": ExploitAvailability.YES,
    "known_exploited": True,
    "cwe_id": "CWE-22",
    "cwes": ["CWE-22"],
    "cpe_matches": [
        {
            "cpe_string": "cpe:2.3:a:apache:http_server:2.4.49:*:*:*:*:*:*:*",
            "vulnerable": True,
            "criteria": "cpe:2.3:a:apache:http_server:2.4.49:*:*:*:*:*:*:*",
        }
    ],
    "references": [{"url": "https://httpd.apache.org/security/vulnerabilities_24.html"}],
}

SAMPLE_CVE_PAYLOAD_2 = {
    "cve_id": "CVE-2021-44228",
    "description": "Log4j JNDI remote code execution vulnerability (Log4Shell)",
    "source": "NVD",
    "severity": VulnerabilitySeverity.CRITICAL,
    "cvss_score": 10.0,
    "cvss_version": "3.1",
    "cvss_vector": "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H",
    "attack_vector": "NETWORK",
    "exploit_available": ExploitAvailability.YES,
    "known_exploited": True,
    "cwe_id": "CWE-502",
    "cwes": ["CWE-502"],
    "cpe_matches": [
        {
            "cpe_string": "cpe:2.3:a:apache:log4j:2.14.1:*:*:*:*:*:*:*",
            "vulnerable": True,
            "criteria": "cpe:2.3:a:apache:log4j:2.14.1:*:*:*:*:*:*:*",
        }
    ],
    "references": [{"url": "https://logging.apache.org/log4j/2.x/security.html"}],
}


@pytest.mark.asyncio
async def test_upsert_and_deduplicate_cve(db_session: AsyncSession):
    # 1. First insert
    vuln1, is_created1 = await vulnerability_service.upsert_from_nvd(db_session, SAMPLE_CVE_PAYLOAD_1)
    assert is_created1 is True
    assert vuln1.cve_id == "CVE-2021-41773"

    # 2. Second upsert with same CVE_ID should update without duplication
    vuln2, is_created2 = await vulnerability_service.upsert_from_nvd(db_session, {
        **SAMPLE_CVE_PAYLOAD_1,
        "description": "Updated description for Apache path traversal",
    })
    assert is_created2 is False
    assert vuln2.id == vuln1.id
    assert vuln2.description == "Updated description for Apache path traversal"


@pytest.mark.asyncio
async def test_get_vulnerability_by_cve_id(client: AsyncClient, viewer_headers: dict, db_session: AsyncSession):
    await vulnerability_service.upsert_from_nvd(db_session, SAMPLE_CVE_PAYLOAD_1)

    response = await client.get("/api/v1/vulnerabilities/CVE-2021-41773", headers=viewer_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["cve_id"] == "CVE-2021-41773"
    assert data["severity"] == "HIGH"
    assert data["cvss_score"] == 7.5
    assert len(data["affected_cpes"]) >= 1
    assert len(data["cwes"]) >= 1
    assert data["cwes"][0]["cwe_id"] == "CWE-22"


@pytest.mark.asyncio
async def test_get_vulnerability_not_found(client: AsyncClient, viewer_headers: dict):
    response = await client.get("/api/v1/vulnerabilities/CVE-9999-99999", headers=viewer_headers)
    assert response.status_code == 404
    assert response.json()["error_code"] == "VULNERABILITY_NOT_FOUND"


@pytest.mark.asyncio
async def test_list_vulnerabilities_filtering(client: AsyncClient, viewer_headers: dict, db_session: AsyncSession):
    await vulnerability_service.upsert_from_nvd(db_session, SAMPLE_CVE_PAYLOAD_1)
    await vulnerability_service.upsert_from_nvd(db_session, SAMPLE_CVE_PAYLOAD_2)

    # 1. Filter by severity=CRITICAL
    resp = await client.get("/api/v1/vulnerabilities?severity=CRITICAL", headers=viewer_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 1
    assert data["items"][0]["cve_id"] == "CVE-2021-44228"

    # 2. Filter by cvss_min=8.0
    resp2 = await client.get("/api/v1/vulnerabilities?cvss_min=8.0", headers=viewer_headers)
    assert resp2.status_code == 200
    assert resp2.json()["total"] == 1

    # 3. Filter by known_exploited=true
    resp3 = await client.get("/api/v1/vulnerabilities?known_exploited=true", headers=viewer_headers)
    assert resp3.status_code == 200
    assert resp3.json()["total"] == 2


@pytest.mark.asyncio
async def test_search_vulnerabilities(client: AsyncClient, viewer_headers: dict, db_session: AsyncSession):
    await vulnerability_service.upsert_from_nvd(db_session, SAMPLE_CVE_PAYLOAD_1)
    await vulnerability_service.upsert_from_nvd(db_session, SAMPLE_CVE_PAYLOAD_2)

    # Search for Log4Shell
    resp = await client.get("/api/v1/vulnerabilities/search?q=Log4Shell", headers=viewer_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 1
    assert data["items"][0]["cve_id"] == "CVE-2021-44228"


@pytest.mark.asyncio
async def test_vulnerability_statistics(client: AsyncClient, viewer_headers: dict, db_session: AsyncSession):
    await vulnerability_service.upsert_from_nvd(db_session, SAMPLE_CVE_PAYLOAD_1)
    await vulnerability_service.upsert_from_nvd(db_session, SAMPLE_CVE_PAYLOAD_2)

    resp = await client.get("/api/v1/vulnerabilities/statistics", headers=viewer_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_vulnerabilities"] >= 2
    assert data["critical"] >= 1
    assert data["high"] >= 1
    assert data["known_exploited"] >= 2
    assert "organization_affected_assets" in data
    assert "organization_open_vulnerabilities" in data


@pytest.mark.asyncio
async def test_cve_router_alias(client: AsyncClient, viewer_headers: dict, db_session: AsyncSession):
    await vulnerability_service.upsert_from_nvd(db_session, SAMPLE_CVE_PAYLOAD_1)

    # Call through /api/v1/cves alias router
    resp = await client.get("/api/v1/cves/CVE-2021-41773", headers=viewer_headers)
    assert resp.status_code == 200
    assert resp.json()["cve_id"] == "CVE-2021-41773"
