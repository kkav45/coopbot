/**
 * Node-Based Visual Editor (n8n style)
 * Визуальный редактор с узлами и связями
 */

const nodeEditor = {
    // Состояние редактора
    nodes: [],
    connections: [],
    selectedNode: null,
    selectedConnection: null,
    scenarios: [],
    currentScenario: null,
    
    // Настройки canvas
    zoom: 1,
    panX: 0,
    panY: 0,
    isPanning: false,
    panStartX: 0,
    panStartY: 0,
    
    // Drag & Drop
    isDragging: false,
    dragNode: null,
    dragStartX: 0,
    dragStartY: 0,
    
    // Connection drawing
    isConnecting: false,
    connectionStart: null,
    connectionLine: null,
    
    // Node types configuration
    nodeTypes: {
        message: {
            icon: '💬',
            title: 'Сообщение',
            desc: 'Отправка текста',
            color: '#3b82f6'
        },
        question: {
            icon: '❓',
            title: 'Вопрос',
            desc: 'Запрос данных',
            color: '#f59e0b'
        },
        condition: {
            icon: '🔀',
            title: 'Условие',
            desc: 'Ветвление логики',
            color: '#8b5cf6'
        },
        action: {
            icon: '⚡',
            title: 'Действие',
            desc: 'Переменные, API',
            color: '#10b981'
        },
        keyboard: {
            icon: '⌨️',
            title: 'Клавиатура',
            desc: 'Кнопки',
            color: '#ec4899'
        },
        database: {
            icon: '🗄️',
            title: 'База данных',
            desc: 'Google Sheets',
            color: '#06b6d4'
        },
        loop: {
            icon: '🔁',
            title: 'Цикл',
            desc: 'Итерация',
            color: '#ef4444'
        }
    },

    /**
     * Инициализация редактора
     */
    init(scenarios = []) {
        this.scenarios = scenarios;
        this.nodes = [];
        this.connections = [];
        this.selectedNode = null;
        this.selectedConnection = null;
        
        // Загрузка сценариев как узлов
        this.loadScenarios();
        
        // Отрисовка
        this.render();
        
        // Настройка событий
        this.setupEvents();
        
        console.log('Node editor initialized');
    },

    /**
     * Загрузка сценариев как узлов
     */
    loadScenarios() {
        const startX = 100;
        const startY = 100;
        const gapY = 200;
        
        this.scenarios.forEach((scenario, index) => {
            // Создаём узел старта сценария
            this.nodes.push({
                id: `scenario-${scenario.id}`,
                type: 'start',
                name: scenario.name,
                trigger: scenario.trigger,
                x: startX,
                y: startY + index * gapY,
                data: scenario,
                blockCount: scenario.blocks?.length || 0
            });
            
            // Создаём узлы для блоков
            if (scenario.blocks && scenario.blocks.length > 0) {
                let prevNodeId = `scenario-${scenario.id}`;
                
                scenario.blocks.forEach((block, blockIndex) => {
                    const nodeId = `block-${scenario.id}-${blockIndex}`;
                    const nodeType = this.nodeTypes[block.type] || this.nodeTypes.message;
                    
                    this.nodes.push({
                        id: nodeId,
                        type: block.type,
                        name: this.getNodeTitle(block),
                        x: startX + 250,
                        y: startY + index * gapY + blockIndex * 120,
                        data: block,
                        blockIndex: blockIndex,
                        scenarioId: scenario.id
                    });
                    
                    // Соединяем с предыдущим узлом
                    this.connections.push({
                        id: `conn-${prevNodeId}-${nodeId}`,
                        from: prevNodeId,
                        to: nodeId
                    });
                    
                    prevNodeId = nodeId;
                });
            }
        });
    },

    /**
     * Отрисовка редактора
     */
    render() {
        const container = document.querySelector('.canvas-content');
        if (!container) return;
        
        // Очистка
        container.innerHTML = '';
        
        // SVG слой для соединений
        const svgLayer = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svgLayer.setAttribute('class', 'connections-layer');
        svgLayer.setAttribute('width', '100%');
        svgLayer.setAttribute('height', '100%');
        container.appendChild(svgLayer);
        
        // Отрисовка соединений
        this.connections.forEach(conn => {
            this.renderConnection(svgLayer, conn);
        });
        
        // Слой для узлов
        const nodesLayer = document.createElement('div');
        nodesLayer.setAttribute('class', 'nodes-layer');
        container.appendChild(nodesLayer);
        
        // Отрисовка узлов
        this.nodes.forEach(node => {
            this.renderNode(nodesLayer, node);
        });
        
        // Пустое состояние если нет узлов
        if (this.nodes.length === 0) {
            this.renderEmptyState(container);
        }
        
        // Обновление соединений
        this.updateConnections();
    },

    /**
     * Отрисовка узла
     */
    renderNode(container, node) {
        const nodeType = this.nodeTypes[node.type] || this.nodeTypes.message;
        
        const nodeEl = document.createElement('div');
        nodeEl.className = `canvas-node node-type-${node.type}${this.selectedNode?.id === node.id ? ' selected' : ''}`;
        nodeEl.dataset.nodeId = node.id;
        nodeEl.style.left = `${node.x}px`;
        nodeEl.style.top = `${node.y}px`;
        
        nodeEl.innerHTML = `
            <div class="node-header">
                <div class="node-icon" style="background: linear-gradient(135deg, ${nodeType.color}, ${this.darkenColor(nodeType.color, 20)})">
                    ${nodeType.icon}
                </div>
                <div class="node-title-wrapper">
                    <div class="node-title">${this.escapeHtml(node.name)}</div>
                    <div class="node-type">${node.type}</div>
                </div>
                <div class="node-actions">
                    <button class="node-action-btn" onclick="nodeEditor.editNode('${node.id}')" title="Редактировать">✏️</button>
                    <button class="node-action-btn delete" onclick="nodeEditor.deleteNode('${node.id}')" title="Удалить">🗑️</button>
                </div>
            </div>
            <div class="node-body">
                <div class="node-content">${this.escapeHtml(this.getNodeContent(node))}</div>
            </div>
            <div class="node-ports input">
                <div class="node-port" data-port="input" data-node="${node.id}"></div>
            </div>
            <div class="node-ports output">
                <div class="node-port" data-port="output" data-node="${node.id}"></div>
            </div>
        `;
        
        // События для перетаскивания
        const header = nodeEl.querySelector('.node-header');
        header.addEventListener('mousedown', (e) => this.startDragNode(e, node));
        
        // События для портов
        const ports = nodeEl.querySelectorAll('.node-port');
        ports.forEach(port => {
            port.addEventListener('mousedown', (e) => this.startConnection(e, node, port.dataset.port));
            port.addEventListener('mouseup', (e) => this.endConnection(e, node, port.dataset.port));
        });
        
        // Выделение узла
        nodeEl.addEventListener('click', (e) => {
            e.stopPropagation();
            this.selectNode(node);
        });
        
        container.appendChild(nodeEl);
    },

    /**
     * Отрисовка соединения
     */
    renderConnection(svgLayer, connection) {
        const fromNode = this.nodes.find(n => n.id === connection.from);
        const toNode = this.nodes.find(n => n.id === connection.to);
        
        if (!fromNode || !toNode) return;
        
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('class', `connection-path${this.selectedConnection?.id === connection.id ? ' selected' : ''}`);
        path.dataset.connectionId = connection.id;
        
        // Кривая Безье для плавной линии
        const d = this.getConnectionPath(fromNode, toNode);
        path.setAttribute('d', d);
        
        path.addEventListener('click', (e) => {
            e.stopPropagation();
            this.selectConnection(connection);
        });
        
        svgLayer.appendChild(path);
    },

    /**
     * Расчёт пути соединения
     */
    getConnectionPath(fromNode, toNode) {
        const fromX = fromNode.x + 220; // right side
        const fromY = fromNode.y + 40;  // middle
        const toX = toNode.x;           // left side
        const toY = toNode.y + 40;      // middle
        
        const controlOffset = Math.abs(toX - fromX) * 0.5;
        
        return `M ${fromX} ${fromY} C ${fromX + controlOffset} ${fromY}, ${toX - controlOffset} ${toY}, ${toX} ${toY}`;
    },

    /**
     * Обновление всех соединений
     */
    updateConnections() {
        const svgLayer = document.querySelector('.connections-layer');
        if (!svgLayer) return;
        
        svgLayer.innerHTML = '';
        
        this.connections.forEach(conn => {
            this.renderConnection(svgLayer, conn);
        });
    },

    /**
     * Начало перетаскивания узла
     */
    startDragNode(e, node) {
        if (e.button !== 0) return; // только левая кнопка
        
        e.stopPropagation();
        this.isDragging = true;
        this.dragNode = node;
        this.dragStartX = e.clientX - node.x;
        this.dragStartY = e.clientY - node.y;
        
        const nodeEl = document.querySelector(`[data-node-id="${node.id}"]`);
        if (nodeEl) nodeEl.classList.add('dragging');
    },

    /**
     * Начало рисования соединения
     */
    startConnection(e, node, port) {
        if (e.button !== 0) return;
        if (port !== 'output') return; // начинаем только с output
        
        e.stopPropagation();
        this.isConnecting = true;
        this.connectionStart = { node, port };
        
        // Создаём временную линию
        this.connectionLine = document.createElement('div');
        this.connectionLine.className = 'connection-line';
        document.querySelector('.canvas-content').appendChild(this.connectionLine);
    },

    /**
     * Завершение рисования соединения
     */
    endConnection(e, node, port) {
        if (!this.isConnecting) return;
        if (port !== 'input') return; // заканчиваем только на input
        
        e.stopPropagation();
        
        const fromNode = this.connectionStart.node;
        const toNode = node;
        
        // Нельзя соединять узел сам с собой
        if (fromNode.id === toNode.id) {
            this.cancelConnection();
            return;
        }
        
        // Проверяем, нет ли уже такого соединения
        const exists = this.connections.find(c => 
            c.from === fromNode.id && c.to === toNode.id
        );
        
        if (!exists) {
            // Добавляем соединение
            this.connections.push({
                id: `conn-${fromNode.id}-${toNode.id}-${Date.now()}`,
                from: fromNode.id,
                to: toNode.id
            });
            
            this.updateConnections();
        }
        
        this.cancelConnection();
    },

    /**
     * Отмена соединения
     */
    cancelConnection() {
        this.isConnecting = false;
        this.connectionStart = null;
        
        if (this.connectionLine) {
            this.connectionLine.remove();
            this.connectionLine = null;
        }
    },

    /**
     * Выделение узла
     */
    selectNode(node) {
        this.selectedNode = node;
        this.selectedConnection = null;
        this.render();
        
        // Показываем панель свойств
        this.showProperties(node);
    },

    /**
     * Выделение соединения
     */
    selectConnection(connection) {
        this.selectedConnection = connection;
        this.selectedNode = null;
        this.render();
        
        // Показываем панель свойств
        this.showConnectionProperties(connection);
    },

    /**
     * Показ панели свойств узла
     */
    showProperties(node) {
        const panel = document.getElementById('propertiesContent');
        if (!panel) return;
        
        const nodeType = this.nodeTypes[node.type] || this.nodeTypes.message;
        
        panel.innerHTML = `
            <div class="property-group">
                <div class="property-group-title">Основное</div>
                <div class="property-field">
                    <label class="property-label">Название</label>
                    <input type="text" class="property-input" value="${this.escapeHtml(node.name)}" 
                           onchange="nodeEditor.updateNode('${node.id}', 'name', this.value)">
                </div>
                <div class="property-field">
                    <label class="property-label">Тип</label>
                    <div class="property-input" style="background: #1a1a2e;">${nodeType.icon} ${nodeType.title}</div>
                </div>
            </div>
            ${this.getNodePropertiesForm(node)}
        `;
    },

    /**
     * Показ свойств соединения
     */
    showConnectionProperties(connection) {
        const panel = document.getElementById('propertiesContent');
        if (!panel) return;
        
        panel.innerHTML = `
            <div class="property-group">
                <div class="property-group-title">Соединение</div>
                <div class="property-field">
                    <label class="property-label">От</label>
                    <div class="property-input" style="background: #1a1a2e;">${connection.from}</div>
                </div>
                <div class="property-field">
                    <label class="property-label">К</label>
                    <div class="property-input" style="background: #1a1a2e;">${connection.to}</div>
                </div>
                <div class="property-field">
                    <button class="btn btn-danger" onclick="nodeEditor.deleteConnection('${connection.id}')" 
                            style="width: 100%; margin-top: 16px;">
                        🗑️ Удалить соединение
                    </button>
                </div>
            </div>
        `;
    },

    /**
     * Обновление узла
     */
    updateNode(nodeId, field, value) {
        const node = this.nodes.find(n => n.id === nodeId);
        if (!node) return;
        
        node[field] = value;
        
        // Обновляем данные в сценарии
        if (node.scenarioId && node.blockIndex !== undefined) {
            const scenario = this.scenarios.find(s => s.id === node.scenarioId);
            if (scenario && scenario.blocks[node.blockIndex]) {
                if (field === 'name') {
                    scenario.blocks[node.blockIndex].text = value;
                }
            }
        }
        
        this.render();
    },

    /**
     * Удаление узла
     */
    deleteNode(nodeId) {
        if (!confirm('Удалить этот узел?')) return;
        
        // Удаляем узел
        this.nodes = this.nodes.filter(n => n.id !== nodeId);
        
        // Удаляем связанные соединения
        this.connections = this.connections.filter(c => 
            c.from !== nodeId && c.to !== nodeId
        );
        
        this.selectedNode = null;
        this.render();
        
        // Очищаем панель свойств
        document.getElementById('propertiesContent').innerHTML = '<p class="hint">Выберите элемент для редактирования</p>';
    },

    /**
     * Удаление соединения
     */
    deleteConnection(connectionId) {
        this.connections = this.connections.filter(c => c.id !== connectionId);
        this.selectedConnection = null;
        this.render();
        document.getElementById('propertiesContent').innerHTML = '<p class="hint">Выберите элемент для редактирования</p>';
    },

    /**
     * Редактирование узла
     */
    editNode(nodeId) {
        const node = this.nodes.find(n => n.id === nodeId);
        if (!node) return;
        
        // Открываем панель свойств с полным редактором
        this.selectNode(node);
    },

    /**
     * Добавление узла из палитры
     */
    addNodeFromPalette(type, x, y) {
        const nodeType = this.nodeTypes[type];
        if (!nodeType) return;
        
        const newNode = {
            id: `node-${Date.now()}`,
            type: type,
            name: nodeType.title,
            x: x || 300,
            y: y || 300,
            data: {
                type: type,
                text: 'Новый элемент'
            }
        };
        
        this.nodes.push(newNode);
        this.render();
        this.selectNode(newNode);
        
        return newNode;
    },

    /**
     * Настройка событий
     */
    setupEvents() {
        const canvas = document.querySelector('.canvas-wrapper');
        if (!canvas) return;
        
        // Pan canvas
        canvas.addEventListener('mousedown', (e) => {
            if (e.target === canvas || e.target.classList.contains('canvas-content')) {
                this.isPanning = true;
                this.panStartX = e.clientX - this.panX;
                this.panStartY = e.clientY - this.panY;
                canvas.style.cursor = 'grabbing';
            }
        });
        
        document.addEventListener('mousemove', (e) => {
            // Перетаскивание узла
            if (this.isDragging && this.dragNode) {
                this.dragNode.x = e.clientX - this.dragStartX;
                this.dragNode.y = e.clientY - this.dragStartY;
                this.render();
            }
            
            // Рисование соединения
            if (this.isConnecting && this.connectionLine) {
                const canvas = document.querySelector('.canvas-content');
                const rect = canvas.getBoundingClientRect();
                const fromNode = this.connectionStart.node;
                
                const x1 = fromNode.x + 220;
                const y1 = fromNode.y + 40;
                const x2 = e.clientX - rect.left + this.panX;
                const y2 = e.clientY - rect.top + this.panY;
                
                this.connectionLine.innerHTML = `
                    <svg width="100%" height="100%">
                        <path d="M ${x1} ${y1} C ${x1 + 50} ${y1}, ${x2 - 50} ${y2}, ${x2} ${y2}" 
                              stroke="#6366f1" stroke-width="2" fill="none" stroke-dasharray="5,5"/>
                    </svg>
                `;
            }
            
            // Pan canvas
            if (this.isPanning) {
                this.panX = e.clientX - this.panStartX;
                this.panY = e.clientY - this.panStartY;
                const content = document.querySelector('.canvas-content');
                if (content) {
                    content.style.transform = `translate(${this.panX}px, ${this.panY}px) scale(${this.zoom})`;
                }
            }
        });
        
        document.addEventListener('mouseup', () => {
            // Завершение перетаскивания узла
            if (this.isDragging && this.dragNode) {
                const nodeEl = document.querySelector(`[data-node-id="${this.dragNode.id}"]`);
                if (nodeEl) nodeEl.classList.remove('dragging');
                this.isDragging = false;
                this.dragNode = null;
            }
            
            // Завершение рисования соединения
            if (this.isConnecting) {
                this.cancelConnection();
            }
            
            // Завершение pan
            if (this.isPanning) {
                this.isPanning = false;
                const canvas = document.querySelector('.canvas-wrapper');
                if (canvas) canvas.style.cursor = 'grab';
            }
        });
        
        // Zoom колёсиком
        canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -0.1 : 0.1;
            this.zoom = Math.max(0.5, Math.min(2, this.zoom + delta));
            
            const content = document.querySelector('.canvas-content');
            if (content) {
                content.style.transform = `translate(${this.panX}px, ${this.panY}px) scale(${this.zoom})`;
            }
            
            this.updateZoomIndicator();
        });
        
        // Отмена выделения кликом на canvas
        canvas.addEventListener('click', (e) => {
            if (e.target === canvas || e.target.classList.contains('canvas-content')) {
                this.selectedNode = null;
                this.selectedConnection = null;
                this.render();
                document.getElementById('propertiesContent').innerHTML = '<p class="hint">Выберите элемент для редактирования</p>';
            }
        });
        
        // Drag & Drop из палитры
        const paletteNodes = document.querySelectorAll('.palette-node');
        paletteNodes.forEach(node => {
            node.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('nodeType', node.dataset.type);
            });
        });
        
        const canvasContent = document.querySelector('.canvas-content');
        canvasContent.addEventListener('dragover', (e) => {
            e.preventDefault();
        });
        
        canvasContent.addEventListener('drop', (e) => {
            e.preventDefault();
            const type = e.dataTransfer.getData('nodeType');
            if (type) {
                const rect = canvasContent.getBoundingClientRect();
                const x = (e.clientX - rect.left - this.panX) / this.zoom;
                const y = (e.clientY - rect.top - this.panY) / this.zoom;
                this.addNodeFromPalette(type, x, y);
            }
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Delete' || e.key === 'Backspace') {
                if (this.selectedNode) {
                    this.deleteNode(this.selectedNode.id);
                } else if (this.selectedConnection) {
                    this.deleteConnection(this.selectedConnection.id);
                }
            }
        });
    },

    /**
     * Отрисовка пустого состояния
     */
    renderEmptyState(container) {
        const empty = document.createElement('div');
        empty.className = 'empty-canvas';
        empty.innerHTML = `
            <div class="empty-canvas-icon">🎨</div>
            <div class="empty-canvas-title">Сценарий пуст</div>
            <div class="empty-canvas-desc">
                Перетащите блоки из палитры слева или нажмите на кнопку в сценарии
            </div>
        `;
        container.appendChild(empty);
    },

    /**
     * Обновление индикатора зума
     */
    updateZoomIndicator() {
        const indicator = document.querySelector('.zoom-indicator');
        if (indicator) {
            indicator.textContent = `${Math.round(this.zoom * 100)}%`;
        }
    },

    /**
     * Получение заголовка узла
     */
    getNodeTitle(block) {
        switch (block.type) {
            case 'message': return block.text?.substring(0, 30) || 'Сообщение';
            case 'question': return block.question || 'Вопрос';
            case 'condition': return `Если ${block.variable || '?'}`;
            case 'action': return block.actionType || 'Действие';
            case 'keyboard': return `${block.buttons?.length || 0} кнопок`;
            case 'database': return block.operation || 'БД';
            case 'loop': return 'Цикл';
            default: return block.type;
        }
    },

    /**
     * Получение содержимого узла
     */
    getNodeContent(node) {
        const data = node.data;
        switch (node.type) {
            case 'message': return data.text || 'Текст сообщения';
            case 'question': return data.question || 'Вопрос пользователю';
            case 'condition': return `${data.variable} ${data.operator} ${data.value}`;
            case 'action': return `${data.actionType}: ${data.value || ''}`;
            case 'keyboard': return `Кнопок: ${data.buttons?.length || 0}`;
            case 'database': return `${data.operation} ${data.sheet || ''}`;
            case 'loop': return `По ${data.condition || 'условию'}`;
            case 'start': return `Триггер: ${data.trigger}`;
            default: return 'Нет данных';
        }
    },

    /**
     * Форма свойств для типа узла
     */
    getNodePropertiesForm(node) {
        const data = node.data || {};
        
        switch (node.type) {
            case 'message':
                return `
                    <div class="property-group">
                        <div class="property-group-title">Сообщение</div>
                        <div class="property-field">
                            <label class="property-label">Текст</label>
                            <textarea class="property-textarea" rows="4" 
                                      onchange="nodeEditor.updateNodeData('${node.id}', 'text', this.value)">${data.text || ''}</textarea>
                        </div>
                    </div>
                `;
            
            case 'question':
                return `
                    <div class="property-group">
                        <div class="property-group-title">Вопрос</div>
                        <div class="property-field">
                            <label class="property-label">Вопрос</label>
                            <input type="text" class="property-input" value="${data.question || ''}" 
                                   onchange="nodeEditor.updateNodeData('${node.id}', 'question', this.value)">
                        </div>
                        <div class="property-field">
                            <label class="property-label">Переменная</label>
                            <input type="text" class="property-input" value="${data.variable || ''}" 
                                   onchange="nodeEditor.updateNodeData('${node.id}', 'variable', this.value)">
                            <div class="property-hint">Куда сохранить ответ</div>
                        </div>
                    </div>
                `;
            
            case 'keyboard':
                return `
                    <div class="property-group">
                        <div class="property-group-title">Клавиатура</div>
                        <div class="property-field">
                            <label class="property-label">Тип</label>
                            <select class="property-select" onchange="nodeEditor.updateNodeData('${node.id}', 'keyboardType', this.value)">
                                <option value="inline" ${data.keyboardType === 'inline' ? 'selected' : ''}>Inline</option>
                                <option value="reply" ${data.keyboardType === 'reply' ? 'selected' : ''}>Reply</option>
                            </select>
                        </div>
                        <div class="property-field">
                            <label class="property-label">Кнопки (JSON)</label>
                            <textarea class="property-textarea" rows="6" 
                                      onchange="nodeEditor.updateNodeData('${node.id}', 'buttons', JSON.parse(this.value))">${JSON.stringify(data.buttons || [], null, 2)}</textarea>
                            <div class="property-hint">[{"text": "Кнопка 1", "callback": "btn1"}]</div>
                        </div>
                    </div>
                `;
            
            default:
                return `
                    <div class="property-group">
                        <div class="property-group-title">Данные</div>
                        <div class="property-field">
                            <label class="property-label">JSON</label>
                            <textarea class="property-textarea" rows="8" 
                                      onchange="nodeEditor.updateNodeData('${node.id}', 'all', JSON.parse(this.value))">${JSON.stringify(data, null, 2)}</textarea>
                        </div>
                    </div>
                `;
        }
    },

    /**
     * Обновление данных узла
     */
    updateNodeData(nodeId, field, value) {
        const node = this.nodes.find(n => n.id === nodeId);
        if (!node) return;
        
        if (field === 'all') {
            node.data = value;
        } else {
            node.data[field] = value;
        }
        
        // Обновляем название
        node.name = this.getNodeTitle(node.data);
        
        this.render();
    },

    /**
     * Экспорт схемы в сценарии
     */
    exportToScenarios() {
        // Группировка узлов по сценариям
        const scenarioMap = new Map();
        
        this.nodes.forEach(node => {
            if (node.scenarioId) {
                if (!scenarioMap.has(node.scenarioId)) {
                    scenarioMap.set(node.scenarioId, []);
                }
                scenarioMap.get(node.scenarioId).push(node);
            }
        });
        
        // Обновление сценариев
        this.scenarios.forEach(scenario => {
            const nodes = scenarioMap.get(scenario.id) || [];
            
            // Сортировка узлов по позиции Y
            nodes.sort((a, b) => a.y - b.y);
            
            // Обновление блоков
            scenario.blocks = nodes
                .filter(n => n.blockIndex !== undefined)
                .map(n => n.data);
        });
        
        return this.scenarios;
    },

    /**
     * Утилита: затемнение цвета
     */
    darkenColor(color, percent) {
        // Простая реализация
        return color;
    },

    /**
     * Утилита: экранирование HTML
     */
    escapeHtml(text) {
        if (!text) return '';
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    },

    /**
     * Zoom in
     */
    zoomIn() {
        this.zoom = Math.min(2, this.zoom + 0.1);
        this.updateZoom();
    },

    /**
     * Zoom out
     */
    zoomOut() {
        this.zoom = Math.max(0.5, this.zoom - 0.1);
        this.updateZoom();
    },

    /**
     * Reset zoom
     */
    resetZoom() {
        this.zoom = 1;
        this.panX = 0;
        this.panY = 0;
        this.updateZoom();
    },

    /**
     * Update zoom transform
     */
    updateZoom() {
        const content = document.querySelector('.canvas-content');
        if (content) {
            content.style.transform = `translate(${this.panX}px, ${this.panY}px) scale(${this.zoom})`;
        }
        this.updateZoomIndicator();
    }
};
