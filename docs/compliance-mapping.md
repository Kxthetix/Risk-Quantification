# Industry Compliance & Security Framework Mapping

This document provides a comprehensive mapping between the cybersecurity risk platform's technical controls and major international compliance standards: **ISO/IEC 27001:2022**, **NIST CSF v2.0**, **CIS Controls v8**, and **SOC 2 Type II**.

---

## 1. ISO/IEC 27001:2022 Mapping

| ISO 27001 Control | Control Objective | Platform Technical Implementation | Verification Evidence |
|---|---|---|---|
| **A.5.15 Access Control** | Restrict access to assets according to business rules | Role-Based Access Control (`UserRole`: ADMIN, MANAGER, ANALYST, VIEWER). Automatic session token expiration and revocable sessions. | `app/core/dependencies.py`, `tests/test_phase14_security_hardening.py` |
| **A.5.23 Cloud Service Information Security** | Security controls for cloud services | Cloud posture integration connectors (AWS, Azure, GCP) with encrypted API credentials. | `app/services/ingestion_engine.py`, `app/api/v1/integrations.py` |
| **A.8.1 User Endpoint Devices** | Protection of endpoint assets | Asset inventory tracking with OS version, IP address, criticality level, and software CPE matching. | `app/models/asset.py`, `app/api/v1/assets.py` |
| **A.8.7 Protection Against Malware** | Prevent malicious software execution | File upload extension whitelisting, MIME parsing, and payload sanitization. | `app/core/config.py`, `app/api/v1/imports.py` |
| **A.8.8 Management of Technical Vulnerabilities** | Timely discovery and remediation of vulnerabilities | Continuous CVE matching from NVD 2.0 API, severity score tracking, and automated remediation ticketing. | `app/services/nvd_client.py`, `app/api/v1/vulnerabilities.py` |
| **A.8.12 Data Leakage Prevention** | Prevent unauthorized data extraction | Tenant-level query isolation (`organization_id`), error stack trace masking, sensitive field exclusion in Pydantic schemas. | `app/middleware/error_handler.py`, `tests/test_phase14_security_hardening.py` |
| **A.8.15 Logging** | Record system events and security occurrences | Structured JSON audit trail logging actor, action, timestamp, IP, and outcome to immutable database tables. | `app/services/audit_service.py`, `app/models/audit_log.py` |
| **A.8.24 Use of Cryptography** | Protect information confidentiality and integrity | TLS 1.3 in transit, Bcrypt (12 rounds) for password storage, HMAC-SHA256 for token & webhook signing. | `app/core/security.py`, `app/middleware/security_headers.py` |

---

## 2. NIST Cybersecurity Framework (CSF v2.0) Mapping

### 2.1 IDENTIFY (ID)
- **ID.AM (Asset Management)**: Complete discovery and cataloging of hardware, software, and cloud endpoints (`/api/v1/assets`, `/api/v1/imports`).
- **ID.RA (Risk Assessment)**: Quantitative risk scoring combining CVSS severity, asset criticality, threat likelihood, and business revenue impact (`/api/v1/risk`, `/api/v1/executive/summary`).

### 2.2 PROTECT (PR)
- **PR.AA (Identity & Access)**: Role-based permissions, multi-tenant partitioning, API key hashing, and token revocation (`/api/v1/admin/roles`, `/api/v1/admin/api-keys`).
- **PR.DS (Data Security)**: Secure communication headers (HSTS, CSP, X-Frame-Options: DENY), SSRF outbound filtering.

### 2.3 DETECT (DE)
- **DE.CM (Continuous Monitoring)**: Real-time telemetry ingestion from SIEM, EDR, and Vulnerability Scanners (`/api/v1/integrations`, `/api/v1/webhooks`).
- **DE.AE (Adverse Events)**: Automated detection rule evaluation and security incident creation (`/api/v1/incidents`, `/api/v1/soc/playbooks`).

### 2.4 RESPOND (RS)
- **RS.MI (Mitigation)**: Remediation action tracking, cost-benefit analysis, and risk reduction simulations (`/api/v1/remediation`, `/api/v1/optimizations`).

### 2.5 RECOVER (RC)
- **RC.RP (Recovery Planning)**: Downtime cost evaluation and business interruption modeling (`app/engines/downtime_engine.py`, `app/engines/financial_impact_engine.py`).

---

## 3. CIS Critical Security Controls v8 Mapping

1. **CIS Control 1: Inventory and Control of Enterprise Assets**:
   - Automated asset discovery, CSV/Excel inventory synchronization, and lifecycle management.
2. **CIS Control 2: Inventory and Control of Software Assets**:
   - CPE version tracking and installed application dependency scanning.
3. **CIS Control 7: Continuous Vulnerability Management**:
   - NVD CVE synchronization, CVSS v3.1 scoring, and automated asset vulnerability association.
4. **CIS Control 8: Audit Log Management**:
   - Centralized, queryable, non-repudiable audit logging for all authentication and management actions.

---

## 4. SOC 2 Type II Trust Services Criteria

- **Common Criteria (Security)**: Defense-in-depth across API gateway, authentication middleware, parameterized database queries, and role enforcement.
- **Confidentiality**: Multi-tenant data segregation preventing any cross-organization data leakage.
- **Processing Integrity**: Pure-Python deterministic risk engines and statistical Monte Carlo simulations producing verified, repeatable results.
- **Availability**: Asynchronous worker offloading, database connection pooling, and health probes (`/health/live`, `/health/ready`).
