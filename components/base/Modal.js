/**
 * Modal Component
 * 
 * Reusable modal dialog component.
 */
import { Component } from './Component.js';
import { createElement } from '../../utils/dom.js';

export class Modal extends Component {
    constructor(options = {}) {
        // Create modal container if it doesn't exist
        let container = document.getElementById('modal-root');
        if (!container) {
            container = createElement('div', { id: 'modal-root' });
            document.body.appendChild(container);
        }

        super(container);

        this.state = {
            isOpen: false,
            title: options.title || '',
            content: options.content || '',
            showClose: options.showClose !== false,
            closeOnOverlay: options.closeOnOverlay !== false,
            size: options.size || 'medium', // small, medium, large
            ...options
        };

        this.onConfirm = options.onConfirm || null;
        this.onCancel = options.onCancel || null;
    }

    render() {
        if (!this.state.isOpen) {
            this.container.innerHTML = '';
            return;
        }

        const sizeClass = `modal-${this.state.size}`;

        this.container.innerHTML = `
            <div class="modal-overlay" data-modal-overlay>
                <div class="modal-dialog ${sizeClass}" data-modal-dialog role="dialog" aria-modal="true" aria-labelledby="modal-title">
                    ${this.state.showClose ? '<button class="modal-close" data-modal-close aria-label="Close">&times;</button>' : ''}
                    
                    ${this.state.title ? `
                        <div class="modal-header">
                            <h2 class="modal-title" id="modal-title">${this.state.title}</h2>
                        </div>
                    ` : ''}
                    
                    <div class="modal-body">
                        ${this.state.content}
                    </div>
                    
                    ${this.state.showFooter !== false ? `
                        <div class="modal-footer">
                            ${this.state.showCancel !== false ? `
                                <button class="btn btn-secondary" data-modal-cancel>
                                    ${this.state.cancelText || 'Cancel'}
                                </button>
                            ` : ''}
                            ${this.state.showConfirm !== false ? `
                                <button class="btn btn-primary" data-modal-confirm>
                                    ${this.state.confirmText || 'Confirm'}
                                </button>
                            ` : ''}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;

        // Prevent body scroll
        document.body.style.overflow = 'hidden';
    }

    attachEventListeners() {
        // Close button
        const closeBtn = this.$('[data-modal-close]');
        if (closeBtn) {
            this.addEventListener(closeBtn, 'click', () => this.close());
        }

        // Overlay click
        if (this.state.closeOnOverlay) {
            const overlay = this.$('[data-modal-overlay]');
            if (overlay) {
                this.addEventListener(overlay, 'click', (e) => {
                    if (e.target === overlay) {
                        this.close();
                    }
                });
            }
        }

        // Cancel button
        const cancelBtn = this.$('[data-modal-cancel]');
        if (cancelBtn) {
            this.addEventListener(cancelBtn, 'click', () => {
                if (this.onCancel) {
                    this.onCancel();
                }
                this.close();
            });
        }

        // Confirm button
        const confirmBtn = this.$('[data-modal-confirm]');
        if (confirmBtn) {
            this.addEventListener(confirmBtn, 'click', () => {
                if (this.onConfirm) {
                    this.onConfirm();
                }
                this.close();
            });
        }

        // ESC key
        this.addEventListener(document, 'keydown', (e) => {
            if (e.key === 'Escape') {
                this.close();
            }
        });
    }

    /**
     * Open modal
     * @param {Object} options - Modal options
     */
    open(options = {}) {
        this.setState({
            isOpen: true,
            ...options
        });
        this.mount();
    }

    /**
     * Close modal
     */
    close() {
        this.setState({ isOpen: false });
        document.body.style.overflow = '';
        this.unmount();
    }

    /**
     * Update modal content
     * @param {string} content - New content
     */
    setContent(content) {
        this.setState({ content });
    }

    /**
     * Update modal title
     * @param {string} title - New title
     */
    setTitle(title) {
        this.setState({ title });
    }

    /**
     * Show loading state
     */
    showLoading() {
        this.setContent('<div class="loading-spinner"></div>');
    }

    /**
     * Static method to create and show modal
     */
    static show(options) {
        const modal = new Modal(options);
        modal.open();
        return modal;
    }

    /**
     * Static method for confirmation dialog
     */
    static confirm(message, options = {}) {
        return new Promise((resolve) => {
            const modal = new Modal({
                title: options.title || 'Confirm',
                content: message,
                confirmText: options.confirmText || 'Confirm',
                cancelText: options.cancelText || 'Cancel',
                onConfirm: () => resolve(true),
                onCancel: () => resolve(false),
                ...options
            });
            modal.open();
        });
    }

    /**
     * Static method for alert dialog
     */
    static alert(message, options = {}) {
        return new Promise((resolve) => {
            const modal = new Modal({
                title: options.title || 'Alert',
                content: message,
                showCancel: false,
                confirmText: options.confirmText || 'OK',
                onConfirm: () => resolve(true),
                ...options
            });
            modal.open();
        });
    }
}
