"""Phase 2 enumerations for Asset and Software models."""
import enum


class AssetType(str, enum.Enum):
    """Classification of the physical or logical asset type."""
    SERVER = "SERVER"
    WORKSTATION = "WORKSTATION"
    LAPTOP = "LAPTOP"
    DESKTOP = "DESKTOP"
    DATABASE = "DATABASE"
    WEB_APPLICATION = "WEB_APPLICATION"
    API = "API"
    NETWORK_DEVICE = "NETWORK_DEVICE"
    FIREWALL = "FIREWALL"
    ROUTER = "ROUTER"
    SWITCH = "SWITCH"
    IOT_DEVICE = "IOT_DEVICE"
    CLOUD_RESOURCE = "CLOUD_RESOURCE"
    CONTAINER = "CONTAINER"
    VIRTUAL_MACHINE = "VIRTUAL_MACHINE"
    OTHER = "OTHER"


class AssetEnvironment(str, enum.Enum):
    """Deployment environment where the asset operates."""
    PRODUCTION = "PRODUCTION"
    STAGING = "STAGING"
    DEVELOPMENT = "DEVELOPMENT"
    TESTING = "TESTING"
    DISASTER_RECOVERY = "DISASTER_RECOVERY"
    OTHER = "OTHER"


class AssetCriticality(str, enum.Enum):
    """Business criticality rating used by the future Risk Engine."""
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

    @classmethod
    def numeric_value(cls) -> dict["AssetCriticality", int]:
        return {
            cls.LOW: 1,
            cls.MEDIUM: 2,
            cls.HIGH: 3,
            cls.CRITICAL: 4,
        }


class DataClassification(str, enum.Enum):
    """Data sensitivity classification that influences financial impact calculations."""
    PUBLIC = "PUBLIC"
    INTERNAL = "INTERNAL"
    CONFIDENTIAL = "CONFIDENTIAL"
    RESTRICTED = "RESTRICTED"


class AssetStatus(str, enum.Enum):
    """Current operational lifecycle status of the asset."""
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    MAINTENANCE = "MAINTENANCE"
    DECOMMISSIONED = "DECOMMISSIONED"
    UNKNOWN = "UNKNOWN"


class SoftwareSource(str, enum.Enum):
    """How the software inventory entry was discovered or recorded."""
    MANUAL = "manual"
    SCAN = "scan"
    IMPORT = "import"
    API = "api"
    AGENT = "agent"


class Architecture(str, enum.Enum):
    """CPU/binary architecture of the software."""
    X86 = "x86"
    X86_64 = "x86_64"
    ARM = "arm"
    ARM64 = "arm64"
    MIPS = "mips"
    OTHER = "other"
    UNKNOWN = "unknown"


class PackageManager(str, enum.Enum):
    """Package manager / distribution format."""
    APT = "apt"
    YUM = "yum"
    RPM = "rpm"
    DNF = "dnf"
    PIP = "pip"
    NPM = "npm"
    YARN = "yarn"
    BREW = "brew"
    CHOCOLATEY = "chocolatey"
    SNAP = "snap"
    FLATPAK = "flatpak"
    DOCKER = "docker"
    MANUAL = "manual"
    OTHER = "other"
    UNKNOWN = "unknown"


