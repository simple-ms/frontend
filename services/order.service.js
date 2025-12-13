/**
 * Order Service
 * 
 * Handles all order-related operations.
 */
import { apiClient } from './api.service.js';
import { eventBus, Events } from '../core/eventBus.js';
import { ApiEndpoints } from '../constants/apiEndpoints.js';
import { logger } from '../utils/logger.js';

class OrderService {
    /**
     * Get all orders for current user
     * @param {Object} options - Query options
     * @returns {Promise<Array>} Orders array
     */
    async getOrders(options = {}) {
        try {
            const queryParams = new URLSearchParams(options).toString();
            const url = queryParams ? `${ApiEndpoints.ORDERS}?${queryParams}` : ApiEndpoints.ORDERS;

            const orders = await apiClient.get(url);
            logger.info(`[Orders] Fetched ${orders.length} orders`);

            return orders;
        } catch (error) {
            logger.error('[Orders] Failed to fetch orders:', error);
            throw error;
        }
    }

    /**
     * Get order by ID
     * @param {string} id - Order ID
     * @returns {Promise<Object>} Order data
     */
    async getOrderById(id) {
        try {
            const order = await apiClient.get(ApiEndpoints.ORDER_BY_ID(id));
            logger.info(`[Orders] Fetched order ${id}`);

            return order;
        } catch (error) {
            logger.error(`[Orders] Failed to fetch order ${id}:`, error);
            throw error;
        }
    }

    /**
     * Create new order
     * @param {Object} orderData - Order data
     * @returns {Promise<Object>} Created order
     */
    async createOrder(orderData) {
        try {
            const order = await apiClient.post(ApiEndpoints.ORDERS, orderData, {
                cache: false
            });

            // Invalidate orders cache
            apiClient.clearCache('/orders');

            eventBus.emit(Events.ORDER_CREATED, order);
            logger.info(`[Orders] Created order ${order.id}`);

            return order;
        } catch (error) {
            logger.error('[Orders] Failed to create order:', error);
            throw error;
        }
    }

    /**
     * Get seller orders
     * @param {Object} options - Query options
     * @returns {Promise<Array>} Seller orders
     */
    async getSellerOrders(options = {}) {
        try {
            const queryParams = new URLSearchParams(options).toString();
            const url = queryParams ? `${ApiEndpoints.ORDERS_SELLER}?${queryParams}` : ApiEndpoints.ORDERS_SELLER;

            const orders = await apiClient.get(url);
            logger.info(`[Orders] Fetched ${orders.length} seller orders`);

            return orders;
        } catch (error) {
            logger.error('[Orders] Failed to fetch seller orders:', error);
            throw error;
        }
    }

    /**
     * Approve order
     * @param {string} orderId - Order ID
     * @returns {Promise<Object>} Updated order
     */
    async approveOrder(orderId) {
        try {
            const order = await apiClient.post(ApiEndpoints.ORDER_APPROVE(orderId), {}, {
                cache: false
            });

            // Invalidate cache
            apiClient.clearCache('/orders');

            eventBus.emit(Events.ORDER_APPROVED, order);
            logger.info(`[Orders] Approved order ${orderId}`);

            return order;
        } catch (error) {
            logger.error(`[Orders] Failed to approve order ${orderId}:`, error);
            throw error;
        }
    }

    /**
     * Reject order
     * @param {string} orderId - Order ID
     * @returns {Promise<Object>} Updated order
     */
    async rejectOrder(orderId) {
        try {
            const order = await apiClient.post(ApiEndpoints.ORDER_REJECT(orderId), {}, {
                cache: false
            });

            // Invalidate cache
            apiClient.clearCache('/orders');

            eventBus.emit(Events.ORDER_REJECTED, order);
            logger.info(`[Orders] Rejected order ${orderId}`);

            return order;
        } catch (error) {
            logger.error(`[Orders] Failed to reject order ${orderId}:`, error);
            throw error;
        }
    }
}

// Create singleton instance
export const orderService = new OrderService();
