@echo off
REM Switch MongoDB Connection Helper Script

echo ====================================
echo  MongoDB Connection Switcher
echo ====================================
echo.
echo Current Configuration:
findstr "USE_LOCAL_DB" .env
echo.
echo Choose your MongoDB connection:
echo 1. Atlas (Cloud)
echo 2. Local MongoDB
echo.
set /p choice="Enter your choice (1 or 2): "

if "%choice%"=="1" (
    echo.
    echo Switching to Atlas MongoDB...
    powershell -Command "(Get-Content .env) -replace 'USE_LOCAL_DB=true', 'USE_LOCAL_DB=false' | Set-Content .env"
    echo ✓ Configuration updated to use Atlas MongoDB
    echo.
    echo MongoDB Atlas URI: mongodb+srv://employee360:****@employee360.n05xtqd.mongodb.net/
    echo Database: employee360
) else if "%choice%"=="2" (
    echo.
    echo Switching to Local MongoDB...
    powershell -Command "(Get-Content .env) -replace 'USE_LOCAL_DB=false', 'USE_LOCAL_DB=true' | Set-Content .env"
    echo ✓ Configuration updated to use Local MongoDB
    echo.
    echo Make sure MongoDB is running locally on mongodb://localhost:27017/
    echo Database: employee360
) else (
    echo Invalid choice. Please run the script again.
    pause
    exit /b 1
)

echo.
echo ====================================
echo Next steps:
echo 1. Restart your Express backend
echo 2. The server will connect to the selected database
echo ====================================
echo.
pause
