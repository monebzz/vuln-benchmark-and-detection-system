#!/usr/bin/env bash
set -e

echo "========================================================"
echo " Starting CVE & LineVul Platform with Docker Compose"
echo "========================================================"

if ! docker info >/dev/null 2>&1; then
    echo "[ERROR] Docker daemon is not running!"
    echo "Please start Docker Desktop / daemon and re-run this script."
    exit 1
fi

echo "Building and launching all services..."
docker compose --env-file .env.docker up --build -d

echo ""
echo "========================================================"
echo " All services started successfully in background!"
echo "========================================================"
echo " - Frontend Web UI:  http://localhost:3000"
echo " - Backend API Docs: http://localhost:8001/docs"
echo " - LineVul Model:    http://localhost:5000"
echo " - PostgreSQL DB:    localhost:5432"
echo ""
echo " Tip: To view real-time logs, run: docker compose logs -f"
echo " Tip: To import cve_record.sql data, run: ./import_dataset.sh"
echo "========================================================"
