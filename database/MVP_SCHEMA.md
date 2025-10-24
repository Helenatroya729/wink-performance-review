# MVP Schema - Минимальная функциональная версия

## Ключевые вопросы от команды

### Вопрос 1: Связь между целями и задачами
**Вопрос Кирилла:** "Таблица целей и таблица задач в каком то отношении потенциально могут состоять? Напрямую."

**Ответ:** ДА, есть прямая связь:

```
employee_goals (цели сотрудника)
    ↓ один-ко-многим (1:N)
goal_tasks (подзадачи к цели - 3 штуки на цель)
```

**Пример:**
- Цель: "Увеличить конверсию на 15%"
  - Задача 1: "Провести A/B тестирование" (дедлайн: 01.02.2025)
  - Задача 2: "Оптимизировать воронку" (дедлайн: 15.02.2025)
  - Задача 3: "Внедрить новый функционал" (дедлайн: 28.02.2025)

### Вопрос 2: Роли и структура таблиц
**Вопрос Кирилла:** "Роль здесь - одна из 4-х? Для остальных ролей кроме юзера структура таблиц иная?"

**Ответ:** 
- Роли: `employee`, `manager`, `hr`, `admin` - все в одной таблице `users`
- **Структура таблиц одинаковая для всех ролей**
- Отличие только в **правах доступа** (не в структуре БД):
  - `employee` - может видеть/редактировать только свои данные
  - `manager` - может видеть/редактировать данные своих подчиненных
  - `hr` - может видеть все данные, создавать циклы оценки
  - `admin` - полный доступ ко всему

### Вопрос 3: Оптимум функциональности
**Вопрос Кирилла:** "Реализовывать только автоматизацию заполнения таблиц ровно на том минимуме, что в предложенном Эксель файле - маловато будет."

**Предложение:** Разделить на 3 уровня:

## Уровни реализации

### УРОВЕНЬ 1: MVP (Minimum Viable Product) - для хакатона
**Цель:** Показать работающий прототип за 2 дня

**Ключевые таблицы (8 основных):**

```sql
-- 1. ПОЛЬЗОВАТЕЛИ
users (id, email, password_hash, first_name, last_name, role, manager_id, department, position)

-- 2. ЦИКЛЫ ОЦЕНКИ
review_cycles (id, name, start_date, end_date, status, created_by)

-- 3. ЦЕЛИ СОТРУДНИКОВ
employee_goals (id, employee_id, cycle_id, title, description, status)

-- 4. ПОДЗАДАЧИ К ЦЕЛЯМ
goal_tasks (id, goal_id, task_title, deadline, status)

-- 5. САМООЦЕНКА
self_assessments (id, employee_id, cycle_id, question_id, rating, answer_text)

-- 6. ОЦЕНКА КОЛЛЕГ (360)
peer_reviews (id, employee_id, reviewer_id, cycle_id, question_id, rating)

-- 7. ОЦЕНКА РУКОВОДИТЕЛЯ
manager_reviews (id, employee_id, manager_id, cycle_id, question_id, rating)

-- 8. ИТОГОВЫЕ РЕЗУЛЬТАТЫ
final_reviews (id, employee_id, cycle_id, total_score, rating, rating_category)
```

**Функционал MVP:**
- ✅ Создание цикла оценки (HR)
- ✅ Постановка целей сотрудником (3 подзадачи к цели)
- ✅ Самооценка сотрудника
- ✅ Оценка коллег (360)
- ✅ Оценка руководителя
- ✅ Автоматический расчет итогового рейтинга
- ✅ Просмотр результатов

**Упрощения в MVP:**
- ❌ Без сложного распределения задач из Этапа 0
- ❌ Без детальной оценки потенциала (9-box)
- ❌ Без системы рекомендаций
- ❌ Без калибровки
- ❌ Без конструктора форм

### УРОВЕНЬ 2: Расширенная версия (после хакатона)
**Добавляем:**
- Оценка потенциала с 9-box матрицей
- Система рекомендаций на основе триггеров
- Индивидуальные планы развития (IDP)
- Калибровочные сессии

