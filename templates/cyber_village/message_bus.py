# -*- coding: utf-8 -*-
"""
Message Bus - Система межботовой коммуникации
Для проекта Cyber Village
"""

import asyncio
import json
import uuid
from datetime import datetime
from typing import Dict, List, Optional, Callable, Any
from dataclasses import dataclass, asdict
from enum import Enum


class MessageType(Enum):
    """Типы сообщений между ботами"""
    REQUEST = "request"
    RESPONSE = "response"
    NOTIFICATION = "notification"
    BROADCAST = "broadcast"


class MessagePriority(Enum):
    """Приоритеты сообщений"""
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    URGENT = "urgent"


class BotRole(Enum):
    """Роли ботов в системе"""
    ACCOUNTANT = "accountant_bot"
    SELLER = "seller_bot"
    MANAGER = "manager_bot"
    ALTERNATIVE = "alternative_bot"


@dataclass
class Message:
    """Сообщение межботовой коммуникации"""
    message_id: str
    timestamp: str
    from_bot: str
    to_bot: str
    type: str
    priority: str
    topic: str
    content: Dict[str, Any]
    context: Dict[str, str]
    reply_to: Optional[str] = None
    
    def to_dict(self) -> dict:
        return asdict(self)
    
    @classmethod
    def create(
        cls,
        from_bot: str,
        to_bot: str,
        type: MessageType,
        topic: str,
        content: Dict[str, Any],
        priority: MessagePriority = MessagePriority.NORMAL,
        context: Optional[Dict[str, str]] = None,
        reply_to: Optional[str] = None
    ) -> 'Message':
        return cls(
            message_id=f"msg_{uuid.uuid4().hex[:12]}",
            timestamp=datetime.now().isoformat(),
            from_bot=from_bot,
            to_bot=to_bot,
            type=type.value,
            priority=priority.value,
            topic=topic,
            content=content,
            context=context or {},
            reply_to=reply_to
        )


