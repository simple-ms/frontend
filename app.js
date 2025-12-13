/**
 * Modern Application Entry Point
 * Main Application Controller
 * 
 * Orchestrates components and handles routing.
 */
import { router } from './core/router.js';
import { state } from './core/state.js';
import { authService } from './services/auth.service.js';
import { eventBus, Events } from './core/eventBus.js';
import { logger } from './utils/logger.js';
import { toast } from './components/base/Toast.js'; // Ensure Toast is initialized

// Components
import { LoginForm } from './components/auth/LoginForm.js';
import { RegisterForm } from './components/auth/RegisterForm.js';
import { ProductGrid } from './components/products/ProductGrid.js';
import { OrderList } from './components/orders/OrderList.js';
import { SellerDashboard } from './components/seller/SellerDashboard.js';

class Application {
    constructor() {
        this.routes = {
            '/': () => this.showPage('mainPage'),
            '/auth': () => this.showPage('authPage'),
            '/products': () => this.showPage('productsPage'),
            '/orders': () => this.showPage('ordersPage'),
            '/addresses': () => this.showPage('addressesPage'),
            '/seller-dashboard': () => this.showPage('sellerDashboardPage')
        };

        this.currentPageId = 'mainPage';
        this.isInitialized = false;

        // Component Instances
        this.loginForm = null;
        this.registerForm = null;
        this.productGrid = null;
        this.orderList = null;
        this.sellerDashboard = null;
    }

    async init() {
        if (this.isInitialized) {
            logger.warn('[App] Already initialized');
            return;
        }

        logger.info('[App] Initializing modern application');

        try {
            // Security initialization
            this.initializeSecurity();

            // Initialize components
            this.initializeComponents();

            // Setup event listeners
            this.setupEventListeners();

            // Setup global error handlers
            this.setupErrorHandlers();

            // Check authentication
            await this.checkAuth();

            // Setup routes
            this.setupRoutes();

            // Start router
            router.handleRoute();

            this.isInitialized = true;
            logger.info('[App] Application initialized successfully');

            // Show welcome toast
            toast.success('Application loaded', { duration: 2000 });
        } catch (error) {
            logger.error('[App] Initialization failed:', error);
            toast.error('Failed to initialize application');
        }
    }

    /**
     * Initialize security measures
     */
    initializeSecurity() {
        // Initialize CSRF protection
        import('./utils/security.js').then(({ initCSRF }) => {
            initCSRF();
            logger.info('[Security] CSRF protection initialized');
        });

        // Prevent clickjacking
        import('./utils/security.js').then(({ preventClickjacking }) => {
            preventClickjacking();
        });
    }

    /**
     * Setup global error handlers
     */
    setupErrorHandlers() {
        // Global error handler
        window.addEventListener('error', (event) => {
            logger.error('[Global] Uncaught error:', event.error);
            toast.error('Something went wrong. Please refresh the page.');
            event.preventDefault();
        });

        // Unhandled promise rejection handler
        window.addEventListener('unhandledrejection', (event) => {
            logger.error('[Global] Unhandled promise rejection:', event.reason);
            toast.error('An error occurred. Please try again.');
            event.preventDefault();
        });

        // Offline/Online detection
        window.addEventListener('offline', () => {
            toast.warning('You are offline. Some features may not work.');
        });

        window.addEventListener('online', () => {
            toast.success('Connection restored');
        });

        logger.info('[App] Error handlers initialized');
    }

    /**
     * Setup routes
     */
    setupRoutes() {
        Object.entries(this.routes).forEach(([path, handler]) => {
            router.register(path, handler);
        });
    }

    /**
     * Check authentication status
     */
    async checkAuth() {
        // Auth service already initializes from storage in constructor
        if (authService.isAuthenticated()) {
            this.onAuthChange(true);
        }
    }

    initializeComponents() {
        // Auth Components
        const loginContainer = document.getElementById('loginContainer');
        if (loginContainer) {
            this.loginForm = new LoginForm(loginContainer);
            this.loginForm.onSwitchToRegister = () => this.switchAuthTab('register');
            this.loginForm.mount();
        }

        const registerContainer = document.getElementById('registerContainer');
        if (registerContainer) {
            this.registerForm = new RegisterForm(registerContainer);
            this.registerForm.onSwitchToLogin = () => this.switchAuthTab('login');
            this.registerForm.mount();
        }

        // Feature Components
        const productsGridContainer = document.getElementById('productsGrid');
        if (productsGridContainer) {
            this.productGrid = new ProductGrid(productsGridContainer);
        }

        const ordersListContainer = document.getElementById('ordersList');
        if (ordersListContainer) {
            this.orderList = new OrderList(ordersListContainer);
        }

        const sellerDashboardContainer = document.getElementById('sellerDashboardPage');
        if (sellerDashboardContainer) {
            this.sellerDashboard = new SellerDashboard(sellerDashboardContainer);
        }
    }

