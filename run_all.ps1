# Launch all services for CVE & LineVul Platform
$root = $PSScriptRoot

Write-Host "Starting CVE Platform Services..." -ForegroundColor Cyan

# 1. Start LineVul Service (Port 5000)
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\linevul'; & 'C:\Users\MUNEEB\Downloads\lineVul\venv\Scripts\python.exe' app.py" -WindowStyle Normal

# 2. Start FastAPI Backend (Port 8001)
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\backend'; & '$root\backend\venv\Scripts\python.exe' -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload" -WindowStyle Normal

# 3. Start Next.js Frontend (Port 3000)
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\frontend'; npm run dev" -WindowStyle Normal

Write-Host "All services started:" -ForegroundColor Green
Write-Host "- LineVul Service: http://localhost:5000" -ForegroundColor Yellow
Write-Host "- Backend API:     http://localhost:8001 (Docs: http://localhost:8001/docs)" -ForegroundColor Yellow
Write-Host "- Frontend UI:     http://localhost:3000" -ForegroundColor Yellow
