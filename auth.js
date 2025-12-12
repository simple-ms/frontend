// ===========================================
// Enhanced Authentication Module
// ===========================================

import { state } from './config.js';
import { apiCall } from './api.js';
import { showToast, showMessage, setButtonLoading } from './utils.js';
import { navigateTo, updateNavigationForRole } from './navigation.js';
import { logger } from './logger.js';
import { loginSchema, registerSchema, passwordValidator } from './validation.js';
import { checkLoginRateLimit, resetLoginRateLimit, checkRegisterRateLimit } from './rate-limiter.js';
import { refreshCsrfToken, clearCsrfToken } from './csrf.js';

// ===========================================
// Constants
// ===========================================

const TOKEN_REFRESH_THRESHOLD = 60 * 1000; // Refresh token 1 minute before expiry
const TOKEN_CHECK_INTERVAL = 30 * 1000; // Check token every 30 seconds

// ===========================================
// Token Management
// ===========================================

/**
 * Decode JWT payload without verification (client-side only for expiry check)
 */
function decodeJWT(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );
        return JSON.parse(jsonPayload);
    } catch (error) {
        logger.error('Failed to decode JWT:', error);
        return null;
    }
}

/**
 * Check if token is expired or about to expire
 */
function isTokenExpiringSoon(token, thresholdMs = TOKEN_REFRESH_THRESHOLD) {
    const payload = decodeJWT(token);
    if (!payload || !payload.exp) return true;

    const expiryTime = payload.exp * 1000; // Convert to milliseconds
    const now = Date.now();
    const timeUntilExpiry = expiryTime - now;

    return timeUntilExpiry <= thresholdMs;
}

/**
 * Automatically refresh access token using refresh token
 */
async function refreshAccessToken() {
    if (!state.refreshToken) {
        logger.warn('No refresh token available');
        return false;
    }

    try {
        logger.info('Refreshing access token');
        const data = await apiCall('/auth/refresh', {
            method: 'POST',
            skipAuth: true,
            body: JSON.stringify({ refresh_token: state.refreshToken })
        });

        // Update tokens
        state.token = data.access_token;
        state.refreshToken = data.refresh_token;

        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('refresh_token', data.refresh_token);

        logger.info('Access token refreshed successfully');
        return true;
    } catch (error) {
        logger.error('Token refresh failed:', error);
        // If refresh fails, logout user
        await logout();
        return false;
    }
}

/**
 * Start automatic token refresh monitoring
 */
function startTokenRefreshMonitor() {
    // Clear any existing interval
    if (state.tokenRefreshInterval) {
        clearInterval(state.tokenRefreshInterval);
    }

    state.tokenRefreshInterval = setInterval(async () => {
        if (!state.token || !isAuthenticated()) {
            clearInterval(state.tokenRefreshInterval);
            return;
        }

        if (isTokenExpiringSoon(state.token)) {
            logger.info('Access token expiring soon, refreshing...');
            await refreshAccessToken();
        }
    }, TOKEN_CHECK_INTERVAL);

    logger.info('Token refresh monitor started');
}

/**
 * Stop automatic token refresh monitoring
 */
function stopTokenRefreshMonitor() {
    if (state.tokenRefreshInterval) {
        clearInterval(state.tokenRefreshInterval);
        state.tokenRefreshInterval = null;
        logger.info('Token refresh monitor stopped');
    }
}

// ===========================================
// Authentication State
// ===========================================

/**
 * Check if user is authenticated
 */
function isAuthenticated() {
    return !!state.token && !!state.refreshToken;
}

/**
 * Set authentication state after login/registration
 */
function setAuthState(data) {
    state.token = data.access_token;
    state.refreshToken = data.refresh_token;
    state.userId = data.user_id;
    state.userRole = data.role;

    // Persist to localStorage
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);
    localStorage.setItem('user_id', data.user_id);
    localStorage.setItem('user_role', data.role);

    // Start token refresh monitoring
    startTokenRefreshMonitor();

    logger.info('Authentication state set', { userId: data.user_id, role: data.role });
}

