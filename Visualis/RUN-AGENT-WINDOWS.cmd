@echo off
REM Run this from c:\rivky\noa\base\Visualis in CMD
REM First time: run CREATE-VENV-WINDOWS.cmd once

cd /d c:\rivky\noa\base\Visualis

if not exist ".venv\Scripts\python.exe" (
    echo ERROR: .venv not found. Run CREATE-VENV-WINDOWS.cmd first.
    pause
    exit /b 1
)

set PYTHONPATH=.
.venv\Scripts\python.exe -m uvicorn agent.app:app --host 0.0.0.0 --port 8002 --reload --app-dir .
