/**
 * Интеграция с Google Sheets как с базой данных
 * Подключение через Google Sheets API
 */

const database = {
    // Настройки подключения
    config: {
        spreadsheetId: '',
        credentials: null,
        enabled: false
    },
    
    // Кэшированные данные
    sheets: [],
    data: {}
};

/**
 * Подключение к Google Таблицам
 */
database.connectGoogleSheets = function() {
    const sheetId = document.getElementById('gsSheetId').value.trim();
    const credentialsStr = document.getElementById('gsCredentials').value.trim();
    
    if (!sheetId || !credentialsStr) {
        ui.toast('Введите Spreadsheet ID и JSON ключ', 'warning');
        return;
    }
    
    try {
        const credentials = JSON.parse(credentialsStr);
        
        this.config = {
            spreadsheetId: sheetId,
            credentials: credentials,
            enabled: true
        };
        
        // Сохраняем в localStorage
        localStorage.setItem('botbuilder_database', JSON.stringify(this.config));
        
        // Обновляем UI
        this.updateStatus(true);
        
        ui.toast('Google Таблицы подключены', 'success');
        
        // Загружаем список таблиц
        this.loadSheets();
        
    } catch (error) {
        ui.toast('Ошибка JSON: ' + error.message, 'error');
    }
};

/**
 * Загрузка настроек из localStorage
 */
database.loadConfig = function() {
    try {
        const stored = localStorage.getItem('botbuilder_database');
        if (stored) {
            this.config = JSON.parse(stored);
            
            if (this.config.enabled) {
                this.updateStatus(true);
                document.getElementById('gsSheetId').value = this.config.spreadsheetId;
                if (this.config.credentials) {
                    document.getElementById('gsCredentials').value = JSON.stringify(this.config.credentials, null, 2);
                }
            }
        }
    } catch (error) {
        console.error('Ошибка загрузки настроек БД:', error);
    }
};

/**
 * Обновление статуса подключения
 */
database.updateStatus = function(connected) {
    const statusEl = document.getElementById('gsStatus');
    if (!statusEl) return;
    
    const dot = statusEl.querySelector('.status-dot');
    const text = statusEl.querySelector('span:last-child');
    
    if (connected) {
        dot.classList.add('connected');
        text.textContent = 'Подключено: ' + this.config.spreadsheetId;
    } else {
        dot.classList.remove('connected');
        text.textContent = 'Не подключено';
    }
};

/**
 * Тест подключения
 */
database.testConnection = async function() {
    if (!this.config.enabled) {
        ui.toast('Сначала подключите Google Таблицы', 'warning');
        return;
    }
    
    ui.toast('Проверка подключения...', 'info');
    
    try {
        // Загружаем метаданные таблицы
        const response = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${this.config.spreadsheetId}?key=YOUR_API_KEY`,
            {
                headers: {
                    'Authorization': `Bearer ${await this.getAccessToken()}`
                }
            }
        );
        
        if (response.ok) {
            const data = await response.json();
            ui.toast(`Подключено: ${data.properties.title}`, 'success');
        } else {
            ui.toast('Ошибка подключения', 'error');
        }
    } catch (error) {
        ui.toast('Ошибка: ' + error.message, 'error');
    }
};

/**
 * Загрузка списка листов
 */
database.loadSheets = async function() {
    if (!this.config.enabled) return;
    
    try {
        // В реальной реализации нужен серверный прокси для OAuth
        // Здесь упрощённая версия
        
        const container = document.getElementById('sheetsList');
        if (!container) return;
        
        // Получаем имена листов из конфига или запрашиваем
        const sheets = await this.getSheetsList();
        
        container.innerHTML = sheets.map(sheet => `
            <div class="integration-item">
                <span>📄 ${sheet}</span>
                <button class="btn btn-sm btn-secondary" onclick="database.viewSheet('${sheet}')">
                    Просмотр
                </button>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Ошибка загрузки листов:', error);
    }
};

/**
 * Получение списка листов (упрощённо)
 */
database.getSheetsList = async function() {
    // В продакшене здесь будет запрос к Google Sheets API
    // Для демонстрации возвращаем заглушку
    
    return ['Лист1', 'Users', 'Orders', 'Products'];
};

/**
 * Получение OAuth токена
 * В продакшене должен быть серверный компонент
 */
database.getAccessToken = async function() {
    // Для клиентского приложения нужен OAuth 2.0 flow
    // Используем JWT из service account credentials
    
    if (!this.config.credentials) {
        throw new Error('Credentials не настроены');
    }
    
    // Упрощённая реализация JWT
    const jwt = await this.createJWT();
    return jwt;
};

/**
 * Создание JWT токена
 */
database.createJWT = async function() {
    // В реальной реализации нужно подписывать JWT
    // Здесь заглушка для демонстрации
    
    const header = {
        alg: 'RS256',
        typ: 'JWT'
    };
    
    const payload = {
        iss: this.config.credentials.client_email,
        scope: 'https://www.googleapis.com/auth/spreadsheets',
        aud: 'https://oauth2.googleapis.com/token',
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000)
    };
    
    // Для реальной работы нужна библиотека типа jsrsasign
    console.log('JWT payload:', payload);
    
    return 'mock_jwt_token';
};

/**
 * Получить данные из таблицы
 */
