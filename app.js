// API Configuration
const API_BASE = 'http://localhost';

// State Management
const state = {
    token: localStorage.getItem('access_token'),
    refreshToken: localStorage.getItem('refresh_token'),
    userId: localStorage.getItem('user_id'),
    userRole: localStorage.getItem('user_role'),
    currentPage: 'auth'
};

// Utility Functions
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function showMessage(elementId, message, type = 'error') {
    const element = document.getElementById(elementId);
    element.textContent = message;
    element.className = `message ${type} show`;
    setTimeout(() => {
        element.classList.remove('show');
    }, 5000);
}

async function apiCall(endpoint, options = {}) {
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    if (state.token && !options.skipAuth) {
        headers['Authorization'] = `Bearer ${state.token}`;
    }

    try {
        console.log(`API Call: ${options.method || 'GET'} ${API_BASE}${endpoint}`);
        console.log('Request headers:', headers);
        console.log('Request body:', options.body);

        const response = await fetch(`${API_BASE}${endpoint}`, {
            ...options,
            headers
        });

        console.log(`Response status: ${response.status}`);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));

        // Handle empty responses (like 204 No Content)
        if (response.status === 204) {
            return {};
        }

        // Try to parse JSON
        let data;
        const contentType = response.headers.get('content-type');
        console.log('Content-Type:', contentType);

        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
            console.log('Parsed JSON data:', data);
        } else {
            const text = await response.text();
            console.error('Non-JSON response:', text);
            throw new Error('Server returned non-JSON response');
        }

        if (!response.ok) {
            const errorMessage = data.message || data.detail || data.error || 'Request failed';
            console.error('API Error:', errorMessage, data);
            throw new Error(errorMessage);
        }

        return data;
    } catch (error) {
        console.error('API Error Details:', {
            name: error.name,
            message: error.message,
            stack: error.stack
        });
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            throw new Error('Network error - please check if the server is running');
        }
        throw error;
    }
}

// Auth Functions
function isAuthenticated() {
    return !!state.token;
}

function logout() {
    state.token = null;
    state.refreshToken = null;
    state.userId = null;
    state.userRole = null;
    localStorage.clear();
    updateAuthUI();
    navigateTo('auth');
}

function updateAuthUI() {
    const authLink = document.getElementById('authLink');
    const navMenu = document.getElementById('navMenu');
    const addProductBtn = document.getElementById('addProductBtn');

    if (isAuthenticated()) {
        authLink.textContent = 'Logout';
        authLink.onclick = (e) => {
            e.preventDefault();
            logout();
        };
        navMenu.querySelectorAll('.nav-link:not(#authLink)').forEach(link => {
            link.style.display = 'block';
        });

        // Show add product button for sellers
        if (state.userRole === 'seller' || state.userRole === 'admin') {
            addProductBtn.style.display = 'block';
        }
    } else {
        authLink.textContent = 'Login';
        authLink.onclick = (e) => {
            e.preventDefault();
            navigateTo('auth');
        };
        navMenu.querySelectorAll('.nav-link:not(#authLink)').forEach(link => {
            link.style.display = 'none';
        });
    }
}

// Navigation
function navigateTo(pageName) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });

    const targetPage = document.getElementById(`${pageName}Page`);
    if (targetPage) {
        targetPage.classList.add('active');
        state.currentPage = pageName;

        // Load page data
        if (pageName === 'products') {
            loadProducts();
        } else if (pageName === 'orders' && isAuthenticated()) {
            loadOrders();
        } else if (pageName === 'addresses' && isAuthenticated()) {
            loadAddresses();
        }
    }
}

// Auth Page Logic
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        document.getElementById('loginForm').style.display = tab === 'login' ? 'block' : 'none';
        document.getElementById('registerForm').style.display = tab === 'register' ? 'block' : 'none';
        document.getElementById('authTitle').textContent = tab === 'login' ? 'Welcome Back' : 'Create Account';
    });
});

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const data = await apiCall('/auth/login', {
            method: 'POST',
            skipAuth: true,
            body: JSON.stringify({ email, password })
        });

        state.token = data.access_token;
        state.refreshToken = data.refresh_token;
        state.userId = data.user_id;
        state.userRole = data.role;

        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('refresh_token', data.refresh_token);
        localStorage.setItem('user_id', data.user_id);
        localStorage.setItem('user_role', data.role);

        showToast('Login successful!', 'success');
        updateAuthUI();
        navigateTo('products');
    } catch (error) {
        showMessage('authMessage', error.message, 'error');
    }
});

document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const firstName = document.getElementById('regFirstName').value;
    const lastName = document.getElementById('regLastName').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const role = document.getElementById('regRole').value;

    try {
        const data = await apiCall('/auth/register', {
            method: 'POST',
            skipAuth: true,
            body: JSON.stringify({ first_name: firstName, last_name: lastName, email, password, role })
        });

        state.token = data.access_token;
        state.refreshToken = data.refresh_token;
        state.userId = data.user_id;
        state.userRole = data.role;

        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('refresh_token', data.refresh_token);
        localStorage.setItem('user_id', data.user_id);
        localStorage.setItem('user_role', data.role);

        showToast('Registration successful!', 'success');
        updateAuthUI();
        navigateTo('products');
    } catch (error) {
        showMessage('authMessage', error.message, 'error');
    }
});

