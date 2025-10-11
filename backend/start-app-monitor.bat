@echo off
echo Starting Employee360 Application Monitor...
echo.

cd /d "%~dp0"

REM Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python and try again
    pause
    exit /b 1
)

REM Run the monitor startup script
python start_monitor.py

echo.
echo Monitor stopped. Press any key to exit...
pause >nul