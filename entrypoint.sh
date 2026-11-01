#!/usr/bin/env bash
set -e

echo "=== Starting CVE & LineVul Platform All-in-One Container ==="

# Initialize PostgreSQL cluster if not already done
if [ ! -d "/var/lib/postgresql/16/main" ] || [ -z "$(ls -A /var/lib/postgresql/16/main)" ]; then
    echo "[1/4] Initializing PostgreSQL cluster..."
    mkdir -p /var/lib/postgresql/16/main
    chown -R postgres:postgres /var/lib/postgresql/16/main
    su - postgres -c "/usr/lib/postgresql/16/bin/initdb -D /var/lib/postgresql/16/main"
fi

# Ensure postgres is running temporarily to check/create vulnmark db
echo "[2/4] Setting up PostgreSQL database..."
su - postgres -c "/usr/lib/postgresql/16/bin/pg_ctl -D /var/lib/postgresql/16/main -l /tmp/pg.log start"
su - postgres -c "psql -c \"ALTER USER postgres WITH PASSWORD 'muneeb88';\""
su - postgres -c "psql -tc \"SELECT 1 FROM pg_database WHERE datname = 'vulnmark'\" | grep -q 1 || psql -c \"CREATE DATABASE vulnmark OWNER postgres;\""

# Apply initial schema
if [ -f "/app/scripts/init_db.sql" ]; then
    echo "[3/4] Applying base schema..."
    su - postgres -c "psql -d vulnmark -f /app/scripts/init_db.sql" || true
fi

# Stop temporary postgres so supervisord manages it
su - postgres -c "/usr/lib/postgresql/16/bin/pg_ctl -D /var/lib/postgresql/16/main stop"

echo "[4/4] Launching Supervisor to run all services..."
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
