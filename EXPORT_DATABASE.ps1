# Database export script for PostgreSQL
# Creates full database dump with schema and data

$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$backupDir = "database_backups"
$backupFile = "$backupDir\wink_db_backup_$timestamp.sql"

# Create backup directory if not exists
if (!(Test-Path $backupDir)) {
    New-Item -ItemType Directory -Path $backupDir | Out-Null
    Write-Host "Created directory: $backupDir" -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  POSTGRESQL DATABASE EXPORT" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Connection parameters
$env:PGPASSWORD = "admin"
$dbHost = "localhost"
$dbPort = "5433"
$dbName = "wink_performance_review"
$dbUser = "postgres"

Write-Host "Database: $dbName" -ForegroundColor Yellow
Write-Host "Server: $dbHost`:$dbPort" -ForegroundColor Yellow
Write-Host "User: $dbUser" -ForegroundColor Yellow
Write-Host ""

# Check pg_dump availability
$pgDumpPath = "C:\Program Files\PostgreSQL\17\bin\pg_dump.exe"

if (!(Test-Path $pgDumpPath)) {
    Write-Host "Error: pg_dump not found at: $pgDumpPath" -ForegroundColor Red
    Write-Host "Trying to find in PATH..." -ForegroundColor Yellow
    
    $pgDumpCmd = Get-Command pg_dump -ErrorAction SilentlyContinue
    if ($pgDumpCmd) {
        $pgDumpPath = $pgDumpCmd.Source
        Write-Host "Found: $pgDumpPath" -ForegroundColor Green
    } else {
        Write-Host "pg_dump not found in PATH" -ForegroundColor Red
        Write-Host "Please install PostgreSQL or add pg_dump to PATH" -ForegroundColor Yellow
        exit 1
    }
}

Write-Host "Starting export..." -ForegroundColor Cyan
Write-Host ""

try {
    # Выполняем pg_dump
    & $pgDumpPath `
        --host=$dbHost `
        --port=$dbPort `
        --username=$dbUser `
        --dbname=$dbName `
        --file=$backupFile `
        --format=plain `
        --encoding=UTF8 `
        --verbose `
        --no-owner `
        --no-acl `
        2>&1 | Out-Null

    if ($LASTEXITCODE -eq 0) {
        $fileSize = (Get-Item $backupFile).Length
        $fileSizeKB = [math]::Round($fileSize / 1KB, 2)
        $fileSizeMB = [math]::Round($fileSize / 1MB, 2)
        
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "  EXPORT COMPLETED SUCCESSFULLY!" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "Backup file: $backupFile" -ForegroundColor Green
        if ($fileSizeMB -gt 1) {
            Write-Host "Size: $fileSizeMB MB" -ForegroundColor Green
        } else {
            Write-Host "Size: $fileSizeKB KB" -ForegroundColor Green
        }
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host "  HOW TO RESTORE ON ANOTHER COMPUTER:" -ForegroundColor Yellow
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "1. Install PostgreSQL 17 on new computer" -ForegroundColor White
        Write-Host ""
        Write-Host "2. Create database:" -ForegroundColor White
        Write-Host "   psql -U postgres -c ""CREATE DATABASE wink_performance_review;""" -ForegroundColor Gray
        Write-Host ""
        Write-Host "3. Restore data:" -ForegroundColor White
        Write-Host "   psql -U postgres -d wink_performance_review -f $backupFile" -ForegroundColor Gray
        Write-Host ""
        Write-Host "   OR use PowerShell script:" -ForegroundColor White
        Write-Host "   .\RESTORE_DATABASE.ps1" -ForegroundColor Gray
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Cyan
        
    } else {
        Write-Host "Error during database export!" -ForegroundColor Red
        Write-Host "Error code: $LASTEXITCODE" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
    exit 1
} finally {
    # Clear password environment variable
    Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
}
