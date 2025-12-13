/**
 * Enhanced Security Configuration
 * 
 * Comprehensive security settings for the application.
 */

import { buildCSP, preventClickjacking } from '../utils/security.js';
import { env } from './env.js';

/**
 * Security Configuration
 */
export const SecurityConfig = {
    // Content Security Policy
    csp: buildCSP({
        'default-src': ["'self'"],
        'script-src': ["'self'", "'unsafe-inline'"], // Remove unsafe-inline in production
        'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        'img-src': ["'self'", 'data:', 'https:', 'blob:'],
        'font-src': ["'self'", 'https://fonts.gstatic.com'],
        'connect-src': ["'self'", env.API_BASE_URL, env.API_BASE_URL.replace('http', 'ws')],
        'base-uri': ["'self'"],
        'form-action': ["'self'"],
        'upgrade-insecure-requests': []
    }),

    // CORS Configuration
    cors: {
        allowedOrigins: [env.API_BASE_URL],
        allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
        credentials: true
    },

    // Rate Limiting
    rateLimit: {
        login: {
            maxAttempts: 5,
            windowMs: 15 * 60 * 1000, // 15 minutes
            message: 'Too many login attempts. Please try again later.'
        },
        api: {
            maxAttempts: 100,
            windowMs: 60 * 1000, // 1 minute
            message: 'Too many requests. Please slow down.'
        },
        register: {
            maxAttempts: 3,
            windowMs: 60 * 60 * 1000, // 1 hour
            message: 'Too many registration attempts. Please try again later.'
        }
    },

    // Password Policy
    password: {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
        maxLength: 128,
        preventCommon: true, // Prevent common passwords
        preventUserInfo: true // Prevent using email/username in password
    },

    // Session Configuration
    session: {
        tokenExpiry: 3600, // 1 hour
        refreshTokenExpiry: 604800, // 7 days
        autoRefresh: true,
        refreshBuffer: 300 // Refresh 5 minutes before expiry
    },

    // Input Sanitization
    sanitization: {
        enabled: true,
        stripTags: true,
        escapeHTML: true,
        maxLength: {
            text: 1000,
            textarea: 5000,
            email: 255,
            password: 128
        }
    },

    // XSS Protection
    xss: {
        enabled: true,
        sanitizeInputs: true,
        sanitizeOutputs: true,
        allowedTags: [], // No HTML tags allowed by default
        allowedAttributes: []
    },

    // CSRF Protection
    csrf: {
        enabled: true,
        tokenLength: 32,
        headerName: 'X-CSRF-Token',
        cookieName: 'csrf_token'
    },

    // File Upload (if needed in future)
    fileUpload: {
        maxSize: 5 * 1024 * 1024, // 5MB
        allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
        scanForMalware: true
    },

    // Logging
    logging: {
        enabled: true,
        logLevel: 'info', // 'debug', 'info', 'warn', 'error'
        logSensitiveData: false,
        maxLogSize: 1000 // Max number of logs to keep
    },

    // Feature Flags
    features: {
        enableRegistration: true,
        enablePasswordReset: true,
        enableSocialLogin: false,
        enableTwoFactor: false,
        enableEmailVerification: false
    }
};

/**
 * Initialize security measures
 */
export function initializeSecurity() {
    // Prevent clickjacking
    preventClickjacking();

    // Set security headers (if possible from frontend)
    if (document.querySelector('meta[http-equiv="Content-Security-Policy"]')) {
        document.querySelector('meta[http-equiv="Content-Security-Policy"]')
            .setAttribute('content', SecurityConfig.csp);
    }

    // Disable right-click in production (optional)
    if (process.env.NODE_ENV === 'production' && SecurityConfig.features.disableRightClick) {
        document.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    // Disable console in production (optional)
    if (process.env.NODE_ENV === 'production' && SecurityConfig.features.disableConsole) {
        console.log = () => { };
        console.warn = () => { };
        console.error = () => { };
    }

    // Monitor for suspicious activity
    monitorSuspiciousActivity();

    console.log('[Security] Security measures initialized');
}

/**
 * Monitor for suspicious activity
 */
function monitorSuspiciousActivity() {
    let suspiciousEvents = 0;
    const threshold = 10;
    const resetInterval = 60000; // 1 minute

    // Monitor rapid form submissions
    document.addEventListener('submit', () => {
        suspiciousEvents++;
        if (suspiciousEvents > threshold) {
            console.warn('[Security] Suspicious activity detected: Rapid form submissions');
            // Could trigger additional security measures
        }
    });

    // Monitor rapid API calls (handled in API client)

    // Reset counter periodically
    setInterval(() => {
        suspiciousEvents = 0;
    }, resetInterval);
}

/**
 * Validate input against security policy
 */
export function validateInput(value, type = 'text') {
    const config = SecurityConfig.sanitization;

    if (!config.enabled) return { valid: true };

    const maxLength = config.maxLength[type] || config.maxLength.text;

    if (value.length > maxLength) {
        return {
            valid: false,
            error: `Input too long. Maximum ${maxLength} characters allowed.`
        };
    }

    return { valid: true };
}

/**
 * Check password against policy
 */
export function validatePassword(password, userInfo = {}) {
    const policy = SecurityConfig.password;
    const errors = [];

    if (password.length < policy.minLength) {
        errors.push(`Password must be at least ${policy.minLength} characters`);
    }

    if (password.length > policy.maxLength) {
        errors.push(`Password must be less than ${policy.maxLength} characters`);
    }

    if (policy.requireUppercase && !/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
    }

    if (policy.requireLowercase && !/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
    }

    if (policy.requireNumbers && !/[0-9]/.test(password)) {
        errors.push('Password must contain at least one number');
    }

    if (policy.requireSpecialChars && !/[^a-zA-Z0-9]/.test(password)) {
        errors.push('Password must contain at least one special character');
    }

    if (policy.preventUserInfo && userInfo.email) {
        const emailParts = userInfo.email.toLowerCase().split('@')[0];
        if (password.toLowerCase().includes(emailParts)) {
            errors.push('Password cannot contain your email');
        }
    }

    // Common passwords check (simplified)
    const commonPasswords = ['password', '123456', 'qwerty', 'admin', 'letmein'];
    if (policy.preventCommon && commonPasswords.some(p => password.toLowerCase().includes(p))) {
        errors.push('Password is too common');
    }

    return {
        valid: errors.length === 0,
        errors,
        strength: calculatePasswordStrength(password)
    };
}

/**
 * Calculate password strength
 */
function calculatePasswordStrength(password) {
    let strength = 0;

    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    if (strength <= 2) return 'weak';
    if (strength <= 4) return 'medium';
    return 'strong';
}

export default SecurityConfig;
