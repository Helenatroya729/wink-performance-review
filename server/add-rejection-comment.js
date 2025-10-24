const { query } = require('./database');

async function addRejectionCommentColumn() {
  try {
    console.log('Добавление колонки rejection_comment...');
    
    await query(`
      ALTER TABLE employee_goals 
      ADD COLUMN IF NOT EXISTS rejection_comment TEXT
    `);
    
    console.log('✅ Колонка rejection_comment успешно добавлена');
    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка:', error);
    process.exit(1);
  }
}

addRejectionCommentColumn();
