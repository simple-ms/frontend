// ===========================================
// Seller Dashboard Functions
// ===========================================

import { state } from './config.js';
import { apiCall } from './api.js';
import { showToast } from './utils.js';
import { logger } from './logger.js';

async function loadSellerDashboard() {
    try {
        await Promise.all([
            loadSellerProducts(),
            loadSellerOrders()
        ]);
    } catch (error) {
        logger.error('[Seller] Error loading seller dashboard:', error);
    }
}

async function loadSellerProducts() {
    const grid = document.getElementById('sellerProductsGrid');

    try {
        logger.info('Fetching all products to filter seller products');
        const products = await apiCall('/products');

        // Filter to show only seller's products
        const myProducts = products.filter(p => p.seller_id === state.userId);

        if (myProducts.length === 0) {
            grid.innerHTML = '<p class="empty-state">You haven\'t created any products yet. Click "Add Product" to get started!</p>';
            return;
        }

        grid.innerHTML = myProducts.map(product => `
            <div class="product-card">
                <div class="product-info">
                    <h3 class="product-name">${product.name}</h3>
                    <p class="product-price">$${product.price.toFixed(2)}</p>
                    <p class="product-stock">Stock: ${product.stock}</p>
                </div>
                <div class="product-actions" style="display: flex; gap: 0.5rem; margin-top: 1rem;">
                    <button onclick="window.editProduct(${product.id})" class="btn btn-sm">Edit</button>
                    <button onclick="window.deleteProduct(${product.id})" class="btn btn-sm" style="background: #dc3545;">Delete</button>
                </div>
            </div>
        `).join('');

        logger.info(`Loaded ${myProducts.length} seller products`);
    } catch (error) {
        logger.error('Failed to load seller products', error);
        grid.innerHTML = '<p class="error-state">Failed to load products. Please try again.</p>';
        showToast('Failed to load products', 'error');
    }
}

async function loadSellerOrders() {
    const list = document.getElementById('sellerOrdersList');

    try {
        const orders = await apiCall('/orders/seller');

        if (orders.length === 0) {
            list.innerHTML = '<p class="empty-state">No orders yet for your products.</p>';
            return;
        }
        list.innerHTML = orders.map(order => {
            const isAwaitingApproval = order.status === 'AWAITING_APPROVAL';
            const statusColor = isAwaitingApproval ? 'rgba(255,165,0,0.3)' : 'rgba(0,255,0,0.2)';

            return `
            <div class="order-card" style="padding: 1.5rem; margin-bottom: 1rem; background: rgba(255,255,255,0.05); border-radius: 8px;">
                <div class="order-header" style="display: flex; justify-content: space-between; margin-bottom: 1rem;">
                    <div>
                        <strong>Order #${order.id}</strong>
                        <p style="margin: 0.25rem 0; opacity: 0.7;">Product ID: ${order.product_id}</p>
                    </div>
                    <span class="status status-${order.status.toLowerCase()}" style="padding: 0.25rem 0.75rem; border-radius: 4px; background: ${statusColor};">
                        ${order.status}
                    </span>
                </div>
                <div class="order-details" style="margin-bottom: 1rem;">
                    <p>Quantity: ${order.quantity}</p>
                    <p>Total: $${order.total_amount.toFixed(2)}</p>
                    <p>Customer: ${order.user_id}</p>
                </div>
                ${isAwaitingApproval ? `
                    <div style="display: flex; gap: 1rem; margin-bottom: 1rem;">
                        <button onclick="window.approveOrder('${order.id}')" class="btn btn-primary" style="flex: 1;">
                            ✓ Approve Order
                        </button>
                        <button onclick="window.rejectOrder('${order.id}')" class="btn" style="flex: 1; background: #dc3545;">
                            ✗ Reject Order
                        </button>
                    </div>
                ` : ''}
                <div style="display: flex; gap: 1rem; align-items: center;">
                    <label for="status-${order.id}">Update Status:</label>
                    <select id="status-${order.id}" onchange="window.updateOrderStatus('${order.id}', this.value)" class="form-control" style="flex: 1;" ${isAwaitingApproval ? 'disabled' : ''}>
                        <option value="AWAITING_APPROVAL" ${order.status === 'AWAITING_APPROVAL' ? 'selected' : ''}>Awaiting Approval</option>
                        <option value="PENDING" ${order.status === 'PENDING' ? 'selected' : ''}>Pending</option>
                        <option value="PROCESSING" ${order.status === 'PROCESSING' ? 'selected' : ''}>Processing</option>
                        <option value="SHIPPED" ${order.status === 'SHIPPED' ? 'selected' : ''}>Shipped</option>
                        <option value="DELIVERED" ${order.status === 'DELIVERED' ? 'selected' : ''}>Delivered</option>
                        <option value="CANCELLED" ${order.status === 'CANCELLED' ? 'selected' : ''}>Cancelled</option>
                    </select>
                </div>
            </div>
        `;
        }).join('');

        logger.info(`Loaded ${orders.length} seller orders`);
    } catch (error) {
        logger.error('Failed to load seller orders', error);
        list.innerHTML = '<p class="error-state">Failed to load orders. Please try again.</p>';
        showToast('Failed to load orders', 'error');
    }
}

async function updateOrderStatus(orderId, newStatus) {
    try {
        logger.info(`Updating order ${orderId} status to ${newStatus}`);

        await apiCall(`/orders/${orderId}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status: newStatus })
        });

        showToast('Order status updated successfully');
        await loadSellerOrders(); // Reload orders
    } catch (error) {
        logger.error('Failed to update order status', error);
        showToast('Failed to update order status', 'error');
        await loadSellerOrders(); // Reload to reset dropdown
    }
}

async function approveOrder(orderId) {
    try {
        logger.info(`Approving order ${orderId}`);

        await apiCall(`/orders/${orderId}/approve`, {
            method: 'POST'
        });

        showToast('Order approved! Stock will be reserved.');
        await loadSellerOrders(); // Reload orders
    } catch (error) {
        logger.error('Failed to approve order', error);
        showToast('Failed to approve order', 'error');
    }
}

async function rejectOrder(orderId) {
    if (!confirm('Are you sure you want to reject this order?')) {
        return;
    }

    try {
        logger.info(`Rejecting order ${orderId}`);

        await apiCall(`/orders/${orderId}/reject`, {
            method: 'POST'
        });

        showToast('Order rejected');
        await loadSellerOrders(); // Reload orders
    } catch (error) {
        logger.error('Failed to reject order', error);
        showToast('Failed to reject order', 'error');
    }
}

// Make functions globally available
window.loadSellerDashboard = loadSellerDashboard;
window.updateOrderStatus = updateOrderStatus;
window.approveOrder = approveOrder;
window.rejectOrder = rejectOrder;

export { loadSellerDashboard, loadSellerProducts, loadSellerOrders, updateOrderStatus, approveOrder, rejectOrder };
