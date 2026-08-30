"""Attack Paths, Graph Visualization & Chokepoints API endpoints (Phase 7)."""
from typing import Any, Dict, List, Optional
import uuid

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.engines.attack_graph_engine import AttackGraphEngine
from app.models.enums import SimulationStatus
from app.models.user import User
from app.schemas.attack_path import (
    AssetAttackPathsResponse,
    AttackGraphResponse,
    AttackPathAnalyzeRequest,
    AttackPathListResponse,
    AttackPathResponse,
    AttackPathSummaryResponse,
    ChokepointItem,
    CrownJewelItem,
    EntryPointItem,
    GraphVisualEdge,
    GraphVisualNode,
    MitreTechniqueDetailResponse,
    MitreTechniqueItem,
)
from app.schemas.simulation import SimulationJobResponse
from app.services.attack_path_service import attack_path_service
from app.services.graph_service import graph_service
from app.services.simulation_service import simulation_service
from app.workers.attack_path_worker import dispatch_attack_path_task

router = APIRouter(tags=["Attack Path & Threat Analysis"])


@router.post(
    "/attack-paths/analyze",
    summary="Trigger Attack Path Discovery",
)
async def analyze_attack_paths(
    payload: AttackPathAnalyzeRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Discover, score, and rank all viable attack paths to critical targets."""
    if payload.synchronous:
        paths = await attack_path_service.analyze_attack_paths(
            db=db,
            organization_id=current_user.organization_id,
            current_user=current_user,
            target_asset_id=payload.target_asset_id,
            max_path_length=payload.max_path_length,
            max_paths=payload.max_paths,
        )
        crit_count = sum(1 for p in paths if p.path_score >= 70.0)
        blocked_count = sum(1 for p in paths if p.is_blocked)
        return AttackPathListResponse(
            paths=[AttackPathResponse.model_validate(p) for p in paths],
            total_paths=len(paths),
            critical_paths_count=crit_count,
            blocked_paths_count=blocked_count,
        )
    else:
        response.status_code = status.HTTP_202_ACCEPTED
        job = await simulation_service.create_job(
            db=db,
            organization_id=current_user.organization_id,
            total_simulations=payload.max_paths,
        )
        dispatch_attack_path_task(
            job_id=job.id,
            current_user=current_user,
            target_asset_id=payload.target_asset_id,
            max_path_length=payload.max_path_length,
            max_paths=payload.max_paths,
        )
        return SimulationJobResponse(
            job_id=job.id,
            status=SimulationStatus.QUEUED,
            progress=0,
            simulations_completed=0,
            total_simulations=payload.max_paths,
            created_at=job.created_at,
        )


@router.get(
    "/attack-paths",
    response_model=AttackPathListResponse,
    summary="List Organization Attack Paths",
)
async def get_attack_paths(
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    risk_level: Optional[str] = Query(default=None),
    target_asset_id: Optional[uuid.UUID] = Query(default=None),
    status: Optional[str] = Query(default=None),
    search: Optional[str] = Query(default=None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AttackPathListResponse:
    """Retrieve paginated attack paths with search and filters."""
    return await attack_path_service.get_all_attack_paths(
        db=db,
        organization_id=current_user.organization_id,
        limit=limit,
        offset=offset,
        risk_level=risk_level,
        target_asset_id=target_asset_id,
        status=status,
        search=search,
    )


@router.get(
    "/attack-paths/summary",
    response_model=AttackPathSummaryResponse,
    summary="Get Attack Path Executive Summary",
)
async def get_attack_paths_summary(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AttackPathSummaryResponse:
    """Retrieve executive KPIs across discovered attack paths."""
    return await attack_path_service.get_attack_paths_summary(
        db=db,
        organization_id=current_user.organization_id,
    )


@router.get(
    "/attack-paths/mitre-techniques",
    response_model=List[MitreTechniqueItem],
    summary="Get MITRE Techniques Catalog & Mapping",
)
async def get_mitre_techniques(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[MitreTechniqueItem]:
    """Retrieve all MITRE ATT&CK techniques with attack path linkages."""
    return await attack_path_service.get_mitre_techniques(
        db=db,
        organization_id=current_user.organization_id,
    )


@router.get(
    "/attack-paths/mitre-techniques/{technique_id}",
    response_model=MitreTechniqueDetailResponse,
    summary="Get MITRE Technique Detail",
)
async def get_mitre_technique_detail(
    technique_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> MitreTechniqueDetailResponse:
    """Retrieve details for a single MITRE ATT&CK technique with affected paths."""
    return await attack_path_service.get_mitre_technique_by_id(
        db=db,
        organization_id=current_user.organization_id,
        technique_id=technique_id,
    )


@router.get(
    "/attack-paths/entry-points",
    response_model=List[EntryPointItem],
    summary="Get Exposed Entry Points",
)
async def get_entry_points(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[EntryPointItem]:
    """Retrieve perimeter exposed entry points."""
    return await attack_path_service.get_entry_points(
        db=db,
        organization_id=current_user.organization_id,
    )


@router.get(
    "/attack-paths/crown-jewels",
    response_model=List[CrownJewelItem],
    summary="Get Crown Jewel Critical Assets",
)
async def get_crown_jewels(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[CrownJewelItem]:
    """Retrieve critical assets and shortest path reachability metrics."""
    return await attack_path_service.get_crown_jewels(
        db=db,
        organization_id=current_user.organization_id,
    )


@router.get(
    "/attack-paths/top",
    response_model=List[AttackPathResponse],
    summary="Get Top Dangerous Attack Paths",
)
async def get_top_attack_paths(
    limit: int = Query(default=10, ge=1, le=100),
    risk_level: Optional[str] = Query(default=None),
    target_asset_id: Optional[uuid.UUID] = Query(default=None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[AttackPathResponse]:
    """Retrieve top-ranked attack paths ordered by composite severity score."""
    paths = await attack_path_service.get_top_attack_paths(
        db=db,
        organization_id=current_user.organization_id,
        limit=limit,
        risk_level=risk_level,
        target_asset_id=target_asset_id,
    )
    return [AttackPathResponse.model_validate(p) for p in paths]


@router.get(
    "/attack-paths/chokepoints",
    response_model=List[ChokepointItem],
    summary="Get High-Leverage Remediation Chokepoints",
)
async def get_chokepoints(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[ChokepointItem]:
    """Identify bottleneck assets whose remediation breaks the highest number of attack paths."""
    return await attack_path_service.get_chokepoints(
        db=db,
        organization_id=current_user.organization_id,
    )


@router.get(
    "/attack-paths/{path_id}",
    response_model=AttackPathResponse,
    summary="Get Attack Path Detail",
)
async def get_attack_path(
    path_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AttackPathResponse:
    """Retrieve complete attack path with nodes, edges, technique mappings, and financial exposure."""
    path = await attack_path_service.get_attack_path_by_id(
        db=db,
        organization_id=current_user.organization_id,
        path_id=path_id,
    )
    return AttackPathResponse.model_validate(path)


@router.get(
    "/assets/{asset_id}/attack-paths",
    response_model=AssetAttackPathsResponse,
    summary="Get Asset Attack Paths",
)
async def get_asset_attack_paths(
    asset_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AssetAttackPathsResponse:
    """Retrieve incoming, outgoing, critical, and blocked attack paths for an asset."""
    return await attack_path_service.get_asset_attack_paths(
        db=db,
        organization_id=current_user.organization_id,
        asset_id=asset_id,
    )


@router.get(
    "/attack-graph",
    response_model=AttackGraphResponse,
    summary="Get Complete Attack Graph Data (Visualization)",
)
async def get_attack_graph(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AttackGraphResponse:
    """Retrieve full organization attack graph in nodes/edges format for frontend rendering."""
    graph = await graph_service.get_attack_graph_for_organization(
        db=db,
        organization_id=current_user.organization_id,
    )
    serialized = AttackGraphEngine.serialize_for_visualization(graph)

    nodes = [GraphVisualNode(**n) for n in serialized["nodes"]]
    edges = [GraphVisualEdge(**e) for e in serialized["edges"]]
    return AttackGraphResponse(nodes=nodes, edges=edges)
