# 🎯 БЫСТРЫЙ ДЕПЛОЙ - Пошаговая инструкция

## ✅ ШАГ 1: Frontend на Netlify (2 минуты)

### Способ "Drag & Drop" (самый простой):

1. **Откройте Netlify Drop**: https://app.netlify.com/drop

2. **Перетащите папку**:
   - Путь к папке: `C:\Users\Елена\Documents\Хакатоны\Расти в IT\client\build`
   - Просто перетащите папку `build` в окно браузера

3. **Получите ссылку**: 
   - Netlify автоматически задеплоит и даст URL типа:
   - `https://random-name-12345.netlify.app`
   - **Сохраните эту ссылку!**

---

## ✅ ШАГ 2: Backend на Render.com (10 минут)

### 2.1. Регистрация на Render

1. Откройте: https://render.com
2. Sign Up → через GitHub (быстрее)
3. Authorize Render

### 2.2. Создание PostgreSQL базы

1. В Dashboard → **New +** → **PostgreSQL**

2. Заполните:
   - **Name**: `wink-performance-db`
   - **Database**: `wink_performance_review`
   - **User**: `wink_user`
   - **Region**: **Frankfurt (EU)** ← выберите ближайший регион
   - **Instance Type**: **Free**

3. **Create Database**

4. Дождитесь статуса "Available" (~2 минуты)

5. **ВАЖНО**: Скопируйте **External Database URL**
   - Формат: `postgres://wink_user:пароль@dpg-xxx.frankfurt-postgres.render.com/wink_performance_review`
   - Сохраните в блокнот!

### 2.3. Создание API сервиса

1. Dashboard → **New +** → **Web Service**

2. **Connect repository**:
   - Если ещё не запушили на GitHub:
     ```bash
     cd "C:\Users\Елена\Documents\Хакатоны\Расти в IT"
     git add .
     git commit -m "Ready for deploy"
     git push origin master
     ```
   - В Render: выберите репозиторий `wink-performance-review`

3. **Настройки сервиса**:
   ```
   Name: wink-performance-api
   Region: Frankfurt (тот же, что и база)
   Branch: master
   Root Directory: server
   Runtime: Node
   Build Command: npm install
   Start Command: node server-new.js
   Instance Type: Free
   ```

4. **Environment Variables** (Add Environment Variable):
   
   Добавьте 3 переменные:

   **Переменная 1:**
   ```
   Key: NODE_ENV
   Value: production
   ```

   **Переменная 2:**
   ```
   Key: DATABASE_URL
   Value: [вставьте External Database URL из шага 2.2]
   ```

   **Переменная 3:**
   ```
   Key: JWT_SECRET
   Value: [любая длинная строка, например: my-super-secret-jwt-key-2025-wink-pr]
   ```

5. **Create Web Service**

6. Дождитесь деплоя (~5-7 минут)
   - Статус должен стать "Live"
   - **Скопируйте URL**: `https://wink-performance-api.onrender.com`

### 2.4. Инициализация базы данных

**Важно**: После первого деплоя база пустая, нужно создать таблицы!

1. В Render → ваш сервис `wink-performance-api` → вкладка **Shell**

2. Нажмите **Launch Shell**

3. Выполните команды:
   ```bash
   # Создать таблицы
   psql $DATABASE_URL -f ../database/schema.sql
   
   # Или через Node.js скрипт (если он есть)
   node seed-simple.js
   ```

Если Shell не работает, можно подключиться локально:
```bash
# Установите psql (если нет)
# Подключитесь к базе
psql "postgres://wink_user:пароль@dpg-xxx.frankfurt-postgres.render.com/wink_performance_review"

# Скопируйте содержимое database/schema.sql и выполните
```

---

## ✅ ШАГ 3: Связать Frontend и Backend (5 минут)

Теперь нужно, чтобы frontend знал адрес backend API.

### 3.1. Обновите API URL

Откройте файл: `client/src/api.js`

Найдите строку:
```javascript
const API_URL = 'http://localhost:5000';
```

Замените на:
```javascript
const API_URL = process.env.REACT_APP_API_URL || 'https://wink-performance-api.onrender.com';
```
*(Замените URL на ваш реальный от Render)*

### 3.2. Пересоберите frontend

```bash
cd client
npm run build
```

### 3.3. Обновите на Netlify

**Если использовали Drag & Drop:**
- Снова перетащите папку `client/build` на https://app.netlify.com/drop
- Netlify создаст НОВУЮ ссылку (или можно обновить старую, войдя в аккаунт)

**Если использовали GitHub:**
- Запушьте изменения:
  ```bash
  git add .
  git commit -m "Update API URL"
  git push
  ```
- Netlify пересоберёт автоматически (~2 минуты)

---

## 🎉 ШАГ 4: Готово! Тестируем

### Откройте ваше приложение:
```
https://your-app.netlify.app
```

### Тестовые пользователи:

**HR-менеджер:**
- Email: `hr@wink.ru`
- Password: `123456`

**Менеджер команды:**
- Email: `manager1@wink.ru`
- Password: `123456`

**Сотрудник:**
- Email: `emp1@wink.ru`
- Password: `123456`

### Что проверить:

1. ✅ Логин работает
2. ✅ Создание целей
3. ✅ Запрос Peer Feedback
4. ✅ Оценка менеджера
5. ✅ Оценка потенциала (Functional 2 с негативными индикаторами)
6. ✅ Дашборды для разных ролей

---

## ⚠️ Важные замечания

### Render Free Tier особенности:

1. **Спящий режим**: 
   - Сервис засыпает после 15 минут неактивности
   - Первый запрос после "сна" занимает 30-60 секунд
   - **Решение**: Для демо это нормально, предупредите жюри

2. **PostgreSQL Free**:
   - База существует 90 дней, потом нужно пересоздать
   - 1 GB хранилища
   - Достаточно для демо и хакатона

3. **CORS**: Уже настроен в backend, должно работать

### Если что-то не работает:

1. **Проверьте логи** в Render:
   - Dashboard → wink-performance-api → Logs (вкладка)
   - Ищите ошибки подключения к БД

2. **Проверьте переменные окружения**:
   - Environment → убедитесь, что DATABASE_URL правильный

3. **Проверьте, что таблицы созданы**:
   ```bash
   # В Shell Render:
   psql $DATABASE_URL -c "\dt"
   # Должны быть: users, goals, evaluation_cycles, и т.д.
   ```

---

## 📋 Чеклист финального деплоя

- [ ] Frontend собран (`npm run build` в `client/`)
- [ ] Frontend на Netlify (перетащили `build/`)
- [ ] PostgreSQL создана на Render
- [ ] Web Service создан на Render
- [ ] 3 переменные окружения добавлены (NODE_ENV, DATABASE_URL, JWT_SECRET)
- [ ] Таблицы созданы в БД (через Shell или psql)
- [ ] Тестовые данные загружены (`seed-simple.js`)
- [ ] API_URL обновлен в `client/src/api.js`
- [ ] Frontend пересобран и обновлён на Netlify
- [ ] Протестирован логин
- [ ] Все функции работают

---

## 🚀 Ссылки для презентации

После завершения деплоя, заполните:

```
📱 DEMO: https://your-app.netlify.app
🔧 API: https://wink-performance-api.onrender.com
📚 GitHub: https://github.com/Helenatroya729/wink-performance-review

🔑 Тестовые аккаунты:
- HR: hr@wink.ru / 123456
- Менеджер: manager1@wink.ru / 123456
- Сотрудник: emp1@wink.ru / 123456
```

**Готово к демонстрации жюри! 🎯**
