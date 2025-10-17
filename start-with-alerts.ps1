# Desktop Alert System Quick Start

Write-Host "🔔 Employee360 Desktop Alert System - Quick Start" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Check if virtual environment exists
if (-not (Test-Path ".venv")) {
    Write-Host "❌ Virtual environment not found. Please run setup first." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Installing dependencies..." -ForegroundColor Green
.\.venv\Scripts\pip.exe install -q plyer

Write-Host "✅ Dependencies installed successfully!" -ForegroundColor Green
Write-Host ""

Write-Host "📋 Desktop Alert System Features:" -ForegroundColor Yellow
Write-Host "  - Memory Usage Alerts" -ForegroundColor White
Write-Host "  - Application Overrun Detection" -ForegroundColor White
Write-Host "  - System CPU Overload Warnings" -ForegroundColor White
Write-Host ""

Write-Host "🎯 Access Points:" -ForegroundColor Yellow
Write-Host "  - UI Dashboard: http://localhost:3000/alert-rules" -ForegroundColor White
Write-Host "  - API Docs: http://localhost:8001/docs#/alerts" -ForegroundColor White
Write-Host ""

Write-Host "🚀 Starting Services..." -ForegroundColor Green
Write-Host ""

# Start backend in new window
Write-Host "Starting backend server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; ..\venv\Scripts\python.exe -m uvicorn main:app --reload --host 127.0.0.1 --port 8001"

Start-Sleep -Seconds 3

# Start frontend in new window
Write-Host "Starting frontend server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm start"

Start-Sleep -Seconds 3

# Start data collector with alerts in new window
Write-Host "Starting data collector with alerts..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd data-collector; ..\.venv\Scripts\python.exe collector_jsonl.py"

Write-Host ""
Write-Host "✅ All services started!" -ForegroundColor Green
Write-Host ""
Write-Host "📖 Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Wait for services to start (30-60 seconds)" -ForegroundColor White
Write-Host "  2. Open http://localhost:3000/alert-rules in your browser" -ForegroundColor White
Write-Host "  3. Click 'Test Notification' to verify desktop alerts work" -ForegroundColor White
Write-Host "  4. Configure your custom alert rules" -ForegroundColor White
Write-Host ""
Write-Host "📚 Documentation: DESKTOP_ALERTS_GUIDE.md" -ForegroundColor Cyan
Write-Host ""
