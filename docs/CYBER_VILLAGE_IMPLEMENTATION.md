# 🤖 Cyber Village — Реализация системы ботов

Готовая архитектура и шаблоны для создания 4 ботов-специалистов.

## 📁 Структура проекта

```
cyber_village/
├── bots/
│   ├── accountant/       # 💰 Бухгалтер
│   │   ├── bot.py
│   │   ├── finance_engine.py
│   │   └── config.json
│   │
│   ├── seller/           # 🛒 Продавец-консультант
│   │   ├── bot.py
│   │   ├── catalog.py
│   │   └── sales_engine.py
│   │
│   ├── manager/          # 🎯 Топ-менеджер
│   │   ├── bot.py
│   │   ├── monitoring.py
│   │   └── analytics.py
│   │
│   └── alternative/      # ⚡ Альтернативщик
│       ├── bot.py
│       ├── debate_engine.py
│       └── critique.py
│
├── core/
│   ├── message_bus.py    # ✅ Межботовая коммуникация
│   ├── knowledge_base.py
│   └── ai_engine.py
│
├── templates/
│   └── cyber_village/
│       ├── message_bus.py       # ✅ Готов
│       ├── accountant_bot.py    # ✅ Готов
│       ├── seller_bot.py        # ⏳ Шаблон
│       ├── manager_bot.py       # ⏳ Шаблон
│       └── alternative_bot.py   # ⏳ Шаблон
│
├── knowledge_base/
│   ├── common/
│   ├── accountant/
│   ├── seller/
│   ├── manager/
│   └── alternative/
│
├── docker-compose.yml
└── requirements.txt
```

## ✅ Что уже реализовано

### 1. Message Bus (message_bus.py)

**Готово!** Система межботовой коммуникации:

```python
from message_bus import message_bus, Message

# Подписка бота
message_bus.subscribe_bot("accountant_bot", handler)

# Отправка запроса
response = await message_bus.request(
    from_bot="seller_bot",
    to_bot="accountant_bot",
    topic="finance.create_invoice",
    content={"order_id": "123", "amount": 10000}
)

# Ответ
await message_bus.respond(message, {"status": "ok"})

# Рассылка всем
await message_bus.broadcast(
    from_bot="manager_bot",
    topic="strategy.discussion",
    content={"question": "Как увеличить продажи?"}
)
```

**Функции:**
- ✅ Pub/Sub (публикация/подписка)
- ✅ Request/Response
- ✅ Приоритеты сообщений
- ✅ Таймауты
- ✅ История сообщений

### 2. Бот-Бухгалтер (accountant_bot.py)

**Готово!** Финансовый бот:

**Команды:**
```
/start - Приветствие
/report - Финансовый отчёт
/cashflow - Движение денег
/invoice - Создать счёт
/tax - Расчёт налогов
/transactions - История операций
```

**Функции:**
- ✅ Учёт доходов/расходов
- ✅ Создание счетов
- ✅ Финансовые отчёты (P&L)
- ✅ Движение денег (Cash Flow)
- ✅ Расчёт налогов (УСН 6%)
- ✅ Интеграция с Message Bus

**Пример использования:**
```python
# Создание счёта
invoice = finance_engine.create_invoice(
    order_id="ORD-123",
    amount=10000,
    customer="ООО Ромашка"
)

# Финансовый отчёт
report = finance_engine.get_financial_report("month")
# Результат: {income: ..., expense: ..., profit: ..., tax: ...}
```

---

## 📋 Шаблоны для остальных ботов

### 3. Бот-Продавец (seller_bot.py)

**Статус:** Шаблон готов к заполнению

**Команды:**
```
/start - Приветствие
/catalog - Каталог товаров
/product/{id} - Карточка товара
/recommend - Подбор товаров
/cart - Корзина
/order_create - Оформление заказа
/order_status - Статус заказа
/consultation - Консультация
```

