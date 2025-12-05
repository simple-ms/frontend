// ===========================================
// SIMPLEX - Frontend Application (Main Entry Point)
// ===========================================

import { state } from './config.js';
import { isAuthenticated, updateAuthUI, initAuthHandlers } from './auth.js';
import { navigateTo, initNavigationHandlers } from './navigation.js';
import { createOrder, initProductHandlers } from './products.js';
import { deleteAddress, initAddressHandlers } from './addresses.js';
import { logger } from './logger.js';

// Make functions globally available for onclick handlers
window.createOrder = createOrder;
window.deleteAddress = deleteAddress;

// Make logger available for debugging
window.downloadLogs = () => logger.downloadLogs();
window.clearLogs = () => logger.clearLogs();
window.viewLogs = () => console.table(logger.getLogs());

// ===========================================
// INITIALIZATION
// ===========================================

function init() {
    logger.info('Initializing application');

    // Load email from storage
    state.userEmail = localStorage.getItem('user_email');

    // Initialize all handlers
    initAuthHandlers();
    initNavigationHandlers();
    initProductHandlers();
    initAddressHandlers();
    initMainPageHandlers();

    // Update UI and navigate
    updateAuthUI();

    // Always start at main page
    logger.info('Navigating to main page');
    navigateTo('main');

    logger.info('Application initialized successfully');
}

function initMainPageHandlers() {
    // Hero Shop button
    const heroShopBtn = document.getElementById('heroShopBtn');
    if (heroShopBtn) {
        heroShopBtn.addEventListener('click', () => {
            navigateTo('products');
        });
    }

    // Hero Auth button
    const heroAuthBtn = document.getElementById('heroAuthBtn');
    if (heroAuthBtn) {
        heroAuthBtn.addEventListener('click', () => {
            if (isAuthenticated()) {
                navigateTo('products');
            } else {
                navigateTo('auth');
            }
        });
    }
}

// Start the app
init();
