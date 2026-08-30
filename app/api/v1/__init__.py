from fastapi import APIRouter

from app.api.v1.auth import router as auth_router
from app.api.v1.health import router as health_router
from app.api.v1.organizations import router as organizations_router
from app.api.v1.users import router as users_router
from app.api.v1.assets import router as assets_router
from app.api.v1.software import router as software_router
from app.api.v1.vulnerabilities import router as vulnerabilities_router
from app.api.v1.cves import router as cves_router
from app.api.v1.vulnerability_search import router as vulnerability_search_router
from app.api.v1.validation import router as validation_router
from app.api.v1.evidence import router as evidence_router
from app.api.v1.risk import router as risk_router
from app.api.v1.financial import router as financial_router
from app.api.v1.simulation import router as simulation_router
from app.api.v1.network import router as network_router
from app.api.v1.attack_paths import router as attack_paths_router
from app.api.v1.threat_scenarios import router as threat_scenarios_router
from app.api.v1.remediations import router as remediations_router
from app.api.v1.controls import router as controls_router
from app.api.v1.optimization import router as optimization_router
from app.api.v1.dashboard import router as dashboard_router
from app.api.v1.analytics import router as analytics_router
from app.api.v1.reports import router as reports_router
from app.api.v1.trends import router as trends_router
from app.api.v1.system import router as system_router
from app.api.v1.compliance import router as compliance_router
from app.api.v1.threat_intelligence import router as threat_intelligence_router
from app.api.v1.monitoring import router as monitoring_router
from app.api.v1.alerts import router as alerts_management_router
from app.api.v1.detection_rules import router as detection_rules_router
from app.api.v1.incidents import router as incidents_router
from app.api.v1.soc import router as soc_router
from app.api.v1.playbooks import router as playbooks_router
from app.api.v1.response_executions import router as response_executions_router
from app.api.v1.approvals import router as approvals_router
from app.api.v1.cases import router as cases_router
from app.api.v1.soc_remediations import router as soc_remediations_router
from app.api.v1.executive import router as executive_router
from app.api.v1.admin import router as admin_router
from app.api.v1.notifications import router as notifications_router
from app.api.v1.audit import router as audit_router
from app.api.v1.integrations import router as integrations_router
from app.api.v1.imports import router as imports_router
from app.api.v1.webhooks import router as webhooks_router

api_v1_router = APIRouter()

api_v1_router.include_router(health_router)
api_v1_router.include_router(auth_router)
api_v1_router.include_router(users_router)
api_v1_router.include_router(organizations_router)
api_v1_router.include_router(assets_router)
api_v1_router.include_router(software_router)
api_v1_router.include_router(vulnerabilities_router)
api_v1_router.include_router(cves_router)
api_v1_router.include_router(vulnerability_search_router)
api_v1_router.include_router(validation_router)
api_v1_router.include_router(evidence_router)
api_v1_router.include_router(risk_router)
api_v1_router.include_router(financial_router)
api_v1_router.include_router(simulation_router)
api_v1_router.include_router(network_router)
api_v1_router.include_router(attack_paths_router)
api_v1_router.include_router(threat_scenarios_router)
api_v1_router.include_router(remediations_router)
api_v1_router.include_router(controls_router)
api_v1_router.include_router(compliance_router)
api_v1_router.include_router(optimization_router)
api_v1_router.include_router(dashboard_router)
api_v1_router.include_router(analytics_router)
api_v1_router.include_router(reports_router)
api_v1_router.include_router(trends_router)
api_v1_router.include_router(system_router)
api_v1_router.include_router(threat_intelligence_router)
api_v1_router.include_router(monitoring_router)
api_v1_router.include_router(alerts_management_router)
api_v1_router.include_router(detection_rules_router)
api_v1_router.include_router(incidents_router)
api_v1_router.include_router(soc_router)
api_v1_router.include_router(playbooks_router)
api_v1_router.include_router(response_executions_router)
api_v1_router.include_router(approvals_router)
api_v1_router.include_router(cases_router)
api_v1_router.include_router(soc_remediations_router)
api_v1_router.include_router(executive_router)
api_v1_router.include_router(admin_router)
api_v1_router.include_router(notifications_router)
api_v1_router.include_router(audit_router)
api_v1_router.include_router(integrations_router)
api_v1_router.include_router(imports_router)
api_v1_router.include_router(webhooks_router)

__all__ = ["api_v1_router"]
