/**
 * Environment Configuration
 * 
 * Centralized environment variable management.
 * Uses import.meta.env for Vite compatibility.
 */

/**
 * Get environment variable with fallback
 */
function getEnv(key, defaultValue = '') {
    // For Vite
    if (typeof import.meta !== 'undefined' && import.meta.env) {
        return import.meta.env[key] || defaultValue;
    }

    // For plain JavaScript (fallback to window)
    if (typeof window !== 'undefined' && window.ENV) {
        return window.ENV[key] || defaultValue;
    }

    return defaultValue;
}

/**
 * Parse boolean environment variable
 */
function parseBool(value, defaultValue = false) {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
        return value.toLowerCase() === 'true' || value === '1';
    }
    return defaultValue;
}

/**
 * Parse number environment variable
 */
function parseNumber(value, defaultValue = 0) {
    const num = Number(value);
    return isNaN(num) ? defaultValue : num;
}

/**
 * Environment Configuration
 */
export const env = {
    // API Configuration
    API_BASE_URL: getEnv('VITE_API_BASE_URL', 'http://localhost'),
    API_TIMEOUT: parseNumber(getEnv('VITE_API_TIMEOUT'), 30000),

    // Authentication
    TOKEN_EXPIRY: parseNumber(getEnv('VITE_TOKEN_EXPIRY'), 3600),
    REFRESH_TOKEN_EXPIRY: parseNumber(getEnv('VITE_REFRESH_TOKEN_EXPIRY'), 604800),
    AUTO_REFRESH: parseBool(getEnv('VITE_AUTO_REFRESH'), true),

    // Security
    ENABLE_CSP: parseBool(getEnv('VITE_ENABLE_CSP'), true),
    ENABLE_CSRF: parseBool(getEnv('VITE_ENABLE_CSRF'), true),
    ENABLE_XSS_PROTECTION: parseBool(getEnv('VITE_ENABLE_XSS_PROTECTION'), true),

    // Rate Limiting
    RATE_LIMIT_LOGIN_ATTEMPTS: parseNumber(getEnv('VITE_RATE_LIMIT_LOGIN_ATTEMPTS'), 5),
    RATE_LIMIT_LOGIN_WINDOW: parseNumber(getEnv('VITE_RATE_LIMIT_LOGIN_WINDOW'), 900000),
    RATE_LIMIT_API_ATTEMPTS: parseNumber(getEnv('VITE_RATE_LIMIT_API_ATTEMPTS'), 100),
    RATE_LIMIT_API_WINDOW: parseNumber(getEnv('VITE_RATE_LIMIT_API_WINDOW'), 60000),

    // Features
    ENABLE_REGISTRATION: parseBool(getEnv('VITE_ENABLE_REGISTRATION'), true),
    ENABLE_PASSWORD_RESET: parseBool(getEnv('VITE_ENABLE_PASSWORD_RESET'), true),
    ENABLE_SOCIAL_LOGIN: parseBool(getEnv('VITE_ENABLE_SOCIAL_LOGIN'), false),
    ENABLE_TWO_FACTOR: parseBool(getEnv('VITE_ENABLE_TWO_FACTOR'), false),

    // Logging
    LOG_LEVEL: getEnv('VITE_LOG_LEVEL', 'info'),
    LOG_SENSITIVE_DATA: parseBool(getEnv('VITE_LOG_SENSITIVE_DATA'), false),

    // Cache
    CACHE_ENABLED: parseBool(getEnv('VITE_CACHE_ENABLED'), true),
    CACHE_TTL: parseNumber(getEnv('VITE_CACHE_TTL'), 300000),

    // Development
    DEV_MODE: parseBool(getEnv('VITE_DEV_MODE'), true),
    ENABLE_CONSOLE: parseBool(getEnv('VITE_ENABLE_CONSOLE'), true),

    // Computed
    get isDevelopment() {
        return this.DEV_MODE;
    },

    get isProduction() {
        return !this.DEV_MODE;
    }
};

// Freeze to prevent modifications
Object.freeze(env);

// Log configuration in development
if (env.isDevelopment && env.ENABLE_CONSOLE) {
    console.log('[Env] Configuration loaded:', {
        API_BASE_URL: env.API_BASE_URL,
        DEV_MODE: env.DEV_MODE,
        CACHE_ENABLED: env.CACHE_ENABLED,
        // Don't log sensitive values
    });
}

export default env;
