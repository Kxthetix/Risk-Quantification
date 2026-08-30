import uuid
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User, UserRole
from app.core.security import create_access_token


@pytest.fixture
def viewer_token(test_org, db_session) -> str:
    """Create a viewer account and return their auth bearer token."""
    user = User(
        id=uuid.uuid4(),
        organization_id=test_org.id,
        full_name="Alpha Viewer",
        email="viewer@alpha.com",
        password_hash="hashed_password",
        role=UserRole.VIEWER,
        is_active=True,
    )
    db_session.add(user)
    import asyncio
    asyncio.get_event_loop().run_until_complete(db_session.commit())
    
    return create_access_token(
        data={"sub": str(user.id), "org": str(test_org.id), "role": UserRole.VIEWER.value}
    )


@pytest.mark.asyncio
async def test_notifications_lifecycle(client: AsyncClient, viewer_token: str):
    headers = {"Authorization": f"Bearer {viewer_token}"}
    
    # 1. List notifications (seeds mocks automatically if empty)
    response = await client.get("/api/v1/notifications", headers=headers)
    assert response.status_code == 200
    notifications = response.json()
    assert len(notifications) > 0
    
    # Check severity fields are mapped
    assert "severity" in notifications[0]
    assert "read" in notifications[0]
    
    # 2. Mark notification as read
    target_id = notifications[0]["id"]
    res_read = await client.put(f"/api/v1/notifications/{target_id}/read", headers=headers)
    assert res_read.status_code == 200
    assert res_read.json()["read"] is True
    
    # 3. Mark all read
    res_all = await client.put("/api/v1/notifications/read-all", headers=headers)
    assert res_all.status_code == 200
    
    # 4. Delete notification
    res_del = await client.delete(f"/api/v1/notifications/{target_id}", headers=headers)
    assert res_del.status_code == 204


@pytest.mark.asyncio
async def test_notification_preferences(client: AsyncClient, viewer_token: str):
    headers = {"Authorization": f"Bearer {viewer_token}"}
    
    # Fetch default preferences
    response = await client.get("/api/v1/notifications/preferences", headers=headers)
    assert response.status_code == 200
    assert response.json()["email_alerts_enabled"] is True
    
    # Update preferences
    payload = {
        "email_alerts_enabled": False,
        "in_app_alerts_enabled": True,
        "webhook_alerts_enabled": True,
        "webhook_url": "https://hooks.slack.com/services/custom-slug",
        "critical_only": True,
    }
    res_update = await client.put("/api/v1/notifications/preferences", json=payload, headers=headers)
    assert res_update.status_code == 200
    data = res_update.json()
    assert data["email_alerts_enabled"] is False
    assert data["critical_only"] is True


@pytest.mark.asyncio
async def test_notification_rules(client: AsyncClient, viewer_token: str):
    headers = {"Authorization": f"Bearer {viewer_token}"}
    
    # Create rule
    payload = {
        "event_type": "Attack Path Detected",
        "condition_operator": "EQ",
        "condition_value": "Critical",
        "recipients": ["CISO", "Security Director"],
        "channel": "In-App + Email",
        "frequency": "Immediate",
        "is_active": True,
    }
    response = await client.post("/api/v1/notifications/rules", json=payload, headers=headers)
    assert response.status_code == 201
    rule_data = response.json()
    assert rule_data["event_type"] == "Attack Path Detected"
    
    # Update rule
    rule_id = rule_data["id"]
    res_update = await client.put(
        f"/api/v1/notifications/rules/{rule_id}",
        json={"is_active": False},
        headers=headers,
    )
    assert res_update.status_code == 200
    assert res_update.json()["is_active"] is False
    
    # Delete rule
    res_del = await client.delete(f"/api/v1/notifications/rules/{rule_id}", headers=headers)
    assert res_del.status_code == 204
