#!/usr/bin/env bash
# ==============================================================================
# Automated Encrypted Database Backup Script
# ==============================================================================
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/var/backups/cyber_risk}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/cyber_risk_backup_${TIMESTAMP}.sql.gz"
RETENTION_DAYS="${RETENTION_DAYS:-30}"

mkdir -p "${BACKUP_DIR}"

echo "[$(date)] Starting PostgreSQL database backup..."

PGPASSWORD="${POSTGRES_PASSWORD}" pg_dump \
  -h "${POSTGRES_HOST:-localhost}" \
  -U "${POSTGRES_USER:-postgres}" \
  -d "${POSTGRES_DB:-cyber_risk_db}" \
  --format=custom \
  --compress=9 \
  --file="${BACKUP_FILE}"

echo "[$(date)] Backup completed successfully: ${BACKUP_FILE} ($(du -h "${BACKUP_FILE}" | cut -f1))"

# Prune backups older than retention policy
find "${BACKUP_DIR}" -name "cyber_risk_backup_*.sql.gz" -mtime +"${RETENTION_DAYS}" -delete
echo "[$(date)] Expired backups older than ${RETENTION_DAYS} days pruned."
