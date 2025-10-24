# 🚀 Деплой WINK Performance Review

## Демо-ссылки

- **Frontend (Netlify)**: [Скоро будет]
- **Backend API (Render)**: [Скоро будет]

---

## 📦 Шаг 1: Деплой Frontend на Netlify

### Вариант A: Netlify Drop (Самый простой)

1. ✅ Build уже создан в папке `client/build`
2. Откройте https://app.netlify.com/drop
3. Перетащите папку `client/build` в окно браузера
4. Netlify даст вам ссылку вида `https://YOUR-APP.netlify.app`

### Вариант B: Netlify через GitHub

1. Запушьте код на GitHub:
```bash
git add .
git commit -m "Готов к деплою"
git push origin master
```

2. Зайдите на https://app.netlify.com
3. New site from Git → выберите ваш репозиторий
4. Настройки сборки:
   - **Base directory**: `client`
   - **Build command**: `npm run build`
   - **Publish directory**: `client/build`
5. Deploy site

---

## 🔧 Шаг 2: Деплой Backend на Render.com

### Способ 1: Через Blueprint (render.yaml)

1. Зайдите на https://render.com
2. Создайте аккаунт (можно через GitHub)
3. New → Blueprint
4. Подключите ваш GitHub репозиторий
5. Render автоматически прочитает `render.yaml` и создаст:
   - PostgreSQL базу данных (бесплатно)
   - Node.js API сервис (бесплатно)
6. Дождитесь завершения деплоя (~5-10 минут)

### Способ 2: Ручная настройка

**2.1. Создание базы данных:**
1. Dashboard → New → PostgreSQL
2. Name: `wink-performance-db`
3. Database: `wink_performance_review`
4. User: `wink_user`
5. Region: Frankfurt (EU)
6. Instance Type: Free
7. Create Database
8. Скопируйте **External Database URL**

**2.2. Создание API сервиса:**
1. Dashboard → New → Web Service
2. Connect repository (ваш GitHub)
3. Настройки:
   - **Name**: `wink-performance-api`
   - **Region**: Frankfurt
   - **Branch**: master
   - **Root Directory**: `server`
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node server-new.js`
   - **Instance Type**: Free

4. Environment Variables (Add):
   ```
   NODE_ENV=production
   PORT=5000
   DATABASE_URL=<вставьте External Database URL>
   JWT_SECRET=<сгенерируйте любой длинный секретный ключ>
   ```

5. Create Web Service

**2.3. Настройка базы данных:**

После деплоя нужно создать таблицы. Откройте Shell в Render для вашего сервиса:

```bash
# Подключитесь к базе и выполните SQL из database/schema.sql
node -e "require('./database').createTables()"
node seed-simple.js  # Заполнить тестовыми данными
```

---

## 🔗 Шаг 3: Связать Frontend и Backend

После деплоя backend на Render, вы получите URL вида:
```
https://wink-performance-api.onrender.com
```

Нужно обновить `client/src/api.js`:

```javascript
// Было:
const API_URL = 'http://localhost:5000';

// Стало:
const API_URL = process.env.REACT_APP_API_URL || 'https://wink-performance-api.onrender.com';
```

Пересоберите frontend:
```bash
cd client
npm run build
```

И снова перетащите `client/build` на Netlify Drop (или Netlify пересоберёт автоматически).

---

## 🧪 Шаг 4: Проверка

### Тестовые пользователи:

**HR:**
- Email: `hr@wink.ru`
- Password: `123456`

**Менеджер:**
- Email: `manager1@wink.ru`
- Password: `123456`

**Сотрудник:**
- Email: `emp1@wink.ru`
- Password: `123456`

### Функционал для демонстрации:

1. ✅ **Цели и оценка**: Создание целей, постановка задач, оценка результатов
2. ✅ **Peer Feedback**: Запрос обратной связи от коллег
3. ✅ **Manager Evaluation**: Оценка сотрудников менеджером
4. ✅ **Оценка потенциала**: Матрица 9-box с негативными индикаторами
5. ✅ **Self Assessment**: Самооценка сотрудников
6. ✅ **Дашборды**: Разные интерфейсы для HR, менеджеров и сотрудников

---

## ⚠️ Важные замечания

1. **Render Free Tier засыпает** после 15 минут неактивности. Первый запрос после "сна" занимает ~30-60 секунд.

2. **PostgreSQL Free** на Render:
   - Ограничение: 90 дней жизни (потом нужно пересоздать)
   - 1 GB storage
   - Автоматические бэкапы отсутствуют

3. **CORS**: Backend уже настроен на работу с любым origin (`cors` middleware).

4. **Environment Variables**: Не забудьте добавить все переменные окружения в Render!

---

## 🎯 Быстрый старт (TL;DR)

```bash
# 1. Frontend на Netlify
cd client && npm run build
# → Перетащите client/build на https://app.netlify.com/drop

# 2. Backend на Render
# → Создайте PostgreSQL базу
# → Создайте Web Service, укажите DATABASE_URL
# → Дождитесь деплоя

# 3. Обновите API_URL в client/src/api.js
# 4. Пересоберите и задеплойте frontend

# 🎉 Готово!
```

---

## 📞 Поддержка

Если что-то не работает:
1. Проверьте логи в Render: Dashboard → Your Service → Logs
2. Проверьте переменные окружения
3. Убедитесь, что база данных создана и содержит таблицы
