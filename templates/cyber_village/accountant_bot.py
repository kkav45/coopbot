# -*- coding: utf-8 -*-
"""
Бот-Бухгалтер для проекта Cyber Village
Финансовый учёт, отчёты, налоги
"""

import asyncio
import json
import os
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from aiogram import Bot, Dispatcher, types
from aiogram.filters import Command
from aiogram.fsm.storage.memory import MemoryStorage
from dotenv import load_dotenv

# Импорт Message Bus
from message_bus import message_bus, Message, BotRole

load_dotenv()

BOT_TOKEN = os.getenv('BOT_TOKEN')
bot = Bot(token=BOT_TOKEN)
dp = Dispatcher(storage=MemoryStorage())

# ============================================================================
# Финансовый движок
# ============================================================================

class FinanceEngine:
    """Движок для финансовых операций"""
    
    def __init__(self):
        self.transactions: List[Dict] = []
        self.invoices: Dict[str, Dict] = {}
        self.contracts: Dict[str, Dict] = {}
    
    def add_transaction(self, data: Dict):
        """Добавление транзакции"""
        transaction = {
            "id": f"TXN-{len(self.transactions) + 1:06d}",
            "timestamp": datetime.now().isoformat(),
            "type": data.get("type"),  # income/expense
            "amount": data.get("amount"),
            "category": data.get("category"),
            "description": data.get("description"),
            "counterparty": data.get("counterparty"),
            "document_id": data.get("document_id")
        }
        self.transactions.append(transaction)
        return transaction
    
    def create_invoice(self, order_id: str, amount: float, customer: str) -> Dict:
        """Создание счёта"""
        invoice_id = f"INV-{len(self.invoices) + 1:06d}"
        
        invoice = {
            "invoice_id": invoice_id,
            "order_id": order_id,
            "amount": amount,
            "customer": customer,
            "created_at": datetime.now().isoformat(),
            "due_date": (datetime.now() + timedelta(days=30)).isoformat(),
            "status": "pending",  # pending/paid/overdue
            "items": []
        }
        
        self.invoices[invoice_id] = invoice
        return invoice
    
    def get_financial_report(self, period: str = "month") -> Dict:
        """Финансовый отчёт"""
        now = datetime.now()
        
        if period == "month":
            start_date = now.replace(day=1)
        elif period == "quarter":
            start_date = now - timedelta(days=90)
        elif period == "year":
            start_date = now.replace(month=1, day=1)
        else:
            start_date = now - timedelta(days=30)
        
        # Фильтруем транзакции за период
        filtered = [
            t for t in self.transactions
            if datetime.fromisoformat(t["timestamp"]) >= start_date
        ]
        
        # Считаем доходы и расходы
        income = sum(t["amount"] for t in filtered if t["type"] == "income")
        expense = sum(t["amount"] for t in filtered if t["type"] == "expense")
        
        # Считаем налоги (упрощённо 6% от доходов)
        tax = income * 0.06
        
        return {
            "period": period,
            "start_date": start_date.isoformat(),
            "end_date": now.isoformat(),
            "income": income,
            "expense": expense,
            "profit": income - expense,
            "tax": tax,
            "net_profit": income - expense - tax,
            "transactions_count": len(filtered)
        }
    
    def get_cashflow(self, days: int = 30) -> List[Dict]:
        """Движение денег по дням"""
        now = datetime.now()
        cashflow = []
        
        for i in range(days):
            date = now - timedelta(days=i)
            date_str = date.strftime("%Y-%m-%d")
            
            day_transactions = [
                t for t in self.transactions
                if datetime.fromisoformat(t["timestamp"]).date() == date.date()
            ]
            
            income = sum(t["amount"] for t in day_transactions if t["type"] == "income")
            expense = sum(t["amount"] for t in day_transactions if t["type"] == "expense")
            
            cashflow.append({
                "date": date_str,
                "income": income,
                "expense": expense,
                "net": income - expense
            })
        
        return cashflow


# Глобальный финансовый движок
finance_engine = FinanceEngine()


# ============================================================================
# Обработчики команд бота
# ============================================================================

@dp.message(Command('start'))
async def cmd_start(message: types.Message):
    """Приветствие"""
    await message.answer(
        "💰 **Бот-Бухгалтер**\n\n"
        "Я управляю финансами вашей кибердеревни:\n"
        "• Учёт доходов и расходов\n"
        "• Финансовые отчёты\n"
        "• Создание счетов\n"
        "• Расчёт налогов\n\n"
        "Команды:\n"
        "/report - Финансовый отчёт\n"
        "/cashflow - Движение денег\n"
        "/invoice - Создать счёт\n"
        "/tax - Расчёт налогов\n"
        "/transactions - История операций"
    )


@dp.message(Command('report'))
async def cmd_report(message: types.Message):
    """Финансовый отчёт"""
    period = "month"
    if len(message.text.split()) > 1:
        period = message.text.split()[1]
    
    report = finance_engine.get_financial_report(period)
    
    text = (
        f"📊 **Финансовый отчёт** ({period})\n\n"
        f"💵 Доходы: {report['income']:,.2f} ₽\n"
        f"💸 Расходы: {report['expense']:,.2f} ₽\n"
        f"📈 Прибыль: {report['profit']:,.2f} ₽\n"
        f"🏛️ Налог: {report['tax']:,.2f} ₽\n"
        f"💰 Чистая прибыль: {report['net_profit']:,.2f} ₽\n\n"
        f"Транзакций: {report['transactions_count']}"
    )
    
    await message.answer(text)


