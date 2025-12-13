/**
 * Authentication Service
 * 
 * Handles all authentication-related operations with enhanced security.
 * Rate limiting is handled by the backend for proper security.
 */
import { apiClient } from './api.service.js';
import { state } from '../core/state.js';
import { eventBus, Events } from '../core/eventBus.js';
import { ApiEndpoints } from '../constants/apiEndpoints.js';
import { Messages } from '../constants/messages.js';
import { logger } from '../utils/logger.js';
import { secureStorage } from '../utils/secureStorage.js';
import { clearEncryptionKey } from '../utils/crypto.js';
import { env } from '../core/env.js';

class AuthService {
    constructor() {
        this.refreshInterval = null;
        this.refreshBuffer = 60000; // Refresh 1 minute before expiry

        // Initialize from secure storage
        this._initializeFromStorage();
    }

    /**
     * Initialize auth state from secure storage
     * @private
     */
    async _initializeFromStorage() {
        try {
            const token = await secureStorage.getItem('token');
            const refreshToken = await secureStorage.getItem('refreshToken');
            const tokenTimestamp = await secureStorage.getItem('tokenTimestamp');

            if (token && tokenTimestamp) {
                // Check if token is expired
                const age = Date.now() - parseInt(tokenTimestamp);
                const maxAge = env.TOKEN_EXPIRY * 1000;

                if (age < maxAge) {
                    // Token still valid, restore state
                    state.set('token', token);
                    state.set('refreshToken', refreshToken);

                    // Try to get current user
                    try {
                        await this.getCurrentUser();
                    } catch (error) {
                        // Token invalid, clear
                        await this._clearAuth();
                    }
                } else {
                    // Token expired, try to refresh
                    if (refreshToken) {
                        state.set('refreshToken', refreshToken);
                        try {
                            await this.refreshToken();
                        } catch (error) {
                            await this._clearAuth();
                        }
                    } else {
                        await this._clearAuth();
                    }
                }
            }
        } catch (error) {
            logger.error('[Auth] Failed to initialize from storage:', error);
        }
    }

    /**
     * Login user
     * @param {string} email - User email
     * @param {string} password - User password
     * @returns {Promise<Object>} User data
     */
    async login(email, password) {
        try {
            const response = await apiClient.post(ApiEndpoints.AUTH_LOGIN, {
                email,
                password
            }, { cache: false });

            console.log('[Auth] Backend response:', response);
            console.log('[Auth] Response keys:', Object.keys(response));
            console.log('[Auth] Response.data:', response.data);

            // Store auth data securely (pass email since backend doesn't return it)
            await this._handleAuthSuccess(response, email);

            logger.info('[Auth] Login successful');
            eventBus.emit(Events.AUTH_LOGIN, response);

            return response;
        } catch (error) {
            logger.error('[Auth] Login failed:', error);
            throw error;
        }
    }

    /**
     * Register new user
     * @param {Object} userData - User registration data
     * @returns {Promise<Object>} User data
     */
    async register(userData) {
        try {
            const response = await apiClient.post(ApiEndpoints.AUTH_REGISTER, userData, {
                cache: false
            });

            logger.info('[Auth] Registration successful');
            eventBus.emit(Events.AUTH_REGISTER, response);

            return response;
        } catch (error) {
            logger.error('[Auth] Registration failed:', error);
            throw error;
        }
    }

    /**
     * Logout user
     * @returns {Promise<void>}
     */
    async logout() {
        try {
            // Call logout endpoint if token exists
            if (state.get('token')) {
                await apiClient.post(ApiEndpoints.AUTH_LOGOUT, {}, { cache: false });
            }
        } catch (error) {
            logger.error('[Auth] Logout request failed:', error);
        } finally {
            await this._clearAuth();
            eventBus.emit(Events.AUTH_LOGOUT);
            logger.info('[Auth] Logout successful');
        }
    }

    /**
     * Refresh access token
     * @returns {Promise<Object>} New tokens
     */
    async refreshToken() {
        const refreshToken = state.get('refreshToken');

        if (!refreshToken) {
            throw new Error('No refresh token available');
        }

        try {
            const response = await apiClient.post(ApiEndpoints.AUTH_REFRESH, {
                refresh_token: refreshToken
            }, { cache: false });

            this._handleAuthSuccess(response);
            eventBus.emit(Events.AUTH_TOKEN_REFRESH, response);
            logger.info('[Auth] Token refreshed successfully');

            return response;
        } catch (error) {
            logger.error('[Auth] Token refresh failed:', error);
            this._clearAuth();
            throw error;
        }
    }

