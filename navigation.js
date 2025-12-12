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
    logger.info(`[Navigation] navigateTo called with: ${pageName}`);

    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });

    // Convert kebab-case to camelCase for page ID
    // 'seller-dashboard' -> 'sellerDashboard' -> 'sellerDashboardPage'
    const pageId = pageName.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
    const targetPage = document.getElementById(`${pageId}Page`);
    logger.info(`[Navigation] Looking for page ID: ${pageId}Page`);
    logger.info(`[Navigation] Target page element found: ${!!targetPage}`);

    if (targetPage) {
        targetPage.classList.add('active');
        state.currentPage = pageName;
        logger.info(`[Navigation] Page activated: ${pageName}`);

        // Load page data
        switch (pageName) {
            case 'products':
                logger.info('[Navigation] Loading products');
                loadProducts();
                break;
            case 'orders':
                if (isAuthenticated()) {
                    logger.info('[Navigation] Loading orders');
                    loadOrders();
                }
                break;
            case 'addresses':
                if (isAuthenticated()) {
                    logger.info('[Navigation] Loading addresses');
                    loadAddresses();
                }
                break;
            case 'seller-dashboard':
                logger.info('[Navigation] Loading seller dashboard');
                if (isAuthenticated()) {
                    logger.info('[Navigation] User authenticated, importing seller.js');
                    import('./seller.js').then(module => {
                        logger.info('[Navigation] seller.js loaded, calling loadSellerDashboard');
                        module.loadSellerDashboard();
                    }).catch(err => {
                        logger.error('[Navigation] Failed to load seller.js:', err);
                    });
                } else {
                    logger.warn('[Navigation] User not authenticated for seller dashboard');
                }
                break;
            case 'main':
                // Main page doesn't need data loading
                logger.info('[Navigation] Main page loaded');
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

    logger.info(`[Navigation] updateNavigationForRole called with role: ${role}`);
    logger.info(`[Navigation] sellerDashboardLink element:`, sellerDashboardLink);

    if (sellerDashboardLink) {
        logger.info(`[Navigation] sellerDashboardLink classes: ${sellerDashboardLink.className}`);
        logger.info(`[Navigation] sellerDashboardLink computed display: ${window.getComputedStyle(sellerDashboardLink).display}`);
        logger.info(`[Navigation] sellerDashboardLink computed visibility: ${window.getComputedStyle(sellerDashboardLink).visibility}`);
        logger.info(`[Navigation] sellerDashboardLink offsetParent: ${sellerDashboardLink.offsetParent}`);
    }

    if (role === 'seller') {
        // Show seller dashboard, hide buyer menus
        logger.info('[Navigation] User is SELLER - showing seller dashboard');
        sellerDashboardLink?.classList.remove('hidden');
        ordersLink?.classList.add('hidden');
        addressesLink?.classList.add('hidden');

        // Add direct click handler as test
        if (sellerDashboardLink) {
            logger.info('[Navigation] Adding direct click handler to seller dashboard button');
            sellerDashboardLink.addEventListener('click', (e) => {
                logger.info('[Navigation] DIRECT HANDLER - Seller dashboard clicked!');
                e.preventDefault();
                navigateTo('seller-dashboard');
            }, { once: false });
        }

        logger.info(`[Navigation] After update - sellerDashboardLink classes: ${sellerDashboardLink?.className}`);
    } else {
        // Show buyer menus, hide seller dashboard
        logger.info('[Navigation] User is BUYER - hiding seller dashboard');
        sellerDashboardLink?.classList.add('hidden');
        ordersLink?.classList.remove('hidden');
        addressesLink?.classList.remove('hidden');
    }
}

function initNavigationHandlers() {
    logger.info('[Navigation] initNavigationHandlers called');

    // Brand link - navigates to main page
    const brandLink = document.querySelector('.nav-brand');
    if (brandLink) {
        brandLink.addEventListener('click', (e) => {
            e.preventDefault();
            navigateTo('main');
        });
    }

    // Navigation Links
    const navLinks = document.querySelectorAll('.nav-link[data-page]');
    logger.info(`[Navigation] Found ${navLinks.length} nav links with data-page attribute`);

    navLinks.forEach((link, index) => {
        const page = link.dataset.page;
        logger.info(`[Navigation] Attaching listener to link ${index}: ${page}, id: ${link.id}, classes: ${link.className}`);

        link.addEventListener('click', (e) => {
            e.preventDefault();
            logger.info(`[Navigation] Nav link clicked: ${page}`);
            logger.info(`[Navigation] Link classes: ${link.className}`);

            if (!isAuthenticated() && page !== 'products' && page !== 'main') {
                logger.info('[Navigation] User not authenticated, redirecting to auth');
                showToast('Please sign in to access this page', 'error');
                navigateTo('auth');
                return;
            }

            logger.info(`[Navigation] Navigating to: ${page}`);
            navigateTo(page);
        });
    });

    logger.info('[Navigation] All navigation handlers attached');
}

export { navigateTo, initNavigationHandlers, updateNavigationForRole };