**Структура:**
```python
class SalesEngine:
    def __init__(self):
        self.products = []
        self.orders = {}
        self.customers = {}
    
    def add_product(self, data: Dict) -> Dict:
        """Добавление товара в каталог"""
        pass
    
    def create_order(self, customer_id: str, items: List) -> Dict:
        """Создание заказа"""
        pass
    
    def get_recommendations(self, customer_id: str) -> List:
        """Рекомендации товаров"""
        pass
    
    def get_order_status(self, order_id: str) -> Dict:
        """Статус заказа"""
        pass


# Обработчики команд
@dp.message(Command('catalog'))
async def cmd_catalog(message: types.Message):
    """Показ каталога"""
    pass

@dp.message(Command('order_create'))
async def cmd_order_create(message: types.Message):
    """Создание заказа"""
    # После создания отправляем запрос бухгалтеру
    await message_bus.request(
        from_bot="seller_bot",
        to_bot="accountant_bot",
        topic="finance.create_invoice",
        content={"order_id": order_id, "amount": total}
    )
```

**Интеграции:**
- Message Bus → Бухгалтер (создание счетов)
- Message Bus → Топ-менеджер (отчёт о продажах)
- Google Sheets (каталог товаров)

---

### 4. Бот-Топ-менеджер (manager_bot.py)

**Статус:** Шаблон готов к заполнению

**Команды:**
```
/start - Приветствие
/market_review - Обзор рынка
/competitors - Анализ конкурентов
/trends - Тренды
/strategy - Стратегические рекомендации
/swot - SWOT-анализ
/forecast - Прогноз
/kpi_report - Отчёт по KPI
```

**Структура:**
```python
class AnalyticsEngine:
    def __init__(self):
        self.market_data = {}
        self.competitors = {}
        self.kpis = {}
    
    async def fetch_news(self, query: str) -> List[str]:
        """Получение новостей"""
        # Интеграция с Google News API
        pass
    
    def analyze_competitors(self) -> Dict:
        """Анализ конкурентов"""
        pass
    
    def calculate_kpis(self) -> Dict:
        """Расчёт KPI"""
        pass
    
    def generate_strategy(self, goal: str) -> Dict:
        """Генерация стратегии"""
        # Интеграция с AI (LLM)
        pass


# Обработчики
@dp.message(Command('market_review'))
async def cmd_market_review(message: types.Message):
    """Обзор рынка"""
    # Запрос к AI для анализа
    pass

@dp.message(Command('strategy'))
async def cmd_strategy(message: types.Message):
    """Стратегическая сессия"""
    # Запрашиваем мнения у всех ботов
    await message_bus.broadcast(
        from_bot="manager_bot",
        topic="strategy.discussion",
        content={"question": message.text}
    )
```

**Интеграции:**
- Google News API (мониторинг новостей)
- Social Media API (отзывы)
- AI Engine (генерация рекомендаций)
- Message Bus → Все боты (сбор мнений)

---

### 5. Бот-Альтернативщик (alternative_bot.py)

**Статус:** Шаблон готов к заполнению

**Команды:**
```
/start - Приветствие
/alternatives - Альтернативные решения
/critique - Критика предложения
/risks - Анализ рисков
/optimize - Оптимизация
/what_if - Сценарий "что если"
/compare - Сравнение вариантов
/devil_advocate - Позиция оппонента
```

**Структура:**
```python
class DebateEngine:
    def __init__(self):
        self.risks_db = []
        self.patterns = []
    
    def generate_alternatives(self, proposal: Dict) -> List[Dict]:
        """Генерация альтернатив"""
        pass
    
    def critique(self, proposal: Dict) -> Dict:
        """Критический анализ"""
        return {
            "strengths": [...],
            "weaknesses": [...],
            "risks": [...],
            "alternatives": [...]
        }
    
    def analyze_risks(self, decision: Dict) -> List[Dict]:
        """Анализ рисков"""
        pass
    
    def what_if(self, scenario: Dict) -> Dict:
        """Анализ сценария "что если"""
        pass


# Обработчики
@dp.message(Command('critique'))
async def cmd_critique(message: types.Message):
    """Критика предложения"""
    proposal = message.text.split(None, 1)[1]
    
    critique = debate_engine.critique({"proposal": proposal})
    
    text = format_critique(critique)
    await message.answer(text)
```

