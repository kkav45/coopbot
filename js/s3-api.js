/**
 * Интеграция с S3-совместимыми хранилищами
 * Поддержка: AWS S3, Cloudflare R2, DigitalOcean Spaces, MinIO
 */

const s3Sync = {
    /**
     * Подключение к S3
     */
    connect() {
        const endpoint = document.getElementById('s3Endpoint').value.trim();
        const accessKey = document.getElementById('s3AccessKey').value.trim();
        const secretKey = document.getElementById('s3SecretKey').value.trim();
        const bucket = document.getElementById('s3Bucket').value.trim();

        if (!endpoint || !accessKey || !secretKey || !bucket) {
            ui.toast('Заполните все поля S3 настроек', 'warning');
            return;
        }

        app.settings.s3 = { endpoint, accessKey, secretKey, bucket };
        app.saveSettings();
        
        ui.toast('S3 настройки сохранены', 'success');
    },

    /**
     * Загрузка файла в S3
     * @param {File} file - файл для загрузки
     * @param {string} path - путь в хранилище
     */
    async uploadFile(file, path) {
        const { endpoint, accessKey, secretKey, bucket } = app.settings.s3;
        
        if (!endpoint || !accessKey || !secretKey || !bucket) {
            throw new Error('S3 не настроен');
        }

        // Создаём подпись AWS Signature V4
        const uploadUrl = this.getUploadUrl(endpoint, bucket, path);
        
        // Для простой загрузки используем FormData
        const formData = new FormData();
        formData.append('file', file);

        // Простой вариант - через proxy или прямой POST
        // Для продакшена нужна правильная сигнатура
        const response = await fetch(uploadUrl, {
            method: 'PUT',
            body: file
        });

        if (!response.ok) {
            throw new Error(`Upload failed: ${response.statusText}`);
        }

        const fileUrl = `${endpoint}/${bucket}/${path}`;
        return { url: fileUrl, path: path };
    },

    /**
     * Загрузка медиа для бота
     */
    async uploadMedia(botId, file) {
        const timestamp = Date.now();
        const ext = file.name.split('.').pop();
        const filename = `${timestamp}.${ext}`;
        const path = `bots/${botId}/media/${filename}`;
        
        try {
            const result = await this.uploadFile(file, path);
            ui.toast('Файл загружен', 'success');
            return result;
        } catch (error) {
            ui.toast(`Ошибка загрузки: ${error.message}`, 'error');
            throw error;
        }
    },

    /**
     * Получение URL файла
     */
    getFileUrl(path) {
        const { endpoint, bucket } = app.settings.s3;
        return `${endpoint}/${bucket}/${path}`;
    },

    /**
     * Удаление файла из S3
     */
    async deleteFile(path) {
        const { endpoint, accessKey, secretKey, bucket } = app.settings.s3;
        
        // Для удаления нужна правильная сигнатура
        // Упрощённая реализация
        console.log('Delete file:', path);
    },

    /**
     * Загрузка всех файлов бота
     */
    async uploadBotFiles(bot) {
        const files = exporter.exportForDeploy(bot);
        const uploaded = [];

        for (const [filename, content] of Object.entries(files)) {
            const blob = new Blob([content], { type: 'text/plain' });
            const file = new File([blob], filename, { type: 'text/plain' });
            
            try {
                const result = await this.uploadMedia(bot.id, file);
                uploaded.push(result);
            } catch (error) {
                console.error(`Failed to upload ${filename}:`, error);
            }
        }

        return uploaded;
    },

    /**
     * Синхронизация бота с S3
     */
    async syncBot(bot) {
        ui.toast('Синхронизация с S3...', 'info');
        
        try {
            // Экспортируем конфиг
            const configData = exporter.prepareExportData(bot);
            const configBlob = new Blob(
                [JSON.stringify(configData, null, 2)], 
                { type: 'application/json' }
            );
            const configFile = new File([configBlob], 'bot-config.json');
            
            await this.uploadFile(configFile, `bots/${bot.username}/bot-config.json`);
            
            ui.toast('Синхронизация завершена', 'success');
        } catch (error) {
            ui.toast(`Ошибка: ${error.message}`, 'error');
        }
    },

    /**
     * Генерация URL для загрузки (упрощённо)
     */
    getUploadUrl(endpoint, bucket, key) {
        // Для реальной реализации нужна AWS Signature V4
        // Это упрощённая версия
        return `${endpoint}/${bucket}/${key}`;
    },

    /**
     * Проверка подключения к S3
     */
    async testConnection() {
        try {
            const { endpoint, accessKey, secretKey, bucket } = app.settings.s3;
            
            // Простая проверка - список объектов
            const response = await fetch(`${endpoint}/${bucket}?list-type=2`, {
                method: 'GET',
                headers: {
                    // Здесь нужна правильная сигнатура
                }
            });
            
            return response.ok;
        } catch (error) {
            console.error('S3 connection test failed:', error);
            return false;
        }
    },

    /**
     * Загрузка файла с input element
     */
    async handleFileInput(inputElement, botId) {
        const files = inputElement.files;
        if (!files.length) return [];

        const uploaded = [];
        for (const file of files) {
            try {
                const result = await this.uploadMedia(botId, file);
                uploaded.push(result);
            } catch (error) {
                console.error('Upload error:', error);
            }
        }

        return uploaded;
    },

    /**
     * Создание пресigned URL для загрузки (для AWS S3)
     * Требует серверной части для безопасности
     */
    async getPresignedUrl(key, expiresIn = 3600) {
        // Это должно выполняться на сервере
        // Возвращаем заглушку
        console.warn('Presigned URL requires server-side implementation');
        return null;
    }
};

/**
 * Утилита для AWS Signature V4 (упрощённая)
 * Для продакшена используйте серверную подпись
 */
const AWSSigner = {
    /**
     * Создание подписи для запроса
     */
    signRequest(config) {
        const { method, url, body, accessKey, secretKey, region, service } = config;
        
        // Упрощённая реализация
        // Для полной версии см. AWS документацию
        
        return {
            signedUrl: url,
            headers: {}
        };
    }
};
