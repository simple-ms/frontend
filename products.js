// ===========================================
// Products Page Functions
// ===========================================

import { apiCall } from './api.js';
import { isAuthenticated } from './auth.js';
import { showToast, setButtonLoading, formatPrice, escapeHtml } from './utils.js';
import { navigateTo } from './navigation.js';
import { state } from './config.js';

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

        const currentUserId = state.userId;
        const isSeller = state.userRole === 'seller';

        // Debug logging
        console.log('Current User ID:', currentUserId);
        console.log('Is Seller:', isSeller);
        console.log('Products:', products.map(p => ({ id: p.id, name: p.name, seller_id: p.seller_id })));

        grid.innerHTML = products.map(product => {
            const stockLevel = product.stock > 10 ? '' : product.stock > 0 ? 'low' : 'out';
            const stockText = product.stock > 0 ? `${product.stock} in stock` : 'Out of stock';
            const isOwner = isSeller && product.seller_id === currentUserId;

            // Debug log for each product
            console.log(`Product ${product.id}: seller_id=${product.seller_id}, currentUserId=${currentUserId}, isOwner=${isOwner}`);

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
                    ${isOwner ? `
                        <div class="product-actions" style="gap: 0.5rem;">
                            <button class="btn btn-secondary btn-small" onclick="window.editProduct(${product.id}, event)" style="flex: 1;">
                                Edit
                            </button>
                            <button class="btn btn-danger btn-small" onclick="window.deleteProduct(${product.id}, event)" style="flex: 1;">
                                Delete
                            </button>
                        </div>
                    ` : isAuthenticated() && product.stock > 0 && !isSeller ? `
                        <div class="product-actions">
                            <input type="number" class="quantity-input" value="1" min="1" max="${product.stock}" id="qty-${product.id}">
                            <button class="btn btn-primary btn-small" onclick="window.createOrder(${product.id}, event)">
                                <span class="btn-text">Buy Now</span>
                                <span class="btn-loader"></span>
                            </button>
                        </div>
                    ` : !isAuthenticated() ? `
                        <p class="product-login-prompt">Sign in to purchase</p>
                    ` : isSeller ? `
                        <p class="product-login-prompt">Sellers cannot buy products</p>
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

    // Show address modal
    const addressModal = document.getElementById('addressModal');
    if (addressModal) {
        addressModal.classList.add('active');

        // Store product info for later
        window.pendingOrder = { productId, quantity, button };
        return;
    }

    if (button) {
        setButtonLoading(button, true);
    }

    try {
        await apiCall('/orders', {
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

async function confirmOrderWithAddress() {
    if (!window.pendingOrder) return;

    const { productId, quantity, button } = window.pendingOrder;
    const address = document.getElementById('orderAddress').value;
    const city = document.getElementById('orderCity').value;
    const postalCode = document.getElementById('orderPostalCode').value;
    const country = document.getElementById('orderCountry').value;

    if (!address || !city || !postalCode || !country) {
        showToast('Please fill in all address fields', 'error');
        return;
    }

    document.getElementById('addressModal').classList.remove('active');

    if (button) {
        setButtonLoading(button, true);
    }

    try {
        await apiCall('/orders', {
            method: 'POST',
            body: JSON.stringify({
                product_id: productId,
                quantity,
                shipping_address: address,
                city,
                postal_code: postalCode,
                country
            })
        });

        showToast('Order created successfully!');

        // Clear form
        document.getElementById('orderAddress').value = '';
        document.getElementById('orderCity').value = '';
        document.getElementById('orderPostalCode').value = '';
        document.getElementById('orderCountry').value = '';

        window.pendingOrder = null;

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

async function editProduct(productId, event) {
    const button = event?.target?.closest('button');

    try {
        // Fetch current product data
        const product = await apiCall(`/product/${productId}`, { skipAuth: true });

        // Populate edit modal
        document.getElementById('editProductId').value = product.id;
        document.getElementById('editProductName').value = product.name;
        document.getElementById('editProductPrice').value = product.price;
        document.getElementById('editProductStock').value = product.stock;

        // Show modal
        document.getElementById('editProductModal').classList.add('active');
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function deleteProduct(productId, event) {
    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
        return;
    }

    const button = event?.target?.closest('button');

    if (button) {
        setButtonLoading(button, true);
    }

    try {
        await apiCall(`/product/${productId}`, { method: 'DELETE' });
        showToast('Product deleted successfully!');
        loadProducts();
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
    document.getElementById('addProductBtn')?.addEventListener('click', () => {
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

    // Add Product Form
    document.getElementById('addProductForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const button = e.target.querySelector('button[type="submit"]');
        const name = document.getElementById('productName').value.trim();
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

    // Edit Product Form
    document.getElementById('editProductForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const button = e.target.querySelector('button[type="submit"]');
        const productId = document.getElementById('editProductId').value;
        const name = document.getElementById('editProductName').value.trim();
        const price = parseFloat(document.getElementById('editProductPrice').value);
        const stock = parseInt(document.getElementById('editProductStock').value);

        setButtonLoading(button, true);

        try {
            await apiCall(`/product/${productId}`, {
                method: 'PUT',
                body: JSON.stringify({ name, price, stock })
            });

            showToast('Product updated successfully!');
            document.getElementById('editProductModal').classList.remove('active');
            e.target.reset();
            loadProducts();
        } catch (error) {
            showToast(error.message, 'error');
        } finally {
            setButtonLoading(button, false);
        }
    });
}

export { loadProducts, createOrder, confirmOrderWithAddress, initProductHandlers, editProduct, deleteProduct };

