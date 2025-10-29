# AI Интеграция для генерации рекомендаций

## Описание

Реализована интеграция с AI микросервисом для автоматической генерации рекомендаций на основе данных оценки сотрудника.

## Endpoints AI микросервиса

AI микросервис должен быть запущен на `http://localhost:8000` и предоставлять следующие endpoints:

### 1. Генерация рекомендаций для сотрудника

**POST** `http://localhost:8000/api/results-and-plan`

**Request Body:**
```json
{
  "employee_name": "Иван Петров",
  "position": "Сотрудник",
  
  "self_score": 7.5,
  "manager_score": 8.0,
  "peer_score": 7.8,
  "total_score": 7.77,
  "evaluation_status": "Завершено",
  
  "self_assessment": [
    {
      "question_text": "Опишите ваши ключевые достижения",
      "answer_score": 4.5,
      "answer_text": "Успешно завершил проект X, внедрил новую систему...",
      "task_name": "Проект модернизации",
      "created_at": "2025-10-15T10:00:00Z"
    }
  ],
  
  "manager_evaluation": {
    "performance_total": 8.0,
    "professional_qualities_score": 4.5,
    "personal_qualities_score": 3.8,
    "comments": "Отличная работа, показал высокие результаты...",
    "manager_name": "Петр Сидоров"
  },
  
  "peer_reviews": [
    {
      "reviewer_name": "Анна Иванова",
      "answer_score": 4.0,
      "answer_text": "Хороший коллега, всегда помогает команде...",
      "question_text": "Оцените коммуникативные навыки",
      "created_at": "2025-10-20T14:00:00Z"
    }
  ],
  
  "potential_assessment": {
    "potential_score": 8.5,
    "performance_score": 8.0,
    "box_position": "high_potential_high_performance",
    "readiness_timeframe": "Готов через 6-12 месяцев"
  }
}
```

**Важно:** Все текстовые поля (`answer_text`, `comments` и т.д.) содержат полные комментарии от сотрудника, руководителя и коллег для лучшего контекста AI.

**Expected Response:**
```json
{
  "achievements": "Успешно завершил проект X, показал отличные результаты...",
  "improvements": "Рекомендуется усилить навыки коммуникации...",
  "development_plan": "Пройти тренинг по лидерству, участвовать в кросс-функциональных проектах..."
}
```

**Альтернативные названия полей в ответе:**
- `achievements` или `key_achievements`
- `improvements` или `areas_for_improvement`
- `development_plan` или `plan`

### 2. Генерация управленческих рекомендаций

**POST** `http://localhost:8000/api/steps-of-manager`

**Request Body:**
```json
{
  "employee_name": "Иван Петров",
  "position": "Сотрудник",
  
  "self_score": 7.5,
  "manager_score": 8.0,
  "peer_score": 7.8,
  "total_score": 7.77,
  "evaluation_status": "Завершено",
  
  "self_assessment": [
    {
      "question_text": "Опишите ваши ключевые достижения",
      "answer_score": 4.5,
      "answer_text": "Успешно завершил проект X, внедрил новую систему...",
      "task_name": "Проект модернизации",
      "created_at": "2025-10-15T10:00:00Z"
    }
  ],
  
  "manager_evaluation": {
    "performance_total": 8.0,
    "professional_qualities_score": 4.5,
    "personal_qualities_score": 3.8,
    "comments": "Отличная работа, показал высокие результаты...",
    "manager_name": "Петр Сидоров"
  },
  
  "peer_reviews": [
    {
      "reviewer_name": "Анна Иванова",
      "answer_score": 4.0,
      "answer_text": "Хороший коллега, всегда помогает команде...",
      "question_text": "Оцените коммуникативные навыки",
      "created_at": "2025-10-20T14:00:00Z"
    }
  ],
  
  "potential_assessment": {
    "potential_score": 8.5,
    "performance_score": 8.0,
    "box_position": "high_potential_high_performance",
    "readiness_timeframe": "Готов через 6-12 месяцев"
  }
}
```

**Важно:** Отправляются все данные включая текстовые комментарии для формирования управленческих рекомендаций с полным контекстом.

