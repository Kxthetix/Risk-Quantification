import hashlib
import hmac
import json
import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio


async def test_webhook_lifecycle_and_ingestion(client: AsyncClient, admin_headers: dict):
    # 1. Create webhook endpoint
    create_payload = {
        "name": "CrowdStrike Detection Webhook",
        "event_types": ["DETECTION", "ALERT", "INCIDENT"],
    }
    create_resp = await client.post("/api/v1/webhooks", json=create_payload, headers=admin_headers)
    assert create_resp.status_code == 201
    webhook_data = create_resp.json()
    endpoint_id = webhook_data["id"]
    secret = webhook_data["signing_secret"]
    assert secret is not None
    assert secret.startswith("whsec_")

    # 2. List webhooks (secret must not be shown again)
    list_resp = await client.get("/api/v1/webhooks", headers=admin_headers)
    assert list_resp.status_code == 200
    listed_item = next(w for w in list_resp.json() if w["id"] == endpoint_id)
    assert listed_item["signing_secret"] is None

    # 3. Send valid signed webhook payload
    payload_body = {
        "event_type": "DETECTION",
        "source_system": "CrowdStrike",
        "hostname": "workstation-hr-04.corp.internal",
        "ip_address": "10.0.4.18",
        "asset_type": "WORKSTATION",
        "severity": "HIGH",
    }
    body_bytes = json.dumps(payload_body).encode()
    signature = hmac.new(secret.encode(), body_bytes, hashlib.sha256).hexdigest()

    ingest_resp = await client.post(
        f"/api/v1/webhooks/{endpoint_id}/ingest",
        content=body_bytes,
        headers={"Content-Type": "application/json", "X-Signature-SHA256": f"sha256={signature}"},
    )
    assert ingest_resp.status_code == 200
    assert ingest_resp.json()["status"] == "ACCEPTED"

    # 4. Delete webhook endpoint
    del_resp = await client.delete(f"/api/v1/webhooks/{endpoint_id}", headers=admin_headers)
    assert del_resp.status_code == 204
