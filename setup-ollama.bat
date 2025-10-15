@echo off
echo ====================================
echo Ollama Quick Start for Employee360
echo ====================================
echo.

REM Check if Ollama is installed
where ollama >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Ollama is not installed!
    echo.
    echo Please install Ollama first:
    echo 1. Go to: https://ollama.ai/download
    echo 2. Download and install Ollama for Windows
    echo 3. Run this script again
    echo.
    pause
    exit /b 1
)

echo [1/4] Checking Ollama installation...
ollama --version
echo.

echo [2/4] Checking if llama3.2 model is downloaded...
ollama list | findstr "llama3.2" >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Model not found. Downloading llama3.2... (this may take 5-15 minutes)
    echo Please wait...
    ollama pull llama3.2
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to download model!
        pause
        exit /b 1
    )
    echo Model downloaded successfully!
) else (
    echo Model already downloaded!
)
echo.

echo [3/4] Testing Ollama connection...
curl -s http://localhost:11434/api/tags >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Ollama service not responding. Starting Ollama...
    start /B ollama serve
    timeout /t 3 /nobreak >nul
)

curl -s http://localhost:11434/api/tags >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Ollama is running! ✓
) else (
    echo [ERROR] Could not connect to Ollama
    echo Please start Ollama manually and try again
    pause
    exit /b 1
)
echo.

echo [4/4] Configuration check...
findstr /C:"AI_PROVIDER=ollama" backend-express\.env >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo .env configured correctly! ✓
) else (
    echo [WARNING] .env file may not be configured for Ollama
    echo Please check backend-express\.env
)
echo.

echo ====================================
echo ✓ Ollama Setup Complete!
echo ====================================
echo.
echo Next steps:
echo 1. Start the backend: cd backend-express && node server.js
echo 2. Start the frontend (if not running): cd frontend && npm start
echo 3. Open http://localhost:3000 in your browser
echo 4. Look for AI Suggestions card with green "AI" badge
echo.
echo For detailed instructions, see: OLLAMA_SETUP_GUIDE.md
echo.
pause
