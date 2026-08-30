import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio


async def test_csv_import_workflow(client: AsyncClient, admin_headers: dict):
    # 1. Upload CSV
    csv_content = """hostname,ip_address,asset_type,environment,criticality,os
app-db-master,192.168.10.50,DATABASE,PRODUCTION,CRITICAL,PostgreSQL 16
app-web-front,192.168.10.51,SERVER,PRODUCTION,HIGH,Ubuntu 24.04"""

    upload_payload = {
        "filename": "infrastructure_inventory.csv",
        "file_type": "CSV",
        "import_type": "ASSETS",
        "raw_csv_text": csv_content,
    }

    upload_resp = await client.post("/api/v1/imports/upload", json=upload_payload, headers=admin_headers)
    assert upload_resp.status_code == 201
    preview = upload_resp.json()
    import_id = preview["import_id"]
    assert preview["total_rows"] == 2
    assert "hostname" in preview["detected_columns"]
    assert preview["suggested_mappings"]["hostname"] == "name"

    # 2. Preview endpoint
    get_preview_resp = await client.get(f"/api/v1/imports/{import_id}/preview", headers=admin_headers)
    assert get_preview_resp.status_code == 200
    assert get_preview_resp.json()["import_id"] == import_id

    # 3. Execute import
    execute_payload = {
        "column_mapping": {
            "hostname": "name",
            "ip_address": "ip_address",
            "asset_type": "asset_type",
            "environment": "environment",
            "criticality": "criticality",
            "os": "operating_system",
        },
        "skip_invalid_rows": True,
    }
    exec_resp = await client.post(f"/api/v1/imports/{import_id}/execute", json=execute_payload, headers=admin_headers)
    assert exec_resp.status_code == 200
    exec_data = exec_resp.json()
    assert exec_data["status"] == "COMPLETED"
    assert exec_data["valid_rows"] == 2

    # 4. List imports
    list_resp = await client.get("/api/v1/imports", headers=admin_headers)
    assert list_resp.status_code == 200
    assert len(list_resp.json()) >= 1
