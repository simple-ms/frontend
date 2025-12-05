// ===========================================
// Orders Page Functions
// ===========================================

import { apiCall } from './api.js';
import { formatDate, formatPrice, truncateId, escapeHtml } from './utils.js';

async function loadOrders() {
    const list = document.getElementById('ordersList');

    list.innerHTML = `
        <div class="skeleton-loader">
            <div class="skeleton-row"></div>
            <div class="skeleton-row"></div>
        </div>
    `;

    try {
        const orders = await apiCall('/orders');

        if (orders.length === 0) {
            list.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">◎</div>
                    <h3 class="empty-title">No orders yet</h3>
                    <p class="empty-text">Your order history will appear here once you make a purchase.</p>
                </div>
            `;
            return;
        }

        list.innerHTML = orders.map(order => `
            <div class="order-card">
                <div class="order-header">
                    <div class="order-id-group">
                        <span class="order-id">Order #${truncateId(order.id)}</span>
                        <span class="order-date">${formatDate(order.created_at)}</span>
                    </div>
                    <span class="order-status status-${order.status}">${order.status}</span>
                </div>
                <div class="order-details">
                    <div class="order-detail">
                        <span class="order-detail-label">Product ID</span>
                        <span class="order-detail-value">#${order.product_id}</span>
                    </div>
                    <div class="order-detail">
                        <span class="order-detail-label">Quantity</span>
                        <span class="order-detail-value">${order.quantity}</span>
                    </div>
                    <div class="order-detail">
                        <span class="order-detail-label">Total</span>
                        <span class="order-detail-value price">${formatPrice(order.total_amount)}</span>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        list.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">⚠</div>
                <h3 class="empty-title">Failed to load orders</h3>
                <p class="empty-text">${escapeHtml(error.message)}</p>
            </div>
        `;
    }
}

export { loadOrders };
