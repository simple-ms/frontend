// ===========================================
// Seller Dashboard Functions
// ===========================================

import { apiCall } from './api.js';
import { formatDate, formatPrice, escapeHtml } from './utils.js';
import { showToast } from './utils.js';

async function loadSellerOrders() {
    const list = document.getElementById('sellerOrdersList');

    list.innerHTML = `
        \u003cdiv class="skeleton-loader"\u003e
            \u003cdiv class="skeleton-row"\u003e\u003c/div\u003e
            \u003cdiv class="skeleton-row"\u003e\u003c/div\u003e
        \u003c/div\u003e
    `;

    try {
        const orders = await apiCall('/orders/seller');

        if (orders.length === 0) {
            list.innerHTML = `
                \u003cdiv class="empty-state"\u003e
                    \u003cdiv class="empty-icon"\u003e📦\u003c/div\u003e
                    \u003ch3 class="empty-title"\u003eNo orders yet\u003c/h3\u003e
                    \u003cp class="empty-text"\u003eOrders for your products will appear here.\u003c/p\u003e
                \u003c/div\u003e
            `;
            return;
        }

        list.innerHTML = orders.map(order =\u003e`
            \u003cdiv class="order-card seller-order"\u003e
                \u003cdiv class="order-header"\u003e
                    \u003cdiv class="order-id-group"\u003e
                        \u003cspan class="order-id"\u003eOrder #${order.id.substring(0, 8)}\u003c/span\u003e
                        \u003cspan class="order-date"\u003e${formatDate(order.created_at)}\u003c/span\u003e
                    \u003c/div\u003e
                    \u003cselect class="order-status-select" data-order-id="${order.id}" data-current-status="${order.status}"\u003e
                        \u003coption value="pending" ${order.status === 'pending' ? 'selected' : ''}\u003ePending\u003c/option\u003e
                        \u003coption value="processing" ${order.status === 'processing' ? 'selected' : ''}\u003eProcessing\u003c/option\u003e
                        \u003coption value="shipped" ${order.status === 'shipped' ? 'selected' : ''}\u003eShipped\u003c/option\u003e
                        \u003coption value="delivered" ${order.status === 'delivered' ? 'selected' : ''}\u003eDelivered\u003c/option\u003e
                        \u003coption value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}\u003eCancelled\u003c/option\u003e
                    \u003c/select\u003e
                \u003c/div\u003e
                \u003cdiv class="order-details"\u003e
                    \u003cdiv class="order-detail"\u003e
                        \u003cspan class="order-detail-label"\u003eProduct\u003c/span\u003e
                        \u003cspan class="order-detail-value"\u003e#${order.product_id}\u003c/span\u003e
                    \u003c/div\u003e
                    \u003cdiv class="order-detail"\u003e
                        \u003cspan class="order-detail-label"\u003eQuantity\u003c/span\u003e
                        \u003cspan class="order-detail-value"\u003e${order.quantity}\u003c/span\u003e
                    \u003c/div\u003e
                    \u003cdiv class="order-detail"\u003e
                        \u003cspan class="order-detail-label"\u003eTotal\u003c/span\u003e
                        \u003cspan class="order-detail-value price"\u003e${formatPrice(order.total_amount)}\u003c/span\u003e
                    \u003c/div\u003e
                    ${order.shipping_address ? `
                        \u003cdiv class="order-detail full-width"\u003e
                            \u003cspan class="order-detail-label"\u003eShipping Address\u003c/span\u003e
                            \u003cspan class="order-detail-value"\u003e${escapeHtml(order.shipping_address)}, ${escapeHtml(order.city)}, ${escapeHtml(order.postal_code)}, ${escapeHtml(order.country)}\u003c/span\u003e
                        \u003c/div\u003e
                    ` : ''}
                \u003c/div\u003e
            \u003c/div\u003e
        `).join('');

        // Add event listeners for status changes
        document.querySelectorAll('.order-status-select').forEach(select =\u003e {
            select.addEventListener('change', async(e) =\u003e {
                const orderId = e.target.dataset.orderId;
                const newStatus = e.target.value;
                const oldStatus = e.target.dataset.currentStatus;

                try {
                    await apiCall(`/orders/${orderId}/status`, {
                        method: 'PATCH',
                        body: JSON.stringify({ status: newStatus })
                    });

                    showToast('Order status updated successfully!');
                    e.target.dataset.currentStatus = newStatus;
                } catch(error) {
                    showToast(error.message, 'error');
                    e.target.value = oldStatus; // Revert on error
                }
            });
        });
    } catch (error) {
        list.innerHTML = `
            \u003cdiv class="empty-state"\u003e
                \u003cdiv class="empty-icon"\u003e⚠\u003c/div\u003e
                \u003ch3 class="empty-title"\u003eFailed to load orders\u003c/h3\u003e
                \u003cp class="empty-text"\u003e${escapeHtml(error.message)}\u003c/div\u003e
            \u003c/div\u003e
        `;
    }
}

export { loadSellerOrders };
