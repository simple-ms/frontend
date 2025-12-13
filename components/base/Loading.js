/**
 * Loading Component
 * 
 * Global loading indicator component.
 */
import { Component } from './Component.js';
import { createElement } from '../../utils/dom.js';
import { eventBus, Events } from '../../core/eventBus.js';

export class Loading extends Component {
    constructor() {
        // Create loading container if it doesn't exist
        let container = document.getElementById('loading-container');
        if (!container) {
            container = createElement('div', {
                id: 'loading-container',
                className: 'loading-container'
            });
            document.body.appendChild(container);
        }

        super(container);

        this.state = {
            isLoading: false,
            message: 'Loading...',
            activeRequests: 0
        };
    }

    render() {
        if (!this.state.isLoading) {
            this.container.innerHTML = '';
            this.container.classList.remove('active');
            return;
        }

        this.container.classList.add('active');
        this.container.innerHTML = `
            <div class="loading-overlay">
                <div class="loading-spinner-wrapper">
                    <div class="loading-spinner"></div>
                    <p class="loading-message">${this.state.message}</p>
                </div>
            </div>
        `;
    }

    /**
     * Show loading indicator
     * @param {string} message - Loading message
     */
    show(message = 'Loading...') {
        this.setState({
            isLoading: true,
            message,
            activeRequests: this.state.activeRequests + 1
        });
        this.mount();
    }

    /**
     * Hide loading indicator
     */
    hide() {
        const newCount = Math.max(0, this.state.activeRequests - 1);

        this.setState({
            isLoading: newCount > 0,
            activeRequests: newCount
        });

        if (newCount === 0) {
            this.unmount();
        }
    }

    /**
     * Force hide (clear all pending requests)
     */
    forceHide() {
        this.setState({
            isLoading: false,
            activeRequests: 0
        });
        this.unmount();
    }

    /**
     * Update loading message
     * @param {string} message - New message
     */
    setMessage(message) {
        this.setState({ message });
    }
}

// Create singleton instance
export const loading = new Loading();

// Listen for loading events
eventBus.on(Events.LOADING_START, ({ message }) => {
    loading.show(message);
});

eventBus.on(Events.LOADING_END, () => {
    loading.hide();
});