    setupEventListeners() {
        // Navigation Buttons
        this.bindClick('navBrand', (e) => {
            e.preventDefault();
            router.navigate('/');
        });
        this.bindClick('heroShopBtn', () => router.navigate('/products'));
        this.bindClick('heroAuthBtn', () => router.navigate('/auth'));

        // Auth Link (Profile Toggle or Sign In)
        this.bindClick('authLink', (e) => {
            e.preventDefault();
            if (authService.isAuthenticated()) {
                const userMenu = document.getElementById('userMenu');
                if (userMenu) userMenu.classList.toggle('hidden');
            } else {
                router.navigate('/auth');
            }
        });

        // Logout Button
        this.bindClick('logoutBtn', async () => {
            await authService.logout();
            const userMenu = document.getElementById('userMenu');
            if (userMenu) userMenu.classList.add('hidden');
            router.navigate('/');
        });

        // Navigation Menu Links
        document.querySelectorAll('.nav-link[data-page]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                router.navigate('/' + link.dataset.page);
            });
        });

        // Auth Tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.switchAuthTab(btn.dataset.tab);
            });
        });

        // Global Events
        eventBus.on(Events.AUTH_LOGIN, () => {
            this.onAuthChange(true);
            router.navigate('/'); // Navigate to home on login
        });

        eventBus.on(Events.AUTH_LOGOUT, () => this.onAuthChange(false));

        // Handle Registration Success (Switch to login and prefill)
        eventBus.on(Events.AUTH_REGISTER_SUCCESS, ({ email }) => {
            this.switchAuthTab('login');
            // Timeout to allow UI update if needed, though form is mounted
            setTimeout(() => {
                const emailInput = document.getElementById('email'); // LoginForm ID is 'email'
                if (emailInput) {
                    emailInput.value = email;
                    emailInput.focus();
                }
            }, 100);
        });
    }

    bindClick(id, handler) {
        const el = document.getElementById(id);
        if (el) el.addEventListener('click', handler);
    }

    // --- Page Management ---

    showPage(pageId) {
        // Hide all pages
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });

        // Show requested page
        const page = document.getElementById(pageId);
        if (page) {
            page.classList.add('active');
            this.currentPageId = pageId;

            // Refresh component data if applicable
            this.refreshPageData(pageId);
        }

        // Close user menu if open
        const userMenu = document.getElementById('userMenu');
        if (userMenu) userMenu.classList.add('hidden');
    }

    refreshPageData(pageId) {
        switch (pageId) {
            case 'productsPage':
                if (this.productGrid && !this.productGrid.isMounted()) {
                    this.productGrid.mount();
                } else if (this.productGrid) {
                    this.productGrid.loadProducts();
                }
                break;
            case 'ordersPage':
                if (this.orderList && !this.orderList.isMounted()) {
                    this.orderList.mount();
                } else if (this.orderList) {
                    this.orderList.loadOrders();
                }
                break;
            case 'sellerDashboardPage':
                if (this.sellerDashboard && !this.sellerDashboard.isMounted()) {
                    this.sellerDashboard.mount();
                } else if (this.sellerDashboard) {
                    this.sellerDashboard.loadDashboard();
                }
                break;
        }
    }

    // --- Auth Logic ---

    switchAuthTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        // Toggle containers
        const loginContainer = document.getElementById('loginContainer');
        const registerContainer = document.getElementById('registerContainer');

        if (tabName === 'login') {
            if (loginContainer) loginContainer.classList.remove('hidden');
            if (registerContainer) registerContainer.classList.add('hidden');
            // Update header title
            const authTitle = document.getElementById('authTitle');
            if (authTitle) authTitle.textContent = 'Welcome back';
        } else {
            if (loginContainer) loginContainer.classList.add('hidden');
            if (registerContainer) registerContainer.classList.remove('hidden');
            const authTitle = document.getElementById('authTitle');
            if (authTitle) authTitle.textContent = 'Create Account';
        }
    }

    onAuthChange(isAuthenticated) {
        const authLink = document.getElementById('authLink');
        const userMenu = document.getElementById('userMenu');

        // Navigation Links Visibility
        const protectedLinks = ['ordersLink', 'addressesLink'];
        protectedLinks.forEach(id => {
            const link = document.getElementById(id);
            if (link) {
                if (isAuthenticated) link.classList.remove('hidden');
                else link.classList.add('hidden');
            }
        });

        // Seller Dashboard Visibility
        const sellerLink = document.getElementById('sellerDashboardLink');
        if (sellerLink) {
            if (isAuthenticated && authService.hasRole('seller')) {
                sellerLink.classList.remove('hidden');
            } else {
                sellerLink.classList.add('hidden');
            }
        }

        // Auth Link / User Menu
        if (isAuthenticated) {
            if (authLink) {
                authLink.innerHTML = `
                    <span class="user-email">${authService.state.get('userEmail') || 'Profile'}</span>
                    <span class="nav-icon">▼</span>
                `;
            }

            // Populate User Menu
            const userEmailEl = document.getElementById('userEmail');
            const userRoleEl = document.getElementById('userRole');
            if (userEmailEl) userEmailEl.textContent = authService.state.get('userEmail');
            if (userRoleEl) userRoleEl.textContent = authService.hasRole('seller') ? 'Seller Account' : 'Buyer Account';

        } else {
            if (authLink) {
                authLink.innerHTML = '<span>Sign In</span>';
            }
        }


    }
}

const app = new Application();
document.addEventListener('DOMContentLoaded', () => app.init());
window.app = app;
