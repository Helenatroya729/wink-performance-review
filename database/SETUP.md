# Установка и настройка PostgreSQL для WINK Performance Review

## Шаг 1: Установка PostgreSQL

### Windows

1. Скачайте PostgreSQL с официального сайта:
   https://www.postgresql.org/download/windows/

2. Запустите установщик (рекомендуется версия 15 или 16)

3. При установке:
   - Порт: 5432 (по умолчанию)
   - Пароль для пользователя `postgres`: запомните его!
   - Локаль: Russian, Russia

4. Убедитесь, что установлены компоненты:
   - PostgreSQL Server
   - pgAdmin 4 (графический интерфейс)
   - Command Line Tools

## Шаг 2: Создание базы данных

### Вариант 1: Через pgAdmin 4

1. Откройте pgAdmin 4
2. Подключитесь к серверу (localhost)
3. Правый клик на "Databases" → Create → Database
4. Имя: `wink_performance_review`
5. Owner: postgres
6. Нажмите "Save"

### Вариант 2: Через командную строку

```powershell
# Откройте PowerShell и выполните:
psql -U postgres
```

Введите пароль, затем:

```sql
CREATE DATABASE wink_performance_review;
\c wink_performance_review
\i "C:/Users/Елена/Documents/Хакатоны/Расти в IT/database/schema.sql"
```

## Шаг 3: Применение схемы

### Через pgAdmin 4

1. Откройте базу `wink_performance_review`
2. Tools → Query Tool
3. Откройте файл `schema.sql` (File → Open)
4. Нажмите Execute (F5)

### Через командную строку

```powershell
cd "C:\Users\Елена\Documents\Хакатоны\Расти в IT\database"
psql -U postgres -d wink_performance_review -f schema.sql
```

## Шаг 4: Проверка установки

```sql
-- Подключитесь к БД
\c wink_performance_review

-- Проверьте таблицы
\dt

-- Проверьте тестовые данные
SELECT * FROM users;
SELECT * FROM review_cycles;
SELECT * FROM tasks;
```

Должно быть создано:
- 20+ таблиц
- 4 тестовых пользователя
- 1 цикл оценки
- 3 задачи

## Шаг 5: Настройка подключения в Node.js

Создайте файл `.env` в корне проекта:

```env
# PostgreSQL Connection
DB_HOST=localhost
DB_PORT=5432
DB_NAME=wink_performance_review
DB_USER=postgres
DB_PASSWORD=ваш_пароль_здесь

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Server
PORT=5000
```

## Шаг 6: Установка драйвера для Node.js

```powershell
cd server
npm install pg pg-hstore sequelize
```

## Альтернатива: Docker (опционально)

Если хотите использовать Docker:

```yaml
# docker-compose.yml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: wink_performance_review
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/schema.sql:/docker-entrypoint-initdb.d/schema.sql

volumes:
  postgres_data:
```

Запуск:
```powershell
docker-compose up -d
```

## Проблемы и решения

### Ошибка: "psql is not recognized"

Добавьте PostgreSQL в PATH:
```powershell
$env:Path += ";C:\Program Files\PostgreSQL\15\bin"
```

### Ошибка: "password authentication failed"

1. Откройте файл `pg_hba.conf`
2. Найдите строку с `host all all 127.0.0.1/32`
3. Измените метод с `md5` на `trust` (только для разработки!)
4. Перезапустите PostgreSQL

### Ошибка: "port 5432 is already in use"

Другое приложение использует порт 5432. Остановите его или измените порт PostgreSQL.

## Полезные команды PostgreSQL

```sql
-- Список баз данных
\l

-- Подключение к БД
\c wink_performance_review

-- Список таблиц
\dt

-- Описание таблицы
\d users

-- Список пользователей
\du

-- Выход
\q
```

## Бэкап и восстановление

### Создать бэкап

```powershell
pg_dump -U postgres -d wink_performance_review > backup.sql
```

### Восстановить из бэкапа

```powershell
psql -U postgres -d wink_performance_review < backup.sql
```

## Следующие шаги

1. ✅ PostgreSQL установлен
2. ✅ База данных создана
3. ✅ Схема применена
4. ⏭️ Подключите Node.js к БД (см. `server/db.js`)
5. ⏭️ Замените моковые данные реальными запросами к БД