**Дополнительные таблицы: +10**

### УРОВЕНЬ 3: Полная версия (промышленная эксплуатация)
**Добавляем:**
- Конструктор форм оценки
- Распределение задач с аннотациями
- Аудит всех действий
- Расширенная аналитика
- API для интеграций

**Дополнительные таблицы: +12**

---

## MVP Schema - Визуализация

```
┌─────────────────┐
│     users       │ (центральная таблица)
│  role: enum     │
│  manager_id FK  │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌────────┐  ┌──────────────┐
│ review │  │ employee     │
│ cycles │  │ goals        │
└────┬───┘  └──────┬───────┘
     │             │
     │         ┌───┴──────┐
     │         │ goal     │
     │         │ tasks    │
     │         └──────────┘
     │
     ├──────┐
     │      │
     ▼      ▼
┌─────────────────┐  ┌─────────────────┐
│ self_assessments│  │ peer_reviews    │
└─────────────────┘  └─────────────────┘
     │                      │
     └──────┬───────────────┘
            ▼
    ┌──────────────┐
    │ manager      │
    │ reviews      │
    └──────┬───────┘
           │
           ▼
    ┌──────────────┐
    │ final        │
    │ reviews      │
    └──────────────┘
```

## Права доступа по ролям

### MVP - Простая модель прав

```javascript
// На уровне API/Backend, не в БД
const permissions = {
  employee: {
    own_goals: ['read', 'create', 'update'],
    own_assessments: ['read', 'create', 'update'],
    own_reviews: ['read'],
    cycles: ['read']
  },
  
  manager: {
    own_goals: ['read', 'create', 'update'],
    team_goals: ['read', 'approve'],
    team_reviews: ['read', 'create', 'update'],
    team_results: ['read'],
    cycles: ['read']
  },
  
  hr: {
    all_data: ['read'],
    cycles: ['read', 'create', 'update'],
    final_reviews: ['read', 'update'],
    reports: ['read', 'export']
  },
  
  admin: {
    all_data: ['read', 'create', 'update', 'delete'],
    users: ['read', 'create', 'update', 'delete'],
    system: ['configure']
  }
};
```

**Реализация:** Проверка прав в middleware API, не через GRANT/REVOKE в PostgreSQL

## Рекомендации для хакатона

### ЧТО ДЕЛАТЬ:
1. **Фокус на 8 основных таблиц MVP**
2. **Права доступа через API** (middleware), не через PostgreSQL GRANT
3. **Простые формы** - хардкод вопросов в коде, не конструктор
4. **Автоматический расчет** - простая формула для total_score
5. **Минимум UI** - базовые формы и таблицы, без красоты

### ЧЕГО НЕ ДЕЛАТЬ (оставить на потом):
1. ❌ Сложную систему прав в PostgreSQL
2. ❌ Конструктор форм
3. ❌ 9-box матрицу с детальной оценкой
4. ❌ Систему рекомендаций
5. ❌ Калибровку
6. ❌ Аудит логирование
7. ❌ Сложную аналитику

## SQL для MVP

