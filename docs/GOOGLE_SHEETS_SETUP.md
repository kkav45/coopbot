# 📊 Настройка Google Sheets API

Использование Google Таблиц как базы данных для бота.

## Шаг 1: Создание Google Таблицы

1. Создайте новую Google Таблицу: https://sheets.google.com
2. Запомните ID таблицы из URL:
   ```
   https://docs.google.com/spreadsheets/d/1BxiMvs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
                                                ↑ это ID таблицы
   ```
3. Создайте листы (таблицы) с заголовками в первой строке:
   - `Users` — пользователи (user_id, username, name, created_at)
   - `Orders` — заказы (order_id, user_id, total, status, created_at)
   - `Products` — товары (id, name, price, description)

## Шаг 2: Создание Service Account

### 2.1. Google Cloud Console

1. Откройте [Google Cloud Console](https://console.cloud.google.com/)
2. Создайте новый проект или выберите существующий
3. Включите Google Sheets API:
   - API & Services → Library
   - Найдите "Google Sheets API"
   - Нажмите Enable

### 2.2. Создание учётных данных

1. Перейдите в API & Services → Credentials
2. Click "Create Credentials" → "Service Account"
3. Заполните информацию:
   - Service account name: `bot-builder`
   - Service account ID: создастся автоматически
   - Description: `Для бота`
4. Нажмите "Create and Continue"
5. Пропустите роль (не обязательна)
6. Нажмите "Done"

### 2.3. Создание ключа

1. Найдите созданный Service Account в списке
2. Кликните по email аккаунта
3. Перейдите во вкладку "Keys"
4. Click "Add Key" → "Create new key"
5. Выберите тип ключа: **JSON**
6. Нажмите "Create"
7. **Скачается JSON файл** — сохраните его!

### 2.4. JSON ключ содержит:

```json
{
  "type": "service_account",
  "project_id": "your-project",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "bot-builder@your-project.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  ...
}
```

## Шаг 3: Предоставление доступа к таблице

1. Откройте вашу Google Таблицу
2. Нажмите кнопку "Share" (Поделиться)
3. Вставьте **client_email** из Service Account:
   ```
   bot-builder@your-project.iam.gserviceaccount.com
   ```
4. Выберите роль: **Editor** (Редактор)
5. Нажмите "Share"

## Шаг 4: Настройка в конструкторе

### 4.1. В конструкторе ботов

1. Откройте вкладку **"База данных"**
2. Введите **Spreadsheet ID** (из шага 1)
3. Вставьте содержимое **JSON файла** в поле "Service Account JSON"
4. Нажмите **"Подключить"**
5. Нажмите **"Тест"** для проверки

### 4.2. В .env файле бота

```env
GOOGLE_SHEET_ID=1BxiMvs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms
GOOGLE_CREDENTIALS={"type": "service_account", "project_id": "...", ...}
```

**Важно:** JSON должен быть в одной строке! Используйте `json.dumps()` или онлайн-инструменты для минификации.

## Шаг 5: Использование в боте

### Блок "База данных"

Добавьте блок типа "База данных" в сценарий:

#### Создание записи (Create)

```json
{
  "type": "database",
  "dbAction": "create",
  "sheetName": "Users",
  "data": {
    "user_id": "{{user_id}}",
    "username": "{{username}}",
    "name": "{{user_name}}",
    "created_at": "{{now}}"
  }
}
```

#### Чтение записей (Read)

```json
{
  "type": "database",
  "dbAction": "read",
  "sheetName": "Users",
  "where": "user_id={{user_id}}",
  "variable": "user_data"
}
```

#### Обновление (Update)

```json
{
  "type": "database",
  "dbAction": "update",
  "sheetName": "Orders",
  "where": "order_id={{order_id}}",
  "data": {
    "status": "paid"
  }
}
```

#### Удаление (Delete)

```json
{
  "type": "database",
  "dbAction": "delete",
  "sheetName": "Orders",
  "where": "order_id={{order_id}}"
}
```

## Примеры использования

### 📝 Регистрация пользователя

1. Бот запрашивает имя
2. Сохраняет в переменную `user_name`
3. Блок "База данных" → Create:
   ```json
   {
     "user_id": "{{user_id}}",
     "username": "{{username}}",
     "name": "{{user_name}}",
     "created_at": "2026-03-01"
   }
   ```

### 🛒 Оформление заказа

1. Пользователь выбирает товары
2. Бот создаёт заказ в таблице `Orders`:
   ```json
   {
     "order_id": "{{order_id}}",
     "user_id": "{{user_id}}",
     "items": "{{cart_items}}",
     "total": "{{total_price}}",
     "status": "new"
   }
   ```

### 📊 Проверка статуса заказа

1. Пользователь вводит номер заказа
2. Блок "База данных" → Read:
   ```json
   {
     "dbAction": "read",
     "sheetName": "Orders",
     "where": "order_id={{order_id_input}}"
   }
   ```
3. Бот показывает статус из переменной `db_result`

## 🔧 Troubleshooting

### "База данных не подключена"

- Проверьте, установлен ли `google-api-python-client`
- Убедитесь, что `GOOGLE_CREDENTIALS` валидный JSON

### "Ошибка подключения к базе данных"

- Проверьте, что Service Account имеет доступ к таблице
- Убедитесь, что Spreadsheet ID правильный

### "Ничего не найдено"

- Проверьте название таблицы (чувствительно к регистру)
- Убедитесь, что в первой строке заголовки

### "403 Permission denied"

- Откройте доступ к таблице для client_email
- Проверьте, что включён Google Sheets API

## 📚 Дополнительные ресурсы

- [Google Sheets API Documentation](https://developers.google.com/sheets/api)
- [Service Account Authentication](https://cloud.google.com/docs/authentication/production)
- [google-api-python-client](https://github.com/googleapis/google-api-python-client)

---

**Совет:** Для отладки используйте метод `testConnection()` в конструкторе — он покажет ошибку подключения.
