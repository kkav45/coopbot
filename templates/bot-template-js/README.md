# 🤖 Telegram Bot (JavaScript)

Бот создан в **BotBuilder** — No-Code конструкторе Telegram ботов.

## 🚀 Быстрый старт

### 1. Установка зависимостей

```bash
npm install
```

### 2. Настройка

Создайте файл `.env` в корне проекта:

```env
BOT_TOKEN=your_bot_token_here
```

Получите токен в [@BotFather](https://t.me/BotFather).

### 3. Запуск

**Режим polling (рекомендуется для начала):**

```bash
npm start
```

**Режим webhook (для production):**

```bash
# В .env добавьте:
BOT_MODE=webhook
WEBHOOK_URL=https://your-domain.com/webhook
PORT=3000

npm start
```

## 📁 Структура проекта

```
.
├── bot.js              # Основной файл бота
├── bot-config.json     # Конфигурация из BotBuilder
├── package.json        # Зависимости Node.js
├── .env                # Переменные окружения (не коммитить!)
├── .env.example        # Пример переменных
└── README.md           # Этот файл
```

## 🔧 Настройки

### Переменные окружения

| Переменная | Описание | По умолчанию |
|-----------|----------|--------------|
| `BOT_TOKEN` | Токен бота от @BotFather | **Обязательно** |
| `BOT_MODE` | Режим запуска: `polling` или `webhook` | `polling` |
| `WEBHOOK_URL` | URL webhook для режима webhook | `null` |
| `PORT` | Порт для webhook сервера | `3000` |

## 🌐 Деплой

### Railway

1. Создайте проект на [Railway](https://railway.app)
2. Подключите GitHub репозиторий
3. Добавьте переменную `BOT_TOKEN`
4. Бот запустится автоматически

### Render

1. Создайте Web Service на [Render](https://render.com)
2. Подключите репозиторий
3. Команда: `npm install && npm start`
4. Добавьте переменную `BOT_TOKEN`

### Heroku

```bash
# Установите Heroku CLI
heroku create your-bot-name
heroku config:set BOT_TOKEN=your_token
git push heroku main
```

### VPS

```bash
# Установите Node.js 16+
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt-get install -y nodejs

# Клонируйте репозиторий
git clone <your-repo-url>
cd <bot-folder>

# Установите зависимости
npm install

# Создайте .env
cp .env.example .env
# Отредактируйте .env, укажите BOT_TOKEN

# Запустите через PM2
npm install -g pm2
pm2 start bot.js --name my-bot
pm2 save
pm2 startup
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
CMD ["node", "bot.js"]
```

```bash
docker build -t telegram-bot .
docker run -e BOT_TOKEN=your_token telegram-bot
```

## 🛠️ Разработка

### Локальная разработка

```bash
# Установите зависимости
npm install

# Создайте .env
cp .env.example .env
npm install -g nodemon

# Запустите с авто-перезагрузкой
nodemon bot.js
```

### Отладка

Включите логи:

```bash
DEBUG=* node bot.js
```

## 📊 Возможности бота

- ✅ **Сообщения** — отправка текста
- ✅ **Вопросы** — запрос данных у пользователя
- ✅ **Условия** — ветвление логики
- ✅ **Действия** — переменные, API запросы, задержки
- ✅ **Клавиатуры** — inline и reply кнопки
- ✅ **База данных** — Google Sheets интеграция
- ✅ **Циклы** — итерация по данным

## 🔌 API

### Библиотека TelegramBot

```javascript
const bot = new TelegramBot(BOT_TOKEN);

// Отправка сообщения
await bot.sendMessage(chatId, 'Привет!');

// Отправка с клавиатурой
await bot.sendMessageWithKeyboard(chatId, 'Выберите:', [
    ['Кнопка 1', 'Кнопка 2']
]);

// Переменные
bot.setVariable(userId, 'name', 'Alex');
const name = bot.getVariable(userId, 'name');

// Условия
const met = bot.checkCondition(value, 'equals', 'expected');
```

## ⚠️ Важные замечания

1. **Не коммитьте `.env`** — файл содержит секреты
2. **Используйте webhook** для production (быстрее чем polling)
3. **Настройте логи** для мониторинга ошибок
4. **Используйте PM2** для стабильной работы на VPS

## 📚 Документация

- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Node.js](https://nodejs.org/docs)
- [Express.js](https://expressjs.com/)
- [BotBuilder](https://github.com/kkav45/coopbot)

## 🆘 Troubleshooting

**Бот не запускается:**
```bash
# Проверьте Node.js
node --version  # Должно быть >= 16

# Проверьте токен
echo $BOT_TOKEN

# Посмотрите логи
node bot.js 2>&1 | tee bot.log
```

**Ошибка "BOT_TOKEN не найден":**
- Убедитесь, что файл `.env` существует
- Проверьте формат: `BOT_TOKEN=123456:ABCdef...`
- Без кавычек и пробелов вокруг `=`

**Webhook не работает:**
- Проверьте, что URL доступен из интернета
- Используйте HTTPS
- Проверьте порт в `.env`

## 📄 Лицензия

MIT License

---

**Создано с ❤️ в BotBuilder**
