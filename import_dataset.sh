#!/usr/bin/env bash
set -e

echo "========================================================"
echo " Restoring CVE Database from cve_record.sql"
echo "========================================================"

if [ ! -f "cve_record.sql" ]; then
    echo "[ERROR] cve_record.sql not found in current directory!"
    echo "Please place the 1.47 GB database dump in this root folder."
    exit 1
fi

echo "Checking if PostgreSQL container is running..."
if ! docker compose ps db --format "{{.State}}" | grep -qi "running"; then
    echo "[INFO] Database container is not running. Starting services..."
    docker compose --env-file .env.docker up db -d
    echo "Waiting 10 seconds for PostgreSQL to be ready..."
    sleep 10
fi

echo "Restoring dataset into PostgreSQL (vulnmark)..."
echo "This may take 2-5 minutes depending on disk speed. Please wait..."
docker compose exec -T db pg_restore -U postgres -d vulnmark --clean --if-exists < cve_record.sql

echo "========================================================"
echo " Database restore complete!"
echo "========================================================"
