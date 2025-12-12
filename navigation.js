// ===========================================
// Navigation Functions
// ===========================================

import { state } from './config.js';
import { isAuthenticated } from './auth.js';
import { loadProducts } from './products.js';
import { loadOrders } from './orders.js';
import { loadAddresses } from './addresses.js';
import { showToast } from './utils.js';
import { logger } from './logger.js';

function navigateTo(pageName) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });

    // Convert kebab-case to camelCase for page ID
    // 'seller-dashboard' -> 'sellerDashboard' -> 'sellerDashboardPage'
    const pageId = pageName.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
    const targetPage = document.getElementById(`${pageId}Page`);

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
            case 'seller-dashboard':
                if (isAuthenticated()) {
                    import('./seller.js').then(module => {
                        module.loadSellerDashboard();
                    }).catch(err => {
                        logger.error('[Navigation] Failed to load seller.js:', err);
                    });
                }
                break;
            case 'main':
                // Main page doesn't need data loading
                break;
        }
    } else {
        logger.error(`[Navigation] Target page not found: ${pageName}`);
    }
}

function updateNavigationForRole(role) {
    const sellerDashboardLink = document.getElementById('sellerDashboardLink');
    const ordersLink = document.getElementById('ordersLink');
    const addressesLink = document.getElementById('addressesLink');

    if (role === 'seller') {
        // Show seller dashboard, hide buyer menus
        sellerDashboardLink?.classList.remove('hidden');
        ordersLink?.classList.add('hidden');
        addressesLink?.classList.add('hidden');
    } else {
        // Show buyer menus, hide seller dashboard
        sellerDashboardLink?.classList.add('hidden');
        ordersLink?.classList.remove('hidden');
        addressesLink?.classList.remove('hidden');
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

export { navigateTo, initNavigationHandlers, updateNavigationForRole };
