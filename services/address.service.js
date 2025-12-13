/**
 * Address Service
 * 
 * Handles all address-related operations.
 */
import { apiClient } from './api.service.js';
import { ApiEndpoints } from '../constants/apiEndpoints.js';
import { logger } from '../utils/logger.js';

class AddressService {
    /**
     * Get all addresses for current user
     * @returns {Promise<Array>} Addresses array
     */
    async getAddresses() {
        try {
            const addresses = await apiClient.get(ApiEndpoints.ADDRESSES);
            logger.info(`[Addresses] Fetched ${addresses.length} addresses`);

            return addresses;
        } catch (error) {
            logger.error('[Addresses] Failed to fetch addresses:', error);
            throw error;
        }
    }

    /**
     * Get address by ID
     * @param {string} id - Address ID
     * @returns {Promise<Object>} Address data
     */
    async getAddressById(id) {
        try {
            const address = await apiClient.get(ApiEndpoints.ADDRESS_BY_ID(id));
            logger.info(`[Addresses] Fetched address ${id}`);

            return address;
        } catch (error) {
            logger.error(`[Addresses] Failed to fetch address ${id}:`, error);
            throw error;
        }
    }

    /**
     * Create new address
     * @param {Object} addressData - Address data
     * @returns {Promise<Object>} Created address
     */
    async createAddress(addressData) {
        try {
            const address = await apiClient.post(ApiEndpoints.ADDRESSES, addressData, {
                cache: false
            });

            // Invalidate cache
            apiClient.clearCache('/addresses');

            logger.info(`[Addresses] Created address ${address.id}`);

            return address;
        } catch (error) {
            logger.error('[Addresses] Failed to create address:', error);
            throw error;
        }
    }

    /**
     * Update address
     * @param {string} id - Address ID
     * @param {Object} addressData - Updated address data
     * @returns {Promise<Object>} Updated address
     */
    async updateAddress(id, addressData) {
        try {
            const address = await apiClient.put(ApiEndpoints.ADDRESS_BY_ID(id), addressData, {
                cache: false
            });

            // Invalidate cache
            apiClient.clearCache('/addresses');

            logger.info(`[Addresses] Updated address ${id}`);

            return address;
        } catch (error) {
            logger.error(`[Addresses] Failed to update address ${id}:`, error);
            throw error;
        }
    }

    /**
     * Delete address
     * @param {string} id - Address ID
     * @returns {Promise<void>}
     */
    async deleteAddress(id) {
        try {
            await apiClient.delete(ApiEndpoints.ADDRESS_BY_ID(id), {
                cache: false
            });

            // Invalidate cache
            apiClient.clearCache('/addresses');

            logger.info(`[Addresses] Deleted address ${id}`);
        } catch (error) {
            logger.error(`[Addresses] Failed to delete address ${id}:`, error);
            throw error;
        }
    }
}

// Create singleton instance
export const addressService = new AddressService();
