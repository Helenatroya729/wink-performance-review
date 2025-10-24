const fs = require('fs');
const path = require('path');

// Список всех JS файлов в папке server
const serverDir = __dirname;
const files = fs.readdirSync(serverDir).filter(f => f.endsWith('.js'));

console.log('📋 АНАЛИЗ СКРИПТОВ В ПАПКЕ server/\n');
console.log('=' .repeat(80));

const categories = {
  setup: [],
  migration: [],
  seed: [],
  test: [],
  fix: [],
  check: [],
  other: []
};

files.forEach(file => {
  const content = fs.readFileSync(path.join(serverDir, file), 'utf8');
  const firstLines = content.split('\n').slice(0, 20).join('\n');
  
  let category = 'other';
  let description = '';
  
  // Определяем категорию по имени и содержимому
  if (file.includes('init') || file.includes('create-') || file === 'database.js') {
    category = 'setup';
  } else if (file.includes('add-') || file.includes('update-') || file.includes('recreate-')) {
    category = 'migration';
  } else if (file.includes('seed')) {
    category = 'seed';
  } else if (file.includes('test')) {
    category = 'test';
  } else if (file.includes('fix')) {
    category = 'fix';
  } else if (file.includes('check') || file.includes('find')) {
    category = 'check';
  }
  
  // Ищем описание в комментариях
  const commentMatch = firstLines.match(/\/\/\s*(.+)/);
  if (commentMatch) {
    description = commentMatch[1].substring(0, 60);
  } else {
    // Ищем название функции
    const funcMatch = firstLines.match(/async function (\w+)/);
    if (funcMatch) {
      description = `Функция: ${funcMatch[1]}`;
    }
  }
  
  // Проверяем, использует ли порт 5432 или 5433
  const usesPort = content.includes('5432') ? '🔴 Порт 5432' : 
                   content.includes('5433') ? '🟢 Порт 5433' : 
                   content.includes('database.js') ? '🟢 Из database.js' : '';
  
  categories[category].push({ file, description, usesPort });
});

const categoryNames = {
  setup: '🏗️  ИНИЦИАЛИЗАЦИЯ И СОЗДАНИЕ ТАБЛИЦ',
  migration: '🔄 МИГРАЦИИ СХЕМЫ БД',
  seed: '🌱 ЗАПОЛНЕНИЕ ТЕСТОВЫМИ ДАННЫМИ',
  test: '🧪 ТЕСТИРОВАНИЕ',
  check: '🔍 ПРОВЕРКА ДАННЫХ',
  fix: '🔧 ИСПРАВЛЕНИЯ',
  other: '📦 ПРОЧИЕ'
};

Object.entries(categories).forEach(([cat, items]) => {
  if (items.length > 0) {
    console.log(`\n${categoryNames[cat]}`);
    console.log('-'.repeat(80));
    items.forEach(item => {
      console.log(`  ${item.file.padEnd(45)} ${item.usesPort}`);
      if (item.description) {
        console.log(`    → ${item.description}`);
      }
    });
  }
});

console.log('\n' + '=' .repeat(80));
console.log('\n⚠️  ВНИМАНИЕ: Файлы с 🔴 Порт 5432 нужно исправить на порт 5433!\n');
