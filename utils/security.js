/**
 * Security Utilities
 * 
 * Provides security functions for input sanitization, XSS prevention, and CSRF protection.
 */

/**
 * Sanitize HTML to prevent XSS attacks
 * @param {string} html - HTML string to sanitize
 * @returns {string} Sanitized HTML
 */
export function sanitizeHTML(html) {
    const div = document.createElement('div');
    div.textContent = html;
    return div.innerHTML;
}

/**
 * Escape HTML special characters
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
export function escapeHTML(str) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '/': '&#x2F;',
    };

    return String(str).replace(/[&<>"'/]/g, (char) => map[char]);
}

import DOMPurify from 'dompurify';

/**
 * Sanitize user input using DOMPurify
 * @param {string} input - User input
 * @returns {string} Sanitized input
 */
export function sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    return DOMPurify.sanitize(input).trim();
}

/**
 * Validate and sanitize URL
 * @param {string} url - URL to validate
 * @returns {string|null} Sanitized URL or null if invalid
 */
export function sanitizeURL(url) {
    try {
        const parsed = new URL(url, window.location.origin);

        // Only allow http and https protocols
        if (!['http:', 'https:'].includes(parsed.protocol)) {
            return null;
        }

        return parsed.href;
    } catch (error) {
        return null;
    }
}

/**
 * Generate random token
 * @param {number} length - Token length
 * @returns {string} Random token
 */
export function generateToken(length = 32) {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Hash string using SHA-256
 * @param {string} str - String to hash
 * @returns {Promise<string>} Hash
 */
export async function hashString(str) {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} Is valid
 */
export function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Check password strength
 * @param {string} password - Password to check
 * @returns {Object} Strength result
 */
export function checkPasswordStrength(password) {
    const result = {
        score: 0,
        feedback: [],
        isStrong: false
    };

    if (password.length < 8) {
        result.feedback.push('Password must be at least 8 characters');
    } else {
        result.score += 1;
    }

    if (!/[a-z]/.test(password)) {
        result.feedback.push('Password must contain lowercase letters');
    } else {
        result.score += 1;
    }

    if (!/[A-Z]/.test(password)) {
        result.feedback.push('Password must contain uppercase letters');
    } else {
        result.score += 1;
    }

    if (!/[0-9]/.test(password)) {
        result.feedback.push('Password must contain numbers');
    } else {
        result.score += 1;
    }

    if (!/[^a-zA-Z0-9]/.test(password)) {
        result.feedback.push('Password must contain special characters');
    } else {
        result.score += 1;
    }

    result.isStrong = result.score >= 4;

    return result;
}

/**
 * Prevent clickjacking
 */
export function preventClickjacking() {
    if (window.top !== window.self) {
        window.top.location = window.self.location;
    }
}

/**
 * Content Security Policy helper
 * @param {Object} policy - CSP policy object
 * @returns {string} CSP header value
 */
export function buildCSP(policy = {}) {
    const defaults = {
        'default-src': ["'self'"],
        'script-src': ["'self'"],
        'style-src': ["'self'", "'unsafe-inline'"],
        'img-src': ["'self'", 'data:', 'https:'],
        'font-src': ["'self'", 'https://fonts.gstatic.com'],
        'connect-src': ["'self'"],
        'base-uri': ["'self'"],
        'form-action': ["'self'"],
    };

    const merged = { ...defaults, ...policy };

    return Object.entries(merged)
        .map(([key, values]) => `${key} ${values.join(' ')}`)
        .join('; ');
}

/**
 * Rate limiting helper
 */
export class RateLimiter {
    constructor(maxAttempts = 5, windowMs = 60000) {
        this.maxAttempts = maxAttempts;
        this.windowMs = windowMs;
        this.attempts = new Map();
    }

    /**
     * Check if action is allowed
     * @param {string} key - Identifier (e.g., email, IP)
     * @returns {Object} Result with allowed status and remaining attempts
     */
    check(key) {
        const now = Date.now();
        const record = this.attempts.get(key) || { count: 0, resetAt: now + this.windowMs };

        // Reset if window expired
        if (now > record.resetAt) {
            record.count = 0;
            record.resetAt = now + this.windowMs;
        }

        const allowed = record.count < this.maxAttempts;
        const remaining = Math.max(0, this.maxAttempts - record.count);
        const resetIn = Math.max(0, record.resetAt - now);

        if (allowed) {
            record.count++;
            this.attempts.set(key, record);
        }

        return {
            allowed,
            remaining,
            resetIn,
            retryAfter: allowed ? 0 : resetIn
        };
    }

    /**
     * Reset attempts for a key
     * @param {string} key - Identifier
     */
    reset(key) {
        this.attempts.delete(key);
    }

    /**
     * Clear all attempts
     */
    clear() {
        this.attempts.clear();
    }
}

/**
 * CSRF Token Management
 */
let csrfToken = null;

/**
 * Initialize CSRF protection
 * @returns {string} CSRF token
 */
export function initCSRF() {
    // Get CSRF token from cookie or generate new one
    csrfToken = getCookie('csrf_token') || generateToken(32);

    // Store in cookie with security flags
    document.cookie = `csrf_token=${csrfToken}; path=/; SameSite=Strict; Secure`;

    return csrfToken;
}

/**
 * Get CSRF token
 * @returns {string} CSRF token
 */
export function getCSRFToken() {
    if (!csrfToken) {
        csrfToken = initCSRF();
    }
    return csrfToken;
}

/**
 * Get cookie value
 * @param {string} name - Cookie name
 * @returns {string|null} Cookie value
 */
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
        return parts.pop().split(';').shift();
    }
    return null;
}

