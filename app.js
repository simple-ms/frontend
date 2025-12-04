// ===========================================
// SIMPLEX - Frontend Application
// ===========================================

// API Configuration
const API_BASE = 'http://localhost';

// State Management
const state = {
    token: localStorage.getItem('access_token'),
    refreshToken: localStorage.getItem('refresh_token'),
    userId: localStorage.getItem('user_id'),
    userRole: localStorage.getItem('user_role'),
    userEmail: localStorage.getItem('user_email'),
    currentPage: 'auth'
};

// ===========================================
// UTILITY FUNCTIONS
// ===========================================

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = toast.querySelector('.toast-message');
    
    toastMessage.textContent = message;
    toast.className = `toast ${type} show`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 4000);
}

function showMessage(elementId, message, type = 'error') {
    const element = document.getElementById(elementId);
    element.textContent = message;
    element.className = `message ${type} show`;
    
    setTimeout(() => {
        element.classList.remove('show');
    }, 6000);
}

function setButtonLoading(button, loading) {
    if (loading) {
        button.classList.add('loading');
        button.disabled = true;
    } else {
        button.classList.remove('loading');
        button.disabled = false;
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
}

function formatPrice(price) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(price);
}

function truncateId(id) {
    return id.substring(0, 8).toUpperCase();
}

// ===========================================
// API FUNCTIONS
// ===========================================

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
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            throw new Error('Unable to connect to server. Please check if the backend is running.');
        }
        throw error;
    }
}

// ===========================================
// AUTH FUNCTIONS
// ===========================================

function isAuthenticated() {
    return !!state.token;
}

function setAuthState(data) {
    state.token = data.access_token;
    state.refreshToken = data.refresh_token;
    state.userId = data.user_id;
    state.userRole = data.role;
    
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);
    localStorage.setItem('user_id', data.user_id);
    localStorage.setItem('user_role', data.role);
}

function logout() {
    state.token = null;
    state.refreshToken = null;
    state.userId = null;
    state.userRole = null;
    state.userEmail = null;
    localStorage.clear();
    
    document.getElementById('userMenu').classList.add('hidden');
    updateAuthUI();
    navigateTo('auth');
    showToast('Signed out successfully');
}

function updateAuthUI() {
    const authLink = document.getElementById('authLink');
    const navMenu = document.getElementById('navMenu');
    const addProductBtn = document.getElementById('addProductBtn');
    const userMenu = document.getElementById('userMenu');
    const userEmail = document.getElementById('userEmail');
    const userRole = document.getElementById('userRole');

    if (isAuthenticated()) {
        // Update auth link to show user indicator
        authLink.innerHTML = '<span>◯</span>';
        authLink.classList.add('authenticated');
        authLink.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            userMenu.classList.toggle('hidden');
        };
        
        // Show navigation links
        navMenu.querySelectorAll('.nav-link[data-page]').forEach(link => {
            link.style.display = 'flex';
        });

        // Update user menu
        userEmail.textContent = state.userEmail || 'User';
        userRole.textContent = state.userRole || 'buyer';

        // Show add product button for sellers
        if (state.userRole === 'seller' || state.userRole === 'admin') {
            addProductBtn.classList.remove('hidden');
        } else {
            addProductBtn.classList.add('hidden');
        }
    } else {
        authLink.innerHTML = '<span>Sign In</span>';
        authLink.classList.remove('authenticated');
        authLink.onclick = (e) => {
            e.preventDefault();
            navigateTo('auth');
        };
        
        // Hide navigation links except products
        navMenu.querySelectorAll('.nav-link[data-page]').forEach(link => {
            if (link.dataset.page !== 'products') {
                link.style.display = 'none';
            }
        });
        
        addProductBtn.classList.add('hidden');
        userMenu.classList.add('hidden');
    }
}

