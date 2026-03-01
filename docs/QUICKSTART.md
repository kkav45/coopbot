# ⚡ Быстрый старт — Настройка за 5 минут

## 1. Настройка GitHub (2 минуты)

### Создайте Personal Access Token

1. Перейдите: https://github.com/settings/tokens
2. **Generate new token (classic)**
3. Scope: **`repo`** ✅
4. Скопируйте токен 🔑

### Подключитесь в конструкторе

1. Откройте `index.html` в браузере
2. Вкладка **⚙️ Настройки**
3. GitHub интеграция:
   - **Token**: вставьте токен
   - **Repository**: `coopbot`
   - **Username**: `kkav45`
4. Нажмите **Подключить** ✅
5. Включите **Авто-синхронизация** 🔁

## 2. Создание бота (2 минуты)

1. Вкладка **➕ Создать бота**
2. Заполните:
   - **Название**: Мой бот
   - **Username**: my_test_bot
   - **Токен**: из @BotFather
3. Нажмите **Создать**

## 3. Настройка сценария (1 минута)

1. Редактор бота
2. Добавьте блок **💬 Сообщение**:
   - Текст: "Привет! Я тестовый бот"
3. Нажмите **💾 Сохранить**

Бот автоматически опубликован в GitHub! ✅

## 4. Проверка (30 секунд)

1. Откройте: https://github.com/kkav45/coopbot/tree/main/bots/my_test_bot
2. Вы увидите файлы бота:
   - `bot-config.json`
   - `bot.py`
   - `requirements.txt`
   - `.env.example`
   - `README.md`

## 5. Запуск бота (опционально)

### Вариант A: Railway (бесплатно)

```bash
# В папке бота создайте .env
echo "BOT_TOKEN=your_token" > .env

# Задеплойте на Railway
# https://railway.app → New Project → Deploy from GitHub
```

### Вариант B: Локально

```bash
cd bots/my_test_bot
pip install -r requirements.txt
python bot.py
```

## 🎉 Готово!

Ваш бот:
- ✅ Создан в конструкторе
- ✅ Опубликован в GitHub
- ✅ Готов к деплою

## 📚 Что дальше?

- [Настройка Google Sheets](GOOGLE_SHEETS_SETUP.md) — база данных
- [Создание Mini Apps](MINI_APPS.md) — веб-интерфейс
- [Авто-деплой](AUTO_DEPLOY.md) — настройка CI/CD

---

**Нужна помощь?** Откройте [документацию](../docs/) или создайте issue.
