# 🚀 Как подключить бота к GitHub и запустить

Пошаговая инструкция после создания бота в конструкторе.

## 📋 Шаг 1: Создание бота в конструкторе

1. Откройте конструктор (файл `index.html` в браузере)
2. Вкладка **"➕ Создать бота"**
3. Заполните:
   - **Название**: Мой тестовый бот
   - **Username**: my_test_bot (без @)
   - **Токен**: из @BotFather
   - **Описание**: Тестовый бот
4. Нажмите **"Создать бота"**

---

## 📋 Шаг 2: Настройка GitHub интеграции

### 2.1. Создайте Personal Access Token

1. Перейдите: https://github.com/settings/tokens
2. Нажмите **"Generate new token (classic)"**
3. Заполните:
   - **Note**: `BotBuilder Token`
   - **Expiration**: 90 дней (или No expiration)
   - **Scope**: ✅ **repo** (Full control of private repositories)
4. Нажмите **"Generate token"**
5. **🔴 Скопируйте токен** — он покажется только один раз!

### 2.2. Подключитесь в конструкторе

1. В конструкторе перейдите в **"⚙️ Настройки"**
2. Раздел **"GitHub интеграция"**:
   - **Token**: вставьте ваш токен
   - **Repository**: `coopbot` (или ваш репозиторий)
   - **Username**: `kkav45` (или ваш username)
3. Нажмите **"Подключить"**
4. Должно появиться: ✅ **"GitHub успешно подключён!"**

### 2.3. Включите авто-синхронизацию (опционально)

1. В **"Настройки"** → **"Авто-синхронизация"**
2. Включите переключатель
3. Теперь бот будет автоматически публиковаться при каждом изменении

---

## 📋 Шаг 3: Публикация бота

### Вариант А: Ручная публикация

1. В редакторе бота нажмите **"🚀 Опубликовать"**
2. Подтвердите публикацию
3. Бот загрузится в папку: `bots/{username}/`

### Вариант Б: Авто-публикация

Если включена авто-синхронизация:
- Любое изменение бота автоматически публикуется
- Кнопку нажимать не нужно

---

## 📋 Шаг 4: Проверка в GitHub

1. Откройте: https://github.com/kkav45/coopbot
2. Перейдите в папку: `bots/{ваш_username}/`
3. Должны быть файлы:
   ```
   bots/my_test_bot/
   ├── bot-config.json      # Конфигурация бота
   ├── bot.py               # Python-раннер
   ├── requirements.txt     # Зависимости
   ├── .env.example         # Пример .env
   └── README.md            # Инструкция
   ```

---

## 📋 Шаг 5: Проверка работоспособности

### 5.1. Быстрая проверка (без деплоя)

**Проверка файлов:**

1. Откройте `bot-config.json` в GitHub
2. Убедитесь, что там есть ваши сценарии:
   ```json
   {
     "config": {
       "scenes": [
         {
           "id": "start",
           "name": "Главное меню",
           "trigger": "/start",
           "message": "Добро пожаловать!"
         }
       ]
     }
   }
   ```

**Проверка токена:**

1. В @BotFather отправьте `/mybots`
2. Выберите вашего бота
3. Убедитесь, что токен активен

### 5.2. Локальный запуск (рекомендуется)

**Шаг 1: Клонируйте репозиторий**

```bash
git clone https://github.com/kkav45/coopbot.git
cd coopbot
```

**Шаг 2: Перейдите в папку бота**

```bash
cd bots/my_test_bot
```

**Шаг 3: Создайте .env файл**

```bash
# Windows (PowerShell)
Copy-Item .env.example .env
notepad .env

# Linux/Mac
cp .env.example .env
nano .env
```

**Шаг 4: Добавьте токен в .env**

```env
BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
```

**Шаг 5: Установите Python зависимости**

```bash
pip install -r requirements.txt
```

**Шаг 6: Запустите бота**

```bash
python bot.py
```

**Ожидаемый вывод:**
```
🤖 Бот 'Мой тестовый бот' запущен...
Username: @my_test_bot
Нажмите Ctrl+C для остановки
```

**Шаг 7: Проверьте бота в Telegram**

1. Откройте Telegram
2. Найдите бота: `@my_test_bot`
3. Нажмите **/start**
4. Бот должен ответить: "Добро пожаловать!"

### 5.3. Проверка сценариев

Если создавали сценарии в конструкторе:

1. Отправьте боту команду из сценария (например, `/menu`)
2. Бот должен ответить сообщением из сценария
3. Нажмите кнопки — должны работать переходы