// Close user menu when clicking outside
document.addEventListener('click', (e) => {
    const userMenu = document.getElementById('userMenu');
    const authLink = document.getElementById('authLink');
    
    if (!userMenu.contains(e.target) && !authLink.contains(e.target)) {
        userMenu.classList.add('hidden');
    }
});

// Logout button
document.getElementById('logoutBtn').addEventListener('click', logout);

// ===========================================
// NAVIGATION
// ===========================================

function navigateTo(pageName) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });

    const targetPage = document.getElementById(`${pageName}Page`);
    if (targetPage) {
        targetPage.classList.add('active');
        state.currentPage = pageName;

        // Load page data
        switch (pageName) {
            case 'products':
                loadProducts();
                break;
            case 'orders':
                if (isAuthenticated()) loadOrders();
                break;
            case 'addresses':
                if (isAuthenticated()) loadAddresses();
                break;
        }
    }
}

// Navigation Links
document.querySelectorAll('.nav-link[data-page]').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const page = link.dataset.page;

        if (!isAuthenticated() && page !== 'products') {
            showToast('Please sign in to access this page', 'error');
            navigateTo('auth');
            return;
        }

        navigateTo(page);
    });
});

// ===========================================
// AUTH PAGE
// ===========================================

// Tab switching
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');
        const authTitle = document.getElementById('authTitle');

        if (tab === 'login') {
            loginForm.classList.remove('hidden');
            registerForm.classList.add('hidden');
            authTitle.textContent = 'Welcome back';
        } else {
            loginForm.classList.add('hidden');
            registerForm.classList.remove('hidden');
            authTitle.textContent = 'Create account';
        }
    });
});

// Login form
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const button = e.target.querySelector('button[type="submit"]');
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    setButtonLoading(button, true);

    try {
        const data = await apiCall('/auth/login', {
            method: 'POST',
            skipAuth: true,
            body: JSON.stringify({ email, password })
        });

        setAuthState(data);
        state.userEmail = email;
        localStorage.setItem('user_email', email);
        
        showToast('Welcome back!');
        updateAuthUI();
        navigateTo('products');
        
        // Reset form
        e.target.reset();
    } catch (error) {
        showMessage('authMessage', error.message, 'error');
    } finally {
        setButtonLoading(button, false);
    }
});

// Register form
document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const button = e.target.querySelector('button[type="submit"]');
    const firstName = document.getElementById('regFirstName').value;
    const lastName = document.getElementById('regLastName').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const role = document.querySelector('input[name="role"]:checked').value;

    setButtonLoading(button, true);

    try {
        const data = await apiCall('/auth/register', {
            method: 'POST',
            skipAuth: true,
            body: JSON.stringify({ 
                first_name: firstName, 
                last_name: lastName, 
                email, 
                password, 
                role 
            })
        });

        setAuthState(data);
        state.userEmail = email;
        localStorage.setItem('user_email', email);
        
        showToast('Account created successfully!');
        updateAuthUI();
        navigateTo('products');
        
        // Reset form
        e.target.reset();
    } catch (error) {
        showMessage('authMessage', error.message, 'error');
    } finally {
        setButtonLoading(button, false);
    }
});

// ===========================================
// PRODUCTS PAGE
// ===========================================

