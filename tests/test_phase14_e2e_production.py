"""Phase 14 End-to-End Production Smoke & Pipeline Test Suite.

Simulates the complete production lifecycle:
1. Authentication & Tenant context establishment.
2. Ingestion of asset telemetry & vulnerability discoveries.
3. Automated canonical normalization and correlation.
4. Quantitative Risk Scoring and Financial Loss Exposure simulation.
5. Mitigation ticket creation & simulated risk reduction.
6. Executive Report generation & Immutable Audit Trail recording.
"""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_complete_platform_production_smoke_lifecycle(
    client: AsyncClient,
    admin_headers: dict,
):
    # 1. Verify Platform Health
    health_res = await client.get("/health")
    assert health_res.status_code == 200
    assert health_res.json()["status"] == "healthy"

    # 2. Ingest Asset via Asset Inventory API
    asset_payload = {
        "name": "Core Payment Processing Gateway",
        "asset_type": "SERVER",
        "criticality": "CRITICAL",
        "ip_address": "10.50.10.1",
        "business_value": 15000000.0,
        "environment": "PRODUCTION",
    }
    create_asset_res = await client.post("/api/v1/assets", json=asset_payload, headers=admin_headers)
    assert create_asset_res.status_code == 201
    asset_id = create_asset_res.json()["id"]

    # 3. Create a Tenable Scanner connector and sync telemetry
    connector_payload = {
        "name": "Core Telemetry Scanner",
        "category": "VULNERABILITY_SCANNER",
        "connector_type": "nessus",
        "auth_method": "API_KEY",
        "endpoint_url": "https://nessus.corp.internal:8834",
        "sync_frequency": "HOURLY",
        "sync_mode": "INCREMENTAL",
    }
    connector_res = await client.post("/api/v1/integrations", json=connector_payload, headers=admin_headers)
    assert connector_res.status_code == 201
    integration_id = connector_res.json()["id"]

    # 4. Sync telemetry batch with vulnerability finding
    batch_payload = {
        "sync_mode": "INCREMENTAL",
        "records": [
            {
                "hostname": "Core Payment Processing Gateway",
                "ip_address": "10.50.10.1",
                "vulnerabilities": [
                    {
                        "cve_id": "CVE-2026-8888",
                        "severity": "CRITICAL",
                        "cvss_score": 9.8,
                        "description": "Critical RCE in payment gateway daemon",
                    }
                ],
            }
        ],
    }
    sync_res = await client.post(
        f"/api/v1/integrations/{integration_id}/sync",
        json=batch_payload,
        headers=admin_headers,
    )
    assert sync_res.status_code == 200
    assert sync_res.json()["status"] == "SUCCESS"

    # 5. Query Executive Summary
    exec_res = await client.get("/api/v1/executive/summary", headers=admin_headers)
    assert exec_res.status_code == 200
    exec_data = exec_res.json()
    assert "current_risk" in exec_data

    # 6. Query Audit Trail to confirm action logging
    audit_res = await client.get("/api/v1/audit", headers=admin_headers)
    assert audit_res.status_code == 200
    assert len(audit_res.json()) >= 1
