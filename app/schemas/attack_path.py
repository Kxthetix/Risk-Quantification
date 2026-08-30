"""Pydantic schemas for Attack Paths, Graph Visualization, and Chokepoint Analysis (Phase 7)."""
from datetime import datetime
from typing import Any, Dict, List, Optional
import uuid

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import AttackPathEdgeType, AttackPathNodeType, AttackPathStatus


class AttackPathAnalyzeRequest(BaseModel):
    target_asset_id: Optional[uuid.UUID] = None
    max_path_length: int = Field(default=8, ge=2, le=15)
    max_paths: int = Field(default=100, ge=1, le=500)
    synchronous: bool = Field(default=True)


class AttackPathNodeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    node_type: AttackPathNodeType
    asset_id: Optional[uuid.UUID] = None
    vulnerability_id: Optional[uuid.UUID] = None
    technique_id: Optional[uuid.UUID] = None
    label: Optional[str] = None
    sequence: int
    score: float
    node_metadata: Optional[Dict[str, Any]] = None


class AttackPathEdgeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    source_node_id: uuid.UUID
    destination_node_id: uuid.UUID
    edge_type: AttackPathEdgeType
    probability: float
    confidence: float
    is_blocked: bool
    blocking_reason: Optional[str] = None
    evidence: Optional[Dict[str, Any]] = None


class FinancialExposureDetail(BaseModel):
    expected_loss: float
    p50: float
    p90: float


class AttackPathResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    path_id: uuid.UUID = Field(validation_alias="id")
    source_node: str
    target_node: str
    target_asset_id: Optional[uuid.UUID] = None
    path_score: float
    likelihood: float
    impact: float
    confidence: float
    path_length: int
    status: AttackPathStatus
    is_blocked: bool
    blocking_control: Optional[str] = None
    nodes: List[AttackPathNodeResponse] = Field(default_factory=list)
    edges: List[AttackPathEdgeResponse] = Field(default_factory=list)
    financial_exposure: float = 0.0
    created_at: datetime


class AttackPathListResponse(BaseModel):
    paths: List[AttackPathResponse]
    total_paths: int
    critical_paths_count: int
    blocked_paths_count: int


class GraphVisualNode(BaseModel):
    id: str
    label: str
    type: str
    asset_id: Optional[str] = None
    vulnerability_id: Optional[str] = None
    criticality: Optional[str] = None
    risk_score: float
    is_entry_point: bool
    metadata: Optional[Dict[str, Any]] = None


class GraphVisualEdge(BaseModel):
    id: str
    source: str
    target: str
    type: str
    probability: float
    confidence: float
    is_blocked: bool
    blocking_reason: Optional[str] = None


class AttackGraphResponse(BaseModel):
    nodes: List[GraphVisualNode]
    edges: List[GraphVisualEdge]


class ChokepointItem(BaseModel):
    asset_id: Optional[uuid.UUID] = None
    node_id: str
    node_label: str
    node_type: str
    affected_paths: int
    critical_paths: int
    risk_reduction_potential: float


class AssetAttackPathsResponse(BaseModel):
    asset_id: uuid.UUID
    asset_name: str
    incoming_paths: List[AttackPathResponse] = Field(default_factory=list)
    outgoing_paths: List[AttackPathResponse] = Field(default_factory=list)
    critical_paths: List[AttackPathResponse] = Field(default_factory=list)
    blocked_paths: List[AttackPathResponse] = Field(default_factory=list)


class AttackPathSummaryResponse(BaseModel):
    total_paths: int = 0
    critical_paths_count: int = 0
    high_risk_paths_count: int = 0
    exposed_entry_points_count: int = 0
    critical_assets_exposed_count: int = 0
    mitre_techniques_count: int = 0
    business_services_exposed_count: int = 0
    total_financial_exposure: float = 0.0
    highest_risk_score: float = 0.0
    average_risk_score: float = 0.0


class MitreTechniqueItem(BaseModel):
    technique_id: str
    name: str
    tactic: str
    description: Optional[str] = None
    attack_paths_count: int = 0
    affected_assets_count: int = 0
    risk_level: str = "MEDIUM"
    financial_exposure: float = 0.0


class MitreTechniqueDetailResponse(BaseModel):
    technique_id: str
    name: str
    tactic: str
    description: Optional[str] = None
    source: str = "MITRE ATT&CK"
    attack_paths: List[AttackPathResponse] = Field(default_factory=list)
    affected_assets: List[Dict[str, Any]] = Field(default_factory=list)
    risk_level: str = "MEDIUM"
    financial_exposure: float = 0.0
    mitigations: List[str] = Field(default_factory=list)


class EntryPointItem(BaseModel):
    id: str
    name: str
    exposure_type: str
    asset_id: Optional[uuid.UUID] = None
    asset_name: Optional[str] = None
    vulnerabilities_count: int = 0
    attack_paths_count: int = 0
    risk_score: float = 0.0
    financial_exposure: float = 0.0
    criticality: str = "HIGH"


class CrownJewelItem(BaseModel):
    asset_id: uuid.UUID
    asset_name: str
    asset_type: str
    criticality: str
    business_service: Optional[str] = None
    business_value: float = 0.0
    financial_exposure: float = 0.0
    attack_paths_count: int = 0
    shortest_path_length: int = 0
    highest_risk_score: float = 0.0
