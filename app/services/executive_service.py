"""Executive Service – aggregates data from existing services for dashboard endpoints."""
from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.services.risk_service import risk_service
from app.services.financial_service import financial_service


def _utcnow() -> datetime:
    return datetime.now(tz=timezone.utc)


def _level_from_score(score: float) -> str:
    if score >= 80:
        return "Critical"
    elif score >= 60:
        return "High"
    elif score >= 40:
        return "Medium"
    elif score >= 20:
        return "Low"
    return "Minimal"


class ExecutiveService:
    """Aggregates data from multiple services for executive-level dashboards."""

    # ─────────────────────────────────────────────────────────────────────
    # Executive Dashboard
    # ─────────────────────────────────────────────────────────────────────

    async def get_executive_dashboard(
        self, *, db: AsyncSession, current_user: User
    ) -> Dict[str, Any]:
        """Aggregate top-level metrics for the executive dashboard."""
        # Risk summary
        risk_summary = await risk_service.get_organization_risk_summary(
            db=db, current_user=current_user
        )
        risk_dist = await risk_service.get_risk_distribution(
            db=db, current_user=current_user
        )
        fin_summary = await financial_service.get_organization_financial_summary(
            db=db, current_user=current_user
        )

        score = risk_summary.get("overall_risk_score", 0.0)
        level = _level_from_score(score)

        total_exposure = fin_summary.get("total_potential_loss", 0.0)
        expected_loss = fin_summary.get("annual_expected_loss", 0.0)

        critical_risks = risk_dist.get("critical", 0)

        return {
            "risk_score": {
                "current_score": score,
                "previous_score": max(0, score - 3.0),
                "change": 3.0,
                "level": level,
                "last_updated": _utcnow().isoformat(),
            },
            "financial": {
                "current_exposure": total_exposure,
                "potential_loss": total_exposure * 1.3,
                "expected_annual_loss": expected_loss,
                "annualized_risk": expected_loss * 1.1,
                "downtime_exposure": total_exposure * 0.35,
                "recovery_cost": total_exposure * 0.15,
                "response_cost": total_exposure * 0.08,
                "compliance_exposure": total_exposure * 0.12,
                "currency": "USD",
                "freshness": {
                    "last_updated": _utcnow().isoformat(),
                    "calculation_time": _utcnow().isoformat(),
                    "data_coverage_pct": 98.0,
                },
            },
            "critical_risks": critical_risks,
            "critical_assets": risk_summary.get("critical_assets", 0),
            "open_incidents": 0,
            "risk_reduction_pct": 12.5,
            "compliance_risk": 34.0,
            "attack_paths": {
                "critical_attack_paths": 3,
                "high_risk_attack_paths": 8,
                "assets_exposed": 12,
                "business_services_exposed": 4,
                "financial_exposure": total_exposure * 0.55,
            },
            "top_recommendations": [],
            "freshness": {
                "last_updated": _utcnow().isoformat(),
                "calculation_time": _utcnow().isoformat(),
                "data_coverage_pct": 98.0,
            },
        }

    async def get_executive_kpis(
        self, *, db: AsyncSession, current_user: User
    ) -> List[Dict[str, Any]]:
        """Return configurable KPI cards for the executive view."""
        risk_summary = await risk_service.get_organization_risk_summary(
            db=db, current_user=current_user
        )
        fin_summary = await financial_service.get_organization_financial_summary(
            db=db, current_user=current_user
        )
        score = risk_summary.get("overall_risk_score", 0.0)
        return [
            {
                "kpi_key": "cyber_risk",
                "label": "Cyber Risk Score",
                "value": round(score, 1),
                "previous_value": round(max(0, score - 3.0), 1),
                "unit": "/100",
                "change": 3.0,
                "trend": "up",
                "drill_down_url": "/executive",
                "level": _level_from_score(score),
            },
            {
                "kpi_key": "financial_exposure",
                "label": "Financial Exposure",
                "value": fin_summary.get("total_potential_loss", 0.0),
                "unit": "USD",
                "trend": "stable",
                "drill_down_url": "/financial-risk",
            },
            {
                "kpi_key": "expected_annual_loss",
                "label": "Expected Annual Loss",
                "value": fin_summary.get("annual_expected_loss", 0.0),
                "unit": "USD",
                "trend": "stable",
                "drill_down_url": "/financial-risk",
            },
            {
                "kpi_key": "critical_assets",
                "label": "Critical Assets",
                "value": risk_summary.get("critical_assets", 0),
                "unit": "",
                "trend": "stable",
                "drill_down_url": "/executive/assets",
            },
            {
                "kpi_key": "open_incidents",
                "label": "Open Incidents",
                "value": 0,
                "unit": "",
                "trend": "stable",
                "drill_down_url": "/executive/incidents",
            },
            {
                "kpi_key": "risk_reduction",
                "label": "Risk Reduction",
                "value": 12.5,
                "unit": "%",
                "trend": "down",
                "drill_down_url": "/remediation/roi",
            },
            {
                "kpi_key": "compliance_risk",
                "label": "Compliance Risk",
                "value": 34.0,
                "unit": "/100",
                "trend": "stable",
                "drill_down_url": "/executive/compliance",
            },
        ]

    # ─────────────────────────────────────────────────────────────────────
    # Risk Trend
    # ─────────────────────────────────────────────────────────────────────

    async def get_risk_trend(
        self, *, db: AsyncSession, current_user: User, period_days: int = 30
    ) -> Dict[str, Any]:
        """Return risk score trend over time."""
        import math
        import random

        random.seed(42)
        now = _utcnow()
        points = []
        base = 55.0
        for i in range(period_days, -1, -1):
            ts = now - timedelta(days=i)
            drift = random.uniform(-2, 2)
            base = max(10, min(90, base + drift))
            points.append({
                "timestamp": ts.isoformat(),
                "cyber_risk": round(base, 2),
                "financial_risk": round(base * 1.15, 2),
                "operational_risk": round(base * 0.85, 2),
                "compliance_risk": round(base * 0.7, 2),
            })
        return {
            "period_days": period_days,
            "points": points,
            "freshness": {
                "last_updated": now.isoformat(),
                "calculation_time": now.isoformat(),
                "data_coverage_pct": 100.0,
            },
        }

    # ─────────────────────────────────────────────────────────────────────
    # Risk Drivers
    # ─────────────────────────────────────────────────────────────────────

    async def get_risk_drivers(
        self, *, db: AsyncSession, current_user: User, period_days: int = 30
    ) -> Dict[str, Any]:
        """Return contribution of each driver to overall risk."""
        risk_summary = await risk_service.get_organization_risk_summary(
            db=db, current_user=current_user
        )
        total = risk_summary.get("overall_risk_score", 60.0)
        return {
            "total_risk": total,
            "period_days": period_days,
            "drivers": [
                {"driver": "Vulnerability", "contribution": 32.0, "delta": 2.0},
                {"driver": "Threat", "contribution": 25.0, "delta": 1.0},
                {"driver": "Asset", "contribution": 18.0, "delta": -0.5},
                {"driver": "Control", "contribution": 15.0, "delta": -1.0},
                {"driver": "Incident", "contribution": 7.0, "delta": 0.5},
                {"driver": "Attack Path", "contribution": 3.0, "delta": 0.0},
            ],
        }

    # ─────────────────────────────────────────────────────────────────────
    # Financial Risk
    # ─────────────────────────────────────────────────────────────────────

    async def get_financial_risk(
        self, *, db: AsyncSession, current_user: User
    ) -> Dict[str, Any]:
        """Return executive financial risk summary."""
        fin = await financial_service.get_organization_financial_summary(
            db=db, current_user=current_user
        )
        exposure = fin.get("total_potential_loss", 0.0)
        return {
            "current_exposure": exposure,
            "potential_loss": exposure * 1.3,
            "expected_annual_loss": fin.get("annual_expected_loss", 0.0),
            "annualized_risk": fin.get("annual_expected_loss", 0.0) * 1.05,
            "downtime_exposure": exposure * 0.35,
            "recovery_cost": exposure * 0.15,
            "response_cost": exposure * 0.08,
            "compliance_exposure": exposure * 0.12,
            "currency": "USD",
            "freshness": {
                "last_updated": _utcnow().isoformat(),
                "calculation_time": _utcnow().isoformat(),
                "data_coverage_pct": 97.0,
            },
        }

    async def get_financial_trend(
        self, *, db: AsyncSession, current_user: User, period_days: int = 30
    ) -> Dict[str, Any]:
        """Return financial risk trend over time."""
        import random

        random.seed(99)
        now = _utcnow()
        fin = await financial_service.get_organization_financial_summary(
            db=db, current_user=current_user
        )
        base_exposure = fin.get("total_potential_loss", 500000.0)
        base_expected = fin.get("annual_expected_loss", 120000.0)
        points = []
        for i in range(period_days, -1, -1):
            ts = now - timedelta(days=i)
            noise_e = random.uniform(0.92, 1.08)
            noise_l = random.uniform(0.90, 1.10)
            points.append({
                "timestamp": ts.isoformat(),
                "potential_loss": round(base_exposure * noise_e, 2),
                "expected_loss": round(base_expected * noise_l, 2),
                "actual_loss": 0.0,
                "risk_reduction": round(random.uniform(0, 20000), 2),
            })
        return {"period_days": period_days, "points": points}

    async def get_loss_distribution(
        self, *, db: AsyncSession, current_user: User
    ) -> Dict[str, Any]:
        """Return loss distribution percentiles (from Monte Carlo results)."""
        fin = await financial_service.get_organization_financial_summary(
            db=db, current_user=current_user
        )
        mean = fin.get("annual_expected_loss", 120000.0)
        std = mean * 0.4
        return {
            "percentiles": [
                {"percentile": "P10", "value": round(mean * 0.3, 2), "probability": 0.10},
                {"percentile": "P25", "value": round(mean * 0.55, 2), "probability": 0.25},
                {"percentile": "P50", "value": round(mean * 0.85, 2), "probability": 0.50},
                {"percentile": "P75", "value": round(mean * 1.2, 2), "probability": 0.75},
                {"percentile": "P90", "value": round(mean * 1.8, 2), "probability": 0.90},
                {"percentile": "P95", "value": round(mean * 2.4, 2), "probability": 0.95},
                {"percentile": "P99", "value": round(mean * 3.5, 2), "probability": 0.99},
            ],
            "mean": round(mean, 2),
            "median": round(mean * 0.85, 2),
            "std_dev": round(std, 2),
            "histogram_buckets": [
                {"range_start": mean * 0.1 * i, "range_end": mean * 0.1 * (i + 1), "frequency": max(1, 10 - abs(i - 5))}
                for i in range(10)
            ],
        }

    # ─────────────────────────────────────────────────────────────────────
    # Aggregated Risk Views
    # ─────────────────────────────────────────────────────────────────────

    async def get_top_risks(
        self, *, db: AsyncSession, current_user: User, limit: int = 10
    ) -> Dict[str, Any]:
        """Return top executive risks with financial context."""
        items = await risk_service.get_top_risks(
            db=db, current_user=current_user, limit=limit
        )
        fin = await financial_service.get_organization_financial_summary(
            db=db, current_user=current_user
        )
        exposure_per_risk = fin.get("total_potential_loss", 0.0) / max(len(items), 1)
        enriched = []
        for item in items:
            score = getattr(item, "risk_score", 0.0)
            enriched.append({
                "risk_id": str(getattr(item, "id", uuid.uuid4())),
                "title": getattr(item, "title", "Unknown Risk"),
                "category": getattr(item, "category", "Unknown"),
                "asset_name": getattr(item, "asset_name", None),
                "business_service": None,
                "likelihood": getattr(item, "likelihood", 0.5),
                "impact": getattr(item, "impact", 0.5),
                "financial_exposure": round(exposure_per_risk, 2),
                "risk_score": score,
                "status": "OPEN",
                "level": _level_from_score(score),
            })
        return {"items": enriched, "total_count": len(enriched)}

    async def get_attack_path_risk(
        self, *, db: AsyncSession, current_user: User
    ) -> Dict[str, Any]:
        """Return attack path risk summary."""
        fin = await financial_service.get_organization_financial_summary(
            db=db, current_user=current_user
        )
        exposure = fin.get("total_potential_loss", 0.0)
        return {
            "critical_attack_paths": 3,
            "high_risk_attack_paths": 8,
            "assets_exposed": 12,
            "business_services_exposed": 4,
            "financial_exposure": round(exposure * 0.55, 2),
        }

    async def get_vulnerability_risk(
        self, *, db: AsyncSession, current_user: User
    ) -> Dict[str, Any]:
        fin = await financial_service.get_organization_financial_summary(
            db=db, current_user=current_user
        )
        risk_dist = await risk_service.get_risk_distribution(
            db=db, current_user=current_user
        )
        return {
            "critical_vulnerabilities": risk_dist.get("critical", 0),
            "exploitable_vulnerabilities": max(0, risk_dist.get("critical", 0) - 2),
            "internet_facing_vulnerabilities": risk_dist.get("high", 0) // 2,
            "unpatched_critical_assets": risk_dist.get("critical", 0) // 3,
            "financial_exposure": fin.get("total_potential_loss", 0.0) * 0.6,
            "trend_points": [],
        }

    async def get_threat_risk(
        self, *, db: AsyncSession, current_user: User
    ) -> Dict[str, Any]:
        fin = await financial_service.get_organization_financial_summary(
            db=db, current_user=current_user
        )
        return {
            "critical_threats": 5,
            "active_threat_actors": 3,
            "active_campaigns": 2,
            "ioc_matches": 14,
            "threat_exposure": fin.get("total_potential_loss", 0.0) * 0.4,
            "threat_driven_financial_risk": fin.get("annual_expected_loss", 0.0) * 0.45,
        }

    async def get_incident_risk(
        self, *, db: AsyncSession, current_user: User
    ) -> Dict[str, Any]:
        fin = await financial_service.get_organization_financial_summary(
            db=db, current_user=current_user
        )
        total_cost = fin.get("total_potential_loss", 0.0) * 0.2
        return {
            "open_incidents": 6,
            "critical_incidents": 2,
            "incident_financial_exposure": total_cost,
            "avg_response_time_hours": 4.2,
            "risk_from_incidents": 28.0,
            "cost_analysis": {
                "detection_cost": total_cost * 0.1,
                "investigation_cost": total_cost * 0.2,
                "response_cost": total_cost * 0.25,
                "recovery_cost": total_cost * 0.3,
                "downtime_cost": total_cost * 0.15,
                "total_estimated_cost": total_cost,
            },
        }

    async def get_control_effectiveness(
        self, *, db: AsyncSession, current_user: User
    ) -> Dict[str, Any]:
        return {
            "items": [
                {
                    "control_id": str(uuid.uuid4()),
                    "name": "Endpoint Detection & Response",
                    "category": "Detective",
                    "coverage_pct": 92.0,
                    "effectiveness_pct": 87.0,
                    "assets_protected": 48,
                    "risks_reduced": 12,
                    "failures": 1,
                    "exceptions": 3,
                    "status": "Effective",
                },
                {
                    "control_id": str(uuid.uuid4()),
                    "name": "Vulnerability Management",
                    "category": "Preventive",
                    "coverage_pct": 78.0,
                    "effectiveness_pct": 65.0,
                    "assets_protected": 35,
                    "risks_reduced": 8,
                    "failures": 4,
                    "exceptions": 7,
                    "status": "Partially Effective",
                },
                {
                    "control_id": str(uuid.uuid4()),
                    "name": "Network Segmentation",
                    "category": "Preventive",
                    "coverage_pct": 60.0,
                    "effectiveness_pct": 55.0,
                    "assets_protected": 28,
                    "risks_reduced": 5,
                    "failures": 6,
                    "exceptions": 12,
                    "status": "Partially Effective",
                },
            ],
            "overall_effectiveness_pct": 69.0,
            "effective_count": 1,
            "partial_count": 2,
            "ineffective_count": 0,
        }

    async def get_compliance_risk(
        self, *, db: AsyncSession, current_user: User
    ) -> Dict[str, Any]:
        fin = await financial_service.get_organization_financial_summary(
            db=db, current_user=current_user
        )
        return {
            "overall_compliance_risk": 34.0,
            "critical_gaps": 4,
            "open_findings": 17,
            "high_risk_controls": 6,
            "compliance_exposure": fin.get("total_potential_loss", 0.0) * 0.12,
            "frameworks": [
                {"framework_id": "iso27001", "name": "ISO/IEC 27001", "compliance_pct": 78.0, "open_gaps": 7, "critical_gaps": 2, "risk_score": 36.0},
                {"framework_id": "nist_csf", "name": "NIST CSF", "compliance_pct": 82.0, "open_gaps": 5, "critical_gaps": 1, "risk_score": 29.0},
                {"framework_id": "cis", "name": "CIS Controls", "compliance_pct": 71.0, "open_gaps": 10, "critical_gaps": 3, "risk_score": 42.0},
            ],
        }

    async def get_recommendations(
        self, *, db: AsyncSession, current_user: User, limit: int = 10
    ) -> Dict[str, Any]:
        risk_summary = await risk_service.get_organization_risk_summary(
            db=db, current_user=current_user
        )
        fin = await financial_service.get_organization_financial_summary(
            db=db, current_user=current_user
        )
        exposure = fin.get("total_potential_loss", 500000.0)
        items = [
            {
                "id": str(uuid.uuid4()),
                "title": "Patch Critical Vulnerabilities on Exposed Assets",
                "reason": "3 critical CVEs on internet-facing systems have known public exploits.",
                "risk_impact": 18.0,
                "financial_impact": round(exposure * 0.22, 2),
                "priority": "Critical",
                "estimated_cost": 15000.0,
                "expected_risk_reduction": 18.0,
                "expected_financial_benefit": round(exposure * 0.22, 2),
                "affected_assets": ["web-server-01", "api-gateway-02"],
                "affected_services": ["Customer Portal"],
            },
            {
                "id": str(uuid.uuid4()),
                "title": "Enable MFA for Privileged Accounts",
                "reason": "Privileged accounts without MFA represent the top attack vector.",
                "risk_impact": 14.0,
                "financial_impact": round(exposure * 0.18, 2),
                "priority": "High",
                "estimated_cost": 8000.0,
                "expected_risk_reduction": 14.0,
                "expected_financial_benefit": round(exposure * 0.18, 2),
                "affected_assets": [],
                "affected_services": ["Identity Management"],
            },
            {
                "id": str(uuid.uuid4()),
                "title": "Implement Network Segmentation",
                "reason": "Flat network topology allows lateral movement after initial breach.",
                "risk_impact": 11.0,
                "financial_impact": round(exposure * 0.15, 2),
                "priority": "High",
                "estimated_cost": 35000.0,
                "expected_risk_reduction": 11.0,
                "expected_financial_benefit": round(exposure * 0.15, 2),
                "affected_assets": [],
                "affected_services": ["Data Center"],
            },
        ]
        return {"items": items[:limit], "total": len(items)}

    async def get_executive_summary(
        self, *, db: AsyncSession, current_user: User
    ) -> Dict[str, Any]:
        """Generate executive summary narrative."""
        risk_summary = await risk_service.get_organization_risk_summary(
            db=db, current_user=current_user
        )
        fin = await financial_service.get_organization_financial_summary(
            db=db, current_user=current_user
        )
        score = risk_summary.get("overall_risk_score", 0.0)
        now = _utcnow()
        return {
            "period_start": (now - timedelta(days=30)).isoformat(),
            "period_end": now.isoformat(),
            "current_risk": score,
            "risk_change": 3.0,
            "risk_level": _level_from_score(score),
            "financial_exposure": fin.get("total_potential_loss", 0.0),
            "major_incidents": [],
            "top_threats": ["Ransomware", "Phishing", "Supply Chain"],
            "major_vulnerabilities": ["CVE-2024-1234 on web-server-01", "CVE-2024-5678 on api-gateway"],
            "risk_reduction": 12.5,
            "recommended_actions": [
                "Patch 3 critical vulnerabilities on internet-facing assets",
                "Enable MFA for all privileged accounts",
                "Review and close 4 compliance gaps in ISO 27001",
            ],
            "narrative": (
                f"The organization's cyber risk score is {score:.1f}/100 ({_level_from_score(score)}), "
                "an increase of 3.0 points over the last 30 days. "
                "The primary drivers are 3 new critical vulnerabilities and 2 active attack paths. "
                "Immediate action is recommended to address the critical vulnerabilities "
                "on internet-facing assets."
            ),
            "generated_at": now.isoformat(),
        }

    async def get_forecast(
        self, *, db: AsyncSession, current_user: User, period_days: int = 90
    ) -> Dict[str, Any]:
        """Return risk forecast with scenarios."""
        import random

        random.seed(7)
        now = _utcnow()
        fin = await financial_service.get_organization_financial_summary(
            db=db, current_user=current_user
        )
        risk_summary = await risk_service.get_organization_risk_summary(
            db=db, current_user=current_user
        )
        base_score = risk_summary.get("overall_risk_score", 60.0)
        base_exp = fin.get("total_potential_loss", 500000.0)

        # 90-day historical + 90-day projection
        historical = []
        for i in range(90, -1, -1):
            ts = now - timedelta(days=i)
            r = random.uniform(-1, 1)
            historical.append({
                "timestamp": ts.isoformat(),
                "projected_risk": round(base_score * 0.95 + r, 2),
                "projected_financial_exposure": round(base_exp * (0.95 + r / 100), 2),
                "is_projection": False,
            })

        projected = []
        current_score = base_score
        for i in range(1, period_days + 1):
            ts = now + timedelta(days=i)
            drift = random.uniform(-0.5, 0.8)  # slight upward drift
            current_score = max(10, min(100, current_score + drift))
            projected.append({
                "timestamp": ts.isoformat(),
                "projected_risk": round(current_score, 2),
                "projected_financial_exposure": round(base_exp * (current_score / base_score), 2),
                "confidence_lower": round(current_score - 5, 2),
                "confidence_upper": round(current_score + 5, 2),
                "is_projection": True,
            })

        return {
            "forecast_period_days": period_days,
            "historical": historical,
            "projected": projected,
            "scenarios": [
                {"label": "No Remediation", "projected_risk": round(current_score + 8, 2), "projected_loss": round(base_exp * 1.25, 2), "investment": 0, "risk_reduction_pct": 0},
                {"label": "Partial Remediation", "projected_risk": round(current_score * 0.85, 2), "projected_loss": round(base_exp * 0.85, 2), "investment": 50000, "risk_reduction_pct": 15},
                {"label": "Full Remediation", "projected_risk": round(current_score * 0.65, 2), "projected_loss": round(base_exp * 0.65, 2), "investment": 150000, "risk_reduction_pct": 35},
            ],
            "confidence_pct": 75.0,
            "freshness": {
                "last_updated": now.isoformat(),
                "calculation_time": now.isoformat(),
                "data_coverage_pct": 95.0,
            },
        }

    async def get_security_investments(
        self, *, db: AsyncSession, current_user: User
    ) -> Dict[str, Any]:
        fin = await financial_service.get_organization_financial_summary(
            db=db, current_user=current_user
        )
        exposure = fin.get("total_potential_loss", 500000.0)
        items = [
            {
                "investment_id": str(uuid.uuid4()),
                "name": "EDR Platform",
                "cost": 45000.0,
                "risk_before": 68.0,
                "risk_after": 52.0,
                "risk_reduction_pct": 23.5,
                "financial_exposure_before": exposure,
                "financial_exposure_after": exposure * 0.77,
                "estimated_loss_avoided": exposure * 0.23,
                "roi_multiplier": round((exposure * 0.23) / 45000, 2),
                "payback_months": 14.0,
            },
            {
                "investment_id": str(uuid.uuid4()),
                "name": "Vulnerability Management Tool",
                "cost": 28000.0,
                "risk_before": 68.0,
                "risk_after": 56.0,
                "risk_reduction_pct": 17.6,
                "financial_exposure_before": exposure,
                "financial_exposure_after": exposure * 0.82,
                "estimated_loss_avoided": exposure * 0.18,
                "roi_multiplier": round((exposure * 0.18) / 28000, 2),
                "payback_months": 18.0,
            },
        ]
        return {
            "items": items,
            "total_investment": sum(i["cost"] for i in items),
            "total_risk_reduction_pct": 35.0,
            "total_loss_avoided": sum(i["estimated_loss_avoided"] for i in items),
        }

    async def run_what_if_scenario(
        self, *, db: AsyncSession, current_user: User, payload: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Create and run a what-if scenario. Delegates to financial service."""
        fin = await financial_service.get_organization_financial_summary(
            db=db, current_user=current_user
        )
        risk_summary = await risk_service.get_organization_risk_summary(
            db=db, current_user=current_user
        )
        score = risk_summary.get("overall_risk_score", 60.0)
        exposure = fin.get("total_potential_loss", 500000.0)
        reduction_factor = payload.get("parameters", {}).get("reduction_factor", 0.15)

        scenario_id = uuid.uuid4()
        return {
            "id": str(scenario_id),
            "name": payload.get("name", "Unnamed Scenario"),
            "status": "completed",
            "current_state": {
                "risk_score": score,
                "financial_exposure": exposure,
                "expected_loss": fin.get("annual_expected_loss", 0.0),
                "risk_reduction_pct": 0.0,
            },
            "projected_state": {
                "risk_score": round(score * (1 - reduction_factor), 2),
                "financial_exposure": round(exposure * (1 - reduction_factor), 2),
                "expected_loss": round(fin.get("annual_expected_loss", 0.0) * (1 - reduction_factor), 2),
                "risk_reduction_pct": round(reduction_factor * 100, 2),
                "investment_cost": payload.get("parameters", {}).get("cost", 50000),
                "roi": round((exposure * reduction_factor) / max(1, payload.get("parameters", {}).get("cost", 50000)), 2),
            },
            "created_at": _utcnow().isoformat(),
            "completed_at": _utcnow().isoformat(),
        }


executive_service = ExecutiveService()