async function loadProducts() {
    const grid = document.getElementById('productsGrid');
    
    // Show skeleton
    grid.innerHTML = `
        <div class="skeleton-loader">
            <div class="skeleton-card"></div>
            <div class="skeleton-card"></div>
            <div class="skeleton-card"></div>
        </div>
    `;

    try {
        const products = await apiCall('/products', { skipAuth: true });

        if (products.length === 0) {
            grid.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1;">
                    <div class="empty-icon">⬡</div>
                    <h3 class="empty-title">No products yet</h3>
                    <p class="empty-text">Products will appear here once they're added to the catalog.</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = products.map(product => {
            const stockLevel = product.stock > 10 ? '' : product.stock > 0 ? 'low' : 'out';
            const stockText = product.stock > 0 ? `${product.stock} in stock` : 'Out of stock';
            
            return `
                <div class="product-card">
                    <div class="product-header">
                        <h3 class="product-name">${escapeHtml(product.name)}</h3>
                        <span class="product-id">#${product.id}</span>
                    </div>
                    <div class="product-price">${formatPrice(product.price)}</div>
                    <div class="product-stock">
                        <span class="stock-dot ${stockLevel}"></span>
                        <span>${stockText}</span>
                    </div>
                    ${isAuthenticated() && product.stock > 0 ? `
                        <div class="product-actions">
                            <input type="number" class="quantity-input" value="1" min="1" max="${product.stock}" id="qty-${product.id}">
                            <button class="btn btn-primary btn-small" onclick="createOrder(${product.id})">
                                <span class="btn-text">Buy Now</span>
                                <span class="btn-loader"></span>
                            </button>
                        </div>
                    ` : !isAuthenticated() ? `
                        <p class="product-login-prompt">Sign in to purchase</p>
                    ` : `
                        <p class="product-login-prompt">Currently unavailable</p>
                    `}
                </div>
            `;
        }).join('');
    } catch (error) {
        grid.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <div class="empty-icon">⚠</div>
                <h3 class="empty-title">Failed to load products</h3>
                <p class="empty-text">${escapeHtml(error.message)}</p>
            </div>
        `;
    }
}

async function createOrder(productId) {
    const quantity = parseInt(document.getElementById(`qty-${productId}`).value);
    const button = event.target.closest('button');

    setButtonLoading(button, true);

    try {
        await apiCall('/order', {
            method: 'POST',
            body: JSON.stringify({ product_id: productId, quantity })
        });

        showToast('Order created successfully!');
        
        // Refresh products to update stock
        setTimeout(() => {
            loadProducts();
            navigateTo('orders');
        }, 1000);
    } catch (error) {
        showToast(error.message, 'error');
    } finally {
        setButtonLoading(button, false);
    }
}

// Add Product Modal
document.getElementById('addProductBtn').addEventListener('click', () => {
    document.getElementById('addProductModal').classList.add('active');
});

document.querySelectorAll('.modal-close, .modal-backdrop').forEach(el => {
    el.addEventListener('click', (e) => {
        if (e.target === el) {
            el.closest('.modal').classList.remove('active');
        }
    });
});

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal.active').forEach(modal => {
            modal.classList.remove('active');
        });
    }
});

document.getElementById('addProductForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const button = e.target.querySelector('button[type="submit"]');
    const name = document.getElementById('productName').value;
    const price = parseFloat(document.getElementById('productPrice').value);
    const stock = parseInt(document.getElementById('productStock').value);

    setButtonLoading(button, true);

    try {
        await apiCall('/product', {
            method: 'POST',
            body: JSON.stringify({ name, price, stock })
        });

        showToast('Product added successfully!');
        document.getElementById('addProductModal').classList.remove('active');
        e.target.reset();
        loadProducts();
    } catch (error) {
        showToast(error.message, 'error');
    } finally {
        setButtonLoading(button, false);
    }
});

// ===========================================
// ORDERS PAGE
// ===========================================

async function loadOrders() {
    const list = document.getElementById('ordersList');
    
    list.innerHTML = `
        <div class="skeleton-loader">
            <div class="skeleton-row"></div>
            <div class="skeleton-row"></div>
        </div>
    `;

    try {
        const orders = await apiCall('/orders');

        if (orders.length === 0) {
            list.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">◎</div>
                    <h3 class="empty-title">No orders yet</h3>
                    <p class="empty-text">Your order history will appear here once you make a purchase.</p>
                </div>
            `;
            return;
        }

        list.innerHTML = orders.map(order => `
            <div class="order-card">
                <div class="order-header">
                    <div class="order-id-group">
                        <span class="order-id">Order #${truncateId(order.id)}</span>
                        <span class="order-date">${formatDate(order.created_at)}</span>
                    </div>
                    <span class="order-status status-${order.status}">${order.status}</span>
                </div>
                <div class="order-details">
                    <div class="order-detail">
                        <span class="order-detail-label">Product ID</span>
                        <span class="order-detail-value">#${order.product_id}</span>
                    </div>
                    <div class="order-detail">
                        <span class="order-detail-label">Quantity</span>
                        <span class="order-detail-value">${order.quantity}</span>
                    </div>
                    <div class="order-detail">
                        <span class="order-detail-label">Total</span>
                        <span class="order-detail-value price">${formatPrice(order.total_amount)}</span>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        list.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">⚠</div>
                <h3 class="empty-title">Failed to load orders</h3>
                <p class="empty-text">${escapeHtml(error.message)}</p>
            </div>
        `;
    }
}

