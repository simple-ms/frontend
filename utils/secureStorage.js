/**
 * Secure Storage
 * 
 * Encrypted storage wrapper for sensitive data.
 */

import { encrypt, decrypt } from './crypto.js';
import { logger } from './logger.js';

class SecureStorage {
    /**
     * Set encrypted item
     * @param {string} key - Storage key
     * @param {string} value - Value to store
     */
    async setItem(key, value) {
        try {
            const encrypted = await encrypt(value);
            if (encrypted) {
                localStorage.setItem(key, JSON.stringify(encrypted));
                return true;
            }
            return false;
        } catch (error) {
            logger.error('[SecureStorage] Failed to set item:', error);
            return false;
        }
    }

    /**
     * Get decrypted item
     * @param {string} key - Storage key
     * @returns {Promise<string|null>} Decrypted value
     */
    async getItem(key) {
        try {
            const stored = localStorage.getItem(key);
            if (!stored) return null;

            const encrypted = JSON.parse(stored);
            return await decrypt(encrypted);
        } catch (error) {
            logger.error('[SecureStorage] Failed to get item:', error);
            return null;
        }
    }

    /**
     * Remove item
     * @param {string} key - Storage key
     */
    removeItem(key) {
        localStorage.removeItem(key);
    }

    /**
     * Clear all items
     */
    clear() {
        localStorage.clear();
    }

    /**
     * Check if key exists
     * @param {string} key - Storage key
     * @returns {boolean}
     */
    hasItem(key) {
        return localStorage.getItem(key) !== null;
    }
}

// Create singleton instance
export const secureStorage = new SecureStorage();

export default secureStorage;
