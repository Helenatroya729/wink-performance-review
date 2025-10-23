# 🚀 СУПЕР-ПРОСТОЙ ДЕПЛОЙ на Vercel (5 минут!)

## ⚡ Vercel задеплоит всё автоматически: Frontend + Backend в одной команде!

> **Почему Vercel?**
> - ✅ Один клик → всё задеплоено
> - ✅ Бесплатно для демо
> - ✅ Автоматический HTTPS
> - ✅ При каждом `git push` обновляется автоматически

---

## ✅ ШАГ 1: Подготовка (1 минута)

Убедитесь, что код на GitHub:

```bash
cd "C:\Users\Елена\Documents\Хакатоны\Расти в IT"
git add .
git commit -m "Ready for Vercel deploy"
git push origin master
```

---

## ✅ ШАГ 2: Деплой на Vercel (3 минуты)

### 2.1. Зайдите на Vercel

1. Откройте: https://vercel.com
2. **Sign Up** → выберите **Continue with GitHub**
3. Авторизуйте Vercel

### 2.2. Импортируйте проект

1. На главной странице Vercel нажмите **Add New... → Project**

2. В списке репозиториев найдите **wink-performance-review**
   - Если не видите → нажмите **Adjust GitHub App Permissions** → выберите репозиторий

3. Нажмите **Import**

### 2.3. Настройте проект

На странице настройки проекта:

**Framework Preset**: Other (оставьте как есть)

**Root Directory**: `.` (корень проекта)

**Build Command**:
```bash
cd client && npm install && npm run build
```

**Output Directory**: 
```
client/build
```

**Install Command**:
```bash
npm install && cd server && npm install && cd ../client && npm install
```

### 2.4. Environment Variables

Нажмите **Environment Variables** и добавьте:

```
DATABASE_URL = postgres://user:pass@host:5432/dbname
JWT_SECRET = your-super-secret-key-change-this
NODE_ENV = production
```

> **Для DATABASE_URL**: Vercel автоматически предложит создать PostgreSQL через **Vercel Postgres** (бесплатно!)
> Или можете использовать **Supabase** (даже проще):

#### Быстрая база на Supabase (альтернатива):

1. Откройте: https://supabase.com
2. Start your project → Sign up with GitHub
3. New project:
   - Name: `wink-performance`
   - Database Password: (придумайте)
   - Region: Frankfurt
4. После создания → Settings → Database → Connection string → URI
5. Скопируйте строку подключения и вставьте в `DATABASE_URL`

### 2.5. Deploy!

1. Нажмите **Deploy**

2. Дождитесь окончания (~3-5 минут)

3. Получите ссылку:
   ```
   https://wink-performance-review.vercel.app
   ```

---

## ✅ ШАГ 3: Инициализация базы данных (1 минута)

После первого деплоя нужно создать таблицы:

### Вариант A: Через Supabase (если используете)

1. В Supabase → ваш проект → SQL Editor
2. Откройте файл `database/schema.sql` на компьютере
3. Скопируйте весь SQL
4. Вставьте в SQL Editor
5. Run

### Вариант B: Через Vercel Postgres

1. Vercel → ваш проект → Storage → Connect Store → Postgres
2. После подключения → Browse → Query
3. Вставьте содержимое `database/schema.sql`
4. Execute

### Вариант C: Локально через psql

```bash
# Используйте строку подключения из Vercel/Supabase
psql "postgres://user:pass@host:5432/dbname" -f database/schema.sql

# Загрузите тестовые данные (опционально)
cd server
node seed-simple.js
```

---

## 🎉 ГОТОВО!

Ваше приложение доступно по ссылке:
```
https://wink-performance-review.vercel.app
```

### Тестовые пользователи:

После загрузки тестовых данных (`seed-simple.js`):

- **HR**: hr@wink.ru / 123456
- **Менеджер**: manager1@wink.ru / 123456
- **Сотрудник**: emp1@wink.ru / 123456

---

## 🔄 Автоматические обновления

Теперь при каждом `git push` в master, Vercel автоматически:
1. Пересоберет frontend
2. Обновит backend
3. Задеплоит изменения

**Это занимает ~2-3 минуты!**

---

## ⚡ Преимущества Vercel

✅ Один клик деплой  
✅ Frontend + Backend вместе  
✅ Автоматический SSL (HTTPS)  
✅ CDN по всему миру  
✅ Бесплатный план (достаточно для демо)  
✅ Preview-ссылки для каждого PR  
✅ Логи и мониторинг встроены  

---

## 🐛 Если что-то не работает

1. **Проверьте логи**: Vercel → ваш проект → Deployments → последний деплой → View Function Logs

2. **Проверьте переменные окружения**: Settings → Environment Variables

3. **Проверьте, что таблицы созданы в БД**

4. **Частая ошибка**: Забыли инициализировать БД (шаг 3)

---

## 📱 Для презентации жюри

После деплоя у вас будет:

```
🌐 Живое демо: https://wink-performance-review.vercel.app
📚 Код: https://github.com/Helenatroya729/wink-performance-review
📊 Admin Panel: (логин как HR)

🎯 Основной функционал:
✅ Постановка целей и оценка результатов
✅ Peer Feedback между сотрудниками
✅ Оценка менеджером (Manager Evaluation)
✅ Оценка потенциала (Functional 2 из Excel)
✅ Матрица 9-box с негативными индикаторами
✅ Дашборды для HR, менеджеров, сотрудников
```

**Готово за 5 минут! 🚀**
