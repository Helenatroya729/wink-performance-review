# Скрипт для сброса пароля PostgreSQL
# Запускать от имени администратора

Write-Host "Остановка PostgreSQL..." -ForegroundColor Yellow
Stop-Service -Name "postgresql-x64-17" -Force

Write-Host "Создание резервной копии pg_hba.conf..." -ForegroundColor Yellow
$pgHbaPath = "C:\Program Files\PostgreSQL\17\data\pg_hba.conf"
$backupPath = "C:\Program Files\PostgreSQL\17\data\pg_hba.conf.backup"
Copy-Item $pgHbaPath $backupPath -Force

Write-Host "Чтение текущей конфигурации..." -ForegroundColor Yellow
$content = Get-Content $pgHbaPath

Write-Host "Настройка trust аутентификации..." -ForegroundColor Yellow
$newContent = @()
foreach ($line in $content) {
    if ($line -match "^host\s+all\s+all\s+127\.0\.0\.1/32\s+") {
        $newContent += "host    all             all             127.0.0.1/32            trust"
        Write-Host "  Изменена строка для 127.0.0.1" -ForegroundColor Green
    }
    elseif ($line -match "^host\s+all\s+all\s+::1/128\s+") {
        $newContent += "host    all             all             ::1/128                 trust"
        Write-Host "  Изменена строка для ::1" -ForegroundColor Green
    }
    elseif ($line -match "^local\s+all\s+postgres\s+") {
        $newContent += "local   all             postgres                                trust"
        Write-Host "  Изменена строка для local postgres" -ForegroundColor Green
    }
    else {
        $newContent += $line
    }
}

$newContent | Set-Content $pgHbaPath -Encoding UTF8

Write-Host "Запуск PostgreSQL..." -ForegroundColor Yellow
Start-Service -Name "postgresql-x64-17"

Start-Sleep -Seconds 3

Write-Host ""
Write-Host "Готово! Теперь можно подключиться без пароля:" -ForegroundColor Green
Write-Host "  psql -U postgres" -ForegroundColor Cyan
Write-Host ""
Write-Host "После подключения установите новый пароль:" -ForegroundColor Green
Write-Host "  ALTER ROLE postgres WITH PASSWORD 'ваш_новый_пароль';" -ForegroundColor Cyan
Write-Host ""
Write-Host "Или используйте команду:" -ForegroundColor Green
Write-Host "  \password" -ForegroundColor Cyan
Write-Host ""
