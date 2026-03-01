# 🚀 Настройка автоматической загрузки ботов в GitHub

Автоматическая публикация ботов в репозиторий [kkav45/coopbot](https://github.com/kkav45/coopbot).

## Быстрая настройка

### 1. Создайте GitHub Personal Access Token

1. Откройте [GitHub Settings → Developer settings](https://github.com/settings/tokens)
2. Нажмите **Generate new token (classic)**
3. Выберите scope: **`repo`** (Full control of private repositories)
4. Нажмите **Generate token**
5. **Скопируйте токен** — он покажется только один раз!

### 2. Подключитесь в конструкторе

1. Откройте конструктор ботов
2. Перейдите в **Настройки** → **GitHub интеграция**
3. Введите:
   - **Token**: ваш Personal Access Token
   - **Repository**: `coopbot`
   - **Username**: `kkav45`
4. Нажмите **Подключить**

### 3. Включите авто-синхронизацию

1. В **Настройки** → **Авто-синхронизация**
2. Включите переключатель
3. Теперь при каждом изменении бота он автоматически публикуется в GitHub

## Структура репозитория

```
coopbot/
├── bots/
│   ├── my_shop_bot/
│   │   ├── bot-config.json
│   │   ├── bot.py
│   │   ├── requirements.txt
│   │   ├── .env.example
│   │   └── README.md
│   └── support_bot/
│       └── ...
├── .github/
│   └── workflows/
│       ├── deploy-bot.yml      # Деплой бота
│       └── auto-commit.yml     # Авто-коммиты
└── README.md
```

## GitHub Actions Workflow

### deploy-bot.yml

Автоматически разворачивает бота при изменении файлов:

```yaml
on:
  push:
    paths:
      - 'bots/**'
```

**Что делает:**
1. Обнаруживает изменения в папке `bots/`
2. Определяет имя изменённого бота
3. Устанавливает Python 3.11
4. Устанавливает зависимости
5. Деплоит на Railway или Render (если настроено)

### auto-commit.yml

Автоматически коммитит изменения:

```yaml
on:
  repository_dispatch:
    types: [bot_update]
```

## Настройка секретов GitHub

Для работы workflow добавьте секреты в репозиторий:

### 1. GitHub Personal Access Token (для авто-коммитов)

Settings → Secrets and variables → Actions → New repository secret:

- **Name**: `GH_PAT`
- **Value**: ваш Personal Access Token

### 2. Railway API Key (опционально)

- **Name**: `RAILWAY_API_KEY`
- **Value**: ваш токен из [Railway](https://railway.app)

### 3. Render API Key (опционально)

- **Name**: `RENDER_API_KEY`
- **Value**: ваш токен из [Render](https://render.com)
- **Name**: `RENDER_SERVICE_ID`
- **Value**: ID сервиса Render

## Использование

### Публикация бота

1. Создайте бота в конструкторе
2. Нажмите **🚀 Опубликовать** в редакторе
3. Бот загрузится в папку `bots/{username}/`

### Авто-публикация

Если включена авто-синхронизация:
- Любое изменение бота автоматически публикуется
- Не нужно нажимать кнопку "Опубликовать"

### Ручной деплой через Actions

1. Откройте вкладку **Actions** в репозитории
2. Выберите workflow **Deploy Telegram Bot**
3. Нажмите **Run workflow**
4. Укажите имя бота (username)
5. Нажмите **Run workflow**

## Команды для разработки

### Локальная синхронизация

```bash
# Клонировать репозиторий
git clone https://github.com/kkav45/coopbot.git
cd coopbot

# Получить последние изменения
git pull origin main

# Запушить локальные изменения
git add bots/my_bot/
git commit -m "Update my_bot"
git push origin main
```

### Проверка статуса

```bash
# Показать всех ботов
ls -la bots/

# Показать изменения
git status

# Показать историю изменений бота
git log -- bots/my_bot/
```

## Интеграция с хостингом

### Railway

1. Создайте проект на [Railway](https://railway.app)
2. Подключите GitHub репозиторий `coopbot`
3. В настройках проекта укажите:
   - **Root Directory**: `bots/{bot_username}`
   - **Start Command**: `python bot.py`
4. Добавьте переменные окружения:
   - `BOT_TOKEN=your_token`

### Render

1. Создайте Web Service на [Render](https://render.com)
2. Подключите репозиторий `coopbot`
3. Настройки:
   - **Root Directory**: `bots/{bot_username}`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python bot.py`
4. Добавьте Environment Variables:
   - `BOT_TOKEN=your_token`

### VPS

Для деплоя на VPS используйте скрипт:

```bash
#!/bin/bash
# deploy.sh

BOT_NAME=$1
SERVER_USER=user
SERVER_HOST=your.server.com
SERVER_PATH=/var/www/bots

# Копирование файлов
scp -r bots/$BOT_NAME $SERVER_USER@$SERVER_HOST:$SERVER_PATH/

# Перезапуск бота на сервере
ssh $SERVER_USER@$SERVER_HOST "
  cd $SERVER_PATH/$BOT_NAME &&
  pip install -r requirements.txt &&
  systemctl restart $BOT_NAME
"
```

## Troubleshooting

### Workflow не запускается

1. Проверьте, включены ли Actions в репозитории
2. Убедитесь, что файл workflow в `.github/workflows/`
3. Проверьте логи в вкладке Actions

### Ошибка аутентификации

1. Обновите Personal Access Token
2. Убедитесь, что у токена есть scope `repo`
3. Проверьте, что токен не истёк

### Бот не деплоится

1. Проверьте, что `BOT_TOKEN` добавлен в переменные окружения хостинга
2. Убедитесь, что путь к боту правильный: `bots/{username}/`
3. Проверьте логи деплоя в хостинге

## API для автоматизации

### Отправка webhook для авто-коммита

```bash
curl -X POST https://api.github.com/repos/kkav45/coopbot/dispatches \
  -H "Accept: application/vnd.github.v3+json" \
  -H "Authorization: token YOUR_TOKEN" \
  -d '{"event_type":"bot_update","client_payload":{"bot":"my_bot"}}'
```

### Получение списка ботов

```bash
curl https://api.github.com/repos/kkav45/coopbot/contents/bots \
  -H "Accept: application/vnd.github.v3+json" \
  -H "Authorization: token YOUR_TOKEN"
```

## Безопасность

### 🔒 Никогда не коммитьте `.env` файлы!

В `.gitignore` уже добавлено:
```
.env
*.env
.env.local
```

### Используйте .env.example

Для каждого бота создавайте `.env.example` без чувствительных данных:
```env
BOT_TOKEN=your_bot_token_here
GOOGLE_SHEET_ID=your_sheet_id
```

### Ограничьте доступ к токену

- Personal Access Token храните только в GitHub Secrets
- Не передавайте токен через чаты/почту
- Регулярно обновляйте токены

## 📚 Дополнительные ресурсы

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Creating a Personal Access Token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens)
- [Railway Deploy Guide](https://docs.railway.app/deploy)
- [Render Deploy Guide](https://render.com/docs/deploy)

---

**Готово!** Теперь ваши боты автоматически публикуются в GitHub при каждом изменении! 🎉
