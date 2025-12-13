/**
 * Application Constants - Messages
 */

export const Messages = {
    // Success messages
    SUCCESS_LOGIN: 'Welcome back!',
    SUCCESS_REGISTER: 'Account created successfully!',
    SUCCESS_LOGOUT: 'Signed out successfully',
    SUCCESS_PRODUCT_CREATED: 'Product created successfully',
    SUCCESS_PRODUCT_UPDATED: 'Product updated successfully',
    SUCCESS_PRODUCT_DELETED: 'Product deleted successfully',
    SUCCESS_ORDER_CREATED: 'Order placed successfully',
    SUCCESS_ORDER_APPROVED: 'Order approved successfully',
    SUCCESS_ORDER_REJECTED: 'Order rejected successfully',
    SUCCESS_ADDRESS_CREATED: 'Address added successfully',
    SUCCESS_ADDRESS_UPDATED: 'Address updated successfully',
    SUCCESS_ADDRESS_DELETED: 'Address deleted successfully',

    // Error messages
    ERROR_GENERIC: 'Something went wrong. Please try again.',
    ERROR_NETWORK: 'Network error. Please check your connection.',
    ERROR_TIMEOUT: 'Request timed out. Please try again.',
    ERROR_UNAUTHORIZED: 'Please sign in to continue.',
    ERROR_FORBIDDEN: 'You do not have permission to perform this action.',
    ERROR_NOT_FOUND: 'Resource not found.',
    ERROR_VALIDATION: 'Please check your input and try again.',
    ERROR_SERVER: 'Server error. Please try again later.',

    // Validation messages
    VALIDATION_REQUIRED: 'This field is required',
    VALIDATION_EMAIL: 'Please enter a valid email address',
    VALIDATION_PASSWORD_MIN: 'Password must be at least 8 characters',
    VALIDATION_PASSWORD_MATCH: 'Passwords do not match',
    VALIDATION_NUMBER: 'Please enter a valid number',
    VALIDATION_POSITIVE: 'Please enter a positive number',

    // Confirmation messages
    CONFIRM_DELETE: 'Are you sure you want to delete this?',
    CONFIRM_LOGOUT: 'Are you sure you want to sign out?',
    CONFIRM_ORDER_APPROVE: 'Approve this order?',
    CONFIRM_ORDER_REJECT: 'Reject this order?',

    // Info messages
    INFO_LOADING: 'Loading...',
    INFO_NO_PRODUCTS: 'No products found',
    INFO_NO_ORDERS: 'No orders found',
    INFO_NO_ADDRESSES: 'No addresses found',
    INFO_EMPTY_CART: 'Your cart is empty',
};

export const OrderStatus = {
    AWAITING_APPROVAL: 'Awaiting Approval',
    PENDING: 'Pending',
    PROCESSING: 'Processing',
    SHIPPED: 'Shipped',
    DELIVERED: 'Delivered',
    CANCELLED: 'Cancelled',
};

export const UserRoles = {
    BUYER: 'buyer',
    SELLER: 'seller',
    ADMIN: 'admin',
};
