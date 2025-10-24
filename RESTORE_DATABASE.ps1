# Скрипт для восстановления базы данных PostgreSQL из бэкапа
# Восстанавливает схему и данные из SQL дампа

param(
    [string]$BackupFile = ""
)

Write-Host ""
Write-Host "╔════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   ВОССТАНОВЛЕНИЕ БАЗЫ ДАННЫХ POSTGRESQL       ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Если файл не указан, показываем список доступных бэкапов
if ($BackupFile -eq "") {
    $backupDir = "database_backups"
    
    if (!(Test-Path $backupDir)) {
        Write-Host "❌ Директория с бэкапами не найдена: $backupDir" -ForegroundColor Red
        Write-Host "   Сначала создайте бэкап с помощью EXPORT_DATABASE.ps1" -ForegroundColor Yellow
        exit 1
    }
    
    $backups = Get-ChildItem -Path $backupDir -Filter "*.sql" | Sort-Object LastWriteTime -Descending
    
    if ($backups.Count -eq 0) {
        Write-Host "❌ Не найдено файлов бэкапов в директории: $backupDir" -ForegroundColor Red
        Write-Host "   Сначала создайте бэкап с помощью EXPORT_DATABASE.ps1" -ForegroundColor Yellow
        exit 1
    }
    
    Write-Host "📦 Доступные бэкапы:" -ForegroundColor Yellow
    Write-Host ""
    
    for ($i = 0; $i -lt $backups.Count; $i++) {
        $backup = $backups[$i]
        $size = [math]::Round($backup.Length / 1KB, 2)
        $date = $backup.LastWriteTime.ToString("dd.MM.yyyy HH:mm:ss")
        Write-Host "  [$($i+1)] $($backup.Name)" -ForegroundColor Cyan
        Write-Host "      Размер: $size KB | Дата: $date" -ForegroundColor Gray
        Write-Host ""
    }
    
    Write-Host "Введите номер бэкапа для восстановления (или путь к файлу): " -NoNewline -ForegroundColor Yellow
    $choice = Read-Host
    
    if ($choice -match '^\d+$') {
        $index = [int]$choice - 1
        if ($index -ge 0 -and $index -lt $backups.Count) {
            $BackupFile = $backups[$index].FullName
        } else {
            Write-Host "❌ Неверный номер!" -ForegroundColor Red
            exit 1
        }
    } else {
        $BackupFile = $choice
    }
}

# Проверяем существование файла
if (!(Test-Path $BackupFile)) {
    Write-Host "❌ Файл не найден: $BackupFile" -ForegroundColor Red
    exit 1
}

# Параметры подключения
$env:PGPASSWORD = "admin"
$dbHost = "localhost"
$dbPort = "5433"
$dbName = "wink_performance_review"
$dbUser = "postgres"

Write-Host ""
Write-Host "📊 База данных: $dbName" -ForegroundColor Yellow
Write-Host "🖥️  Сервер: $dbHost`:$dbPort" -ForegroundColor Yellow
Write-Host "👤 Пользователь: $dbUser" -ForegroundColor Yellow
Write-Host "📦 Файл бэкапа: $BackupFile" -ForegroundColor Yellow
Write-Host ""

# Проверяем доступность psql
$psqlPath = "C:\Program Files\PostgreSQL\17\bin\psql.exe"

if (!(Test-Path $psqlPath)) {
    Write-Host "❌ Ошибка: psql не найден по пути: $psqlPath" -ForegroundColor Red
    Write-Host "   Попытка найти в PATH..." -ForegroundColor Yellow
    
    $psqlCmd = Get-Command psql -ErrorAction SilentlyContinue
    if ($psqlCmd) {
        $psqlPath = $psqlCmd.Source
        Write-Host "   ✅ Найден: $psqlPath" -ForegroundColor Green
    } else {
        Write-Host "   ❌ psql не найден в PATH" -ForegroundColor Red
        Write-Host "   Установите PostgreSQL или добавьте путь к psql в PATH" -ForegroundColor Yellow
        exit 1
    }
}

Write-Host "⚠️  ВНИМАНИЕ: Это удалит все существующие данные в базе!" -ForegroundColor Red
Write-Host "Продолжить? (y/n): " -NoNewline -ForegroundColor Yellow
$confirm = Read-Host

if ($confirm -ne "y" -and $confirm -ne "Y") {
    Write-Host "❌ Отменено пользователем" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "🔧 Начинаю восстановление..." -ForegroundColor Cyan
Write-Host ""

try {
    # Удаляем существующую базу
    Write-Host "1️⃣ Удаление существующей базы данных..." -ForegroundColor Yellow
    & $psqlPath `
        --host=$dbHost `
        --port=$dbPort `
        --username=$dbUser `
        --dbname=postgres `
        --command="DROP DATABASE IF EXISTS $dbName;" `
        2>&1 | Out-Null
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "   ⚠️  Предупреждение: Не удалось удалить базу данных" -ForegroundColor Yellow
    } else {
        Write-Host "   ✅ База данных удалена" -ForegroundColor Green
    }
    
    # Создаем новую базу
    Write-Host "2️⃣ Создание новой базы данных..." -ForegroundColor Yellow
    & $psqlPath `
        --host=$dbHost `
        --port=$dbPort `
        --username=$dbUser `
        --dbname=postgres `
        --command="CREATE DATABASE $dbName ENCODING 'UTF8';" `
        2>&1 | Out-Null
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "   ❌ Ошибка при создании базы данных!" -ForegroundColor Red
        exit 1
    } else {
        Write-Host "   ✅ База данных создана" -ForegroundColor Green
    }
    
    # Восстанавливаем данные
    Write-Host "3️⃣ Восстановление данных из бэкапа..." -ForegroundColor Yellow
    & $psqlPath `
        --host=$dbHost `
        --port=$dbPort `
        --username=$dbUser `
        --dbname=$dbName `
        --file=$BackupFile `
        --quiet `
        2>&1 | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Данные восстановлены" -ForegroundColor Green
        Write-Host ""
        Write-Host "╔════════════════════════════════════════════════╗" -ForegroundColor Green
        Write-Host "║   ✅ ВОССТАНОВЛЕНИЕ УСПЕШНО ЗАВЕРШЕНО!         ║" -ForegroundColor Green
        Write-Host "╚════════════════════════════════════════════════╝" -ForegroundColor Green
        Write-Host ""
        Write-Host "База данных полностью восстановлена из бэкапа!" -ForegroundColor Green
        Write-Host "Можно запускать приложение." -ForegroundColor Green
        Write-Host ""
    } else {
        Write-Host "   ❌ Ошибка при восстановлении данных!" -ForegroundColor Red
        Write-Host "   Код ошибки: $LASTEXITCODE" -ForegroundColor Red
        exit 1
    }
    
} catch {
    Write-Host "❌ Ошибка: $_" -ForegroundColor Red
    exit 1
} finally {
    # Очищаем переменную окружения с паролем
    Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
}
