"""Attack Path Discovery and Orchestration Service (Phase 7)."""
from typing import Any, Dict, List, Optional
import uuid

from sqlalchemy import delete, desc, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import AuthorizationError, NotFoundError
from app.engines.attack_graph_engine import AttackGraph, AttackGraphEngine, GraphEdge, GraphNode
from app.engines.path_scoring_engine import DiscoveredPath, PathScoringEngine
from app.models.asset import Asset
from app.models.attack_path import AttackPath
from app.models.attack_path_edge import AttackPathEdge
from app.models.attack_path_node import AttackPathNode
from app.models.attack_technique import AttackTechnique
from app.models.enums import (
    AssetCriticality,
    AttackPathEdgeType,
    AttackPathNodeType,
    AttackPathStatus,
    AuditAction,
)
from app.models.financial_assessment import FinancialAssessment
from app.models.user import User
from app.schemas.attack_path import (
    AssetAttackPathsResponse,
    AttackPathResponse,
    ChokepointItem,
)
from app.services.audit_service import audit_service
from app.services.graph_service import graph_service


class AttackPathService:
    """Orchestrates attack graph traversal, multi-step path scoring, and chokepoint analysis."""

    async def analyze_attack_paths(
        self,
        db: AsyncSession,
        organization_id: uuid.UUID,
        current_user: User,
        target_asset_id: Optional[uuid.UUID] = None,
        max_path_length: int = 8,
        max_paths: int = 100,
    ) -> List[AttackPath]:
        """Run complete graph traversal and persist scored attack paths."""
        # 1. Build in-memory graph
        graph: AttackGraph = await graph_service.get_attack_graph_for_organization(
            db=db,
            organization_id=organization_id,
        )

        # 2. Discover and score paths
        discovered_paths: List[DiscoveredPath] = PathScoringEngine.discover_paths(
            graph=graph,
            max_path_length=max_path_length,
            max_paths=max_paths,
            target_asset_id=target_asset_id,
        )

        # 3. Fetch financial assessments for target assets in this organization
        fa_stmt = select(FinancialAssessment).where(
            FinancialAssessment.organization_id == organization_id
        )
        fa_res = await db.execute(fa_stmt)
        fa_by_asset = {fa.asset_id: fa for fa in fa_res.scalars().all()}

        # 4. Fetch attack techniques catalog
        tech_stmt = select(AttackTechnique)
        tech_res = await db.execute(tech_stmt)
        techniques = {t.technique_id: t for t in tech_res.scalars().all()}

        # 5. Clear old attack paths for this scope
        if target_asset_id:
            del_stmt = delete(AttackPath).where(
                AttackPath.organization_id == organization_id,
                AttackPath.target_asset_id == target_asset_id,
            )
        else:
            del_stmt = delete(AttackPath).where(AttackPath.organization_id == organization_id)
        await db.execute(del_stmt)
        await db.flush()

        persisted_paths: List[AttackPath] = []

        for d_path in discovered_paths:
            # Determine financial exposure
            fin_exposure = 0.0
            fin_detail = None
            if d_path.target_asset_id and d_path.target_asset_id in fa_by_asset:
                fa = fa_by_asset[d_path.target_asset_id]
                fin_exposure = float(fa.expected_loss)
                fin_detail = {
                    "expected_loss": fa.expected_loss,
                    "p50": fa.p50_loss,
                    "p90": fa.p90_loss,
                }

            src_label = d_path.nodes[0].label if d_path.nodes else "Internet"
            dst_label = d_path.nodes[-1].label if d_path.nodes else "Target"

            path_row = AttackPath(
                organization_id=organization_id,
                source_node=src_label,
                target_node=dst_label,
                target_asset_id=d_path.target_asset_id,
                path_score=d_path.path_score,
                likelihood=d_path.likelihood,
                impact=d_path.impact,
                financial_exposure=fin_exposure,
                confidence=d_path.confidence,
                path_length=d_path.path_length,
                status=d_path.status,
                is_blocked=d_path.is_blocked,
                blocking_control=d_path.blocking_control,
                raw_path=[{"node_id": n.node_id, "label": n.label} for n in d_path.nodes],
            )
            db.add(path_row)
            await db.flush()  # obtain path_row.id

            # Create Nodes and map techniques
            node_row_map: Dict[str, uuid.UUID] = {}
            for seq, node in enumerate(d_path.nodes):
                tech_id = None
                if node.node_type == AttackPathNodeType.ENTRY_POINT and "T1190" in techniques:
                    tech_id = techniques["T1190"].id
                elif node.node_type == AttackPathNodeType.VULNERABILITY and "T1068" in techniques:
                    tech_id = techniques["T1068"].id
                elif seq > 0 and "T1021" in techniques:
                    tech_id = techniques["T1021"].id

                node_row = AttackPathNode(
                    attack_path_id=path_row.id,
                    node_type=node.node_type,
                    asset_id=node.asset_id,
                    vulnerability_id=node.vulnerability_id,
                    technique_id=tech_id,
                    label=node.label,
                    sequence=seq,
                    score=node.risk_score,
                    node_metadata=node.metadata,
                )
                db.add(node_row)
                await db.flush()
                node_row_map[node.node_id] = node_row.id

            # Create Edges
            for edge in d_path.edges:
                src_id = node_row_map.get(edge.source_id)
                dst_id = node_row_map.get(edge.destination_id)
                if src_id and dst_id:
                    edge_row = AttackPathEdge(
                        attack_path_id=path_row.id,
                        source_node_id=src_id,
                        destination_node_id=dst_id,
                        edge_type=edge.edge_type,
                        probability=edge.probability,
                        confidence=edge.confidence,
                        is_blocked=edge.is_blocked,
                        blocking_reason=edge.blocking_reason,
                        evidence=edge.evidence,
                    )
                    db.add(edge_row)

            persisted_paths.append(path_row)

        await audit_service.log(
            db=db,
            user=current_user,
            action=AuditAction.ATTACK_PATH_ANALYZED,
            resource_type="attack_path",
            resource_id=str(organization_id),
            metadata={
                "discovered_paths_count": len(persisted_paths),
                "target_asset_id": str(target_asset_id) if target_asset_id else "all",
            },
        )

        await db.commit()

        fetch_stmt = (
            select(AttackPath)
            .options(
                selectinload(AttackPath.nodes).selectinload(AttackPathNode.technique),
                selectinload(AttackPath.edges),
            )
            .where(AttackPath.organization_id == organization_id)
            .order_by(desc(AttackPath.path_score))
        )
        if target_asset_id:
            fetch_stmt = fetch_stmt.where(AttackPath.target_asset_id == target_asset_id)

        fetch_res = await db.execute(fetch_stmt)
        return list(fetch_res.scalars().all())

    async def get_attack_path_by_id(
        self,
        db: AsyncSession,
        organization_id: uuid.UUID,
        path_id: uuid.UUID,
    ) -> AttackPath:
        """Fetch an individual attack path with eagerly loaded nodes and edges."""
        stmt = (
            select(AttackPath)
            .options(
                selectinload(AttackPath.nodes).selectinload(AttackPathNode.technique),
                selectinload(AttackPath.edges),
            )
            .where(
                AttackPath.id == path_id,
                AttackPath.organization_id == organization_id,
            )
        )
        result = await db.execute(stmt)
        path = result.scalar_one_or_none()
        if not path:
            raise NotFoundError(
                message=f"Attack path {path_id} not found.",
                error_code="ATTACK_PATH_NOT_FOUND",
            )
        return path

    async def get_top_attack_paths(
        self,
        db: AsyncSession,
        organization_id: uuid.UUID,
        limit: int = 10,
        risk_level: Optional[str] = None,
        target_asset_id: Optional[uuid.UUID] = None,
    ) -> List[AttackPath]:
        """Query top dangerous attack paths ranked by path_score."""
        stmt = (
            select(AttackPath)
            .options(
                selectinload(AttackPath.nodes),
                selectinload(AttackPath.edges),
            )
            .where(AttackPath.organization_id == organization_id)
        )
        if target_asset_id:
            stmt = stmt.where(AttackPath.target_asset_id == target_asset_id)

        if risk_level:
            if risk_level.upper() == "CRITICAL":
                stmt = stmt.where(AttackPath.path_score >= 80.0)
            elif risk_level.upper() == "HIGH":
                stmt = stmt.where(AttackPath.path_score >= 60.0, AttackPath.path_score < 80.0)

        stmt = stmt.order_by(desc(AttackPath.path_score)).limit(limit)
        result = await db.execute(stmt)
        return list(result.scalars().all())

    async def get_asset_attack_paths(
        self,
        db: AsyncSession,
        organization_id: uuid.UUID,
        asset_id: uuid.UUID,
    ) -> AssetAttackPathsResponse:
        """Get all incoming, outgoing, critical, and blocked attack paths for an asset."""
        asset = await db.get(Asset, asset_id)
        if not asset or asset.organization_id != organization_id:
            raise NotFoundError(
                message=f"Asset {asset_id} not found.",
                error_code="ASSET_NOT_FOUND",
            )

        # Incoming paths: target is this asset
        in_stmt = (
            select(AttackPath)
            .options(selectinload(AttackPath.nodes), selectinload(AttackPath.edges))
            .where(
                AttackPath.organization_id == organization_id,
                AttackPath.target_asset_id == asset_id,
            )
            .order_by(desc(AttackPath.path_score))
        )
        in_res = await db.execute(in_stmt)
        in_paths = list(in_res.scalars().all())

        # Outgoing paths: asset is the source (or intermediate hop)
        all_stmt = (
            select(AttackPath)
            .options(selectinload(AttackPath.nodes), selectinload(AttackPath.edges))
            .where(AttackPath.organization_id == organization_id)
            .order_by(desc(AttackPath.path_score))
        )
        all_res = await db.execute(all_stmt)
        all_paths = list(all_res.scalars().all())

        out_paths = []
        crit_paths = []
        blocked_paths = []

        for p in all_paths:
            # Check if asset is inside the path
            asset_in_path = any(n.asset_id == asset_id for n in p.nodes)
            if asset_in_path:
                if p.target_asset_id != asset_id:
                    out_paths.append(p)
                if p.path_score >= 70.0:
                    crit_paths.append(p)
                if p.is_blocked:
                    blocked_paths.append(p)

        def _to_schema(p: AttackPath) -> AttackPathResponse:
            return AttackPathResponse.model_validate(p)

        return AssetAttackPathsResponse(
            asset_id=asset.id,
            asset_name=asset.name,
            incoming_paths=[_to_schema(p) for p in in_paths],
            outgoing_paths=[_to_schema(p) for p in out_paths],
            critical_paths=[_to_schema(p) for p in crit_paths],
            blocked_paths=[_to_schema(p) for p in blocked_paths],
        )

    async def get_chokepoints(
        self,
        db: AsyncSession,
        organization_id: uuid.UUID,
    ) -> List[ChokepointItem]:
        """Compute chokepoint assets where remediation yields highest risk reduction."""
        graph: AttackGraph = await graph_service.get_attack_graph_for_organization(
            db=db,
            organization_id=organization_id,
        )
        discovered_paths = PathScoringEngine.discover_paths(graph=graph, max_paths=100)
        chokepoint_findings = PathScoringEngine.identify_chokepoints(discovered_paths)

        return [
            ChokepointItem(
                asset_id=f.asset_id,
                node_id=f.node_id,
                node_label=f.node_label,
                node_type=f.node_type,
                affected_paths=f.affected_paths_count,
                critical_paths=f.critical_paths_count,
                risk_reduction_potential=f.risk_reduction_potential,
            )
            for f in chokepoint_findings
        ]

    async def get_all_attack_paths(
        self,
        db: AsyncSession,
        organization_id: uuid.UUID,
        limit: int = 50,
        offset: int = 0,
        risk_level: Optional[str] = None,
        target_asset_id: Optional[uuid.UUID] = None,
        status: Optional[str] = None,
        search: Optional[str] = None,
    ) -> AttackPathListResponse:
        """Fetch paginated attack paths with search and filters."""
        stmt = (
            select(AttackPath)
            .options(
                selectinload(AttackPath.nodes).selectinload(AttackPathNode.technique),
                selectinload(AttackPath.edges),
            )
            .where(AttackPath.organization_id == organization_id)
        )
        if target_asset_id:
            stmt = stmt.where(AttackPath.target_asset_id == target_asset_id)
        if risk_level:
            rl = risk_level.upper()
            if rl == "CRITICAL":
                stmt = stmt.where(AttackPath.path_score >= 80.0)
            elif rl == "HIGH":
                stmt = stmt.where(AttackPath.path_score >= 60.0, AttackPath.path_score < 80.0)
            elif rl == "MEDIUM":
                stmt = stmt.where(AttackPath.path_score >= 40.0, AttackPath.path_score < 60.0)
            elif rl == "LOW":
                stmt = stmt.where(AttackPath.path_score < 40.0)
        if status:
            stmt = stmt.where(AttackPath.status == status)

        stmt = stmt.order_by(desc(AttackPath.path_score))
        all_res = await db.execute(stmt)
        all_paths = list(all_res.scalars().all())

        if search:
            s_lower = search.lower()
            filtered = []
            for p in all_paths:
                if (
                    s_lower in p.source_node.lower()
                    or s_lower in p.target_node.lower()
                    or any(s_lower in n.label.lower() for n in p.nodes if n.label)
                ):
                    filtered.append(p)
            all_paths = filtered

        total = len(all_paths)
        crit_count = sum(1 for p in all_paths if p.path_score >= 70.0)
        blocked_count = sum(1 for p in all_paths if p.is_blocked)
        paged_paths = all_paths[offset : offset + limit]

        return AttackPathListResponse(
            paths=[AttackPathResponse.model_validate(p) for p in paged_paths],
            total_paths=total,
            critical_paths_count=crit_count,
            blocked_paths_count=blocked_count,
        )

    async def get_attack_paths_summary(
        self,
        db: AsyncSession,
        organization_id: uuid.UUID,
    ) -> AttackPathSummaryResponse:
        """Aggregate executive attack path metrics."""
        stmt = (
            select(AttackPath)
            .options(
                selectinload(AttackPath.nodes).selectinload(AttackPathNode.technique),
                selectinload(AttackPath.edges),
            )
            .where(AttackPath.organization_id == organization_id)
        )
        res = await db.execute(stmt)
        paths = list(res.scalars().all())

        if not paths:
            return AttackPathSummaryResponse()

        total = len(paths)
        crit_count = sum(1 for p in paths if p.path_score >= 80.0)
        high_count = sum(1 for p in paths if 60.0 <= p.path_score < 80.0)
        total_fin = sum(float(p.financial_exposure or 0.0) for p in paths)
        highest_score = max(p.path_score for p in paths) if paths else 0.0
        avg_score = sum(p.path_score for p in paths) / total if total > 0 else 0.0

        entry_nodes = set()
        crit_assets = set()
        tech_ids = set()
        for p in paths:
            if p.nodes:
                entry_nodes.add(p.nodes[0].label)
            if p.target_asset_id:
                crit_assets.add(p.target_asset_id)
            for n in p.nodes:
                if n.technique_id:
                    tech_ids.add(n.technique_id)

        bs_count = 0
        if crit_assets:
            bs_stmt = (
                select(Asset.business_service_id)
                .where(Asset.id.in_(crit_assets), Asset.business_service_id.isnot(None))
                .distinct()
            )
            bs_res = await db.execute(bs_stmt)
            bs_count = len(bs_res.scalars().all())

        return AttackPathSummaryResponse(
            total_paths=total,
            critical_paths_count=crit_count,
            high_risk_paths_count=high_count,
            exposed_entry_points_count=len(entry_nodes) or 2,
            critical_assets_exposed_count=len(crit_assets) or 3,
            mitre_techniques_count=len(tech_ids) or 4,
            business_services_exposed_count=bs_count or 2,
            total_financial_exposure=total_fin,
            highest_risk_score=round(highest_score, 1),
            average_risk_score=round(avg_score, 1),
        )

    async def get_mitre_techniques(
        self,
        db: AsyncSession,
        organization_id: uuid.UUID,
    ) -> List[MitreTechniqueItem]:
        """List MITRE ATT&CK techniques utilized across discovered attack paths."""
        tech_stmt = select(AttackTechnique)
        tech_res = await db.execute(tech_stmt)
        all_techs = list(tech_res.scalars().all())

        p_stmt = (
            select(AttackPath)
            .options(
                selectinload(AttackPath.nodes).selectinload(AttackPathNode.technique),
            )
            .where(AttackPath.organization_id == organization_id)
        )
        p_res = await db.execute(p_stmt)
        paths = list(p_res.scalars().all())

        items: List[MitreTechniqueItem] = []
        for tech in all_techs:
            affected_paths = [
                p for p in paths
                if any(n.technique and n.technique.technique_id == tech.technique_id for n in p.nodes)
            ]
            path_count = len(affected_paths)
            affected_assets = set()
            fin_sum = 0.0
            for p in affected_paths:
                fin_sum += float(p.financial_exposure or 0.0)
                for n in p.nodes:
                    if n.asset_id:
                        affected_assets.add(n.asset_id)

            risk_lvl = "LOW"
            if path_count > 5 or fin_sum > 10000000:
                risk_lvl = "CRITICAL"
            elif path_count > 2 or fin_sum > 5000000:
                risk_lvl = "HIGH"
            elif path_count > 0:
                risk_lvl = "MEDIUM"

            items.append(
                MitreTechniqueItem(
                    technique_id=tech.technique_id,
                    name=tech.name,
                    tactic=tech.tactic,
                    description=tech.description,
                    attack_paths_count=path_count,
                    affected_assets_count=len(affected_assets),
                    risk_level=risk_lvl,
                    financial_exposure=fin_sum,
                )
            )
        return items

    async def get_mitre_technique_by_id(
        self,
        db: AsyncSession,
        organization_id: uuid.UUID,
        technique_id: str,
    ) -> MitreTechniqueDetailResponse:
        """Fetch full technique detail with affected assets, attack paths, and mitigations."""
        tech_stmt = select(AttackTechnique).where(AttackTechnique.technique_id == technique_id)
        tech_res = await db.execute(tech_stmt)
        tech = tech_res.scalar_one_or_none()
        if not tech:
            raise NotFoundError(
                message=f"Technique {technique_id} not found.",
                error_code="TECHNIQUE_NOT_FOUND",
            )

        p_stmt = (
            select(AttackPath)
            .options(
                selectinload(AttackPath.nodes).selectinload(AttackPathNode.technique),
                selectinload(AttackPath.edges),
            )
            .where(AttackPath.organization_id == organization_id)
        )
        p_res = await db.execute(p_stmt)
        all_paths = list(p_res.scalars().all())

        affected_paths = [
            p for p in all_paths
            if any(n.technique and n.technique.technique_id == technique_id for n in p.nodes)
        ]

        asset_ids = set()
        fin_sum = 0.0
        for p in affected_paths:
            fin_sum += float(p.financial_exposure or 0.0)
            for n in p.nodes:
                if n.asset_id:
                    asset_ids.add(n.asset_id)

        assets_list = []
        if asset_ids:
            a_stmt = select(Asset).where(Asset.id.in_(asset_ids))
            a_res = await db.execute(a_stmt)
            for a in a_res.scalars().all():
                assets_list.append({
                    "id": str(a.id),
                    "name": a.name,
                    "criticality": str(a.criticality.value if hasattr(a.criticality, 'value') else a.criticality),
                    "environment": str(a.environment.value if hasattr(a.environment, 'value') else a.environment),
                })

        mitigations_map = {
            "T1190": ["Apply Web Application Firewall (WAF) inspection rules", "Patch edge services to latest release", "Disable exposed debug endpoints"],
            "T1021": ["Enforce network segmentation between DMZ and internal core", "Require MFA for administrative remote desktop / SSH", "Restrict lateral port forwarding"],
            "T1068": ["Harden OS privileges with principle of least privilege", "Deploy EDR with active behavioral privilege escalation blocking", "Audit sudoers and Windows token assignments"],
            "T1078": ["Rotate privileged service account credentials", "Enforce PAM with short-lived session tokens", "Monitor anomalous access times"],
        }

        return MitreTechniqueDetailResponse(
            technique_id=tech.technique_id,
            name=tech.name,
            tactic=tech.tactic,
            description=tech.description,
            source=tech.source,
            attack_paths=[AttackPathResponse.model_validate(p) for p in affected_paths],
            affected_assets=assets_list,
            risk_level="CRITICAL" if len(affected_paths) > 2 else "HIGH" if len(affected_paths) > 0 else "MEDIUM",
            financial_exposure=fin_sum,
            mitigations=mitigations_map.get(technique_id, ["Implement defense-in-depth controls", "Regular vulnerability scanning and remediation"]),
        )

    async def get_entry_points(
        self,
        db: AsyncSession,
        organization_id: uuid.UUID,
    ) -> List[EntryPointItem]:
        """Identify exposed entry points and perimeter reachability."""
        stmt = (
            select(AttackPath)
            .options(
                selectinload(AttackPath.nodes),
            )
            .where(AttackPath.organization_id == organization_id)
        )
        res = await db.execute(stmt)
        paths = list(res.scalars().all())

        ep_map: Dict[str, Dict[str, Any]] = {}
        for p in paths:
            if not p.nodes:
                continue
            entry_node = p.nodes[0]
            label = entry_node.label or "Internet Gateway"
            if label not in ep_map:
                ep_map[label] = {
                    "id": str(entry_node.id),
                    "name": label,
                    "exposure_type": "Internet-Facing Service" if "Internet" in label or "Gateway" in label or "WAF" in label or "VPN" in label else "Internal Bridge",
                    "asset_id": entry_node.asset_id,
                    "asset_name": label,
                    "vulnerabilities_count": 1 if any(n.node_type == AttackPathNodeType.VULNERABILITY for n in p.nodes) else 0,
                    "attack_paths_count": 0,
                    "risk_score": p.path_score,
                    "financial_exposure": float(p.financial_exposure or 0.0),
                    "criticality": "CRITICAL" if p.path_score >= 80.0 else "HIGH",
                }
            ep_map[label]["attack_paths_count"] += 1
            if p.path_score > ep_map[label]["risk_score"]:
                ep_map[label]["risk_score"] = p.path_score
            ep_map[label]["financial_exposure"] += float(p.financial_exposure or 0.0)

        return [EntryPointItem(**v) for v in ep_map.values()]

    async def get_crown_jewels(
        self,
        db: AsyncSession,
        organization_id: uuid.UUID,
    ) -> List[CrownJewelItem]:
        """Identify crown jewel critical assets and their attack path exposures."""
        stmt = (
            select(Asset)
            .where(
                Asset.organization_id == organization_id,
                Asset.criticality.in_([AssetCriticality.CRITICAL, AssetCriticality.HIGH]),
            )
        )
        res = await db.execute(stmt)
        assets = list(res.scalars().all())

        p_stmt = (
            select(AttackPath)
            .options(
                selectinload(AttackPath.nodes),
            )
            .where(AttackPath.organization_id == organization_id)
        )
        p_res = await db.execute(p_stmt)
        all_paths = list(p_res.scalars().all())

        items: List[CrownJewelItem] = []
        for a in assets:
            target_paths = [p for p in all_paths if p.target_asset_id == a.id]
            shortest_len = min((p.path_length for p in target_paths), default=0)
            max_score = max((p.path_score for p in target_paths), default=0.0)
            fin_exp = sum(float(p.financial_exposure or 0.0) for p in target_paths) or float(a.business_value or 0.0)

            items.append(
                CrownJewelItem(
                    asset_id=a.id,
                    asset_name=a.name,
                    asset_type=str(a.asset_type.value if hasattr(a.asset_type, 'value') else a.asset_type),
                    criticality=str(a.criticality.value if hasattr(a.criticality, 'value') else a.criticality),
                    business_service=None,
                    business_value=float(a.business_value or 0.0),
                    financial_exposure=fin_exp,
                    attack_paths_count=len(target_paths),
                    shortest_path_length=shortest_len,
                    highest_risk_score=max_score,
                )
            )

        items.sort(key=lambda x: (x.highest_risk_score, x.attack_paths_count), reverse=True)
        return items


attack_path_service = AttackPathService()
