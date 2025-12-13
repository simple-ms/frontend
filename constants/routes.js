/**
 * Application Constants - Routes
 */

export const Routes = {
    HOME: '/',
    AUTH: '/auth',
    PRODUCTS: '/products',
    PRODUCT_DETAIL: '/products/:id',
    ORDERS: '/orders',
    ORDER_DETAIL: '/orders/:id',
    ADDRESSES: '/addresses',
    SELLER_DASHBOARD: '/seller',
    SELLER_PRODUCTS: '/seller/products',
    SELLER_ORDERS: '/seller/orders',
    NOT_FOUND: '/404',
};

export const RouteNames = {
    [Routes.HOME]: 'Home',
    [Routes.AUTH]: 'Authentication',
    [Routes.PRODUCTS]: 'Products',
    [Routes.PRODUCT_DETAIL]: 'Product Detail',
    [Routes.ORDERS]: 'Orders',
    [Routes.ORDER_DETAIL]: 'Order Detail',
    [Routes.ADDRESSES]: 'Addresses',
    [Routes.SELLER_DASHBOARD]: 'Seller Dashboard',
    [Routes.SELLER_PRODUCTS]: 'My Products',
    [Routes.SELLER_ORDERS]: 'Seller Orders',
    [Routes.NOT_FOUND]: 'Not Found',
};
