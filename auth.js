// ===========================================
// Authentication Functions
// ===========================================

import { state } from './config.js';
import { apiCall } from './api.js';
import { showToast, showMessage, setButtonLoading } from './utils.js';
import { navigateTo } from './navigation.js';

function isAuthenticated() {
    return !!state.token;
}

function setAuthState(data) {
    state.token = data.access_token;
    state.refreshToken = data.refresh_token;
    state.userId = data.user_id;
    state.userRole = data.role;

    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);
    localStorage.setItem('user_id', data.user_id);
    localStorage.setItem('user_role', data.role);
}

function logout() {
    state.token = null;
    state.refreshToken = null;
    state.userId = null;
    state.userRole = null;
    state.userEmail = null;
    localStorage.clear();

    document.getElementById('userMenu').classList.add('hidden');
    updateAuthUI();
    navigateTo('auth');
    showToast('Signed out successfully');
}

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

        // Show navigation links
        navMenu.querySelectorAll('.nav-link[data-page]').forEach(link => {
            link.style.display = 'flex';
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

        // Hide navigation links except products
        navMenu.querySelectorAll('.nav-link[data-page]').forEach(link => {
            if (link.dataset.page !== 'products') {
                link.style.display = 'none';
            }
        });

        addProductBtn.classList.add('hidden');
        userMenu.classList.add('hidden');
    }
}

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
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;

            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

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
        });
    });

    // Login form
    document.getElementById('loginForm').addEventListener('submit', async(e) => {
        e.preventDefault();

        const button = e.target.querySelector('button[type="submit"]');
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        setButtonLoading(button, true);

        try {
            const data = await apiCall('/auth/login', {
                method: 'POST',
                skipAuth: true,
                body: JSON.stringify({ email, password })
            });

            setAuthState(data);
            state.userEmail = email;
            localStorage.setItem('user_email', email);

            showToast('Welcome back!');
            updateAuthUI();
            navigateTo('products');

            // Reset form
            e.target.reset();
        } catch (error) {
            showMessage('authMessage', error.message, 'error');
        } finally {
            setButtonLoading(button, false);
        }
    });

    // Register form
    document.getElementById('registerForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const button = e.target.querySelector('button[type="submit"]');
        const firstName = document.getElementById('regFirstName').value;
        const lastName = document.getElementById('regLastName').value;
        const email = document.getElementById('regEmail').value;
        const password = document.getElementById('regPassword').value;
        const passwordRepeat = document.getElementById('regPasswordRepeat').value;
        const role = document.querySelector('input[name="role"]:checked').value;

        // Validate passwords match
        if (password !== passwordRepeat) {
            showMessage('authMessage', 'Passwords do not match', 'error');
            return;
        }

        setButtonLoading(button, true);

        try {
            const data = await apiCall('/auth/register', {
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

            setAuthState(data);
            state.userEmail = email;
            localStorage.setItem('user_email', email);

            showToast('Account created successfully!');
            updateAuthUI();
            navigateTo('products');

            // Reset form
            e.target.reset();
        } catch (error) {
            showMessage('authMessage', error.message, 'error');
        } finally {
            setButtonLoading(button, false);
        }
    });
}

export { isAuthenticated, setAuthState, logout, updateAuthUI, initAuthHandlers };
