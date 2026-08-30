# Production Security Architecture & Hardening Guide

## 1. Security Architecture & Threat Model Summary

The platform implements defense-in-depth across the API gateway, authentication middleware, business logic calculation engines, and database persistence layers.

```text
                    SECURITY DEFENSE LAYERS
┌─────────────────────────────────────────────────────────────┐
│ 1. EDGE & GATEWAY: TLS 1.3, HSTS, CSP, X-Frame-Options: DENY│
├─────────────────────────────────────────────────────────────┤
│ 2. ACCESS CONTROL: Multi-tenant JWT, Bcrypt 12, Strict RBAC │
├─────────────────────────────────────────────────────────────┤
│ 3. APPLICATION: Parameterized SQL, Pydantic v2, SSRF Blocks │
├─────────────────────────────────────────────────────────────┤
│ 4. PERSISTENCE: AES-256 Storage, Tenant UUID Partitioning   │
├─────────────────────────────────────────────────────────────┤
│ 5. OBSERVABILITY: Immutable Audit Log, Error Stack Masking  │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. OWASP API Security Top 10 (2023) Hardening Matrix

| OWASP Category | Threat Description | Architectural Mitigation | Code Location |
|---|---|---|---|
| **API1:2023 Broken Object Level Auth (BOLA / IDOR)** | Accessing or modifying assets across tenants by changing UUIDs | Centralized tenant query filtering (`organization_id = current_user.organization_id`) on every query | `app/api/v1/*.py`, `tests/test_phase14_security_hardening.py` |
| **API2:2023 Broken Authentication** | Token forgery, credential stuffing, brute force | Bcrypt password hashing with 12 salt rounds, 60m JWT expiration, sliding-window rate limiting (60/300 RPM) | `app/core/security.py`, `app/middleware/rate_limit.py` |
| **API3:2023 Broken Object Property Level Auth** | Unintended attribute exposure or mass-assignment | Explicit Pydantic response schemas excluding internal attributes (password hashes, secret keys) | `app/schemas/*.py` |
| **API4:2023 Unrestricted Resource Consumption** | DoS via massive Monte Carlo iterations or file uploads | Hard execution caps (max 50,000 Monte Carlo iterations, max 25MB file upload limit) | `app/core/config.py`, `app/engines/monte_carlo_engine.py` |
| **API5:2023 Broken Function Level Auth (BFLA)** | Viewer or Analyst executing admin policies or user invites | FastAPI RBAC dependencies (`require_admin`, `require_manager`, `require_analyst`) | `app/core/dependencies.py` |
| **API6:2023 Unrestricted Access to Sensitive Business Flows** | Triggering heavy financial simulations excessively | Multi-tier sliding-window rate limiting (30 RPM for expensive simulation flows) | `app/middleware/rate_limit.py` |
| **API7:2023 Server-Side Request Forgery (SSRF)** | Outbound connectors querying internal metadata or loopback services | Strict outbound URL validation rejecting RFC1918 private and loopback IP addresses (`validate_outbound_url`) | `app/services/ingestion_engine.py` |
| **API8:2023 Security Misconfiguration** | Unsafe HTTP headers, default credentials, verbose stack traces | Automated security headers (HSTS, CSP, X-Frame-Options: DENY), centralized exception masking in production | `app/middleware/security_headers.py`, `app/middleware/error_handler.py` |
| **API9:2023 Improper Inventory Management** | Undocumented or unmaintained API versions | Unified `/api/v1` namespace with automated OpenAPI/Swagger documentation generation | `app/api/v1/__init__.py` |
| **API10:2023 Unsafe Consumption of APIs** | Third-party telemetry feeds injecting malicious data | Strict request timeouts (30s) and canonical normalization routines before database insertion | `app/services/ingestion_engine.py` |

---

## 3. Cryptographic Standards & Sensitive Data Masking

### 3.1 Encryption & Token Hashing
- **Passwords**: Hashed with Bcrypt (12 work factor rounds).
- **JWT Tokens**: Signed using HMAC-SHA256 with minimum 256-bit entropy secrets.
- **API Keys & Webhook Secrets**: Stored exclusively as SHA-256 hashes (`credentials_hash`, `secret_hash`). Raw secrets are returned exactly once upon creation.
- **In-Transit Encryption**: Strict TLS 1.3 / HTTPS with HSTS (`max-age=31536000; includeSubDomains; preload`).

### 3.2 Sensitive Data Masking in Logs & Responses
- Passwords, JWT secrets, authorization bearer headers, and raw credentials are automatically sanitized from access logs.
- In production (`APP_ENV=production`), internal database exception messages and Python tracebacks are replaced with generic error descriptions (`"An unexpected internal error occurred. Ref: <request_id>"`).

---

## 4. Data Classification Policy

| Classification Level | Definition | Examples | Handling Rules |
|---|---|---|---|
| **PUBLIC** | Freely shareable open-source data | NVD CVEs, CWE catalogs, Mitre ATT&CK mappings | No encryption required at rest |
| **INTERNAL** | General organizational metadata | Connector catalog list, non-sensitive feature flags | Standard authentication required |
| **CONFIDENTIAL** | Proprietary operational telemetry | Asset inventories, network IP topology, attack path graphs | Encrypted in transit, tenant partitioned |
| **RESTRICTED** | High-impact sensitive business data | Annual revenue figures, bank accounts, password hashes, webhook secrets | AES-256 storage, strict RBAC, audit logging |