database.getData = async function(sheetName, options = {}) {
    if (!this.config.enabled) {
        throw new Error('База данных не подключена');
    }
    
    const range = options.range || `${sheetName}!A:Z`;
    
    try {
        const response = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${this.config.spreadsheetId}/values/${range}?key=YOUR_API_KEY`,
            {
                headers: {
                    'Authorization': `Bearer ${await this.getAccessToken()}`
                }
            }
        );
        
        if (!response.ok) {
            throw new Error('Ошибка загрузки данных');
        }
        
        const result = await response.json();
        return result.values || [];
        
    } catch (error) {
        console.error('getData error:', error);
        throw error;
    }
};

/**
 * Добавить строку в таблицу
 */
database.appendRow = async function(sheetName, rowData) {
    if (!this.config.enabled) {
        throw new Error('База данных не подключена');
    }
    
    try {
        const response = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${this.config.spreadsheetId}/values/${sheetName}!A:Z:append?valueInputOption=RAW`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${await this.getAccessToken()}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    values: [rowData]
                })
            }
        );
        
        if (!response.ok) {
            throw new Error('Ошибка добавления данных');
        }
        
        return await response.json();
        
    } catch (error) {
        console.error('appendRow error:', error);
        throw error;
    }
};

/**
 * Обновить строку
 */
database.updateRow = async function(sheetName, rowIndex, rowData) {
    if (!this.config.enabled) {
        throw new Error('База данных не подключена');
    }
    
    try {
        const range = `${sheetName}!A${rowIndex + 1}:Z${rowIndex + 1}`;
        
        const response = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${this.config.spreadsheetId}/values/${range}?valueInputOption=RAW`,
            {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${await this.getAccessToken()}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    values: [rowData]
                })
            }
        );
        
        if (!response.ok) {
            throw new Error('Ошибка обновления данных');
        }
        
        return await response.json();
        
    } catch (error) {
        console.error('updateRow error:', error);
        throw error;
    }
};

/**
 * Удалить строку (очистить)
 */
database.deleteRow = async function(sheetName, rowIndex) {
    if (!this.config.enabled) {
        throw new Error('База данных не подключена');
    }
    
    try {
        const range = `${sheetName}!A${rowIndex + 1}:Z${rowIndex + 1}`;
        
        const response = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${this.config.spreadsheetId}/values/${range}:clear`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${await this.getAccessToken()}`
                }
            }
        );
        
        if (!response.ok) {
            throw new Error('Ошибка удаления данных');
        }
        
        return await response.json();
        
    } catch (error) {
        console.error('deleteRow error:', error);
        throw error;
    }
};

/**
 * Просмотр таблицы
 */
database.viewSheet = async function(sheetName) {
    ui.toast(`Загрузка ${sheetName}...`, 'info');
    
    try {
        const data = await this.getData(sheetName);
        
        // Показываем в модальном окне
        const modal = document.getElementById('previewModal');
        const content = document.getElementById('previewContent');
        
        if (!modal || !content) return;
        
        content.innerHTML = `
            <h3>📄 ${sheetName}</h3>
            <div style="max-height: 400px; overflow: auto; margin: 16px 0;">
                ${this.renderTable(data)}
            </div>
            <p>Строк: ${data.length}</p>
        `;
        
        ui.openModal('previewModal');
        
    } catch (error) {
        ui.toast('Ошибка: ' + error.message, 'error');
    }
};

/**
 * Отрисовка таблицы
 */
database.renderTable = function(data) {
    if (!data || data.length === 0) {
        return '<p class="hint">Нет данных</p>';
    }
    
    const headers = data[0];
    const rows = data.slice(1);
    
    return `
        <table style="width: 100%; border-collapse: collapse;">
            <thead>
                <tr style="background: var(--bg-card);">
                    ${headers.map(h => `<th style="padding: 12px; text-align: left; border: 1px solid var(--border-color);">${h}</th>`).join('')}
                </tr>
            </thead>
            <tbody>
                ${rows.map(row => `
                    <tr>
                        ${row.map(cell => `<td style="padding: 12px; border: 1px solid var(--border-color);">${cell || ''}</td>`).join('')}
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
};

/**
 * Переключение интеграции
 */
database.toggleIntegration = function(name, enabled) {
    if (name === 'googleSheets') {
        this.config.enabled = enabled;
        localStorage.setItem('botbuilder_database', JSON.stringify(this.config));
        this.updateStatus(enabled);
        
        if (enabled) {
            ui.toast('Google Sheets включена', 'success');
            this.loadSheets();
        } else {
            ui.toast('Google Sheets выключена', 'info');
        }
    }
};

/**
 * Получить список листов
 */
database.getSheets = function() {
    return ['Лист1', 'Users', 'Orders', 'Products'];
};

/**
 * Сохранить данные из формы в Google Sheets
 */
database.saveFormData = async function(sheetName, formData) {
    try {
        await this.appendRow(sheetName, Object.values(formData));
        ui.toast('Данные сохранены', 'success');
        return true;
    } catch (error) {
        ui.toast('Ошибка сохранения: ' + error.message, 'error');
        return false;
    }
};

/**
 * Инициализация
 */
document.addEventListener('DOMContentLoaded', () => {
    database.loadConfig();
});
