/**
 * Product Grid Component
 * 
 * Displays products in a responsive grid.
 */
import { Component } from '../base/Component.js';
import { ProductCard } from './ProductCard.js';
import { productService } from '../../services/index.js';
import { toast } from '../base/Toast.js';

export class ProductGrid extends Component {
    constructor(container) {
        super(container);

        this.state = {
            products: [],
            isLoading: false,
            error: null
        };

        this.productCards = [];
    }

    async loadProducts() {
        this.setState({ isLoading: true, error: null });

        try {
            const products = await productService.getProducts();
            this.setState({ products, isLoading: false });
        } catch (error) {
            this.setState({ error: error.message, isLoading: false });
            toast.error('Failed to load products');
        }
    }

    render() {
        const { products, isLoading, error } = this.state;

        if (isLoading) {
            this.container.innerHTML = `
                <div class="loading-state">
                    <div class="spinner"></div>
                    <p>Loading products...</p>
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

        if (products.length === 0) {
            this.container.innerHTML = `
                <div class="empty-state">
                    <p>No products found</p>
                </div>
            `;
            return;
        }

        this.container.innerHTML = `
            <div class="product-grid">
                ${products.map(product => `
                    <div class="product-card-container" data-product-id="${product.id}"></div>
                `).join('')}
            </div>
        `;

        // Mount product cards
        this.productCards = products.map(product => {
            const cardContainer = this.container.querySelector(`[data-product-id="${product.id}"]`);
            const card = new ProductCard(cardContainer);
            card.setProps({ product });
            card.mount();
            return card;
        });
    }

    attachEventListeners() {
        const retryBtn = this.$('[data-retry]');
        if (retryBtn) {
            this.addEventListener(retryBtn, 'click', () => this.loadProducts());
        }
    }

    afterMount() {
        this.loadProducts();
    }

    beforeUnmount() {
        // Unmount all product cards
        this.productCards.forEach(card => card.unmount());
        this.productCards = [];
    }
}
