# Структура базы данных PostgreSQL для WINK Performance Review

## Общая информация

База данных разработана на основе анализа файла `Кейс_Механика оценки_2025.xlsx` и содержит полную структуру для системы оценки эффективности сотрудников.

## Основные сущности

### 1. Пользователи и роли (users)
- Роли: employee, manager, hr, admin
- Связи: Иерархия руководитель-подчиненный через `manager_id`
- Данные: ФИО, email, отдел, должность

### 2. Циклы оценки (review_cycles)
- Периоды проведения Performance Review (например, "1-е полугодие 2025")
- Статусы: draft → active → calibration → completed

### 3. Задачи/проекты (tasks)
- Задачи компании, над которыми работают сотрудники
- Основа для оценки по конкретным результатам
- Новые поля: `legacy_number`, `owning_unit`, `status`, `notes`

### 4. Руководители задач (task_leads)
- Связь задачи с руководителями (ФИО, роль, примечания)
- Позволяет хранить несколько руководителей на одну задачу

### 5. Участники задач (task_participants)
- Связь задачи с участниками (ФИО, зона ответственности, внутренний/внешний)
- Позволяет хранить всех сотрудников, участвующих в задаче

### 6. Аннотации к задачам (task_annotations)
- Дополнительные пометки по задаче (например, из столбца Unnamed: 4)

### 7. Шаблоны форм и статические блоки (form_templates, form_sections, form_static_blocks)
- Описывают структуру интерфейса для анкет, самооценки, 360, итогов и рекомендаций
- Позволяют гибко настраивать вопросы, инструкции, блоки для ввода и отображения

## Этапы процесса Performance Review

### ЭТАП 0: Вводный опрос

**employee_tasks** - Выбор сотрудником до 3 задач
```sql
SELECT t.name 
FROM employee_tasks et
JOIN tasks t ON et.task_id = t.id
WHERE et.user_id = 1 AND et.cycle_id = 1;
```

**selected_respondents** - Выбор респондентов для оценки 360
```sql
SELECT u.first_name, u.last_name 
FROM selected_respondents sr
JOIN users u ON sr.respondent_id = u.id
WHERE sr.employee_id = 1 AND sr.task_id = 1;
```

### ФУНКЦИОНАЛ 1: Цели и задачи

**employee_goals** - До 5 целей на период
- Поля: title, description, status (draft/submitted/approved)
- Утверждаются руководителем

```sql
-- Создание цели
INSERT INTO employee_goals (user_id, cycle_id, goal_number, title, description)
VALUES (1, 1, 1, 'Запуск новой интеграции', 'Интеграция с Белтелекомом...');
```

### ФУНКЦИОНАЛ 2: Оценки

#### 2.1 Самооценка сотрудника

**self_assessment_questions** - Вопросы (настраиваются в админке)
**self_assessments** - Ответы сотрудника

Типы вопросов:
- `text` - свободный ответ
- `scale_0_10` - шкала от 0 до 10
- `multiple_choice` - множественный выбор

Пример вопросов:
1. "Опиши результат по задаче" (текст)
2. "Личный вклад и влияние на результат" (текст) 
3. "Ссылка на рабочее пространство" (текст)

Баллы: 0-7 = 1, 8-12 = 2, 13-20 = 3

#### 2.2 Оценка 360 от респондентов

**peer_review_questions** - Вопросы от коллег
**peer_reviews** - Ответы респондентов

Пример вопросов:
- "Оцени профессиональные качества" (0-10)
- "Оцени личный вклад" (0-10)

Баллы: 0-7 = 1, 8-12 = 2, 13-20 = 3

#### 2.3 Оценка от руководителя

**manager_review_questions** - Вопросы для руководителя
**manager_reviews** - Ответы и обратная связь

Руководитель видит:
- Ответы респондентов
- Самооценку сотрудника
- Формирует общую обратную связь

Баллы: 0-30 (0-10 = 1, 11-20 = 2, 21-30 = 3)

#### 2.4 Оценка потенциала (9-box матрица)

**potential_assessments** - Оценка руководителем

Компоненты:
1. **Результативность** (performance_score)
   - Из самооценки + 360 оценки
   
2. **Потенциал** (potential_score)
   - Профессиональные качества (множественный выбор):
     * Ответственность
     * Ориентация на результат
     * Проактивность
     * Открытое мышление
     * Командный игрок
   
   - Личные качества (чекбоксы):
     * Берет ответственность
     * Прозрачная коммуникация
     * Делится информацией
     * Выстраивает работу
   
   - Стремление развиваться (0-10)

**9-box позиции:**
```
High Potential   | LP/HP | MP/HP | HP/HP |
Medium Potential | LP/MP | MP/MP | HP/MP |
Low Potential    | LP/LP | MP/LP | HP/LP |
                   Low    Medium  High
                      Performance
```

Баллы потенциала: 4 = 1, 5-7 = 2, 8-11 = 3

### ФУНКЦИОНАЛ 3: Подведение итогов

**final_reviews** - Итоговые результаты

Калькуляция:
```
total_score = self_assessment_total + 
              peer_review_total + 
              manager_review_total + 
              potential_total
```

Рейтинг (0-10):
- 0-2: Нет результата
- 3-5: Низкий результат
- 6-8: Хороший результат
- 9-10: Сверхрезультат

Рекомендации по зарплате:
- `salary_increase_recommended` (boolean)
- `salary_increase_percent` (процент)

