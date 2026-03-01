# -*- coding: utf-8 -*-
"""
Telegram Bot Runner
Автоматически сгенерированный бот из BotBuilder
Поддержка Mini Apps и Google Sheets
"""

import asyncio
import json
import os
import re
from datetime import datetime
from aiogram import Bot, Dispatcher, types
from aiogram.filters import Command, Text
from aiogram.types import (
    InlineKeyboardMarkup, 
    ReplyKeyboardMarkup, 
    InlineKeyboardButton, 
    KeyboardButton,
    ReplyKeyboardRemove,
    WebAppInfo
)
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.fsm.storage.memory import MemoryStorage
from dotenv import load_dotenv

# Импорт Google Sheets (если настроено)
try:
    from google_sheets import init_database, get_database
    GS_AVAILABLE = True
except ImportError:
    GS_AVAILABLE = False

# Загрузка переменных окружения
load_dotenv()

# Загрузка конфигурации
CONFIG_FILE = 'bot-config.json'

with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
    config = json.load(f)

BOT_TOKEN = os.getenv('BOT_TOKEN')
MINI_APP_URL = os.getenv('MINI_APP_URL', '')
GOOGLE_SHEET_ID = os.getenv('GOOGLE_SHEET_ID', '')
GOOGLE_CREDENTIALS = os.getenv('GOOGLE_CREDENTIALS', '')

if not BOT_TOKEN:
    raise ValueError("BOT_TOKEN не найден в переменных окружения!")

# Инициализация Google Sheets если настроено
if GS_AVAILABLE and GOOGLE_SHEET_ID and GOOGLE_CREDENTIALS:
    init_database(credentials_json=GOOGLE_CREDENTIALS, spreadsheet_id=GOOGLE_SHEET_ID)

# Инициализация бота
bot = Bot(token=BOT_TOKEN)
dp = Dispatcher(storage=MemoryStorage())

# Хранилище данных пользователей
user_data = {}


class Form(StatesGroup):
    """Состояния для вопросов"""
    waiting_for_answer = State()


def get_user_data(user_id: int) -> dict:
    """Получить данные пользователя"""
    if user_id not in user_data:
        user_data[user_id] = {
            'variables': {}, 
            'current_scene': None,
            'current_question': None
        }
    return user_data[user_id]


def set_variable(user_id: int, name: str, value):
    """Установить переменную пользователя"""
    data = get_user_data(user_id)
    data['variables'][name] = value
    save_user_data(user_id)


def get_variable(user_id: int, name: str, default=None):
    """Получить переменную пользователя"""
    data = get_user_data(user_id)
    return data['variables'].get(name, default)


def clear_variable(user_id: int, name: str):
    """Очистить переменную пользователя"""
    data = get_user_data(user_id)
    if name in data['variables']:
        del data['variables'][name]
    save_user_data(user_id)


def save_user_data(user_id: int):
    """Сохранение данных пользователя (опционально в файл)"""
    # Можно сохранять в JSON для персистентности
    pass


def load_user_data(user_id: int):
    """Загрузка данных пользователя (опционально из файла)"""
    pass


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
    elif operator == 'greater':
        return float(variable or 0) > float(value or 0)
    elif operator == 'less':
        return float(variable or 0) < float(value or 0)
    
    return False


def create_inline_keyboard(buttons: list) -> InlineKeyboardMarkup:
    """Создать inline клавиатуру"""
    if not buttons:
        return InlineKeyboardMarkup(inline_keyboard=[])
    
    keyboard = InlineKeyboardMarkup(inline_keyboard=[])
    for btn in buttons:
        text = btn.get('text', 'Button')
        callback = btn.get('callback', '') or btn.get('action', '')
        
        # Если callback начинается с scene:, это переход к сценарию
        if callback.startswith('scene:'):
            callback = callback
            
        keyboard.inline_keyboard.append([
            InlineKeyboardButton(
                text=text,
                callback_data=callback
            )
        ])
    return keyboard


