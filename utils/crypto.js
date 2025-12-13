/**
 * Cryptography Utilities
 * 
 * Provides encryption/decryption for sensitive data storage.
 */

const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const STORAGE_KEY = '_ek';

/**
 * Get or generate encryption key
 * @private
 */
async function getEncryptionKey() {
    const stored = sessionStorage.getItem(STORAGE_KEY);

    if (stored) {
        try {
            const keyData = JSON.parse(atob(stored));
            return await crypto.subtle.importKey(
                'raw',
                new Uint8Array(keyData),
                { name: ALGORITHM },
                true,
                ['encrypt', 'decrypt']
            );
        } catch (error) {
            console.warn('Failed to import stored key, generating new one');
        }
    }

    // Generate new key
    const key = await crypto.subtle.generateKey(
        { name: ALGORITHM, length: KEY_LENGTH },
        true,
        ['encrypt', 'decrypt']
    );

    // Store key in sessionStorage (more secure than localStorage)
    const exported = await crypto.subtle.exportKey('raw', key);
    const keyArray = Array.from(new Uint8Array(exported));
    sessionStorage.setItem(STORAGE_KEY, btoa(JSON.stringify(keyArray)));

    return key;
}

/**
 * Encrypt text
 * @param {string} text - Text to encrypt
 * @returns {Promise<Object>} Encrypted data with IV
 */
export async function encrypt(text) {
    if (!text) return null;

    try {
        const key = await getEncryptionKey();
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const encoded = new TextEncoder().encode(text);

        const encrypted = await crypto.subtle.encrypt(
            { name: ALGORITHM, iv },
            key,
            encoded
        );

        return {
            iv: Array.from(iv),
            data: Array.from(new Uint8Array(encrypted))
        };
    } catch (error) {
        console.error('Encryption failed:', error);
        return null;
    }
}

/**
 * Decrypt encrypted data
 * @param {Object} encrypted - Encrypted data with IV
 * @returns {Promise<string>} Decrypted text
 */
export async function decrypt(encrypted) {
    if (!encrypted || !encrypted.iv || !encrypted.data) return null;

    try {
        const key = await getEncryptionKey();
        const iv = new Uint8Array(encrypted.iv);
        const data = new Uint8Array(encrypted.data);

        const decrypted = await crypto.subtle.decrypt(
            { name: ALGORITHM, iv },
            key,
            data
        );

        return new TextDecoder().decode(decrypted);
    } catch (error) {
        console.error('Decryption failed:', error);
        return null;
    }
}

/**
 * Clear encryption key (on logout)
 */
export function clearEncryptionKey() {
    sessionStorage.removeItem(STORAGE_KEY);
}