**Интеграции:**
- Message Bus → Топ-менеджер (дебаты)
- AI Engine (генерация критики)
- База знаний (паттерны проблем)

---

## 🔗 Сценарии межботового взаимодействия

### Сценарий 1: Оформление продажи

```python
# 1. Продавец создаёт заказ
order = sales_engine.create_order(customer_id, items)

# 2. Продавец → Бухгалтер: создать счёт
invoice_response = await message_bus.request(
    from_bot="seller_bot",
    to_bot="accountant_bot",
    topic="finance.create_invoice",
    content={"order_id": order["id"], "amount": order["total"]}
)

# 3. Бухгалтер создаёт счёт и возвращает ID
invoice_id = invoice_response.content["invoice_id"]

# 4. Продавец → Топ-менеджер: уведомление о продаже
await message_bus.publish(Message.create(
    from_bot="seller_bot",
    to_bot="manager_bot",
    type="notification",
    topic="sales.order_created",
    content={"order_id": order["id"], "amount": order["total"]}
))
```

### Сценарий 2: Стратегическая сессия

```python
# 1. Пользователь спрашивает у Топ-менеджера
# 2. Топ-менеджер рассылает вопрос всем ботам
await message_bus.broadcast(
    from_bot="manager_bot",
    topic="strategy.discussion",
    content={"question": "Как увеличить прибыль?"}
)

# 3. Боты отвечают:
# - Бухгалтер: "Снизить издержки на 15%"
# - Продавец: "Увеличить средний чек на 20%"
# - Альтернативщик: "А может выйти на новый рынок?"

# 4. Топ-менеджер собирает ответы и формирует рекомендацию
```

### Сценарий 3: Дебаты Топ-менеджер ↔ Альтернативщик

```python
# 1. Топ-менеджер предлагает решение
proposal = {"action": "expand_market", "budget": 2000000}

# 2. Альтернативщик критикует
critique = debate_engine.critique(proposal)
# Риски: высокая конкуренция, долгая окупаемость

# 3. Альтернативщик предлагает альтернативу
alternative = {"action": "optimize_current", "savings": 300000}

# 4. Дебаты продолжаются до нахождения оптимального решения
```

---

## 🗄️ База знаний

### Структура

```
knowledge_base/
├── common/
│   ├── company.json        # Информация о компании
│   ├── policies.json       # Политики
│   └── faq.json            # Частые вопросы
│
├── accountant/
│   ├── tax_codes.json      # Налоговый кодекс
│   ├── accounting_rules.json
│   └── templates/
│       ├── invoice.json
│       └── report.json
│
├── seller/
│   ├── products.json       # Товары
│   ├── scripts.json        # Скрипты продаж
│   └── objections.json     # Возражения
│
├── manager/
│   ├── strategies.json     # Стратегии
│   ├── market_data.json    # Данные рынка
│   └── kpi_templates.json
│
└── alternative/
    ├── risks_db.json       # База рисков
    ├── patterns.json       # Паттерны проблем
    └── optimizations.json  # Методы оптимизации
```

### Пример: база рисков

```json
{
  "risks": [
    {
      "id": "risk_001",
      "category": "financial",
      "name": "Кассовый разрыв",
      "description": "Недостаточно средств для оплаты расходов",
      "probability": 0.3,
      "impact": "high",
      "mitigation": "Создать резервный фонд на 3 месяца"
    },
    {
      "id": "risk_002",
      "category": "market",
      "name": "Выход конкурента",
      "description": "Новый игрок демпингует цены",
      "probability": 0.5,
      "impact": "medium",
      "mitigation": "Дифференциация продукта, лояльность клиентов"
    }
  ]
}
```

