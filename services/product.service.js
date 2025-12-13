/**
 * Product Service
 * 
 * Handles all product-related operations.
 */
import { apiClient } from './api.service.js';
import { eventBus, Events } from '../core/eventBus.js';
import { ApiEndpoints } from '../constants/apiEndpoints.js';
import { logger } from '../utils/logger.js';

class ProductService {
    /**
     * Get all products
     * @param {Object} options - Query options
     * @returns {Promise<Array>} Products array
     */
    async getProducts(options = {}) {
        try {
            const queryParams = new URLSearchParams(options).toString();
            const url = queryParams ? `${ApiEndpoints.PRODUCTS}?${queryParams}` : ApiEndpoints.PRODUCTS;

            const products = await apiClient.get(url);
            logger.info(`[Products] Fetched ${products.length} products`);

            return products;
        } catch (error) {
            logger.error('[Products] Failed to fetch products:', error);
            throw error;
        }
    }

    /**
     * Get product by ID
     * @param {number} id - Product ID
     * @returns {Promise<Object>} Product data
     */
    async getProductById(id) {
        try {
            const product = await apiClient.get(ApiEndpoints.PRODUCT_BY_ID(id));
            logger.info(`[Products] Fetched product ${id}`);

            return product;
        } catch (error) {
            logger.error(`[Products] Failed to fetch product ${id}:`, error);
            throw error;
        }
    }

    /**
     * Create new product
     * @param {Object} productData - Product data
     * @returns {Promise<Object>} Created product
     */
    async createProduct(productData) {
        try {
            const product = await apiClient.post(ApiEndpoints.PRODUCTS, productData, {
                cache: false
            });

            // Invalidate products cache
            apiClient.clearCache('/products');

            eventBus.emit(Events.PRODUCT_CREATED, product);
            logger.info(`[Products] Created product ${product.id}`);

            return product;
        } catch (error) {
            logger.error('[Products] Failed to create product:', error);
            throw error;
        }
    }

    /**
     * Update product
     * @param {number} id - Product ID
     * @param {Object} productData - Updated product data
     * @returns {Promise<Object>} Updated product
     */
    async updateProduct(id, productData) {
        try {
            const product = await apiClient.put(ApiEndpoints.PRODUCT_BY_ID(id), productData, {
                cache: false
            });

            // Invalidate cache
            apiClient.clearCache('/products');

            eventBus.emit(Events.PRODUCT_UPDATED, product);
            logger.info(`[Products] Updated product ${id}`);

            return product;
        } catch (error) {
            logger.error(`[Products] Failed to update product ${id}:`, error);
            throw error;
        }
    }

    /**
     * Delete product
     * @param {number} id - Product ID
     * @returns {Promise<void>}
     */
    async deleteProduct(id) {
        try {
            await apiClient.delete(ApiEndpoints.PRODUCT_BY_ID(id), {
                cache: false
            });

            // Invalidate cache
            apiClient.clearCache('/products');

            eventBus.emit(Events.PRODUCT_DELETED, { id });
            logger.info(`[Products] Deleted product ${id}`);
        } catch (error) {
            logger.error(`[Products] Failed to delete product ${id}:`, error);
            throw error;
        }
    }

    /**
     * Get seller's products
     * @returns {Promise<Array>} Seller's products
     */
    async getSellerProducts() {
        try {
            const allProducts = await this.getProducts();
            const userId = state.get('userId');

            // Filter products by seller
            const sellerProducts = allProducts.filter(p => p.seller_id === userId);
            logger.info(`[Products] Fetched ${sellerProducts.length} seller products`);

            return sellerProducts;
        } catch (error) {
            logger.error('[Products] Failed to fetch seller products:', error);
            throw error;
        }
    }
}

// Create singleton instance
export const productService = new ProductService();
