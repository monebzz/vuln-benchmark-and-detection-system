# LineVul Vulnerability Detection Service Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    git \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Install PyTorch CPU directly
RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu

# Copy dependencies list and install
COPY linevul/requirements.docker.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy linevul codebase and shared files
COPY linevul/ /app/
COPY config.py /app/config.py
COPY cwe_catalog.py /app/cwe_catalog.py

ENV PYTHONUNBUFFERED=1
ENV PORT=5000
ENV PYTHONPATH=/app:/app/linevul

EXPOSE 5000

CMD ["python", "app.py"]
