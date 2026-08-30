# Production Troubleshooting & Diagnostics Runbook

## 1. Diagnostics & Health Inspection
```bash
# Check process liveness
curl -i http://localhost:8000/health/live

# Check database and dependencies readiness
curl -i http://localhost:8000/health/ready

# Check system operational status (Requires Admin Bearer Token)
curl -i -H "Authorization: Bearer <ADMIN_TOKEN>" http://localhost:8000/api/v1/system/status
```

## 2. Common Issues & Solutions

### Issue: HTTP 429 Too Many Requests
- **Cause**: Client exceeded rate limiting threshold for their tier.
- **Remedy**: Inspect `Retry-After` header. Configure higher authenticated RPM in `Settings.RATE_LIMIT_AUTHENTICATED_RPM` if legitimate high-volume client.

### Issue: Database Connection Timeout
- **Cause**: Pool exhaustion under sustained heavy load.
- **Remedy**: Increase `DB_POOL_SIZE` and `DB_MAX_OVERFLOW` in `app/core/config.py` or scale database connection pooler (e.g. PgBouncer).

### Issue: Refresh Token Expired or Revoked (HTTP 401 `SESSION_REVOKED`)
- **Cause**: Refresh token was already rotated or revoked during logout.
- **Remedy**: Client must initiate a fresh login with credentials to establish a new session.