class AuditAction(str, enum.Enum):
    """Auditable action types logged for compliance and forensic purposes."""
    # Asset actions
    ASSET_CREATED = "ASSET_CREATED"
    ASSET_UPDATED = "ASSET_UPDATED"
    ASSET_DELETED = "ASSET_DELETED"
    ASSET_VIEWED = "ASSET_VIEWED"
    # Software actions
    SOFTWARE_CREATED = "SOFTWARE_CREATED"
    SOFTWARE_UPDATED = "SOFTWARE_UPDATED"
    SOFTWARE_DELETED = "SOFTWARE_DELETED"
    # Asset-Software relationship actions
    SOFTWARE_ATTACHED = "SOFTWARE_ATTACHED"
    SOFTWARE_DETACHED = "SOFTWARE_DETACHED"
    # Bulk inventory operations
    INVENTORY_IMPORTED = "INVENTORY_IMPORTED"
    INVENTORY_EXPORTED = "INVENTORY_EXPORTED"
    # Vulnerability & Intelligence actions (Phase 3)
    VULNERABILITY_SYNC_TRIGGERED = "VULNERABILITY_SYNC_TRIGGERED"
    VULNERABILITY_MATCH_TRIGGERED = "VULNERABILITY_MATCH_TRIGGERED"
    ASSET_VULNERABILITY_UPDATED = "ASSET_VULNERABILITY_UPDATED"
    ASSET_VULNERABILITY_DELETED = "ASSET_VULNERABILITY_DELETED"
    # Validation & Evidence actions (Phase 4)
    EVIDENCE_CREATED = "EVIDENCE_CREATED"
    EVIDENCE_DELETED = "EVIDENCE_DELETED"
    VALIDATION_RUN = "VALIDATION_RUN"
    VALIDATION_OVERRIDDEN = "VALIDATION_OVERRIDDEN"
    # Cyber Risk Scoring actions (Phase 5)
    RISK_CALCULATED = "RISK_CALCULATED"
    RISK_RECALCULATED = "RISK_RECALCULATED"
    RISK_RULE_UPDATED = "RISK_RULE_UPDATED"
    RISK_CONFIG_UPDATED = "RISK_CONFIG_UPDATED"
    # Financial Impact & Simulation actions (Phase 6)
    FINANCIAL_PROFILE_UPDATED = "FINANCIAL_PROFILE_UPDATED"
    FINANCIAL_ASSESSMENT_CALCULATED = "FINANCIAL_ASSESSMENT_CALCULATED"
    SIMULATION_EXECUTED = "SIMULATION_EXECUTED"
    BUSINESS_SERVICE_CREATED = "BUSINESS_SERVICE_CREATED"
    BUSINESS_SERVICE_UPDATED = "BUSINESS_SERVICE_UPDATED"
    BUSINESS_SERVICE_DELETED = "BUSINESS_SERVICE_DELETED"
    # Attack Path & Threat Scenario actions    # Phase 7 Audit Actions
    NETWORK_RELATIONSHIP_CREATED = "NETWORK_RELATIONSHIP_CREATED"
    NETWORK_RELATIONSHIP_UPDATED = "NETWORK_RELATIONSHIP_UPDATED"
    NETWORK_RELATIONSHIP_DELETED = "NETWORK_RELATIONSHIP_DELETED"
    ATTACK_PATH_ANALYZED = "ATTACK_PATH_ANALYZED"
    THREAT_SCENARIO_CREATED = "THREAT_SCENARIO_CREATED"
    THREAT_SCENARIO_UPDATED = "THREAT_SCENARIO_UPDATED"
    THREAT_SCENARIO_DELETED = "THREAT_SCENARIO_DELETED"

    # Phase 8 Audit Actions
    REMEDIATION_CREATED = "REMEDIATION_CREATED"
    REMEDIATION_UPDATED = "REMEDIATION_UPDATED"
    REMEDIATION_DELETED = "REMEDIATION_DELETED"
    REMEDIATION_COMPLETED = "REMEDIATION_COMPLETED"
    REMEDIATION_VERIFIED = "REMEDIATION_VERIFIED"
    REMEDIATION_RISK_ACCEPTED = "REMEDIATION_RISK_ACCEPTED"
    CONTROL_CREATED = "CONTROL_CREATED"
    CONTROL_UPDATED = "CONTROL_UPDATED"
    CONTROL_DELETED = "CONTROL_DELETED"
    OPTIMIZATION_RUN = "OPTIMIZATION_RUN"

    # Phase 9 Audit Actions
    DASHBOARD_ACCESSED = "DASHBOARD_ACCESSED"
    REPORT_GENERATED = "REPORT_GENERATED"
    REPORT_DOWNLOADED = "REPORT_DOWNLOADED"
    ALERT_CREATED = "ALERT_CREATED"
    ALERT_ACKNOWLEDGED = "ALERT_ACKNOWLEDGED"
    SNAPSHOT_CREATED = "SNAPSHOT_CREATED"
    COMPLIANCE_EVALUATED = "COMPLIANCE_EVALUATED"


