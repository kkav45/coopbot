# 🚀 Настройка автоматической загрузки в GitHub

## Быстрая инструкция (5 минут)

### Шаг 1: Создайте GitHub Personal Access Token

1. Перейдите по ссылке: https://github.com/settings/tokens
2. Нажмите **Generate new token (classic)**
3. Введите название: `BotBuilder Auto-Deploy`
4. Выберите scope: **✅ repo** (Full control of private repositories)
5. Нажмите **Generate token**
6. **Скопируйте токен** и сохраните в надёжном месте

### Шаг 2: Добавьте секрет в GitHub

1. Откройте репозиторий: https://github.com/kkav45/coopbot
2. Перейдите в **Settings** → **Secrets and variables** → **Actions**
3. Нажмите **New repository secret**
4. Добавьте секрет:
   - **Name**: `GH_PAT`
   - **Value**: ваш Personal Access Token из шага 1
5. Нажмите **Add secret**

### Шаг 3: Подключитесь в конструкторе ботов

1. Откройте `index.html` в браузере
2. Перейдите в **⚙️ Настройки**
3. Заполните поля:
   - **GitHub Token**: ваш Personal Access Token
   - **Repository**: `coopbot`
   - **Username**: `kkav45`
4. Нажмите **Подключить**
5. Включите **Авто-синхронизация** (переключатель)

### Шаг 4: Проверьте работу

1. Создайте или отредактируйте бота
2. Нажмите **💾 Сохранить** или **🚀 Опубликовать**
3. Проверьте репозиторий: https://github.com/kkav45/coopbot/commits/main
4. Должен появиться коммит с сообщением "🤖 Auto-commit bot updates"

---

## ✅ Готово!

Теперь при каждом изменении бота изменения автоматически загружаются в GitHub!

## 📁 Структура репозитория

```
coopbot/
├── bots/
│   └── {username_bot}/
│       ├── bot-config.json      # Конфигурация
│       ├── bot.py               # Код бота
│       ├── requirements.txt     # Зависимости
│       ├── .env.example         # Пример переменных
│       └── README.md            # Документация
├── .github/workflows/
│   ├── auto-commit.yml          # Авто-коммиты
│   └── deploy-bot.yml           # Деплой на хостинг
└── README.md
```

## 🔧 Дополнительные настройки

### Деплой на Railway (опционально)

1. Создайте проект на https://railway.app
2. Подключите репозиторий `coopbot`
3. В настройках укажите:
   - **Root Directory**: `bots/{bot_username}`
   - **Start Command**: `python bot.py`
4. Добавьте переменную: `BOT_TOKEN=ваш_токен`

### Деплой на Render (опционально)

1. Создайте Web Service на https://render.com
2. Подключите репозиторий
3. Настройки:
   - **Root Directory**: `bots/{bot_username}`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python bot.py`
4. Добавьте переменную: `BOT_TOKEN=ваш_токен`

## 🐛 Troubleshooting

### Workflow не запускается

1. Проверьте вкладку **Actions** в репозитории
2. Убедитесь, что Actions включены
3. Проверьте логи workflow

### Ошибка аутентификации

1. Обновите Personal Access Token
2. Убедитесь, что у токена есть scope `repo`
3. Проверьте секрет `GH_PAT` в настройках репозитория

### Бот не загружается

1. Проверьте консоль браузера (F12) на ошибки
2. Убедитесь, что токен введён правильно
3. Проверьте, что репозиторий существует

## 📚 Документация

- [GitHub Actions](https://docs.github.com/en/actions)
- [Personal Access Tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens)
- [Railway Deploy](https://docs.railway.app/)
- [Render Deploy](https://render.com/docs)
