/**
 * UI утилиты и компоненты
 */

const ui = {
    /**
     * Показ toast уведомления
     */
    toast(message, type = 'info') {
        // Создаём контейнер если нет
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }

        // Создаём toast
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;

        container.appendChild(toast);

        // Удаляем через 3 секунды
        setTimeout(() => {
            toast.style.animation = 'slideIn 0.3s ease reverse';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    /**
     * Открытие модального окна
     */
    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
        }
    },

    /**
     * Закрытие модального окна
     */
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
        }
    },

    /**
     * Закрытие по клику вне контента
     */
    setupModalClose() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                }
            });
        });
    },

    /**
     * Подтверждение действия
     */
    confirm(message) {
        return new Promise((resolve) => {
            const result = window.confirm(message);
            resolve(result);
        });
    },

    /**
     * Ввод текста через prompt
     */
    prompt(message, defaultValue = '') {
        return new Promise((resolve) => {
            const result = window.prompt(message, defaultValue);
            resolve(result);
        });
    },

    /**
     * Блокировка/разблокировка кнопки
     */
    setButtonLoading(button, loading = true) {
        if (loading) {
            button.disabled = true;
            button.dataset.originalText = button.textContent;
            button.textContent = 'Загрузка...';
        } else {
            button.disabled = false;
            button.textContent = button.dataset.originalText || button.textContent;
        }
    },

    /**
     * Анимация успешного действия
     */
    animateSuccess(element) {
        element.style.transition = 'all 0.3s ease';
        element.style.transform = 'scale(1.05)';
        element.style.boxShadow = '0 0 20px rgba(40, 167, 69, 0.5)';
        
        setTimeout(() => {
            element.style.transform = 'scale(1)';
            element.style.boxShadow = '';
        }, 300);
    },

    /**
     * Анимация ошибки
     */
    animateError(element) {
        element.style.transition = 'all 0.3s ease';
        element.style.transform = 'translateX(-10px)';
        
        setTimeout(() => {
            element.style.transform = 'translateX(10px)';
            setTimeout(() => {
                element.style.transform = 'translateX(-10px)';
                setTimeout(() => {
                    element.style.transform = 'translateX(0)';
                }, 100);
            }, 100);
        }, 100);
    },

    /**
     * Копирование в буфер обмена
     */
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.toast('Скопировано в буфер обмена', 'success');
            return true;
        } catch (error) {
            console.error('Copy failed:', error);
            this.toast('Ошибка копирования', 'error');
            return false;
        }
    },

    /**
     * Форматирование даты
     */
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    /**
     * Форматирование относительного времени
     */
    formatRelativeTime(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days} дн. назад`;
        if (hours > 0) return `${hours} ч. назад`;
        if (minutes > 0) return `${minutes} мин. назад`;
        return 'Только что';
    },

    /**
     * Предпросмотр бота в телефоне
     */
    showBotPreview(bot) {
        const modal = document.getElementById('previewModal');
        const content = document.getElementById('previewContent');
        
        if (!modal || !content) return;

        content.innerHTML = `
            <div class="phone-preview">
                <div class="phone-header">
                    <div class="phone-avatar">🤖</div>
                    <div class="phone-info">
                        <h4>${this.escapeHtml(bot.name)}</h4>
                        <p>bot</p>
                    </div>
                </div>
                <div class="phone-messages" id="phoneMessages">
                    <div class="phone-message bot">
                        Добро пожаловать! Чем я могу помочь?
                    </div>
                </div>
                <div class="phone-keyboard" id="phoneKeyboard">
                    ${this.renderPreviewKeyboard(bot)}
                </div>
            </div>
        `;

        this.openModal('previewModal');
    },

    /**
     * Рендер клавиатуры для предпросмотра
     */
    renderPreviewKeyboard(bot) {
        const startScene = bot.scenes.find(s => s.trigger === '/start');
        if (!startScene) return '';

        const buttons = startScene.blocks
            .filter(b => b.type === 'keyboard')
            .flatMap(b => b.buttons || []);

        if (buttons.length === 0) return '';

        return buttons.map(btn => `
            <button onclick="ui.handlePreviewClick('${btn.callback || btn.action}')">
                ${this.escapeHtml(btn.text)}
            </button>
        `).join('');
    },

    /**
     * Обработка клика по кнопке в предпросмотре
     */
    handlePreviewClick(action) {
        console.log('Preview action:', action);
        // Логика для предпросмотра
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
     * Инициализация UI
     */
    init() {
        this.setupModalClose();
        
        // Закрытие модальных окон по ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                document.querySelectorAll('.modal.active').forEach(modal => {
                    modal.classList.remove('active');
                });
            }
        });
    }
};

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', () => {
    ui.init();
});
