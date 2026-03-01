/**
 * Telegram Bot JS Library
 * Универсальная библиотека для создания Telegram ботов
 * Работает в браузере и Node.js
 */

class TelegramBot {
    constructor(token, webhookUrl = null) {
        this.token = token;
        this.webhookUrl = webhookUrl;
        this.apiBase = 'https://api.telegram.org/bot' + token;
        this.scenes = {};
        this.userStates = new Map();
        this.userVariables = new Map();
        
        // Обработчики событий
        this.handlers = {
            message: [],
            callback_query: [],
            command: new Map()
        };
    }

    /**
     * HTTP запрос к Telegram API
     */
    async request(method, params = {}) {
        const url = `${this.apiBase}/${method}`;
        
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(params)
            });
            
            return await response.json();
        } catch (error) {
            console.error('Telegram API error:', error);
            throw error;
        }
    }

    /**
     * Установка webhook
     */
    async setWebhook() {
        if (!this.webhookUrl) {
            throw new Error('Webhook URL не указан');
        }
        
        return await this.request('setWebhook', {
            url: this.webhookUrl
        });
    }

    /**
     * Удаление webhook
     */
    async deleteWebhook() {
        return await this.request('deleteWebhook');
    }

    /**
     * Получение информации о webhook
     */
    async getWebhookInfo() {
        return await this.request('getWebhookInfo');
    }

    /**
     * Отправка сообщения
     */
    async sendMessage(chatId, text, options = {}) {
        const params = {
            chat_id: chatId,
            text: text,
            parse_mode: 'HTML',
            ...options
        };
        
        return await this.request('sendMessage', params);
    }

    /**
     * Отправка фото
     */
    async sendPhoto(chatId, photo, options = {}) {
        const params = {
            chat_id: chatId,
            photo: photo,
            ...options
        };
        
        return await this.request('sendPhoto', params);
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
            params.reply_markup = {
                inline_keyboard: keyboard
            };
        } else {
            params.reply_markup = {
                keyboard: keyboard,
                resize_keyboard: true
            };
        }
        
        return await this.request('sendMessage', params);
    }

    /**
     * Редактирование сообщения
     */
    async editMessageText(chatId, messageId, text, options = {}) {
        const params = {
            chat_id: chatId,
            message_id: messageId,
            text: text,
            parse_mode: 'HTML',
            ...options
        };
        
        return await this.request('editMessageText', params);
    }

    /**
     * Редактирование inline клавиатуры
     */
    async editMessageReplyMarkup(chatId, messageId, keyboard) {
        const params = {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: {
                inline_keyboard: keyboard
            }
        };
        
        return await this.request('editMessageReplyMarkup', params);
    }

    /**
     * Удаление сообщения
     */
    async deleteMessage(chatId, messageId) {
        return await this.request('deleteMessage', {
            chat_id: chatId,
            message_id: messageId
        });
    }

    /**
     * Ответ на callback query
     */
    async answerCallbackQuery(callbackQueryId, text = null, showAlert = false) {
        const params = {
            callback_query_id: callbackQueryId,
            show_alert: showAlert
        };
        
        if (text) {
            params.text = text;
        }
        
        return await this.request('answerCallbackQuery', params);
    }

    /**
     * Отправка действия (typing, upload_photo, etc.)
     */
    async sendChatAction(chatId, action) {
        return await this.request('sendChatAction', {
            chat_id: chatId,
            action: action
        });
    }

    /**
     * Получение информации о пользователе
     */
    async getChat(chatId) {
        return await this.request('getChat', {
            chat_id: chatId
        });
    }

    /**
     * Регистрация сценария
     */
    registerScene(name, scenario) {
        this.scenes[name] = scenario;
        return this;
    }

    /**
     * Регистрация обработчика команд
     */
    onCommand(command, handler) {
        this.handlers.command.set(command, handler);
        return this;
    }

    /**
     * Регистрация обработчика сообщений
     */
    onMessage(handler) {
        this.handlers.message.push(handler);
        return this;
    }

    /**
     * Регистрация обработчика callback query
     */
    onCallbackQuery(handler) {
        this.handlers.callback_query.push(handler);
        return this;
    }

    /**
     * Получение состояния пользователя
     */
    getUserState(userId) {
        return this.userStates.get(userId);
    }

    /**
     * Установка состояния пользователя
     */
    setUserState(userId, state) {
        this.userStates.set(userId, state);
    }

    /**
     * Получение переменной пользователя
     */
    getVariable(userId, name, defaultValue = null) {
        const vars = this.userVariables.get(userId) || {};
        return vars[name] !== undefined ? vars[name] : defaultValue;
    }

    /**
     * Установка переменной пользователя
     */
    setVariable(userId, name, value) {
        if (!this.userVariables.has(userId)) {
            this.userVariables.set(userId, {});
        }
        this.userVariables.get(userId)[name] = value;
    }

    /**
     * Очистка переменной пользователя
     */
    clearVariable(userId, name) {
        const vars = this.userVariables.get(userId);
        if (vars) {
            delete vars[name];
        }
    }

    /**
     * Обработка входящего обновления
     */
    async handleUpdate(update) {
        try {
            // Message
            if (update.message) {
                return await this.handleMessage(update.message);
            }
            
            // Callback Query
            if (update.callback_query) {
                return await this.handleCallbackQuery(update.callback_query);
            }
            
            // Edited Message
            if (update.edited_message) {
                return await this.handleMessage(update.edited_message);
            }
            
            return { ok: false, error: 'Unknown update type' };
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
            const handler = this.handlers.command.get(command);
            
            if (handler) {
                return await handler.call(this, message);
            }
        }
        
        // Обработка через сценарии
        const state = this.getUserState(userId);
        if (state) {
            await this.processSceneStep(userId, chatId, state, message);
        }
        
        // Обработчики сообщений
        for (const handler of this.handlers.message) {
            await handler.call(this, message);
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
        
        // Обработчики callback query
        for (const handler of this.handlers.callback_query) {
            await handler.call(this, callbackQuery);
        }
        
        // Обработка через сценарии
        const state = this.getUserState(userId);
        if (state) {
            await this.processSceneStep(userId, chatId, state, {
                type: 'callback',
                data: data,
                message: callbackQuery.message
            });
        }
        
        return { ok: true };
    }

    /**
     * Обработка шага сценария
     */
    async processSceneStep(userId, chatId, state, input) {
        const scene = this.scenes[state.scene];
        if (!scene) return;
        
        const currentBlock = scene.blocks[state.currentBlock || 0];
        if (!currentBlock) return;
        
        await this.executeBlock(userId, chatId, currentBlock, input);
    }

    /**
     * Выполнение блока сценария
     */
    async executeBlock(userId, chatId, block, input = null) {
        switch (block.type) {
            case 'message':
                await this.sendMessage(chatId, this.substituteVariables(userId, block.text));
                break;
                
            case 'question':
                await this.sendMessage(chatId, this.substituteVariables(userId, block.question));
                this.setUserState(userId, {
                    scene: block.scenarioId,
                    currentBlock: block.index,
                    variable: block.variable
                });
                break;
                
            case 'keyboard':
                const keyboard = this.buildKeyboard(block.buttons);
                await this.sendMessageWithKeyboard(
                    chatId,
                    this.substituteVariables(userId, block.text),
                    keyboard,
                    block.keyboardType === 'inline'
                );
                break;
                
            case 'condition':
                const value = this.getVariable(userId, block.variable);
                const conditionMet = this.checkCondition(value, block.operator, block.value);
                
                if (conditionMet && block.trueScenario) {
                    this.setUserState(userId, { scene: block.trueScenario, currentBlock: 0 });
                } else if (!conditionMet && block.falseScenario) {
                    this.setUserState(userId, { scene: block.falseScenario, currentBlock: 0 });
                }
                break;
                
            case 'action':
                await this.executeAction(userId, chatId, block);
                break;
                
            case 'database':
                await this.executeDatabaseOperation(userId, block);
                break;
        }
        
        // Переход к следующему блоку
        const scene = this.scenes[block.scenarioId];
        if (scene && block.index !== undefined) {
            const nextBlock = scene.blocks[block.index + 1];
            if (nextBlock) {
                this.setUserState(userId, {
                    scene: block.scenarioId,
                    currentBlock: block.index + 1
                });
                await this.executeBlock(userId, chatId, nextBlock);
            } else {
                this.setUserState(userId, null);
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
                const response = await fetch(block.url, {
                    method: block.method || 'GET',
                    headers: block.headers || {},
                    body: block.body ? JSON.stringify(block.body) : null
                });
                const data = await response.json();
                this.setVariable(userId, 'api_response', data);
                break;
                
            case 'send_message':
                await this.sendMessage(chatId, this.substituteVariables(userId, block.text));
                break;
        }
    }

    /**
     * Операция с базой данных
     */
    async executeDatabaseOperation(userId, block) {
        // Заглушка для Google Sheets интеграции
        console.log('Database operation:', block);
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
                row.push({
                    text: button.text,
                    callback_data: button.callback
                });
            } else {
                row.push(button.text);
            }
            
            if (button.newRow || row.length >= 2) {
                keyboard.push(row);
                row = [];
            }
        }
        
        if (row.length > 0) {
            keyboard.push(row);
        }
        
        return keyboard;
    }

    /**
     * Подстановка переменных в текст
     */
    substituteVariables(userId, text) {
        if (!text) return '';
        
        return text.replace(/\{\{(\w+)\}\}/g, (match, variable) => {
            return this.getVariable(userId, variable, match);
        });
    }

    /**
     * Проверка условия
     */
    checkCondition(value, operator, expected) {
        switch (operator) {
            case 'equals':
                return value == expected;
            case 'not_equals':
                return value != expected;
            case 'contains':
                return value && value.includes(expected);
            case 'empty':
                return !value || value === '';
            case 'not_empty':
                return value && value !== '';
            case 'greater':
                return Number(value) > Number(expected);
            case 'less':
                return Number(value) < Number(expected);
            default:
                return false;
        }
    }

    /**
     * Запуск polling (для Node.js)
     */
    async startPolling(options = {}) {
        const { timeout = 30, limit = 100 } = options;
        let offset = 0;
        
        console.log('Bot started with polling');
        
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
     * Обработчик webhook (для Express/Koa)
     */
    handleWebhook(req, res) {
        const update = req.body;
        
        this.handleUpdate(update)
            .then(result => {
                res.json({ ok: true });
            })
            .catch(error => {
                console.error('Webhook error:', error);
                res.status(500).json({ ok: false, error: error.message });
            });
    }

    /**
     * Получение me
     */
    async getMe() {
        return await this.request('getMe');
    }
}

// Экспорт для разных сред
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TelegramBot;
}

if (typeof window !== 'undefined') {
    window.TelegramBot = TelegramBot;
}
