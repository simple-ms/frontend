/**
 * Order List Component
 * 
 * Displays list of orders.
 */
import { Component } from '../base/Component.js';
import { OrderCard } from './OrderCard.js';
import { orderService } from '../../services/index.js';
import { toast } from '../base/Toast.js';

export class OrderList extends Component {
    constructor(container) {
        super(container);

        this.state = {
            orders: [],
            isLoading: false,
            error: null
        };

        this.orderCards = [];
    }

    async loadOrders() {
        this.setState({ isLoading: true, error: null });

        try {
            const orders = await orderService.getOrders();
            this.setState({ orders, isLoading: false });
        } catch (error) {
            this.setState({ error: error.message, isLoading: false });
            toast.error('Failed to load orders');
        }
    }

    render() {
        const { orders, isLoading, error } = this.state;

        if (isLoading) {
            this.container.innerHTML = `
                <div class="loading-state">
                    <div class="spinner"></div>
                    <p>Loading orders...</p>
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

        if (orders.length === 0) {
            this.container.innerHTML = `
                <div class="empty-state">
                    <p>No orders yet</p>
                </div>
            `;
            return;
        }

        this.container.innerHTML = `
            <div class="order-list">
                ${orders.map(order => `
                    <div class="order-card-container" data-order-id="${order.id}"></div>
                `).join('')}
            </div>
        `;

        // Mount order cards
        this.orderCards = orders.map(order => {
            const cardContainer = this.container.querySelector(`[data-order-id="${order.id}"]`);
            const card = new OrderCard(cardContainer);
            card.setProps({ order });
            card.mount();
            return card;
        });
    }

    attachEventListeners() {
        const retryBtn = this.$('[data-retry]');
        if (retryBtn) {
            this.addEventListener(retryBtn, 'click', () => this.loadOrders());
        }
    }

    afterMount() {
        this.loadOrders();
    }

    beforeUnmount() {
        this.orderCards.forEach(card => card.unmount());
        this.orderCards = [];
    }
}
