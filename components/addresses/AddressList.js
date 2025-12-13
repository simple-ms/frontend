/**
 * Address List Component
 * 
 * Displays and manages user addresses.
 */
import { Component } from '../base/Component.js';
import { addressService } from '../../services/index.js';
import { toast } from '../base/Toast.js';
import { Modal } from '../base/Modal.js';
import { escapeHTML } from '../../utils/security.js';

export class AddressList extends Component {
    constructor(container) {
        super(container);

        this.state = {
            addresses: [],
            isLoading: false,
            error: null
        };
    }

    async loadAddresses() {
        this.setState({ isLoading: true, error: null });

        try {
            const addresses = await addressService.getAddresses();
            this.setState({ addresses, isLoading: false });
        } catch (error) {
            this.setState({ error: error.message, isLoading: false });
            toast.error('Failed to load addresses');
        }
    }

    render() {
        const { addresses, isLoading, error } = this.state;

        if (isLoading) {
            this.container.innerHTML = `
                <div class="loading-state">
                    <div class="spinner"></div>
                    <p>Loading addresses...</p>
                </div>
            `;
            return;
        }

        if (error) {
            this.container.innerHTML = `
                <div class="error-state">
                    <p>${error}</p>
                    <button class="btn btn-primary" data-retry>Try Again</button>
                </div>
            `;
            return;
        }

        this.container.innerHTML = `
            <div class="address-list">
                <div class="list-header">
                    <h2>My Addresses</h2>
                    <button class="btn btn-primary" data-add-address>Add Address</button>
                </div>

                ${addresses.length === 0 ? `
                    <div class="empty-state">
                        <p>No addresses yet. Add your first address!</p>
                    </div>
                ` : `
                    <div class="addresses-grid">
                        ${addresses.map(address => `
                            <div class="address-card" data-address-id="${escapeHTML(address.id)}">
                                <div class="address-content">
                                    <h3>${escapeHTML(address.street_address)}</h3>
                                    <p>${escapeHTML(address.city)}, ${escapeHTML(address.state)} ${escapeHTML(address.postal_code)}</p>
                                    <p>${escapeHTML(address.country)}</p>
                                </div>
                                <div class="address-actions">
                                    <button class="btn btn-sm btn-secondary" data-edit="${address.id}">Edit</button>
                                    <button class="btn btn-sm btn-danger" data-delete="${address.id}">Delete</button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `}
            </div>
        `;
    }

    attachEventListeners() {
        const addBtn = this.$('[data-add-address]');
        if (addBtn) {
            this.addEventListener(addBtn, 'click', () => {
                if (this.onAddAddress) {
                    this.onAddAddress();
                }
            });
        }

        this.$$('[data-edit]').forEach(btn => {
            const addressId = btn.getAttribute('data-edit');
            this.addEventListener(btn, 'click', () => {
                const address = this.state.addresses.find(a => a.id === addressId);
                if (this.onEditAddress && address) {
                    this.onEditAddress(address);
                }
            });
        });

        this.$$('[data-delete]').forEach(btn => {
            const addressId = btn.getAttribute('data-delete');
            this.addEventListener(btn, 'click', async () => {
                const confirmed = await Modal.confirm('Delete this address?');
                if (confirmed) {
                    await this.handleDelete(addressId);
                }
            });
        });

        const retryBtn = this.$('[data-retry]');
        if (retryBtn) {
            this.addEventListener(retryBtn, 'click', () => this.loadAddresses());
        }
    }

    async handleDelete(addressId) {
        try {
            await addressService.deleteAddress(addressId);
            toast.success('Address deleted');
            this.loadAddresses();
        } catch (error) {
            toast.error('Failed to delete address');
        }
    }

    afterMount() {
        this.loadAddresses();
    }
}
