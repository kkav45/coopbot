# 📱 Создание Telegram Mini Apps

Mini Apps — это веб-приложения, которые работают внутри Telegram.

## Что такое Mini Apps

**Telegram Mini Apps** — это обычные веб-сайты, которые открываются прямо в Telegram и могут взаимодействовать с ботом.

### Преимущества

- ✅ Работают на любом устройстве
- ✅ Полный доступ к веб-технологиям (HTML, CSS, JS)
- ✅ Интеграция с Telegram (тема, пользователь, платежи)
- ✅ Красивый UI из коробки

## Быстрый старт

### 1. Создание Mini App в конструкторе

1. Откройте вкладку **"Mini Apps"**
2. Нажмите **"+ Создать Mini App"**
3. Введите название приложения
4. Откроется редактор

### 2. Добавление компонентов

Из палитры компонентов перетащите нужные:

| Компонент | Описание |
|-----------|----------|
| 📝 Текст | Текстовый блок |
| 🔘 Кнопка | Кнопка с действием |
| 📥 Поле ввода | Форма для ввода данных |
| 🖼️ Изображение | Картинка |
| 📋 Список | Список элементов |
| 📦 Карточка | Карточка товара/услуги |
| 📄 Форма | Группа полей |
| 📊 Таблица | Таблица данных |

### 3. Настройка компонентов

Кликните на компонент для редактирования:

#### Текст
```
- Текст содержимое
- Размер шрифта: 16px
- Цвет: #000000
- Выравнивание: left/center/right
```

#### Кнопка
```
- Текст кнопки
- Действие:
  - Нет действия
  - Отправить callback (в бота)
  - Открыть ссылку
  - Перейти на страницу
  - Отправить форму
- Callback данные: `show_catalog`
```

#### Поле ввода
```
- Метка: "Ваше имя"
- Тип: text/number/email/tel/date
- Placeholder: "Введите имя"
- Переменная: `user_name` (куда сохранить)
```

### 4. Создание страниц

Для многостраничных приложений:

1. Нажмите **"+ Страница"**
2. Введите название страницы
3. Переключайтесь между страницами через табы

### 5. Предпросмотр

Нажмите **"👁️ Просмотр"** чтобы открыть приложение в браузере.

### 6. Экспорт

Нажмите **"💾 Экспорт"** для получения:
- JSON конфигурация
- Готовый HTML файл

## Интеграция с ботом

### Вариант 1: Кнопка Menu

```python
from aiogram.types import MenuButtonWebApp, WebAppInfo

await bot.set_chat_menu_button(
    chat_id=user_id,
    menu_button=MenuButtonWebApp(
        text='Открыть приложение',
        web_app=WebAppInfo(url='https://your-app.vercel.app')
    )
)
```

### Вариант 2: Inline кнопка

```python
from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton, WebAppInfo

keyboard = InlineKeyboardMarkup(inline_keyboard=[
    [InlineKeyboardButton(
        text='Открыть каталог',
        web_app=WebAppInfo(url='https://your-app.vercel.app')
    )]
])

await message.answer('Нажмите на кнопку:', reply_markup=keyboard)
```

### Вариант 3: Команда /webapp

Бот автоматически создаёт обработчик для команды `/webapp`.

## Отправка данных в бот

### Из Mini App

```javascript
const tg = window.Telegram.WebApp;

// Отправка данных
function sendData(data) {
    tg.sendData(JSON.stringify(data));
}

// Пример: отправка формы
document.getElementById('submitBtn').addEventListener('click', () => {
    const formData = {
        action: 'submit',
        name: document.getElementById('name').value,
        phone: document.getElementById('phone').value
    };
    sendData(formData);
});
```

### Обработка в боте

```python
@dp.message(lambda msg: msg.web_app_data)
async def handle_webapp_data(message: types.Message):
    data = json.loads(message.web_app_data.data)
    
    # Доступ к данным
    name = data.get('name')
    phone = data.get('phone')
    
    # Сохранение в Google Sheets
    db.create_record('Users', {
        'user_id': str(message.from_user.id),
        'name': name,
        'phone': phone
    })
    
    await message.answer('Данные получены!')
```

## Деплой Mini App

### Вариант 1: Vercel (рекомендуется)

