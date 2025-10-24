const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Список миграционных скриптов в порядке выполнения
const migrations = [
  'create-peer-feedback-tables.js',
  'create-manager-evaluations-table.js',
  'create-potential-assessment-table.js',
  'create-detailed-evaluation-table.js',
  'add-ole-priorities.js',
  'add-rejection-comment.js',
  'update-peer-feedback-schema.js',
];

console.log('🔄 ЗАПУСК ВСЕХ МИГРАЦИЙ\n');
console.log('=' .repeat(80));

let success = 0;
let failed = 0;
let skipped = 0;

migrations.forEach((scriptName, index) => {
  const scriptPath = path.join(__dirname, scriptName);
  
  if (!fs.existsSync(scriptPath)) {
    console.log(`\n${index + 1}. ⚠️  ПРОПУЩЕН: ${scriptName} (файл не найден)`);
    skipped++;
    return;
  }
  
  console.log(`\n${index + 1}. 🔄 Запуск: ${scriptName}`);
  console.log('-'.repeat(80));
  
  try {
    execSync(`node "${scriptPath}"`, { 
      stdio: 'inherit',
      cwd: __dirname 
    });
    console.log(`✅ УСПЕШНО: ${scriptName}`);
    success++;
  } catch (error) {
    console.log(`❌ ОШИБКА: ${scriptName}`);
    failed++;
  }
});

console.log('\n' + '=' .repeat(80));
console.log('\n📊 ИТОГО:');
console.log(`   ✅ Успешно: ${success}`);
console.log(`   ❌ Ошибки: ${failed}`);
console.log(`   ⚠️  Пропущено: ${skipped}`);
console.log('\n');
