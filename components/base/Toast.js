/**
 * Toast Component
 * 
 * Notification toast component.
 */
import { Component } from './Component.js';
import { createElement } from '../../utils/dom.js';
import { eventBus, Events } from '../../core/eventBus.js';

export class Toast extends Component {
    constructor() {
        // Create toast container if it doesn't exist
        let container = document.getElementById('toast-container');
        if (!container) {
            container = createElement('div', {
                id: 'toast-container',
                className: 'toast-container'
            });
            document.body.appendChild(container);
        }

        super(container);

        this.toasts = [];
        this.maxToasts = 5;
        this.defaultDuration = 3000;
    }

    render() {
        this.container.innerHTML = this.toasts.map((toast, index) => `
            <div class="toast toast-${toast.type}" data-toast-id="${toast.id}" role="alert" aria-live="polite">
                <div class="toast-icon">
                    ${this._getIcon(toast.type)}
                </div>
                <div class="toast-content">
                    ${toast.title ? `<div class="toast-title">${toast.title}</div>` : ''}
                    <div class="toast-message">${toast.message}</div>
                </div>
                <button class="toast-close" data-toast-close="${toast.id}" aria-label="Close">
                    &times;
                </button>
            </div>
        `).join('');
    }

    attachEventListeners() {
        // Close buttons
        this.$$('[data-toast-close]').forEach(btn => {
            const toastId = btn.getAttribute('data-toast-close');
            this.addEventListener(btn, 'click', () => this.remove(toastId));
        });
    }

    /**
     * Show toast
     * @param {string} message - Toast message
     * @param {Object} options - Toast options
     */
    show(message, options = {}) {
        const toast = {
            id: Date.now().toString(),
            message,
            type: options.type || 'info',
            title: options.title,
            duration: options.duration !== undefined ? options.duration : this.defaultDuration
        };

        this.toasts.push(toast);

        // Limit number of toasts
        if (this.toasts.length > this.maxToasts) {
            this.toasts.shift();
        }

        // Update view
        if (!this.isMounted()) {
            this.mount();
        } else {
            this.removeEventListeners();
            this.render();
            this.attachEventListeners();
        }

        // Auto remove after duration
        if (toast.duration > 0) {
            setTimeout(() => this.remove(toast.id), toast.duration);
        }

        return toast.id;
    }

    /**
     * Remove toast
     * @param {string} id - Toast ID
     */
    remove(id) {
        this.toasts = this.toasts.filter(t => t.id !== id);

        if (this.toasts.length === 0) {
            this.unmount();
        } else {
            this.removeEventListeners();
            this.render();
            this.attachEventListeners();
        }
    }

    /**
     * Clear all toasts
     */
    clear() {
        this.toasts = [];
        this.unmount();
    }

    /**
     * Get icon for toast type
     * @private
     */
    _getIcon(type) {
        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };
        return icons[type] || icons.info;
    }

    // Convenience methods
    success(message, options = {}) {
        return this.show(message, { ...options, type: 'success' });
    }

    error(message, options = {}) {
        return this.show(message, { ...options, type: 'error' });
    }

    warning(message, options = {}) {
        return this.show(message, { ...options, type: 'warning' });
    }

    info(message, options = {}) {
        return this.show(message, { ...options, type: 'info' });
    }
}

// Create singleton instance
export const toast = new Toast();

// Listen for toast events
eventBus.on(Events.TOAST_SHOW, ({ message, type, title, duration }) => {
    toast.show(message, { type, title, duration });
});
