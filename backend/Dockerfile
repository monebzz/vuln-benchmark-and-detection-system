# Backend Dockerfile (FastAPI)
FROM python:3.11-slim

WORKDIR /app

# Install system build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Install PyTorch CPU directly
RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu

# Copy requirements and install python packages
COPY backend/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source and knowledge base assets
COPY backend/ /app/
COPY config.py /app/config.py
COPY cwe_catalog.py /app/cwe_catalog.py
COPY cve_index.npy /app/cve_index.npy
COPY cve_index_meta.json /app/cve_index_meta.json

ENV PYTHONUNBUFFERED=1
ENV PORT=8001
ENV PYTHONPATH=/app
ENV CVE_KB_PATH=/app/app/cve_kb.json
ENV CVE_INDEX_PATH=/app/cve_index.npy
ENV CVE_METADATA_PATH=/app/cve_index_meta.json

EXPOSE 8001

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001"]
