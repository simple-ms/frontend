/**
 * Navigation Component
 * 
 * Main navigation bar with role-based menu items.
 */
import { Component } from '../base/Component.js';
import { authService } from '../../services/index.js';
import { router } from '../../core/router.js';
import { state } from '../../core/state.js';
import { escapeHTML } from '../../utils/security.js';

export class Navigation extends Component {
    constructor(container) {
        super(container);

        this.state = {
            isAuthenticated: false,
            userRole: null,
            userEmail: null,
            currentPath: '/'
        };
    }

    render() {
        const { isAuthenticated, userRole, userEmail, currentPath } = this.state;

        this.container.innerHTML = `
            <nav class="main-nav">
                <div class="nav-container">
                    <a href="/" class="nav-brand" data-route="/">
                        <span class="brand-logo">SIMPLEX</span>
                    </a>

                    <div class="nav-menu">
                        <a href="/products" class="nav-link ${currentPath === '/products' ? 'active' : ''}" data-route="/products">
                            Products
                        </a>

                        ${isAuthenticated ? `
                            ${userRole === 'seller' ? `
                                <a href="/seller" class="nav-link ${currentPath === '/seller' ? 'active' : ''}" data-route="/seller">
                                    Seller Dashboard
                                </a>
                            ` : `
                                <a href="/orders" class="nav-link ${currentPath === '/orders' ? 'active' : ''}" data-route="/orders">
                                    Orders
                                </a>
                                <a href="/addresses" class="nav-link ${currentPath === '/addresses' ? 'active' : ''}" data-route="/addresses">
                                    Addresses
                                </a>
                            `}
                        ` : ''}
                    </div>

                    <div class="nav-actions">
                        ${isAuthenticated ? `
                            <div class="user-menu">
                                <button class="user-menu-trigger" data-user-menu>
                                    <span class="user-email">${escapeHTML(userEmail || 'User')}</span>
                                    <span class="user-role-badge">${escapeHTML(userRole || '')}</span>
                                </button>
                                <div class="user-menu-dropdown" data-user-dropdown>
                                    <button class="user-menu-item" data-logout>Sign Out</button>
                                </div>
                            </div>
                        ` : `
                            <a href="/auth" class="btn btn-primary" data-route="/auth">Sign In</a>
                        `}
                    </div>
                </div>
            </nav>
        `;
    }

    attachEventListeners() {
        // Navigation links
        this.$$('[data-route]').forEach(link => {
            this.addEventListener(link, 'click', (e) => {
                e.preventDefault();
                const path = link.getAttribute('data-route') || link.getAttribute('href');
                router.navigate(path);
            });
        });

        // User menu toggle
        const userMenuTrigger = this.$('[data-user-menu]');
        if (userMenuTrigger) {
            this.addEventListener(userMenuTrigger, 'click', () => {
                const dropdown = this.$('[data-user-dropdown]');
                dropdown?.classList.toggle('active');
            });
        }

        // Logout
        const logoutBtn = this.$('[data-logout]');
        if (logoutBtn) {
            this.addEventListener(logoutBtn, 'click', async () => {
                await authService.logout();
                this.updateAuthState();
            });
        }

        // Close dropdown when clicking outside
        this.addEventListener(document, 'click', (e) => {
            const dropdown = this.$('[data-user-dropdown]');
            const trigger = this.$('[data-user-menu]');
            if (dropdown && !trigger?.contains(e.target) && !dropdown.contains(e.target)) {
                dropdown.classList.remove('active');
            }
        });
    }

    /**
     * Update authentication state
     */
    updateAuthState() {
        this.setState({
            isAuthenticated: authService.isAuthenticated(),
            userRole: authService.getUserRole(),
            userEmail: state.get('userEmail'),
            currentPath: router.getCurrentPath()
        });
    }

    /**
     * Update active link
     */
    updateActivePath(path) {
        this.setState({ currentPath: path });
    }

    afterMount() {
        // Subscribe to auth changes
        this._unsubscribeAuth = state.subscribe('token', () => {
            this.updateAuthState();
        });

        // Subscribe to route changes
        this._unsubscribeRoute = state.subscribe('currentPage', (newPath) => {
            this.updateActivePath(newPath);
        });

        // Initial state
        this.updateAuthState();
    }

    beforeUnmount() {
        // Cleanup subscriptions
        if (this._unsubscribeAuth) this._unsubscribeAuth();
        if (this._unsubscribeRoute) this._unsubscribeRoute();
    }
}
