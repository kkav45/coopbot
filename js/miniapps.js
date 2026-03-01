/**
 * Конструктор Telegram Mini Apps
 * Создание веб-приложений для Telegram
 */

const miniApps = {
    // Список Mini Apps
    apps: [],
    
    // Текущее редактируемое приложение
    currentApp: null,

    /**
     * Инициализация
     */
    async init() {
        await this.loadApps();
        this.renderApps();
    },

    /**
     * Загрузка приложений из localStorage
     */
    async loadApps() {
        try {
            const stored = localStorage.getItem('botbuilder_miniapps');
            if (stored) {
                this.apps = JSON.parse(stored);
            }
        } catch (error) {
            console.error('Ошибка загрузки Mini Apps:', error);
            this.apps = [];
        }
    },

    /**
     * Сохранение приложений
     */
    async saveApps() {
        try {
            localStorage.setItem('botbuilder_miniapps', JSON.stringify(this.apps));
        } catch (error) {
            console.error('Ошибка сохранения Mini Apps:', error);
        }
    },

    /**
     * Создание нового приложения
     */
    createApp() {
        const name = prompt('Название Mini App:', 'Моё приложение');
        if (!name) return;

        const app = {
            id: 'miniapp_' + Date.now(),
            name: name,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            theme: 'light',
            pages: [
                {
                    id: 'home',
                    name: 'Главная',
                    components: []
                }
            ],
            settings: {
                backgroundColor: '#ffffff',
                headerColor: '#2481cc',
                buttonColor: '#2481cc'
            }
        };

        this.apps.push(app);
        this.saveApps();
        this.renderApps();
        
        ui.toast('Mini App создан', 'success');
        this.openEditor(app);
    },

    /**
     * Отрисовка списка приложений
     */
    renderApps() {
        const container = document.getElementById('miniappsContainer');
        const empty = document.getElementById('miniappsEmpty');

        if (!container) return;

        if (this.apps.length === 0) {
            container.innerHTML = '';
            container.appendChild(empty);
            empty.style.display = 'block';
            return;
        }

        empty.style.display = 'none';
        container.innerHTML = this.apps.map(app => this.renderAppCard(app)).join('');
    },

    /**
     * Карточка приложения
     */
    renderAppCard(app) {
        const pagesCount = app.pages?.length || 0;
        const date = new Date(app.createdAt).toLocaleDateString('ru-RU');
        
        return `
            <div class="miniapp-card" data-app-id="${app.id}">
                <h3>📱 ${this.escapeHtml(app.name)}</h3>
                <p>Страниц: ${pagesCount}</p>
                <div class="miniapp-preview">
                    <div class="miniapp-phone">
                        <div class="miniapp-phone-header">
                            <strong>${this.escapeHtml(app.name)}</strong>
                        </div>
                        <div class="miniapp-phone-body">
                            <p style="color: #666; text-align: center; padding: 40px 0;">
                                ${pagesCount > 0 ? 'Приложение готово' : 'Добавьте компоненты'}
                            </p>
                        </div>
                    </div>
                </div>
                <div class="miniapp-actions">
                    <button class="btn btn-primary btn-sm" onclick="miniApps.openEditor('${app.id}')">
                        ✏️ Редактор
                    </button>
                    <button class="btn btn-secondary btn-sm" onclick="miniApps.preview('${app.id}')">
                        👁️ Просмотр
                    </button>
                    <button class="btn btn-secondary btn-sm" onclick="miniApps.export('${app.id}')">
                        💾 Экспорт
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="miniApps.deleteApp('${app.id}')">
                        🗑️
                    </button>
                </div>
            </div>
        `;
    },

    /**
     * Открытие редактора
     */
    openEditor(appId) {
        const app = typeof appId === 'string' 
            ? this.apps.find(a => a.id === appId) 
            : appId;
        
        if (!app) return;

        this.currentApp = app;
        
        // Показываем редактор в модальном окне
        const modal = document.getElementById('previewModal');
        const content = document.getElementById('previewContent');
        
        if (!modal || !content) return;

        content.innerHTML = `
            <div class="editor-container" style="height: 70vh;">
                <!-- Палитра компонентов -->
                <div class="toolbar">
                    <h3>Компоненты</h3>
                    ${this.renderComponentPalette()}
                </div>
                
                <!-- Область редактирования -->
                <div class="scenarios-area">
                    <div class="scenarios-header">
                        <h3>${this.escapeHtml(app.name)}</h3>
                        <div>
                            <button class="btn btn-sm btn-secondary" onclick="miniApps.addPage()">+ Страница</button>
                            <button class="btn btn-sm btn-primary" onclick="miniApps.saveApp()">💾 Сохранить</button>
                        </div>
                    </div>
                    <div class="scenario-tabs" id="pageTabs">
                        ${app.pages.map((page, i) => `
                            <div class="scenario-tab ${i === 0 ? 'active' : ''}" 
                                 onclick="miniApps.selectPage(${i})">
                                ${this.escapeHtml(page.name)}
                            </div>
                        `).join('')}
                    </div>
                    <div class="scenarios-list" id="componentsList">
                        ${this.renderComponentsList()}
                    </div>
                </div>
                
                <!-- Панель свойств -->
                <div class="properties-panel">
                    <h3>Свойства</h3>
                    <div class="properties-content" id="componentProperties">
                        <p class="hint">Выберите компонент</p>
                    </div>
                </div>
            </div>
        `;

        ui.openModal('previewModal');
    },

    /**
     * Палитра компонентов
     */
    renderComponentPalette() {
        const components = [
            { type: 'text', icon: '📝', name: 'Текст' },
            { type: 'button', icon: '🔘', name: 'Кнопка' },
            { type: 'input', icon: '📥', name: 'Поле ввода' },
            { type: 'image', icon: '🖼️', name: 'Изображение' },
            { type: 'list', icon: '📋', name: 'Список' },
            { type: 'card', icon: '📦', name: 'Карточка' },
            { type: 'form', icon: '📄', name: 'Форма' },
            { type: 'table', icon: '📊', name: 'Таблица' }
        ];

        return `
            <div class="component-palette">
                ${components.map(c => `
                    <div class="component-btn" onclick="miniApps.addComponent('${c.type}')">
                        <span>${c.icon}</span>
                        <span>${c.name}</span>
                    </div>
                `).join('')}
            </div>
        `;
    },

    /**
     * Добавление компонента
     */
    addComponent(type) {
        if (!this.currentApp) return;

        const page = this.getCurrentPage();
        if (!page) return;

        const component = {
            id: 'comp_' + Date.now(),
            type: type,
            props: this.getDefaultProps(type)
        };

        page.components.push(component);
        this.saveApp();
        this.renderComponentsList();
        
        ui.toast('Компонент добавлен', 'success');
    },

    /**
     * Свойства по умолчанию для типа
     */
    getDefaultProps(type) {
        switch (type) {
            case 'text':
                return { text: 'Новый текст', fontSize: 16, color: '#000000', align: 'left' };
            case 'button':
                return { text: 'Кнопка', action: 'none', callback: '', color: '#2481cc' };
            case 'input':
                return { label: 'Поле', placeholder: 'Введите...', type: 'text', variable: '' };
            case 'image':
                return { src: '', alt: 'Изображение', width: '100%' };
            case 'list':
                return { data: [], itemTemplate: '' };
            case 'card':
                return { title: 'Заголовок', subtitle: '', image: '', actions: [] };
            case 'form':
                return { fields: [], submitAction: 'save', submitCallback: '' };
            case 'table':
                return { data: [], columns: [] };
            default:
                return {};
        }
    },

    /**
     * Отрисовка списка компонентов
     */
    renderComponentsList() {
        const page = this.getCurrentPage();
        const container = document.getElementById('componentsList');
        
        if (!page || !container) return;

        if (page.components.length === 0) {
            container.innerHTML = '<p class="hint">Добавьте компоненты из палитры</p>';
            return;
        }

        container.innerHTML = `
            <div class="form-builder">
                ${page.components.map((comp, i) => `
                    <div class="form-field" onclick="miniApps.selectComponent(${i})">
                        <div class="form-field-header">
                            <span>${this.getComponentIcon(comp.type)} ${comp.type}</span>
                            <span class="form-field-type">${comp.type}</span>
                        </div>
                        <div class="form-field-actions">
                            <button class="btn btn-sm btn-secondary" 
                                    onclick="event.stopPropagation(); miniApps.moveComponent(${i}, -1)">↑</button>
                            <button class="btn btn-sm btn-secondary" 
                                    onclick="event.stopPropagation(); miniApps.moveComponent(${i}, 1)">↓</button>
                            <button class="btn btn-sm btn-danger" 
                                    onclick="event.stopPropagation(); miniApps.deleteComponent(${i})">🗑️</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    },

    /**
     * Выбор компонента
     */
    selectComponent(index) {
        const page = this.getCurrentPage();
        if (!page) return;

        const component = page.components[index];
        this.renderComponentProperties(component, index);
    },

    /**
     * Отрисовка свойств компонента
     */
    renderComponentProperties(component, index) {
        const container = document.getElementById('componentProperties');
        if (!container) return;

        let html = '';

        switch (component.type) {
            case 'text':
                html = `
                    <div class="property-group">
                        <label>Текст</label>
                        <textarea onchange="miniApps.updateComponentProp(${index}, 'text', this.value)">${component.props.text}</textarea>
                    </div>
                    <div class="property-group">
                        <label>Размер шрифта</label>
                        <input type="number" value="${component.props.fontSize}" 
                               onchange="miniApps.updateComponentProp(${index}, 'fontSize', this.value)">
                    </div>
                    <div class="property-group">
                        <label>Цвет</label>
                        <input type="color" value="${component.props.color}" 
                               onchange="miniApps.updateComponentProp(${index}, 'color', this.value)">
                    </div>
                `;
                break;

            case 'button':
                html = `
                    <div class="property-group">
                        <label>Текст кнопки</label>
                        <input type="text" value="${component.props.text}" 
                               onchange="miniApps.updateComponentProp(${index}, 'text', this.value)">
                    </div>
                    <div class="property-group">
                        <label>Действие</label>
                        <select onchange="miniApps.updateComponentProp(${index}, 'action', this.value)">
                            <option value="none" ${component.props.action === 'none' ? 'selected' : ''}>Нет действия</option>
                            <option value="callback" ${component.props.action === 'callback' ? 'selected' : ''}>Отправить callback</option>
                            <option value="link" ${component.props.action === 'link' ? 'selected' : ''}>Открыть ссылку</option>
                            <option value="page" ${component.props.action === 'page' ? 'selected' : ''}>Перейти на страницу</option>
                            <option value="submit" ${component.props.action === 'submit' ? 'selected' : ''}>Отправить форму</option>
                        </select>
                    </div>
                    ${component.props.action === 'callback' ? `
                        <div class="property-group">
                            <label>Callback данные</label>
                            <input type="text" value="${component.props.callback || ''}" 
                                   onchange="miniApps.updateComponentProp(${index}, 'callback', this.value)">
                        </div>
                    ` : ''}
                    ${component.props.action === 'link' ? `
                        <div class="property-group">
                            <label>URL</label>
                            <input type="text" value="${component.props.url || ''}" 
                                   onchange="miniApps.updateComponentProp(${index}, 'url', this.value)">
                        </div>
                    ` : ''}
                `;
                break;

            case 'input':
                html = `
                    <div class="property-group">
                        <label>Метка</label>
                        <input type="text" value="${component.props.label}" 
                               onchange="miniApps.updateComponentProp(${index}, 'label', this.value)">
                    </div>
                    <div class="property-group">
                        <label>Тип</label>
                        <select onchange="miniApps.updateComponentProp(${index}, 'type', this.value)">
                            <option value="text" ${component.props.type === 'text' ? 'selected' : ''}>Текст</option>
                            <option value="number" ${component.props.type === 'number' ? 'selected' : ''}>Число</option>
                            <option value="email" ${component.props.type === 'email' ? 'selected' : ''}>Email</option>
                            <option value="tel" ${component.props.type === 'tel' ? 'selected' : ''}>Телефон</option>
                            <option value="date" ${component.props.type === 'date' ? 'selected' : ''}>Дата</option>
                        </select>
                    </div>
                    <div class="property-group">
                        <label>Placeholder</label>
                        <input type="text" value="${component.props.placeholder}" 
                               onchange="miniApps.updateComponentProp(${index}, 'placeholder', this.value)">
                    </div>
                    <div class="property-group">
                        <label>Переменная для сохранения</label>
                        <input type="text" value="${component.props.variable || ''}" 
                               placeholder="user_name"
                               onchange="miniApps.updateComponentProp(${index}, 'variable', this.value)">
                    </div>
                `;
                break;

            case 'list':
                html = `
                    <div class="property-group">
                        <label>Данные из Google Sheets</label>
                        <select onchange="miniApps.updateComponentProp(${index}, 'sheetName', this.value)">
                            <option value="">-- Выбрать таблицу --</option>
                            ${this.getSheetsOptions()}
                        </select>
                    </div>
                    <div class="property-group">
                        <label>Шаблон элемента</label>
                        <input type="text" value="${component.props.itemTemplate || ''}" 
                               placeholder="{{name}} - {{price}} ₽"
                               onchange="miniApps.updateComponentProp(${index}, 'itemTemplate', this.value)">
                        <small>Используйте {{variable}} для подстановки</small>
                    </div>
                `;
                break;

            case 'table':
                html = `
                    <div class="property-group">
                        <label>Данные из Google Sheets</label>
                        <select onchange="miniApps.updateComponentProp(${index}, 'sheetName', this.value)">
                            <option value="">-- Выбрать таблицу --</option>
                            ${this.getSheetsOptions()}
                        </select>
                    </div>
                    <div class="property-group">
                        <label>Колонки (через запятую)</label>
                        <input type="text" value="${component.props.columns?.join(', ') || ''}" 
                               placeholder="name, price, quantity"
                               onchange="miniApps.updateComponentProp(${index}, 'columns', this.value.split(','))">
                    </div>
                `;
                break;
        }

        container.innerHTML = html;
    },

    /**
     * Обновление свойства компонента
     */
    updateComponentProp(index, key, value) {
        const page = this.getCurrentPage();
        if (!page) return;

        page.components[index].props[key] = value;
        this.saveApp();
    },

    /**
     * Удаление компонента
     */
    deleteComponent(index) {
        const page = this.getCurrentPage();
        if (!page) return;

        page.components.splice(index, 1);
        this.saveApp();
        this.renderComponentsList();
        document.getElementById('componentProperties').innerHTML = '<p class="hint">Выберите компонент</p>';
        
        ui.toast('Компонент удалён', 'success');
    },

    /**
     * Перемещение компонента
     */
    moveComponent(index, direction) {
        const page = this.getCurrentPage();
        if (!page) return;

        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= page.components.length) return;

        [page.components[index], page.components[newIndex]] = 
        [page.components[newIndex], page.components[index]];

        this.saveApp();
        this.renderComponentsList();
    },

    /**
     * Добавление страницы
     */
    addPage() {
        const name = prompt('Название страницы:', 'Новая страница');
        if (!name) return;

        this.currentApp.pages.push({
            id: 'page_' + Date.now(),
            name: name,
            components: []
        });

        this.saveApp();
        this.openEditor(this.currentApp);
    },

    /**
     * Выбор страницы
     */
    selectPage(index) {
        document.querySelectorAll('.scenario-tab').forEach((tab, i) => {
            tab.classList.toggle('active', i === index);
        });
        this.currentApp.currentPage = index;
        this.renderComponentsList();
    },

    /**
     * Текущая страница
     */
    getCurrentPage() {
        if (!this.currentApp) return null;
        const index = this.currentApp.currentPage || 0;
        return this.currentApp.pages[index];
    },

    /**
     * Сохранение приложения
     */
    saveApp() {
        if (!this.currentApp) return;
        
        this.currentApp.updatedAt = new Date().toISOString();
        
        const index = this.apps.findIndex(a => a.id === this.currentApp.id);
        if (index !== -1) {
            this.apps[index] = this.currentApp;
        }
        
        this.saveApps();
        this.renderApps();
        
        ui.toast('Приложение сохранено', 'success');
    },

    /**
     * Предпросмотр
     */
    preview(appId) {
        const app = this.apps.find(a => a.id === appId);
        if (!app) return;

        // Генерация HTML предпросмотра
        const html = this.generateHTML(app);
        
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
    },

    /**
     * Экспорт приложения
     */
    export(appId) {
        const app = this.apps.find(a => a.id === appId);
        if (!app) return;

        const exportData = {
            version: '1.0',
            app: app,
            html: this.generateHTML(app)
        };

        const json = JSON.stringify(exportData, null, 2);
        
        // Скачиваем JSON
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${app.name}_miniapp.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        ui.toast('Mini App экспортирован', 'success');
    },

    /**
     * Генерация HTML для Mini App
     */
    generateHTML(app) {
        return `<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${app.name}</title>
    <script src="https://telegram.org/js/telegram-web-app.js"><\/script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: ${app.settings.backgroundColor};
            color: #000;
        }
        .header {
            background-color: ${app.settings.headerColor};
            color: white;
            padding: 16px;
            text-align: center;
        }
        .content { padding: 16px; }
        .btn {
            background-color: ${app.settings.buttonColor};
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 16px;
            cursor: pointer;
            margin: 8px 0;
            width: 100%;
        }
        .input {
            width: 100%;
            padding: 12px;
            border: 1px solid #ddd;
            border-radius: 8px;
            font-size: 16px;
            margin: 8px 0;
        }
        .text { margin: 8px 0; }
        .card {
            background: white;
            border-radius: 12px;
            padding: 16px;
            margin: 12px 0;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .list-item {
            padding: 12px;
            border-bottom: 1px solid #eee;
        }
    </style>
</head>
<body>
    <div class="header">${app.name}</div>
    <div class="content">
        ${this.renderComponents(app.pages[0]?.components || [])}
    </div>
    <script>
        const tg = window.Telegram.WebApp;
        tg.ready();
        tg.expand();
        
        // Отправка данных боту
        function sendData(data) {
            tg.sendData(JSON.stringify(data));
        }
    <\/script>
</body>
</html>`;
    },

    /**
     * Рендер компонентов в HTML
     */
    renderComponents(components) {
        if (!components) return '';
        
        return components.map(comp => {
            const props = comp.props;
            
            switch (comp.type) {
                case 'text':
                    return `<div class="text" style="font-size: ${props.fontSize}px; color: ${props.color}; text-align: ${props.align};">${props.text}</div>`;
                
                case 'button':
                    return `<button class="btn" style="background-color: ${props.color};" onclick="${this.getButtonAction(props)}">${props.text}</button>`;
                
                case 'input':
                    return `<label>${props.label}</label><input class="input" type="${props.type}" placeholder="${props.placeholder}" id="${props.variable}">`;
                
                case 'card':
                    return `
                        <div class="card">
                            <h3>${props.title}</h3>
                            <p>${props.subtitle}</p>
                        </div>
                    `;
                
                default:
                    return '';
            }
        }).join('');
    },

    /**
     * Действие кнопки
     */
    getButtonAction(props) {
        switch (props.action) {
            case 'callback':
                return `sendData({action: 'callback', data: '${props.callback}'})`;
            case 'link':
                return `window.open('${props.url}', '_blank')`;
            case 'submit':
                return `sendData({action: 'submit'})`;
            default:
                return '';
        }
    },

    /**
     * Удаление приложения
     */
    deleteApp(appId) {
        if (!confirm('Удалить это Mini App?')) return;

        this.apps = this.apps.filter(a => a.id !== appId);
        this.saveApps();
        this.renderApps();
        
        ui.toast('Приложение удалено', 'success');
    },

    /**
     * Опции таблиц для dropdown
     */
    getSheetsOptions() {
        const sheets = database.getSheets();
        return sheets.map(s => `<option value="${s}">${s}</option>`).join('');
    },

    /**
     * Иконка типа компонента
     */
    getComponentIcon(type) {
        const icons = {
            text: '📝',
            button: '🔘',
            input: '📥',
            image: '🖼️',
            list: '📋',
            card: '📦',
            form: '📄',
            table: '📊'
        };
        return icons[type] || '📦';
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

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', () => {
    miniApps.init();
});
