# WINK Performance Review - Production Start
# Запуск обоих серверов для публичного доступа

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "WINK Performance Review - PRODUCTION" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Проверка PostgreSQL
Write-Host "[1/3] Checking PostgreSQL..." -ForegroundColor Yellow
try {
    $env:PGPASSWORD='wink2025'
    $result = & psql -U postgres -p 5433 -d wink_performance_review -t -c "SELECT COUNT(*) FROM users;" 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ PostgreSQL is running" -ForegroundColor Green
    } else {
        throw "PostgreSQL connection failed"
    }
} catch {
    Write-Host "❌ ERROR: PostgreSQL is not running!" -ForegroundColor Red
    pause
    exit 1
}

Write-Host ""
Write-Host "[2/3] Starting Backend API Server..." -ForegroundColor Yellow
Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-Command", "cd '$PWD\server'; Write-Host '🚀 Starting Backend...' -ForegroundColor Green; node server-new.js"
Start-Sleep -Seconds 3
Write-Host "✅ Backend started on port 5000" -ForegroundColor Green

Write-Host ""
Write-Host "[3/3] Starting Frontend Production Server..." -ForegroundColor Yellow
Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-Command", "cd '$PWD\server'; Write-Host '🚀 Starting Frontend...' -ForegroundColor Green; node serve-frontend.js"
Start-Sleep -Seconds 2
Write-Host "✅ Frontend started on port 3000" -ForegroundColor Green

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "All services started!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "🌐 Публичный доступ:" -ForegroundColor Yellow
Write-Host "   Frontend: http://app.demodev.crazedns.ru" -ForegroundColor White
Write-Host "   API:      http://api.demodev.crazedns.ru" -ForegroundColor White
Write-Host ""
Write-Host "🏠 Локальный доступ:" -ForegroundColor Yellow
Write-Host "   Frontend: http://localhost:3000 или http://192.168.1.140:3000" -ForegroundColor White
Write-Host "   API:      http://localhost:5000 или http://192.168.1.140:5000" -ForegroundColor White
Write-Host ""
Write-Host "🔑 Test credentials (password: 123456):" -ForegroundColor Cyan
Write-Host "   - admin@wink.ru" -ForegroundColor Gray
Write-Host "   - hr@wink.ru" -ForegroundColor Gray
Write-Host "   - manager1@wink.ru" -ForegroundColor Gray
Write-Host "   - emp1@wink.ru" -ForegroundColor Gray
Write-Host ""
pause
