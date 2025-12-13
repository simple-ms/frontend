/**
 * Enhanced API Client with Interceptors
 * 
 * Modern HTTP client with request/response interceptors, retry logic, and caching.
 */
import { state } from '../core/state.js';
import { eventBus, Events } from '../core/eventBus.js';
import { env } from '../core/env.js';
import { logger } from '../utils/logger.js';

class ApiClient {
    constructor(baseURL = env.API_BASE_URL) {
        this.baseURL = baseURL;
        this.requestInterceptors = [];
        this.responseInterceptors = [];
        this.cache = new Map();
        this.pendingRequests = new Map();
        this.activeRequests = new Map(); // For request cancellation

        // Default config
        this.config = {
            timeout: 30000,
            retries: 3,
            retryDelay: 1000,
            cacheEnabled: true,
            cacheTTL: 300000, // 5 minutes
        };
    }

    /**
     * Add request interceptor
     * @param {Function} onFulfilled - Success handler
     * @param {Function} onRejected - Error handler
     */
    addRequestInterceptor(onFulfilled, onRejected) {
        this.requestInterceptors.push({ onFulfilled, onRejected });
    }

    /**
     * Add response interceptor
     * @param {Function} onFulfilled - Success handler
     * @param {Function} onRejected - Error handler
     */
    addResponseInterceptor(onFulfilled, onRejected) {
        this.responseInterceptors.push({ onFulfilled, onRejected });
    }

    /**
     * Execute request interceptors
     * @private
     */
    async _executeRequestInterceptors(config) {
        let currentConfig = config;

        for (const interceptor of this.requestInterceptors) {
            try {
                if (interceptor.onFulfilled) {
                    currentConfig = await interceptor.onFulfilled(currentConfig);
                }
            } catch (error) {
                if (interceptor.onRejected) {
                    return interceptor.onRejected(error);
                }
                throw error;
            }
        }

        return currentConfig;
    }

    /**
     * Execute response interceptors
     * @private
     */
    async _executeResponseInterceptors(response) {
        let currentResponse = response;

        for (const interceptor of this.responseInterceptors) {
            try {
                if (interceptor.onFulfilled) {
                    currentResponse = await interceptor.onFulfilled(currentResponse);
                }
            } catch (error) {
                if (interceptor.onRejected) {
                    return interceptor.onRejected(error);
                }
                throw error;
            }
        }

        return currentResponse;
    }

    /**
     * Make HTTP request
     * @param {string} url - Request URL
     * @param {Object} options - Request options
     * @returns {Promise<any>}
     */
    async request(url, options = {}) {
        const fullURL = url.startsWith('http') ? url : `${this.baseURL}${url}`;

        // Build request config
        let config = {
            url: fullURL,
            method: options.method || 'GET',
            headers: options.headers || {},
            body: options.body,
            timeout: options.timeout || this.config.timeout,
            cache: options.cache !== undefined ? options.cache : this.config.cacheEnabled,
            ...options
        };

        // Execute request interceptors
        config = await this._executeRequestInterceptors(config);

        // Check cache for GET requests
        if (config.method === 'GET' && config.cache) {
            const cached = this._getFromCache(config.url);
            if (cached) {
                logger.info(`[API] Cache hit: ${config.url}`);
                return cached;
            }
        }

        // Check for pending duplicate requests
        const requestKey = `${config.method}:${config.url}`;
        if (this.pendingRequests.has(requestKey)) {
            logger.info(`[API] Deduplicating request: ${config.url}`);
            return this.pendingRequests.get(requestKey);
        }

        // Make request with retry logic
        const requestPromise = this._makeRequestWithRetry(config);
        this.pendingRequests.set(requestKey, requestPromise);

        try {
            let response = await requestPromise;

            // Execute response interceptors
            response = await this._executeResponseInterceptors(response);

            // Cache successful GET requests
            if (config.method === 'GET' && config.cache && response) {
                this._addToCache(config.url, response);
            }

            return response;
        } finally {
            this.pendingRequests.delete(requestKey);
        }
    }

    /**
     * Make request with retry logic
     * @private
     */
    async _makeRequestWithRetry(config, attempt = 1) {
        try {
            return await this._makeRequest(config);
        } catch (error) {
            const shouldRetry = this._shouldRetry(error, attempt);

            if (shouldRetry && attempt < this.config.retries) {
                const delay = this.config.retryDelay * attempt;
                logger.warn(`[API] Retrying request (${attempt}/${this.config.retries}) after ${delay}ms`);

                await this._sleep(delay);
                return this._makeRequestWithRetry(config, attempt + 1);
            }

            throw error;
        }
    }

