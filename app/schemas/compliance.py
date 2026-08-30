"""Pydantic schemas for Security Controls, Compliance Management & ISO/IEC 27001 (Phase 8)."""
from datetime import datetime
from typing import Any, Dict, List, Optional
import uuid
from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import ControlType, RiskLevel


class ComplianceSummaryResponse(BaseModel):
    """Executive Compliance & Controls KPI Summary."""
    overall_compliance_pct: float = Field(..., description="Overall compliance score across all enabled frameworks (0-100)")
    control_coverage_pct: float = Field(..., description="Percentage of assets & business services covered by active controls")
    total_controls: int
    implemented_controls_count: int
    open_gaps_count: int
    critical_gaps_count: int
    overdue_assessments_count: int
    evidence_coverage_pct: float
    total_compliance_risk_exposure: float = Field(..., description="Financial risk exposure associated with compliance gaps (₹)")
    frameworks_count: int


class FrameworkItem(BaseModel):
    """Summary of a compliance framework."""
    id: str
    name: str
    version: str
    code: str
    description: Optional[str] = None
    total_controls: int
    implemented_controls: int
    gaps_count: int
    compliance_pct: float
    risk_level: RiskLevel
    last_assessment_date: Optional[datetime] = None
    status: str = "ACTIVE"


class FrameworkClauseItem(BaseModel):
    """Clause or domain within a framework (e.g. ISO 27001 Clause 5 Leadership, A.5 Organizational)."""
    clause_id: str
    title: str
    description: Optional[str] = None
    total_controls: int
    implemented_controls: int
    compliance_pct: float
    status: str


class FrameworkDetailResponse(BaseModel):
    """Detailed view of a compliance framework including clauses and metrics."""
    id: str
    name: str
    version: str
    code: str
    description: Optional[str] = None
    compliance_pct: float
    total_controls: int
    implemented_controls: int
    open_gaps_count: int
    critical_gaps_count: int
    evidence_coverage_pct: float
    financial_exposure: float
    clauses: List[FrameworkClauseItem]
    audit_history_count: int
    last_assessment_date: Optional[datetime] = None
    status: str = "ACTIVE"


class FrameworkControlItem(BaseModel):
    """Control item mapped to a compliance framework."""
    control_id: str
    code: str
    name: str
    requirement: str
    category: str
    clause: str
    owner: Optional[str] = None
    responsible_team: Optional[str] = None
    implementation_status: str
    effectiveness_score: float
    effectiveness_tier: str
    has_evidence: bool = False
    evidence_count: int = 0
    is_gap: bool = False
    gap_severity: Optional[str] = None
    risk_level: RiskLevel
    financial_exposure: float = 0.0
    mapped_assets_count: int = 0
    mapped_vulnerabilities_count: int = 0
    mapped_attack_paths_count: int = 0
    last_assessed_at: Optional[datetime] = None


class ComplianceControlDetail(BaseModel):
    """Comprehensive control inspection schema."""
    id: str
    code: str
    name: str
    control_type: str
    objective: str
    description: str
    expected_outcome: Optional[str] = None
    implementation_guidance: Optional[str] = None
    owner: Optional[str] = None
    department: Optional[str] = None
    responsible_team: Optional[str] = None
    reviewer: Optional[str] = None
    implementation_status: str
    implementation_date: Optional[datetime] = None
    technology_stack: Optional[str] = None
    process_notes: Optional[str] = None
    people_roles: Optional[str] = None
    effectiveness_score: float
    effectiveness_tier: str
    framework_mappings: List[Dict[str, Any]]
    mapped_assets: List[Dict[str, Any]]
    mapped_business_services: List[Dict[str, Any]]
    mapped_vulnerabilities: List[Dict[str, Any]]
    mapped_attack_paths: List[Dict[str, Any]]
    evidence_items: List[Dict[str, Any]]
    assessments: List[Dict[str, Any]]
    financial_exposure: float
    remediation_items: List[Dict[str, Any]]


class AssessmentItem(BaseModel):
    """Control assessment instance."""
    id: str
    framework_id: str
    framework_name: str
    control_id: str
    control_name: str
    control_code: str
    assessor_name: str
    assessment_date: datetime
    status: str
    effectiveness_score: float
    finding: Optional[str] = None
    recommendation: Optional[str] = None
    evidence_attached: int = 0


class AssessmentCreateRequest(BaseModel):
    """Payload to initiate/create an assessment."""
    framework_id: str
    control_id: str
    assessor_id: Optional[str] = None
    effectiveness_score: float = Field(..., ge=0.0, le=100.0)
    finding: Optional[str] = None
    recommendation: Optional[str] = None
    status: str = "Draft"
    notes: Optional[str] = None