def create_reply_keyboard(buttons: list, one_time: bool = False) -> ReplyKeyboardMarkup:
    """Создать reply клавиатуру"""
    if not buttons:
        return ReplyKeyboardRemove()
    
    keyboard = ReplyKeyboardMarkup(
        keyboard=[], 
        resize_keyboard=True,
        one_time_keyboard=one_time
    )
    
    for btn in buttons:
        text = btn.get('text', 'Button')
        keyboard.keyboard.append([
            KeyboardButton(text=text)
        ])
    return keyboard


def find_scene(scene_id: str) -> dict:
    """Найти сценарий по ID"""
    for scene in config['config']['scenes']:
        if scene['id'] == scene_id:
            return scene
    return None


def find_scene_by_trigger(trigger: str) -> dict:
    """Найти сценарий по триггеру"""
    # Точное совпадение
    for scene in config['config']['scenes']:
        if scene.get('trigger') == trigger:
            return scene
    
    # Частичное совпадение
    for scene in config['config']['scenes']:
        scene_trigger = scene.get('trigger', '')
        if trigger.startswith(scene_trigger) and scene_trigger:
            return scene
    
    return None


async def process_scenario(
    user_id: int, 
    scene: dict, 
    message: types.Message = None,
    callback: types.CallbackQuery = None
):
    """Обработка сценария"""
    if not scene:
        return

    data = get_user_data(user_id)
    data['current_scene'] = scene['id']

    # Отправляем сообщение сценария
    if scene.get('message'):
        target = message or (callback.message if callback else None)
        if target:
            await target.answer(scene['message'])

    # Обрабатываем блоки
    for block in scene.get('blocks', []):
        await process_block(user_id, block, message, callback)

    # Переход к следующему сценарию
    if scene.get('nextScenario'):
        next_scene = find_scene(scene['nextScenario'])
        if next_scene:
            await asyncio.sleep(0.5)  # Небольшая задержка
            await process_scenario(user_id, next_scene, message, callback)


async def process_block(
    user_id: int, 
    block: dict, 
    message: types.Message = None,
    callback: types.CallbackQuery = None
):
    """Обработка блока сценария"""
    block_type = block.get('type')
    target = message or (callback.message if callback else None)
    
    if not target:
        return

    if block_type == 'message':
        await handle_message_block(user_id, block, target)

    elif block_type == 'question':
        await handle_question_block(user_id, block, target)

    elif block_type == 'condition':
        await handle_condition_block(user_id, block, target, message, callback)

    elif block_type == 'action':
        await handle_action_block(user_id, block, target, message, callback)

    elif block_type == 'keyboard':
        await handle_keyboard_block(user_id, block, target)


async def handle_message_block(user_id: int, block: dict, target: types.Message):
    """Обработка блока сообщения"""
    text = block.get('text', '')
    parse_mode = block.get('parseMode', 'none')
    
    if parse_mode == 'none':
        parse_mode = None
    
    await target.answer(text, parse_mode=parse_mode)
    
    # Переход к следующему сценарию если указан
    if block.get('nextScenario'):
        next_scene = find_scene(block['nextScenario'])
        if next_scene:
            await asyncio.sleep(0.5)
            await process_scenario(user_id, next_scene, target)


async def handle_question_block(user_id: int, block: dict, target: types.Message):
    """Обработка блока вопроса"""
    text = block.get('text', '')
    buttons = block.get('buttons', [])
    variable = block.get('variable', '')
    
    if buttons:
        keyboard = create_inline_keyboard(buttons)
        await target.answer(text, reply_markup=keyboard)
    else:
        await target.answer(text)
    
    # Сохраняем информацию о вопросе для обработки ответа
    data = get_user_data(user_id)
    data['current_question'] = {
        'variable': variable,
        'nextScenario': block.get('nextScenario'),
        'buttons': buttons
    }


