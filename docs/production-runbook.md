# Production Operations & Maintenance Runbook

## 1. Routine Service Management

### 1.1 Starting & Restarting Services
```bash
# Start all platform microservices in production
docker-compose -f docker-compose.prod.yml up -d

# Gracefully restart backend API workers without dropping active connections
docker-compose restart backend

# View live structured log streams
docker-compose logs -f --tail=100 backend
```

### 1.2 Health Diagnostics & Probes
```bash
# Check service liveness
curl -s http://localhost:8000/health/live | jq .

# Check database readiness & connection pool
curl -s http://localhost:8000/health/ready | jq .

# Scrape Prometheus metrics
curl -s http://localhost:8000/metrics | grep cyber_risk
```

---

## 2. Secret & Credential Rotation Procedures

### 2.1 JWT Secret Key Rotation
1. Update `JWT_SECRET_KEY` in production environment file.
2. Deploy backend service cluster with rolling restart.
3. Existing valid access tokens will require one-time re-authentication (graceful session refresh).

### 2.2 Database Password Rotation
1. Create new database user password in PostgreSQL:
   ```sql
   ALTER USER app_user WITH PASSWORD 'NewStrongPassword123!';
   ```
2. Update `DATABASE_URL` in secrets manager / environment configuration.
3. Restart backend services to re-establish connection pooling.

### 2.3 Webhook HMAC Secret Regeneration
1. Admin opens `/integrations/webhooks` in the dashboard.
2. Click **Create Webhook Endpoint** to generate a new signing secret.
3. Update sending system (e.g. CrowdStrike, Splunk) with new `X-Signature-SHA256` secret.
4. Delete the obsolete webhook receiver.

---

## 3. Incident Alerting & Triage Playbooks

### Alert 1: High Database Connection Pool Exhaustion (`db_pool_utilization > 85%`)
- **Triage**: Check for unclosed sessions or runaway Monte Carlo batch queries.
- **Action**:
  1. Inspect active SQL queries in PostgreSQL:
     ```sql
     SELECT pid, age(clock_timestamp(), query_start), usename, query 
     FROM pg_stat_activity 
     WHERE state != 'idle' AND query_start < now() - interval '30 seconds';
     ```
  2. Terminate rogue blocking queries if necessary: `SELECT pg_terminate_backend(pid);`
  3. Increase `DB_POOL_SIZE` and `DB_MAX_OVERFLOW` in `config.py` if steady-state traffic has grown.

### Alert 2: Authentication Spike / Brute Force (`auth_failures_5m > 50`)
- **Triage**: Review client IPs in structured logs:
  ```bash
  grep 'POST /api/v1/auth/login HTTP/1.1 401' app.log | jq .client_ip | sort | uniq -c
  ```
- **Action**:
  1. Verify sliding-window rate limiting is actively throttling offending IPs (`HTTP 429 Too Many Requests`).
  2. Add persistent offending IPs to edge NGINX firewall drop rules if necessary.

### Alert 3: Telemetry Ingestion Pipeline Failure (`integration_errors_1h > 10`)
- **Triage**: Navigate to `/integrations/[id]/logs` to view detailed ingestion error diagnostics.
- **Action**:
  1. Test remote connection: Click **Test Connection** in the UI.
  2. Verify external API key expiration or endpoint SSL certificate changes.
  3. Re-trigger delta sync with `sync_mode=INCREMENTAL`.