class AssessmentUpdateRequest(BaseModel):
    """Payload to update an assessment."""
    effectiveness_score: Optional[float] = Field(None, ge=0.0, le=100.0)
    finding: Optional[str] = None
    recommendation: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None


class EvidenceItem(BaseModel):
    """Evidence artifact record."""
    id: str
    title: str
    description: Optional[str] = None
    control_id: str
    control_code: str
    framework_name: str
    evidence_type: str
    file_name: str
    file_size_bytes: int
    uploaded_by: str
    uploaded_at: datetime
    expiration_date: Optional[datetime] = None
    expiration_status: str = "Valid"
    verification_status: str = "Verified"
    verified_by: Optional[str] = None
    verified_at: Optional[datetime] = None


class EvidenceVerifyRequest(BaseModel):
    """Payload for evidence verification."""
    status: str = Field(..., description="Verified or Rejected")
    comments: Optional[str] = None


class ComplianceGapItem(BaseModel):
    """Identified compliance deficiency or unimplemented requirement."""
    id: str
    title: str
    description: str
    framework: str
    control_code: str
    control_name: str
    severity: str
    business_service: Optional[str] = None
    asset_name: Optional[str] = None
    risk_score: float
    risk_level: RiskLevel
    financial_exposure: float
    owner: Optional[str] = None
    due_date: Optional[datetime] = None
    status: str
    attack_paths_count: int = 0
    vulnerabilities_count: int = 0


class ComplianceGapDetailResponse(BaseModel):
    """Deep inspection of a compliance gap."""
    id: str
    title: str
    description: str
    requirement: str
    framework: str
    control_code: str
    control_name: str
    severity: str
    root_cause: str
    risk_score: float
    risk_level: RiskLevel
    financial_exposure: float
    expected_annual_loss: float
    p95_loss: float
    affected_assets: List[Dict[str, Any]]
    affected_attack_paths: List[Dict[str, Any]]
    remediation_actions: List[Dict[str, Any]]
    owner: Optional[str] = None
    due_date: Optional[datetime] = None
    status: str


class ComplianceCyberRiskMapNode(BaseModel):
    """Node in the multi-tier compliance to cyber-risk traversal chain."""
    requirement: str
    control_code: str
    control_name: str
    control_effectiveness: float
    is_gap: bool
    gap_title: Optional[str] = None
    vulnerability_cve: Optional[str] = None
    affected_asset: str
    attack_path_name: str
    business_service: str
    financial_impact: float


class ComplianceCyberRiskMapResponse(BaseModel):
    """Complete multi-tier compliance-to-cyber risk mappings."""
    chains: List[ComplianceCyberRiskMapNode]
    total_chains: int
    uncovered_critical_assets_count: int
    high_priority_remediation_count: int


class ComplianceRemediationItem(BaseModel):
    """Corrective action for a compliance finding."""
    id: str
    finding: str
    control_code: str
    owner: str
    priority: str
    due_date: datetime
    status: str
    risk_level: RiskLevel
    financial_impact: float
    risk_reduction_pct: float
    financial_reduction: float


class ComplianceAuditItem(BaseModel):
    """Compliance audit record."""
    id: str
    name: str
    framework_name: str
    auditor_name: str
    start_date: datetime
    end_date: Optional[datetime] = None
    status: str
    total_findings: int
    critical_findings: int
    scope_description: Optional[str] = None


class ComplianceAuditDetailResponse(BaseModel):
    """Comprehensive compliance audit detail schema."""
    id: str
    name: str
    framework_name: str
    auditor_name: str
    start_date: datetime
    end_date: Optional[datetime] = None
    status: str
    total_findings: int
    critical_findings: int
    scope_description: Optional[str] = None
    controls_evaluated: int = 0
    evidence_reviewed: int = 0
    findings: List[Dict[str, Any]] = []
    corrective_actions: List[Dict[str, Any]] = []


class ComplianceTrendPoint(BaseModel):
    """Historical compliance trend snapshot."""
    timestamp: datetime
    compliance_score: float
    control_effectiveness: float
    evidence_coverage: float
    open_gaps: int


class CrossFrameworkMappingItem(BaseModel):
    """Common control cross-mapping between standards."""
    common_control_name: str
    iso_27001_control: str
    nist_csf_control: str
    soc2_control: str
    pci_dss_control: str
    implementation_status: str
    effectiveness_score: float