**Expected Response:**
```json
{
  "recommendations": "Рекомендуется рассмотреть повышение, назначить на роль тимлида..."
}
```

**Альтернативные названия полей в ответе:**
- `recommendations` или `manager_steps` или `steps`

## Структура отправляемых данных

### Подробное описание полей

#### Базовая информация
- `employee_name` - ФИО сотрудника
- `position` - Должность
- `evaluation_status` - Статус оценки ("Завершено", "В процессе" и т.д.)

#### Числовые оценки
- `self_score` - Средний балл самооценки (0-10)
- `manager_score` - Средний балл от руководителя (0-10)
- `peer_score` - Средний балл от коллег (0-10)
- `total_score` - Итоговый средний балл (0-10)

#### Детальные данные

**self_assessment** (массив) - Все ответы сотрудника на вопросы самооценки:
- `question_text` - Текст вопроса
- `answer_score` - Балл (1-5)
- `answer_text` - Текстовый ответ сотрудника (может быть длинным)
- `task_name` - Название связанной задачи (опционально)
- `created_at` - Дата создания ответа

**manager_evaluation** (объект или null) - Оценка от руководителя:
- `performance_total` - Общая результативность (0-10)
- `professional_qualities_score` - Профессиональные качества (0-5)
- `personal_qualities_score` - Личные качества (0-4)
- `comments` - **ВАЖНО**: Детальный комментарий руководителя
- `manager_name` - ФИО руководителя

**peer_reviews** (массив) - Все отзывы от коллег (360°):
- `reviewer_name` - ФИО коллеги
- `answer_score` - Балл (1-5)
- `answer_text` - **ВАЖНО**: Текстовый отзыв коллеги
- `question_text` - Вопрос, на который отвечал коллега
- `task_name` - Связанная задача (опционально)
- `created_at` - Дата создания отзыва

**potential_assessment** (объект или null) - Оценка потенциала (9-Box):
- `potential_score` - Оценка потенциала (0-10)
- `performance_score` - Оценка результативности (0-10)
- `box_position` - Позиция в 9-Box матрице
- `readiness_timeframe` - Готовность к продвижению

### Зачем нужны все эти данные?

AI анализирует не только числовые оценки, но и **все текстовые комментарии**:

1. **Самооценка** (`answer_text`) - понимание сотрудником своих достижений и проблем
2. **Комментарий руководителя** (`comments`) - профессиональное мнение о работе
3. **Отзывы коллег** (`answer_text`) - мнение команды о сотруднике

Это дает AI полный контекст для генерации:
- Конкретных достижений (из текстов, а не просто баллов)
- Точных областей улучшения (упомянутых в комментариях)
- Персонализированного плана развития (на основе реальных отзывов)

## Использование

### Для HR в интерфейсе калькуляции

1. Откройте страницу калькуляции результатов сотрудника
2. В блоке "📝 Рекомендации для сотрудника" нажмите кнопку "🤖 Помощь ИИ"
3. AI проанализирует данные и автоматически заполнит три поля:
   - 🏆 Ключевые достижения
   - 🎯 Области для улучшения
   - 📈 План развития
4. При необходимости отредактируйте текст
5. Нажмите "📧 Отправить сотруднику"

### Для управленческих рекомендаций

1. В блоке "👔 Управленческие рекомендации для руководителя" нажмите кнопку "🤖 Помощь ИИ"
2. AI сгенерирует управленческие рекомендации
3. При необходимости отредактируйте текст
4. Нажмите "📧 Отправить руководителю"

## Технические детали

### Состояние загрузки

Во время генерации:
- Кнопка меняется на "⏳ Генерация..."
- Кнопка становится неактивной (`disabled`)
- Непрозрачность кнопки снижается до 70%

### Обработка ошибок

Если AI микросервис недоступен или возвращает ошибку:
- Показывается alert с описанием ошибки
- Пользователю предлагается проверить, запущен ли микросервис
- Можно продолжить заполнение вручную

### Логирование

Все запросы и ответы AI логируются в консоль браузера:
- 📤 Отправка данных в AI микросервис
- ✅ Успешный ответ от AI
- ❌ Ошибки при генерации

## Пример работы

