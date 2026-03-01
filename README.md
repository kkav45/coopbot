# 🤖 BotBuilder — No-Code Конструктор Telegram Ботов

Создавайте Telegram ботов без программирования! Визуальный редактор сценариев, экспорт в JSON, публикация на GitHub и хостинг на S3.

![BotBuilder](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## ✨ Возможности

### 🎨 Визуальный редактор
- **Блочная структура** — создавайте сценарии из готовых блоков
- **Drag-and-drop** — перемещайте блоки местами
- **Типы блоков:**
  - 💬 Сообщение — отправка текста
  - ❓ Вопрос — запрос данных у пользователя
  - 🔀 Условие — логика ветвления
  - ⚡ Действие — переменные, API, задержки
  - ⌨️ Клавиатура — inline и reply кнопки
  - 🗄️ База данных — CRUD операции с Google Sheets
  - 🔁 Цикл — итерация по данным

### 📱 Telegram Mini Apps
- **Конструктор приложений** — визуальный редактор веб-интерфейса
- **Компоненты:** текст, кнопки, поля ввода, списки, карточки, таблицы
- **Интеграция с ботом** — отправка данных из Mini App в бота
- **Экспорт HTML** — готовое приложение для деплоя

### 🗄️ База данных
- **Google Sheets** — используйте таблицы как базу данных
- **CRUD операции** — создание, чтение, обновление, удаление записей
- **Подстановка переменных** — используйте `{{variable}}` в запросах
- **Просмотр данных** — просмотр таблиц прямо в конструкторе

### 💾 Экспорт и хранение
- **JSON экспорт** — вся конфигурация в одном файле
- **GitHub интеграция** — авто-публикация в репозиторий
- **Авто-синхронизация** — публикация при каждом изменении
- **S3 поддержка** — хранение медиафайлов (AWS S3, Cloudflare R2, DigitalOcean Spaces)

### 🚀 Деплой
- **GitHub Actions** — автоматический деплой при изменениях
- **Railway** — деплой в один клик
- **Render** — автоматический деплой из репозитория
- **VPS** — скрипты для ручного деплоя

### 🚀 Готовый к запуску
- **Python раннер** — универсальный бот на aiogram
- **Docker готов** — контейнеризация из коробки
- **Хостинг** — Railway, Render, VPS

## 📁 Структура проекта

```
bot-builder/
├── index.html              # Главный экран конструктора
├── css/
│   ├── style.css           # Основные стили
│   └── builder.css         # Стили редактора
├── js/
│   ├── app.js              # Основная логика
│   ├── builder.js          # Визуальный редактор
│   ├── exporter.js         # Экспорт в JSON
│   ├── github-api.js       # GitHub интеграция
│   ├── s3-api.js           # S3 интеграция
│   └── ui.js               # UI утилиты
├── templates/
│   └── bot-template/       # Шаблон готового бота
│       ├── bot.py
│       ├── bot-config.json
│       ├── requirements.txt
│       ├── .env.example
│       └── README.md
└── README.md
```

## 🚀 Быстрый старт

### 1. Откройте конструктор

Просто откройте `index.html` в браузере. Сервер не требуется!

### 2. Настройте автоматическую загрузку в GitHub ⭐

**Быстрая инструкция (5 минут):**

1. **Создайте токен:** https://github.com/settings/tokens (scope: **repo**)
2. **Добавьте секрет в GitHub:**
   - Репозиторий → Settings → Secrets and variables → Actions
   - Создайте секрет `GH_PAT` со значением вашего токена
3. **Подключитесь в конструкторе:**
   - Откройте `index.html`
   - **⚙️ Настройки** → **GitHub интеграция**
   - Введите токен, username (`kkav45`), репозиторий (`coopbot`)
   - Нажмите **Подключить**
4. **Включите авто-синхронизацию**

📖 Подробная инструкция: [docs/AUTO_UPLOAD_SETUP.md](docs/AUTO_UPLOAD_SETUP.md)

### 3. Создайте бота

1. Нажмите **"Создать бота"**
2. Введите название и токен из @BotFather
3. Нажмите **"Создать"**

### 4. Настройте сценарии

1. Добавьте сценарии (например: `/start`, `/help`, `catalog`)
2. Добавьте блоки в сценарии
3. Настройте кнопки и переходы

### 5. Опубликуйте

- **🚀 Опубликовать** — загрузить в GitHub
- **💾 Экспорт** — скачать JSON
- **🔁 Авто-синхронизация** — авто-публикация при изменении

### 6. Запустите бота

**Вариант А: Локально (для теста)**
```bash
git clone https://github.com/username/repo.git
cd repo/bots/bot-name
cp .env.example .env
# Вставьте токен в .env
pip install -r requirements.txt
python bot.py
```

**Вариант Б: Railway (бесплатно)**
1. https://railway.app → New Project
2. Deploy from GitHub
3. Добавьте `BOT_TOKEN` в переменные
4. Бот запустится автоматически

**Вариант В: VPS**
См. [инструкцию по деплою](docs/DEPLOY_GUIDE.md)

### 7. Проверьте работоспособность

Откройте чек-лист: [docs/CHECKLIST.md](docs/CHECKLIST.md)

## 🛠️ Настройка

### GitHub интеграция

1. Создайте Personal Access Token:
   - Settings → Developer settings → Personal access tokens
   - Выберите scope: `repo`
2. В конструкторе: Настройки → GitHub
3. Введите токен, username, имя репозитория

### S3 хранилище

Поддерживаются S3-совместимые хранилища:

| Провайдер | Endpoint |
|-----------|----------|
| AWS S3 | `https://s3.amazonaws.com` |
| Cloudflare R2 | `https://<account>.r2.cloudflarestorage.com` |
| DigitalOcean Spaces | `https://<region>.digitaloceanspaces.com` |
| MinIO | Ваш URL |

## 📦 Деплой бота

### Вариант 1: Railway (рекомендуется)

1. Создайте репозиторий на GitHub
2. Опубликуйте бота через конструктор
3. В [Railway](https://railway.app) создайте новый проект
4. Подключите репозиторий
5. Добавьте переменную `BOT_TOKEN`
6. Бот запустится автоматически

### Вариант 2: Render

1. Опубликуйте бота на GitHub
2. В [Render](https://render.com) создайте Web Service
3. Подключите репозиторий
4. Команда: `python bot.py`
5. Добавьте `BOT_TOKEN`

### Вариант 3: VPS

```bash
# Клонируйте репозиторий
git clone https://github.com/username/repo.git
cd repo/bots/bot-name

# Установите зависимости
pip install -r requirements.txt

# Создайте .env
cp .env.example .env
# Отредактируйте .env, укажите BOT_TOKEN

# Запустите
python bot.py
```

### Вариант 4: Docker

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["python", "bot.py"]
```

```bash
docker build -t my-bot .
docker run -e BOT_TOKEN=your_token my-bot
```

## 📊 Типы блоков

### Сообщение
Отправляет текст пользователю. Поддерживает HTML и Markdown.

### Вопрос
Запрашивает данные и сохраняет в переменную.

```json
{
  "type": "question",
  "text": "Как вас зовут?",
  "variable": "user_name"
}
```

### Условие
Ветвление логики по значению переменной.

```json
{
  "type": "condition",
  "variable": "user_status",
  "operator": "equals",
  "value": "vip",
  "trueScenario": "vip_menu",
  "falseScenario": "default_menu"
}
```

Операторы: `equals`, `not_equals`, `contains`, `empty`, `not_empty`, `greater`, `less`

### Действие
Выполняет действие:

| actionType | Описание |
|------------|----------|
| `set_variable` | Установить переменную |
| `clear_variable` | Очистить переменную |
| `delay` | Задержка (мс) |
| `api_request` | HTTP запрос |
| `send_message` | Доп. сообщение |

### Клавиатура
Создаёт кнопки для выбора.

```json
{
  "type": "keyboard",
  "keyboardType": "inline",
  "buttons": [
    {"text": "О нас", "callback": "about"},
    {"text": "Контакты", "callback": "contacts"}
  ]
}
```

## 🔌 Интеграции

### HTTP запросы

Блок "Действие" → `api_request`:

```json
{
  "type": "action",
  "actionType": "api_request",
  "url": "https://api.example.com/users",
  "method": "GET"
}
```

Ответ сохраняется в `api_response`.

### Google Sheets

Требуется дополнительный скрипт. См. документацию.

### AI ассистенты

Интеграция с ChatGPT через API запросы.

## 🎯 Примеры использования

### 🛒 Интернет-магазин
- Каталог товаров
- Корзина и заказ
- Оплата через Telegram Payments

### 📞 Служба поддержки
- FAQ с кнопками
- Сбор заявки
- Передача оператору

### 📅 Запись на услуги
- Выбор услуги
- Выбор времени
- Напоминания

### 🎓 Онлайн-школа
- Тесты и викторины
- Прогресс ученика
- Выдача сертификатов

## 📝 Переменные

Переменные хранят данные пользователя:

```
user_name       — имя пользователя
user_phone      — телефон
user_email      — email
cart_items      — товары в корзине
order_total     — сумма заказа
```

Доступ в Python: `get_variable(user_id, 'user_name')`

## ⚠️ Ограничения

- Максимум 100 сценариев на бота
- Максимум 50 блоков в сценарии
- Размер JSON до 1 MB

## 🐛 Troubleshooting

**Конструктор не открывается:**
- Убедитесь, что используете современный браузер
- Откройте консоль (F12) для ошибок

**Бот не запускается:**
- Проверьте токен в `.env`
- Убедитесь, что `bot-config.json` существует
- Запустите `python bot.py` для просмотра ошибок

**GitHub ошибка публикации:**
- Проверьте токен (scope: repo)
- Убедитесь, что репозиторий существует
- Проверьте username

## 📚 Документация

### Для начала работы

| Документ | Описание |
|----------|----------|
| [📖 Как проверить бота](docs/HOW_TO_CHECK.md) | **Быстрая проверка (3 мин)** |
| [✅ Чек-лист](docs/CHECKLIST.md) | Полная проверка работоспособности |
| [🚀 Деплой](docs/DEPLOY_GUIDE.md) | Подробное руководство по деплою |
| [⚡ Quick Start](docs/QUICKSTART.md) | Быстрый старт |

### Интеграции

| Документ | Описание |
|----------|----------|
| [🗄️ Google Sheets](docs/GOOGLE_SHEETS_SETUP.md) | Настройка базы данных |
| [📱 Mini Apps](docs/MINI_APPS.md) | Создание веб-приложений |
| [🔄 Auto Deploy](docs/AUTO_DEPLOY.md) | Авто-загрузка в GitHub |

### Кибердеревня

| Документ | Описание |
|----------|----------|
| [🤖 Архитектура](docs/CYBER_VILLAGE.md) | Система ботов-специалистов |
| [🛠️ Реализация](docs/CYBER_VILLAGE_IMPLEMENTATION.md) | Руководство по созданию |

## 📄 Лицензия

MIT License — используйте свободно в личных и коммерческих проектах.

## 🤝 Contributing

Принимаются PR с улучшениями!

## 🔗 Ссылки

- [Telegram Bot API](https://core.telegram.org/bots/api)
- [aiogram документация](https://docs.aiogram.dev/)
- [Railway деплой](https://railway.app/)
- [Cloudflare R2](https://www.cloudflare.com/developer-platform/r2/)

---

**Создано с ❤️ для сообщества No-Code разработчиков**
