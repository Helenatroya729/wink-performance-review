# Database backup script with custom format
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$backupDir = "database_backups"
$backupFile = "$backupDir/wink_db_backup_custom_$timestamp.backup"

# Create backup directory if it doesn't exist
if (-not (Test-Path $backupDir)) {
    New-Item -ItemType Directory -Path $backupDir | Out-Null
}

Write-Host "Creating database backup (custom format)..."
Write-Host "Database: wink_performance_review"
Write-Host "File: $backupFile"
Write-Host ""

# Set password as environment variable
$env:PGPASSWORD = "wink2025"

# Run pg_dump with custom format (binary)
& "C:\Program Files\PostgreSQL\17\bin\pg_dump.exe" `
    --host=localhost `
    --port=5433 `
    --username=postgres `
    --dbname=wink_performance_review `
    --file=$backupFile `
    --format=custom `
    --verbose `
    --encoding=UTF8

if ($LASTEXITCODE -eq 0) {
    $fileSize = (Get-Item $backupFile).Length / 1MB
    Write-Host ""
    Write-Host "SUCCESS! Backup created"
    Write-Host "Size: $($fileSize.ToString('0.00')) MB"
    Write-Host "Path: $backupFile"
    Write-Host ""
    Write-Host "To restore, use:"
    Write-Host "pg_restore -U postgres -d wink_performance_review -c $backupFile"
} else {
    Write-Host "ERROR: Backup failed with exit code $LASTEXITCODE"
}

# Clear password from environment
Remove-Item Env:\PGPASSWORD
