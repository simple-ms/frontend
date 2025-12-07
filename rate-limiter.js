// ===========================================
// Client-Side Rate Limiting Module
// ===========================================

import { logger } from './logger.js';

/**
 * Rate limiter to prevent brute force attacks on the frontend
 */
class RateLimiter {
    constructor(maxAttempts = 5, windowMs = 60000) {
        this.maxAttempts = maxAttempts;
        this.windowMs = windowMs;
        this.attempts = new Map(); // key -> { count, firstAttempt, blockedUntil }
    }

    /**
     * Check if action is allowed
     * @param {string} key - Identifier (e.g., 'login', 'register', email)
     * @returns {Object} { allowed: boolean, remainingAttempts: number, resetIn: number }
     */
    check(key) {
        const now = Date.now();
        const record = this.attempts.get(key);

        // No previous attempts
        if (!record) {
            return {
                allowed: true,
                remainingAttempts: this.maxAttempts - 1,
                resetIn: this.windowMs
            };
        }

        // Check if currently blocked
        if (record.blockedUntil && now < record.blockedUntil) {
            const resetIn = record.blockedUntil - now;
            logger.warn(`Rate limit exceeded for ${key}, blocked for ${Math.ceil(resetIn / 1000)}s`);
            return {
                allowed: false,
                remainingAttempts: 0,
                resetIn,
                message: `Too many attempts. Please try again in ${Math.ceil(resetIn / 1000)} seconds.`
            };
        }

        // Check if window has expired
        if (now - record.firstAttempt > this.windowMs) {
            // Reset the window
            this.attempts.delete(key);
            return {
                allowed: true,
                remainingAttempts: this.maxAttempts - 1,
                resetIn: this.windowMs
            };
        }

        // Within window, check attempt count
        if (record.count >= this.maxAttempts) {
            // Block for the remaining window time
            const blockedUntil = record.firstAttempt + this.windowMs;
            record.blockedUntil = blockedUntil;
            this.attempts.set(key, record);

            const resetIn = blockedUntil - now;
            logger.warn(`Rate limit exceeded for ${key}`);
            return {
                allowed: false,
                remainingAttempts: 0,
                resetIn,
                message: `Too many attempts. Please try again in ${Math.ceil(resetIn / 1000)} seconds.`
            };
        }

        // Allowed, but increment count
        return {
            allowed: true,
            remainingAttempts: this.maxAttempts - record.count - 1,
            resetIn: record.firstAttempt + this.windowMs - now
        };
    }

    /**
     * Record an attempt
     * @param {string} key - Identifier
     */
    record(key) {
        const now = Date.now();
        const record = this.attempts.get(key);

        if (!record || now - record.firstAttempt > this.windowMs) {
            // New window
            this.attempts.set(key, {
                count: 1,
                firstAttempt: now,
                blockedUntil: null
            });
        } else {
            // Increment count
            record.count++;
            this.attempts.set(key, record);
        }

        logger.info(`Rate limiter: ${key} - attempt ${this.attempts.get(key).count}/${this.maxAttempts}`);
    }

    /**
     * Reset attempts for a key (e.g., after successful login)
     * @param {string} key - Identifier
     */
    reset(key) {
        this.attempts.delete(key);
        logger.info(`Rate limiter: reset ${key}`);
    }

    /**
     * Clear all attempts (e.g., for testing)
     */
    clear() {
        this.attempts.clear();
        logger.info('Rate limiter: cleared all attempts');
    }

    /**
     * Get current status for a key
     * @param {string} key - Identifier
     * @returns {Object} Current status
     */
    getStatus(key) {
        const record = this.attempts.get(key);
        if (!record) {
            return {
                attempts: 0,
                maxAttempts: this.maxAttempts,
                blocked: false
            };
        }

        const now = Date.now();
        const blocked = record.blockedUntil && now < record.blockedUntil;

        return {
            attempts: record.count,
            maxAttempts: this.maxAttempts,
            blocked,
            blockedUntil: record.blockedUntil,
            windowExpires: record.firstAttempt + this.windowMs
        };
    }
}

// ===========================================
// Predefined Rate Limiters
// ===========================================

/**
 * Login rate limiter - 5 attempts per minute
 */
const loginRateLimiter = new RateLimiter(5, 60000);

/**
 * Registration rate limiter - 3 attempts per 5 minutes
 */
const registerRateLimiter = new RateLimiter(3, 300000);

/**
 * Password reset rate limiter - 3 attempts per hour
 */
const passwordResetRateLimiter = new RateLimiter(3, 3600000);

/**
 * API call rate limiter - 30 attempts per minute
 */
const apiRateLimiter = new RateLimiter(30, 60000);

// ===========================================
// Helper Functions
// ===========================================

/**
 * Check and record rate limit for login
 * @param {string} email - User email
 * @returns {Object} Rate limit check result
 */
function checkLoginRateLimit(email) {
    const key = `login:${email.toLowerCase()}`;
    const result = loginRateLimiter.check(key);

    if (result.allowed) {
        loginRateLimiter.record(key);
    }

    return result;
}

/**
 * Reset login rate limit (after successful login)
 * @param {string} email - User email
 */
function resetLoginRateLimit(email) {
    const key = `login:${email.toLowerCase()}`;
    loginRateLimiter.reset(key);
}

/**
 * Check and record rate limit for registration
 * @param {string} email - User email
 * @returns {Object} Rate limit check result
 */
function checkRegisterRateLimit(email) {
    const key = `register:${email.toLowerCase()}`;
    const result = registerRateLimiter.check(key);

    if (result.allowed) {
        registerRateLimiter.record(key);
    }

    return result;
}

/**
 * Check and record rate limit for API calls
 * @param {string} endpoint - API endpoint
 * @returns {Object} Rate limit check result
 */
function checkApiRateLimit(endpoint) {
    const key = `api:${endpoint}`;
    const result = apiRateLimiter.check(key);

    if (result.allowed) {
        apiRateLimiter.record(key);
    }

    return result;
}

// ===========================================
// Exports
// ===========================================

export {
    RateLimiter,
    loginRateLimiter,
    registerRateLimiter,
    passwordResetRateLimiter,
    apiRateLimiter,
    checkLoginRateLimit,
    resetLoginRateLimit,
    checkRegisterRateLimit,
    checkApiRateLimit
};
