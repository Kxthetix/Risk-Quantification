# Production Readiness & Configuration Baseline

## 1. Production Configuration Baseline

| Setting | Required Value | Rationale |
|---|---|---|
| `DEBUG` | `False` | Disables interactive debuggers, stack trace exposure, and internal schema leakage. |
| `APP_ENV` | `production` | Enforces strict CORS origins, enables HSTS, and hides interactive API docs if desired. |
| `SECURITY_HEADERS_ENABLED` | `True` | Injects HSTS, CSP, X-Frame-Options: DENY, and X-Content-Type-Options: nosniff. |
| `RATE_LIMIT_ENABLED` | `True` | Enforces 60/300/30 RPM sliding-window throttling. |
| `JWT_SECRET_KEY` | High-Entropy 64+ char string | Cryptographic resistance against offline JWT brute-forcing. |
| `DB_POOL_SIZE` | `20-50` | Sized for production concurrency with asyncpg connection pooling. |
| `MAX_UPLOAD_SIZE_MB` | `25` | Prevents denial-of-service via massive file uploads. |

---

## 2. Pre-Deployment Verification Checklist

```text
[x] 1. Architecture & Threat Model Reviewed (STRIDE / PASTA in docs/threat-model.md)
[x] 2. Authentication & JWT Hardened (Bcrypt 12 rounds, Token Revocation, Refresh Rotation)
[x] 3. Role-Based Access Control (RBAC) Verified (ADMIN, MANAGER, ANALYST, VIEWER)
[x] 4. Multi-Tenant Isolation Tested (Zero cross-tenant data leakage or IDOR vulnerabilities)
[x] 5. Input Sanitization & Injection Defense Verified (SQLi, XSS, SSRF, Malicious Uploads)
[x] 6. Inbound Webhooks Secured (HMAC-SHA256 signature verification enforced)
[x] 7. Deterministic Risk & Financial Engines Tested (Boundary values, extreme impact, Monte Carlo stability)
[x] 8. Automated Pytest Backend Suites Passing (100% pass across all test modules)
[x] 9. Frontend Compilation & Vitest Passing (0 TypeScript errors, 135/135 tests passing)
[x] 10. Industry Compliance Mappings Documented (ISO 27001, NIST CSF, CIS Controls, SOC 2)
[x] 11. Disaster Recovery & Backup Runbooks Complete (RPO < 15m, RTO < 60m, WAL archiving)
[x] 12. Production Operations Runbook & Alerting Playbooks Defined
```

---

## 3. Production Smoke Testing Protocol

Execute the automated end-to-end smoke verification command post-deployment:
```bash
python -m pytest tests/test_phase14_e2e_production.py -v
```

Verification stages executed:
1. Platform Liveness & Database Readiness Check (`GET /health`)
2. Asset Inventory Provisioning (`POST /api/v1/assets`)
3. Vulnerability Telemetry Ingestion & Correlation (`POST /api/v1/integrations/{id}/sync`)
4. Executive Risk & Financial Summary Computation (`GET /api/v1/executive/summary`)
5. Immutable Audit Trail Verification (`GET /api/v1/audit`)

---

## 4. Release & Rollback Strategy

```text
                       DEPLOYMENT WORKFLOW
                       
                      [1. Deploy Version N+1]
                                 │
                                 ▼
                     [2. Run Smoke Test Suite]
                                 │
                 ┌───────────────┴───────────────┐
                 ▼                               ▼
             [PASS]                            [FAIL]
                 │                               │
                 ▼                               ▼
     [Promote to Production]         [Automated Rollback to N]
                 │                               │
                 ▼                               ▼
       [Close Release Ticket]        [Alert Incident Response]
```

### Rollback Commands
```bash
# Rollback application container to previous release tag
docker-compose up -d --force-recreate backend:v1.0.0-previous

# If database migration rollback is required
alembic downgrade -1
```
