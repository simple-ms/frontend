/**
 * EventBus - Publish/Subscribe pattern for decoupled communication
 * 
 * Allows components to communicate without direct dependencies.
 * Similar to Redux/Context pattern in React.
 */
class EventBus {
    constructor() {
        this.events = new Map();
    }

    /**
     * Subscribe to an event
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     * @returns {Function} Unsubscribe function
     */
    on(event, callback) {
        if (!this.events.has(event)) {
            this.events.set(event, []);
        }

        this.events.get(event).push(callback);

        // Return unsubscribe function
        return () => this.off(event, callback);
    }

    /**
     * Subscribe to an event once
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     */
    once(event, callback) {
        const wrapper = (...args) => {
            callback(...args);
            this.off(event, wrapper);
        };

        this.on(event, wrapper);
    }

    /**
     * Unsubscribe from an event
     * @param {string} event - Event name
     * @param {Function} callback - Callback function to remove
     */
    off(event, callback) {
        if (!this.events.has(event)) return;

        const callbacks = this.events.get(event);
        const index = callbacks.indexOf(callback);

        if (index > -1) {
            callbacks.splice(index, 1);
        }

        if (callbacks.length === 0) {
            this.events.delete(event);
        }
    }

    /**
     * Emit an event
     * @param {string} event - Event name
     * @param {*} data - Data to pass to callbacks
     */
    emit(event, data) {
        if (!this.events.has(event)) return;

        const callbacks = this.events.get(event);
        callbacks.forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`Error in event handler for "${event}":`, error);
            }
        });
    }

    /**
     * Clear all event listeners
     */
    clear() {
        this.events.clear();
    }

    /**
     * Get all registered events
     * @returns {string[]}
     */
    getEvents() {
        return Array.from(this.events.keys());
    }
}

// Create singleton instance
export const eventBus = new EventBus();

// Common events
export const Events = {
    // Auth events
    AUTH_LOGIN: 'auth:login',
    AUTH_LOGOUT: 'auth:logout',
    AUTH_REGISTER: 'auth:register',
    AUTH_REGISTER_SUCCESS: 'auth:register-success',
    AUTH_TOKEN_REFRESH: 'auth:token_refresh',

    // Navigation events
    NAV_CHANGE: 'nav:change',
    NAV_BEFORE_CHANGE: 'nav:before_change',

    // Product events
    PRODUCT_CREATED: 'product:created',
    PRODUCT_UPDATED: 'product:updated',
    PRODUCT_DELETED: 'product:deleted',

    // Order events
    ORDER_CREATED: 'order:created',
    ORDER_UPDATED: 'order:updated',
    ORDER_APPROVED: 'order:approved',
    ORDER_REJECTED: 'order:rejected',

    // UI events
    TOAST_SHOW: 'ui:toast_show',
    MODAL_OPEN: 'ui:modal_open',
    MODAL_CLOSE: 'ui:modal_close',
    LOADING_START: 'ui:loading_start',
    LOADING_END: 'ui:loading_end',

    // Error events
    ERROR: 'error',
    API_ERROR: 'error:api',
    NETWORK_ERROR: 'error:network',
};
