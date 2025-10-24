-- ============================================================================
-- БАЗА ДАННЫХ ДЛЯ СИСТЕМЫ PERFORMANCE REVIEW WINK
-- Создана на основе анализа файла "Кейс_Механика оценки_2025.xlsx"
-- ============================================================================

-- Создание базы данных
CREATE DATABASE wink_performance_review;

\c wink_performance_review;

-- ============================================================================
-- ОСНОВНЫЕ СПРАВОЧНЫЕ ТАБЛИЦЫ
-- ============================================================================

-- Пользователи системы
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('employee', 'manager', 'hr', 'admin')),
    department VARCHAR(100),
    position VARCHAR(100),
    manager_id INTEGER REFERENCES users(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_manager ON users(manager_id);
CREATE INDEX idx_users_email ON users(email);

-- Циклы оценки (например, "1-е полугодие 2025")
CREATE TABLE review_cycles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('draft', 'active', 'calibration', 'completed')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Задачи/проекты компании (из листа "Распределение задач")
CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    legacy_number INTEGER,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    department VARCHAR(100),
    owning_unit VARCHAR(100),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tasks_department ON tasks(department);
CREATE INDEX idx_tasks_status ON tasks(status);

-- Руководители задач (из столбца "Руководители направлений")
CREATE TABLE task_leads (
    id SERIAL PRIMARY KEY,
    task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id),
    full_name VARCHAR(255) NOT NULL,
    role_title VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(task_id, full_name)
);

-- Участники задач (из столбца "Участники")
CREATE TABLE task_participants (
    id SERIAL PRIMARY KEY,
    task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id),
    full_name VARCHAR(255) NOT NULL,
    responsibility_area VARCHAR(150),
    is_internal BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(task_id, full_name)
);

-- Дополнительные пометки по задаче (столбец "Unnamed: 4")
CREATE TABLE task_annotations (
    id SERIAL PRIMARY KEY,
    task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    annotation_text TEXT NOT NULL,
    source_sheet VARCHAR(100) DEFAULT 'Распределение задач',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- ЭТАП 0: ВВОДНЫЙ ОПРОС
-- ============================================================================

-- Связь сотрудника с задачами (выбор до 3 задач)
CREATE TABLE employee_tasks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    task_id INTEGER NOT NULL REFERENCES tasks(id),
    cycle_id INTEGER NOT NULL REFERENCES review_cycles(id),
    task_order INTEGER CHECK (task_order BETWEEN 1 AND 3),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, cycle_id, task_order)
);

CREATE INDEX idx_employee_tasks_user ON employee_tasks(user_id);
CREATE INDEX idx_employee_tasks_cycle ON employee_tasks(cycle_id);

-- Респонденты для оценки 360 (выбранные сотрудником)
CREATE TABLE selected_respondents (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES users(id),
    respondent_id INTEGER NOT NULL REFERENCES users(id),
    task_id INTEGER NOT NULL REFERENCES tasks(id),
    cycle_id INTEGER NOT NULL REFERENCES review_cycles(id),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'declined')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(employee_id, respondent_id, task_id, cycle_id)
);

CREATE INDEX idx_respondents_employee ON selected_respondents(employee_id);
CREATE INDEX idx_respondents_respondent ON selected_respondents(respondent_id);

-- ============================================================================
-- ФУНКЦИОНАЛ 1: ЦЕЛИ И ЗАДАЧИ
-- ============================================================================

-- Цели сотрудника (до 5 целей)
CREATE TABLE employee_goals (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    cycle_id INTEGER NOT NULL REFERENCES review_cycles(id),
    goal_number INTEGER CHECK (goal_number BETWEEN 1 AND 5),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    expected_deadline DATE,
    expected_results TEXT,
    key_tasks TEXT,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, cycle_id, goal_number)
);

CREATE INDEX idx_goals_user ON employee_goals(user_id);
CREATE INDEX idx_goals_cycle ON employee_goals(cycle_id);

