# Инструкция: Как открыть доступ к приложению из интернета

## Ваше приложение уже доступно в локальной сети!

**Локальный адрес**: http://localhost:3000
**В вашей сети**: http://192.168.1.140:3000

Любой человек в вашей сети WiFi может открыть этот адрес и увидеть приложение!

---

## Способ 1: Ngrok (Бесплатно, проще всего)

### Установка:
1. Скачайте ngrok: https://ngrok.com/download
2. Распакуйте в папку (например, C:\ngrok)
3. Зарегистрируйтесь на ngrok.com и получите токен

### Запуск:
```powershell
# Перейдите в папку с ngrok
cd C:\ngrok

# Авторизуйтесь (замените YOUR_TOKEN на ваш токен)
.\ngrok config add-authtoken YOUR_TOKEN

# Создайте туннель для фронтенда
.\ngrok http 3000
```

Вы получите публичный URL типа: `https://abc123.ngrok.io`
Его можно отправить кому угодно!

### Для обоих серверов одновременно:
```powershell
# Окно 1: Туннель для фронтенда
.\ngrok http 3000

# Окно 2: Туннель для бэкенда
.\ngrok http 5000
```

---

## Способ 2: LocalTunnel (Проще, но менее стабильно)

### Установка:
```powershell
npm install -g localtunnel
```

### Запуск:
```powershell
# Для фронтенда
lt --port 3000
```

Получите URL типа: `https://your-subdomain.loca.lt`

---

## Способ 3: Cloudflare Tunnel (Бесплатно, профессионально)

### Установка:
1. Скачайте cloudflared: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/
2. Войдите в аккаунт Cloudflare

### Запуск:
```powershell
cloudflared tunnel --url http://localhost:3000
```

---

## Способ 4: Deploy на бесплатный хостинг

### Vercel (для фронтенда):
```powershell
# Установка
npm install -g vercel

# Deploy
cd client
vercel
```

### Railway/Render (для бэкенда):
1. Создайте аккаунт на railway.app или render.com
2. Подключите GitHub репозиторий
3. Deploy автоматически

---

## Самый быстрый способ СЕЙЧАС:

### 1. Скачайте ngrok:
https://ngrok.com/download (Windows, ZIP файл)

### 2. Распакуйте и запустите:
```powershell
# Перейдите в папку где распаковали
cd путь\к\ngrok

# Запустите
.\ngrok http 3000
```

### 3. Скопируйте URL из консоли
Вы увидите что-то типа:
```
Forwarding  https://1234-5678-9012.ngrok.io -> http://localhost:3000
```

**Этот URL можно отправить кому угодно в мире!**

---

## ВАЖНО для продакшена:

Для реального использования лучше:
1. Собрать production build: `npm run build` в папке client
2. Задеплоить на Vercel/Netlify (фронт) + Railway/Render (бэк)
3. Использовать собственный домен

---

## Быстрая команда для тех у кого ngrok уже установлен:

```powershell
ngrok http 3000
```

Готово!
