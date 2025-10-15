@echo off
title Employee360 Express Backend
echo Starting Employee360 Express Backend Server (Optimized)...
cd /d "C:\Users\Admin\vsCodeHacktonWorkspace\Employee360-dashboard\backend-express"

REM Set Node.js optimizations
set NODE_ENV=development
set NODE_OPTIONS=--max-old-space-size=4096

npm start