-- Обновляем статус для всех периодов с user_id = 9 (Иван Иванов)
UPDATE employee_review_periods 
SET status = 'completed', calculated_at = NOW() 
WHERE user_id = 9 AND status = 'not_started';

-- Проверяем
SELECT 'RESULT:' as info;
SELECT u.first_name, u.last_name, erp.id, erp.status 
FROM employee_review_periods erp
JOIN users u ON erp.user_id = u.id
WHERE u.first_name = 'Иван' AND u.last_name = 'Иванов';
