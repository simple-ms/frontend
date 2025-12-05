// ===========================================
// API Configuration and State Management
// ===========================================

const API_BASE = 'http://localhost';

const state = {
    token: localStorage.getItem('access_token'),
    refreshToken: localStorage.getItem('refresh_token'),
    userId: localStorage.getItem('user_id'),
    userRole: localStorage.getItem('user_role'),
    userEmail: localStorage.getItem('user_email'),
    currentPage: 'auth'
};

export { API_BASE, state };
