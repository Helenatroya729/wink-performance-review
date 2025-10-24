@echo off
echo ========================================
echo WINK Performance Review - FULL START
echo ========================================
echo.

echo [1/3] Checking PostgreSQL...
psql -U postgres -d wink_performance_review -c "SELECT COUNT(*) FROM users;" >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: PostgreSQL is not running or database not found!
    echo Please start PostgreSQL and create database first.
    pause
    exit /b 1
)
echo OK: PostgreSQL is running

echo.
echo [2/3] Starting Backend Server...
start "WINK Backend" cmd /k "cd server && node server-new.js"
timeout /t 3 >nul

echo.
echo [3/3] Starting Frontend...
start "WINK Frontend" cmd /k "cd client && npm start"

echo.
echo ========================================
echo All services started!
echo ========================================
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:3000
echo.
echo Press any key to open browser...
pause >nul
start http://localhost:3000
