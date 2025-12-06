// Enhanced Toast Notification System

class ToastManager {
    constructor() {
        this.toastContainer = null;
        this.queue = [];
        this.currentToast = null;
        this.init();
    }

    init() {
        // Create toast container if it doesn't exist
        if (!document.getElementById('toast-container')) {
            this.toastContainer = document.createElement('div');
            this.toastContainer.id = 'toast-container';
            this.toastContainer.className = 'toast-container';
            this.toastContainer.setAttribute('aria-live', 'polite');
            this.toastContainer.setAttribute('aria-atomic', 'true');
            document.body.appendChild(this.toastContainer);
        } else {
            this.toastContainer = document.getElementById('toast-container');
        }
    }

    show(message, type = 'info', duration = 3000) {
        const toast = {
            message,
            type,
            duration,
            id: Date.now() + Math.random()
        };

        this.queue.push(toast);

        if (!this.currentToast) {
            this.showNext();
        }
    }

    showNext() {
        if (this.queue.length === 0) {
            this.currentToast = null;
            return;
        }

        const toast = this.queue.shift();
        this.currentToast = toast;

        const toastElement = this.createToastElement(toast);
        this.toastContainer.appendChild(toastElement);

        // Trigger animation
        requestAnimationFrame(() => {
            toastElement.classList.add('show');
        });

        // Auto-dismiss
        setTimeout(() => {
            this.dismiss(toastElement);
        }, toast.duration);
    }

    createToastElement(toast) {
        const element = document.createElement('div');
        element.className = `toast toast-${toast.type}`;
        element.setAttribute('role', 'alert');
        element.dataset.toastId = toast.id;

        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };

        element.innerHTML = `
            <span class="toast-icon" aria-hidden="true">${icons[toast.type] || icons.info}</span>
            <span class="toast-message">${this.escapeHtml(toast.message)}</span>
            <button class="toast-close" aria-label="Close notification">×</button>
        `;

        // Close button handler
        element.querySelector('.toast-close').addEventListener('click', () => {
            this.dismiss(element);
        });

        return element;
    }

    dismiss(toastElement) {
        toastElement.classList.remove('show');

        setTimeout(() => {
            if (toastElement.parentNode) {
                toastElement.parentNode.removeChild(toastElement);
            }
            this.showNext();
        }, 300);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    success(message, duration) {
        this.show(message, 'success', duration);
    }

    error(message, duration) {
        this.show(message, 'error', duration);
    }

    warning(message, duration) {
        this.show(message, 'warning', duration);
    }

    info(message, duration) {
        this.show(message, 'info', duration);
    }
}

// Global instance
const toastManager = new ToastManager();

export function showToast(message, type = 'info', duration = 3000) {
    toastManager.show(message, type, duration);
}

export { toastManager, ToastManager };
