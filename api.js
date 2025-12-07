// ===========================================
// Enhanced API Module
// ===========================================

import { API_BASE, state } from './config.js';
import { logger } from './logger.js';

// ===========================================
// Constants
// ===========================================

const DEFAULT_TIMEOUT = 30000; // 30 seconds
const MAX_RETRIES = 2;
const RETRY_DELAY = 1000; // 1 second

// ===========================================
// Helper Functions
// ===========================================

/**
 * Sleep for specified milliseconds
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check if error is retryable
 */
function isRetryableError(error) {
    // Retry on network errors or 5xx server errors
    return (
        error.name === 'TypeError' || // Network error
        (error.status >= 500 && error.status < 600) // Server error
    );
}

/**
 * Parse error response
 */
function parseErrorMessage(data) {
    // Extract error message from various formats
    if (typeof data.detail === 'string') {
        return data.detail;
    }
    if (data.detail?.message) {
        return data.detail.message;
    }
    if (Array.isArray(data.detail)) {
        return data.detail.map(e => e.msg || e.message).join(', ');
    }
    if (data.message) {
        return data.message;
    }
    if (data.error) {
        return data.error;
    }
    return 'Request failed';
}

// ===========================================
// Main API Function
// ===========================================

/**
 * Make an API call with automatic retry and error handling
 * 
 * @param {string} endpoint - API endpoint (e.g., '/auth/login')
 * @param {Object} options - Fetch options
 * @param {number} retryCount - Current retry attempt (internal)
 * @returns {Promise<Object>} Response data
 */
async function apiCall(endpoint, options = {}, retryCount = 0) {
    const {
        timeout = DEFAULT_TIMEOUT,
        skipAuth = false,
        skipRetry = false,
        ...fetchOptions
    } = options;

    // Build headers
    const headers = {
        'Content-Type': 'application/json',
        ...fetchOptions.headers
    };

    // Add authorization header if not skipped
    if (state.token && !skipAuth) {
        headers['Authorization'] = `Bearer ${state.token}`;
    }

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
        logger.info(`API Call: ${fetchOptions.method || 'GET'} ${endpoint}`);

        const response = await fetch(`${API_BASE}${endpoint}`, {
            ...fetchOptions,
            headers,
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        // Handle empty responses (204 No Content)
        if (response.status === 204) {
            return {};
        }

        // Parse response
        const contentType = response.headers.get('content-type');
        let data;

        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            const text = await response.text();
            if (!response.ok) {
                throw new Error(text || 'Server returned an invalid response');
            }
            return { message: text };
        }

        // Handle error responses
        if (!response.ok) {
            const errorMessage = parseErrorMessage(data);
            const error = new Error(errorMessage);
            error.status = response.status;
            error.data = data;

            // Check if we should retry
            if (!skipRetry && isRetryableError(error) && retryCount < MAX_RETRIES) {
                logger.warn(`Request failed, retrying (${retryCount + 1}/${MAX_RETRIES})...`);
                await sleep(RETRY_DELAY * (retryCount + 1)); // Exponential backoff
                return apiCall(endpoint, options, retryCount + 1);
            }

            throw error;
        }

        logger.info(`API Success: ${endpoint}`);
        return data;

    } catch (error) {
        clearTimeout(timeoutId);

        // Handle timeout
        if (error.name === 'AbortError') {
            logger.error(`Request timeout: ${endpoint}`);
            throw new Error('Request timed out. Please try again.');
        }

        // Handle network errors
        if (error.name === 'TypeError') {
            logger.error(`Network error: ${endpoint}`, error);

            // Retry on network errors
            if (!skipRetry && retryCount < MAX_RETRIES) {
                logger.warn(`Network error, retrying (${retryCount + 1}/${MAX_RETRIES})...`);
                await sleep(RETRY_DELAY * (retryCount + 1));
                return apiCall(endpoint, options, retryCount + 1);
            }

            throw new Error('Unable to connect to server. Please check your internet connection.');
        }

        // Re-throw other errors
        throw error;
    }
}

// ===========================================
// Convenience Methods
// ===========================================

/**
 * GET request
 */
async function get(endpoint, options = {}) {
    return apiCall(endpoint, { ...options, method: 'GET' });
}

/**
 * POST request
 */
async function post(endpoint, body, options = {}) {
    return apiCall(endpoint, {
        ...options,
        method: 'POST',
        body: JSON.stringify(body)
    });
}

/**
 * PUT request
 */
async function put(endpoint, body, options = {}) {
    return apiCall(endpoint, {
        ...options,
        method: 'PUT',
        body: JSON.stringify(body)
    });
}

/**
 * PATCH request
 */
async function patch(endpoint, body, options = {}) {
    return apiCall(endpoint, {
        ...options,
        method: 'PATCH',
        body: JSON.stringify(body)
    });
}

/**
 * DELETE request
 */
async function del(endpoint, options = {}) {
    return apiCall(endpoint, { ...options, method: 'DELETE' });
}

// ===========================================
// Exports
// ===========================================

export {
    apiCall,
    get,
    post,
    put,
    patch,
    del
};
