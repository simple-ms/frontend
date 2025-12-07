// ===========================================
// CSRF Protection Module
// ===========================================

import { logger } from './logger.js';

/**
 * CSRF (Cross-Site Request Forgery) Protection
 * 
 * Note: Currently using Bearer tokens (not cookies), so CSRF risk is minimal.
 * This module prepares for future cookie-based authentication.
 */

// ===========================================
// CSRF Token Management
// ===========================================

const CSRF_TOKEN_KEY = 'csrf_token';
const CSRF_HEADER_NAME = 'X-CSRF-Token';

/**
 * Generate a cryptographically secure random token
 * @returns {string} CSRF token
 */
function generateCsrfToken() {
    // Use crypto.randomUUID if available (modern browsers)
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }

    // Fallback: generate random string
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Get or create CSRF token
 * @returns {string} CSRF token
 */
function getCsrfToken() {
    let token = sessionStorage.getItem(CSRF_TOKEN_KEY);

    if (!token) {
        token = generateCsrfToken();
        sessionStorage.setItem(CSRF_TOKEN_KEY, token);
        logger.info('Generated new CSRF token');
    }

    return token;
}

/**
 * Refresh CSRF token (e.g., after login)
 */
function refreshCsrfToken() {
    const token = generateCsrfToken();
    sessionStorage.setItem(CSRF_TOKEN_KEY, token);
    logger.info('Refreshed CSRF token');
    return token;
}

/**
 * Clear CSRF token (e.g., on logout)
 */
function clearCsrfToken() {
    sessionStorage.removeItem(CSRF_TOKEN_KEY);
    logger.info('Cleared CSRF token');
}

/**
 * Validate CSRF token from response
 * @param {string} token - Token to validate
 * @returns {boolean} Is valid
 */
function validateCsrfToken(token) {
    const storedToken = sessionStorage.getItem(CSRF_TOKEN_KEY);
    return token === storedToken;
}

// ===========================================
// Request Interceptor
// ===========================================

/**
 * Add CSRF token to request headers
 * @param {Object} headers - Request headers
 * @returns {Object} Headers with CSRF token
 */
function addCsrfHeader(headers = {}) {
    // Only add CSRF token for state-changing methods
    const token = getCsrfToken();
    return {
        ...headers,
        [CSRF_HEADER_NAME]: token
    };
}

/**
 * Check if request method requires CSRF protection
 * @param {string} method - HTTP method
 * @returns {boolean} Requires CSRF protection
 */
function requiresCsrfProtection(method) {
    const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
    return !safeMethods.includes(method?.toUpperCase());
}

// ===========================================
// Double Submit Cookie Pattern (Future)
// ===========================================

/**
 * Set CSRF token in cookie (for double-submit pattern)
 * Note: Requires server-side support
 */
function setCsrfCookie() {
    const token = getCsrfToken();
    // Cookie will be set by server in production
    // This is just a placeholder for future implementation
    document.cookie = `csrf_token=${token}; SameSite=Strict; Secure; Path=/`;
    logger.info('CSRF cookie set (client-side)');
}

/**
 * Get CSRF token from cookie
 * @returns {string|null} CSRF token from cookie
 */
function getCsrfFromCookie() {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'csrf_token') {
            return value;
        }
    }
    return null;
}

// ===========================================
// Form Protection
// ===========================================

/**
 * Add CSRF token to form as hidden input
 * @param {HTMLFormElement} form - Form element
 */
function protectForm(form) {
    // Check if token already exists
    let tokenInput = form.querySelector('input[name="csrf_token"]');

    if (!tokenInput) {
        tokenInput = document.createElement('input');
        tokenInput.type = 'hidden';
        tokenInput.name = 'csrf_token';
        form.appendChild(tokenInput);
    }

    tokenInput.value = getCsrfToken();
    logger.info('Form protected with CSRF token');
}

/**
 * Protect all forms on the page
 */
function protectAllForms() {
    const forms = document.querySelectorAll('form');
    forms.forEach(form => protectForm(form));
    logger.info(`Protected ${forms.length} forms with CSRF tokens`);
}

/**
 * Validate CSRF token from form
 * @param {HTMLFormElement} form - Form element
 * @returns {boolean} Is valid
 */
function validateFormCsrf(form) {
    const tokenInput = form.querySelector('input[name="csrf_token"]');
    if (!tokenInput) {
        logger.warn('Form missing CSRF token');
        return false;
    }

    return validateCsrfToken(tokenInput.value);
}

// ===========================================
// Meta Tag Support (Server-Rendered Pages)
// ===========================================

/**
 * Get CSRF token from meta tag
 * @returns {string|null} CSRF token from meta tag
 */
function getCsrfFromMeta() {
    const metaTag = document.querySelector('meta[name="csrf-token"]');
    return metaTag ? metaTag.content : null;
}

/**
 * Initialize CSRF token from meta tag if available
 */
function initFromMeta() {
    const metaToken = getCsrfFromMeta();
    if (metaToken) {
        sessionStorage.setItem(CSRF_TOKEN_KEY, metaToken);
        logger.info('Initialized CSRF token from meta tag');
    }
}

// ===========================================
// Initialization
// ===========================================

/**
 * Initialize CSRF protection
 */
function initCsrfProtection() {
    // Try to get token from meta tag first
    initFromMeta();

    // Ensure we have a token
    getCsrfToken();

    // Protect all forms (if any)
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', protectAllForms);
    } else {
        protectAllForms();
    }

    logger.info('CSRF protection initialized');
}

// ===========================================
// Exports
// ===========================================

export {
    // Token management
    getCsrfToken,
    refreshCsrfToken,
    clearCsrfToken,
    validateCsrfToken,

    // Request helpers
    addCsrfHeader,
    requiresCsrfProtection,
    CSRF_HEADER_NAME,

    // Form protection
    protectForm,
    protectAllForms,
    validateFormCsrf,

    // Cookie support
    setCsrfCookie,
    getCsrfFromCookie,

    // Meta tag support
    getCsrfFromMeta,
    initFromMeta,

    // Initialization
    initCsrfProtection
};
