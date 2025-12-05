// ===========================================
// Navigation Functions
// ===========================================

import { state } from './config.js';
import { isAuthenticated } from './auth.js';
import { loadProducts } from './products.js';
import { loadOrders } from './orders.js';
import { loadAddresses } from './addresses.js';
import { showToast } from './utils.js';

function navigateTo(pageName) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });

    const targetPage = document.getElementById(`${pageName}Page`);
    if (targetPage) {
        targetPage.classList.add('active');
        state.currentPage = pageName;

        // Load page data
        switch (pageName) {
            case 'products':
                loadProducts();
                break;
            case 'orders':
                if (isAuthenticated()) loadOrders();
                break;
            case 'addresses':
                if (isAuthenticated()) loadAddresses();
                break;
            case 'main':
                // Main page doesn't need data loading
                break;
        }
    }
}

function initNavigationHandlers() {
    // Brand link - navigates to main page
    const brandLink = document.querySelector('.nav-brand');
    if (brandLink) {
        brandLink.addEventListener('click', (e) => {
            e.preventDefault();
            navigateTo('main');
        });
    }

    // Navigation Links
    document.querySelectorAll('.nav-link[data-page]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.dataset.page;

            if (!isAuthenticated() && page !== 'products' && page !== 'main') {
                showToast('Please sign in to access this page', 'error');
                navigateTo('auth');
                return;
            }

            navigateTo(page);
        });
    });
}

export { navigateTo, initNavigationHandlers };
