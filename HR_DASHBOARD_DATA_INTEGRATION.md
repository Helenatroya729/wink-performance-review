# Интеграция реальных данных для HR Dashboard

## Обзор
HR Dashboard теперь подключен к реальной базе данных PostgreSQL и отображает актуальные данные из системы Performance Review.

## Реализованные API endpoints

### 1. `/api/hr/analytics` - Общая аналитика
**Метод:** GET  
**Роли:** hr, admin  
**Возвращает:**
```json
{
  "coverage": {
    "value": "87%",
    "trend": "+5%"
  },
  "avgRating": {
    "value": "7.8",
    "trend": "+0.3"
  },
  "completedEvaluations": {
    "value": "145/167",
    "trend": "87%"
  },
  "developmentPlans": {
    "value": 132,
    "trend": "+12"
  }
}
```

**Данные:**
- **Общий охват оценки** - процент сотрудников, завершивших самооценку
- **Средний рейтинг** - среднее значение overall_rating из self_assessments
- **Завершенные оценки** - количество завершенных оценок / общее количество сотрудников
- **Планы развития** - количество целей со статусом 'in_progress' или 'approved'

### 2. `/api/hr/employee-scores` - Баллы сотрудников
**Метод:** GET  
**Роли:** hr, admin  
**Возвращает:**
```json
[
  {
    "id": 1,
    "name": "Иван Иванов",
    "selfScore": 8,
    "managerScore": 7,
    "peerScore": 8.0,
    "total": 7.67
  }
]
```

**Данные:**
- `selfScore` - оценка из таблицы self_assessments
- `managerScore` - оценка из таблицы manager_evaluations
- `peerScore` - средняя оценка из таблицы peer_feedback
- `total` - среднее арифметическое всех трёх оценок

**Лимит:** 50 сотрудников

### 3. `/api/hr/nine-box` - Данные для матрицы 9-Box
**Метод:** GET  
**Роли:** hr, admin  
**Возвращает:**
```json
{
  "high_high": 12,
  "high_medium": 18,
  "high_low": 8,
  "medium_high": 15,
  "medium_medium": 32,
  "medium_low": 24,
  "low_high": 8,
  "low_medium": 18,
  "low_low": 12
}
```

**Логика распределения:**
- **Потенциал** (из potential_assessments.potential_score):
  - high: >= 8
  - medium: >= 5 и < 8
  - low: < 5
  
- **Производительность** (из manager_evaluations.overall_rating):
  - high: >= 8
  - medium: >= 5 и < 8
  - low: < 5

## Изменения в клиенте

### HRDashboard.js

#### Добавленные состояния:
```javascript
const [loading, setLoading] = useState(true);
const [analytics, setAnalytics] = useState([]);
const [employeeScores, setEmployeeScores] = useState([]);
const [nineBoxData, setNineBoxData] = useState({});
```

#### Функция загрузки данных:
```javascript
const loadHRData = async () => {
  // Загружает данные с трёх endpoints:
  // 1. /hr/analytics
  // 2. /hr/employee-scores
  // 3. /hr/nine-box
};
```

#### Индикатор загрузки:
При `loading === true` показывается экран "Загрузка данных..."

## Таблицы базы данных

### Используемые таблицы:
1. **users** - список сотрудников
2. **self_assessments** - самооценки сотрудников
3. **manager_evaluations** - оценки руководителей
4. **peer_feedback** - оценки коллег
5. **potential_assessments** - оценки потенциала
6. **employee_goals** - цели сотрудников

## Вкладки Dashboard

### 1. Обзор (Overview)
- **Аналитические карточки** - реальные данные из `/api/hr/analytics`
- **Матрица 9-Box** - реальные данные из `/api/hr/nine-box`
- **Рекомендации по Salary Increase** - пока статичные данные
- **Быстрые действия** - UI элементы
- **Прогресс цикла PR** - статичная визуализация
- **Тренды развития** - статичные данные

### 2. Калькуляция (Calculation)
- **Таблица баллов сотрудников** - реальные данные из `/api/hr/employee-scores`
- **Подсчет баллов** - редактируемое текстовое поле (инструкция)
- **Подведение итогов** - редактируемое текстовое поле (выводы)

### 3. Рекомендации (Recommendations)
- **Добавление триггеров** - форма для создания триггерных слов
- **Список активных триггеров** - управление триггерами (добавление/удаление)
- Данные хранятся в состоянии компонента (пока не сохраняются в БД)

## Запуск приложения

### Backend:
```bash
cd server
node server-new.js
```
Сервер запускается на `http://localhost:5000`

### Frontend:
```bash
cd client
npm start
```
Приложение запускается на `http://localhost:3000` или `http://localhost:3001`

## Авторизация для HR

**Email:** hr@wink.ru  
**Пароль:** 123456

## Следующие шаги (опционально)

### Возможные улучшения:
1. **Сохранение настроек калькуляции** - добавить таблицу для хранения `calculationInstructions` и `summaryText`
2. **Система триггеров в БД** - создать таблицу `recommendation_triggers` для постоянного хранения
3. **Рекомендации по Salary** - подключить к реальным данным из оценок
4. **Экспорт данных** - реализовать функционал экспорта в Excel/PDF
5. **Фильтры и поиск** - добавить фильтрацию сотрудников в таблице калькуляции
6. **Графики и визуализации** - добавить Charts.js для визуализации трендов
7. **Уведомления** - система уведомлений для HR о незавершенных оценках

## Структура проекта

```
server/
  server-new.js           # Основной файл сервера с новыми HR endpoints
  database.js             # Подключение к PostgreSQL

client/src/
  pages/
    HRDashboard.js        # HR Dashboard с интеграцией данных
  api.js                  # Axios конфигурация для API запросов
```

## Безопасность

- Все HR endpoints защищены middleware `authenticateToken`
- Проверка роли пользователя (`hr` или `admin`)
- При попытке доступа без прав возвращается 403 Forbidden

## Производительность

- Запросы оптимизированы с использованием JOINs
- Лимит на выборку сотрудников (50 чел.) для таблицы баллов
- Использование `COALESCE` для обработки NULL значений
- Кэширование на стороне клиента через useState

---

**Дата создания:** 24 октября 2025  
**Статус:** ✅ Готово к использованию