async def handle_condition_block(
    user_id: int, 
    block: dict, 
    target: types.Message,
    message: types.Message = None,
    callback: types.CallbackQuery = None
):
    """Обработка блока условия"""
    if evaluate_condition(user_id, block):
        if block.get('trueScenario'):
            next_scene = find_scene(block['trueScenario'])
            if next_scene:
                await asyncio.sleep(0.3)
                await process_scenario(user_id, next_scene, message, callback)
    else:
        if block.get('falseScenario'):
            next_scene = find_scene(block['falseScenario'])
            if next_scene:
                await asyncio.sleep(0.3)
                await process_scenario(user_id, next_scene, message, callback)


async def handle_action_block(
    user_id: int, 
    block: dict, 
    target: types.Message,
    message: types.Message = None,
    callback: types.CallbackQuery = None
):
    """Обработка блока действия"""
    action_type = block.get('actionType')
    
    if action_type == 'set_variable':
        set_variable(user_id, block.get('variable', ''), block.get('value', ''))
    
    elif action_type == 'clear_variable':
        clear_variable(user_id, block.get('variable', ''))
    
    elif action_type == 'delay':
        delay_ms = block.get('delay', 1000)
        await asyncio.sleep(delay_ms / 1000)
    
    elif action_type == 'api_request':
        # HTTP запрос (требует aiohttp)
        url = block.get('url', '')
        method = block.get('method', 'GET')
        if url:
            try:
                import aiohttp
                async with aiohttp.ClientSession() as session:
                    async with session.request(method, url) as response:
                        result = await response.text()
                        set_variable(user_id, 'api_response', result)
            except Exception as e:
                print(f"API request error: {e}")
    
    elif action_type == 'send_message':
        # Отправка дополнительного сообщения
        text = block.get('text', '')
        if text:
            await target.answer(text)
    
    # Обработка блоков базы данных
    elif action_type == 'database':
        await handle_database_block(user_id, block, target)
    
    # Переход к следующему сценарию если указан
    if block.get('nextScenario'):
        next_scene = find_scene(block['nextScenario'])
        if next_scene:
            await asyncio.sleep(0.3)
            await process_scenario(user_id, next_scene, message, callback)


async def handle_database_block(user_id: int, block: dict, target: types.Message):
    """Обработка блока работы с базой данных (Google Sheets)"""
    if not GS_AVAILABLE:
        await target.answer('❌ База данных не подключена')
        return
    
    db = get_database()
    if not db:
        await target.answer('❌ Ошибка подключения к базе данных')
        return
    
    db_action = block.get('dbAction', 'create')
    sheet_name = block.get('sheetName', 'Users')
    
    try:
        if db_action == 'create':
            # Создание записи
            data = block.get('data', {})
            # Подстановка переменных из {{variable}}
            data_str = json.dumps(data)
            for var_name, var_value in get_user_data(user_id)['variables'].items():
                data_str = data_str.replace(f'{{{{{var_name}}}}}', str(var_value))
            data = json.loads(data_str)
            
            result = db.create_record(sheet_name, data)
            set_variable(user_id, 'db_result', 'created')
            await target.answer('✅ Запись создана')
        
        elif db_action == 'read':
            # Чтение записей
            where = block.get('where', '')
            variable = block.get('variable', 'db_result')
            
            if '=' in where:
                column, value = where.split('=', 1)
                # Подстановка переменных
                for var_name, var_value in get_user_data(user_id)['variables'].items():
                    value = value.replace(f'{{{{{var_name}}}}}', str(var_value))
                
                results = db.find_rows(sheet_name, column, value)
                set_variable(user_id, variable, json.dumps(results, ensure_ascii=False))
                
                if results:
                    await target.answer(f'📊 Найдено записей: {len(results)}')
                    # Показываем первую запись
                    first = results[0]
                    preview = '\n'.join(f'{k}: {v}' for k, v in list(first.items())[:5])
                    await target.answer(f'```\n{preview}\n```', parse_mode='Markdown')
                else:
                    await target.answer('📭 Ничего не найдено')
            else:
                # Чтение всех записей
                results = db.get_all_as_dicts(sheet_name)
                set_variable(user_id, variable, json.dumps(results, ensure_ascii=False))
                await target.answer(f'📊 Загружено {len(results)} записей')
        
        elif db_action == 'update':
            # Обновление записи
            where = block.get('where', '')
            data = block.get('data', {})
            
            if '=' in where:
                column, value = where.split('=', 1)
                # Подстановка переменных
                for var_name, var_value in get_user_data(user_id)['variables'].items():
                    value = value.replace(f'{{{{{var_name}}}}}', str(var_value))
                
                result = db.update_record(sheet_name, column, value, data)
                set_variable(user_id, 'db_result', 'updated')
                await target.answer('✅ Запись обновлена')
        
        elif db_action == 'delete':
            # Удаление записи
            where = block.get('where', '')
            
            if '=' in where:
                column, value = where.split('=', 1)
                # Подстановка переменных
                for var_name, var_value in get_user_data(user_id)['variables'].items():
                    value = value.replace(f'{{{{{var_name}}}}}', str(var_value))
                
                result = db.delete_record(sheet_name, column, value)
                set_variable(user_id, 'db_result', 'deleted')
                await target.answer('✅ Запись удалена')
    
    except Exception as e:
        print(f"Database error: {e}")
        await target.answer(f'❌ Ошибка БД: {str(e)}')