-- Задачи под каждой целью (до 3 задач на цель)
CREATE TABLE goal_tasks (
    id SERIAL PRIMARY KEY,
    goal_id INTEGER NOT NULL REFERENCES employee_goals(id) ON DELETE CASCADE,
    task_number INTEGER CHECK (task_number BETWEEN 1 AND 3),
    task_description TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(goal_id, task_number)
);

CREATE INDEX idx_goal_tasks_goal ON goal_tasks(goal_id);

-- ============================================================================
-- ШАБЛОНЫ ФОРМ И РАЗМЕТКА ИНТЕРФЕЙСА
-- ============================================================================

CREATE TABLE form_templates (
    id SERIAL PRIMARY KEY,
    code VARCHAR(100) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    audience VARCHAR(30) NOT NULL CHECK (audience IN ('employee', 'peer', 'manager', 'hr', 'admin')),
    purpose TEXT,
    applies_per VARCHAR(20) DEFAULT 'task' CHECK (applies_per IN ('task', 'cycle', 'goal')),
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE form_sections (
    id SERIAL PRIMARY KEY,
    template_id INTEGER NOT NULL REFERENCES form_templates(id) ON DELETE CASCADE,
    title VARCHAR(255),
    description TEXT,
    display_order INTEGER,
    section_type VARCHAR(30) DEFAULT 'instruction' CHECK (section_type IN ('instruction', 'question_group', 'calculation', 'summary')),
    is_collapsible BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE form_static_blocks (
    id SERIAL PRIMARY KEY,
    template_id INTEGER NOT NULL REFERENCES form_templates(id) ON DELETE CASCADE,
    section_id INTEGER REFERENCES form_sections(id) ON DELETE CASCADE,
    block_type VARCHAR(30) NOT NULL CHECK (block_type IN ('text', 'list', 'note', 'warning')),
    content TEXT NOT NULL,
    display_order INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- ФУНКЦИОНАЛ 2: САМООЦЕНКА СОТРУДНИКА
-- ============================================================================

-- Вопросы для самооценки (настраиваемые в админке)
CREATE TABLE self_assessment_questions (
    id SERIAL PRIMARY KEY,
    question_text TEXT NOT NULL,
    question_type VARCHAR(50) NOT NULL CHECK (question_type IN ('text', 'scale_0_10', 'multiple_choice')),
    options TEXT, -- JSON массив вариантов ответов
    max_score INTEGER,
    weight DECIMAL(3, 2) DEFAULT 1.0,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ответы на самооценку
CREATE TABLE self_assessments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    task_id INTEGER NOT NULL REFERENCES tasks(id),
    cycle_id INTEGER NOT NULL REFERENCES review_cycles(id),
    question_id INTEGER NOT NULL REFERENCES self_assessment_questions(id),
    answer_text TEXT,
    answer_score INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, task_id, cycle_id, question_id)
);

CREATE INDEX idx_self_assessment_user ON self_assessments(user_id);

-- ============================================================================
-- ФУНКЦИОНАЛ 2: ОЦЕНКА 360 ОТ РЕСПОНДЕНТОВ
-- ============================================================================

-- Вопросы для оценки 360 от коллег
CREATE TABLE peer_review_questions (
    id SERIAL PRIMARY KEY,
    question_text TEXT NOT NULL,
    question_type VARCHAR(50) NOT NULL CHECK (question_type IN ('text', 'scale_0_10', 'multiple_choice')),
    max_score INTEGER,
    weight DECIMAL(3, 2) DEFAULT 1.0,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ответы респондентов на оценку 360
CREATE TABLE peer_reviews (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES users(id), -- кого оценивают
    respondent_id INTEGER NOT NULL REFERENCES users(id), -- кто оценивает
    task_id INTEGER NOT NULL REFERENCES tasks(id),
    cycle_id INTEGER NOT NULL REFERENCES review_cycles(id),
    question_id INTEGER NOT NULL REFERENCES peer_review_questions(id),
    answer_text TEXT,
    answer_score INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(employee_id, respondent_id, task_id, cycle_id, question_id)
);

CREATE INDEX idx_peer_review_employee ON peer_reviews(employee_id);
CREATE INDEX idx_peer_review_respondent ON peer_reviews(respondent_id);

-- ============================================================================
-- ФУНКЦИОНАЛ 2: ОЦЕНКА 360 ОТ РУКОВОДИТЕЛЯ
-- ============================================================================

-- Вопросы для оценки руководителя
CREATE TABLE manager_review_questions (
    id SERIAL PRIMARY KEY,
    question_text TEXT NOT NULL,
    question_type VARCHAR(50) NOT NULL CHECK (question_type IN ('text', 'scale_0_10', 'multiple_choice')),
    max_score INTEGER,
    weight DECIMAL(3, 2) DEFAULT 1.0,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Оценка от руководителя
CREATE TABLE manager_reviews (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES users(id),
    manager_id INTEGER NOT NULL REFERENCES users(id),
    task_id INTEGER NOT NULL REFERENCES tasks(id),
    cycle_id INTEGER NOT NULL REFERENCES review_cycles(id),
    question_id INTEGER NOT NULL REFERENCES manager_review_questions(id),
    answer_text TEXT,
    answer_score INTEGER,
    feedback_summary TEXT, -- общая обратная связь руководителя
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(employee_id, task_id, cycle_id, question_id)
);

CREATE INDEX idx_manager_review_employee ON manager_reviews(employee_id);
CREATE INDEX idx_manager_review_manager ON manager_reviews(manager_id);

-- ============================================================================
-- ФУНКЦИОНАЛ 2: ОЦЕНКА ПОТЕНЦИАЛА (9-BOX МАТРИЦА)
-- ============================================================================

-- Оценка потенциала сотрудника руководителем
CREATE TABLE potential_assessments (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES users(id),
    manager_id INTEGER NOT NULL REFERENCES users(id),
    cycle_id INTEGER NOT NULL REFERENCES review_cycles(id),
    
    -- Профессиональные качества (множественный выбор)
    professional_qualities TEXT[], -- массив: ['Ответственность', 'Ориентация на результат', ...]
    
    -- Личные качества (чекбоксы)
    takes_responsibility BOOLEAN DEFAULT false,
    transparent_communication BOOLEAN DEFAULT false,
    shares_information BOOLEAN DEFAULT false,
    organizes_work BOOLEAN DEFAULT false,
    
    -- Стремление развиваться
    growth_mindset_score INTEGER CHECK (growth_mindset_score BETWEEN 0 AND 10),
    
    -- Дополнительные вопросы по потенциалу (из скринов 7-8)
    readiness_timeframe VARCHAR(20) CHECK (readiness_timeframe IN ('1-2_years', '3_years', '3+_years', 'not_ready')),
    is_successor BOOLEAN DEFAULT false,
    handles_communication_barriers BOOLEAN DEFAULT false,
    reflects_on_results BOOLEAN DEFAULT false,
    desires_role VARCHAR(100),
    role_interest_level INTEGER CHECK (role_interest_level BETWEEN 0 AND 10),
    risk_assessment INTEGER CHECK (risk_assessment BETWEEN 0 AND 10),
    
    -- Итоговые баллы
    performance_score INTEGER, -- результативность (из самооценки и 360)
    potential_score INTEGER, -- потенциал (профессиональные + личные качества + рост)
    
    -- 9-box позиция
    box_position VARCHAR(20) CHECK (box_position IN (
        'low_potential_low_performance',
        'low_potential_medium_performance', 
        'low_potential_high_performance',
        'medium_potential_low_performance',
        'medium_potential_medium_performance',
        'medium_potential_high_performance',
        'high_potential_low_performance',
        'high_potential_medium_performance',
        'high_potential_high_performance'
    )),
    
    comments TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(employee_id, cycle_id)
);

CREATE INDEX idx_potential_employee ON potential_assessments(employee_id);
CREATE INDEX idx_potential_box ON potential_assessments(box_position);

-- Детальные вопросы по оценке потенциала (настраиваемые)
CREATE TABLE potential_detail_questions (
    id SERIAL PRIMARY KEY,
    question_number VARCHAR(10) NOT NULL,
    question_text TEXT NOT NULL,
    answer_type VARCHAR(30) NOT NULL CHECK (answer_type IN ('yes_no', 'scale_0_10', 'text', 'timeframe')),
    weight DECIMAL(3, 2) DEFAULT 1.0,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ответы на детальные вопросы по потенциалу
CREATE TABLE potential_detail_answers (
    id SERIAL PRIMARY KEY,
    assessment_id INTEGER NOT NULL REFERENCES potential_assessments(id) ON DELETE CASCADE,
    question_id INTEGER NOT NULL REFERENCES potential_detail_questions(id),
    answer_boolean BOOLEAN,
    answer_integer INTEGER,
    answer_text TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(assessment_id, question_id)
);

CREATE INDEX idx_potential_answers_assessment ON potential_detail_answers(assessment_id);

-- ============================================================================
-- ФУНКЦИОНАЛ 3: ПОДВЕДЕНИЕ ИТОГОВ
-- ============================================================================

-- Итоговые результаты Performance Review
CREATE TABLE final_reviews (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES users(id),
    cycle_id INTEGER NOT NULL REFERENCES review_cycles(id),
    
    -- Баллы по категориям
    self_assessment_total INTEGER,
    peer_review_total INTEGER,
    manager_review_total INTEGER,
    potential_total INTEGER,
    
    -- Итоговый балл и рейтинг
    total_score INTEGER,
    rating INTEGER CHECK (rating BETWEEN 0 AND 10),
    rating_category VARCHAR(50) CHECK (rating_category IN (
        'no_result',      -- 0-2
        'low_result',     -- 3-5
        'good_result',    -- 6-8
        'outstanding'     -- 9-10
    )),
    
    -- Рекомендации по зарплате
    salary_increase_recommended BOOLEAN DEFAULT false,
    salary_increase_percent DECIMAL(5, 2),
    
    -- Статус
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'completed', 'calibrated')),
    
    -- Итоговая обратная связь
    final_feedback TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(employee_id, cycle_id)
);

CREATE INDEX idx_final_review_employee ON final_reviews(employee_id);
CREATE INDEX idx_final_review_rating ON final_reviews(rating_category);

-- ============================================================================
-- ФУНКЦИОНАЛ 4: РЕКОМЕНДАЦИИ ПО РАЗВИТИЮ
-- ============================================================================

-- Триггерные слова для автоматических рекомендаций
CREATE TABLE recommendation_triggers (
    id SERIAL PRIMARY KEY,
    trigger_word VARCHAR(100) NOT NULL,
    recommendation_text TEXT NOT NULL,
    category VARCHAR(50), -- например: 'soft_skills', 'technical', 'leadership'
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_triggers_word ON recommendation_triggers(trigger_word);

-- Сгенерированные рекомендации для сотрудников
CREATE TABLE employee_recommendations (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES users(id),
    cycle_id INTEGER NOT NULL REFERENCES review_cycles(id),
    recommendation_text TEXT NOT NULL,
    source VARCHAR(50), -- 'auto' (из триггеров) или 'manual' (от HR/руководителя)
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_recommendations_employee ON employee_recommendations(employee_id);

-- Индивидуальный план развития (ИПР)
CREATE TABLE development_plans (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES users(id),
    cycle_id INTEGER NOT NULL REFERENCES review_cycles(id),
    goal_text TEXT NOT NULL,
    actions TEXT,
    deadline DATE,
    status VARCHAR(20) DEFAULT 'in_progress' CHECK (status IN ('planned', 'in_progress', 'completed', 'cancelled')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_dev_plans_employee ON development_plans(employee_id);

-- ============================================================================
-- КАЛИБРОВОЧНЫЕ СЕССИИ
-- ============================================================================

-- Калибровочные встречи для согласования оценок
CREATE TABLE calibration_sessions (
    id SERIAL PRIMARY KEY,
    cycle_id INTEGER NOT NULL REFERENCES review_cycles(id),
    name VARCHAR(255) NOT NULL,
    scheduled_date TIMESTAMP,
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Участники калибровок
CREATE TABLE calibration_participants (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES calibration_sessions(id),
    user_id INTEGER NOT NULL REFERENCES users(id),
    role VARCHAR(20) CHECK (role IN ('organizer', 'participant')),
    UNIQUE(session_id, user_id)
);

-- Корректировки после калибровок
CREATE TABLE calibration_adjustments (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES calibration_sessions(id),
    employee_id INTEGER NOT NULL REFERENCES users(id),
    old_rating INTEGER,
    new_rating INTEGER,
    old_box_position VARCHAR(20),
    new_box_position VARCHAR(20),
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- АУДИТ И ЛОГИРОВАНИЕ
-- ============================================================================

-- Лог действий пользователей
CREATE TABLE audit_log (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id INTEGER,
    old_value TEXT,
    new_value TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_user ON audit_log(user_id);
CREATE INDEX idx_audit_created ON audit_log(created_at);

-- ============================================================================
-- ПРЕДСТАВЛЕНИЯ ДЛЯ ОТЧЕТОВ
-- ============================================================================

-- Сводная информация по сотрудникам
CREATE VIEW v_employee_summary AS
SELECT 
    u.id,
    u.first_name,
    u.last_name,
    u.email,
    u.department,
    u.position,
    m.first_name || ' ' || m.last_name as manager_name,
    fr.rating,
    fr.rating_category,
    pa.box_position,
    pa.performance_score,
    pa.potential_score
FROM users u
LEFT JOIN users m ON u.manager_id = m.id
LEFT JOIN final_reviews fr ON u.id = fr.employee_id
LEFT JOIN potential_assessments pa ON u.id = pa.employee_id
WHERE u.role = 'employee' AND u.is_active = true;

-- Статистика по циклам оценки
CREATE VIEW v_cycle_statistics AS
SELECT 
    rc.id,
    rc.name,
    rc.status,
    COUNT(DISTINCT fr.employee_id) as employees_reviewed,
    AVG(fr.total_score) as avg_score,
    COUNT(DISTINCT CASE WHEN fr.rating_category = 'outstanding' THEN fr.employee_id END) as outstanding_count,
    COUNT(DISTINCT CASE WHEN fr.rating_category = 'good_result' THEN fr.employee_id END) as good_count,
    COUNT(DISTINCT CASE WHEN fr.rating_category = 'low_result' THEN fr.employee_id END) as low_count,
    COUNT(DISTINCT CASE WHEN fr.rating_category = 'no_result' THEN fr.employee_id END) as no_result_count
FROM review_cycles rc
LEFT JOIN final_reviews fr ON rc.id = fr.cycle_id
GROUP BY rc.id, rc.name, rc.status;

-- ============================================================================
-- ТЕСТОВЫЕ ДАННЫЕ
-- ============================================================================

-- Вставка тестовых пользователей
INSERT INTO users (email, password_hash, first_name, last_name, role, department, position) VALUES
('employee@wink.ru', '$2b$10$xyz...', 'Иван', 'Иванов', 'employee', 'Разработка', 'Senior Developer'),
('manager@wink.ru', '$2b$10$xyz...', 'Петр', 'Петров', 'manager', 'Разработка', 'Team Lead'),
('hr@wink.ru', '$2b$10$xyz...', 'Мария', 'Сидорова', 'hr', 'HR', 'HR Manager'),
('admin@wink.ru', '$2b$10$xyz...', 'Алексей', 'Смирнов', 'admin', 'IT', 'System Administrator');

-- Создание цикла оценки
INSERT INTO review_cycles (name, start_date, end_date, status) VALUES
('Первое полугодие 2025', '2025-01-01', '2025-06-30', 'active');

-- Тестовые задачи
INSERT INTO tasks (name, description, department) VALUES
('Интеграция Белтелекома', 'Разработка РИТ', 'Разработка'),
('Повышение конверсии', 'Оплата с карточки проекта', 'Продукт'),
('Главная на своих скрингридах', 'Обновление главной страницы', 'Дизайн');

COMMENT ON DATABASE wink_performance_review IS 'База данных для системы оценки эффективности сотрудников WINK';
