@echo off
REM Run Server (port 8000). Run after CREATE-VENV-WINDOWS.cmd

cd /d c:\rivky\noa\base\Visualis

if not exist ".venv\Scripts\python.exe" (
    echo ERROR: .venv not found. Run CREATE-VENV-WINDOWS.cmd first.
    pause
    exit /b 1
)

set PYTHONPATH=.
.venv\Scripts\python.exe -m uvicorn server.app:app --host 0.0.0.0 --port 8000 --reload --app-dir .
