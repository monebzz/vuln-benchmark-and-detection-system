@echo off
echo ========================================================
echo  Restoring CVE Database from cve_record.sql
echo ========================================================

if not exist "cve_record.sql" (
    echo [ERROR] cve_record.sql file not found in current directory!
    echo Please make sure the 1.47 GB database dump is in the root project folder.
    pause
    exit /b 1
)

echo Checking if PostgreSQL container is running...
docker compose ps db --format "{{.State}}" | findstr /i "running" >nul
if errorlevel 1 (
    echo [INFO] Database container is not running. Starting services...
    docker compose --env-file .env.docker up db -d
    echo Waiting 10 seconds for PostgreSQL to be ready...
    timeout /t 10 /nobreak >nul
)

echo.
echo Restoring dataset into PostgreSQL (vulnmark)...
echo This may take 2-5 minutes depending on your disk speed. Please wait...
docker compose exec -T db pg_restore -U postgres -d vulnmark --clean --if-exists < cve_record.sql

echo.
echo ========================================================
echo  Database restore complete!
echo ========================================================
pause