async def handle_keyboard_block(user_id: int, block: dict, target: types.Message):
    """Обработка блока клавиатуры"""
    buttons = block.get('buttons', [])
    keyboard_type = block.get('keyboardType', 'inline')
    
    if keyboard_type == 'inline':
        keyboard = create_inline_keyboard(buttons)
        await target.answer('Выберите действие:', reply_markup=keyboard)
    else:
        keyboard = create_reply_keyboard(buttons)
        await target.answer('Выберите действие:', reply_markup=keyboard)


# Обработчик команды /start
@dp.message(Command('start'))
async def cmd_start(message: types.Message):
    user_id = message.from_user.id
    
    # Сброс данных при новом старте
    data = get_user_data(user_id)
    data['variables'] = {}
    data['current_scene'] = None
    data['current_question'] = None
    
    scene = find_scene_by_trigger('/start')
    if scene:
        await process_scenario(user_id, scene, message)
    else:
        await message.answer('Добро пожаловать!')


# Обработчик текстовых сообщений
@dp.message()
async def handle_text(message: types.Message, state: FSMContext):
    user_id = message.from_user.id
    text = message.text
    
    if not text:
        return
    
    # Проверяем, есть ли активный вопрос
    data = get_user_data(user_id)
    question = data.get('current_question')
    
    if question:
        # Сохраняем ответ в переменную
        var_name = question.get('variable')
        if var_name:
            set_variable(user_id, var_name, text)
        
        # Очищаем вопрос
        data['current_question'] = None
        
        # Проверяем, была ли кнопка нажата
        buttons = question.get('buttons', [])
        if buttons:
            for btn in buttons:
                if btn.get('text') == text:
                    action = btn.get('action', '')
                    if action.startswith('scene:'):
                        scene_id = action.replace('scene:', '')
                        scene = find_scene(scene_id)
                        if scene:
                            await process_scenario(user_id, scene, message)
                            return
                    elif action:
                        # Выполняем действие
                        await process_scenario(user_id, {'blocks': [{
                            'type': 'action',
                            'actionType': 'set_variable',
                            'variable': 'button_action',
                            'value': action
                        }]}, message)
        
        # Переход к следующему сценарию если указан
        if question.get('nextScenario'):
            next_scene = find_scene(question['nextScenario'])
            if next_scene:
                await asyncio.sleep(0.3)
                await process_scenario(user_id, next_scene, message)
        return
    
    # Ищем сценарий по триггеру
    scene = find_scene_by_trigger(text)
    if scene:
        await process_scenario(user_id, scene, message)
        return
    
    # Если ничего не найдено - показываем сообщение по умолчанию
    default_message = config['config'].get('defaultMessage', '')
    if default_message:
        await message.answer(default_message)


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
            return
    
    # Обработка других действий
    if data:
        # Сохраняем действие в переменную
        set_variable(user_id, 'callback_data', data)
        
        # Ищем сценарий с кнопкой содержащей такой callback
        for scene in config['config']['scenes']:
            for block in scene.get('blocks', []):
                if block.get('type') == 'keyboard':
                    for btn in block.get('buttons', []):
                        if btn.get('callback') == data or btn.get('action') == data:
                            if block.get('nextScenario'):
                                next_scene = find_scene(block['nextScenario'])
                                if next_scene:
                                    await process_scenario(user_id, next_scene, callback.message)
                                    return