class MessageBus:
    """
    Шина сообщений для коммуникации между ботами
    
    Поддерживает:
    - Публикацию/подписку (Pub/Sub)
    - Запрос/ответ (Request/Response)
    - Приоритеты сообщений
    - Обработку таймаутов
    """
    
    def __init__(self):
        # Подписчики по топикам
        self.subscribers: Dict[str, List[Callable]] = {}
        
        # Подписчики по ролям ботов
        self.bot_subscribers: Dict[str, Callable] = {}
        
        # Ожидающие ответы (для request/response)
        self.pending_responses: Dict[str, asyncio.Future] = {}
        
        # Очередь сообщений
        self.message_queue: asyncio.Queue = asyncio.Queue()
        
        # Флаг работы
        self.running = False
        
        # История сообщений (для отладки)
        self.message_history: List[Message] = []
        self.max_history = 1000
    
    def subscribe(self, topic: str, callback: Callable):
        """Подписка на топик"""
        if topic not in self.subscribers:
            self.subscribers[topic] = []
        self.subscribers[topic].append(callback)
        print(f"📬 Подписка на топик: {topic}")
    
    def subscribe_bot(self, bot_role: str, callback: Callable):
        """Подписка бота на все сообщения для него"""
        self.bot_subscribers[bot_role] = callback
        print(f"🤖 Бот {bot_role} подключён к шине")
    
    async def publish(self, message: Message):
        """Публикация сообщения"""
        # Сохраняем в историю
        self.message_history.append(message)
        if len(self.message_history) > self.max_history:
            self.message_history.pop(0)
        
        # Логируем
        print(f"📤 [{message.priority.upper()}] {message.from_bot} → {message.to_bot}: {message.topic}")
        
        # Отправляем в очередь
        await self.message_queue.put(message)
        
        # Уведомляем подписчиков топика
        if message.topic in self.subscribers:
            for callback in self.subscribers[message.topic]:
                try:
                    await callback(message)
                except Exception as e:
                    print(f"❌ Ошибка в подписчике: {e}")
        
        # Отправляем боту-получателю
        if message.to_bot in self.bot_subscribers:
            try:
                await self.bot_subscribers[message.to_bot](message)
            except Exception as e:
                print(f"❌ Ошибка в боте {message.to_bot}: {e}")
        
        # Если это ответ на запрос - уведомляем ожидающего
        if message.reply_to and message.reply_to in self.pending_responses:
            future = self.pending_responses.pop(message.reply_to)
            future.set_result(message)
    
    async def request(
        self,
        from_bot: str,
        to_bot: str,
        topic: str,
        content: Dict[str, Any],
        timeout: float = 30.0
    ) -> Optional[Message]:
        """
        Отправка запроса и ожидание ответа
        
        Args:
            from_bot: Кто отправляет
            to_bot: Кому отправляет
            topic: Топик сообщения
            content: Содержимое запроса
            timeout: Таймаут ожидания ответа
            
        Returns:
            Ответ или None при таймауте
        """
        # Создаём запрос
        request = Message.create(
            from_bot=from_bot,
            to_bot=to_bot,
            type=MessageType.REQUEST,
            topic=topic,
            content=content,
            priority=MessagePriority.HIGH
        )
        
        # Создаём Future для ожидания ответа
        loop = asyncio.get_event_loop()
        future = loop.create_future()
        self.pending_responses[request.message_id] = future
        
        # Отправляем запрос
        await self.publish(request)
        
        # Ждём ответ
        try:
            response = await asyncio.wait_for(future, timeout=timeout)
            return response
        except asyncio.TimeoutError:
            print(f"⏰ Таймаут ожидания ответа от {to_bot}")
            self.pending_responses.pop(request.message_id, None)
            return None
    
    async def respond(
        self,
        original_message: Message,
        content: Dict[str, Any]
    ):
        """Отправка ответа на запрос"""
        response = Message.create(
            from_bot=original_message.to_bot,
            to_bot=original_message.from_bot,
            type=MessageType.RESPONSE,
            topic=original_message.topic,
            content=content,
            reply_to=original_message.message_id,
            context=original_message.context
        )
        await self.publish(response)
    
    async def broadcast(
        self,
        from_bot: str,
        topic: str,
        content: Dict[str, Any],
        exclude: Optional[List[str]] = None
    ):
        """Рассылка сообщения всем ботам"""
        exclude = exclude or []
        
        for bot_role in BotRole:
            if bot_role.value not in exclude:
                message = Message.create(
                    from_bot=from_bot,
                    to_bot=bot_role.value,
                    type=MessageType.BROADCAST,
                    topic=topic,
                    content=content
                )
                await self.publish(message)
    
    async def start_processing(self):
        """Запуск обработки очереди сообщений"""
        self.running = True
        print("🚀 Message Bus запущен")
        
        while self.running:
            try:
                message = await asyncio.wait_for(
                    self.message_queue.get(),
                    timeout=1.0
                )
                # Обработка сообщения (если нужна дополнительная логика)
                self.message_queue.task_done()
            except asyncio.TimeoutError:
                continue
            except Exception as e:
                print(f"❌ Ошибка обработки сообщения: {e}")
    
    def stop(self):
        """Остановка Message Bus"""
        self.running = False
        print("🛑 Message Bus остановлен")
    
    def get_stats(self) -> Dict[str, Any]:
        """Статистика работы"""
        return {
            "subscribers_count": len(self.subscribers),
            "bots_connected": len(self.bot_subscribers),
            "pending_requests": len(self.pending_responses),
            "queue_size": self.message_queue.qsize(),
            "messages_in_history": len(self.message_history)
        }


# Глобальный экземпляр
message_bus = MessageBus()


# ============================================================================
# Примеры использования
# ============================================================================