```sql
-- Создать только эти 8 таблиц для хакатона:

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role VARCHAR(20) CHECK (role IN ('employee', 'manager', 'hr', 'admin')),
    manager_id INTEGER REFERENCES users(id),
    department VARCHAR(100),
    position VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE review_cycles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'draft',
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE employee_goals (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES users(id),
    cycle_id INTEGER NOT NULL REFERENCES review_cycles(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(employee_id, cycle_id, title)
);

CREATE TABLE goal_tasks (
    id SERIAL PRIMARY KEY,
    goal_id INTEGER NOT NULL REFERENCES employee_goals(id) ON DELETE CASCADE,
    task_title VARCHAR(255) NOT NULL,
    deadline DATE,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE self_assessments (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES users(id),
    cycle_id INTEGER NOT NULL REFERENCES review_cycles(id),
    question_id INTEGER NOT NULL,
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    answer_text TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE peer_reviews (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES users(id),
    reviewer_id INTEGER NOT NULL REFERENCES users(id),
    cycle_id INTEGER NOT NULL REFERENCES review_cycles(id),
    question_id INTEGER NOT NULL,
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE manager_reviews (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES users(id),
    manager_id INTEGER NOT NULL REFERENCES users(id),
    cycle_id INTEGER NOT NULL REFERENCES review_cycles(id),
    question_id INTEGER NOT NULL,
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    feedback_text TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE final_reviews (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES users(id),
    cycle_id INTEGER NOT NULL REFERENCES review_cycles(id),
    self_assessment_avg DECIMAL(3,2),
    peer_review_avg DECIMAL(3,2),
    manager_review_avg DECIMAL(3,2),
    total_score DECIMAL(5,2),
    rating INTEGER CHECK (rating BETWEEN 0 AND 10),
    rating_category VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(employee_id, cycle_id)
);
```

## Простая формула расчета рейтинга

```javascript
// Алгоритм для final_reviews
function calculateFinalRating(employeeId, cycleId) {
  // 1. Среднее самооценки
  const selfAvg = AVG(self_assessments.rating WHERE employee_id = employeeId AND cycle_id = cycleId);
  
  // 2. Среднее оценок коллег
  const peerAvg = AVG(peer_reviews.rating WHERE employee_id = employeeId AND cycle_id = cycleId);
  
  // 3. Среднее оценок руководителя
  const managerAvg = AVG(manager_reviews.rating WHERE employee_id = employeeId AND cycle_id = cycleId);
  
  // 4. Взвешенная сумма (можно менять веса)
  const totalScore = (selfAvg * 0.2) + (peerAvg * 0.3) + (managerAvg * 0.5);
  
  // 5. Конвертация в рейтинг 0-10
  const rating = Math.round(totalScore * 2); // 5 -> 10
  
  // 6. Категория
  let category;
  if (rating >= 9) category = 'outstanding';
  else if (rating >= 7) category = 'good_result';
  else if (rating >= 5) category = 'low_result';
  else category = 'no_result';
  
  return { selfAvg, peerAvg, managerAvg, totalScore, rating, category };
}
```

## Вопросы для обсуждения с командой

1. **Вопросы для самооценки/360** - хардкодим в коде или делаем отдельную таблицу?
   - Вариант А: Хардкод в коде (быстрее для MVP)
   - Вариант Б: Таблица `questions` (гибче, но дольше)

2. **Статусы целей** - какие нужны?
   - Предложение: `draft`, `submitted`, `approved`, `rejected`, `in_progress`, `completed`

3. **Формат оценок** - 1-5 или 0-10?
   - Предложение: 1-5 для удобства пользователей, конвертируем в 0-10 для итога

4. **Минимальное количество респондентов для 360** - сколько?
   - Предложение: минимум 2 коллеги для peer review

---

## Итого: Что реализуем на хакатоне

### База данных:
- ✅ 8 таблиц MVP (уже созданы в полной схеме, можем переиспользовать)

### Backend API:
- ✅ POST /auth/login - авторизация
- ✅ GET /cycles - список циклов
- ✅ POST /goals - создание цели
- ✅ POST /goals/:id/tasks - добавление подзадач
- ✅ POST /assessments/self - самооценка
- ✅ POST /reviews/peer - оценка коллеги
- ✅ POST /reviews/manager - оценка руководителя
- ✅ GET /results/:employeeId - итоговые результаты
- ✅ POST /results/calculate - расчет финального рейтинга

### Frontend:
- ✅ Страница логина (4 роли)
- ✅ Дашборд Employee: мои цели, моя самооценка, мои результаты
- ✅ Дашборд Manager: цели команды, оценка команды, результаты команды
- ✅ Дашборд HR: все результаты, создание циклов, отчеты
- ✅ Дашборд Admin: управление пользователями

**Время реализации:** 2 дня (хакатон)

**Результат:** Работающий прототип с реальными данными и базовым функционалом Performance Review системы.
