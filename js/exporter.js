/**
 * Экспорт бота в JSON и другие форматы
 */

const exporter = {
    /**
     * Экспорт текущего бота
     */
    exportBot(bot) {
        const targetBot = bot || app.currentBot;
        
        if (!targetBot) {
            ui.toast('Нет бота для экспорта', 'warning');
            return;
        }

        const exportData = this.prepareExportData(targetBot);
        const jsonString = JSON.stringify(exportData, null, 2);
        
        // Скачиваем файл
        this.downloadFile(jsonString, `${targetBot.username}_config.json`, 'application/json');
        
        ui.toast('Бот экспортирован в JSON', 'success');
        
        return exportData;
    },

    /**
     * Подготовка данных для экспорта
     */
    prepareExportData(bot) {
        return {
            version: '1.0',
            exportedAt: new Date().toISOString(),
            bot: {
                id: bot.id,
                name: bot.name,
                username: bot.username,
                description: bot.description,
                createdAt: bot.createdAt,
                updatedAt: bot.updatedAt
            },
            config: {
                scenes: bot.scenes,
                variables: bot.variables,
                integrations: bot.integrations
            }
        };
    },

    /**
     * Экспорт в формат для деплоя
     */
    exportForDeploy(bot) {
        const exportData = this.prepareExportData(bot);

        // Создаём структуру файлов для деплоя
        const deployStructure = {
            'bot-config.json': JSON.stringify(exportData, null, 2),
            'bot.js': this.generateBotRunnerJS(),
            'bot.py': this.generateBotRunner(),
            'requirements.txt': this.generateRequirements(),
            'package.json': this.generatePackageJson(bot),
            'README.md': this.generateReadme(bot),
            '.env.example': this.generateEnvExample(bot)
        };

        return deployStructure;
    },

    /**
     * Генерация package.json
     */
    generatePackageJson(bot) {
        return JSON.stringify({
            "name": bot.username || 'telegram-bot',
            "version": "1.0.0",
            "description": bot.description || 'Telegram bot created with BotBuilder',
            "main": "bot.js",
            "scripts": {
                "start": "node bot.js",
                "dev": "node --watch bot.js"
            },
            "dependencies": {
                "node-fetch": "^2.7.0",
                "express": "^4.18.2"
            },
            "engines": {
                "node": ">=16.0.0"
            },
            "author": "BotBuilder",
            "license": "MIT"
        }, null, 2);
    },

    /**
     * Генерация JS-раннера для бота
     */
    generateBotRunnerJS() {
        return `/**
 * Telegram Bot Runner (JavaScript)
 * Автоматически сгенерированный бот из BotBuilder
 * Работает в Node.js с polling или webhook
 */

const fetch = require('node-fetch');
const express = require('express');

// Загрузка конфигурации
const config = require('./bot-config.json');
require('dotenv').config();

const BOT_TOKEN = process.env.BOT_TOKEN;
const WEBHOOK_URL = process.env.WEBHOOK_URL || null;

if (!BOT_TOKEN) {
    console.error('❌ BOT_TOKEN не найден! Добавьте его в .env файл');
    process.exit(1);
}

/**
 * Telegram Bot Class
 */
class TelegramBot {
    constructor(token, webhookUrl = null) {
        this.token = token;
        this.webhookUrl = webhookUrl;
        this.apiBase = 'https://api.telegram.org/bot' + token;
        this.scenes = {};
        this.userStates = new Map();
        this.userVariables = new Map();
        
        // Загрузка сценариев из конфига
        if (config.config && config.config.scenes) {
            config.config.scenes.forEach(scene => {
                this.registerScene(scene.id, scene);
            });
        }
        
        // Регистрация обработчиков
        this.setupHandlers();
    }

    /**
     * HTTP запрос к Telegram API
     */
    async request(method, params = {}) {
        const url = \`\${this.apiBase}/\${method}\`;
        
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(params)
            });
            
            return await response.json();
        } catch (error) {
            console.error('Telegram API error:', error);
            throw error;
        }
    }

    /**
     * Отправка сообщения
     */
    async sendMessage(chatId, text, options = {}) {
        return await this.request('sendMessage', {
            chat_id: chatId,
            text: text,
            parse_mode: 'HTML',
            ...options
        });
    }

    /**
     * Отправка с клавиатурой
     */
    async sendMessageWithKeyboard(chatId, text, keyboard, inline = false) {
        const params = {
            chat_id: chatId,
            text: text,
            parse_mode: 'HTML'
        };
        
        if (inline) {
            params.reply_markup = { inline_keyboard: keyboard };
        } else {
            params.reply_markup = {
                keyboard: keyboard,
                resize_keyboard: true
            };
        }
        
        return await this.request('sendMessage', params);
    }

    /**
     * Ответ на callback query
     */
    async answerCallbackQuery(callbackQueryId, text = null, showAlert = false) {
        return await this.request('answerCallbackQuery', {
            callback_query_id: callbackQueryId,
            text: text,
            show_alert: showAlert
        });
    }

    /**
     * Регистрация сценария
     */
    registerScene(name, scenario) {
        this.scenes[name] = scenario;
    }

    /**
     * Настройка обработчиков
     */
    setupHandlers() {
        // Обработчик команд
        this.onCommand('start', async (message) => {
            await this.handleCommand(message, 'start');
        });
        
        this.onCommand('help', async (message) => {
            await this.handleCommand(message, 'help');
        });
    }

    /**
     * Обработчик команд
     */
    async handleCommand(message, command) {
        const userId = message.from.id;
        const chatId = message.chat.id;
        
        // Ищем сценарий с таким триггером
        const scene = Object.values(this.scenes).find(s => 
            s.trigger === '/' + command || s.trigger === command
        );
        
        if (scene) {
            this.userStates.set(userId, { scene: scene.id, currentBlock: 0 });
            await this.processSceneStep(userId, chatId, scene, 0);
        } else {
            await this.sendMessage(chatId, 'Команда не найдена');
        }
    }

    /**
     * Обработка входящего обновления
     */
    async handleUpdate(update) {
        try {
            if (update.message) {
                return await this.handleMessage(update.message);
            }
            
            if (update.callback_query) {
                return await this.handleCallbackQuery(update.callback_query);
            }
            
            return { ok: false };
        } catch (error) {
            console.error('Handle update error:', error);
            return { ok: false, error: error.message };
        }
    }

    /**
     * Обработка сообщения
     */
    async handleMessage(message) {
        const userId = message.from.id;
        const chatId = message.chat.id;
        const text = message.text || '';
        
        // Проверка на команду
        if (text.startsWith('/')) {
            const command = text.split(' ')[0].substring(1);
            const handler = this.handlers?.command?.get(command);
            
            if (handler) {
                return await handler.call(this, message);
            }
        }
        
        // Обработка через сценарии
        const state = this.userStates.get(userId);
        if (state) {
            const scene = this.scenes[state.scene];
            if (scene) {
                await this.processSceneStep(userId, chatId, scene, state.currentBlock || 0, message);
            }
        }
        
        return { ok: true };
    }

    /**
     * Обработка callback query
     */
    async handleCallbackQuery(callbackQuery) {
        const userId = callbackQuery.from.id;
        const chatId = callbackQuery.message.chat.id;
        const data = callbackQuery.data;
        
        const state = this.userStates.get(userId);
        if (state) {
            const scene = this.scenes[state.scene];
            if (scene) {
                await this.processSceneStep(userId, chatId, scene, state.currentBlock || 0, {
                    type: 'callback',
                    data: data
                });
            }
        }
        
        await this.answerCallbackQuery(callbackQuery.id);
        return { ok: true };
    }

    /**
     * Обработка шага сценария
     */
    async processSceneStep(userId, chatId, scene, blockIndex, input = null) {
        const block = scene.blocks[blockIndex];
        if (!block) {
            this.userStates.delete(userId);
            return;
        }
        
        await this.executeBlock(userId, chatId, block, input);
    }

    /**
     * Выполнение блока
     */
    async executeBlock(userId, chatId, block, input = null) {
        switch (block.type) {
            case 'message':
                await this.sendMessage(chatId, this.substituteVariables(userId, block.text));
                this.nextBlock(userId, block);
                break;
                
            case 'question':
                await this.sendMessage(chatId, this.substituteVariables(userId, block.question));
                this.userStates.set(userId, {
                    scene: block.scenarioId,
                    currentBlock: block.index,
                    variable: block.variable,
                    expectInput: true
                });
                break;
                
            case 'keyboard':
                const keyboard = this.buildKeyboard(block.buttons, block.keyboardType === 'inline');
                await this.sendMessageWithKeyboard(
                    chatId,
                    this.substituteVariables(userId, block.text || 'Выберите опцию'),
                    keyboard,
                    block.keyboardType === 'inline'
                );
                this.nextBlock(userId, block);
                break;
                
            case 'condition':
                const value = this.getVariable(userId, block.variable);
                const conditionMet = this.checkCondition(value, block.operator, block.value);
                
                if (conditionMet && block.trueScenario) {
                    const trueScene = this.scenes[block.trueScenario];
                    if (trueScene) {
                        this.userStates.set(userId, { scene: block.trueScenario, currentBlock: 0 });
                        await this.processSceneStep(userId, chatId, trueScene, 0);
                    }
                } else if (!conditionMet && block.falseScenario) {
                    const falseScene = this.scenes[block.falseScenario];
                    if (falseScene) {
                        this.userStates.set(userId, { scene: block.falseScenario, currentBlock: 0 });
                        await this.processSceneStep(userId, chatId, falseScene, 0);
                    }
                } else {
                    this.nextBlock(userId, block);
                }
                break;
                
            case 'action':
                await this.executeAction(userId, chatId, block);
                this.nextBlock(userId, block);
                break;
        }
    }

    /**
     * Переход к следующему блоку
     */
    nextBlock(userId, block) {
        const scene = this.scenes[block.scenarioId];
        if (scene && block.index !== undefined) {
            const nextIndex = block.index + 1;
            if (nextIndex < scene.blocks.length) {
                this.userStates.set(userId, {
                    scene: block.scenarioId,
                    currentBlock: nextIndex
                });
            } else {
                this.userStates.delete(userId);
            }
        }
    }

    /**
     * Выполнение действия
     */
    async executeAction(userId, chatId, block) {
        switch (block.actionType) {
            case 'set_variable':
                this.setVariable(userId, block.variable, this.substituteVariables(userId, block.value));
                break;
            case 'clear_variable':
                this.clearVariable(userId, block.variable);
                break;
            case 'delay':
                await new Promise(resolve => setTimeout(resolve, block.delay || 1000));
                break;
            case 'api_request':
                try {
                    const response = await fetch(block.url, {
                        method: block.method || 'GET',
                        headers: block.headers || {},
                        body: block.body ? JSON.stringify(block.body) : null
                    });
                    const data = await response.json();
                    this.setVariable(userId, 'api_response', data);
                } catch (error) {
                    console.error('API request error:', error);
                }
                break;
            case 'send_message':
                await this.sendMessage(chatId, this.substituteVariables(userId, block.text));
                break;
        }
    }

    /**
     * Построение клавиатуры
     */
    buildKeyboard(buttons, inline = false) {
        if (!buttons || !Array.isArray(buttons)) return [];
        
        const keyboard = [];
        let row = [];
        
        for (const button of buttons) {
            if (inline) {
                row.push({ text: button.text, callback_data: button.callback });
            } else {
                row.push(button.text);
            }
            
            if (button.newRow || row.length >= 2) {
                keyboard.push(row);
                row = [];
            }
        }
        
        if (row.length > 0) keyboard.push(row);
        return keyboard;
    }

    /**
     * Подстановка переменных
     */
    substituteVariables(userId, text) {
        if (!text) return '';
        
        return text.replace(/\\{\\{(\\w+)\\}\\}/g, (match, variable) => {
            return this.getVariable(userId, variable, match);
        });
    }

    /**
     * Проверка условия
     */
    checkCondition(value, operator, expected) {
        switch (operator) {
            case 'equals': return value == expected;
            case 'not_equals': return value != expected;
            case 'contains': return value && value.includes(expected);
            case 'empty': return !value || value === '';
            case 'not_empty': return value && value !== '';
            case 'greater': return Number(value) > Number(expected);
            case 'less': return Number(value) < Number(expected);
            default: return false;
        }
    }

    /**
     * Переменные пользователя
     */
    getVariable(userId, name, defaultValue = null) {
        const vars = this.userVariables.get(userId) || {};
        return vars[name] !== undefined ? vars[name] : defaultValue;
    }

    setVariable(userId, name, value) {
        if (!this.userVariables.has(userId)) {
            this.userVariables.set(userId, {});
        }
        this.userVariables.get(userId)[name] = value;
    }

    clearVariable(userId, name) {
        const vars = this.userVariables.get(userId);
        if (vars) delete vars[name];
    }

    /**
     * Обработчики
     */
    onCommand(command, handler) {
        if (!this.handlers) this.handlers = { command: new Map() };
        if (!this.handlers.command) this.handlers.command = new Map();
        this.handlers.command.set(command, handler);
    }

    /**
     * Запуск polling
     */
    async startPolling(options = {}) {
        const { timeout = 30, limit = 100 } = options;
        let offset = 0;
        
        console.log('🤖 Бот запущен в режиме polling...');
        console.log('Нажмите Ctrl+C для остановки');
        
        // Получаем информацию о боте
        const me = await this.request('getMe');
        if (me.ok) {
            console.log(\`✅ Бот: @\${me.result.username}\`);
        }
        
        while (true) {
            try {
                const updates = await this.request('getUpdates', {
                    offset: offset,
                    limit: limit,
                    timeout: timeout
                });
                
                if (updates.ok && updates.result) {
                    for (const update of updates.result) {
                        offset = update.update_id + 1;
                        await this.handleUpdate(update);
                    }
                }
            } catch (error) {
                console.error('Polling error:', error);
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
    }

    /**
     * Запуск webhook сервера
     */
    startWebhook(port = 3000) {
        const app = express();
        
        app.use(express.json());
        
        // Endpoint для webhook
        app.post('/webhook', (req, res) => {
            this.handleUpdate(req.body)
                .then(() => res.json({ ok: true }))
                .catch(error => {
                    console.error('Webhook error:', error);
                    res.status(500).json({ ok: false });
                });
        });
        
        // Health check
        app.get('/health', (req, res) => {
            res.json({ status: 'ok' });
        });
        
        app.listen(port, async () => {
            console.log(\`🤖 Бот запущен на порту \${port}\`);
            console.log(\`Webhook URL: \${this.webhookUrl || 'не установлен'}\`);
            
            if (this.webhookUrl) {
                const result = await this.request('setWebhook', { url: this.webhookUrl });
                if (result.ok) {
                    console.log('✅ Webhook установлен');
                }
            }
        });
    }
}

// Создаём и запускаем бота
const bot = new TelegramBot(BOT_TOKEN, WEBHOOK_URL);

// Запуск в режиме polling или webhook
const MODE = process.env.BOT_MODE || 'polling';

if (MODE === 'webhook') {
    const PORT = process.env.PORT || 3000;
    bot.startWebhook(PORT);
} else {
    bot.startPolling();
}
`;
    },

    /**
     * Генерация Python-раннера для бота
     */
    generateBotRunner() {
        return `# -*- coding: utf-8 -*-
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
`;
    },

    /**
     * Генерация requirements.txt
     */
    generateRequirements() {
        return `aiogram>=3.0.0
python-dotenv>=1.0.0
`;
    },

    /**
     * Генерация README.md
     */
    generateReadme(bot) {
        return `# ${bot.name} - Telegram Bot

Бот создан в **BotBuilder** - No-Code конструкторе Telegram ботов.

## 🚀 Быстрый старт

### 1. Установка зависимостей

\`\`\`bash
pip install -r requirements.txt
\`\`\`

### 2. Настройка

Создайте файл \`.env\` на основе \`.env.example\`:

\`\`\`bash
cp .env.example .env
\`\`\`

Отредактируйте \`.env\` и укажите ваш токен бота.

### 3. Запуск

\`\`\`bash
python bot.py
\`\`\`

## 📁 Структура файлов

- \`bot-config.json\` - конфигурация бота (сценарии, блоки, переменные)
- \`bot.py\` - основной файл бота
- \`requirements.txt\` - зависимости Python
- \`.env\` - переменные окружения (токен бота)

## 🛠️ Хостинг

### Railway
1. Создайте новый проект на [Railway](https://railway.app)
2. Подключите этот репозиторий
3. Добавьте переменную окружения \`BOT_TOKEN\`
4. Бот запустится автоматически

### Render
1. Создайте новый Web Service на [Render](https://render.com)
2. Подключите репозиторий
3. Укажите команду запуска: \`python bot.py\`
4. Добавьте переменную окружения \`BOT_TOKEN\`

### VPS
1. Загрузите файлы на сервер
2. Установите Python 3.8+
3. Установите зависимости: \`pip install -r requirements.txt\`
4. Запустите через systemd или supervisor

## 📝 Редактирование

Для изменения логики бота:
1. Откройте проект в BotBuilder
2. Внесите изменения в сценарии
3. Экспортируйте обновлённый \`bot-config.json\`
4. Замените файл на сервере
5. Перезапустите бота

---

Создано в **BotBuilder** 🤖
`;
    },

    /**
     * Генерация .env.example
     */
    generateEnvExample(bot) {
        return `# Токен бота от @BotFather
BOT_TOKEN=${bot.token || 'YOUR_BOT_TOKEN_HERE'}

# Опционально: S3 настройки для медиа
# S3_ENDPOINT=
# S3_ACCESS_KEY=
# S3_SECRET_KEY=
# S3_BUCKET=
`;
    },

    /**
     * Скачивание файла
     */
    downloadFile(content, filename, mimeType = 'text/plain') {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    /**
     * Экспорт всех файлов бота (ZIP)
     */
    async exportAsZip(bot) {
        const deployFiles = this.exportForDeploy(bot);
        
        // Создаём ZIP архив
        const zip = new JSZip();
        
        for (const [filename, content] of Object.entries(deployFiles)) {
            zip.file(filename, content);
        }
        
        const blob = await zip.generateAsync({ type: 'blob' });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${bot.username}_bot.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        ui.toast('Бот экспортирован в ZIP', 'success');
    },

    /**
     * Подготовка к публикации на GitHub
     */
    prepareForGitHub(bot) {
        const deployFiles = this.exportForDeploy(bot);
        
        return {
            files: deployFiles,
            commitMessage: `Update bot: ${bot.name}`,
            botId: bot.id
        };
    }
};
