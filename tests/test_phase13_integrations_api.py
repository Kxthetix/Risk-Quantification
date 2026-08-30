import pytest
import uuid
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio


async def test_integration_catalog(client: AsyncClient, admin_headers: dict):
    response = await client.get("/api/v1/integrations/catalog", headers=admin_headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 5
    ids = [item["id"] for item in data]
    assert "siem-splunk" in ids
    assert "scanner-nessus" in ids


async def test_integration_crud_and_stats(client: AsyncClient, admin_headers: dict):
    # 1. Create integration
    payload = {
        "name": "Production Splunk Cluster",
        "category": "SIEM",
        "connector_type": "splunk",
        "auth_method": "API_KEY",
        "endpoint_url": "https://splunk.internal.corp:8089",
        "credentials": {"api_key": "sec-test-token-12345"},
        "sync_frequency": "HOURLY",
        "sync_mode": "INCREMENTAL",
        "is_enabled": True,
        "field_mappings": {"ext_host": "hostname"},
    }
    create_resp = await client.post("/api/v1/integrations", json=payload, headers=admin_headers)
    assert create_resp.status_code == 201
    created_data = create_resp.json()
    integration_id = created_data["id"]
    assert created_data["name"] == "Production Splunk Cluster"
    assert created_data["has_credentials"] is True

    # 2. Get by ID
    get_resp = await client.get(f"/api/v1/integrations/{integration_id}", headers=admin_headers)
    assert get_resp.status_code == 200
    assert get_resp.json()["id"] == integration_id

    # 3. Update
    update_resp = await client.put(
        f"/api/v1/integrations/{integration_id}",
        json={"name": "Splunk Enterprise Production", "sync_frequency": "DAILY"},
        headers=admin_headers,
    )
    assert update_resp.status_code == 200
    assert update_resp.json()["name"] == "Splunk Enterprise Production"
    assert update_resp.json()["sync_frequency"] == "DAILY"

    # 4. Check stats
    stats_resp = await client.get("/api/v1/integrations/stats", headers=admin_headers)
    assert stats_resp.status_code == 200
    assert stats_resp.json()["total_integrations"] >= 1

    # 5. Test connection
    test_resp = await client.post(f"/api/v1/integrations/{integration_id}/test", headers=admin_headers)
    assert test_resp.status_code == 200
    assert test_resp.json()["status"] == "CONNECTED"

    # 6. Trigger sync
    sync_resp = await client.post(
        f"/api/v1/integrations/{integration_id}/sync",
        json={"sync_mode": "INCREMENTAL"},
        headers=admin_headers,
    )
    assert sync_resp.status_code == 200
    sync_data = sync_resp.json()
    assert sync_data["status"] == "SUCCESS"
    assert sync_data["records_accepted"] >= 1

    # 7. Get logs
    logs_resp = await client.get(f"/api/v1/integrations/{integration_id}/logs", headers=admin_headers)
    assert logs_resp.status_code == 200
    assert len(logs_resp.json()) >= 1

    # 8. Delete
    del_resp = await client.delete(f"/api/v1/integrations/{integration_id}", headers=admin_headers)
    assert del_resp.status_code == 204
