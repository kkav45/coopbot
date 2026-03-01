# 🤖 BotBuilder - Автоматическая загрузка на GitHub

## Быстрый старт

### Способ 1: Через скрипт (Windows)

1. **Запустите скрипт:**
   ```
   upload-to-github.cmd
   ```

2. **Введите токен GitHub** когда попросит

3. **Готово!** Файлы загрузятся автоматически

### Способ 2: Вручную (команды)

```bash
# 1. Инициализация
git init
git add .
git commit -m "🤖 BotBuilder initial commit"
git branch -M main
git remote add origin https://github.com/kkav45/coopbot.git

# 2. Загрузка (потребуется токен)
git push -u origin main
```

### Способ 3: GitHub CLI (самый простой)

```bash
# 1. Авторизация
gh auth login

# 2. Загрузка
git push -u origin main
```

---

## 🔐 Настройка секретов GitHub

После загрузки создайте секрет `GH_PAT`:

1. Откройте: https://github.com/kkav45/coopbot/settings/secrets/actions
2. Нажмите **New repository secret**
3. Создайте:
   - **Name**: `GH_PAT`
   - **Value**: ваш Personal Access Token

---

## ✅ Проверка

1. Откройте https://github.com/kkav45/coopbot
2. Проверьте, что файлы загружены
3. Откройте https://github.com/kkav45/coopbot/actions
4. Убедитесь, что Actions включены

---

## 🚀 Авто-загрузка настроена!

Теперь при сохранении ботов в конструкторе они будут автоматически загружаться в GitHub!
