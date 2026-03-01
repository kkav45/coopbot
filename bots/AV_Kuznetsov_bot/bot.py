# -*- coding: utf-8 -*-
"""
Telegram Bot Runner
Автоматически сгенерированный бот из BotBuilder
"""

import asyncio
import json
import os
from aiogram import Bot, Dispatcher, types
from aiogram.filters import Command, Text
from aiogram.types import InlineKeyboardMarkup, ReplyKeyboardMarkup, InlineKeyboardButton, KeyboardButton
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.fsm.storage.memory import MemoryStorage
from dotenv import load_dotenv

# Загрузка переменных окружения
load_dotenv()

# Загрузка конфигурации
with open('bot-config.json', 'r', encoding='utf-8') as f:
    config = json.load(f)

BOT_TOKEN = os.getenv('BOT_TOKEN')

# Инициализация бота
bot = Bot(token=BOT_TOKEN)
dp = Dispatcher(storage=MemoryStorage())

# Хранилище данных пользователей
user_data = {}


def get_user_data(user_id: int) -> dict:
    """Получить данные пользователя"""
    if user_id not in user_data:
        user_data[user_id] = {'variables': {}, 'current_scene': None}
    return user_data[user_id]


def set_variable(user_id: int, name: str, value):
    """Установить переменную пользователя"""
    data = get_user_data(user_id)
    data['variables'][name] = value


def get_variable(user_id: int, name: str, default=None):
    """Получить переменную пользователя"""
    data = get_user_data(user_id)
    return data['variables'].get(name, default)


def evaluate_condition(user_id: int, condition: dict) -> bool:
    """Проверка условия"""
    variable = get_variable(user_id, condition.get('variable', ''))
    operator = condition.get('operator', 'equals')
    value = condition.get('value', '')

    if operator == 'empty':
        return not variable
    elif operator == 'not_empty':
        return bool(variable)
    elif operator == 'equals':
        return str(variable) == str(value)
    elif operator == 'not_equals':
        return str(variable) != str(value)
    elif operator == 'contains':
        return str(value) in str(variable)
    
    return False


def create_inline_keyboard(buttons: list) -> InlineKeyboardMarkup:
    """Создать inline клавиатуру"""
    keyboard = InlineKeyboardMarkup(inline_keyboard=[])
    for btn in buttons:
        keyboard.inline_keyboard.append([
            InlineKeyboardButton(
                text=btn.get('text', 'Button'),
                callback_data=btn.get('callback', '')
            )
        ])
    return keyboard


def create_reply_keyboard(buttons: list) -> ReplyKeyboardMarkup:
    """Создать reply клавиатуру"""
    keyboard = ReplyKeyboardMarkup(keyboard=[], resize_keyboard=True)
    for btn in buttons:
        keyboard.keyboard.append([
            KeyboardButton(text=btn.get('text', 'Button'))
        ])
    return keyboard


async def process_scenario(user_id: int, scene: dict, message: types.Message = None, callback: types.CallbackQuery = None):
    """Обработка сценария"""
    if not scene:
        return

    # Отправляем сообщение сценария
    if scene.get('message'):
        await message.answer(scene['message'])

    # Обрабатываем блоки
    for block in scene.get('blocks', []):
        await process_block(user_id, block, message)

    # Переход к следующему сценарию
    if scene.get('nextScenario'):
        next_scene = find_scene(scene['nextScenario'])
        if next_scene:
            await process_scenario(user_id, next_scene, message)


