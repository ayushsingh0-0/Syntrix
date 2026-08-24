#!/bin/bash
# ==============================================================================
# Syntrix Automated Database Backup Script
# Creates a timestamped, gzip-compressed SQL dump of the MariaDB / MySQL database
# ==============================================================================

set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DB_HOST="${DB_HOST:-127.0.0.1}"
DB_PORT="${DB_PORT:-3306}"
DB_USER="${DB_USER:-root}"
DB_PASSWORD="${DB_PASSWORD:-rootpassword}"
DB_NAME="${DB_NAME:-syntrix}"

mkdir -p "$BACKUP_DIR"

BACKUP_FILE="$BACKUP_DIR/syntrix_backup_${TIMESTAMP}.sql.gz"

echo "📦 [$(date)] Starting Syntrix database backup..."
echo "Target DB: $DB_NAME on $DB_HOST:$DB_PORT"

mariadb-dump \
  --host="$DB_HOST" \
  --port="$DB_PORT" \
  --user="$DB_USER" \
  --password="$DB_PASSWORD" \
  --single-transaction \
  --quick \
  --routines \
  --triggers \
  "$DB_NAME" | gzip -9 > "$BACKUP_FILE"

echo "✅ [$(date)] Backup successfully created: $BACKUP_FILE ($(du -h "$BACKUP_FILE" | cut -f1))"

# Retention policy: Remove backups older than 30 days
find "$BACKUP_DIR" -type f -name "syntrix_backup_*.sql.gz" -mtime +30 -exec rm {} \;
echo "🧹 Cleaned up backups older than 30 days."
