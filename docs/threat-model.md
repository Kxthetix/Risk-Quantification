# Comprehensive Threat Model & Attack Surface Analysis (STRIDE / PASTA)

## 1. System Overview & Scope

The platform is an enterprise-grade Cybersecurity Risk Assessment, Financial Impact Analysis, Attack Graph Modeling, and Executive Decision Support system. It processes sensitive organizational assets, discovered CVE vulnerabilities, threat scenario simulations, and financial revenue profiles.

```text
                    EXTERNAL ATTACK SURFACE
    ┌──────────────────────────┼──────────────────────────┐
    ▼                          ▼                          ▼
Public Ingress            Telemetry Push             Third-Party APIs
(Next.js App)            (Inbound Webhooks)         (SIEM, EDR, Scanners)
    │                          │                          │
    └──────────────────────────┼──────────────────────────┘
                               ▼
                       API GATEWAY & AUTH
                     (TLS 1.3 / HSTS / CSP)
                               │
            ┌──────────────────┴──────────────────┐
            ▼                                     ▼
     User Authentication                   Webhook HMAC Verify
   (JWT / Bcrypt / RBAC)                (SHA256 Signature Guard)
            │                                     │
            └──────────────────┬──────────────────┘
                               ▼
                   CORE BUSINESS APPLICATION
            ┌──────────────────┼──────────────────┐
            ▼                  ▼                  ▼
     Ingestion Engine     Risk Engine     Financial Engine
   (SSRF / Schema San) (Pure Algorithmic) (Monte Carlo Sim)
            │                  │                  │
            └──────────────────┼──────────────────┘
                               ▼
                   DATABASE & STORAGE LAYER
                     (PostgreSQL / Redis)
              (Tenant ID Partitioning & Encryption)
```

---

## 2. Threat Actors & Capabilities

| Threat Actor | Motivation | Capability | Target Vectors |
|---|---|---|---|
| **External Cybercriminal** | Financial extortion, data theft | High | Credential stuffing, API abuse, Injection, SSRF, Malicious file uploads |
| **Malicious Insider** | Sabotage, espionage | Medium-High | Privilege escalation, Cross-tenant data access (IDOR), Audit tampering |
| **Competitor / Espionage** | Intellectual property & financial intelligence | Very High | Direct database extraction, Financial revenue model exposure |
| **Compromised Connector** | Downstream lateral movement | High | Webhook spoofing, Malicious telemetry payload injection |

---

## 3. STRIDE Threat Analysis Matrix

### 3.1 Spoofing (Identity Deception)
- **Threat**: Forging JWT access tokens, replaying stolen session identifiers, or impersonating external webhook push sources.
- **Attack Vector**: Modified payload signatures, weak secret keys, missing timestamp verification.
- **Controls Implemented**:
  - Cryptographically secure HMAC-SHA256 token signing with 32+ character secrets (`app/core/security.py`).
  - Strict 60-minute token expiration and refresh token rotation.
  - Inbound webhook authentication via `X-Signature-SHA256` HMAC validation (`app/api/v1/webhooks.py`).
- **Residual Risk**: **Low**.

### 3.2 Tampering (Data Manipulation)
- **Threat**: Tampering with asset criticality, vulnerability severity weights, or Monte Carlo simulation parameters to produce fraudulent risk reports.
- **Attack Vector**: Parameter manipulation, SQL injection, untrusted client state.
- **Controls Implemented**:
  - SQLAlchemy 2.0 ORM strictly using parameterized queries with asyncpg.
  - Pydantic v2 strict input validation schemas for all requests.
  - Authoritative backend risk and financial calculations — frontend never supplies raw risk scores.
- **Residual Risk**: **Low**.

### 3.3 Repudiation (Denial of Actions)
- **Threat**: An administrator or security analyst modifies mitigation decisions or exports reports and later denies responsibility.
- **Attack Vector**: Missing or mutable audit logs.
- **Controls Implemented**:
  - Centralized immutable `AuditLog` records actor UUID, tenant UUID, client IP, action name, resource affected, and timestamp (`app/services/audit_service.py`).
  - No `DELETE` or `UPDATE` APIs exist for the audit log table.
- **Residual Risk**: **Low**.

### 3.4 Information Disclosure (Data Leakage)
- **Threat**: Cross-tenant data leakage (IDOR / BOLA) or accidental credential exposure in logs and error responses.
- **Attack Vector**: Requesting `/api/v1/assets/{id}` with another tenant's UUID; stack traces in HTTP 500 errors.
- **Controls Implemented**:
  - Strict tenant filtering (`organization_id = current_user.organization_id`) enforced across all database queries.
  - Centralized `ErrorHandlerMiddleware` masks internal exceptions and database schemas in production.
  - Sensitive secrets (API keys, webhook secrets) are hashed with SHA-256 before storage and never returned in GET responses.
- **Residual Risk**: **Low**.

### 3.5 Denial of Service (System Exhaustion)
- **Threat**: Volumetric request flooding, resource exhaustion through runaway Monte Carlo iterations, or unbounded file imports.
- **Attack Vector**: Calling simulation endpoints with 10,000,000 iterations; uploading multi-gigabyte CSV files.
- **Controls Implemented**:
  - Sliding-window rate limiting (`app/middleware/rate_limit.py`) with distinct tiers (60/300/30 RPM).
  - Maximum upload size constrained to 25MB with row parsing batch ceilings.
  - Monte Carlo simulation iterations capped at 50,000 per request.
- **Residual Risk**: **Low**.

### 3.6 Elevation of Privilege (Unauthorized Access)
- **Threat**: A Viewer or Security Analyst accesses administrative tenant settings or modifies role policies.
- **Attack Vector**: Broken Function Level Authorization (BFLA).
- **Controls Implemented**:
  - Fast-failing FastAPI dependencies (`require_admin`, `require_manager`, `require_analyst`).
  - Hierarchical Role-Based Access Control (`ADMIN` > `MANAGER` > `SECURITY_ANALYST` > `VIEWER`).
- **Residual Risk**: **Low**.

---

## 4. Trust Boundaries & Entry Points

1. **Internet Boundary to API Gateway**:
   - TLS 1.3 encryption, CORS restriction, HSTS (`max-age=31536000`), CSP, X-Frame-Options: DENY.
2. **Gateway to Business Logic**:
   - Authentication dependency extraction (`get_current_user`), Rate limiter enforcement.
3. **Business Logic to Database**:
   - Asynchronous connection pool (`asyncpg`), non-root DB user, isolated tenant querying.
4. **Business Logic to External Integrations**:
   - Outbound SSRF validator (`validate_outbound_url`) blocking loopback (127.0.0.1) and private RFC1918 networks.
