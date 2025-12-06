// Product Edit/Delete UI Enhancement

import { apiCall } from './api.js';
import { showToast } from './utils.js';

// Global functions for product management
window.editProduct = async function (productId) {
    const product = window.currentProducts?.find(p => p.id === productId);
    if (!product) {
        showToast('Product not found', 'error');
        return;
    }

    // Populate edit modal
    document.getElementById('editProductId').value = product.id;
    document.getElementById('editProductName').value = product.name;
    document.getElementById('editProductPrice').value = product.price;
    document.getElementById('editProductStock').value = product.stock;

    // Show modal
    document.getElementById('editProductModal').classList.add('active');
};

window.deleteProduct = async function (productId) {
    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
        return;
    }

    try {
        await apiCall(`/product/${productId}`, {
            method: 'DELETE'
        });

        showToast('Product deleted successfully!');

        // Reload products
        const { loadProducts } = await import('./products.js');
        loadProducts();
    } catch (error) {
        showToast(error.message, 'error');
    }
};

window.submitProductEdit = async function (event) {
    event.preventDefault();

    const productId = document.getElementById('editProductId').value;
    const name = document.getElementById('editProductName').value;
    const price = parseFloat(document.getElementById('editProductPrice').value);
    const stock = parseInt(document.getElementById('editProductStock').value);

    try {
        await apiCall(`/product/${productId}`, {
            method: 'PUT',
            body: JSON.stringify({ name, price, stock })
        });

        showToast('Product updated successfully!');

        // Close modal
        document.getElementById('editProductModal').classList.remove('active');

        // Reload products
        const { loadProducts } = await import('./products.js');
        loadProducts();
    } catch (error) {
        showToast(error.message, 'error');
    }
};

// Add edit/delete buttons to product cards
export function addProductManagementButtons(productCard, product, userRole) {
    if (userRole !== 'seller') return;

    const actionsDiv = productCard.querySelector('.product-actions');
    if (!actionsDiv) return;

    const managementDiv = document.createElement('div');
    managementDiv.className = 'product-management';
    managementDiv.innerHTML = `
        <button class="btn btn-small btn-icon btn-edit" onclick="editProduct(${product.id})">
            ✏️ Edit
        </button>
        <button class="btn btn-small btn-icon btn-delete" onclick="deleteProduct(${product.id})">
            🗑️ Delete
        </button>
    `;

    actionsDiv.appendChild(managementDiv);
}

export { editProduct, deleteProduct, submitProductEdit };
