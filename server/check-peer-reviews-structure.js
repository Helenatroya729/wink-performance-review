const { query } = require('./database');

async function checkPeerReviewsStructure() {
  try {
    const columns = await query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'peer_reviews'
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Колонки таблицы peer_reviews:');
    columns.rows.forEach(c => console.log(`  - ${c.column_name}`));
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка:', error);
    process.exit(1);
  }
}

checkPeerReviewsStructure();