class ReportType(str, enum.Enum):
    """Categorization of generated executive and technical reports."""
    EXECUTIVE_RISK = "EXECUTIVE_RISK"
    CYBER_RISK = "CYBER_RISK"
    FINANCIAL_RISK = "FINANCIAL_RISK"
    VULNERABILITY = "VULNERABILITY"
    ATTACK_PATH = "ATTACK_PATH"
    REMEDIATION = "REMEDIATION"
    SECURITY_INVESTMENT = "SECURITY_INVESTMENT"
    COMPLIANCE = "COMPLIANCE"


class ReportFormat(str, enum.Enum):
    """Output document formats supported by the reporting engine."""
    PDF = "PDF"
    JSON = "JSON"
    CSV = "CSV"
    XLSX = "XLSX"


class ReportStatus(str, enum.Enum):
    """Lifecycle states of asynchronous report generation tasks."""
    QUEUED = "QUEUED"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class DashboardPeriod(str, enum.Enum):
    """Time-series analytical windows for executive dashboards."""
    CURRENT = "current"
    LAST_7_DAYS = "7d"
    LAST_30_DAYS = "30d"
    LAST_90_DAYS = "90d"
    LAST_6_MONTHS = "6m"
    LAST_1_YEAR = "1y"
    CUSTOM = "custom"


class TrendDirection(str, enum.Enum):
    """Directionality of risk and financial metrics over time."""
    IMPROVING = "IMPROVING"
    WORSENING = "WORSENING"
    STABLE = "STABLE"


class AlertSeverity(str, enum.Enum):
    """Severity ratings for executive and operational risk alerts."""
    INFO = "INFO"
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class AlertType(str, enum.Enum):
    """Typology of security and financial risk anomaly triggers."""
    CRITICAL_RISK_INCREASE = "CRITICAL_RISK_INCREASE"
    NEW_CRITICAL_ATTACK_PATH = "NEW_CRITICAL_ATTACK_PATH"
    FINANCIAL_RISK_INCREASE = "FINANCIAL_RISK_INCREASE"
    SLA_BREACH = "SLA_BREACH"
    CONTROL_COVERAGE_DROP = "CONTROL_COVERAGE_DROP"
    RISK_ACCEPTANCE_EXPIRING = "RISK_ACCEPTANCE_EXPIRING"
    NEW_CRITICAL_VULNERABILITY = "NEW_CRITICAL_VULNERABILITY"
    RISK_REGRESSION = "RISK_REGRESSION"


class ComplianceFramework(str, enum.Enum):
    """Supported cybersecurity compliance and regulatory frameworks."""
    ISO_27001 = "ISO/IEC 27001"
    NIST_CSF = "NIST CSF"
    CIS_CONTROLS = "CIS Controls"


class ComplianceStatus(str, enum.Enum):
    """Evaluation status of a specific compliance framework requirement."""
    IMPLEMENTED = "IMPLEMENTED"
    PARTIAL = "PARTIAL"
    MISSING = "MISSING"
    NOT_ASSESSED = "NOT_ASSESSED"


class RemediationType(str, enum.Enum):
    """Categorization of remediation treatment approaches."""
    PATCH = "PATCH"
    UPGRADE = "UPGRADE"
    CONFIGURATION_CHANGE = "CONFIGURATION_CHANGE"
    NETWORK_SEGMENTATION = "NETWORK_SEGMENTATION"
    ACCESS_CONTROL = "ACCESS_CONTROL"
    MFA = "MFA"
    WAF_RULE = "WAF_RULE"
    FIREWALL_RULE = "FIREWALL_RULE"
    VIRTUAL_PATCH = "VIRTUAL_PATCH"
    COMPENSATING_CONTROL = "COMPENSATING_CONTROL"
    ASSET_RETIREMENT = "ASSET_RETIREMENT"


