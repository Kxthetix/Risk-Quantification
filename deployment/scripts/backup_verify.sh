#!/usr/bin/env bash
# ==============================================================================
# Automated Backup Verification and Dry-Run Restore Tester
# ==============================================================================
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/var/backups/cyber_risk}"
LATEST_BACKUP=$(find "${BACKUP_DIR}" -name "cyber_risk_backup_*.sql.gz" | sort -r | head -n 1)

if [ -z "${LATEST_BACKUP}" ]; then
    echo "[ERROR] No backup file found to verify in ${BACKUP_DIR}"
    exit 1
fi

echo "[$(date)] Verifying integrity of latest backup: ${LATEST_BACKUP}"

# Test gzip archive integrity
gzip -t "${LATEST_BACKUP}"
echo "[$(date)] Archive integrity check passed."

# Optional: Restore into ephemeral verification database
TEST_DB="cyber_risk_verify_tmp"
echo "[$(date)] Creating temporary test database '${TEST_DB}' for dry-run restore..."

PGPASSWORD="${POSTGRES_PASSWORD}" createdb -h "${POSTGRES_HOST:-localhost}" -U "${POSTGRES_USER:-postgres}" "${TEST_DB}" || true

PGPASSWORD="${POSTGRES_PASSWORD}" pg_restore \
  -h "${POSTGRES_HOST:-localhost}" \
  -U "${POSTGRES_USER:-postgres}" \
  -d "${TEST_DB}" \
  --no-owner \
  "${LATEST_BACKUP}"

echo "[$(date)] Dry-run restoration successful."

PGPASSWORD="${POSTGRES_PASSWORD}" dropdb -h "${POSTGRES_HOST:-localhost}" -U "${POSTGRES_USER:-postgres}" "${TEST_DB}"
echo "[$(date)] Temporary test database dropped. Verification COMPLETE: SUCCESS"