// ===========================================
// ADDRESSES PAGE
// ===========================================

async function loadAddresses() {
    const list = document.getElementById('addressesList');
    
    list.innerHTML = `
        <div class="skeleton-loader">
            <div class="skeleton-card"></div>
            <div class="skeleton-card"></div>
        </div>
    `;

    try {
        const addresses = await apiCall('/users/addresses');

        if (addresses.length === 0) {
            list.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1;">
                    <div class="empty-icon">⌂</div>
                    <h3 class="empty-title">No addresses saved</h3>
                    <p class="empty-text">Add a delivery address to make checkout faster.</p>
                </div>
            `;
            return;
        }

        list.innerHTML = addresses.map(address => `
            <div class="address-card">
                <div class="address-header">
                    <div class="address-title">
                        <span class="address-icon">⌂</span>
                        <span>${escapeHtml(address.title)}</span>
                    </div>
                    <button class="btn btn-danger btn-small" onclick="deleteAddress('${address.id}')">
                        Delete
                    </button>
                </div>
                <div class="address-details">
                    ${escapeHtml(address.street)}<br>
                    ${escapeHtml(address.city)}, ${escapeHtml(address.zip_code)}<br>
                    ${escapeHtml(address.country)}
                </div>
            </div>
        `).join('');
    } catch (error) {
        list.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <div class="empty-icon">⚠</div>
                <h3 class="empty-title">Failed to load addresses</h3>
                <p class="empty-text">${escapeHtml(error.message)}</p>
            </div>
        `;
    }
}

async function deleteAddress(addressId) {
    if (!confirm('Are you sure you want to delete this address?')) return;

    try {
        await apiCall(`/users/addresses/${addressId}`, { method: 'DELETE' });
        showToast('Address deleted');
        loadAddresses();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// Add Address Modal
document.getElementById('addAddressBtn').addEventListener('click', () => {
    document.getElementById('addAddressModal').classList.add('active');
});

document.getElementById('addAddressForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const button = e.target.querySelector('button[type="submit"]');
    const title = document.getElementById('addressTitle').value;
    const street = document.getElementById('addressStreet').value;
    const city = document.getElementById('addressCity').value;
    const zip_code = document.getElementById('addressZip').value;
    const country = document.getElementById('addressCountry').value;

    setButtonLoading(button, true);

    try {
        await apiCall('/users/addresses', {
            method: 'POST',
            body: JSON.stringify({ title, street, city, zip_code, country })
        });

        showToast('Address saved!');
        document.getElementById('addAddressModal').classList.remove('active');
        e.target.reset();
        loadAddresses();
    } catch (error) {
        showToast(error.message, 'error');
    } finally {
        setButtonLoading(button, false);
    }
});

// ===========================================
// UTILITY HELPERS
// ===========================================

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Make functions globally available
window.createOrder = createOrder;
window.deleteAddress = deleteAddress;

// ===========================================
// INITIALIZATION
// ===========================================

function init() {
    // Load email from storage
    state.userEmail = localStorage.getItem('user_email');
    
    updateAuthUI();
    
    if (isAuthenticated()) {
        navigateTo('products');
    } else {
        navigateTo('auth');
    }
}

// Start the app
init();
