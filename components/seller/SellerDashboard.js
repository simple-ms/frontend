/**
 * Seller Dashboard Component
 * 
 * Main dashboard for sellers showing products and orders.
 */
import { Component } from '../base/Component.js';
import { sellerService } from '../../services/index.js';
import { OrderCard } from '../orders/OrderCard.js';
import { toast } from '../base/Toast.js';
import { Modal } from '../base/Modal.js';
import { formatCurrency } from '../../utils/formatters.js';
import { escapeHTML } from '../../utils/security.js';

export class SellerDashboard extends Component {
    constructor(container) {
        super(container);

        this.state = {
            products: [],
            orders: [],
            stats: {},
            isLoading: false,
            error: null
        };

        this.orderCards = [];
    }

    async loadDashboard() {
        this.setState({ isLoading: true, error: null });

        try {
            const data = await sellerService.getDashboardData();
            this.setState({
                products: data.products,
                orders: data.orders,
                stats: data.stats,
                isLoading: false
            });
        } catch (error) {
            this.setState({ error: error.message, isLoading: false });
            toast.error('Failed to load dashboard');
        }
    }

    render() {
        const { products, orders, stats, isLoading, error } = this.state;

        if (isLoading) {
            this.container.innerHTML = `
                <div class="loading-state">
                    <div class="spinner"></div>
                    <p>Loading dashboard...</p>
                </div>
            `;
            return;
        }

        if (error) {
            this.container.innerHTML = `
                <div class="error-state">
                    <p>${error}</p>
                    <button class="btn btn-primary" data-retry>Try Again</button>
                </div>
            `;
            return;
        }

        this.container.innerHTML = `
            <div class="seller-dashboard">
                <div class="dashboard-header">
                    <h1>Seller Dashboard</h1>
                    <button class="btn btn-primary" data-add-product>Add Product</button>
                </div>

                <div class="dashboard-stats">
                    <div class="stat-card">
                        <div class="stat-label">Total Products</div>
                        <div class="stat-value">${stats.totalProducts || 0}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">Total Orders</div>
                        <div class="stat-value">${stats.totalOrders || 0}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">Pending Orders</div>
                        <div class="stat-value">${stats.pendingOrders || 0}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">Total Revenue</div>
                        <div class="stat-value">${formatCurrency(stats.totalRevenue || 0)}</div>
                    </div>
                </div>

                <div class="dashboard-section">
                    <h2>My Products</h2>
                    ${products.length === 0 ? `
                        <div class="empty-state">
                            <p>No products yet. Add your first product!</p>
                        </div>
                    ` : `
                        <div class="products-grid">
                            ${products.map(product => `
                                <div class="product-item">
                                    <h3>${escapeHTML(product.name)}</h3>
                                    <p>${escapeHTML(product.description || '')}</p>
                                    <div class="product-meta">
                                        <span>${formatCurrency(product.price)}</span>
                                        <span>Stock: ${parseInt(product.stock_quantity) || 0}</span>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    `}
                </div>

                <div class="dashboard-section">
                    <h2>Recent Orders</h2>
                    ${orders.length === 0 ? `
                        <div class="empty-state">
                            <p>No orders yet</p>
                        </div>
                    ` : `
                        <div class="orders-list">
                            ${orders.map(order => `
                                <div class="order-card-container" data-order-id="${order.id}"></div>
                            `).join('')}
                        </div>
                    `}
                </div>
            </div>
        `;

        // Mount order cards
        this.orderCards = orders.map(order => {
            const cardContainer = this.container.querySelector(`[data-order-id="${order.id}"]`);
            if (cardContainer) {
                const card = new OrderCard(cardContainer);
                card.setProps({ order, showActions: true });
                card.onApprove = (order) => this.handleApprove(order);
                card.onReject = (order) => this.handleReject(order);
                card.mount();
                return card;
            }
            return null;
        }).filter(Boolean);
    }

    attachEventListeners() {
        const addProductBtn = this.$('[data-add-product]');
        if (addProductBtn) {
            this.addEventListener(addProductBtn, 'click', () => {
                if (this.onAddProduct) {
                    this.onAddProduct();
                }
            });
        }

        const retryBtn = this.$('[data-retry]');
        if (retryBtn) {
            this.addEventListener(retryBtn, 'click', () => this.loadDashboard());
        }
    }

    async handleApprove(order) {
        const confirmed = await Modal.confirm(`Approve order #${order.id.slice(0, 8)}?`);
        if (confirmed) {
            try {
                await sellerService.approveOrder(order.id);
                toast.success('Order approved');
                this.loadDashboard();
            } catch (error) {
                toast.error('Failed to approve order');
            }
        }
    }

    async handleReject(order) {
        const confirmed = await Modal.confirm(`Reject order #${order.id.slice(0, 8)}?`);
        if (confirmed) {
            try {
                await sellerService.rejectOrder(order.id);
                toast.success('Order rejected');
                this.loadDashboard();
            } catch (error) {
                toast.error('Failed to reject order');
            }
        }
    }

    afterMount() {
        this.loadDashboard();
    }

    beforeUnmount() {
        this.orderCards.forEach(card => card?.unmount());
        this.orderCards = [];
    }
}
