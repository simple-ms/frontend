// ===========================================
// Addresses Page Functions
// ===========================================

import { apiCall } from './api.js';
import { showToast, setButtonLoading, escapeHtml } from './utils.js';

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
                    <button class="btn btn-danger btn-small" onclick="window.deleteAddress('${address.id}')">
                        Delete
                    </button>
                </div>
                <div class="address-details">
                    ${escapeHtml(address.street)}<br>
                    ${escapeHtml(address.city)}, ${escapeHtml(address.postal_code)}<br>
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

function initAddressHandlers() {
    // Add Address Modal
    document.getElementById('addAddressBtn').addEventListener('click', () => {
        document.getElementById('addAddressModal').classList.add('active');
    });

    document.getElementById('addAddressForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const button = e.target.querySelector('button[type="submit"]');
        const title = document.getElementById('addressTitle').value.trim();
        const street = document.getElementById('addressStreet').value.trim();
        const city = document.getElementById('addressCity').value.trim();
        const postal_code = document.getElementById('addressZip').value.trim();
        const country = document.getElementById('addressCountry').value.trim();

        setButtonLoading(button, true);

        try {
            await apiCall('/users/addresses', {
                method: 'POST',
                body: JSON.stringify({
                    title,
                    street,
                    city,
                    postal_code,  // Changed from zip_code
                    country,
                    is_default: false
                })
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
}

export { loadAddresses, deleteAddress, initAddressHandlers };
