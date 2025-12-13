/**
 * Base Component Class
 * 
 * Provides lifecycle methods and state management for all components.
 * Similar to React.Component to ease future migration.
 */
export class Component {
    /**
     * @param {HTMLElement|string} container - Container element or selector
     */
    constructor(container) {
        this.container = typeof container === 'string'
            ? document.querySelector(container)
            : container;

        if (!this.container) {
            throw new Error(`Container not found: ${container}`);
        }

        this.state = {};
        this.props = {};
        this._eventListeners = [];
        this._isMounted = false;
        this._shouldReattachListeners = true; // Control listener re-attachment
    }

    /**
     * Set component state and trigger re-render
     * @param {Object} newState - State updates
     * @param {Object} options - Render options
     */
    setState(newState, options = {}) {
        const prevState = { ...this.state };
        this.state = { ...this.state, ...newState };

        if (this._isMounted) {
            this.onStateChange(this.state, prevState);

            // Only re-attach listeners if needed (default: true for safety)
            const shouldReattach = options.reattachListeners !== false && this._shouldReattachListeners;

            if (shouldReattach) {
                // Remove old listeners before re-render
                this.removeEventListeners();
            }

            // Re-render
            this.render();

            if (shouldReattach) {
                // Re-attach listeners after render
                this.attachEventListeners();
            }
        }
    }

    /**
     * Update component props
     * @param {Object} newProps - New props
     * @param {Object} options - Render options
     */
    setProps(newProps, options = {}) {
        const prevProps = { ...this.props };
        this.props = { ...this.props, ...newProps };

        if (this._isMounted) {
            this.onPropsChange(this.props, prevProps);

            const shouldReattach = options.reattachListeners !== false && this._shouldReattachListeners;

            if (shouldReattach) {
                this.removeEventListeners();
            }

            this.render();

            if (shouldReattach) {
                this.attachEventListeners();
            }
        }
    }

    /**
     * Lifecycle: Called when state changes
     * @param {Object} newState - New state
     * @param {Object} prevState - Previous state
     */
    onStateChange(newState, prevState) {
        // Override in subclasses
    }

    /**
     * Lifecycle: Called when props change
     * @param {Object} newProps - New props
     * @param {Object} prevProps - Previous props
     */
    onPropsChange(newProps, prevProps) {
        // Override in subclasses
    }

    /**
     * Lifecycle: Called before component mounts
     */
    beforeMount() {
        // Override in subclasses
    }

    /**
     * Lifecycle: Called after component mounts
     */
    afterMount() {
        // Override in subclasses
    }

    /**
     * Lifecycle: Called before component unmounts
     */
    beforeUnmount() {
        // Override in subclasses
    }

    /**
     * Render component (must be implemented by subclasses)
     */
    render() {
        throw new Error('render() must be implemented by subclass');
    }

    /**
     * Mount component to DOM
     */
    mount() {
        if (this._isMounted) {
            return;
        }

        this.beforeMount();
        this.render();
        this.attachEventListeners();
        this._isMounted = true;
        this.afterMount();
    }

    /**
     * Unmount component from DOM
     */
    unmount() {
        if (!this._isMounted) {
            console.warn('Component not mounted');
            return;
        }

        this.beforeUnmount();
        this.removeEventListeners();
        this.container.innerHTML = '';
        this._isMounted = false;
    }

    /**
     * Attach event listeners (override in subclasses)
     */
    attachEventListeners() {
        // Override in subclasses
    }

    /**
     * Add event listener with automatic cleanup
     * @param {HTMLElement} element - Element to attach listener to
     * @param {string} event - Event name
     * @param {Function} handler - Event handler
     * @param {Object} options - Event listener options
     */
    addEventListener(element, event, handler, options = {}) {
        if (!element) {
            console.warn('[Component] Cannot add listener to null element');
            return;
        }

        element.addEventListener(event, handler, options);
        this._eventListeners.push({ element, event, handler, options });
    }

    /**
     * Remove all event listeners
     */
    removeEventListeners() {
        this._eventListeners.forEach(({ element, event, handler, options }) => {
            if (element) {
                element.removeEventListener(event, handler, options);
            }
        });
        this._eventListeners = [];
    }

    /**
     * Query element within component
     * @param {string} selector - CSS selector
     * @returns {HTMLElement|null}
     */
    $(selector) {
        return this.container.querySelector(selector);
    }

    /**
     * Query all elements within component
     * @param {string} selector - CSS selector
     * @returns {NodeList}
     */
    $$(selector) {
        return this.container.querySelectorAll(selector);
    }

    /**
     * Check if component is mounted
     * @returns {boolean}
     */
    isMounted() {
        return this._isMounted;
    }
}
