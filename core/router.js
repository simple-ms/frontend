/**
 * Router - Modern routing with History API
 * 
 * Provides client-side routing similar to React Router.
 */
import { eventBus, Events } from './eventBus.js';

class Router {
    constructor() {
        this.routes = new Map();
        this.currentRoute = null;
        this.beforeHooks = [];
        this.afterHooks = [];

        // Listen to browser navigation
        window.addEventListener('popstate', (e) => this.handleRoute(e.state));

        // Intercept link clicks
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-route]')) {
                e.preventDefault();
                const path = e.target.getAttribute('data-route');
                this.navigate(path);
            }
        });
    }

    /**
     * Register a route
     * @param {string} path - Route path
     * @param {Function|Object} handler - Route handler or component class
     * @param {Object} options - Route options
     */
    register(path, handler, options = {}) {
        this.routes.set(path, {
            handler,
            options,
            params: this._extractParams(path)
        });
    }

    /**
     * Navigate to a route
     * @param {string} path - Route path
     * @param {Object} state - State object to pass
     */
    navigate(path, state = {}) {
        // Run before hooks
        const shouldContinue = this._runBeforeHooks(path, state);
        if (!shouldContinue) return;

        // Emit before navigation event
        eventBus.emit(Events.NAV_BEFORE_CHANGE, { path, state });

        // Update browser history
        window.history.pushState(state, '', path);

        // Handle the route
        this.handleRoute(state);

        // Run after hooks
        this._runAfterHooks(path, state);

        // Emit navigation event
        eventBus.emit(Events.NAV_CHANGE, { path, state });
    }

    /**
     * Replace current route
     * @param {string} path - Route path
     * @param {Object} state - State object
     */
    replace(path, state = {}) {
        window.history.replaceState(state, '', path);
        this.handleRoute(state);
    }

    /**
     * Go back in history
     */
    back() {
        window.history.back();
    }

    /**
     * Go forward in history
     */
    forward() {
        window.history.forward();
    }

    /**
     * Handle route change
     * @param {Object} state - Route state
     */
    handleRoute(state = {}) {
        const path = window.location.pathname;
        const route = this._matchRoute(path);

        if (!route) {
            console.error(`No route found for path: ${path}`);
            this.navigate('/404');
            return;
        }

        // Unmount current route
        if (this.currentRoute && typeof this.currentRoute.unmount === 'function') {
            this.currentRoute.unmount();
        }

        // Mount new route
        const { handler, params } = route;

        if (typeof handler === 'function') {
            // If handler is a class, instantiate it
            if (handler.prototype && handler.prototype.mount) {
                this.currentRoute = new handler();
                this.currentRoute.mount();
            } else {
                // If handler is a function, call it
                handler(params, state);
            }
        }
    }

    /**
     * Match route path
     * @private
     */
    _matchRoute(path) {
        for (const [routePath, routeData] of this.routes) {
            const params = this._matchPath(routePath, path);
            if (params !== null) {
                return { ...routeData, params };
            }
        }
        return null;
    }

    /**
     * Match path with route pattern
     * @private
     */
    _matchPath(pattern, path) {
        const patternParts = pattern.split('/').filter(Boolean);
        const pathParts = path.split('/').filter(Boolean);

        if (patternParts.length !== pathParts.length) {
            return null;
        }

        const params = {};

        for (let i = 0; i < patternParts.length; i++) {
            const patternPart = patternParts[i];
            const pathPart = pathParts[i];

            if (patternPart.startsWith(':')) {
                // Dynamic segment
                const paramName = patternPart.slice(1);
                params[paramName] = pathPart;
            } else if (patternPart !== pathPart) {
                // Segments don't match
                return null;
            }
        }

        return params;
    }

    /**
     * Extract parameter names from route pattern
     * @private
     */
    _extractParams(pattern) {
        const params = [];
        const parts = pattern.split('/').filter(Boolean);

        parts.forEach(part => {
            if (part.startsWith(':')) {
                params.push(part.slice(1));
            }
        });

        return params;
    }

    /**
     * Add before navigation hook
     * @param {Function} hook - Hook function
     */
    beforeEach(hook) {
        this.beforeHooks.push(hook);
    }

    /**
     * Add after navigation hook
     * @param {Function} hook - Hook function
     */
    afterEach(hook) {
        this.afterHooks.push(hook);
    }

    /**
     * Run before hooks
     * @private
     */
    _runBeforeHooks(path, state) {
        for (const hook of this.beforeHooks) {
            const result = hook(path, state);
            if (result === false) {
                return false;
            }
        }
        return true;
    }

    /**
     * Run after hooks
     * @private
     */
    _runAfterHooks(path, state) {
        this.afterHooks.forEach(hook => hook(path, state));
    }

    /**
     * Get current path
     * @returns {string}
     */
    getCurrentPath() {
        return window.location.pathname;
    }

    /**
     * Get query parameters
     * @returns {Object}
     */
    getQueryParams() {
        const params = {};
        const searchParams = new URLSearchParams(window.location.search);

        for (const [key, value] of searchParams) {
            params[key] = value;
        }

        return params;
    }
}

// Create singleton instance
export const router = new Router();
