// ===========================================
// Enhanced Configuration and State Management
// ===========================================

// ===========================================
// API Configuration
// ===========================================

const API_BASE = 'http://localhost';

// ===========================================
// Application State
// ===========================================

/**
 * Global application state
 * Synchronized with localStorage for persistence
 */
const state = {
    // Authentication
    token: localStorage.getItem('access_token'),
    refreshToken: localStorage.getItem('refresh_token'),
    userId: localStorage.getItem('user_id'),
    userRole: localStorage.getItem('user_role'),
    userEmail: localStorage.getItem('user_email'),

    // Navigation
    currentPage: 'auth',

    // Token refresh
    tokenRefreshInterval: null,

    // Feature flags (for future use)
    features: {
        sessionManagement: false, // Not yet implemented in frontend
        twoFactorAuth: false,
        emailVerification: false
    }
};

// ===========================================
// State Persistence Helpers
// ===========================================

/**
 * Save state to localStorage
 */
function saveState() {
    const keysToSave = ['token', 'refreshToken', 'userId', 'userRole', 'userEmail'];
    keysToSave.forEach(key => {
        if (state[key]) {
            localStorage.setItem(
                key.replace(/([A-Z])/g, '_$1').toLowerCase(),
                state[key]
            );
        }
    });
}

/**
 * Clear persisted state
 */
function clearPersistedState() {
    localStorage.clear();
}

/**
 * Load state from localStorage
 */
function loadState() {
    state.token = localStorage.getItem('access_token');
    state.refreshToken = localStorage.getItem('refresh_token');
    state.userId = localStorage.getItem('user_id');
    state.userRole = localStorage.getItem('user_role');
    state.userEmail = localStorage.getItem('user_email');
}

// ===========================================
// Exports
// ===========================================

export {
    API_BASE,
    state,
    saveState,
    clearPersistedState,
    loadState
};
