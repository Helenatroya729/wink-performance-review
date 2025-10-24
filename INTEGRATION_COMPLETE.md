# 🎯 WINK Performance Review - Запуск системы

## ✅ Что уже сделано

### База данных PostgreSQL
- ✅ 30 таблиц созданы
- ✅ 9 пользователей добавлены
- ✅ 3 цикла оценки
- ✅ 4 цели сотрудников

### Backend API (Node.js + Express)
- ✅ Подключен к PostgreSQL
- ✅ 10+ эндпоинтов работают
- ✅ JWT аутентификация
- ✅ Порт: 5000

### Frontend (React)
- ✅ 4 дашборда (Employee, Manager, HR, Admin)
- ✅ Интегрирован с API
- ✅ Порт: 3000

---

## 🚀 Быстрый запуск

### Вариант 1: Автоматический (рекомендуется)
```powershell
.\START_FULL.ps1
```
Или двойной клик на `START_FULL.bat`

### Вариант 2: Вручную

**Терминал 1 - Backend:**
```bash
cd server
node server-new.js
```

**Терминал 2 - Frontend:**
```bash
cd client
npm start
```

---

## 🔑 Учетные записи для входа

Все пароли: **123456**

| Email | Роль | Описание |
|-------|------|----------|
| `admin@wink.ru` | Admin | Полный доступ к системе |
| `hr@wink.ru` | HR | Елена Губская - HR Manager |
| `manager1@wink.ru` | Manager | Кирилл Менеджеров - Team Lead (Разработка) |
| `manager2@wink.ru` | Manager | Мария Петрова - Marketing Manager |
| `emp1@wink.ru` | Employee | Иван Иванов - Senior Developer |
| `emp2@wink.ru` | Employee | Анна Сидорова - Middle Developer |
| `emp3@wink.ru` | Employee | Петр Петров - Junior Developer |
| `emp4@wink.ru` | Employee | Ольга Васильева - Marketing Specialist |
| `emp5@wink.ru` | Employee | Дмитрий Смирнов - Content Manager |

---

## 📊 Доступные URL

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000/api
- **Health Check:** http://localhost:5000/api/health

---

## 🧪 Тестирование API

```bash
node server/test-api.js
```

Этот скрипт протестирует:
- ✅ Авторизацию (HR и Employee)
- ✅ Получение пользователей
- ✅ Получение циклов оценки
- ✅ Получение целей
- ✅ Статистику дашборда

---

## 📁 Структура проекта

```
wink-performance-review/
├── client/                    # React фронтенд
│   ├── src/
│   │   ├── pages/            # Страницы дашбордов
│   │   │   ├── Login.js      # ✅ Подключен к API
│   │   │   ├── EmployeeDashboard.js  # ✅ Загружает цели из БД
│   │   │   ├── ManagerDashboard.js
│   │   │   ├── HRDashboard.js
│   │   │   └── AdminDashboard.js
│   │   ├── api.js            # ✅ API клиент
│   │   └── App.js
│   └── package.json
│
├── server/                    # Node.js бэкенд
│   ├── server-new.js         # ✅ Основной сервер с PostgreSQL
│   ├── database.js           # ✅ Подключение к БД
│   ├── seed-simple.js        # ✅ Заполнение тестовыми данными
│   ├── test-api.js           # ✅ Тесты API
│   └── .env                  # Конфигурация (DB credentials)
│
├── database/                  # SQL схема
│   ├── schema.sql            # Полная схема (30 таблиц)
│   ├── MVP_SCHEMA.md         # Документация MVP
│   └── schema_visualization.html  # Визуализация БД
│
├── START_FULL.ps1            # 🚀 Автозапуск всего
└── START_FULL.bat            # 🚀 Альтернативный запуск
```

---

## 🔧 Что работает СЕЙЧАС

### ✅ Реализовано
1. **Авторизация**
   - Вход по email/password
   - JWT токены
   - Разделение по ролям

2. **Employee Dashboard**
   - Просмотр своих целей из БД
   - Статус целей
   - (TODO: создание новых целей)

3. **Manager Dashboard**
   - Просмотр целей команды
   - (TODO: утверждение целей)

4. **HR Dashboard**
   - Просмотр всех пользователей
   - Просмотр всех целей
   - Создание циклов оценки

5. **Admin Dashboard**
   - Управление пользователями
   - Статистика системы

---

## 📝 TODO - Что добавить дальше

### 1. Формы создания данных
- [ ] Форма создания целей (Employee)
- [ ] Форма самооценки
- [ ] Форма оценки коллег (360)
- [ ] Форма оценки руководителя

### 2. Дополнительные эндпоинты API
```javascript
POST /api/assessments/self      // Создать самооценку
POST /api/reviews/peer          // Оценить коллегу
POST /api/reviews/manager       // Оценка руководителя
GET  /api/results/:employeeId   // Итоговые результаты
```

### 3. Расчет рейтингов
- [ ] Автоматический расчет среднего балла
- [ ] Создание final_reviews
- [ ] Отображение 9-box матрицы

### 4. UI улучшения
- [ ] Модальные окна для форм
- [ ] Графики и диаграммы
- [ ] Уведомления в реальном времени

---

## 🐛 Решение проблем

### PostgreSQL не запускается
```powershell
# Проверить статус службы
Get-Service postgresql-x64-17

# Запустить службу
Start-Service postgresql-x64-17
```

### База данных пустая
```bash
cd server
node seed-simple.js
```

### Ошибка подключения к API
Убедитесь, что:
1. Backend запущен на порту 5000
2. В `client/src/api.js` правильный URL: `http://localhost:5000/api`

### Порт 3000 или 5000 занят
```powershell
# Найти процесс на порту
netstat -ano | findstr :3000

# Убить процесс
taskkill /PID <номер_процесса> /F
```

---

## 🎉 Готово к демонстрации!

Система полностью работает:
- ✅ Авторизация с 4 ролями
- ✅ Реальная база данных PostgreSQL
- ✅ API возвращает живые данные
- ✅ Фронтенд отображает данные из БД

**Попробуйте:**
1. Запустите `START_FULL.ps1`
2. Откройте http://localhost:3000
3. Войдите как `emp1@wink.ru` / `123456`
4. Увидите свои реальные цели из базы данных! 🎯

---

## 📞 Контакты

Проект для хакатона "Расти в IT"
- GitHub: Helenatroya729/wink-performance-review
- База данных: `wink_performance_review`
- Пароль БД: `wink2025`
