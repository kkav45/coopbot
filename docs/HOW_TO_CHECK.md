# 🎯 Как проверить бота после создания

**Краткая инструкция на 3 минуты**

---

## Шаг 1: GitHub токен (1 мин)

1. Откройте: https://github.com/settings/tokens
2. **Generate new token (classic)**
3. Scope: ✅ **repo**
4. **Скопируйте токен** 🔑

---

## Шаг 2: Подключение в конструкторе (1 мин)

1. Откройте `index.html`
2. **⚙️ Настройки** → **GitHub интеграция**
3. Введите:
   - **Token**: ваш токен
   - **Repository**: `coopbot`
   - **Username**: `kkav45`
4. **Подключить** ✅

---

## Шаг 3: Публикация бота (30 сек)

1. **📊 Мои боты** → выберите бота
2. **✏️ Редактировать**
3. **🚀 Опубликовать**
4. Готово!

---

## Шаг 4: Проверка (30 сек)

1. Откройте: https://github.com/kkav45/coopbot/tree/main/bots
2. Найдите папку с вашим ботом
3. Файлы на месте? ✅

```
bots/your_bot/
├── bot-config.json      ✅
├── bot.py               ✅
├── requirements.txt     ✅
└── .env.example         ✅
```

---

## Шаг 5: Запуск (2 мин)

```bash
# 1. Клонируйте
git clone https://github.com/kkav45/coopbot.git
cd coopbot/bots/your_bot

# 2. Создайте .env
cp .env.example .env

# 3. Вставьте токен в .env
notepad .env
# BOT_TOKEN=123456789:ABCdef...

# 4. Установите зависимости
pip install -r requirements.txt

# 5. Запустите
python bot.py
```

**Видите это?**
```
🤖 Бот 'Имя' запущен...
```
✅ **Отлично!**

---

## Шаг 6: Тест в Telegram (30 сек)

1. Откройте Telegram
2. Найдите: `@ваш_бот`
3. Отправьте: `/start`
4. Бот ответил? ✅ **Готово!**

---

## 🐛 Если не работает

| Проблема | Решение |
|----------|---------|
| GitHub не подключается | Пересоздайте токен |
| Файлов нет в GitHub | Нажмите "🚀 Опубликовать" |
| Бот не запускается | `pip install -r requirements.txt` |
| Бот молчит | Проверьте токен в `.env` |
| Ошибка ModuleNotFoundError | `pip install aiogram` |

---

## 📚 Подробная инструкция

- [Полное руководство по деплою](DEPLOY_GUIDE.md)
- [Чек-лист проверки](CHECKLIST.md)
- [Быстрый старт](QUICKSTART.md)

---

**Успех!** 🎉 Ваш бот работает!
