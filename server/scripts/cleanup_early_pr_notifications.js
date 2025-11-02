const db = require('../database');

async function run() {
  try {
    const q = `UPDATE notifications n
               SET is_read = true, read_at = NOW()
               FROM employee_review_periods erp
               WHERE n.related_id = erp.id
                 AND n.type LIKE 'early_pr_%'
                 AND erp.status NOT IN ('pending_manager_approval','pending_hr_approval')
               RETURNING n.*`;
    const res = await db.query(q);
    console.log('Updated notifications count:', res.rowCount);
    res.rows.forEach(r => console.log(JSON.stringify(r)));
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

run();