class RemediationStatus(str, enum.Enum):
    """Lifecycle tracking states for vulnerability remediation."""
    OPEN = "OPEN"
    PLANNED = "PLANNED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    VERIFIED = "VERIFIED"
    ACCEPTED_RISK = "ACCEPTED_RISK"
    REJECTED = "REJECTED"


class RemediationPriorityLevel(str, enum.Enum):
    """Normalized priority urgency classification."""
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class ControlType(str, enum.Enum):
    """Enterprise defensive cybersecurity control categories."""
    WAF = "WAF"
    EDR = "EDR"
    MFA = "MFA"
    NETWORK_SEGMENTATION = "NETWORK_SEGMENTATION"
    PAM = "PAM"
    IDS_IPS = "IDS_IPS"
    BACKUP = "BACKUP"
    ZERO_TRUST_ACCESS = "ZERO_TRUST_ACCESS"
    SIEM = "SIEM"


class InvestmentScenarioStatus(str, enum.Enum):
    """Status lifecycle of cybersecurity investment scenarios."""
    DRAFT = "DRAFT"
    ACTIVE = "ACTIVE"
    ARCHIVED = "ARCHIVED"


class OptimizationAlgorithm(str, enum.Enum):
    """Supported mathematical optimization algorithms."""
    GREEDY = "GREEDY"
    KNAPSACK = "KNAPSACK"


class VulnerabilitySeverity(str, enum.Enum):
    """CVSS / NVD Qualitative severity rating."""
    NONE = "NONE"
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class ExploitAvailability(str, enum.Enum):
    """Exploit availability status."""
    UNKNOWN = "UNKNOWN"
    NO = "NO"
    YES = "YES"


class VulnerabilityMatchMethod(str, enum.Enum):
    """Method used to match an asset software to a vulnerability."""
    CPE = "CPE"
    VENDOR_PRODUCT_VERSION = "VENDOR_PRODUCT_VERSION"
    MANUAL = "MANUAL"


class AssetVulnerabilityStatus(str, enum.Enum):
    """Lifecycle status of a detected vulnerability on an asset."""
    OPEN = "OPEN"
    RESOLVED = "RESOLVED"
    ACCEPTED = "ACCEPTED"
    FALSE_POSITIVE = "FALSE_POSITIVE"


class SyncJobStatus(str, enum.Enum):
    """Status of an asynchronous vulnerability synchronization job."""
    QUEUED = "QUEUED"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class ValidationStatus(str, enum.Enum):
    """Lifecycle status of vulnerability validation (Phase 4)."""
    PENDING = "PENDING"
    VALIDATING = "VALIDATING"
    CONFIRMED = "CONFIRMED"
    LIKELY_VULNERABLE = "LIKELY_VULNERABLE"
    LIKELY_NOT_VULNERABLE = "LIKELY_NOT_VULNERABLE"
    FALSE_POSITIVE = "FALSE_POSITIVE"
    UNKNOWN = "UNKNOWN"
    RESOLVED = "RESOLVED"


class EvidenceType(str, enum.Enum):
    """Types of evidence collected to validate vulnerability applicability."""
    VERSION = "VERSION"
    CPE = "CPE"
    CONFIGURATION = "CONFIGURATION"
    NETWORK_EXPOSURE = "NETWORK_EXPOSURE"
    SERVICE = "SERVICE"
    PORT = "PORT"
    OPERATING_SYSTEM = "OPERATING_SYSTEM"
    SOFTWARE_INVENTORY = "SOFTWARE_INVENTORY"
    EXPLOIT = "EXPLOIT"
    PATCH_STATUS = "PATCH_STATUS"
    SECURITY_CONTROL = "SECURITY_CONTROL"
    MANUAL_REVIEW = "MANUAL_REVIEW"


