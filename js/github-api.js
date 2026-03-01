/**
 * Интеграция с GitHub API
 * Сохранение ботов в репозиторий
 */

const githubSync = {
    // Настройки репозитория
    repo: {
        owner: 'kkav45',
        name: 'coopbot',
        branch: 'main',
        token: ''
    },
    
    // Авто-синхронизация
    autoSync: false,
    /**
     * Подключение к GitHub
     */
    connect() {
        const token = document.getElementById('githubToken').value.trim();
        const repo = document.getElementById('githubRepo').value.trim();
        const username = document.getElementById('githubUsername').value.trim();

        if (!token || !repo) {
            ui.toast('Введите токен и имя репозитория', 'warning');
            return;
        }

        this.repo.token = token;
        this.repo.name = repo;
        this.repo.owner = username || 'kkav45';
        
        app.settings.github = { 
            token, 
            repo: this.repo.name, 
            username: this.repo.owner 
        };
        app.saveSettings();
        
        // Проверяем подключение
        this.testConnection().then(connected => {
            if (connected) {
                ui.toast('GitHub успешно подключён!', 'success');
                app.checkGitHubStatus();
            } else {
                ui.toast('Ошибка подключения к GitHub', 'error');
            }
        });
    },

    /**
     * Быстрое подключение к coopbot репозиторию
     */
    connectToCoopbot(token) {
        this.repo.token = token;
        this.repo.owner = 'kkav45';
        this.repo.name = 'coopbot';
        this.repo.branch = 'main';
        
        app.settings.github = {
            token: token,
            repo: 'coopbot',
            username: 'kkav45'
        };
        app.saveSettings();
        
        document.getElementById('githubToken').value = token;
        document.getElementById('githubRepo').value = 'coopbot';
        document.getElementById('githubUsername').value = 'kkav45';
        
        return this.testConnection();
    },

    /**
     * Проверка подключения
     */
    async testConnection() {
        try {
            const response = await this.apiRequest('/user');
            return response.ok;
        } catch (error) {
            console.error('GitHub connection test failed:', error);
            return false;
        }
    },

    /**
     * Публикация бота на GitHub
     */
    async pushToGitHub(bot = null, showNotification = true) {
        const targetBot = bot || app.currentBot;
        
        if (!targetBot) {
            ui.toast('Выберите бота для публикации', 'warning');
            return false;
        }

        const { token, repo, username } = app.settings.github;
        
        if (!token || !repo) {
            ui.toast('Настройте GitHub интеграцию', 'warning');
            app.showView('settings');
            return false;
        }

        try {
            if (showNotification) {
                ui.toast('Публикация на GitHub...', 'info');
            }

            // Подготовка файлов
            const deployFiles = exporter.exportForDeploy(targetBot);
            
            // Создаём папку для бота
            const botPath = `bots/${targetBot.username}`;
            
            // Загружаем каждый файл
            for (const [filename, content] of Object.entries(deployFiles)) {
                await this.createOrUpdateFile(
                    `${botPath}/${filename}`,
                    content,
                    `Update ${filename} for ${targetBot.name}`
                );
            }

            // Создаём/обновляем README в корне
            await this.createOrUpdateFile(
                'README.md',
                this.generateRootReadme(),
                'Update README'
            );

            if (showNotification) {
                ui.toast('Бот успешно опубликован!', 'success');
                
                // Показываем ссылку
                const repoUrl = `https://github.com/${username}/${repo}`;
                const botUrl = `${repoUrl}/tree/main/bots/${targetBot.username}`;
                
                setTimeout(() => {
                    if (confirm(`Бот опубликован!\n\nОткрыть репозиторий?\n${botUrl}`)) {
                        window.open(botUrl, '_blank');
                    }
                }, 500);
            }
            
            return true;

        } catch (error) {
            console.error('GitHub publish error:', error);
            ui.toast(`Ошибка: ${error.message}`, 'error');
            return false;
        }
    },

    /**
     * Автоматическая публикация при сохранении
     */
    async autoSyncBot(bot) {
        if (!this.autoSync) {
            return false;
        }
        
        if (!app.settings.github.token) {
            return false;
        }
        
        try {
            await this.pushToGitHub(bot, false);
            console.log(`Auto-synced bot: ${bot.name}`);
            return true;
        } catch (error) {
            console.error('Auto-sync error:', error);
            return false;
        }
    },

    /**
     * Создание или обновление файла
     */
    async createOrUpdateFile(path, content, message) {
        const { token, repo, username } = app.settings.github;
        
        // Проверяем, существует ли файл
        let sha = null;
        try {
            const existing = await this.getFile(path);
            sha = existing.sha;
        } catch (error) {
            // Файл не существует - это нормально
        }

        // Кодируем контент в base64
        const base64Content = btoa(unescape(encodeURIComponent(content)));

        const payload = {
            message: message,
            content: base64Content,
            branch: 'main'
        };

        if (sha) {
            payload.sha = sha;
        }

        const response = await fetch(
            `https://api.github.com/repos/${username}/${repo}/contents/${path}`,
            {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/vnd.github.v3+json'
                },
                body: JSON.stringify(payload)
            }
        );

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to upload file');
        }

        return response.json();
    },

    /**
     * Получение файла из репозитория
     */
    async getFile(path) {
        const { token, repo, username } = app.settings.github;
        
        const response = await fetch(
            `https://api.github.com/repos/${username}/${repo}/contents/${path}`,
            {
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            }
        );

        if (!response.ok) {
            throw new Error('File not found');
        }

        const data = await response.json();
        
        // Декодируем контент
        const content = atob(data.content);
        
        return {
            sha: data.sha,
            content: content,
            size: data.size
        };
    },

    /**
     * Загрузка списка ботов из GitHub
     */
    async loadBotsFromGitHub() {
        const { token, repo, username } = app.settings.github;
        
        try {
            const response = await fetch(
                `https://api.github.com/repos/${username}/${repo}/contents/bots`,
                {
                    headers: {
                        'Authorization': `token ${token}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                }
            );

            if (!response.ok) {
                return [];
            }

            const folders = await response.json();
            const bots = [];

            for (const folder of folders) {
                if (folder.type === 'dir') {
                    // Загружаем конфиг бота
                    try {
                        const configFile = await this.getFile(`bots/${folder.name}/bot-config.json`);
                        const config = JSON.parse(configFile.content);
                        bots.push(config.bot);
                    } catch (error) {
                        console.error(`Failed to load bot ${folder.name}:`, error);
                    }
                }
            }

            return bots;
        } catch (error) {
            console.error('Load bots error:', error);
            return [];
        }
    },

    /**
     * Удаление бота из GitHub
     */
    async deleteFromGitHub(botUsername) {
        const { token, repo, username } = app.settings.github;
        
        try {
            // Получаем список файлов в папке бота
            const response = await fetch(
                `https://api.github.com/repos/${username}/${repo}/contents/bots/${botUsername}`,
                {
                    headers: {
                        'Authorization': `token ${token}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                }
            );

            if (!response.ok) {
                return;
            }

            const files = await response.json();

            // Удаляем каждый файл
            for (const file of files) {
                await fetch(file.url, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `token ${token}`,
                        'Accept': 'application/vnd.github.v3+json'
                    },
                    body: JSON.stringify({
                        message: `Delete ${file.name}`,
                        sha: file.sha,
                        branch: 'main'
                    })
                });
            }

            ui.toast('Бот удалён из GitHub', 'success');
        } catch (error) {
            console.error('Delete error:', error);
            ui.toast('Ошибка при удалении', 'error');
        }
    },

    /**
     * Генерация корневого README
     */
    generateRootReadme() {
        return `# Мои Telegram Боты

Этот репозиторий содержит конфигурации Telegram ботов, созданных в **BotBuilder**.

## 🤖 Мои боты

| Бот | Описание | Статус |
|-----|----------|--------|
${app.bots.map(bot => `| [${bot.name}](bots/${bot.username}/) | ${bot.description || 'Нет описания'} | ✅ |`).join('\n')}

## 📁 Структура

\`\`\`
bots/
└── [username]/
    ├── bot-config.json    # Конфигурация бота
    ├── bot.py             # Раннер бота
    ├── requirements.txt   # Зависимости
    └── README.md          # Документация
\`\`\`

## 🚀 Развёртывание бота

1. Клонируйте репозиторий
2. Перейдите в папку бота
3. Установите зависимости: \`pip install -r requirements.txt\`
4. Создайте \`.env\` файл с вашим токеном
5. Запустите: \`python bot.py\`

## 🛠️ BotBuilder

Этот проект создан в No-Code конструкторе [BotBuilder](https://github.com/yourusername/botbuilder).

Создавайте своих ботов без программирования!
`;
    },

    /**
     * API запрос к GitHub
     */
    async apiRequest(endpoint, options = {}) {
        const { token } = app.settings.github;
        
        const response = await fetch(`https://api.github.com${endpoint}`, {
            ...options,
            headers: {
                ...options.headers,
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        return response;
    },

    /**
     * Синхронизация локальных ботов с GitHub
     */
    async sync() {
        ui.toast('Синхронизация с GitHub...', 'info');

        try {
            const githubBots = await this.loadBotsFromGitHub();

            // Добавляем ботов из GitHub в локальный список
            for (const ghBot of githubBots) {
                const exists = app.bots.find(b => b.id === ghBot.id);
                if (!exists) {
                    app.bots.push(ghBot);
                }
            }

            await app.saveBots();
            app.renderBotsList();

            ui.toast('Синхронизация завершена', 'success');
        } catch (error) {
            ui.toast('Ошибка синхронизации', 'error');
        }
    },

    /**
     * Включение авто-синхронизации
     */
    enableAutoSync() {
        this.autoSync = true;
        localStorage.setItem('botbuilder_github_autosync', 'true');
        ui.toast('Авто-синхронизация включена', 'success');
    },

    /**
     * Выключение авто-синхронизации
     */
    disableAutoSync() {
        this.autoSync = false;
        localStorage.setItem('botbuilder_github_autosync', 'false');
        ui.toast('Авто-синхронизация выключена', 'info');
    },

    /**
     * Загрузка настроек авто-синхронизации
     */
    loadAutoSyncSetting() {
        const setting = localStorage.getItem('botbuilder_github_autosync');
        this.autoSync = setting === 'true';
        return this.autoSync;
    }
};
