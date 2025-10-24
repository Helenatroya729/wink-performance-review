// Простой production сервер для React приложения
const express = require('express');
const path = require('path');
const app = express();

const PORT = 3000;
const buildPath = path.join(__dirname, '..', 'client', 'build');

// Serve static files
app.use(express.static(buildPath));

// Handle React routing, return all requests to React app
app.get('*', (req, res) => {
  res.sendFile(path.join(buildPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔════════════════════════════════════════╗
║  WINK Performance Review Frontend      ║
║  Production сервер запущен             ║
║  http://localhost:${PORT}              ║
║  http://192.168.1.140:${PORT}          ║
║  http://app.demodev.crazedns.ru        ║
╚════════════════════════════════════════╝
  `);
});
