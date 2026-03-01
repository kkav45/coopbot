/**
 * Визуальный редактор сценариев бота
 */

const builder = {
    // Текущий редактируемый бот
    bot: null,
    
    // Выбранный сценарий
    selectedScenario: null,
    
    // Выбранный блок
    selectedBlock: null,

    /**
     * Инициализация редактора
     */
    init(bot) {
        this.bot = bot;
        this.selectedScenario = bot.scenes[0] || null;
        this.selectedBlock = null;
        this.renderScenarios();
    },

    /**
     * Отрисовка списка сценариев
     */
    renderScenarios() {
        const container = document.getElementById('scenariosList');
        if (!container || !this.bot) return;

        if (this.bot.scenes.length === 0) {
            container.innerHTML = '<p class="hint">Нет сценариев. Создайте первый сценарий.</p>';
            return;
        }

        container.innerHTML = this.bot.scenes.map(scenario => {
            const isActive = this.selectedScenario?.id === scenario.id;
            const blocksCount = scenario.blocks?.length || 0;
            
            return `
                <div class="scenario-card ${isActive ? 'active' : ''}" 
                     data-scenario-id="${scenario.id}"
                     onclick="builder.selectScenario('${scenario.id}')">
                    <div class="scenario-card-header">
                        <span class="scenario-card-title">${this.escapeHtml(scenario.name)}</span>
                        <div class="scenario-card-actions">
                            <button class="block-btn" onclick="event.stopPropagation(); builder.editScenario('${scenario.id}')" title="Редактировать">✏️</button>
                            <button class="block-btn delete" onclick="event.stopPropagation(); builder.deleteScenario('${scenario.id}')" title="Удалить">🗑️</button>
                        </div>
                    </div>
                    <span class="scenario-trigger">${this.escapeHtml(scenario.trigger)}</span>
                    <div class="scenario-card-body">
                        ${blocksCount} блоков(а)
                    </div>
                    ${this.renderBlocks(scenario)}
                </div>
            `;
        }).join('');
    },

    /**
     * Отрисовка блоков сценария
     */
    renderBlocks(scenario) {
        if (!scenario.blocks || scenario.blocks.length === 0) {
            return '';
        }

        return `
            <div class="blocks-container">
                ${scenario.blocks.map((block, index) => `
                    <div class="block-item ${this.selectedBlock?.index === index && this.selectedBlock?.scenarioId === scenario.id ? 'selected' : ''}"
                         onclick="builder.selectBlock('${scenario.id}', ${index})">
                        <div class="block-icon ${block.type}">${this.getBlockIcon(block.type)}</div>
                        <div class="block-content">
                            <div class="block-title">${this.getBlockTitle(block)}</div>
                            <div class="block-preview">${this.getBlockPreview(block)}</div>
                        </div>
                        <div class="block-actions">
                            <button class="block-btn" onclick="event.stopPropagation(); builder.moveBlock('${scenario.id}', ${index}, -1)" title="Вверх">↑</button>
                            <button class="block-btn" onclick="event.stopPropagation(); builder.moveBlock('${scenario.id}', ${index}, 1)" title="Вниз">↓</button>
                            <button class="block-btn delete" onclick="event.stopPropagation(); builder.deleteBlock('${scenario.id}', ${index})" title="Удалить">🗑️</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    },

    /**
     * Выбор сценария
     */
    selectScenario(scenarioId) {
        this.selectedScenario = this.bot.scenes.find(s => s.id === scenarioId);
        this.selectedBlock = null;
        this.renderScenarios();
        this.showProperties({ type: 'scenario', data: this.selectedScenario });
    },

    /**
     * Выбор блока
     */
    selectBlock(scenarioId, blockIndex) {
        const scenario = this.bot.scenes.find(s => s.id === scenarioId);
        if (!scenario) return;

        this.selectedScenario = scenario;
        this.selectedBlock = { scenarioId, index: blockIndex };
        this.renderScenarios();
        
        const block = scenario.blocks[blockIndex];
        this.showProperties({ type: 'block', data: block, scenarioId, blockIndex });
    },

    /**
     * Добавление нового сценария
     */
    addScenario() {
        const name = prompt('Название сценария:', 'Новый сценарий');
        if (!name) return;

        const trigger = prompt('Триггер (команда или текст):', '/new');
        if (!trigger) return;

        const scenario = {
            id: 'scenario_' + Date.now(),
            name: name,
            trigger: trigger,
            message: '',
            blocks: []
        };

        this.bot.scenes.push(scenario);
        app.updateCurrentBot();
        this.renderScenarios();
        this.selectScenario(scenario.id);
        
        ui.toast('Сценарий создан', 'success');
    },

    /**
     * Редактирование сценария
     */
    editScenario(scenarioId) {
        const scenario = this.bot.scenes.find(s => s.id === scenarioId);
        if (!scenario) return;

        const name = prompt('Название сценария:', scenario.name);
        if (!name) return;

        const trigger = prompt('Триггер:', scenario.trigger);
        if (!trigger) return;

        scenario.name = name;
        scenario.trigger = trigger;
        app.updateCurrentBot();
        this.renderScenarios();
        
        ui.toast('Сценарий обновлён', 'success');
    },

    /**
     * Удаление сценария
     */
    deleteScenario(scenarioId) {
        if (this.bot.scenes.length <= 1) {
            ui.toast('Нельзя удалить последний сценарий', 'warning');
            return;
        }

        if (!confirm('Удалить этот сценарий?')) return;

        this.bot.scenes = this.bot.scenes.filter(s => s.id !== scenarioId);
        
        if (this.selectedScenario?.id === scenarioId) {
            this.selectedScenario = this.bot.scenes[0];
        }
        
        app.updateCurrentBot();
        this.renderScenarios();
        
        ui.toast('Сценарий удалён', 'success');
    },

    /**
     * Добавление блока
     */
    addBlock(type) {
        if (!this.selectedScenario) {
            ui.toast('Выберите сценарий для добавления блока', 'warning');
            return;
        }

        if (!this.selectedScenario.blocks) {
            this.selectedScenario.blocks = [];
        }

        const block = this.createBlock(type);
        this.selectedScenario.blocks.push(block);
        app.updateCurrentBot();
        this.renderScenarios();
        
        // Выбираем новый блок
        this.selectBlock(this.selectedScenario.id, this.selectedScenario.blocks.length - 1);
        
        ui.toast('Блок добавлен', 'success');
    },

    /**
     * Создание блока по типу
     */
    createBlock(type) {
        const base = {
            id: 'block_' + Date.now(),
            type: type
        };

        switch (type) {
            case 'message':
                return {
                    ...base,
                    text: 'Новое сообщение',
                    parseMode: 'none'
                };
            
            case 'question':
                return {
                    ...base,
                    text: 'Задайте вопрос пользователю',
                    variable: '',
                    buttons: []
                };
            
            case 'condition':
                return {
                    ...base,
                    variable: '',
                    operator: 'equals',
                    value: '',
                    trueBlock: null,
                    falseBlock: null
                };
            
            case 'action':
                return {
                    ...base,
                    actionType: 'set_variable',
                    variable: '',
                    value: ''
                };
            
            case 'keyboard':
                return {
                    ...base,
                    type: 'inline',
                    buttons: []
                };
            
            // Новые типы блоков для работы с данными
            case 'database':
                return {
                    ...base,
                    dbAction: 'create',
                    sheetName: '',
                    data: {},
                    variable: ''
                };
            
            case 'loop':
                return {
                    ...base,
                    loopType: 'foreach',
                    source: '',
                    variable: '',
                    blocks: []
                };
            
            default:
                return base;
        }
    },

    /**
     * Удаление блока
     */
    deleteBlock(scenarioId, blockIndex) {
        const scenario = this.bot.scenes.find(s => s.id === scenarioId);
        if (!scenario) return;

        if (!confirm('Удалить этот блок?')) return;

        scenario.blocks.splice(blockIndex, 1);
        
        if (this.selectedBlock?.scenarioId === scenarioId && this.selectedBlock?.index === blockIndex) {
            this.selectedBlock = null;
            document.getElementById('propertiesContent').innerHTML = '<p class="hint">Выберите элемент для редактирования</p>';
        }
        
        app.updateCurrentBot();
        this.renderScenarios();
        
        ui.toast('Блок удалён', 'success');
    },

    /**
     * Перемещение блока
     */
    moveBlock(scenarioId, blockIndex, direction) {
        const scenario = this.bot.scenes.find(s => s.id === scenarioId);
        if (!scenario) return;

        const newIndex = blockIndex + direction;
        if (newIndex < 0 || newIndex >= scenario.blocks.length) return;

        // Меняем местами
        [scenario.blocks[blockIndex], scenario.blocks[newIndex]] = 
        [scenario.blocks[newIndex], scenario.blocks[blockIndex]];

        app.updateCurrentBot();
        this.renderScenarios();
        
        // Сохраняем выбор на новом месте
        this.selectBlock(scenarioId, newIndex);
    },

    /**
     * Отображение свойств
     */
    showProperties(item) {
        const container = document.getElementById('propertiesContent');
        if (!container) return;

        if (item.type === 'scenario') {
            container.innerHTML = this.renderScenarioProperties(item.data);
        } else if (item.type === 'block') {
            container.innerHTML = this.renderBlockProperties(item.data, item.scenarioId, item.blockIndex);
        }
    },

    /**
     * Свойства сценария
     */
    renderScenarioProperties(scenario) {
        return `
            <div class="property-group">
                <label>Название</label>
                <input type="text" value="${this.escapeHtml(scenario.name)}" 
                       onchange="builder.updateScenario('name', this.value)">
            </div>
            <div class="property-group">
                <label>Триггер</label>
                <input type="text" value="${this.escapeHtml(scenario.trigger)}" 
                       onchange="builder.updateScenario('trigger', this.value)">
                <small>Команда (например, /start) или текст</small>
            </div>
            <div class="property-group">
                <label>Приветственное сообщение</label>
                <textarea onchange="builder.updateScenario('message', this.value)">${this.escapeHtml(scenario.message || '')}</textarea>
            </div>
            <div class="property-group">
                <label>Переход к другому сценарию</label>
                <select onchange="builder.updateScenario('nextScenario', this.value)">
                    <option value="">-- Не переходить --</option>
                    ${this.bot.scenes.filter(s => s.id !== scenario.id).map(s => 
                        `<option value="${s.id}" ${scenario.nextScenario === s.id ? 'selected' : ''}>${this.escapeHtml(s.name)}</option>`
                    ).join('')}
                </select>
            </div>
        `;
    },

    /**
     * Свойства блока
     */
    renderBlockProperties(block, scenarioId, blockIndex) {
        let html = '';

        switch (block.type) {
            case 'message':
                html = `
                    <div class="property-group">
                        <label>Текст сообщения</label>
                        <textarea onchange="builder.updateBlock('${scenarioId}', ${blockIndex}, 'text', this.value)">${this.escapeHtml(block.text || '')}</textarea>
                    </div>
                    <div class="property-group">
                        <label>Режим парсинга</label>
                        <select onchange="builder.updateBlock('${scenarioId}', ${blockIndex}, 'parseMode', this.value)">
                            <option value="none" ${block.parseMode === 'none' ? 'selected' : ''}>Обычный текст</option>
                            <option value="html" ${block.parseMode === 'html' ? 'selected' : ''}>HTML</option>
                            <option value="markdown" ${block.parseMode === 'markdown' ? 'selected' : ''}>Markdown</option>
                        </select>
                    </div>
                    <div class="property-group">
                        <label>Переход к сценарию после сообщения</label>
                        <select onchange="builder.updateBlock('${scenarioId}', ${blockIndex}, 'nextScenario', this.value)">
                            <option value="">-- Не переходить --</option>
                            ${this.bot.scenes.map(s => 
                                `<option value="${s.id}" ${block.nextScenario === s.id ? 'selected' : ''}>${this.escapeHtml(s.name)}</option>`
                            ).join('')}
                        </select>
                    </div>
                `;
                break;

            case 'question':
                html = `
                    <div class="property-group">
                        <label>Текст вопроса</label>
                        <textarea onchange="builder.updateBlock('${scenarioId}', ${blockIndex}, 'text', this.value)">${this.escapeHtml(block.text || '')}</textarea>
                    </div>
                    <div class="property-group">
                        <label>Сохранить ответ в переменную</label>
                        <input type="text" value="${this.escapeHtml(block.variable || '')}" 
                               placeholder="user_name"
                               onchange="builder.updateBlock('${scenarioId}', ${blockIndex}, 'variable', this.value)">
                    </div>
                    <div class="property-group">
                        <label>Кнопки (опционально)</label>
                        <div class="buttons-editor" id="buttonsEditor">
                            ${(block.buttons || []).map((btn, i) => `
                                <div class="button-item">
                                    <input type="text" value="${this.escapeHtml(btn.text)}" 
                                           placeholder="Текст кнопки"
                                           onchange="builder.updateButton('${scenarioId}', ${blockIndex}, ${i}, 'text', this.value)">
                                    <input type="text" value="${this.escapeHtml(btn.action || '')}" 
                                           placeholder="Действие или сценарий"
                                           onchange="builder.updateButton('${scenarioId}', ${blockIndex}, ${i}, 'action', this.value)">
                                    <button class="btn-remove" onclick="builder.removeButton('${scenarioId}', ${blockIndex}, ${i})">×</button>
                                </div>
                            `).join('')}
                        </div>
                        <button class="btn-add" onclick="builder.addButton('${scenarioId}', ${blockIndex})">+ Добавить кнопку</button>
                    </div>
                `;
                break;

            case 'condition':
                html = `
                    <div class="property-group">
                        <label>Переменная для проверки</label>
                        <input type="text" value="${this.escapeHtml(block.variable || '')}" 
                               placeholder="user_status"
                               onchange="builder.updateBlock('${scenarioId}', ${blockIndex}, 'variable', this.value)">
                    </div>
                    <div class="property-group">
                        <label>Оператор</label>
                        <select onchange="builder.updateBlock('${scenarioId}', ${blockIndex}, 'operator', this.value)">
                            <option value="equals" ${block.operator === 'equals' ? 'selected' : ''}>= равно</option>
                            <option value="not_equals" ${block.operator === 'not_equals' ? 'selected' : ''}>≠ не равно</option>
                            <option value="contains" ${block.operator === 'contains' ? 'selected' : ''}>содержит</option>
                            <option value="empty" ${block.operator === 'empty' ? 'selected' : ''}>пустая</option>
                            <option value="not_empty" ${block.operator === 'not_empty' ? 'selected' : ''}>не пустая</option>
                        </select>
                    </div>
                    <div class="property-group">
                        <label>Значение для сравнения</label>
                        <input type="text" value="${this.escapeHtml(block.value || '')}" 
                               placeholder="vip"
                               onchange="builder.updateBlock('${scenarioId}', ${blockIndex}, 'value', this.value)">
                    </div>
                    <div class="property-group">
                        <label>Если истина → сценарий</label>
                        <select onchange="builder.updateBlock('${scenarioId}', ${blockIndex}, 'trueScenario', this.value)">
                            <option value="">-- Выбрать --</option>
                            ${this.bot.scenes.map(s => 
                                `<option value="${s.id}" ${block.trueScenario === s.id ? 'selected' : ''}>${this.escapeHtml(s.name)}</option>`
                            ).join('')}
                        </select>
                    </div>
                    <div class="property-group">
                        <label>Если ложь → сценарий</label>
                        <select onchange="builder.updateBlock('${scenarioId}', ${blockIndex}, 'falseScenario', this.value)">
                            <option value="">-- Выбрать --</option>
                            ${this.bot.scenes.map(s => 
                                `<option value="${s.id}" ${block.falseScenario === s.id ? 'selected' : ''}>${this.escapeHtml(s.name)}</option>`
                            ).join('')}
                        </select>
                    </div>
                `;
                break;

            case 'action':
                html = `
                    <div class="property-group">
                        <label>Тип действия</label>
                        <select onchange="builder.updateBlock('${scenarioId}', ${blockIndex}, 'actionType', this.value)">
                            <option value="set_variable" ${block.actionType === 'set_variable' ? 'selected' : ''}>Установить переменную</option>
                            <option value="clear_variable" ${block.actionType === 'clear_variable' ? 'selected' : ''}>Очистить переменную</option>
                            <option value="api_request" ${block.actionType === 'api_request' ? 'selected' : ''}>HTTP запрос</option>
                            <option value="delay" ${block.actionType === 'delay' ? 'selected' : ''}>Задержка</option>
                        </select>
                    </div>
                    ${block.actionType === 'set_variable' ? `
                        <div class="property-group">
                            <label>Переменная</label>
                            <input type="text" value="${this.escapeHtml(block.variable || '')}" 
                                   onchange="builder.updateBlock('${scenarioId}', ${blockIndex}, 'variable', this.value)">
                        </div>
                        <div class="property-group">
                            <label>Значение</label>
                            <input type="text" value="${this.escapeHtml(block.value || '')}" 
                                   onchange="builder.updateBlock('${scenarioId}', ${blockIndex}, 'value', this.value)">
                        </div>
                    ` : ''}
                    ${block.actionType === 'api_request' ? `
                        <div class="property-group">
                            <label>URL</label>
                            <input type="text" value="${this.escapeHtml(block.url || '')}" 
                                   placeholder="https://api.example.com"
                                   onchange="builder.updateBlock('${scenarioId}', ${blockIndex}, 'url', this.value)">
                        </div>
                        <div class="property-group">
                            <label>Метод</label>
                            <select onchange="builder.updateBlock('${scenarioId}', ${blockIndex}, 'method', this.value)">
                                <option value="GET" ${block.method === 'GET' ? 'selected' : ''}>GET</option>
                                <option value="POST" ${block.method === 'POST' ? 'selected' : ''}>POST</option>
                            </select>
                        </div>
                    ` : ''}
                    ${block.actionType === 'delay' ? `
                        <div class="property-group">
                            <label>Задержка (мс)</label>
                            <input type="number" value="${block.delay || 1000}" 
                                   onchange="builder.updateBlock('${scenarioId}', ${blockIndex}, 'delay', this.value)">
                        </div>
                    ` : ''}
                `;
                break;

            case 'keyboard':
                html = `
                    <div class="property-group">
                        <label>Тип клавиатуры</label>
                        <select onchange="builder.updateBlock('${scenarioId}', ${blockIndex}, 'keyboardType', this.value)">
                            <option value="inline" ${block.keyboardType === 'inline' ? 'selected' : ''}>Inline (под сообщением)</option>
                            <option value="reply" ${block.keyboardType === 'reply' ? 'selected' : ''}>Reply (внизу экрана)</option>
                        </select>
                    </div>
                    <div class="property-group">
                        <label>Кнопки клавиатуры</label>
                        <div class="buttons-editor" id="buttonsEditor">
                            ${(block.buttons || []).map((btn, i) => `
                                <div class="button-item">
                                    <input type="text" value="${this.escapeHtml(btn.text)}" 
                                           placeholder="Текст кнопки"
                                           onchange="builder.updateButton('${scenarioId}', ${blockIndex}, ${i}, 'text', this.value)">
                                    <input type="text" value="${this.escapeHtml(btn.callback || '')}" 
                                           placeholder="Callback данные"
                                           onchange="builder.updateButton('${scenarioId}', ${blockIndex}, ${i}, 'callback', this.value)">
                                    <button class="btn-remove" onclick="builder.removeButton('${scenarioId}', ${blockIndex}, ${i})">×</button>
                                </div>
                            `).join('')}
                        </div>
                        <button class="btn-add" onclick="builder.addButton('${scenarioId}', ${blockIndex})">+ Добавить кнопку</button>
                    </div>
                `;
                break;

            // Блок работы с базой данных
            case 'database':
                html = `
                    <div class="property-group">
                        <label>Действие</label>
                        <select onchange="builder.updateBlock('${scenarioId}', ${blockIndex}, 'dbAction', this.value)">
                            <option value="create" ${block.dbAction === 'create' ? 'selected' : ''}>Создать запись</option>
                            <option value="read" ${block.dbAction === 'read' ? 'selected' : ''}>Прочитать</option>
                            <option value="update" ${block.dbAction === 'update' ? 'selected' : ''}>Обновить</option>
                            <option value="delete" ${block.dbAction === 'delete' ? 'selected' : ''}>Удалить</option>
                        </select>
                    </div>
                    <div class="property-group">
                        <label>Таблица</label>
                        <select onchange="builder.updateBlock('${scenarioId}', ${blockIndex}, 'sheetName', this.value)">
                            <option value="">-- Выбрать таблицу --</option>
                            <option value="Users" ${block.sheetName === 'Users' ? 'selected' : ''}>Users</option>
                            <option value="Orders" ${block.sheetName === 'Orders' ? 'selected' : ''}>Orders</option>
                            <option value="Products" ${block.sheetName === 'Products' ? 'selected' : ''}>Products</option>
                        </select>
                    </div>
                    ${block.dbAction === 'create' ? `
                        <div class="property-group">
                            <label>Данные (JSON)</label>
                            <textarea placeholder='{"name": "{{user_name}}", "email": "{{user_email}}"}'
                                      onchange="builder.updateBlock('${scenarioId}', ${blockIndex}, 'data', this.value)">${JSON.stringify(block.data || {}, null, 2)}</textarea>
                            <small>Используйте {{variable}} для подстановки значений</small>
                        </div>
                    ` : ''}
                    ${block.dbAction === 'read' ? `
                        <div class="property-group">
                            <label>Сохранить в переменную</label>
                            <input type="text" value="${block.variable || ''}" 
                                   placeholder="result"
                                   onchange="builder.updateBlock('${scenarioId}', ${blockIndex}, 'variable', this.value)">
                        </div>
                        <div class="property-group">
                            <label>Условие поиска</label>
                            <input type="text" value="${block.where || ''}" 
                                   placeholder="status=active"
                                   onchange="builder.updateBlock('${scenarioId}', ${blockIndex}, 'where', this.value)">
                            <small>column=value</small>
                        </div>
                    ` : ''}
                    ${block.dbAction === 'update' || block.dbAction === 'delete' ? `
                        <div class="property-group">
                            <label>Условие поиска</label>
                            <input type="text" value="${block.where || ''}" 
                                   placeholder="id={{user_id}}"
                                   onchange="builder.updateBlock('${scenarioId}', ${blockIndex}, 'where', this.value)">
                        </div>
                    ` : ''}
                `;
                break;

            // Блок цикла
            case 'loop':
                html = `
                    <div class="property-group">
                        <label>Тип цикла</label>
                        <select onchange="builder.updateBlock('${scenarioId}', ${blockIndex}, 'loopType', this.value)">
                            <option value="foreach" ${block.loopType === 'foreach' ? 'selected' : ''}>Для каждого элемента</option>
                            <option value="while" ${block.loopType === 'while' ? 'selected' : ''}>Пока условие истинно</option>
                        </select>
                    </div>
                    <div class="property-group">
                        <label>Источник данных</label>
                        <input type="text" value="${block.source || ''}" 
                               placeholder="products"
                               onchange="builder.updateBlock('${scenarioId}', ${blockIndex}, 'source', this.value)">
                        <small>Переменная со списком</small>
                    </div>
                    <div class="property-group">
                        <label>Переменная элемента</label>
                        <input type="text" value="${block.variable || ''}" 
                               placeholder="item"
                               onchange="builder.updateBlock('${scenarioId}', ${blockIndex}, 'variable', this.value)">
                        <small>В эту переменную сохраняется текущий элемент</small>
                    </div>
                    ${block.loopType === 'while' ? `
                        <div class="property-group">
                            <label>Условие продолжения</label>
                            <input type="text" value="${block.condition || ''}" 
                                   placeholder="item != null"
                                   onchange="builder.updateBlock('${scenarioId}', ${blockIndex}, 'condition', this.value)">
                        </div>
                    ` : ''}
                `;
                break;
        }

        return html;
    },

    /**
     * Обновление сценария
     */
    updateScenario(field, value) {
        if (!this.selectedScenario) return;
        this.selectedScenario[field] = value;
        app.updateCurrentBot();
        this.renderScenarios();
    },

    /**
     * Обновление блока
     */
    updateBlock(scenarioId, blockIndex, field, value) {
        const scenario = this.bot.scenes.find(s => s.id === scenarioId);
        if (!scenario) return;
        
        scenario.blocks[blockIndex][field] = value;
        app.updateCurrentBot();
    },

    /**
     * Добавление кнопки
     */
    addButton(scenarioId, blockIndex) {
        const scenario = this.bot.scenes.find(s => s.id === scenarioId);
        if (!scenario) return;
        
        const block = scenario.blocks[blockIndex];
        if (!block.buttons) block.buttons = [];
        
        block.buttons.push({ text: 'Новая кнопка', action: '', callback: '' });
        app.updateCurrentBot();
        this.renderScenarios();
        this.selectBlock(scenarioId, blockIndex);
    },

    /**
     * Обновление кнопки
     */
    updateButton(scenarioId, blockIndex, buttonIndex, field, value) {
        const scenario = this.bot.scenes.find(s => s.id === scenarioId);
        if (!scenario) return;
        
        const block = scenario.blocks[blockIndex];
        if (block.buttons && block.buttons[buttonIndex]) {
            block.buttons[buttonIndex][field] = value;
            app.updateCurrentBot();
        }
    },

    /**
     * Удаление кнопки
     */
    removeButton(scenarioId, blockIndex, buttonIndex) {
        const scenario = this.bot.scenes.find(s => s.id === scenarioId);
        if (!scenario) return;
        
        const block = scenario.blocks[blockIndex];
        if (block.buttons) {
            block.buttons.splice(buttonIndex, 1);
            app.updateCurrentBot();
            this.renderScenarios();
            this.selectBlock(scenarioId, blockIndex);
        }
    },

    /**
     * Иконка для типа блока
     */
    getBlockIcon(type) {
        const icons = {
            message: '💬',
            question: '❓',
            condition: '🔀',
            action: '⚡',
            keyboard: '⌨️',
            database: '🗄️',
            loop: '🔁'
        };
        return icons[type] || '📦';
    },

    /**
     * Заголовок для типа блока
     */
    getBlockTitle(block) {
        const titles = {
            message: 'Сообщение',
            question: 'Вопрос',
            condition: 'Условие',
            action: 'Действие',
            keyboard: 'Клавиатура',
            database: 'База данных',
            loop: 'Цикл'
        };
        return titles[block.type] || block.type;
    },

    /**
     * Предпросмотр содержимого блока
     */
    getBlockPreview(block) {
        switch (block.type) {
            case 'message':
                return (block.text || 'Нет текста').substring(0, 50);
            case 'question':
                return `Переменная: ${block.variable || '?'}`;
            case 'condition':
                return `${block.variable || '?'} ${block.operator} ${block.value || '?'}`;
            case 'action':
                return `${block.actionType}: ${block.variable || block.url || ''}`;
            case 'keyboard':
                return `Кнопок: ${block.buttons?.length || 0}`;
            default:
                return '';
        }
    },

    /**
     * Экранирование HTML
     */
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};
