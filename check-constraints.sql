SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'manager_evaluations'::regclass
  AND contype = 'c'; -- только CHECK constraints
