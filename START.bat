@echo off
echo ========================================
echo   WINK Performance Review System
echo ========================================
echo.
echo Запуск сервера и клиента...
echo.

REM Добавляем Node.js в PATH для текущей сессии
set PATH=%PATH%;C:\Program Files\nodejs

REM Запускаем сервер в отдельном окне
start "WINK Server" cmd /k "cd server && npm run dev"

REM Ждем немного, чтобы сервер успел запуститься
ping 127.0.0.1 -n 6 > nul

REM Запускаем клиент
cd client
start "WINK Client" cmd /k "npm start"

echo.
echo ========================================
echo   Серверы запущены!
echo ========================================
echo.
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
echo.
echo Для остановки закройте окна серверов
echo.
pause