class EvidenceResult(str, enum.Enum):
    """Outcome verification for a piece of evidence."""
    CONFIRMED = "CONFIRMED"
    NOT_CONFIRMED = "NOT_CONFIRMED"
    UNKNOWN = "UNKNOWN"


class EvidenceSource(str, enum.Enum):
    """Source that produced the evidence."""
    NVD = "NVD"
    ASSET_INVENTORY = "ASSET_INVENTORY"
    SOFTWARE_INVENTORY = "SOFTWARE_INVENTORY"
    NETWORK_SCAN = "NETWORK_SCAN"
    CONFIGURATION_SCAN = "CONFIGURATION_SCAN"
    SECURITY_TOOL = "SECURITY_TOOL"
    MANUAL = "MANUAL"
    SYSTEM_API = "SYSTEM_API"


class ExposureLevel(str, enum.Enum):
    """Network accessibility classification for an asset or endpoint."""
    INTERNET = "INTERNET"
    INTRANET = "INTRANET"
    LOCAL_ONLY = "LOCAL_ONLY"
    UNKNOWN = "UNKNOWN"


class RiskLevel(str, enum.Enum):
    """Qualitative cyber risk classification tier (Phase 5)."""
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    VERY_HIGH = "VERY_HIGH"
    CRITICAL = "CRITICAL"


class RiskMethod(str, enum.Enum):
    """Risk calculation framework or model (Phase 5)."""
    CONTEXTUAL_WEIGHTED = "CONTEXTUAL_WEIGHTED"
    FAIR_BASIC = "FAIR_BASIC"


class RiskAssessmentStatus(str, enum.Enum):
    """Lifecycle status of a cyber risk calculation job (Phase 5)."""
    CALCULATING = "CALCULATING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class DistributionType(str, enum.Enum):
    """Probability distribution types supported by the Monte Carlo simulation engine (Phase 6)."""
    TRIANGULAR = "TRIANGULAR"
    UNIFORM = "UNIFORM"
    NORMAL = "NORMAL"
    LOGNORMAL = "LOGNORMAL"
    BERNOULLI = "BERNOULLI"
    FIXED = "FIXED"


class FinancialFactorType(str, enum.Enum):
    """Cost components contributing to total cyber incident financial loss (Phase 6)."""
    DOWNTIME = "DOWNTIME"
    REVENUE_LOSS = "REVENUE_LOSS"
    EMPLOYEE_PRODUCTIVITY = "EMPLOYEE_PRODUCTIVITY"
    INCIDENT_RESPONSE = "INCIDENT_RESPONSE"
    FORENSICS = "FORENSICS"
    RECOVERY = "RECOVERY"
    DATA_BREACH = "DATA_BREACH"
    REGULATORY = "REGULATORY"
    LEGAL = "LEGAL"
    CUSTOMER_COMPENSATION = "CUSTOMER_COMPENSATION"
    REPUTATIONAL = "REPUTATIONAL"
    THIRD_PARTY = "THIRD_PARTY"
    BUSINESS_RESTORATION = "BUSINESS_RESTORATION"


class SimulationStatus(str, enum.Enum):
    """Lifecycle states of an asynchronous Monte Carlo simulation job (Phase 6)."""
    QUEUED = "QUEUED"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class FinancialScenarioType(str, enum.Enum):
    """Deterministic comparative scenario levels (Phase 6)."""
    BEST_CASE = "BEST_CASE"
    BASE_CASE = "BASE_CASE"
    WORST_CASE = "WORST_CASE"


