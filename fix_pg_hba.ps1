# Остановка PostgreSQL
Stop-Service -Name "postgresql-x64-17" -Force
Start-Sleep -Seconds 2

# Backup
$pgHbaPath = "C:\Program Files\PostgreSQL\17\data\pg_hba.conf"
Copy-Item $pgHbaPath "$pgHbaPath.backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')" -Force

# Замена scram-sha-256 на trust
(Get-Content $pgHbaPath) -replace 'scram-sha-256', 'trust' | Set-Content $pgHbaPath -Encoding UTF8

# Запуск PostgreSQL
Start-Service -Name "postgresql-x64-17"
Start-Sleep -Seconds 3

Write-Host "PostgreSQL перезапущен с trust аутентификацией" -ForegroundColor Green
