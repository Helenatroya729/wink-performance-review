# Database backup script with INSERT format
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$backupDir = "database_backups"
$backupFile = "$backupDir/wink_db_backup_inserts_$timestamp.sql"

# Create backup directory if it doesn't exist
if (-not (Test-Path $backupDir)) {
    New-Item -ItemType Directory -Path $backupDir | Out-Null
}

Write-Host "Creating database backup with INSERT statements..."
Write-Host "Database: wink_performance_review"
Write-Host "File: $backupFile"
Write-Host ""

# Set password as environment variable
$env:PGPASSWORD = "wink2025"

# Run pg_dump with INSERT format instead of COPY
& "C:\Program Files\PostgreSQL\17\bin\pg_dump.exe" `
    --host=localhost `
    --port=5433 `
    --username=postgres `
    --dbname=wink_performance_review `
    --file=$backupFile `
    --format=plain `
    --inserts `
    --column-inserts `
    --encoding=UTF8 `
    --no-owner `
    --no-privileges

if ($LASTEXITCODE -eq 0) {
    $fileSize = (Get-Item $backupFile).Length / 1MB
    Write-Host ""
    Write-Host "SUCCESS! Backup created with INSERT statements"
    Write-Host "Size: $($fileSize.ToString('0.00')) MB"
    Write-Host "Path: $backupFile"
    Write-Host ""
    Write-Host "To restore, use:"
    Write-Host "psql -U postgres -d wink_performance_review -f $backupFile"
} else {
    Write-Host "ERROR: Backup failed with exit code $LASTEXITCODE"
}

# Clear password from environment
Remove-Item Env:\PGPASSWORD
