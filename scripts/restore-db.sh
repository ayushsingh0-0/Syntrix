#!/bin/bash
# ==============================================================================
# Syntrix Database Restore Drill Script
# Restores a compressed SQL dump archive to the target MariaDB / MySQL database
# ==============================================================================

set -euo pipefail

if [ -z "${1:-}" ]; then
  echo "❌ Error: Please specify the backup file path to restore."
  echo "Usage: ./scripts/restore-db.sh backups/syntrix_backup_YYYYMMDD_HHMMSS.sql.gz"
  exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
  echo "❌ Error: Backup file '$BACKUP_FILE' does not exist."
  exit 1
fi

DB_HOST="${DB_HOST:-127.0.0.1}"
DB_PORT="${DB_PORT:-3306}"
DB_USER="${DB_USER:-root}"
DB_PASSWORD="${DB_PASSWORD:-rootpassword}"
DB_NAME="${DB_NAME:-syntrix}"

echo "⚠️  [$(date)] Restoring database '$DB_NAME' from '$BACKUP_FILE'..."
echo "Host: $DB_HOST:$DB_PORT"

gunzip -c "$BACKUP_FILE" | mariadb \
  --host="$DB_HOST" \
  --port="$DB_PORT" \
  --user="$DB_USER" \
  --password="$DB_PASSWORD" \
  "$DB_NAME"

echo "✅ [$(date)] Database restoration completed successfully."
