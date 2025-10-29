# Система рекомендаций HR

## Описание

Реализована система двух типов рекомендаций от HR:

1. **Рекомендации для сотрудника** - персональные рекомендации по развитию (достижения, области улучшения, план развития)
2. **Управленческие рекомендации** - рекомендации для руководителя по управлению сотрудником

## Изменения в файлах

### Клиентская часть

#### `client/src/pages/CalculationResults.js`
- Добавлены новые состояния:
  - `employeeRecommendations` - объект с тремя полями (achievements, improvements, developmentPlan)
  - `managerRecommendations` - строка с управленческими рекомендациями
  
- Добавлены функции:
  - `sendEmployeeRecommendations()` - отправка рекомендаций сотруднику
  - `sendManagerRecommendations()` - отправка рекомендаций руководителю
  
- Интерфейс разделен на 3 блока:
  1. **Рекомендации для сотрудника** - три поля (достижения, улучшения, план) + кнопка "Отправить сотруднику"
  2. **Управленческие рекомендации** - текстовое поле + кнопка "Отправить руководителю"
  3. **Общие заметки и выводы** - старый блок для внутренних заметок HR

#### `client/src/pages/EmployeeDashboard.js`
- Добавлено состояние `recommendations` для хранения полученных рекомендаций
- Добавлена загрузка рекомендаций в `loadData()`
- Добавлен визуальный блок для отображения рекомендаций с иконками и цветовым кодированием

### Серверная часть

#### `server/server-new.js`
Добавлены новые endpoints:

1. **POST** `/api/hr/send-employee-recommendations/:employeeId`
   - Отправка рекомендаций сотруднику
   - Создает таблицу `employee_recommendations` если не существует
   - Сохраняет: достижения, области улучшения, план развития

2. **POST** `/api/hr/send-manager-recommendations/:employeeId`
   - Отправка управленческих рекомендаций руководителю
   - Создает таблицу `manager_recommendations` если не существует
   - Проверяет наличие руководителя у сотрудника

3. **GET** `/api/employee/my-recommendations`
   - Получение рекомендаций для сотрудника
   - Возвращает все рекомендации с информацией об HR и датой отправки

4. **GET** `/api/manager/recommendations`
   - Получение управленческих рекомендаций для менеджера
   - Возвращает рекомендации по всем сотрудникам менеджера

5. **POST** `/api/recommendations/mark-read/:id`
   - Отметка рекомендации как прочитанной

#### `server/create-recommendations-tables.js`
Миграционный скрипт для создания таблиц:

```sql
-- Таблица рекомендаций для сотрудников
CREATE TABLE employee_recommendations (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  hr_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  achievements TEXT,
  improvements TEXT,
  development_plan TEXT,
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица управленческих рекомендаций
CREATE TABLE manager_recommendations (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  manager_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  hr_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  recommendations TEXT NOT NULL,
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Инструкция по использованию

### Для HR

1. Откройте страницу калькуляции результатов сотрудника
2. **Рекомендации для сотрудника:**
   - Нажмите кнопку "🤖 Помощь ИИ" для автоматической генерации (требуется AI микросервис на http://localhost:8000)
   - Или заполните вручную три поля:
     - 🏆 Ключевые достижения
     - 🎯 Области для улучшения
     - 📈 План развития
   - Нажмите "📧 Отправить сотруднику"
3. **Управленческие рекомендации:**
   - Нажмите кнопку "🤖 Помощь ИИ" для автоматической генерации
   - Или заполните поле вручную
   - Нажмите "📧 Отправить руководителю"
4. **Общие заметки** (без кнопки ИИ) - для внутреннего использования HR

### Для сотрудника

1. После получения рекомендаций от HR, на главной странице дашборда появится блок "📋 Рекомендации от HR"
2. Блок будет выделен оранжевой рамкой с меткой "НОВОЕ"
3. Рекомендации разделены на три секции с цветовым кодированием:
   - 🏆 Ваши достижения (зеленый)
   - 🎯 Области для улучшения (синий)
   - 📈 План развития (оранжевый)

### Для менеджера

1. В дашборде менеджера появятся управленческие рекомендации от HR по сотрудникам команды
2. Рекомендации содержат конкретные действия и решения по управлению сотрудником

## Установка и запуск

### 1. Создание таблиц в БД

```bash
cd server
node create-recommendations-tables.js
```

### 2. Перезапуск сервера

```bash
# В корне проекта
.\START_FULL.ps1
```

Или отдельно:

```bash
# Сервер
cd server
node server-new.js

# Клиент
cd client
npm start
```

## API Примеры

### Отправка рекомендаций сотруднику

```javascript
POST /api/hr/send-employee-recommendations/5
Authorization: Bearer {token}

{
  "achievements": "Успешно завершил проект X...",
  "improvements": "Рекомендуется усилить навыки...",
  "developmentPlan": "Пройти тренинг по лидерству..."
}
```

### Отправка управленческих рекомендаций

```javascript
POST /api/hr/send-manager-recommendations/5
Authorization: Bearer {token}

{
  "recommendations": "Рекомендуется рассмотреть повышение..."
}
```

### Получение своих рекомендаций (сотрудник)

```javascript
GET /api/employee/my-recommendations
Authorization: Bearer {token}
```

## Будущие улучшения

- [x] Интеграция с AI для автоматической генерации рекомендаций
- [ ] Push-уведомления о новых рекомендациях
- [ ] История версий рекомендаций
- [ ] Экспорт рекомендаций в PDF
- [ ] Ответ сотрудника на рекомендации
- [ ] Отслеживание выполнения плана развития
- [ ] Кеширование AI ответов
- [ ] Сравнение разных версий рекомендаций AI

## Связанные документы

- [AI_INTEGRATION.md](./AI_INTEGRATION.md) - Подробная документация по интеграции с AI микросервисом
