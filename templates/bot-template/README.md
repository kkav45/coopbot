# Telegram Bot

Бот создан в **BotBuilder** — No-Code конструкторе Telegram ботов.

## 🚀 Быстрый старт

### 1. Установка зависимостей

```bash
pip install -r requirements.txt
```

### 2. Настройка

Скопируйте `.env.example` в `.env`:

```bash
cp .env.example .env
```

Отредактируйте `.env` и укажите ваш токен бота из @BotFather.

### 3. Запуск

```bash
python bot.py
```

## 📁 Структура файлов

- `bot-config.json` — конфигурация бота (сценарии, блоки, переменные)
- `bot.py` — основной файл бота
- `requirements.txt` — зависимости Python
- `.env` — переменные окружения (токен бота)

## 🛠️ Хостинг

### Railway

1. Создайте новый проект на [Railway](https://railway.app)
2. Подключите этот репозиторий
3. Добавьте переменную окружения `BOT_TOKEN`
4. Бот запустится автоматически

### Render

1. Создайте новый Web Service на [Render](https://render.com)
2. Подключите репозиторий
3. Укажите команду запуска: `python bot.py`
4. Добавьте переменную окружения `BOT_TOKEN`

### VPS / Выделенный сервер

1. Загрузите файлы на сервер
2. Установите Python 3.8+
3. Установите зависимости:
   ```bash
   pip install -r requirements.txt
   ```
4. Создайте `.env` с токеном
5. Запустите через systemd или supervisor:

```ini
[Unit]
Description=Telegram Bot
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/bot
ExecStart=/usr/bin/python3 bot.py
Restart=always

[Install]
WantedBy=multi-user.target
```

### Docker

Создайте `Dockerfile`:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["python", "bot.py"]
```

Запустите:

```bash
docker build -t telegram-bot .
docker run -e BOT_TOKEN=your_token telegram-bot
```

## 📝 Редактирование бота

Для изменения логики бота:

1. Откройте проект в BotBuilder
2. Внесите изменения в сценарии
3. Экспортируйте обновлённый `bot-config.json`
4. Замените файл на сервере
5. Перезапустите бота

## 📊 Конфигурация

Файл `bot-config.json` содержит:

- **scenes** — сценарии диалогов
- **variables** — переменные для хранения данных
- **integrations** — внешние интеграции

### Пример сценария

```json
{
  "id": "start",
  "name": "Главное меню",
  "trigger": "/start",
  "message": "Добро пожаловать!",
  "blocks": [
    {
      "type": "keyboard",
      "keyboardType": "inline",
      "buttons": [
        {"text": "О нас", "callback": "about"},
        {"text": "Контакты", "callback": "contacts"}
      ]
    }
  ]
}
```

## 🔧 Типы блоков

| Тип | Описание |
|-----|----------|
| `message` | Отправка сообщения |
| `question` | Вопрос пользователю |
| `condition` | Условие (если-то) |
| `action` | Действие (переменная, API, задержка) |
| `keyboard` | Клавиатура с кнопками |

## ⚠️ Troubleshooting

**Бот не запускается:**
- Проверьте токен в `.env`
- Убедитесь, что `bot-config.json` существует
- Проверьте логи: `python bot.py` покажет ошибку

**Бот не отвечает:**
- Проверьте, что бот добавлен в @BotFather
- Убедитесь, что сценарий `/start` существует

**Ошибка при загрузке файлов:**
- Проверьте права доступа к файлам
- Убедитесь, что все зависимости установлены

---

Создано в **BotBuilder** 🤖

[BotBuilder GitHub](https://github.com/yourusername/botbuilder)