// Products Page Logic
async function loadProducts() {
    const grid = document.getElementById('productsGrid');
    grid.innerHTML = '<div class="loading">Loading products...</div>';

    try {
        const products = await apiCall('/products', { skipAuth: true });

        if (products.length === 0) {
            grid.innerHTML = '<div class="loading">No products available</div>';
            return;
        }

        grid.innerHTML = products.map(product => `
            <div class="product-card">
                <h3>${product.name}</h3>
                <div class="product-price">$${product.price.toFixed(2)}</div>
                <div class="product-stock">Stock: ${product.stock}</div>
                ${isAuthenticated() ? `
                    <div class="product-actions">
                        <input type="number" class="quantity-input" value="1" min="1" max="${product.stock}" id="qty-${product.id}">
                        <button class="btn btn-primary" onclick="createOrder(${product.id})">Buy Now</button>
                    </div>
                ` : '<p style="color: var(--gray);">Login to purchase</p>'}
            </div>
        `).join('');
    } catch (error) {
        grid.innerHTML = '<div class="loading">Failed to load products</div>';
        showToast(error.message, 'error');
    }
}

async function createOrder(productId) {
    const quantity = parseInt(document.getElementById(`qty-${productId}`).value);

    try {
        const order = await apiCall('/order', {
            method: 'POST',
            body: JSON.stringify({ product_id: productId, quantity })
        });

        showToast('Order created successfully!', 'success');

        // Optionally navigate to orders page
        setTimeout(() => navigateTo('orders'), 1500);
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// Add Product Modal
document.getElementById('addProductBtn').addEventListener('click', () => {
    document.getElementById('addProductModal').classList.add('active');
});

document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', () => {
        btn.closest('.modal').classList.remove('active');
    });
});

document.getElementById('addProductForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('productName').value;
    const price = parseFloat(document.getElementById('productPrice').value);
    const stock = parseInt(document.getElementById('productStock').value);

    try {
        await apiCall('/product', {
            method: 'POST',
            body: JSON.stringify({ name, price, stock })
        });

        showToast('Product added successfully!', 'success');
        document.getElementById('addProductModal').classList.remove('active');
        document.getElementById('addProductForm').reset();
        loadProducts();
    } catch (error) {
        showToast(error.message, 'error');
    }
});

// Orders Page Logic
async function loadOrders() {
    const list = document.getElementById('ordersList');
    list.innerHTML = '<div class="loading">Loading orders...</div>';

    try {
        const orders = await apiCall('/orders');

        if (orders.length === 0) {
            list.innerHTML = '<div class="loading">No orders yet</div>';
            return;
        }

        list.innerHTML = orders.map(order => `
            <div class="order-card">
                <div class="order-header">
                    <span class="order-id">Order #${order.id.substring(0, 8)}</span>
                    <span class="order-status status-${order.status}">${order.status.toUpperCase()}</span>
                </div>
                <div class="order-details">
                    <div class="order-detail">
                        <span class="order-detail-label">Product ID</span>
                        <span class="order-detail-value">${order.product_id}</span>
                    </div>
                    <div class="order-detail">
                        <span class="order-detail-label">Quantity</span>
                        <span class="order-detail-value">${order.quantity}</span>
                    </div>
                    <div class="order-detail">
                        <span class="order-detail-label">Total</span>
                        <span class="order-detail-value">$${order.total_amount.toFixed(2)}</span>
                    </div>
                    <div class="order-detail">
                        <span class="order-detail-label">Date</span>
                        <span class="order-detail-value">${new Date(order.created_at).toLocaleDateString()}</span>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        list.innerHTML = '<div class="loading">Failed to load orders</div>';
        showToast(error.message, 'error');
    }
}

// Addresses Page Logic
async function loadAddresses() {
    const list = document.getElementById('addressesList');
    list.innerHTML = '<div class="loading">Loading addresses...</div>';

    try {
        const addresses = await apiCall('/users/addresses');

        if (addresses.length === 0) {
            list.innerHTML = '<div class="loading">No addresses saved</div>';
            return;
        }

        list.innerHTML = addresses.map(address => `
            <div class="address-card">
                <div class="address-title">${address.title}</div>
                <div class="address-details">
                    ${address.street}<br>
                    ${address.city}, ${address.zip_code}<br>
                    ${address.country}
                </div>
                <button class="btn btn-danger" onclick="deleteAddress('${address.id}')">Delete</button>
            </div>
        `).join('');
    } catch (error) {
        list.innerHTML = '<div class="loading">Failed to load addresses</div>';
        showToast(error.message, 'error');
    }
}

async function deleteAddress(addressId) {
    if (!confirm('Are you sure you want to delete this address?')) return;

    try {
        await apiCall(`/users/addresses/${addressId}`, { method: 'DELETE' });
        showToast('Address deleted successfully!', 'success');
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
    const title = document.getElementById('addressTitle').value;
    const street = document.getElementById('addressStreet').value;
    const city = document.getElementById('addressCity').value;
    const zip_code = document.getElementById('addressZip').value;
    const country = document.getElementById('addressCountry').value;

    try {
        await apiCall('/users/addresses', {
            method: 'POST',
            body: JSON.stringify({ title, street, city, zip_code, country })
        });

        showToast('Address added successfully!', 'success');
        document.getElementById('addAddressModal').classList.remove('active');
        document.getElementById('addAddressForm').reset();
        loadAddresses();
    } catch (error) {
        showToast(error.message, 'error');
    }
});

// Navigation Links
document.querySelectorAll('.nav-link[data-page]').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const page = link.dataset.page;

        if (!isAuthenticated() && page !== 'products') {
            showToast('Please login first', 'error');
            navigateTo('auth');
            return;
        }

        navigateTo(page);
    });
});

// Initialize
updateAuthUI();
if (isAuthenticated()) {
    navigateTo('products');
} else {
    navigateTo('auth');
}
