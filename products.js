// ===========================================
// Products Page Functions
// ===========================================

import { apiCall } from './api.js';
import { isAuthenticated } from './auth.js';
import { showToast, setButtonLoading, formatPrice, escapeHtml } from './utils.js';
import { navigateTo } from './navigation.js';

async function loadProducts() {
    const grid = document.getElementById('productsGrid');

    // Show skeleton
    grid.innerHTML = `
        <div class="skeleton-loader">
            <div class="skeleton-card"></div>
            <div class="skeleton-card"></div>
            <div class="skeleton-card"></div>
        </div>
    `;

    try {
        const products = await apiCall('/products', { skipAuth: true });

        if (products.length === 0) {
            grid.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1;">
                    <div class="empty-icon">⬡</div>
                    <h3 class="empty-title">No products yet</h3>
                    <p class="empty-text">Products will appear here once they're added to the catalog.</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = products.map(product => {
            const stockLevel = product.stock > 10 ? '' : product.stock > 0 ? 'low' : 'out';
            const stockText = product.stock > 0 ? `${product.stock} in stock` : 'Out of stock';

            return `
                <div class="product-card">
                    <div class="product-header">
                        <h3 class="product-name">${escapeHtml(product.name)}</h3>
                        <span class="product-id">#${product.id}</span>
                    </div>
                    <div class="product-price">${formatPrice(product.price)}</div>
                    <div class="product-stock">
                        <span class="stock-dot ${stockLevel}"></span>
                        <span>${stockText}</span>
                    </div>
                    ${isAuthenticated() && product.stock > 0 ? `
                        <div class="product-actions">
                            <input type="number" class="quantity-input" value="1" min="1" max="${product.stock}" id="qty-${product.id}">
                            <button class="btn btn-primary btn-small" onclick="window.createOrder(${product.id}, event)">
                                <span class="btn-text">Buy Now</span>
                                <span class="btn-loader"></span>
                            </button>
                        </div>
                    ` : !isAuthenticated() ? `
                        <p class="product-login-prompt">Sign in to purchase</p>
                    ` : `
                        <p class="product-login-prompt">Currently unavailable</p>
                    `}
                </div>
            `;
        }).join('');
    } catch (error) {
        grid.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <div class="empty-icon">⚠</div>
                <h3 class="empty-title">Failed to load products</h3>
                <p class="empty-text">${escapeHtml(error.message)}</p>
            </div>
            `;
    }
}

async function createOrder(productId, event) {
    const qtyInput = document.getElementById(`qty-${productId}`);
    if (!qtyInput) {
        showToast('Could not find quantity input', 'error');
        return;
    }
    
    const quantity = parseInt(qtyInput.value) || 1;
    const button = event?.target?.closest('button') || event?.currentTarget;

    if (button) {
        setButtonLoading(button, true);
    }

    try {
        await apiCall('/order', {
            method: 'POST',
            body: JSON.stringify({ product_id: productId, quantity })
        });

        showToast('Order created successfully!');
        
        // Refresh products to update stock and navigate to orders
        loadProducts();
        setTimeout(() => {
            navigateTo('orders');
        }, 500);
    } catch (error) {
        showToast(error.message, 'error');
    } finally {
        if (button) {
            setButtonLoading(button, false);
        }
    }
}

function initProductHandlers() {
    // Add Product Modal
    document.getElementById('addProductBtn').addEventListener('click', () => {
        document.getElementById('addProductModal').classList.add('active');
    });

    document.querySelectorAll('.modal-close, .modal-backdrop').forEach(el => {
        el.addEventListener('click', (e) => {
            if (e.target === el) {
                el.closest('.modal').classList.remove('active');
            }
        });
    });

    // Close modal on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal.active').forEach(modal => {
                modal.classList.remove('active');
            });
        }
    });

    document.getElementById('addProductForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const button = e.target.querySelector('button[type="submit"]');
        const name = document.getElementById('productName').value;
        const price = parseFloat(document.getElementById('productPrice').value);
        const stock = parseInt(document.getElementById('productStock').value);

        setButtonLoading(button, true);

        try {
            await apiCall('/product', {
                method: 'POST',
                body: JSON.stringify({ name, price, stock })
            });

            showToast('Product added successfully!');
            document.getElementById('addProductModal').classList.remove('active');
            e.target.reset();
            loadProducts();
        } catch (error) {
            showToast(error.message, 'error');
        } finally {
            setButtonLoading(button, false);
        }
    });
}

export { loadProducts, createOrder, initProductHandlers };