1. Экспортируйте приложение из конструктора
2. Создайте репозиторий на GitHub
3. Подключите репозиторий в [Vercel](https://vercel.com)
4. Приложение автоматически задеплоится

**Структура файлов:**
```
my-mini-app/
├── index.html      # Главное приложение
├── styles.css      # Стили
└── app.js          # Логика
```

### Вариант 2: GitHub Pages

1. Создайте репозиторий `username.github.io`
2. Загрузите файлы приложения
3. Приложение доступно по `https://username.github.io`

### Вариант 3: Любой хостинг

Подойдёт любой статический хостинг:
- Netlify
- Cloudflare Pages
- Render Static Sites
- Ваш VPS

## Настройка в боте

Добавьте в `.env`:

```env
MINI_APP_URL=https://your-app.vercel.app
```

Бот автоматически:
- Добавит команду `/webapp`
- Обрабатывает данные от Mini App
- Сохраняет данные в Google Sheets

## Примеры использования

### 🛒 Интернет-магазин

**Страницы:**
1. Главная — категории товаров
2. Каталог — список товаров
3. Товар — описание, фото, цена
4. Корзина — выбранные товары
5. Оформление — форма заказа

**Компоненты:**
- Карточки товаров
- Список категорий
- Форма заказа
- Кнопки "Купить", "Оформить"

**Интеграция:**
```javascript
// Добавление в корзину
function addToCart(productId) {
    let cart = JSON.parse(localStorage.getItem('cart') || '[]');
    cart.push(productId);
    localStorage.setItem('cart', JSON.stringify(cart));
    tg.sendData({ action: 'add_to_cart', product_id: productId });
}
```

### 📝 Форма обратной связи

**Компоненты:**
- Поле "Имя"
- Поле "Телефон"
- Поле "Сообщение"
- Кнопка "Отправить"

**Отправка:**
```javascript
document.getElementById('submitBtn').addEventListener('click', () => {
    tg.sendData({
        action: 'feedback',
        name: document.getElementById('name').value,
        phone: document.getElementById('phone').value,
        message: document.getElementById('message').value
    });
});
```

### 📊 Личный кабинет

**Страницы:**
1. Профиль — данные пользователя
2. Заказы — история заказов
3. Настройки — предпочтения

**Данные из Google Sheets:**
```javascript
// Загрузка данных пользователя
async function loadUserData() {
    const response = await fetch('/api/user-data');
    const data = await response.json();
    
    document.getElementById('name').value = data.name;
    document.getElementById('email').value = data.email;
}
```

## Telegram WebApp API

### Основные методы

```javascript
const tg = window.Telegram.WebApp;

// Готовность
tg.ready();

// Развернуть на весь экран
tg.expand();

// Закрыть приложение
tg.close();

// Показать главную кнопку
tg.MainButton.setText('Отправить');
tg.MainButton.show();
tg.MainButton.onClick(() => { ... });

// Показать подтверждение
tg.showConfirm('Вы уверены?', (confirmed) => {
    if (confirmed) { ... }
});

// Показать уведомление
tg.showAlert('Сообщение пользователю');

// Отправить данные боту
tg.sendData(JSON.stringify(data));

// Вставить текст в поле ввода
tg.insertText('текст');

// Получить тему
const theme = tg.themeParams;
console.log(theme.bg_color); // Цвет фона
```

### Получение данных пользователя

```javascript
const user = tg.initDataUnsafe.user;

if (user) {
    console.log(user.id);        // ID пользователя
    console.log(user.first_name); // Имя
    console.log(user.username);   // Username
    console.log(user.language_code); // Язык
}
```

## Советы по дизайну

1. **Адаптивность** — используйте viewport meta tag
2. **Тема Telegram** — используйте CSS переменные из темы
3. **Быстрая загрузка** — оптимизируйте изображения
4. **Обратная связь** — показывайте индикаторы загрузки
5. **Нативность** — используйте стили Telegram

## CSS переменные темы

```css
:root {
    --tg-theme-bg-color: #ffffff;
    --tg-theme-text-color: #000000;
    --tg-theme-hint-color: #999999;
    --tg-theme-link-color: #2481cc;
    --tg-theme-button-color: #2481cc;
    --tg-theme-button-text-color: #ffffff;
}

body {
    background-color: var(--tg-theme-bg-color);
    color: var(--tg-theme-text-color);
}

.button {
    background-color: var(--tg-theme-button-color);
    color: var(--tg-theme-button-text-color);
}
```

## 📚 Ресурсы

- [Telegram WebApp Documentation](https://core.telegram.org/bots/webapps)
- [Telegram WebApp API](https://core.telegram.org/bots/webapps#webappinitdata)
- [Vercel Deploy](https://vercel.com/docs)

---

**Создано в BotBuilder** 📱
