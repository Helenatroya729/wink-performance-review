# Скрипт для создания полного бэкапа базы данных PostgreSQL
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$backupDir = "database_backups"
$backupFile = "$backupDir/wink_db_backup_$timestamp.sql"

# Создаем директорию для бэкапов, если её нет
if (-not (Test-Path $backupDir)) {
    New-Item -ItemType Directory -Path $backupDir | Out-Null
}

Write-Host "Creating database backup..." -ForegroundColor Cyan
Write-Host "Database: wink_performance_review" -ForegroundColor Gray
Write-Host "File: $backupFile" -ForegroundColor Gray
Write-Host ""

# Устанавливаем переменную окружения для пароля
$env:PGPASSWORD = "wink2025"

# Выполняем pg_dump
& "C:\Program Files\PostgreSQL\17\bin\pg_dump.exe" `
    --host=localhost `
    --port=5433 `
    --username=postgres `
    --dbname=wink_performance_review `
    --file=$backupFile `
    --format=plain `
    --verbose `
    --clean `
    --if-exists `
    --create `
    --encoding=UTF8

if ($LASTEXITCODE -eq 0) {
    $fileSize = (Get-Item $backupFile).Length / 1MB
    Write-Host ""
    Write-Host "SUCCESS! Backup created" -ForegroundColor Green
    Write-Host "Size: $([math]::Round($fileSize, 2)) MB" -ForegroundColor Gray
    Write-Host "Path: $backupFile" -ForegroundColor Gray
} else {
    Write-Host ""
    Write-Host "ERROR creating backup!" -ForegroundColor Red
}

# Очищаем переменную окружения
Remove-Item Env:\PGPASSWORD
