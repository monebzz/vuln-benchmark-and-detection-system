# Docker Setup Guide: CVE & LineVul Platform

This project supports two containerization workflows:
1. **Multi-Service Docker Compose (Recommended)**: Runs each tier in an isolated, optimized container (Frontend, Backend, LineVul AI, PostgreSQL).
2. **All-in-One Single Container**: Bundles all four components into a single monolithic Docker container managed by `supervisord`.

---

## Architecture Overview

| Component | Port | Description | Dockerfile |
|---|---|---|---|
| **Frontend UI** | `3000` | Next.js 16 + React 19 web application | `frontend/Dockerfile` |
| **Backend API** | `8001` | FastAPI local CVE backend & proxy | `backend/Dockerfile` |
| **LineVul AI** | `5000` | Flask + PyTorch CodeBERT vulnerability scoring service | `linevul/Dockerfile` |
| **Database** | `5432` | PostgreSQL 17 (`vulnmark` database) | `postgres:17-alpine` |

---

## Option 1: Multi-Service Docker Compose (Recommended)

### 1. Start all services
Run either the convenient batch script or docker compose command:

**On Windows:**
```bat
run_docker.bat
```

**Or with Docker Compose CLI:**
```bash
docker compose --env-file .env.docker up --build -d
```

### 2. View Service Status & Logs
```bash
# Check container status
docker compose ps

# Follow logs across all services
docker compose logs -f

# Follow logs for a specific service
docker compose logs -f backend
docker compose logs -f linevul
docker compose logs -f frontend
```

### 3. Stop the services
```bash
docker compose down
```
To also remove the persistent database volume:
```bash
docker compose down -v
```

---

## Option 2: All-in-One Single Container

If you prefer running everything inside a single standalone container image:

### 1. Build the container
```bash
docker build -t cve-platform-all-in-one -f Dockerfile.all-in-one .
```

### 2. Run the container
```bash
docker run -d \
  -p 3000:3000 \
  -p 8001:8001 \
  -p 5000:5000 \
  -p 5432:5432 \
  --name cve_platform \
  cve-platform-all-in-one
```

---

## Loading the CVE Dataset (cve_record.sql)

The repository includes a 1.47 GB database dump (`cve_record.sql`) created using PostgreSQL's custom format (`pg_dump -Fc`).

Because of its large size, it is excluded from images via `.dockerignore` to keep image builds fast and lean. To restore the complete database into your running PostgreSQL container:

### For Docker Compose:
```bash
# Stream the custom pg_dump into pg_restore inside the container
docker compose exec -T db pg_restore -U postgres -d vulnmark --clean --if-exists < cve_record.sql
```

### For the All-in-One Container:
```bash
docker exec -i cve_platform pg_restore -U postgres -d vulnmark --clean --if-exists < cve_record.sql
```

---

## Service Endpoints & Verification

Once started, verify each service:
- **Web UI**: [http://localhost:3000](http://localhost:3000)
- **Backend API Docs (Swagger UI)**: [http://localhost:8001/docs](http://localhost:8001/docs)
- **LineVul AI Service**: [http://localhost:5000](http://localhost:5000)
- **PostgreSQL**: `localhost:5432` (User: `postgres`, Pass: `muneeb88`, DB: `vulnmark`)