---

## 🚀 Запуск системы

### 1. Подготовка

```bash
# Установка зависимостей
pip install -r requirements.txt

# Копирование .env
cp .env.example .env

# Настройка токенов ботов
# BOT_TOKEN_ACCOUNTANT=...
# BOT_TOKEN_SELLER=...
# BOT_TOKEN_MANAGER=...
# BOT_TOKEN_ALTERNATIVE=...
```

### 2. Запуск ботов

```bash
# Терминал 1: Бухгалтер
python bots/accountant/bot.py

# Терминал 2: Продавец
python bots/seller/bot.py

# Терминал 3: Топ-менеджер
python bots/manager/bot.py

# Терминал 4: Альтернативщик
python bots/alternative/bot.py
```

### 3. Docker Compose

```yaml
version: '3.8'

services:
  accountant:
    build: .
    command: python bots/accountant/bot.py
    env_file: .env
  
  seller:
    build: .
    command: python bots/seller/bot.py
    env_file: .env
  
  manager:
    build: .
    command: python bots/manager/bot.py
    env_file: .env
  
  alternative:
    build: .
    command: python bots/alternative/bot.py
    env_file: .env
  
  rabbitmq:
    image: rabbitmq:3-management
    ports:
      - "5672:5672"
      - "15672:15672"
```

```bash
docker-compose up -d
```

---

## 📊 Мониторинг

### Дашборд системы

```python
@dp.message(Command('dashboard'))
async def cmd_dashboard(message: types.Message):
    """Общий дашборд системы"""
    
    stats = {
        "accountant": finance_engine.get_stats(),
        "seller": sales_engine.get_stats(),
        "manager": analytics_engine.get_stats(),
        "alternative": debate_engine.get_stats(),
        "message_bus": message_bus.get_stats()
    }
    
    text = f"""
    🏘️ **CYBER VILLAGE DASHBOARD**
    
    💰 Бухгалтер:
       - Транзакций: {stats['accountant']['transactions']}
       - Счетов: {stats['accountant']['invoices']}
    
    🛒 Продавец:
       - Заказов: {stats['seller']['orders']}
       - Товаров: {stats['seller']['products']}
    
    🎯 Топ-менеджер:
       - Советов: {stats['manager']['advices']}
       - KPI: {stats['manager']['kpis']}
    
    ⚡ Альтернативщик:
       - Критик: {stats['alternative']['critiques']}
       - Альтернатив: {stats['alternative']['alternatives']}
    
    📡 Message Bus:
       - Сообщений: {stats['message_bus']['messages_in_history']}
    """
    
    await message.answer(text)
```

---

## 🎯 Roadmap реализации

| Этап | Задача | Статус |
|------|--------|--------|
| 1 | Message Bus | ✅ Готово |
| 2 | Бот-Бухгалтер | ✅ Готово |
| 3 | Бот-Продавец | ⏳ Шаблон |
| 4 | Бот-Топ-менеджер | ⏳ Шаблон |
| 5 | Бот-Альтернативщик | ⏳ Шаблон |
| 6 | База знаний | ⏳ Структура |
| 7 | AI интеграция | ⏳ План |
| 8 | Межботовые сценарии | ⏳ План |
| 9 | Тестирование | ⏳ |
| 10 | Деплой | ⏳ |

---

## 📚 Следующие шаги

1. **Заполнить шаблоны ботов** (Продавец, Топ-менеджер, Альтернативщик)
2. **Настроить AI Engine** для генерации рекомендаций
3. **Создать базу знаний** для каждого бота
4. **Реализовать межботовые сценарии**
5. **Настроить мониторинг и логирование**
6. **Протестировать систему**

---

**Кибердеревня ждёт постройки!** 🤖🏘️

Все шаблоны готовы к заполнению в папке `templates/cyber_village/`.
