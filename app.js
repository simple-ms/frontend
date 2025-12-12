// ===========================================
// SIMPLEX - Frontend Application (Main Entry Point)
// ===========================================

import { state } from './config.js';
import { isAuthenticated, updateAuthUI, initAuthHandlers } from './auth.js';
import { navigateTo, initNavigationHandlers } from './navigation.js';
import { createOrder, initProductHandlers, editProduct, deleteProduct } from './products.js';
import { deleteAddress, initAddressHandlers } from './addresses.js';
import { logger } from './logger.js';

// Make functions globally available for onclick handlers
window.createOrder = createOrder;
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
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

    // Initialize auth handlers first
    initAuthHandlers();

    // Update UI BEFORE attaching navigation handlers
    // This ensures buttons are visible when we attach event listeners
    updateAuthUI();

    // NOW attach navigation handlers (after buttons are visible)
    initNavigationHandlers();

    // Initialize other handlers
    initProductHandlers();
    initAddressHandlers();
    initMainPageHandlers();

    // Always start at main page
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
