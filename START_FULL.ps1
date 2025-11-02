# WINK Performance Review - Quick Start

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "WINK Performance Review - FULL START" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Проверка PostgreSQL
Write-Host "[1/3] Checking PostgreSQL..." -ForegroundColor Yellow
try {
    $result = psql -U postgres -d wink_performance_review -t -c "SELECT COUNT(*) FROM users;" 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ PostgreSQL is running ($result users in database)" -ForegroundColor Green
    } else {
        throw "PostgreSQL connection failed"
    }
} catch {
    Write-Host "❌ ERROR: PostgreSQL is not running or database not found!" -ForegroundColor Red
    Write-Host "Please start PostgreSQL and run: node server/seed-simple.js" -ForegroundColor Yellow
    pause
    exit 1
}

Write-Host ""
Write-Host "[2/4] Starting AI Service..." -ForegroundColor Yellow
Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-Command", "cd '$PWD\aiassistant'; .\venv\Scripts\Activate.ps1; python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"
Start-Sleep -Seconds 3
Write-Host "✅ AI Service started on http://localhost:8000" -ForegroundColor Green

Write-Host ""
Write-Host "[3/4] Starting Backend Server..." -ForegroundColor Yellow
Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-Command", "cd '$PWD\server'; node server-new.js"
Start-Sleep -Seconds 3
Write-Host "✅ Backend started on http://localhost:5000" -ForegroundColor Green

Write-Host ""
Write-Host "[4/4] Starting Frontend..." -ForegroundColor Yellow
Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-Command", "cd '$PWD\client'; npm start"
Write-Host "✅ Frontend starting on http://localhost:3000" -ForegroundColor Green

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "All services started!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "[AI]  AI Service: http://localhost:8000" -ForegroundColor White
Write-Host "[BE]  Backend:    http://localhost:5000" -ForegroundColor White
Write-Host "[FE]  Frontend:   http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "[DOC] AI API Docs: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host ""
Write-Host "Test credentials (password: 123456):" -ForegroundColor Yellow
Write-Host "   - admin@wink.ru (Administrator)" -ForegroundColor Gray
Write-Host "   - hr@wink.ru (HR Manager)" -ForegroundColor Gray
Write-Host "   - manager1@wink.ru (Team Lead)" -ForegroundColor Gray
Write-Host "   - emp1@wink.ru (Employee)" -ForegroundColor Gray
Write-Host ""
Write-Host "Press any key to open browser..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

Start-Process "http://localhost:3000"
