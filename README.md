# Performance Review System# WINK Performance Review System



Enterprise performance evaluation system for WINK company.Система оценки персонала для компании WINK



## Quick Start## Технологии



1. Install PostgreSQL 17- **Frontend**: React 18

2. Restore database from backup:- **Backend**: Node.js + Express

   ```powershell- **Авторизация**: JWT

   .\RESTORE_DATABASE.ps1- **Стиль**: Фирменный стиль WINK (черный + оранжевый)

   ```

3. Start servers:## Установка

   ```powershell

   .\START_FULL.ps11. Установите зависимости для всего проекта:

   ``````bash

4. Open http://localhost:3000npm run install-all

```

## Full Documentation

2. Или установите отдельно:

See [DEPLOYMENT.md](DEPLOYMENT.md) for complete installation and configuration guide.```bash

# Корневая папка

## Default Usersnpm install



All users have password: **123456**# Frontend

cd client

- Admin: admin@wink.runpm install

- HR: hr@wink.ru

- Manager: manager@wink.ru# Backend

- Employee: employee@wink.rucd ../server

npm install

## Tech Stack```



- Frontend: React## Запуск проекта

- Backend: Node.js + Express

- Database: PostgreSQL 17### Запуск всего проекта (Frontend + Backend):

- Auth: JWT```bash

npm run dev

## Features```



- Employee self-assessment### Или запускайте отдельно:

- Peer feedback

- Manager evaluations**Frontend** (порт 3000):

- Potential assessment```bash

- HR analytics dashboardcd client

- 9-box matrix visualizationnpm start

```

## License

**Backend** (порт 5000):

MIT```bash

cd server
npm run dev
```

## Тестовые пользователи

| Роль | Логин | Пароль |
|------|-------|--------|
| Сотрудник | `employee` | `employee123` |
| Руководитель | `manager` | `manager123` |
| HR | `hr` | `hr123` |
| Администратор | `admin` | `admin123` |

## Функционал по ролям

### Сотрудник
- Создание и управление целями (1-5 целей)
- Самооценка
- Запрос оценок от коллег (до 5 респондентов)
- Просмотр результатов и рекомендаций
- Работа с планом развития (ИПР)

### Руководитель
- Утверждение целей подчиненных
- Проведение оценки 360°
- Оценка потенциала (9-box)
- Написание обратной связи
- Участие в калибровочных сессиях
- Проставление финального рейтинга

### HR
- Анализ матрицы 9-box по компании
- Составление отчетов
- Управление процессом Performance Review
- Рекомендации по Salary Increase
- Экспорт данных
- Управление калибровками

### Администратор
- Управление пользователями и ролями
- Настройка интеграций (API)
- Аудит действий пользователей
- Системные настройки
- Экспорт данных в различных форматах

## Фирменный стиль

- **Основной цвет**: #000000 (черный)
- **Акцентный цвет**: #FF6B00 (оранжевый WINK)
- **Дополнительный**: #FF8533 (светло-оранжевый)

## Структура проекта

```
Расти в IT/
├── client/                 # Frontend React приложение
│   ├── public/
│   └── src/
│       ├── components/    # Переиспользуемые компоненты
│       ├── pages/        # Страницы по ролям
│       ├── App.js
│       └── index.js
├── server/               # Backend Node.js API
│   ├── server.js
│   └── .env
└── package.json         # Корневой package.json
```

## API Endpoints

- `POST /api/auth/login` - Авторизация
- `GET /api/auth/me` - Получение текущего пользователя
- `GET /api/users` - Список пользователей (admin)
- `GET /api/audit` - Аудит действий (admin)
- `GET /api/health` - Проверка работы API

## MVP Функционал

### Этап 1: Постановка целей
- ✅ Страница входа с разграничением по ролям
- ✅ Dashboard для каждой роли
- ⏳ Форма создания целей/задач
- ⏳ Самооценка и выбор респондентов

### Этап 2: Оценка и аналитика
- ⏳ Модуль оценки 360°
- ⏳ Оценка потенциала (9-box)
- ⏳ Подсчет рейтинга по формулам
- ⏳ Рекомендации по развитию

## TODO

- [ ] Добавить формы создания целей
- [ ] Реализовать модуль оценки 360°
- [ ] Интеграция с Excel для импорта вопросов
- [ ] Система подсчета рейтингов
- [ ] Генерация рекомендаций на основе триггерных слов
- [ ] Экспорт данных в различных форматах
- [ ] Интеграция с корпоративным порталом через API

## Хакатон "Расти в IT"

Проект разработан для хакатона компании WINK