    /**
     * Make actual HTTP request
     * @private
     */
    async _makeRequest(config) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), config.timeout);

        try {
            const fetchOptions = {
                method: config.method,
                headers: config.headers,
                signal: controller.signal,
            };

            if (config.body) {
                if (config.body instanceof FormData) {
                    fetchOptions.body = config.body;
                } else {
                    fetchOptions.headers['Content-Type'] = 'application/json';
                    fetchOptions.body = JSON.stringify(config.body);
                }
            }

            logger.info(`[API] ${config.method} ${config.url}`);
            eventBus.emit(Events.LOADING_START, { url: config.url });

            const response = await fetch(config.url, fetchOptions);

            clearTimeout(timeoutId);

            // Handle HTTP errors
            if (!response.ok) {
                const error = await this._handleErrorResponse(response);
                throw error;
            }

            // Parse response
            const contentType = response.headers.get('content-type');
            let data;

            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                data = await response.text();
            }

            logger.info(`[API] Success: ${config.url}`);
            eventBus.emit(Events.LOADING_END, { url: config.url });

            return data;
        } catch (error) {
            clearTimeout(timeoutId);
            eventBus.emit(Events.LOADING_END, { url: config.url });

            if (error.name === 'AbortError') {
                const timeoutError = new Error('Request timeout');
                timeoutError.code = 'TIMEOUT';
                throw timeoutError;
            }

            throw error;
        }
    }

    /**
     * Handle error response
     * @private
     */
    async _handleErrorResponse(response) {
        let errorData;

        try {
            errorData = await response.json();
        } catch {
            errorData = { message: response.statusText };
        }

        const error = new Error(errorData.message || 'Request failed');
        error.status = response.status;
        error.data = errorData;

        // Emit error event
        eventBus.emit(Events.API_ERROR, { error, response });

        return error;
    }

    /**
     * Check if request should be retried
     * @private
     */
    _shouldRetry(error, attempt) {
        // Don't retry client errors (4xx)
        if (error.status >= 400 && error.status < 500) {
            return false;
        }

        // Retry server errors (5xx) and network errors
        return error.status >= 500 || error.code === 'TIMEOUT' || !error.status;
    }

    /**
     * Sleep utility
     * @private
     */
    _sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Get from cache
     * @private
     */
    _getFromCache(url) {
        const cached = this.cache.get(url);

        if (!cached) return null;

        const isExpired = Date.now() - cached.timestamp > this.config.cacheTTL;

        if (isExpired) {
            this.cache.delete(url);
            return null;
        }

        return cached.data;
    }

    /**
     * Add to cache
     * @private
     */
    _addToCache(url, data) {
        this.cache.set(url, {
            data,
            timestamp: Date.now()
        });
    }

    /**
     * Clear cache
     * @param {string} pattern - URL pattern to clear (optional)
     */
    clearCache(pattern) {
        if (!pattern) {
            this.cache.clear();
            return;
        }

        const regex = new RegExp(pattern);
        for (const [url] of this.cache) {
            if (regex.test(url)) {
                this.cache.delete(url);
            }
        }
    }

    // Convenience methods
    get(url, options = {}) {
        return this.request(url, { ...options, method: 'GET' });
    }

    post(url, data, options = {}) {
        return this.request(url, { ...options, method: 'POST', body: data });
    }

    put(url, data, options = {}) {
        return this.request(url, { ...options, method: 'PUT', body: data });
    }

    patch(url, data, options = {}) {
        return this.request(url, { ...options, method: 'PATCH', body: data });
    }

    delete(url, options = {}) {
        return this.request(url, { ...options, method: 'DELETE' });
    }

    /**
     * Cancel a specific request
     * @param {string} requestId - Request ID
     */
    cancel(requestId) {
        const controller = this.activeRequests.get(requestId);
        if (controller) {
            controller.abort();
            this.activeRequests.delete(requestId);
            logger.info(`[API] Request cancelled: ${requestId}`);
        }
    }

    /**
     * Cancel all active requests
     */
    cancelAll() {
        this.activeRequests.forEach((controller, requestId) => {
            controller.abort();
            logger.info(`[API] Request cancelled: ${requestId}`);
        });
        this.activeRequests.clear();
    }
}

// Create singleton instance
export const apiClient = new ApiClient();

// Add default request interceptor for auth token and CSRF
import { getCSRFToken } from '../utils/security.js';

apiClient.addRequestInterceptor(
    (config) => {
        // Add auth token
        const token = state.get('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }

        // Add CSRF token for state-changing requests
        if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(config.method)) {
            config.headers['X-CSRF-Token'] = getCSRFToken();
        }

        return config;
    },
    (error) => Promise.reject(error)
);

// Add default response interceptor for token refresh
apiClient.addResponseInterceptor(
    (response) => response,
    async (error) => {
        if (error.status === 401) {
            // Token expired, try to refresh
            eventBus.emit(Events.AUTH_TOKEN_REFRESH);
        }
        return Promise.reject(error);
    }
);
