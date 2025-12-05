// ===========================================
// API Functions
// ===========================================

import { API_BASE, state } from './config.js';

async function apiCall(endpoint, options = {}) {
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    if (state.token && !options.skipAuth) {
        headers['Authorization'] = `Bearer ${state.token}`;
    }

    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            ...options,
            headers
        });

        // Handle empty responses
        if (response.status === 204) {
            return {};
        }

        // Try to parse JSON
        const contentType = response.headers.get('content-type');
        let data;

        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            const text = await response.text();
            throw new Error(text || 'Server returned an invalid response');
        }

        if (!response.ok) {
            // Extract error message from various formats
            let errorMessage = 'Request failed';
            if (typeof data.detail === 'string') {
                errorMessage = data.detail;
            } else if (data.detail?.message) {
                errorMessage = data.detail.message;
            } else if (Array.isArray(data.detail)) {
                errorMessage = data.detail.map(e => e.msg).join(', ');
            } else if (data.message) {
                errorMessage = data.message;
            }
            throw new Error(errorMessage);
        }

        return data;
    } catch (error) {
        if (error.name === 'TypeError') {
            // Network errors or CORS issues
            console.error('Network/CORS error:', error);
            throw new Error('Unable to connect to server. Please check if the backend is running and CORS is configured.');
        }
        throw error;
    }
}

export { apiCall };