/**
 * Clear authentication state
 */
function clearAuthState() {
    // Stop token refresh
    stopTokenRefreshMonitor();

    // Clear state
    state.token = null;
    state.refreshToken = null;
    state.userId = null;
    state.userRole = null;
    state.userEmail = null;

    // Clear localStorage
    localStorage.clear();

    logger.info('Authentication state cleared');
}

/**
 * Logout user
 */
async function logout() {
    // Call logout API to revoke refresh token
    if (state.refreshToken) {
        try {
            await apiCall('/auth/logout', {
                method: 'POST',
                skipAuth: true,
                body: JSON.stringify({ refresh_token: state.refreshToken })
            });
            logger.info('Logout API call successful');
        } catch (error) {
            logger.error('Logout API call failed:', error);
            // Continue with local logout even if API call fails
        }
    }

    // Clear local state
    clearAuthState();

    // Update UI
    document.getElementById('userMenu')?.classList.add('hidden');
    updateAuthUI();
    navigateTo('auth');
    showToast('Signed out successfully');
}

// ===========================================
// UI Updates
// ===========================================

/**
 * Update UI based on authentication state
 */
function updateAuthUI() {
    const authLink = document.getElementById('authLink');
    const navMenu = document.getElementById('navMenu');
    const addProductBtn = document.getElementById('addProductBtn');
    const userMenu = document.getElementById('userMenu');
    const userEmail = document.getElementById('userEmail');
    const userRole = document.getElementById('userRole');

    if (isAuthenticated()) {
        // Update auth link to show user indicator
        authLink.innerHTML = '<span>◯</span>';
        authLink.classList.add('authenticated');
        authLink.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            userMenu.classList.toggle('hidden');
        };

        // Show navigation links by removing hidden class from all nav links
        // Then updateNavigationForRole will hide the ones that shouldn't be visible for this role
        navMenu.querySelectorAll('.nav-link[data-page]').forEach(link => {
            link.classList.remove('hidden');
        });

        // Update user menu
        userEmail.textContent = state.userEmail || 'User';
        userRole.textContent = state.userRole || 'buyer';

        // Show add product button for sellers
        if (state.userRole === 'seller' || state.userRole === 'admin') {
            addProductBtn.classList.remove('hidden');
        } else {
            addProductBtn.classList.add('hidden');
        }
    } else {
        authLink.innerHTML = '<span>Sign In</span>';
        authLink.classList.remove('authenticated');
        authLink.onclick = (e) => {
            e.preventDefault();
            navigateTo('auth');
        };

        // Hide navigation links except products (use classList instead of inline styles)
        navMenu.querySelectorAll('.nav-link[data-page]').forEach(link => {
            if (link.dataset.page !== 'products') {
                link.classList.add('hidden');
            }
        });

        addProductBtn.classList.add('hidden');
        userMenu.classList.add('hidden');
    }

    // Update navigation based on role
    if (state.userRole) {
        updateNavigationForRole(state.userRole);
    }
}

// ===========================================
// Form Handlers
// ===========================================

/**
 * Handle login form submission
 */
async function handleLogin(e) {
    e.preventDefault();

    const button = e.target.querySelector('button[type="submit"]');
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    // Validate input
    const validation = loginSchema.validate({ email, password });
    if (!validation.success) {
        const firstError = Object.values(validation.errors)[0];
        showMessage('authMessage', firstError, 'error');
        return;
    }

    // Check rate limit
    const rateLimit = checkLoginRateLimit(email);
    if (!rateLimit.allowed) {
        showMessage('authMessage', rateLimit.message, 'error');
        return;
    }

    setButtonLoading(button, true);

    try {
        const data = await apiCall('/auth/login', {
            method: 'POST',
            skipAuth: true,
            body: JSON.stringify({ email, password })
        });

        // Success - reset rate limit
        resetLoginRateLimit(email);

        setAuthState(data);
        state.userEmail = email;
        localStorage.setItem('user_email', email);

        // Refresh CSRF token on login
        refreshCsrfToken();

        showToast('Welcome back!');
        updateAuthUI();
        navigateTo('products');

        // Reset form
        e.target.reset();
    } catch (error) {
        showMessage('authMessage', error.message, 'error');
        logger.error('Login failed:', error);
    } finally {
        setButtonLoading(button, false);
    }
}