---

## 📋 Шаг 6: Деплой на хостинг

### Вариант А: Railway (бесплатно, рекомендуется)

**1. Создайте аккаунт**: https://railway.app

**2. Создайте новый проект**:
- New → Deploy from GitHub repo
- Выберите репозиторий `coopbot`

**3. Настройте переменные окружения**:
- Variables → New Variable
- `BOT_TOKEN` = ваш токен
- `ROOT_DIR` = `bots/my_test_bot`

**4. Деплой**:
- Railway автоматически обнаружит `requirements.txt`
- Build → Deploy

**5. Проверьте логи**:
- Logs → должны быть: "Бот запущен..."

**6. Тест в Telegram**:
- `/start` → бот отвечает

### Вариант Б: Render

**1. Создайте Web Service**: https://render.com

**2. Настройки**:
- **Root Directory**: `bots/my_test_bot`
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `python bot.py`

**3. Environment Variables**:
- `BOT_TOKEN` = ваш токен

**4. Deploy**

### Вариант В: VPS

**1. Подключитесь к серверу**:
```bash
ssh user@your-server.com
```

**2. Клонируйте репозиторий**:
```bash
git clone https://github.com/kkav45/coopbot.git
cd coopbot/bots/my_test_bot
```

**3. Установите зависимости**:
```bash
pip3 install -r requirements.txt
```

**4. Создайте .env**:
```bash
nano .env
# Добавьте: BOT_TOKEN=ваш_токен
```

**5. Запустите через systemd**:

Создайте файл `/etc/systemd/system/my_test_bot.service`:

```ini
[Unit]
Description=Telegram Bot: my_test_bot
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/coopbot/bots/my_test_bot
ExecStart=/usr/bin/python3 bot.py
Restart=always

[Install]
WantedBy=multi-user.target
```

Запустите:
```bash
sudo systemctl daemon-reload
sudo systemctl enable my_test_bot
sudo systemctl start my_test_bot
sudo systemctl status my_test_bot
```

---

## 🐛 Troubleshooting

### Бот не запускается локально

**Ошибка: ModuleNotFoundError**
```bash
pip install -r requirements.txt
```

**Ошибка: BOT_TOKEN not found**
- Проверьте, что `.env` файл в той же папке что и `bot.py`
- Проверьте формат: `BOT_TOKEN=123456...` (без пробелов)

**Ошибка: aiogram version mismatch**
```bash
pip install --upgrade aiogram
```

### Бот не отвечает в Telegram

**Проверьте токен**:
1. В @BotFather: `/mybots` → ваш бот → API Token
2. Сравните с токеном в `.env`

**Проверьте логи**:
```bash
# При локальном запуске смотрите в консоль
# На VPS:
sudo journalctl -u my_test_bot -f
```

**Проверьте сценарии**:
- Убедитесь, что сценарий `/start` существует в `bot-config.json`

### GitHub не подключается

**Ошибка: Bad credentials**
- Пересоздайте Personal Access Token
- Убедитесь, что scope **repo** выбран

**Ошибка: Repository not found**
- Проверьте имя репозитория (чувствительно к регистру)
- Убедитесь, что у токена есть доступ к репозиторию

### Авто-синхронизация не работает

1. Проверьте, что включена: **Настройки** → **Авто-синхронизация** ✅
2. Проверьте подключение к GitHub: **Настройки** → **GitHub** → **Тест**
3. Посмотрите консоль браузера (F12) на ошибки

---

## ✅ Чек-лист проверки

- [ ] Бот создан в конструкторе
- [ ] GitHub токен получен
- [ ] GitHub подключён в настройках
- [ ] Бот опубликован в репозитории
- [ ] Файлы бота видны в GitHub
- [ ] `.env` файл создан с токеном
- [ ] Зависимости установлены (`pip install -r requirements.txt`)
- [ ] Бот запускается локально (`python bot.py`)
- [ ] Бот отвечает на `/start` в Telegram
- [ ] Сценарии работают
- [ ] Кнопки работают

---

## 📚 Дополнительные ресурсы

- [Документация по деплою](docs/AUTO_DEPLOY.md)
- [Настройка GitHub Actions](docs/AUTO_DEPLOY.md#github-actions-workflow)
- [Быстрый старт](docs/QUICKSTART.md)

---

## 🆘 Нужна помощь?

1. Проверьте логи бота
2. Проверьте консоль браузера (F12)
3. Убедитесь, что все шаги выполнены
4. Создайте issue в репозитории

**Успешного запуска!** 🚀
