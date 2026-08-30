#!/usr/bin/env bash
# ==============================================================================
# Database Restore Utility Script
# ==============================================================================
set -euo pipefail

if [ "$#" -ne 1 ]; then
    echo "Usage: $0 <path_to_backup_file.sql.gz>"
    exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "${BACKUP_FILE}" ]; then
    echo "Error: Backup file '${BACKUP_FILE}' does not exist."
    exit 1
fi

echo "[$(date)] Restoring database from '${BACKUP_FILE}'..."

PGPASSWORD="${POSTGRES_PASSWORD}" pg_restore \
  -h "${POSTGRES_HOST:-localhost}" \
  -U "${POSTGRES_USER:-postgres}" \
  -d "${POSTGRES_DB:-cyber_risk_db}" \
  --clean \
  --if-exists \
  --no-owner \
  "${BACKUP_FILE}"

echo "[$(date)] Database restoration completed successfully."
