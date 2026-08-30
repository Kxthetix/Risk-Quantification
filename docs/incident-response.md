# Security Incident Response Plan & Playbooks

## 1. Incident Response Lifecycle Framework

```text
               ┌──────────────────────────────┐
               │    1. DETECTION & TRIAGE     │
               └──────────────┬───────────────┘
                              ▼
               ┌──────────────────────────────┐
               │        2. CONTAINMENT        │
               └──────────────┬───────────────┘
                              ▼
               ┌──────────────────────────────┐
               │ 3. FORENSICS & INVESTIGATION │
               └──────────────┬───────────────┘
                              ▼
               ┌──────────────────────────────┐
               │   4. ERADICATION & RECOVERY  │
               └──────────────┬───────────────┘
                              ▼
               ┌──────────────────────────────┐
               │  5. POST-INCIDENT REVIEW     │
               └──────────────────────────────┘
```

---

## 2. Incident Classification & Severity Tiers

| Severity Tier | Definition | Response SLA | Escalation Path |
|---|---|---|---|
| **SEV-1 (Critical)** | Active multi-tenant data compromise, direct database breach, total system outage | **< 15 minutes** | Incident Commander, Lead Architect, CISO, Legal |
| **SEV-2 (High)** | Single tenant credential compromise, unauthorized administrative action, SSRF attempt | **< 30 minutes** | Security Lead, Backend On-Call Engineer |
| **SEV-3 (Medium)** | Isolated webhook authentication failure, elevated rate-limit triggers | **< 2 hours** | SOC Analyst, DevOps Engineer |
| **SEV-4 (Low)** | Informational scan alert, minor telemetry ingestion formatting issue | **< 24 hours** | Support Engineer |

---

## 3. Incident Response Playbooks

### Playbook 1: Credential Compromise & Session Hijacking
1. **Immediate Containment**:
   - Invalidate all active session tokens for the compromised user account:
     ```sql
     UPDATE users SET is_active = false WHERE id = '<compromised_user_id>';
     ```
   - Rotate `JWT_SECRET_KEY` if signing key compromise is suspected.
2. **Forensic Analysis**:
   - Query all recent administrative and data access actions in the audit trail:
     ```sql
     SELECT * FROM audit_logs 
     WHERE user_id = '<compromised_user_id>' 
     ORDER BY created_at DESC;
     ```
3. **Eradication & Restoration**:
   - Issue mandatory password reset with multi-factor authentication (MFA) re-enrollment.
   - Re-activate account only after verified user identity confirmation.

### Playbook 2: Cross-Tenant Data Leakage Investigation (BOLA / IDOR)
1. **Immediate Containment**:
   - Enable maintenance mode if widespread authorization failure is detected.
2. **Log Correlation**:
   - Search access logs for `X-Request-ID` and cross-match tenant query parameters against requesting user's `organization_id`.
3. **Remediation**:
   - Deploy code hotfix with strict tenant filtering verification test.
   - Run regression test suite: `python -m pytest tests/test_phase14_security_hardening.py -v`.

### Playbook 3: Malicious Webhook Ingestion Flooding / Forgery
1. **Immediate Containment**:
   - Deactivate the compromised webhook endpoint directly in the database:
     ```sql
     UPDATE webhook_endpoints SET is_active = false WHERE id = '<endpoint_id>';
     ```
2. **Triage & Purge**:
   - Identify unverified records ingested during the attack window.
   - Re-calculate authoritative risk scores using the internal risk engine to purge unverified external scores.
3. **Re-keying**:
   - Generate a new webhook receiver with fresh HMAC-SHA256 secret.
