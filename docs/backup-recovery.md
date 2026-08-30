# Database Backup & Restoration Runbook

## 1. Backup Policies & Target Objectives

- **Recovery Point Objective (RPO)**: **< 15 Minutes** (Continuous PostgreSQL WAL shipping + automated daily snapshot).
- **Recovery Time Objective (RTO)**: **< 60 Minutes** (Standby promotion or snapshot restoration).
- **Snapshot Retention**: 30 days online, 365 days in encrypted geo-redundant storage.

---

## 2. Backup Execution Procedures

### 2.1 Automated Snapshot Script
```bash
#!/usr/bin/env bash
set -eo pipefail

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/var/backups/cyber_risk"
BACKUP_FILE="${BACKUP_DIR}/cyber_risk_${TIMESTAMP}.dump"

mkdir -p "${BACKUP_DIR}"

echo "[INFO] Starting database backup to ${BACKUP_FILE}..."
PGPASSWORD="${DB_PASSWORD}" pg_dump \
  -h "${DB_HOST}" \
  -U "${DB_USER}" \
  -d cyber_risk_db \
  -F c \
  -b \
  -v \
  -f "${BACKUP_FILE}"

echo "[INFO] Compressing and encrypting backup archive..."
gpg --symmetric --cipher-algo AES256 --batch --passphrase "${BACKUP_ENCRYPTION_KEY}" "${BACKUP_FILE}"
rm -f "${BACKUP_FILE}"

echo "[SUCCESS] Encrypted backup created: ${BACKUP_FILE}.gpg"
```

---

## 3. Database Restoration Procedures

### 3.1 Restoring from Encrypted Snapshot
```bash
# 1. Decrypt backup archive
gpg --decrypt --batch --passphrase "${BACKUP_ENCRYPTION_KEY}" /var/backups/cyber_risk/cyber_risk_latest.dump.gpg > /tmp/restore.dump

# 2. Re-create database if restoring to clean instance
PGPASSWORD="${DB_PASSWORD}" dropdb -h "${DB_HOST}" -U "${DB_USER}" --if-exists cyber_risk_db
PGPASSWORD="${DB_PASSWORD}" createdb -h "${DB_HOST}" -U "${DB_USER}" cyber_risk_db

# 3. Restore schema and data
PGPASSWORD="${DB_PASSWORD}" pg_restore \
  -h "${DB_HOST}" \
  -U "${DB_USER}" \
  -d cyber_risk_db \
  -v \
  /tmp/restore.dump

# 4. Clean up decrypted dump
rm -f /tmp/restore.dump

# 5. Apply any pending database migrations
alembic upgrade head
```

### 3.2 Post-Restoration Data Integrity Verification
1. Verify record counts across key tables:
   ```sql
   SELECT 'organizations' as tbl, count(*) FROM organizations
   UNION ALL
   SELECT 'assets', count(*) FROM assets
   UNION ALL
   SELECT 'vulnerabilities', count(*) FROM vulnerabilities
   UNION ALL
   SELECT 'audit_logs', count(*) FROM audit_logs;
   ```
2. Execute automated smoke tests:
   ```bash
   python -m pytest tests/test_phase14_e2e_production.py -v
   ```