async def process_block(user_id: int, block: dict, message: types.Message):
    """Обработка блока сценария"""
    block_type = block.get('type')

    if block_type == 'message':
        text = block.get('text', '')
        parse_mode = block.get('parseMode', 'none')
        if parse_mode == 'none':
            parse_mode = None
        await message.answer(text, parse_mode=parse_mode)
        
        if block.get('nextScenario'):
            next_scene = find_scene(block['nextScenario'])
            if next_scene:
                await process_scenario(user_id, next_scene, message)

    elif block_type == 'question':
        # Вопрос с кнопками
        text = block.get('text', '')
        buttons = block.get('buttons', [])
        
        if buttons:
            keyboard = create_inline_keyboard(buttons)
            await message.answer(text, reply_markup=keyboard)
        else:
            await message.answer(text)
        
        # Сохраняем информацию о вопросе для обработки ответа
        get_user_data(user_id)['current_question'] = block

    elif block_type == 'condition':
        if evaluate_condition(user_id, block):
            if block.get('trueScenario'):
                next_scene = find_scene(block['trueScenario'])
                if next_scene:
                    await process_scenario(user_id, next_scene, message)
        else:
            if block.get('falseScenario'):
                next_scene = find_scene(block['falseScenario'])
                if next_scene:
                    await process_scenario(user_id, next_scene, message)

    elif block_type == 'action':
        action_type = block.get('actionType')
        
        if action_type == 'set_variable':
            set_variable(user_id, block.get('variable', ''), block.get('value', ''))
        
        elif action_type == 'clear_variable':
            var_name = block.get('variable', '')
            if var_name in get_user_data(user_id)['variables']:
                del get_user_data(user_id)['variables'][var_name]
        
        elif action_type == 'delay':
            await asyncio.sleep(block.get('delay', 1000) / 1000)

    elif block_type == 'keyboard':
        buttons = block.get('buttons', [])
        keyboard_type = block.get('keyboardType', 'inline')
        
        if keyboard_type == 'inline':
            keyboard = create_inline_keyboard(buttons)
        else:
            keyboard = create_reply_keyboard(buttons)
        
        await message.answer('Выберите действие:', reply_markup=keyboard)


def find_scene(scene_id: str) -> dict:
    """Найти сценарий по ID"""
    for scene in config['config']['scenes']:
        if scene['id'] == scene_id:
            return scene
    return None


def find_scene_by_trigger(trigger: str) -> dict:
    """Найти сценарий по триггеру"""
    for scene in config['config']['scenes']:
        if scene.get('trigger') == trigger:
            return scene
    return None


# Обработчик команды /start
@dp.message(Command('start'))
async def cmd_start(message: types.Message):
    user_id = message.from_user.id
    scene = find_scene_by_trigger('/start')
    if scene:
        await process_scenario(user_id, scene, message)
    else:
        await message.answer('Добро пожаловать!')


# Обработчик текстовых сообщений
@dp.message()
async def handle_text(message: types.Message):
    user_id = message.from_user.id
    text = message.text
    
    # Проверяем, есть ли активный вопрос
    question = get_user_data(user_id).get('current_question')
    if question:
        # Сохраняем ответ в переменную
        var_name = question.get('variable')
        if var_name:
            set_variable(user_id, var_name, text)
        
        # Очищаем вопрос
        del get_user_data(user_id)['current_question']
        
        # Переход к следующему сценарию если указан
        if question.get('nextScenario'):
            next_scene = find_scene(question['nextScenario'])
            if next_scene:
                await process_scenario(user_id, next_scene, message)
        return
    
    # Ищем сценарий по триггеру
    scene = find_scene_by_trigger(text)
    if scene:
        await process_scenario(user_id, scene, message)
        return
    
    # Ищем сценарий по частичному совпадению
    for s in config['config']['scenes']:
        if text.startswith(s.get('trigger', '')):
            await process_scenario(user_id, s, message)
            return


# Обработчик callback query (inline кнопки)
@dp.callback_query()
async def handle_callback(callback: types.CallbackQuery):
    user_id = callback.from_user.id
    data = callback.data
    
    await callback.answer()
    
    # Ищем сценарий по callback data
    scene = find_scene_by_trigger(data)
    if scene:
        await process_scenario(user_id, scene, callback.message)
        return
    
    # Обработка действий кнопок
    if data.startswith('scene:'):
        scene_id = data.replace('scene:', '')
        scene = find_scene(scene_id)
        if scene:
            await process_scenario(user_id, scene, callback.message)


# Запуск бота
async def main():
    print(f"Бот {config['bot']['name']} запущен...")
    await dp.start_polling(bot)


if __name__ == '__main__':
    asyncio.run(main())
