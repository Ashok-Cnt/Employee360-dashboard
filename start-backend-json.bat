@echo off
echo ========================================
echo Starting Employee360 Backend (JSON)
echo ========================================
echo.
echo Storage: Local JSON Files
echo Location: backend-express\data\
echo.
echo Press Ctrl+C to stop the server
echo ========================================
echo.

cd backend-express
node server-json.js

pause