/**
 * Handle registration form submission
 */
async function handleRegister(e) {
    e.preventDefault();

    const button = e.target.querySelector('button[type="submit"]');
    const firstName = document.getElementById('regFirstName').value.trim();
    const lastName = document.getElementById('regLastName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;
    const passwordRepeat = document.getElementById('regPasswordRepeat').value;
    const role = document.querySelector('input[name="role"]:checked')?.value;

    // Validate passwords match first
    const passwordMatchError = passwordValidator.match(password)(passwordRepeat);
    if (passwordMatchError) {
        showMessage('authMessage', passwordMatchError, 'error');
        return;
    }

    // Validate all fields
    const validation = registerSchema.validate({
        first_name: firstName,
        last_name: lastName,
        email,
        password,
        password_repeat: passwordRepeat,
        role
    });

    if (!validation.success) {
        const firstError = Object.values(validation.errors)[0];
        showMessage('authMessage', firstError, 'error');
        return;
    }

    // Check rate limit
    const rateLimit = checkRegisterRateLimit(email);
    if (!rateLimit.allowed) {
        showMessage('authMessage', rateLimit.message, 'error');
        return;
    }

    setButtonLoading(button, true);

    try {
        await apiCall('/auth/register', {
            method: 'POST',
            skipAuth: true,
            body: JSON.stringify({
                first_name: firstName,
                last_name: lastName,
                email,
                password,
                role
            })
        });

        // Registration successful - do NOT auto-login
        showToast('Account created! Please log in.');

        // Switch to login tab
        document.querySelector('.tab-btn[data-tab="login"]').click();

        // Pre-fill email in login form
        document.getElementById('loginEmail').value = email;
        document.getElementById('loginPassword').focus();

        // Reset registration form
        e.target.reset();
    } catch (error) {
        showMessage('authMessage', error.message, 'error');
        logger.error('Registration failed:', error);
    } finally {
        setButtonLoading(button, false);
    }
}

/**
 * Handle tab switching
 */
function handleTabSwitch(tab) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelector(`.tab-btn[data-tab="${tab}"]`).classList.add('active');

    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const authTitle = document.getElementById('authTitle');

    if (tab === 'login') {
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
        authTitle.textContent = 'Welcome back';
    } else {
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');
        authTitle.textContent = 'Create account';
    }
}

// ===========================================
// Initialization
// ===========================================

/**
 * Initialize authentication handlers
 */
function initAuthHandlers() {
    // Close user menu when clicking outside
    document.addEventListener('click', (e) => {
        const userMenu = document.getElementById('userMenu');
        const authLink = document.getElementById('authLink');

        if (!userMenu.contains(e.target) && !authLink.contains(e.target)) {
            userMenu.classList.add('hidden');
        }
    });

    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', logout);

    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => handleTabSwitch(btn.dataset.tab));
    });

    // Login form
    document.getElementById('loginForm').addEventListener('submit', handleLogin);

    // Register form
    document.getElementById('registerForm').addEventListener('submit', handleRegister);

    // Start token refresh monitor if already authenticated
    if (isAuthenticated()) {
        startTokenRefreshMonitor();
        logger.info('Resumed token refresh monitor from previous session');
    }

    logger.info('Auth handlers initialized');
}

// ===========================================
// Exports
// ===========================================

export {
    isAuthenticated,
    setAuthState,
    clearAuthState,
    logout,
    updateAuthUI,
    initAuthHandlers,
    refreshAccessToken
};
