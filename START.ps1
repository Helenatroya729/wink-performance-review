# Добавляем Node.js в PATH для текущей сессии
$env:Path += ";C:\Program Files\nodejs"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   WINK Performance Review System" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Запуск серверов..." -ForegroundColor Green
Write-Host ""

# Запускаем сервер в фоновом режиме
Write-Host "Запуск Backend сервера..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\server'; npm run dev"

# Ждем 5 секунд
Start-Sleep -Seconds 5

# Запускаем клиент
Write-Host "Запуск Frontend клиента..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\client'; npm start"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Серверы запущены!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Backend:  http://localhost:5000" -ForegroundColor Yellow
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Yellow
Write-Host ""
Write-Host "Браузер откроется автоматически через несколько секунд" -ForegroundColor Green
Write-Host "Для остановки закройте окна PowerShell с серверами" -ForegroundColor Red
Write-Host ""