### ФУНКЦИОНАЛ 4: Рекомендации

**recommendation_triggers** - Триггерные слова для авторекомендаций

Пример:
```sql
INSERT INTO recommendation_triggers (trigger_word, recommendation_text, category)
VALUES 
('коммуникация', 'Рекомендуем пройти курс "Эффективная коммуникация"', 'soft_skills'),
('сроки', 'Рекомендуем освоить методологию Agile для лучшего планирования', 'technical');
```

**employee_recommendations** - Сгенерированные рекомендации
- Автоматические (из триггеров)
- Ручные (от HR/руководителя)

**development_plans** - ИПР (Индивидуальные планы развития)

## Калибровка

**calibration_sessions** - Калибровочные встречи
**calibration_participants** - Участники
**calibration_adjustments** - Корректировки оценок после обсуждения

Пример:
```sql
-- Изменение рейтинга после калибровки
INSERT INTO calibration_adjustments 
(session_id, employee_id, old_rating, new_rating, reason)
VALUES 
(1, 5, 7, 8, 'После обсуждения с другими руководителями повысили оценку');
```

## Аудит

**audit_log** - Все действия пользователей

Логируется:
- Создание/изменение оценок
- Утверждение целей
- Изменение статусов
- IP адреса

## Представления для отчетов

### v_employee_summary
Сводная информация по всем сотрудникам

```sql
SELECT * FROM v_employee_summary 
WHERE department = 'Разработка'
ORDER BY rating DESC;
```

### v_cycle_statistics
Статистика по циклу оценки

```sql
SELECT * FROM v_cycle_statistics 
WHERE status = 'completed';
```

## Примеры запросов

### 1. Получить все данные по сотруднику для итогового отчета

```sql
SELECT 
    u.first_name, u.last_name,
    fr.total_score, fr.rating, fr.rating_category,
    pa.box_position,
    fr.final_feedback
FROM users u
JOIN final_reviews fr ON u.id = fr.employee_id
JOIN potential_assessments pa ON u.id = pa.employee_id
WHERE u.id = 1 AND fr.cycle_id = 1;
```

### 2. Построить 9-box матрицу для HR

```sql
SELECT 
    box_position,
    COUNT(*) as employee_count,
    ARRAY_AGG(u.first_name || ' ' || u.last_name) as employees
FROM potential_assessments pa
JOIN users u ON pa.employee_id = u.id
WHERE pa.cycle_id = 1
GROUP BY box_position;
```

### 3. Найти сотрудников для повышения зарплаты

```sql
SELECT 
    u.first_name, u.last_name, u.department,
    fr.rating_category,
    fr.salary_increase_percent
FROM final_reviews fr
JOIN users u ON fr.employee_id = u.id
WHERE fr.salary_increase_recommended = true
  AND fr.cycle_id = 1
ORDER BY fr.salary_increase_percent DESC;
```

### 4. Автоматическая генерация рекомендаций по триггерным словам

```sql
-- Функция для поиска триггерных слов в обратной связи
CREATE OR REPLACE FUNCTION generate_recommendations(p_employee_id INTEGER, p_cycle_id INTEGER)
RETURNS VOID AS $$
DECLARE
    v_feedback TEXT;
    v_trigger RECORD;
BEGIN
    -- Получаем всю обратную связь
    SELECT string_agg(answer_text, ' ') INTO v_feedback
    FROM (
        SELECT answer_text FROM peer_reviews WHERE employee_id = p_employee_id AND cycle_id = p_cycle_id
        UNION ALL
        SELECT answer_text FROM manager_reviews WHERE employee_id = p_employee_id AND cycle_id = p_cycle_id
    ) t;
    
    -- Ищем триггерные слова
    FOR v_trigger IN 
        SELECT * FROM recommendation_triggers WHERE is_active = true
    LOOP
        IF v_feedback ILIKE '%' || v_trigger.trigger_word || '%' THEN
            INSERT INTO employee_recommendations 
            (employee_id, cycle_id, recommendation_text, source)
            VALUES 
            (p_employee_id, p_cycle_id, v_trigger.recommendation_text, 'auto')
            ON CONFLICT DO NOTHING;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;
```

## Миграции и обновления

Создайте директорию `database/migrations/` для версионирования изменений схемы.

## Индексы

Все необходимые индексы уже созданы в schema.sql:
- По внешним ключам
- По часто используемым фильтрам (role, status)
- По датам для аудита

## Бэкапы

Рекомендуется настроить автоматические бэкапы:

```bash
pg_dump wink_performance_review > backup_$(date +%Y%m%d).sql
```

## Подключение к БД из Node.js

Пример с использованием `pg` или `Sequelize` будет в отдельных файлах.

## Будущий функционал, который необходимо реализовать

1. Импорт задач, руководителей и участников из Excel в соответствующие таблицы
2. Импорт целей, вопросов и шаблонов форм для анкетирования
3. Гибкая настройка форм и блоков интерфейса через админку
4. Связь задач с циклами оценки и сотрудниками
5. Возможность добавлять аннотации и заметки к задачам
6. Хранение истории изменений задач, целей, анкет и оценок
7. Автоматическая генерация рекомендаций по триггерным словам
8. Калькуляция итоговых баллов и построение 9-box матрицы
9. Механизм калибровочных сессий и корректировок оценок
10. Аудит всех действий пользователей
11. Экспорт данных для отчетности и интеграции с внешними системами
12. API для интеграции с фронтендом и внешними сервисами
