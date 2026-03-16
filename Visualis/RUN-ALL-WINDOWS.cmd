@echo off
REM Run all Visualis services (Redis via Docker, mock flapi, Agent, Server, Client).
REM Run this from anywhere; it will cd into the Visualis folder.

cd /d c:\rivky\noa\base\Visualis

echo.
echo === Visualis: START ALL (Windows) ===
echo.

REM 1) Ensure Python virtualenv exists
if not exist ".venv\Scripts\python.exe" (
    echo ERROR: .venv not found. Run CREATE-VENV-WINDOWS.cmd first.
    pause
    exit /b 1
)

REM 2) Start Redis via Docker (if not already running)
echo.
echo [Redis] Checking Docker container "redis"...
docker ps -q -f name=redis >nul 2>&1
if errorlevel 1 (
    echo   Docker not available or not running. Skipping Redis auto-start.
) else (
    for /f "tokens=* delims=" %%i in ('docker ps -q -f name=redis') do set REDIS_RUNNING=%%i
    if not defined REDIS_RUNNING (
        echo   Starting Redis container on port 6379...
        docker run -d -p 6379:6379 --name redis redis:alpine >nul 2>&1
    ) else (
        echo   Redis container already running.
    )
)

REM 3) Start mock flapi server (Node) in its own window
echo.
echo [Mock] Starting flapi mock on http://localhost:4000 ...
start "Visualis Mock" cmd /k "cd /d c:\rivky\noa\base\Visualis\mocks && node server.js"

REM 4) Start Agent (port 8002) in its own window
echo.
echo [Agent] Starting Agent on http://localhost:8002 ...
start "Visualis Agent" cmd /k "cd /d c:\rivky\noa\base\Visualis && RUN-AGENT-WINDOWS.cmd"

REM 5) Start Server (port 8000) in its own window
echo.
echo [Server] Starting Server on http://localhost:8000 ...
start "Visualis Server" cmd /k "cd /d c:\rivky\noa\base\Visualis && RUN-SERVER-WINDOWS.cmd"

REM 6) Start Client (Vite) in its own window
echo.
echo [Client] Starting Vite dev server on http://localhost:5173 ...
REM Important: proxy /api and /libs to the real Python server on port 8000 (not the mock on 4000)
start "Visualis Client" cmd /k "cd /d c:\rivky\noa\base\Visualis\client && set VITE_PROXY_TARGET=8000 && npm run dev"

echo.
echo All services started (or attempted). Open http://localhost:5173/ in your browser.
echo You can close THIS window; the services run in their own windows.
echo.
pause

