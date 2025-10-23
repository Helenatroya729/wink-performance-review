# 🚀 БЫСТРЫЙ ДЕПЛОЙ НА VERCEL

## ✅ Что уже сделано:

1. ✅ Создана ветка `vercel-deploy`
2. ✅ Подготовлена структура проекта
3. ✅ Настроен `vercel.json`
4. ✅ Backend в папке `api/`
5. ✅ Frontend в папке `client/`

---

## 📋 ДЕПЛОЙ ЗА 3 ШАГА:

### Шаг 1: Зарегистрируйтесь на Vercel (1 минута)

1. Откройте: https://vercel.com
2. Нажмите **Sign Up**
3. Выберите **Continue with GitHub**
4. Authorize Vercel

### Шаг 2: Импортируйте проект (2 минуты)

1. В Dashboard → **Add New** → **Project**

2. Найдите репозиторий: `wink-performance-review`

3. **ВАЖНО!** Выберите ветку: `vercel-deploy` (не master!)

4. **Configure Project**:
   ```
   Framework Preset: Create React App
   Root Directory: ./
   Build Command: cd client && npm install && npm run build
   Output Directory: client/build
   Install Command: npm install
   ```

5. **Environment Variables** - добавьте переменные:

   Нажмите **Add** для каждой:

   **Переменная 1:**
   ```
   Name: DATABASE_URL
   Value: postgres://username:password@host:5432/database
   ```
   ⚠️ Пока оставьте пустым! Vercel создаст БД автоматически

   **Переменная 2:**
   ```
   Name: JWT_SECRET
   Value: wink-secret-key-2025-production
   ```

6. Нажмите **Deploy**

7. Подождите 2-3 минуты ☕

### Шаг 3: Настройте базу данных (5 минут)

После деплоя нужно создать PostgreSQL базу:

1. В проекте → вкладка **Storage**

2. **Create Database** → выберите **Postgres**

3. Настройки:
   ```
   Name: wink-performance-db
   Region: Frankfurt (ближайший к вам)
   Plan: Hobby (Free)
   ```

4. **Create**

5. **Автоматически** Vercel добавит переменную `POSTGRES_URL` в Environment Variables

6. Перейдите в **Settings** → **Environment Variables**

7. Найдите `POSTGRES_URL`, скопируйте значение

8. Добавьте новую переменную:
   ```
   Name: DATABASE_URL
   Value: [вставьте значение POSTGRES_URL]
   ```

9. **Save**

10. Вернитесь на вкладку **Deployments** → кликните на последний деплой → **Redeploy**

---

## 🎉 ГОТОВО!

Ваше приложение доступно по адресу:
```
https://wink-performance-review-vercel-deploy.vercel.app
```

### Тестовые аккаунты:

**HR:**
- Email: `hr@wink.ru`
- Password: `123456`

**Менеджер:**
- Email: `manager1@wink.ru`
- Password: `123456`

**Сотрудник:**
- Email: `emp1@wink.ru`
- Password: `123456`

---

## ⚠️ Важно: Инициализация базы данных

После первого деплоя база будет пустая. Нужно создать таблицы:

### Вариант A: Через Vercel CLI (если установлен)

```bash
vercel env pull
vercel dev
# В другом терминале:
node api/seed-simple.js
```

### Вариант B: Через SQL клиент

1. В Vercel → Storage → ваша БД → **Connection String**

2. Скопируйте строку подключения

3. Используйте pgAdmin или psql:
   ```bash
   psql "postgres://..." -f database/schema.sql
   ```

4. Запустите seed скрипт для тестовых данных

---

## 🔧 Если что-то не работает:

### Проблема: "Cannot connect to database"
**Решение**: 
- Проверьте переменную `DATABASE_URL` в Environment Variables
- Убедитесь, что она совпадает с `POSTGRES_URL`
- Redeploy проекта

### Проблема: "401 Unauthorized" при логине
**Решение**:
- База данных пустая, нужно создать таблицы и пользователей
- Выполните seed скрипт

### Проблема: API не отвечает
**Решение**:
- Откройте Logs в Vercel → Functions
- Проверьте ошибки в логах
- Убедитесь, что `/api/health` возвращает 200 OK

---

## 📱 Готово к демонстрации!

Поделитесь ссылкой с жюри:
```
🌐 Demo: https://your-project.vercel.app
📚 GitHub: https://github.com/Helenatroya729/wink-performance-review
🌿 Branch: vercel-deploy
```

**Функционал для демо:**
- ✅ Управление целями и задачами
- ✅ Peer Feedback (обратная связь от коллег)
- ✅ Manager Evaluation (оценка менеджера)
- ✅ Оценка потенциала (Functional 2 с негативными индикаторами)
- ✅ Self Assessment (самооценка)
- ✅ Дашборды для HR, менеджеров и сотрудников
- ✅ Матрица 9-box для оценки результативности и потенциала

🎯 **Время деплоя: ~10 минут**
