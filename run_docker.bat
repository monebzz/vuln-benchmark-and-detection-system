@echo off
echo ========================================================
echo  Starting CVE & LineVul Platform with Docker Compose
echo ========================================================

:: Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo [WARNING] Docker does not appear to be running!
    echo Attempting to start Docker Desktop...
    start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    echo.
    echo Please ensure Docker Desktop has finished starting, then press any key.
    pause
)

echo Building and launching all services...
docker compose --env-file .env.docker up --build -d

echo.
echo ========================================================
echo  All services started successfully in background!
echo ========================================================
echo  - Frontend Web UI:  http://localhost:3000
echo  - Backend API Docs: http://localhost:8001/docs
echo  - LineVul Model:    http://localhost:5000
echo  - PostgreSQL DB:    localhost:5432
echo.
echo  Tip: To view real-time logs, run: docker compose logs -f
echo  Tip: To import cve_record.sql data, run: import_dataset.bat
echo ========================================================
pause
