/**
 * Product Card Component
 * 
 * Individual product card display.
 */
import { Component } from '../base/Component.js';
import { authService } from '../../services/index.js';
import { state } from '../../core/state.js';
import { formatCurrency } from '../../utils/formatters.js';
import { escapeHTML, sanitizeURL } from '../../utils/security.js';

export class ProductCard extends Component {
    constructor(container) {
        super(container);

        this.props = {
            product: null
        };
    }

    render() {
        const { product } = this.props;

        if (!product) {
            this.container.innerHTML = '';
            return;
        }

        const isOwner = authService.isAuthenticated() &&
            state.get('userId') === product.seller_id;
        const isSeller = authService.getUserRole() === 'seller';

        // Sanitize all user-generated content
        const safeName = escapeHTML(product.name || '');
        const safeDescription = escapeHTML(product.description || '');
        const safeImageUrl = product.image_url ? sanitizeURL(product.image_url) : null;

        this.container.innerHTML = `
            <div class="product-card">
                <div class="product-image">
                    ${safeImageUrl ?
                `<img src="${safeImageUrl}" alt="${safeName}" />` :
                `<div class="product-image-placeholder">${safeName[0] || 'P'}</div>`
            }
                </div>
                
                <div class="product-info">
                    <h3 class="product-name">${safeName}</h3>
                    <p class="product-description">${safeDescription}</p>
                    
                    <div class="product-footer">
                        <span class="product-price">${formatCurrency(product.price)}</span>
                        <span class="product-stock">Stock: ${parseInt(product.stock_quantity) || 0}</span>
                    </div>
                </div>

                <div class="product-actions">
                    ${isOwner ? `
                        <button class="btn btn-sm btn-secondary" data-edit>Edit</button>
                        <button class="btn btn-sm btn-danger" data-delete>Delete</button>
                    ` : !isSeller ? `
                        <button class="btn btn-sm btn-primary" data-add-to-cart ${product.stock_quantity === 0 ? 'disabled' : ''}>
                            ${product.stock_quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }

    attachEventListeners() {
        const editBtn = this.$('[data-edit]');
        const deleteBtn = this.$('[data-delete]');
        const addToCartBtn = this.$('[data-add-to-cart]');

        if (editBtn) {
            this.addEventListener(editBtn, 'click', () => {
                if (this.onEdit) this.onEdit(this.props.product);
            });
        }

        if (deleteBtn) {
            this.addEventListener(deleteBtn, 'click', () => {
                if (this.onDelete) this.onDelete(this.props.product);
            });
        }

        if (addToCartBtn) {
            this.addEventListener(addToCartBtn, 'click', () => {
                if (this.onAddToCart) this.onAddToCart(this.props.product);
            });
        }
    }
}
