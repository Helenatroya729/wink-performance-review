@echo off
echo Настройка PostgreSQL для локального доступа без пароля...
echo.

REM Останавливаем PostgreSQL
net stop postgresql-x64-17

REM Создаем резервную копию pg_hba.conf
copy "C:\Program Files\PostgreSQL\17\data\pg_hba.conf" "C:\Program Files\PostgreSQL\17\data\pg_hba.conf.backup"

REM Изменяем метод аутентификации на trust для локальных подключений
powershell -Command "(Get-Content 'C:\Program Files\PostgreSQL\17\data\pg_hba.conf') -replace 'host    all             all             127.0.0.1/32            scram-sha-256', 'host    all             all             127.0.0.1/32            trust' | Set-Content 'C:\Program Files\PostgreSQL\17\data\pg_hba.conf'"
powershell -Command "(Get-Content 'C:\Program Files\PostgreSQL\17\data\pg_hba.conf') -replace 'host    all             all             ::1/128                 scram-sha-256', 'host    all             all             ::1/128                 trust' | Set-Content 'C:\Program Files\PostgreSQL\17\data\pg_hba.conf'"

REM Запускаем PostgreSQL
net start postgresql-x64-17

echo.
echo Готово! Теперь можно подключаться без пароля через localhost
echo.
pause
