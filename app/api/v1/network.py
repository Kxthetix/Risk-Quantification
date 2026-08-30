"""Network topology and relationship API endpoints (Phase 7)."""
from typing import List
import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.network import (
    NetworkRelationshipCreate,
    NetworkRelationshipResponse,
    NetworkRelationshipUpdate,
)
from app.services.graph_service import graph_service

router = APIRouter(tags=["Network Topology & Relationships"])


@router.post(
    "/network/relationships",
    response_model=NetworkRelationshipResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Network Relationship",
)
async def create_network_relationship(
    payload: NetworkRelationshipCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> NetworkRelationshipResponse:
    """Register a directional network reachability, trust, or dependency connection between assets."""
    rel = await graph_service.create_relationship(
        db=db,
        organization_id=current_user.organization_id,
        payload=payload,
        current_user=current_user,
    )
    return NetworkRelationshipResponse.model_validate(rel)


@router.get(
    "/network/relationships",
    response_model=List[NetworkRelationshipResponse],
    summary="List Organization Network Relationships",
)
async def list_network_relationships(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[NetworkRelationshipResponse]:
    """Retrieve all network access relationships for the authenticated organization."""
    rels = await graph_service.get_relationships(
        db=db,
        organization_id=current_user.organization_id,
    )
    return [NetworkRelationshipResponse.model_validate(r) for r in rels]


@router.get(
    "/network/relationships/{relationship_id}",
    response_model=NetworkRelationshipResponse,
    summary="Get Network Relationship Details",
)
async def get_network_relationship(
    relationship_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> NetworkRelationshipResponse:
    """Retrieve details for a single network relationship."""
    rel = await graph_service.get_relationship(
        db=db,
        organization_id=current_user.organization_id,
        relationship_id=relationship_id,
    )
    return NetworkRelationshipResponse.model_validate(rel)


@router.put(
    "/network/relationships/{relationship_id}",
    response_model=NetworkRelationshipResponse,
    summary="Update Network Relationship",
)
async def update_network_relationship(
    relationship_id: uuid.UUID,
    payload: NetworkRelationshipUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> NetworkRelationshipResponse:
    """Update ports, protocols, verification status, or confidence of a network relationship."""
    rel = await graph_service.update_relationship(
        db=db,
        organization_id=current_user.organization_id,
        relationship_id=relationship_id,
        payload=payload,
        current_user=current_user,
    )
    return NetworkRelationshipResponse.model_validate(rel)


@router.delete(
    "/network/relationships/{relationship_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete Network Relationship",
)
async def delete_network_relationship(
    relationship_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    """Remove a network relationship from the topology graph."""
    await graph_service.delete_relationship(
        db=db,
        organization_id=current_user.organization_id,
        relationship_id=relationship_id,
        current_user=current_user,
    )
