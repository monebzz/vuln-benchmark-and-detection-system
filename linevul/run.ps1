# Run LineVul Service
$ErrorActionPreference = "Stop"
Set-Location -Path $PSScriptRoot

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host " LineVul - AI Source Code Vulnerability Detection System" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

$pythonCmd = "python"
if (Test-Path "$PSScriptRoot\venv\Scripts\python.exe") {
    $pythonCmd = "$PSScriptRoot\venv\Scripts\python.exe"
} elseif (Test-Path "C:\Users\MUNEEB\Downloads\lineVul\venv\Scripts\python.exe") {
    $pythonCmd = "C:\Users\MUNEEB\Downloads\lineVul\venv\Scripts\python.exe"
}

Write-Host "Launching LineVul with: $pythonCmd" -ForegroundColor Green
& $pythonCmd "$PSScriptRoot\app.py"
