@echo off
echo ========================================
echo Udemy Progress Tracker - Express Server
echo ========================================
echo.
echo Starting server on http://localhost:5001
echo.

REM Check if node_modules exists
if not exist "node_modules\" (
    echo Installing dependencies...
    call npm install
    echo.
)

echo Starting server...
node server.js

pause