@dp.message(Command('cashflow'))
async def cmd_cashflow(message: types.Message):
    """Движение денег"""
    days = 7
    if len(message.text.split()) > 1:
        days = int(message.text.split()[1])
    
    cashflow = finance_engine.get_cashflow(days)
    
    text = "📊 **Движение денег**\n\n"
    for day in reversed(cashflow):
        emoji = "🟢" if day['net'] > 0 else "🔴" if day['net'] < 0 else "⚪"
        text += f"{emoji} {day['date']}: +{day['income']:,.0f} / -{day['expense']:,.0f} = {day['net']:+,.0f} ₽\n"
    
    await message.answer(text)


@dp.message(Command('invoice'))
async def cmd_invoice(message: types.Message):
    """Создание счёта"""
    # Парсинг аргументов: /invoice order_id amount customer
    parts = message.text.split()
    
    if len(parts) < 4:
        await message.answer(
            "Использование: /invoice <order_id> <amount> <customer>\n"
            "Пример: /invoice ORD-123 10000 ООО Ромашка"
        )
        return
    
    order_id = parts[1]
    amount = float(parts[2])
    customer = " ".join(parts[3:])
    
    invoice = finance_engine.create_invoice(order_id, amount, customer)
    
    # Отправляем уведомление в шину
    await message_bus.publish(Message.create(
        from_bot="accountant_bot",
        to_bot="seller_bot",
        type="notification",
        topic="finance.invoice_created",
        content={
            "invoice_id": invoice["invoice_id"],
            "order_id": order_id,
            "amount": amount
        }
    ))
    
    text = (
        f"✅ **Счёт создан**\n\n"
        f"📄 Номер: {invoice['invoice_id']}\n"
        f"📦 Заказ: {invoice['order_id']}\n"
        f"💰 Сумма: {invoice['amount']:,.2f} ₽\n"
        f"👤 Клиент: {invoice['customer']}\n"
        f"📅 Срок оплаты: {invoice['due_date'][:10]}"
    )
    
    await message.answer(text)


@dp.message(Command('tax'))
async def cmd_tax(message: types.Message):
    """Расчёт налогов"""
    report = finance_engine.get_financial_report("year")
    
    # УСН 6% + страховые взносы
    usn_tax = report['income'] * 0.06
    insurance = 45000  # Фиксированные взносы за год
    
    total_tax = usn_tax - insurance if usn_tax > insurance else 0
    
    text = (
        f"🏛️ **Расчёт налогов** за год\n\n"
        f"Доход: {report['income']:,.2f} ₽\n"
        f"УСН 6%: {usn_tax:,.2f} ₽\n"
        f"Страховые: {insurance:,.2f} ₽\n"
        f"К уплате: {total_tax:,.2f} ₽"
    )
    
    await message.answer(text)


@dp.message(Command('transactions'))
async def cmd_transactions(message: types.Message):
    """История операций"""
    limit = 10
    if len(message.text.split()) > 1:
        limit = int(message.text.split()[1])
    
    transactions = finance_engine.transactions[-limit:]
    
    if not transactions:
        await message.answer("📭 История пуста")
        return
    
    text = "📋 **Последние операции**\n\n"
    for t in reversed(transactions):
        emoji = "💵" if t["type"] == "income" else "💸"
        text += f"{emoji} {t['id']}: {t['amount']:,.2f} ₽ - {t['description']}\n"
    
    await message.answer(text)


# ============================================================================
# Обработчик сообщений от других ботов
# ============================================================================

async def handle_inter_bot_message(message: Message):
    """Обработка сообщений от других ботов"""
    print(f"💰 Бухгалтер получил сообщение: {message.topic}")
    
    if message.topic == "finance.create_invoice":
        # Запрос на создание счёта от Продавца
        order_id = message.content.get('order_id')
        amount = message.content.get('amount')
        customer = message.content.get('customer', 'Клиент')
        
        invoice = finance_engine.create_invoice(order_id, amount, customer)
        
        # Добавляем транзакцию (ожидание оплаты)
        finance_engine.add_transaction({
            "type": "income",
            "amount": amount,
            "category": "sales",
            "description": f"Оплата заказа {order_id}",
            "document_id": invoice["invoice_id"]
        })
        
        # Отправляем ответ
        await message_bus.respond(message, {
            "status": "success",
            "invoice_id": invoice["invoice_id"],
            "amount": amount
        })
    
    elif message.topic == "finance.get_report":
        # Запрос отчёта от Топ-менеджера
        period = message.content.get('period', 'month')
        report = finance_engine.get_financial_report(period)
        
        await message_bus.respond(message, report)
    
    elif message.topic == "finance.check_budget":
        # Проверка бюджета от Альтернативщика
        amount = message.content.get('amount')
        category = message.content.get('category')
        
        # Проверяем, есть ли достаточно средств
        report = finance_engine.get_financial_report("month")
        available = report['profit'] * 0.5  # 50% от прибыли доступно
        
        await message_bus.respond(message, {
            "available": available,
            "requested": amount,
            "approved": amount <= available,
            "message": "Бюджет одобрен" if amount <= available else "Превышение бюджета"
        })


# ============================================================================
# Запуск
# ============================================================================

async def main():
    """Запуск бота"""
    
    # Подключаем бота к Message Bus
    message_bus.subscribe_bot("accountant_bot", handle_inter_bot_message)
    
    # Запускаем обработку Message Bus
    bus_task = asyncio.create_task(message_bus.start_processing())
    
    print("💰 Бот-Бухгалтер запущен...")
    
    # Запускаем бота
    await dp.start_polling(bot)
    
    # Останавливаем Message Bus
    message_bus.stop()
    bus_task.cancel()


if __name__ == '__main__':
    asyncio.run(main())
