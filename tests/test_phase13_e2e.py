import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio


async def test_end_to_end_ingestion_and_deduplication(
    client: AsyncClient, admin_headers: dict, viewer_headers: dict
):
    # 1. Create Tenable Scanner connector
    connector_payload = {
        "name": "Corporate Tenable Scanner",
        "category": "VULNERABILITY_SCANNER",
        "connector_type": "nessus",
        "auth_method": "API_KEY",
        "endpoint_url": "https://nessus.corp.internal:8834",
        "sync_frequency": "HOURLY",
        "sync_mode": "INCREMENTAL",
    }
    create_resp = await client.post("/api/v1/integrations", json=connector_payload, headers=admin_headers)
    assert create_resp.status_code == 201
    integration_id = create_resp.json()["id"]

    # 2. Ingest first telemetry batch with Asset A and CVE-2026-9001
    batch_1 = {
        "sync_mode": "INCREMENTAL",
        "records": [
            {
                "hostname": "core-gateway-01.internal",
                "ip_address": "10.10.10.1",
                "asset_type": "FIREWALL",
                "environment": "PRODUCTION",
                "criticality": "CRITICAL",
                "vulnerabilities": [
                    {
                        "cve_id": "CVE-2026-9001",
                        "title": "Buffer Overflow in Gateway Daemon",
                        "severity": "CRITICAL",
                        "cvss_score": 9.8,
                    }
                ],
            }
        ],
    }
    sync_1 = await client.post(f"/api/v1/integrations/{integration_id}/sync", json=batch_1, headers=admin_headers)
    assert sync_1.status_code == 200
    assert sync_1.json()["records_created"] >= 1

    # 3. Ingest second batch with SAME Asset A (identified by same IP/hostname) and CVE-2026-9001 -> Must deduplicate
    batch_2 = {
        "sync_mode": "INCREMENTAL",
        "records": [
            {
                "hostname": "core-gateway-01.internal",
                "ip_address": "10.10.10.1",
                "operating_system": "FortiOS 7.4.2",
                "vulnerabilities": [
                    {
                        "cve_id": "CVE-2026-9001",
                        "title": "Buffer Overflow in Gateway Daemon",
                        "severity": "CRITICAL",
                        "cvss_score": 9.8,
                    }
                ],
            }
        ],
    }
    sync_2 = await client.post(f"/api/v1/integrations/{integration_id}/sync", json=batch_2, headers=admin_headers)
    assert sync_2.status_code == 200
    # The second run updates the existing asset without duplicating it
    assert sync_2.json()["records_updated"] >= 1

    # 4. Verify data endpoint reflects imported data
    data_resp = await client.get("/api/v1/integrations/data", headers=admin_headers)
    assert data_resp.status_code == 200
    assert data_resp.json()["assets_imported"] >= 1
    assert data_resp.json()["vulnerabilities_imported"] >= 1