async def example_accountant_handler(message: Message):
    """Обработчик сообщений для бота-Бухгалтера"""
    print(f"💰 Бухгалтер получил: {message.topic}")
    
    if message.topic == "finance.create_invoice":
        # Создание счёта
        order_id = message.content.get('order_id')
        amount = message.content.get('amount')
        
        # ... логика создания счёта ...
        
        # Отправляем ответ
        await message_bus.respond(message, {
            "status": "success",
            "invoice_id": f"INV-{uuid.uuid4().hex[:8]}",
            "amount": amount
        })
    
    elif message.topic == "finance.get_report":
        # Финансовый отчёт
        period = message.content.get('period')
        
        # ... генерация отчёта ...
        
        await message_bus.respond(message, {
            "report": {"income": 100000, "expense": 50000}
        })


async def example_seller_handler(message: Message):
    """Обработчик сообщений для бота-Продавца"""
    print(f"🛒 Продавец получил: {message.topic}")
    
    if message.topic == "sales.order_created":
        # Уведомление о новом заказе
        order_id = message.content.get('order_id')
        
        # Отправляем запрос бухгалтеру для создания счёта
        response = await message_bus.request(
            from_bot="seller_bot",
            to_bot="accountant_bot",
            topic="finance.create_invoice",
            content={"order_id": order_id, "amount": 10000},
            timeout=10.0
        )
        
        if response:
            invoice_id = response.content.get('invoice_id')
            print(f"✅ Счёт создан: {invoice_id}")


async def example_manager_handler(message: Message):
    """Обработчик сообщений для бота-Топ-менеджера"""
    print(f"🎯 Топ-менеджер получил: {message.topic}")
    
    if message.topic == "strategy.request_advice":
        # Запрос совета
        question = message.content.get('question')
        
        # Рассылаем запрос всем ботам
        await message_bus.broadcast(
            from_bot="manager_bot",
            topic="strategy.discussion",
            content={"question": question},
            exclude=["manager_bot"]
        )


async def example_alternative_handler(message: Message):
    """Обработчик сообщений для бота-Альтернативщика"""
    print(f"⚡ Альтернативщик получил: {message.topic}")
    
    if message.topic == "strategy.discussion":
        # Участие в обсуждении
        question = message.content.get('question')
        
        # Генерируем критическое мнение
        critique = {
            "critic": "alternative_bot",
            "risks": ["риск 1", "риск 2"],
            "alternatives": ["альтернатива 1", "альтернатива 2"]
        }
        
        # Отправляем мнение
        await message_bus.respond(message, critique)


async def main():
    """Пример использования Message Bus"""
    
    # Подключаем ботов
    message_bus.subscribe_bot("accountant_bot", example_accountant_handler)
    message_bus.subscribe_bot("seller_bot", example_seller_handler)
    message_bus.subscribe_bot("manager_bot", example_manager_handler)
    message_bus.subscribe_bot("alternative_bot", example_alternative_handler)
    
    # Подписка на топик
    message_bus.subscribe("finance.*", lambda m: print(f"Финансовый топик: {m.topic}"))
    
    # Запуск обработки
    processor_task = asyncio.create_task(message_bus.start_processing())
    
    # Пример: Продавец создаёт заказ и запрашивает счёт
    print("\n=== Пример 1: Создание заказа ===")
    response = await message_bus.request(
        from_bot="seller_bot",
        to_bot="accountant_bot",
        topic="finance.create_invoice",
        content={"order_id": "ORD-123", "amount": 10000},
        timeout=5.0
    )
    
    if response:
        print(f"✅ Получен ответ: {response.content}")
    
    # Пример: Топ-менеджер запрашивает совет
    print("\n=== Пример 2: Стратегическая сессия ===")
    await message_bus.broadcast(
        from_bot="manager_bot",
        topic="strategy.request_advice",
        content={"question": "Как увеличить продажи на 20%?"}
    )
    
    # Ждём немного
    await asyncio.sleep(2)
    
    # Статистика
    print("\n=== Статистика ===")
    print(message_bus.get_stats())
    
    # Остановка
    message_bus.stop()
    processor_task.cancel()


if __name__ == "__main__":
    asyncio.run(main())