# Обработчик команд меню
@dp.message(Command('help'))
async def cmd_help(message: types.Message):
    await message.answer(
        "Доступные команды:\n"
        "/start - Запустить бота\n"
        "/help - Эта справка\n"
        "/menu - Главное меню\n"
        "/webapp - Открыть Mini App"
    )


# Обработчик Mini Apps
@dp.message(Command('webapp'))
async def cmd_webapp(message: types.Message):
    """Открытие Mini App"""
    if not MINI_APP_URL:
        await message.answer('Mini App не настроен')
        return
    
    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(
            text='Открыть приложение',
            web_app=WebAppInfo(url=MINI_APP_URL)
        )]
    ])
    
    await message.answer('Нажмите на кнопку ниже, чтобы открыть приложение:', 
                        reply_markup=keyboard)


# Обработчик данных от Mini Apps
@dp.message(lambda msg: msg.web_app_data)
async def handle_webapp_data(message: types.Message):
    """Получение данных от Mini App"""
    user_id = message.from_user.id
    data = message.web_app_data.data
    
    try:
        parsed_data = json.loads(data)
        action = parsed_data.get('action', '')
        
        # Сохраняем данные в переменные
        for key, value in parsed_data.items():
            if key != 'action':
                set_variable(user_id, f'webapp_{key}', value)
        
        # Обработка действий
        if action == 'callback':
            callback_data = parsed_data.get('data', '')
            # Ищем сценарий по callback
            scene = find_scene_by_trigger(callback_data)
            if scene:
                await process_scenario(user_id, scene, message)
        
        elif action == 'submit':
            # Обработка формы
            await message.answer('Данные получены!')
            
            # Сохранение в Google Sheets если настроено
            if GS_AVAILABLE:
                db = get_database()
                if db:
                    db.create_record('Users', {
                        'user_id': str(user_id),
                        'username': message.from_user.username or '',
                        'data': json.dumps(parsed_data),
                        'created_at': datetime.now().isoformat()
                    })
        
    except json.JSONDecodeError:
        await message.answer(f'Получены данные: {data}')


# Обработчик для кнопки Menu (Mini App в меню)
@dp.message(lambda msg: MINI_APP_URL and msg.text == 'Открыть приложение')
async def handle_menu_webapp(message: types.Message):
    """Кнопка Mini App в главном меню"""
    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(
            text='Запустить',
            web_app=WebAppInfo(url=MINI_APP_URL)
        )]
    ])
    await message.answer('Приложение готово к работе!', reply_markup=keyboard)


# Запуск бота
async def main():
    bot_info = config.get('bot', {})
    print(f"🤖 Бот '{bot_info.get('name', 'Unknown')}' запущен...")
    print(f"Username: @{bot_info.get('username', '')}")
    
    if MINI_APP_URL:
        print(f"📱 Mini App URL: {MINI_APP_URL}")
    
    if GS_AVAILABLE and GOOGLE_SHEET_ID:
        print(f"🗄️ Google Sheets подключена: {GOOGLE_SHEET_ID}")
    
    print(f"Нажмите Ctrl+C для остановки")

    await dp.start_polling(bot)


if __name__ == '__main__':
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n👋 Бот остановлен")