class NetworkRelationshipType(str, enum.Enum):
    """Topology and access relationship between two assets (Phase 7)."""
    NETWORK_REACHABILITY = "NETWORK_REACHABILITY"
    DEPENDS_ON = "DEPENDS_ON"
    CONNECTS_TO = "CONNECTS_TO"
    TRUSTS = "TRUSTS"
    AUTHENTICATES_TO = "AUTHENTICATES_TO"
    HOSTS = "HOSTS"
    COMMUNICATES_WITH = "COMMUNICATES_WITH"


class NetworkDirection(str, enum.Enum):
    """Direction of traffic / communication flow (Phase 7)."""
    INBOUND = "INBOUND"
    OUTBOUND = "OUTBOUND"
    BIDIRECTIONAL = "BIDIRECTIONAL"


class AttackerProfile(str, enum.Enum):
    """Threat actor adversary profile & capabilities (Phase 7)."""
    EXTERNAL_ATTACKER = "EXTERNAL_ATTACKER"
    INSIDER = "INSIDER"
    COMPROMISED_ACCOUNT = "COMPROMISED_ACCOUNT"
    THIRD_PARTY = "THIRD_PARTY"
    RANSOMWARE_GROUP = "RANSOMWARE_GROUP"
    OPPORTUNISTIC_ATTACKER = "OPPORTUNISTIC_ATTACKER"


class AttackPathNodeType(str, enum.Enum):
    """Type of entity represented by a node along an attack path (Phase 7)."""
    ENTRY_POINT = "ENTRY_POINT"
    ASSET = "ASSET"
    VULNERABILITY = "VULNERABILITY"
    IDENTITY = "IDENTITY"
    PRIVILEGE = "PRIVILEGE"
    BUSINESS_SERVICE = "BUSINESS_SERVICE"
    TARGET = "TARGET"


class AttackPathEdgeType(str, enum.Enum):
    """Transition mechanism / exploit step between nodes (Phase 7)."""
    EXPLOITS = "EXPLOITS"
    REACHES = "REACHES"
    AUTHENTICATES = "AUTHENTICATES"
    LATERAL_MOVEMENT = "LATERAL_MOVEMENT"
    ESCALATES = "ESCALATES"
    ACCESSES = "ACCESSES"
    DEPENDS_ON = "DEPENDS_ON"


class AttackPathStatus(str, enum.Enum):
    """Viability status of a discovered attack path (Phase 7)."""
    POSSIBLE = "POSSIBLE"
    HIGH_CONFIDENCE = "HIGH_CONFIDENCE"
    BLOCKED = "BLOCKED"


class ThreatScenarioStatus(str, enum.Enum):
    """Lifecycle state of a modeled threat scenario (Phase 7)."""
    DRAFT = "DRAFT"
    ACTIVE = "ACTIVE"
    ARCHIVED = "ARCHIVED"


# ---------------------------------------------------------------------------
# Phase 10: Production Hardening & Operational Enums
# ---------------------------------------------------------------------------
class JobStatus(str, enum.Enum):
    """Execution status for reliable background jobs (Phase 10)."""
    QUEUED = "QUEUED"
    RUNNING = "RUNNING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"
    RETRYING = "RETRYING"


class JobType(str, enum.Enum):
    """Categorization of asynchronous background jobs (Phase 10)."""
    MONTE_CARLO = "MONTE_CARLO"
    OPTIMIZATION = "OPTIMIZATION"
    DASHBOARD_SNAPSHOT = "DASHBOARD_SNAPSHOT"
    REPORT_GENERATION = "REPORT_GENERATION"
    ATTACK_PATH_CALCULATION = "ATTACK_PATH_CALCULATION"
    RISK_RECALCULATION = "RISK_RECALCULATION"
    IMPORT_PROCESSING = "IMPORT_PROCESSING"
    BACKUP_VERIFICATION = "BACKUP_VERIFICATION"


class RateLimitTier(str, enum.Enum):
    """API rate limiting tiers for tiered request throttling (Phase 10)."""
    ANONYMOUS = "ANONYMOUS"
    AUTHENTICATED = "AUTHENTICATED"
    EXPENSIVE = "EXPENSIVE"

