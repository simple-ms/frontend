/**
 * Seller Service
 * 
 * Handles seller-specific operations (aggregates product and order services).
 */
import { productService } from './product.service.js';
import { orderService } from './order.service.js';
import { logger } from '../utils/logger.js';

class SellerService {
    /**
     * Get seller dashboard data
     * @returns {Promise<Object>} Dashboard data
     */
    async getDashboardData() {
        try {
            const [products, orders] = await Promise.all([
                productService.getSellerProducts(),
                orderService.getSellerOrders()
            ]);

            const stats = this._calculateStats(products, orders);

            logger.info('[Seller] Fetched dashboard data');

            return {
                products,
                orders,
                stats
            };
        } catch (error) {
            logger.error('[Seller] Failed to fetch dashboard data:', error);
            throw error;
        }
    }

    /**
     * Get seller products
     * @returns {Promise<Array>} Seller products
     */
    async getProducts() {
        return productService.getSellerProducts();
    }

    /**
     * Get seller orders
     * @param {Object} options - Query options
     * @returns {Promise<Array>} Seller orders
     */
    async getOrders(options = {}) {
        return orderService.getSellerOrders(options);
    }

    /**
     * Approve order
     * @param {string} orderId - Order ID
     * @returns {Promise<Object>} Updated order
     */
    async approveOrder(orderId) {
        return orderService.approveOrder(orderId);
    }

    /**
     * Reject order
     * @param {string} orderId - Order ID
     * @returns {Promise<Object>} Updated order
     */
    async rejectOrder(orderId) {
        return orderService.rejectOrder(orderId);
    }

    /**
     * Calculate seller statistics
     * @private
     */
    _calculateStats(products, orders) {
        const totalProducts = products.length;
        const totalOrders = orders.length;
        const pendingOrders = orders.filter(o => o.status === 'AWAITING_APPROVAL').length;
        const totalRevenue = orders
            .filter(o => o.status !== 'CANCELLED')
            .reduce((sum, o) => sum + (o.total_amount || 0), 0);

        return {
            totalProducts,
            totalOrders,
            pendingOrders,
            totalRevenue
        };
    }
}

// Create singleton instance
export const sellerService = new SellerService();
