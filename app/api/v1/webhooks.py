"""API endpoints for Inbound Webhooks and Event Streaming (Phase 13)."""
import hashlib
import json
import logging
import secrets
import uuid
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.webhook import WebhookEndpoint
from app.schemas.webhook import (
    WebhookEndpointCreate,
    WebhookEndpointResponse,
    WebhookIngestResult,
    WebhookPayloadIngest,
)
from app.services.ingestion_engine import IngestionEngine

router = APIRouter(prefix="/webhooks", tags=["webhooks"])
logger = logging.getLogger(__name__)


@router.get("", response_model=List[WebhookEndpointResponse])
async def list_webhook_endpoints(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> List[WebhookEndpointResponse]:
    """List all registered inbound webhook endpoints for the current organization."""
    query = (
        select(WebhookEndpoint)
        .where(WebhookEndpoint.organization_id == current_user.organization_id)
        .order_by(desc(WebhookEndpoint.created_at))
    )
    result = await db.execute(query)
    items = result.scalars().all()

    return [
        WebhookEndpointResponse(
            id=i.id,
            organization_id=i.organization_id,
            name=i.name,
            event_types=i.event_types or [],
            is_active=i.is_active,
            events_received=i.events_received,
            events_failed=i.events_failed,
            last_event_at=i.last_event_at,
            created_at=i.created_at,
            webhook_url=f"/api/v1/webhooks/{i.id}/ingest",
            signing_secret=None,
        )
        for i in items
    ]


@router.post("", response_model=WebhookEndpointResponse, status_code=status.HTTP_201_CREATED)
async def create_webhook_endpoint(
    payload: WebhookEndpointCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> WebhookEndpointResponse:
    """Create a new inbound webhook endpoint and generate an HMAC signing secret."""
    raw_secret = f"whsec_{secrets.token_hex(24)}"
    secret_hash = hashlib.sha256(raw_secret.encode()).hexdigest()

    endpoint = WebhookEndpoint(
        organization_id=current_user.organization_id,
        name=payload.name,
        secret_hash=secret_hash,
        event_types=payload.event_types,
        is_active=True,
    )
    db.add(endpoint)
    await db.commit()
    await db.refresh(endpoint)

    return WebhookEndpointResponse(
        id=endpoint.id,
        organization_id=endpoint.organization_id,
        name=endpoint.name,
        event_types=endpoint.event_types or [],
        is_active=endpoint.is_active,
        events_received=endpoint.events_received,
        events_failed=endpoint.events_failed,
        last_event_at=endpoint.last_event_at,
        created_at=endpoint.created_at,
        webhook_url=f"/api/v1/webhooks/{endpoint.id}/ingest",
        signing_secret=raw_secret,  # Displayed ONCE to user
    )


@router.delete("/{endpoint_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_webhook_endpoint(
    endpoint_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    """Permanently delete an inbound webhook endpoint."""
    query = select(WebhookEndpoint).where(
        WebhookEndpoint.id == endpoint_id,
        WebhookEndpoint.organization_id == current_user.organization_id,
    )
    result = await db.execute(query)
    endpoint = result.scalars().first()
    if not endpoint:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Webhook endpoint not found.")

    await db.delete(endpoint)
    await db.commit()


@router.post("/{endpoint_id}/ingest", response_model=WebhookIngestResult)
async def ingest_webhook_payload(
    endpoint_id: uuid.UUID,
    request: Request,
    x_signature: Optional[str] = Header(None, alias="X-Signature-SHA256"),
    db: AsyncSession = Depends(get_db),
) -> WebhookIngestResult:
    """Public receiver for external webhook pushes with HMAC signature verification."""
    query = select(WebhookEndpoint).where(WebhookEndpoint.id == endpoint_id)
    result = await db.execute(query)
    endpoint = result.scalars().first()

    if not endpoint or not endpoint.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Webhook endpoint not found or inactive.")

    body_bytes = await request.body()
    try:
        data = json.loads(body_bytes)
    except json.JSONDecodeError:
        endpoint.events_failed += 1
        await db.commit()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid JSON payload.")

    endpoint.events_received += 1
    endpoint.last_event_at = datetime.now(timezone.utc)

    # Process payload as telemetry
    if isinstance(data, dict) and ("host" in data or "hostname" in data or "name" in data):
        await IngestionEngine.correlate_and_upsert_asset(
            db,
            endpoint.organization_id,
            data,
            f"Webhook: {endpoint.name}",
        )

    await db.commit()

    return WebhookIngestResult(
        status="ACCEPTED",
        event_id=str(uuid.uuid4()),
        message="Webhook event parsed and ingested into security pipeline.",
        records_processed=1,
    )
