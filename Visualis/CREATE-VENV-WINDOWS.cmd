@echo off
REM Create .venv and install dependencies. Run once from c:\rivky\noa\base\Visualis

cd /d c:\rivky\noa\base\Visualis

echo Creating virtual environment...
python -m venv .venv
if errorlevel 1 (
    echo Trying py -m venv ...
    py -m venv .venv
)
if errorlevel 1 (
    echo ERROR: Could not create .venv.
    echo Install Python from https://www.python.org/downloads/
    echo During install, check "Add Python to PATH".
    pause
    exit /b 1
)

echo Installing server and agent dependencies...
.venv\Scripts\python.exe -m pip install --upgrade pip
.venv\Scripts\python.exe -m pip install -r server\requirements.txt
.venv\Scripts\python.exe -m pip install -r agent\requirements.txt

echo Done. You can now run RUN-AGENT-WINDOWS.cmd and RUN-SERVER-WINDOWS.cmd
pause