    /**
     * Get current user info
     * @returns {Promise<Object>} User data
     */
    async getCurrentUser() {
        try {
            const response = await apiClient.get(ApiEndpoints.AUTH_ME);

            // Update state with user info
            state.update({
                userId: response.id,
                userEmail: response.email,
                userRole: response.role
            });

            return response;
        } catch (error) {
            logger.error('[Auth] Failed to get current user:', error);
            throw error;
        }
    }

    /**
     * Check if user is authenticated
     * @returns {boolean}
     */
    isAuthenticated() {
        return !!state.get('token');
    }

    /**
     * Get current user role
     * @returns {string|null}
     */
    getUserRole() {
        return state.get('userRole');
    }

    /**
     * Check if user has role
     * @param {string} role - Role to check
     * @returns {boolean}
     */
    hasRole(role) {
        return state.get('userRole') === role;
    }

    /**
     * Start automatic token refresh
     * @param {number} expiresIn - Token expiry time in seconds
     */
    startTokenRefresh(expiresIn) {
        this.stopTokenRefresh();

        const refreshTime = (expiresIn * 1000) - this.refreshBuffer;

        this.refreshInterval = setInterval(async () => {
            try {
                await this.refreshToken();
            } catch (error) {
                logger.error('[Auth] Auto token refresh failed:', error);
                this.stopTokenRefresh();
            }
        }, refreshTime);

        logger.info(`[Auth] Token refresh scheduled in ${refreshTime}ms`);
    }

    /**
     * Stop automatic token refresh
     */
    stopTokenRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }

    /**
     * Handle successful authentication
     * @private
     * @param {Object} response - Backend response
     * @param {string} userEmail - User email (not returned by backend)
     */
    async _handleAuthSuccess(response, userEmail = null) {
        // Handle both direct response and nested data structure
        const data = response.data || response;

        // Backend returns: { access_token, refresh_token, user_id, role, expires_in }
        const { access_token, refresh_token, user_id, role, expires_in } = data;

        if (!access_token || !refresh_token) {
            console.error('[Auth] Missing tokens in response:', data);
            throw new Error('Invalid authentication response: missing tokens');
        }

        if (!user_id) {
            console.error('[Auth] Missing user_id in response:', data);
            throw new Error('Invalid authentication response: missing user data');
        }

        console.log('[Auth] Processing auth success:', { user_id, role, email: userEmail, has_token: !!access_token });

        // Store tokens securely
        await secureStorage.setItem('token', access_token);
        await secureStorage.setItem('refreshToken', refresh_token);
        await secureStorage.setItem('tokenTimestamp', Date.now().toString());

        // Update state (tokens in memory only)
        state.update({
            token: access_token,
            refreshToken: refresh_token,
            userId: user_id,
            userEmail: userEmail || state.get('userEmail'), // Use provided email or keep existing
            userRole: role
        });

        // Start token refresh if expiry provided
        if (expires_in) {
            this.startTokenRefresh(expires_in);
        }

        // Clear API cache on auth change
        apiClient.clearCache();
    }

    /**
     * Clear authentication data
     * @private
     */
    async _clearAuth() {
        this.stopTokenRefresh();

        // Clear secure storage
        await secureStorage.removeItem('token');
        await secureStorage.removeItem('refreshToken');
        await secureStorage.removeItem('tokenTimestamp');

        // Clear encryption key
        clearEncryptionKey();

        // Clear state
        state.update({
            token: null,
            refreshToken: null,
            userId: null,
            userEmail: null,
            userRole: null
        });

        // Clear API cache
        apiClient.clearCache();
    }
}

// Create singleton instance
export const authService = new AuthService();

// Listen for token refresh events
eventBus.on(Events.AUTH_TOKEN_REFRESH, async () => {
    try {
        await authService.refreshToken();
    } catch (error) {
        // Token refresh failed, logout user
        await authService.logout();
    }
});
