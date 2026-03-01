/**
 * Основное приложение конструктора ботов
 */

const app = {
    // Текущий активный бот
    currentBot: null,
    
    // Все боты пользователя
    bots: [],
    
    // Настройки
    settings: {
        github: {
            token: '',
            repo: '',
            username: ''
        },
        s3: {
            endpoint: '',
            accessKey: '',
            secretKey: '',
            bucket: ''
        }
    },

    /**
     * Инициализация приложения
     */
    async init() {
        await this.loadBots();
        await this.loadSettings();
        githubSync.loadAutoSyncSetting();
        this.setupEventListeners();
        this.renderBotsList();
        this.checkGitHubStatus();
        
        // Обновляем UI авто-синхронизации
        const autoSyncCheckbox = document.getElementById('autoSyncEnabled');
        if (autoSyncCheckbox) {
            autoSyncCheckbox.checked = githubSync.autoSync;
        }
        
        console.log('BotBuilder initialized');
    },

    /**
     * Настройка обработчиков событий
     */
    setupEventListeners() {
        // Навигация
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.target.dataset.view;
                this.showView(view);
            });
        });

        // Форма создания бота
        const createForm = document.getElementById('createBotForm');
        if (createForm) {
            createForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.createBot();
            });
        }

        // Форма настроек
        const settingsForm = document.getElementById('settingsForm');
        if (settingsForm) {
            settingsForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveSettings();
            });
        }
    },

    /**
     * Переключение между экранами
     */
    showView(viewName) {
        // Скрываем все view
        document.querySelectorAll('.view').forEach(view => {
            view.classList.remove('active');
        });

        // Показываем нужный
        const targetView = document.getElementById(`${viewName}View`);
        if (targetView) {
            targetView.classList.add('active');
        }

        // Обновляем активную кнопку навигации
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === viewName);
        });

        // Если переходим на dashboard, обновляем список
        if (viewName === 'dashboard') {
            this.renderBotsList();
        }
    },

    /**
     * Загрузка списка ботов из localStorage
     */
    async loadBots() {
        try {
            const stored = localStorage.getItem('botbuilder_bots');
            if (stored) {
                this.bots = JSON.parse(stored);
            }
        } catch (error) {
            console.error('Ошибка загрузки ботов:', error);
            this.bots = [];
        }
    },

    /**
     * Сохранение списка ботов
     */
    async saveBots() {
        try {
            localStorage.setItem('botbuilder_bots', JSON.stringify(this.bots));
        } catch (error) {
            console.error('Ошибка сохранения ботов:', error);
            ui.toast('Ошибка сохранения', 'error');
        }
    },

    /**
     * Создание нового бота
     */
    async createBot() {
        const name = document.getElementById('botName').value.trim();
        const username = document.getElementById('botUsername').value.trim();
        const token = document.getElementById('botToken').value.trim();
        const description = document.getElementById('botDescription').value.trim();

        if (!name || !username || !token) {
            ui.toast('Заполните обязательные поля', 'warning');
            return;
        }

        const bot = {
            id: this.generateId(),
            name: name,
            username: username,
            token: token,
            description: description,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            scenes: [
                {
                    id: 'start',
                    name: 'Главное меню',
                    trigger: '/start',
                    message: 'Добро пожаловать! Чем я могу помочь?',
                    blocks: []
                }
            ],
            variables: [],
            integrations: {
                googleSheets: { enabled: false },
                payments: { enabled: false },
                ai: { enabled: false }
            }
        };

        this.bots.push(bot);
        await this.saveBots();

        ui.toast('Бот успешно создан!', 'success');
        
        // Очищаем форму
        document.getElementById('createBotForm').reset();
        
        // Открываем редактор
        this.openBotEditor(bot.id);
    },

    /**
     * Открытие редактора бота
     */
    openBotEditor(botId) {
        const bot = this.bots.find(b => b.id === botId);
        if (!bot) {
            ui.toast('Бот не найден', 'error');
            return;
        }

        this.currentBot = bot;
        document.getElementById('editorBotTitle').textContent = `Редактор: ${bot.name}`;

        // Инициализируем node editor
        nodeEditor.init(bot.scenes || []);

        this.showView('editor');
    },

    /**
     * Отрисовка списка ботов
     */
    renderBotsList() {
        const grid = document.getElementById('botsGrid');
        const emptyState = document.getElementById('emptyState');

        if (!grid) return;

        if (this.bots.length === 0) {
            grid.innerHTML = '';
            grid.appendChild(emptyState);
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';
        grid.innerHTML = this.bots.map(bot => this.renderBotCard(bot)).join('');

        // Добавляем обработчики на карточки
        grid.querySelectorAll('.bot-card').forEach(card => {
            const botId = card.dataset.botId;
            
            // Клик по карточке - открыть редактор
            card.querySelector('.btn-edit')?.addEventListener('click', (e) => {
                e.stopPropagation();
                this.openBotEditor(botId);
            });

            // Кнопка экспорта
            card.querySelector('.btn-export')?.addEventListener('click', (e) => {
                e.stopPropagation();
                const bot = this.bots.find(b => b.id === botId);
                if (bot) {
                    exporter.exportBot(bot);
                }
            });

            // Кнопка удаления
            card.querySelector('.btn-delete')?.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteBot(botId);
            });
        });
    },

    /**
     * HTML карточки бота
     */
    renderBotCard(bot) {
        const date = new Date(bot.createdAt).toLocaleDateString('ru-RU');
        const scenesCount = bot.scenes?.length || 0;
        
        return `
            <div class="bot-card" data-bot-id="${bot.id}">
                <div class="bot-card-header">
                    <div class="bot-avatar">🤖</div>
                    <div class="bot-info">
                        <h3>${this.escapeHtml(bot.name)}</h3>
                        <p>@${this.escapeHtml(bot.username)}</p>
                    </div>
                </div>
                <div class="bot-card-body">
                    <p style="color: var(--text-secondary); font-size: 13px; margin-bottom: 12px;">
                        ${this.escapeHtml(bot.description) || 'Нет описания'}
                    </p>
                    <div class="bot-stats">
                        <span>📦 Сценариев: ${scenesCount}</span>
                        <span>📅 ${date}</span>
                    </div>
                </div>
                <div class="bot-card-actions">
                    <button class="btn btn-primary btn-sm btn-edit">✏️ Редактировать</button>
                    <button class="btn btn-secondary btn-sm btn-export">💾 Экспорт</button>
                    <button class="btn btn-danger btn-sm btn-delete">🗑️</button>
                </div>
            </div>
        `;
    },

    /**
     * Удаление бота
     */
    async deleteBot(botId) {
        if (!confirm('Вы уверены, что хотите удалить этого бота?')) {
            return;
        }

        this.bots = this.bots.filter(b => b.id !== botId);
        await this.saveBots();
        this.renderBotsList();
        
        ui.toast('Бот удалён', 'success');
    },

    /**
     * Загрузка настроек
     */
    async loadSettings() {
        try {
            const stored = localStorage.getItem('botbuilder_settings');
            if (stored) {
                this.settings = JSON.parse(stored);
                
                // Заполняем поля
                const gh = this.settings.github;
                if (gh) {
                    document.getElementById('githubToken').value = gh.token || '';
                    document.getElementById('githubRepo').value = gh.repo || '';
                    document.getElementById('githubUsername').value = gh.username || '';
                }
                
                const s3 = this.settings.s3;
                if (s3) {
                    document.getElementById('s3Endpoint').value = s3.endpoint || '';
                    document.getElementById('s3AccessKey').value = s3.accessKey || '';
                    document.getElementById('s3SecretKey').value = s3.secretKey || '';
                    document.getElementById('s3Bucket').value = s3.bucket || '';
                }
            }
        } catch (error) {
            console.error('Ошибка загрузки настроек:', error);
        }
    },

    /**
     * Сохранение настроек
     */
    async saveSettings() {
        this.settings.github = {
            token: document.getElementById('githubToken').value.trim(),
            repo: document.getElementById('githubRepo').value.trim(),
            username: document.getElementById('githubUsername').value.trim()
        };

        this.settings.s3 = {
            endpoint: document.getElementById('s3Endpoint').value.trim(),
            accessKey: document.getElementById('s3AccessKey').value.trim(),
            secretKey: document.getElementById('s3SecretKey').value.trim(),
            bucket: document.getElementById('s3Bucket').value.trim()
        };

        try {
            localStorage.setItem('botbuilder_settings', JSON.stringify(this.settings));
            ui.toast('Настройки сохранены', 'success');
            this.checkGitHubStatus();
        } catch (error) {
            ui.toast('Ошибка сохранения настроек', 'error');
        }
    },

    /**
     * Проверка статуса GitHub
     */
    checkGitHubStatus() {
        const statusEl = document.getElementById('githubStatus');
        const dot = statusEl?.querySelector('.status-dot');
        const text = statusEl?.querySelector('.status-text');
        
        if (this.settings.github.token && this.settings.github.repo) {
            dot?.classList.add('connected');
            if (text) text.textContent = 'GitHub подключён';
        } else {
            dot?.classList.remove('connected');
            if (text) text.textContent = 'GitHub не подключён';
        }
    },

    /**
     * Генерация уникального ID
     */
    generateId() {
        return 'bot_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },

    /**
     * Экранирование HTML
     */
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    /**
     * Обновление текущего бота
     */
    updateCurrentBot() {
        if (!this.currentBot) return;
        
        const index = this.bots.findIndex(b => b.id === this.currentBot.id);
        if (index !== -1) {
            this.bots[index] = this.currentBot;
            this.currentBot.updatedAt = new Date().toISOString();
            this.saveBots();
            
            // Авто-синхронизация с GitHub
            if (githubSync.autoSync) {
                githubSync.autoSyncBot(this.currentBot);
            }
        }
    }
};

// Запуск приложения
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
