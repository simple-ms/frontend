// ===========================================
// Utility Functions
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

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

export { showToast, showMessage, setButtonLoading, formatDate, formatPrice, truncateId, escapeHtml };
