/**
 * Enhanced State Management
 * 
 * Reactive state with observers, similar to React state/Redux.
 * Provides type safety and validation.
 */
class State {
    constructor(initialState = {}) {
        this._state = { ...initialState };
        this._observers = new Map();
        this._history = [];
        this._maxHistorySize = 50;
    }

    /**
     * Get state value
     * @param {string} key - State key
     * @returns {*} State value
     */
    get(key) {
        return this._state[key];
    }

    /**
     * Get entire state
     * @returns {Object} State object
     */
    getAll() {
        return { ...this._state };
    }

    /**
     * Set state value
     * @param {string} key - State key
     * @param {*} value - New value
     */
    set(key, value) {
        const oldValue = this._state[key];

        // Don't update if value hasn't changed
        if (oldValue === value) return;

        // Save to history
        this._addToHistory(key, oldValue, value);

        // Update state
        this._state[key] = value;

        // Persist to localStorage if needed
        this._persistIfNeeded(key, value);

        // Notify observers
        this._notify(key, value, oldValue);
    }

    /**
     * Update multiple state values
     * @param {Object} updates - Object with key-value pairs
     */
    update(updates) {
        Object.entries(updates).forEach(([key, value]) => {
            this.set(key, value);
        });
    }

    /**
     * Subscribe to state changes
     * @param {string} key - State key to watch
     * @param {Function} callback - Callback function
     * @returns {Function} Unsubscribe function
     */
    subscribe(key, callback) {
        if (!this._observers.has(key)) {
            this._observers.set(key, []);
        }

        this._observers.get(key).push(callback);

        // Return unsubscribe function
        return () => {
            const observers = this._observers.get(key);
            const index = observers.indexOf(callback);
            if (index > -1) {
                observers.splice(index, 1);
            }
        };
    }

    /**
     * Notify observers of state change
     * @private
     */
    _notify(key, newValue, oldValue) {
        if (this._observers.has(key)) {
            this._observers.get(key).forEach(callback => {
                try {
                    callback(newValue, oldValue);
                } catch (error) {
                    console.error(`Error in state observer for "${key}":`, error);
                }
            });
        }
    }

    /**
     * Add state change to history
     * @private
     */
    _addToHistory(key, oldValue, newValue) {
        this._history.push({
            key,
            oldValue,
            newValue,
            timestamp: Date.now()
        });

        // Limit history size
        if (this._history.length > this._maxHistorySize) {
            this._history.shift();
        }
    }

    /**
     * Persist state to localStorage if configured
     * @private
     */
    _persistIfNeeded(key, value) {
        const persistKeys = ['token', 'refreshToken', 'userId', 'userRole', 'userEmail'];

        if (persistKeys.includes(key)) {
            const storageKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
            if (value !== null && value !== undefined) {
                localStorage.setItem(storageKey, value);
            } else {
                localStorage.removeItem(storageKey);
            }
        }
    }

    /**
     * Clear all state
     */
    clear() {
        const keys = Object.keys(this._state);
        keys.forEach(key => {
            this.set(key, null);
        });
        this._history = [];
    }

    /**
     * Get state history
     * @returns {Array} History array
     */
    getHistory() {
        return [...this._history];
    }

    /**
     * Check if key exists in state
     * @param {string} key - State key
     * @returns {boolean}
     */
    has(key) {
        return key in this._state;
    }

    /**
     * Remove key from state
     * @param {string} key - State key
     */
    remove(key) {
        this.set(key, null);
        delete this._state[key];
    }
}

// Create singleton instance with initial state
export const state = new State({
    // Auth
    token: localStorage.getItem('access_token'),
    refreshToken: localStorage.getItem('refresh_token'),
    userId: localStorage.getItem('user_id'),
    userRole: localStorage.getItem('user_role'),
    userEmail: localStorage.getItem('user_email'),

    // UI
    currentPage: 'main',
    isLoading: false,

    // Token refresh
    tokenRefreshInterval: null,
});

// Export State class for testing
export { State };
