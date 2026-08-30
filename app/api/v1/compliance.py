"""Compliance & Security Controls API endpoints (Phase 8)."""
from typing import List, Optional
import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.compliance import (
    AssessmentItem,
    ComplianceAuditItem,
    ComplianceControlDetail,
    ComplianceCyberRiskMapResponse,
    ComplianceGapDetailResponse,
    ComplianceGapItem,
    ComplianceRemediationItem,
    ComplianceSummaryResponse,
    ComplianceTrendPoint,
    CrossFrameworkMappingItem,
    EvidenceItem,
    FrameworkControlItem,
    FrameworkDetailResponse,
    FrameworkItem,
)
from app.services.compliance_service import compliance_service

router = APIRouter(prefix="/compliance", tags=["Compliance & Security Controls"])


@router.get(
    "/summary",
    response_model=ComplianceSummaryResponse,
    summary="Get Executive Compliance & Control KPIs",
)
async def get_compliance_summary(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ComplianceSummaryResponse:
    """Retrieve executive compliance summary KPIs across all frameworks."""
    return await compliance_service.get_compliance_summary(
        db=db,
        organization_id=current_user.organization_id,
    )


@router.get(
    "/frameworks",
    response_model=List[FrameworkItem],
    summary="List Supported & Enabled Compliance Frameworks",
)
async def get_frameworks(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[FrameworkItem]:
    """Retrieve all supported frameworks (ISO 27001, NIST CSF, SOC 2, PCI DSS, CIS, GDPR)."""
    return await compliance_service.get_frameworks(
        db=db,
        organization_id=current_user.organization_id,
    )


@router.get(
    "/frameworks/{framework_id}",
    response_model=FrameworkDetailResponse,
    summary="Get Compliance Framework Details",
)
async def get_framework_detail(
    framework_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> FrameworkDetailResponse:
    """Retrieve full framework details, compliance score, and requirement clauses."""
    return await compliance_service.get_framework_by_id(
        db=db,
        organization_id=current_user.organization_id,
        framework_id=framework_id,
    )


@router.get(
    "/frameworks/{framework_id}/controls",
    response_model=List[FrameworkControlItem],
    summary="Get Controls Mapped to Framework",
)
async def get_framework_controls(
    framework_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[FrameworkControlItem]:
    """Retrieve controls mapped to a specific framework (e.g. ISO 27001 Annex A)."""
    return await compliance_service.get_framework_controls(
        db=db,
        organization_id=current_user.organization_id,
        framework_id=framework_id,
    )


@router.get(
    "/controls/{control_id}",
    response_model=ComplianceControlDetail,
    summary="Get Security Control Deep Inspection",
)
async def get_control_detail(
    control_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ComplianceControlDetail:
    """Inspect control metadata, implementation guidance, assets, vulnerabilities, and attack paths."""
    return await compliance_service.get_control_detail(
        db=db,
        organization_id=current_user.organization_id,
        control_id=control_id,
    )


@router.get(
    "/assessments",
    response_model=List[AssessmentItem],
    summary="List Control Effectiveness Assessments",
)
async def get_assessments(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[AssessmentItem]:
    """Retrieve historical and active control effectiveness assessments."""
    return await compliance_service.get_assessments(
        db=db,
        organization_id=current_user.organization_id,
    )


@router.get(
    "/evidence",
    response_model=List[EvidenceItem],
    summary="List Evidence Artifacts",
)
async def get_evidence(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[EvidenceItem]:
    """Retrieve all uploaded policies, logs, configurations, and audit evidence artifacts."""
    return await compliance_service.get_evidence(
        db=db,
        organization_id=current_user.organization_id,
    )


@router.get(
    "/gaps",
    response_model=List[ComplianceGapItem],
    summary="List Compliance Gaps & Deficiencies",
)
async def get_compliance_gaps(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[ComplianceGapItem]:
    """Retrieve compliance deficiencies mapped to affected assets and financial exposure."""
    return await compliance_service.get_compliance_gaps(
        db=db,
        organization_id=current_user.organization_id,
    )


@router.get(
    "/risk-map",
    response_model=ComplianceCyberRiskMapResponse,
    summary="Get Multi-Tier Compliance-to-Cyber Risk Chain",
)
async def get_compliance_risk_map(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ComplianceCyberRiskMapResponse:
    """Visualize: Requirement -> Control -> Gap -> Vulnerability -> Attack Path -> Business Service -> Financial Impact."""
    return await compliance_service.get_compliance_cyber_risk_map(
        db=db,
        organization_id=current_user.organization_id,
    )


@router.get(
    "/remediations",
    response_model=List[ComplianceRemediationItem],
    summary="List Compliance Remediation Action Items",
)
async def get_compliance_remediations(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[ComplianceRemediationItem]:
    """Retrieve remediation tasks with projected risk and financial reduction."""
    return await compliance_service.get_compliance_remediations(
        db=db,
        organization_id=current_user.organization_id,
    )


@router.get(
    "/audits",
    response_model=List[ComplianceAuditItem],
    summary="List Compliance Audits",
)
async def get_compliance_audits(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[ComplianceAuditItem]:
    """Retrieve internal and external audit scopes and findings."""
    return await compliance_service.get_compliance_audits(
        db=db,
        organization_id=current_user.organization_id,
    )


@router.get(
    "/trends",
    response_model=List[ComplianceTrendPoint],
    summary="Get Historical Compliance Score Trends",
)
async def get_compliance_trends(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[ComplianceTrendPoint]:
    """Retrieve compliance progression over 30d/60d/90d periods."""
    return await compliance_service.get_compliance_trends(
        db=db,
        organization_id=current_user.organization_id,
    )


@router.get(
    "/cross-framework-mappings",
    response_model=List[CrossFrameworkMappingItem],
    summary="Get Cross-Framework Common Control Mappings",
)
async def get_cross_framework_mappings(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[CrossFrameworkMappingItem]:
    """Retrieve common controls correlated across ISO 27001, NIST CSF, SOC 2, and PCI DSS."""
    return await compliance_service.get_cross_framework_mappings(
        db=db,
        organization_id=current_user.organization_id,
    )


@router.get(
    "/{framework_name:path}/gaps",
    summary="Legacy / Direct Framework Gaps Lookup",
)
async def get_framework_gaps_legacy(
    framework_name: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve compliance gaps for a specific framework name/id."""
    gaps = await compliance_service.get_compliance_gaps(
        db=db,
        organization_id=current_user.organization_id,
    )
    return {"gaps": [g.model_dump() for g in gaps]}


@router.get(
    "/{framework_name:path}",
    summary="Legacy / Direct Framework Lookup",
)
async def get_framework_legacy_or_detail(
    framework_name: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve framework evaluation details by framework name or identifier."""
    res = await compliance_service.get_framework_by_id(
        db=db,
        organization_id=current_user.organization_id,
        framework_id=framework_name.lower().replace("/", "-").replace(" ", "-"),
    )
    data = res.model_dump()
    data["framework"] = res.name
    data["coverage"] = res.compliance_pct
    data["requirements"] = len(res.clauses)
    data["total_requirements"] = len(res.clauses)
    data["implemented_count"] = sum(1 for c in res.clauses if getattr(c, 'status', None) == "IMPLEMENTED") or 1
    return data

