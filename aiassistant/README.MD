# AI Assistant Microservice

Микросервис для обработки запросов к LLM с использованием различных шаблонов промптов.

## Возможности

- Быстрая обработка POST запросов с JSON
- Множество готовых шаблонов промптов
- Гибкая настройка через переменные окружения
- API документация (Swagger UI)
- Логирование всех операций
- Health check эндпоинты

## Системные требования

- Python 3.11+ (рекомендуется 3.12+)
- 2 GB RAM (минимум)
- 100 MB свободного места на диске

---

## Установка и развертывание на Windows

### Шаг 1: Установка Python

1. Скачайте Python с официального сайта: https://www.python.org/downloads/
2. Запустите установщик
3. **ВАЖНО**: Отметьте "Add Python to PATH"
4. Выберите "Install Now"
5. Проверьте установку в cmd:

python --version

### Шаг 2: Подготовка проекта

# Создайте директорию проекта

mkdir X:\project_path\aiassistent
cd X:\project_path\aiassistent

# Создайте виртуальное окружение
python -m venv venv_name

# Активируйте виртуальное окружение
venv_name\Scripts\activate

# Обновите pip
python -m pip install --upgrade pip

### Шаг 3: Установка зависимостей

# Установите зависимости

pip install -r requirements.txt

### Шаг 4: Настройка переменных окружения

Создайте файл .env в корне проекта.

copy .env.example .env
notepad .env

Заполните значения в .env:

OPENAI_API_KEY=your_actual_api_key_here
BASE_URL=https://bothub.chat/api/v2/openai/v1
MODEL_NAME=llama-4-scout
TEMPERATURE=0.0
HOST=0.0.0.0
PORT=8000

### Шаг 5: Открытие порта в Windows Firewall

Через PowerShell (от администратора):

# Откройте PowerShell от имени администратора

# Создайте правило для входящих соединений
New-NetFirewallRule -DisplayName "AI Assistant Service" -Direction Inbound -LocalPort 8000 -Protocol TCP -Action Allow

# Проверьте правило
Get-NetFirewallRule -DisplayName "AI Assistant Service"


Через графический интерфейс:

Откройте "Панель управления" → "Система и безопасность" → "Брандмауэр Windows"
Выберите "Дополнительные параметры"
Кликните "Правила для входящих подключений" → "Создать правило"
Выберите "Для порта" → Далее
Выберите "TCP" → "Определенные локальные порты" → введите "8000"
Выберите "Разрешить подключение"
Отметьте все профили (Доменный, Частный, Публичный)
Введите имя: "AI Assistant Service"

### Шаг 6: Запуск сервиса

Режим разработки:

# Убедитесь что виртуальное окружение активно
cd X:\project_path\aiassistent
venv_name\Scripts\activate


# Запустите сервис
В режиме разработки:
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

Как Windows Service (NSSM):

# Скачайте NSSM: https://nssm.cc/download
# Распакуйте в C:\nssm

# Установите службу
C:\nssm\win64\nssm.exe install AIAssistant "X:\project_path\aiassistent\venv\Scripts\python.exe" "-m uvicorn app.main:app --host 0.0.0.0 --port 8000"

# Установите рабочую директорию
C:\nssm\win64\nssm.exe set AIAssistant AppDirectory X:\project_path\aiassistent

# Запустите службу
C:\nssm\win64\nssm.exe start AIAssistant

# Проверьте статус
C:\nssm\win64\nssm.exe status AIAssistant

Управление службой:

# Остановить
C:\nssm\win64\nssm.exe stop AIAssistant

# Перезапустить
C:\nssm\win64\nssm.exe restart AIAssistant

# Удалить службу
C:\nssm\win64\nssm.exe remove AIAssistant confirm
