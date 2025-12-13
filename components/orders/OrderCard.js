/**
 * Order Card Component
 * 
 * Individual order card display.
 */
import { Component } from '../base/Component.js';
import { formatCurrency, formatDate } from '../../utils/formatters.js';
import { OrderStatus } from '../../constants/messages.js';
import { escapeHTML } from '../../utils/security.js';

export class OrderCard extends Component {
    constructor(container) {
        super(container);

        this.props = {
            order: null,
            showActions: false
        };
    }

    render() {
        const { order, showActions } = this.props;

        if (!order) {
            this.container.innerHTML = '';
            return;
        }

        const statusClass = order.status.toLowerCase().replace('_', '-');
        const statusLabel = OrderStatus[order.status] || order.status;

        this.container.innerHTML = `
            <div class="order-card">
                <div class="order-header">
                    <div class="order-id">Order #${order.id.slice(0, 8)}</div>
                    <span class="order-status status-${statusClass}">${statusLabel}</span>
                </div>

                <div class="order-body">
                    <div class="order-info">
                        <div class="info-row">
                            <span class="label">Date:</span>
                            <span class="value">${formatDate(order.created_at, 'YYYY-MM-DD HH:mm')}</span>
                        </div>
                        <div class="info-row">
                            <span class="label">Total:</span>
                            <span class="value">${formatCurrency(order.total_amount)}</span>
                        </div>
                        ${order.product_name ? `
                            <div class="info-row">
                                <span class="label">Product:</span>
                                <span class="value">${escapeHTML(order.product_name)}</span>
                            </div>
                        ` : ''}
                        ${order.quantity ? `
                            <div class="info-row">
                                <span class="label">Quantity:</span>
                                <span class="value">${order.quantity}</span>
                            </div>
                        ` : ''}
                    </div>

                    ${showActions && order.status === 'AWAITING_APPROVAL' ? `
                        <div class="order-actions">
                            <button class="btn btn-sm btn-success" data-approve>Approve</button>
                            <button class="btn btn-sm btn-danger" data-reject>Reject</button>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    attachEventListeners() {
        const approveBtn = this.$('[data-approve]');
        const rejectBtn = this.$('[data-reject]');

        if (approveBtn) {
            this.addEventListener(approveBtn, 'click', () => {
                if (this.onApprove) this.onApprove(this.props.order);
            });
        }

        if (rejectBtn) {
            this.addEventListener(rejectBtn, 'click', () => {
                if (this.onReject) this.onReject(this.props.order);
            });
        }
    }
}
