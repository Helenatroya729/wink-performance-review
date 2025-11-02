-- Исправляем статус Ивана Иванова на completed
UPDATE employee_review_periods 
SET status = 'completed', calculated_at = NOW() 
WHERE id = 34;

-- Проверяем результат
SELECT u.first_name, u.last_name, erp.status 
FROM employee_review_periods erp
JOIN users u ON erp.user_id = u.id
WHERE erp.id = 34;
