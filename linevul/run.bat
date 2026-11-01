@echo off
cd /d "%~dp0"
echo ========================================================
echo  LineVul - AI Source Code Vulnerability Detection System
echo ========================================================

set PYTHON_CMD=python
if exist "%~dp0venv\Scripts\python.exe" (
    set PYTHON_CMD="%~dp0venv\Scripts\python.exe"
) else if exist "C:\Users\MUNEEB\Downloads\lineVul\venv\Scripts\python.exe" (
    set PYTHON_CMD="C:\Users\MUNEEB\Downloads\lineVul\venv\Scripts\python.exe"
)

echo Starting LineVul service using %PYTHON_CMD%...
%PYTHON_CMD% app.py
pause
