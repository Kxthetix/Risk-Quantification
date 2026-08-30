# Disaster Recovery & Business Continuity Plan

## 1. Objectives & Metrics

| Metric | Target | Description |
|---|---|---|
| **Recovery Point Objective (RPO)** | **< 15 Minutes** | Maximum acceptable data loss period in the event of major infrastructure failure. |
| **Recovery Time Objective (RTO)** | **< 60 Minutes** | Maximum acceptable duration to restore full operational service. |
| **Availability SLA** | **99.95%** | Production uptime target excluding scheduled maintenance windows. |

---

## 2. High-Availability Architecture

```text
                        PRIMARY REGION
               ┌──────────────────────────────┐
               │    NGINX Load Balancers      │
               │   (Active / Passive Failover)│
               └──────────────┬───────────────┘
                              ▼
               ┌──────────────────────────────┐
               │   FastAPI Backend Cluster    │
               │   (Stateless Microservices)  │
               └──────────────┬───────────────┘
                              ▼
               ┌──────────────────────────────┐
               │  PostgreSQL (Primary Leader) │
               └──────────────┬───────────────┘
                              │ Streaming Replication
                              ▼
                        BACKUP REGION
               ┌──────────────────────────────┐
               │ PostgreSQL (Hot Standby DB)  │
               └──────────────────────────────┘
```

---

## 3. Automated Backup & Replication Strategy

1. **Continuous WAL Archiving**:
   - Write-Ahead Logging (WAL) shipping enabled to geo-redundant object storage (e.g. AWS S3 / Google Cloud Storage) every 5 minutes.
2. **Daily Full Encrypted Snapshots**:
   - Automated full database backup executed daily at 02:00 UTC using `pg_dump` with AES-256 encryption.
   - Backup files retained for 30 days locally and 365 days in immutable cold storage.
3. **Automated Verification Drill**:
   - Weekly automated restoration job restores the latest snapshot into an isolated staging container to test data integrity.

---

## 4. Disaster Recovery Restoration Runbook

### Step 1: Incident Assessment & Declaration
- On-call engineer detects catastrophic primary failure via Prometheus / Alertmanager.
- Incident Commander declares DR protocol and notifies executive stakeholders.

### Step 2: Database Failover & Point-in-Time Recovery (PITR)
```bash
# 1. Promote Hot Standby or Restore from WAL Archive
pg_ctl promote -D /var/lib/postgresql/data

# 2. Or Restore Snapshot into New Database Instance
pg_restore -h $DB_HOST -U $DB_USER -d cyber_risk_db -v /backups/latest_snapshot.dump

# 3. Apply Alembic Migrations to Ensure Schema Alignment
alembic upgrade head
```

### Step 3: Application Cluster Re-routing
```bash
# Update DATABASE_URL environment variable in production configuration
export DATABASE_URL="postgresql+asyncpg://app_user:$DB_PASS@$STANDBY_HOST:5432/cyber_risk_db"

# Restart Backend FastAPI Services
docker-compose up -d --force-recreate backend
```

### Step 4: System Verification & Smoke Test
- Verify liveness endpoint: `curl -f http://localhost:8000/health/live`
- Verify database readiness: `curl -f http://localhost:8000/health/ready`
- Execute automated smoke test suite:
  ```bash
  python -m pytest tests/test_phase14_e2e_production.py -v
  ```

### Step 5: Traffic Cutover & Post-Incident Review
- Re-point DNS / Global Load Balancer to the newly active region.
- Conduct Post-Incident Review (PIR) within 48 hours to document root cause and recovery duration.
