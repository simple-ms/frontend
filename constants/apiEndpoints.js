/**
 * Application Constants - API Endpoints
 */

import { env } from '../core/env.js';

const API_BASE = env.API_BASE_URL;

export const ApiEndpoints = {
    // Auth
    AUTH_LOGIN: `${API_BASE}/auth/login`,
    AUTH_REGISTER: `${API_BASE}/auth/register`,
    AUTH_LOGOUT: `${API_BASE}/auth/logout`,
    AUTH_REFRESH: `${API_BASE}/auth/refresh`,
    AUTH_ME: `${API_BASE}/auth/me`,

    // Products
    PRODUCTS: `${API_BASE}/products`,
    PRODUCT_BY_ID: (id) => `${API_BASE}/products/${id}`,

    // Orders
    ORDERS: `${API_BASE}/orders`,
    ORDER_BY_ID: (id) => `${API_BASE}/orders/${id}`,
    ORDERS_SELLER: `${API_BASE}/orders/seller`,
    ORDER_APPROVE: (id) => `${API_BASE}/orders/${id}/approve`,
    ORDER_REJECT: (id) => `${API_BASE}/orders/${id}/reject`,

    // Addresses
    ADDRESSES: `${API_BASE}/addresses`,
    ADDRESS_BY_ID: (id) => `${API_BASE}/addresses/${id}`,

    // Payment
    PAYMENT_METHODS: `${API_BASE}/payment/methods`,
    PAYMENT_METHOD_BY_ID: (id) => `${API_BASE}/payment/methods/${id}`,
};

export { API_BASE };
