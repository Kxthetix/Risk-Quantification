"""Threat Intelligence API endpoints (Phase 9)."""
from typing import List, Optional
import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.threat_intelligence import (
    IOCDetailResponse,
    IOCItem,
    IOCUpdate,
    ThreatActivityResponse,
    ThreatActorDetailResponse,
    ThreatActorItem,
    ThreatCampaignDetailResponse,
    ThreatCampaignItem,
    ThreatFeedCreate,
    ThreatFeedHealthResponse,
    ThreatFeedItem,
    ThreatFeedUpdate,
    ThreatGeographyItem,
    ThreatGlobalSearchResponse,
    ThreatLandscapeReportResponse,
    ThreatRiskResponse,
    ThreatSourceItem,
    ThreatSummaryResponse,
    ThreatWatchlistCreate,
    ThreatWatchlistItem,
    ThreatWatchlistUpdate,
)
from app.services.threat_intelligence_service import threat_intelligence_service

router = APIRouter(prefix="/threat-intelligence", tags=["Threat Intelligence"])


@router.get("/summary", response_model=ThreatSummaryResponse, summary="Get Threat Intelligence Executive KPIs")
async def get_threat_summary(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ThreatSummaryResponse:
    return await threat_intelligence_service.get_summary(db, current_user.organization_id)


@router.get("/feeds", response_model=List[ThreatFeedItem], summary="List Threat Intelligence Feeds")
async def list_threat_feeds(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[ThreatFeedItem]:
    return await threat_intelligence_service.get_feeds(db, current_user.organization_id)


@router.post("/feeds", response_model=ThreatFeedItem, status_code=status.HTTP_201_CREATED, summary="Create Threat Feed")
async def create_threat_feed(
    payload: ThreatFeedCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ThreatFeedItem:
    feeds = await threat_intelligence_service.get_feeds(db, current_user.organization_id)
    return feeds[0]


@router.get("/feeds/{feed_id}", response_model=ThreatFeedItem, summary="Get Threat Feed Detail")
async def get_threat_feed(
    feed_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ThreatFeedItem:
    return await threat_intelligence_service.get_feed_by_id(db, current_user.organization_id, feed_id)


@router.post("/feeds/{feed_id}/test", response_model=ThreatFeedHealthResponse, summary="Test Threat Feed Connectivity & Health")
async def test_threat_feed(
    feed_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ThreatFeedHealthResponse:
    return await threat_intelligence_service.test_feed(db, current_user.organization_id, feed_id)


@router.get("/sources", response_model=List[ThreatSourceItem], summary="List Intelligence Sources & Reliability")
async def list_threat_sources(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[ThreatSourceItem]:
    return await threat_intelligence_service.get_sources(db, current_user.organization_id)


@router.get("/iocs", response_model=List[IOCItem], summary="List Indicators of Compromise (IOCs)")
async def list_iocs(
    ioc_type: Optional[str] = Query(None, description="IP, DOMAIN, URL, HASH_SHA256, EMAIL"),
    status_filter: Optional[str] = Query(None, alias="status"),
    severity: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[IOCItem]:
    return await threat_intelligence_service.get_iocs(
        db, current_user.organization_id, ioc_type=ioc_type, status=status_filter, severity=severity
    )


@router.get("/iocs/{ioc_id}", response_model=IOCDetailResponse, summary="Get IOC Deep Inspection")
async def get_ioc_detail(
    ioc_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> IOCDetailResponse:
    return await threat_intelligence_service.get_ioc_by_id(db, current_user.organization_id, ioc_id)


@router.get("/actors", response_model=List[ThreatActorItem], summary="List Threat Actors & Adversary Profiles")
async def list_threat_actors(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[ThreatActorItem]:
    return await threat_intelligence_service.get_actors(db, current_user.organization_id)


@router.get("/actors/{actor_id}", response_model=ThreatActorDetailResponse, summary="Get Threat Actor Profile")
async def get_threat_actor_detail(
    actor_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ThreatActorDetailResponse:
    return await threat_intelligence_service.get_actor_by_id(db, current_user.organization_id, actor_id)


@router.get("/campaigns", response_model=List[ThreatCampaignItem], summary="List Threat Campaigns")
async def list_threat_campaigns(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[ThreatCampaignItem]:
    return await threat_intelligence_service.get_campaigns(db, current_user.organization_id)


@router.get("/campaigns/{campaign_id}", response_model=ThreatCampaignDetailResponse, summary="Get Threat Campaign Detail")
async def get_threat_campaign_detail(
    campaign_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ThreatCampaignDetailResponse:
    return await threat_intelligence_service.get_campaign_by_id(db, current_user.organization_id, campaign_id)


@router.get("/risk", response_model=ThreatRiskResponse, summary="Get Threat Risk & Financial Exposure")
async def get_threat_risk(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ThreatRiskResponse:
    return await threat_intelligence_service.get_threat_risk(db, current_user.organization_id)


@router.get("/activity", response_model=ThreatActivityResponse, summary="Get Threat Activity Timeline")
async def get_threat_activity(
    period: str = Query("30d", description="24h, 7d, 30d, 90d"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ThreatActivityResponse:
    return await threat_intelligence_service.get_threat_activity(db, current_user.organization_id, period=period)


@router.get("/geography", response_model=List[ThreatGeographyItem], summary="Get Threat Geography Distribution")
async def get_threat_geography(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[ThreatGeographyItem]:
    return await threat_intelligence_service.get_geography(db, current_user.organization_id)


@router.get("/watchlists", response_model=List[ThreatWatchlistItem], summary="List Threat Watchlists")
async def list_threat_watchlists(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[ThreatWatchlistItem]:
    return await threat_intelligence_service.get_watchlists(db, current_user.organization_id)


@router.get("/reports", response_model=ThreatLandscapeReportResponse, summary="Generate Threat Landscape Report")
async def get_threat_report(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ThreatLandscapeReportResponse:
    return await threat_intelligence_service.get_report(db, current_user.organization_id)


@router.get("/search", response_model=ThreatGlobalSearchResponse, summary="Global Threat Intelligence Search")
async def search_threat_intelligence(
    query: str = Query(..., min_length=1),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ThreatGlobalSearchResponse:
    return await threat_intelligence_service.global_search(db, current_user.organization_id, query=query)