```javascript
// Функция генерации рекомендаций для сотрудника
const generateEmployeeRecommendationsAI = async () => {
  setIsLoadingAI(true);
  try {
    const aiRequestData = {
      employee_name: results.employee.name,
      position: results.employee.position,
      self_score: results.scores.selfScore,
      manager_score: results.scores.managerScore,
      peer_score: results.scores.peerScore,
      total_score: results.scores.totalScore,
      evaluation_status: results.employee.evaluationStatus
    };

    const response = await fetch('http://localhost:8000/api/results-and-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(aiRequestData)
    });

    const aiResponse = await response.json();
    
    setEmployeeRecommendations({
      achievements: aiResponse.achievements || aiResponse.key_achievements || '',
      improvements: aiResponse.improvements || aiResponse.areas_for_improvement || '',
      developmentPlan: aiResponse.development_plan || aiResponse.plan || ''
    });

    alert('✨ Рекомендации успешно сгенерированы с помощью AI!');
  } catch (error) {
    alert('Ошибка при генерации рекомендаций AI...');
  } finally {
    setIsLoadingAI(false);
  }
};
```

## Требования к AI микросервису

1. Должен быть запущен на `http://localhost:8000`
2. Должен принимать POST запросы с JSON
3. Должен возвращать JSON с рекомендациями
4. Должен поддерживать CORS для локальной разработки
5. Рекомендуется время ответа < 10 секунд

## Запуск AI микросервиса

```bash
# Перейти в директорию AI микросервиса
cd path/to/ai-service

# Запустить сервис (пример для FastAPI)
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## Тестирование

Для тестирования можно использовать curl:

```bash
# Тест рекомендаций для сотрудника (с полными данными)
curl -X POST http://localhost:8000/api/results-and-plan \
  -H "Content-Type: application/json" \
  -d '{
    "employee_name": "Тест Тестов",
    "position": "Сотрудник",
    "self_score": 8.0,
    "manager_score": 8.5,
    "peer_score": 8.2,
    "total_score": 8.23,
    "evaluation_status": "Завершено",
    "self_assessment": [
      {
        "question_text": "Опишите ваши ключевые достижения за период",
        "answer_score": 4.5,
        "answer_text": "Успешно завершил проект модернизации системы, внедрил новые процессы, которые повысили эффективность на 25%. Провел обучение команды.",
        "created_at": "2025-10-15T10:00:00Z"
      }
    ],
    "manager_evaluation": {
      "performance_total": 8.5,
      "comments": "Отличная работа в проекте модернизации. Показал инициативу и лидерские качества. Рекомендую развивать управленческие навыки.",
      "manager_name": "Петр Сидоров"
    },
    "peer_reviews": [
      {
        "reviewer_name": "Анна Иванова",
        "answer_score": 4.0,
        "answer_text": "Хороший коллега, всегда готов помочь. Отличные технические навыки.",
        "question_text": "Оцените коммуникативные навыки"
      }
    ]
  }'

# Тест управленческих рекомендаций (с полными данными)
curl -X POST http://localhost:8000/api/steps-of-manager \
  -H "Content-Type: application/json" \
  -d '{
    "employee_name": "Тест Тестов",
    "position": "Сотрудник",
    "self_score": 8.0,
    "manager_score": 8.5,
    "peer_score": 8.2,
    "total_score": 8.23,
    "evaluation_status": "Завершено",
    "self_assessment": [
      {
        "answer_text": "Успешно завершил проект модернизации системы, внедрил новые процессы."
      }
    ],
    "manager_evaluation": {
      "performance_total": 8.5,
      "comments": "Показал инициативу и лидерские качества."
    },
    "peer_reviews": [
      {
        "answer_text": "Хороший коллега, отличные технические навыки."
      }
    ],
    "potential_assessment": {
      "box_position": "high_potential_high_performance",
      "potential_score": 8.5
    }
  }'
```

## Будущие улучшения

- [ ] Добавить кеширование ответов AI
- [ ] Реализовать retry логику при ошибках
- [ ] Добавить историю генераций
- [ ] Показывать прогресс генерации
- [ ] Сравнение разных версий рекомендаций
- [ ] Возможность регенерации с другими параметрами
