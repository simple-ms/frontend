/**
 * Product Form Component
 * 
 * Form for creating/editing products.
 */
import { Form } from '../base/Form.js';
import { productService } from '../../services/index.js';
import { toast } from '../base/Toast.js';
import { ValidationRules } from '../../utils/validation.js';

export class ProductForm extends Form {
    constructor(container, options = {}) {
        super(container, {
            validators: {
                name: ValidationRules.compose(
                    ValidationRules.required(),
                    ValidationRules.minLength(3),
                    ValidationRules.maxLength(100)
                ),
                description: ValidationRules.maxLength(500),
                price: ValidationRules.compose(
                    ValidationRules.required(),
                    ValidationRules.number(),
                    ValidationRules.min(0.01)
                ),
                stock_quantity: ValidationRules.compose(
                    ValidationRules.required(),
                    ValidationRules.number(),
                    ValidationRules.min(0)
                )
            },
            onSubmit: async (values) => {
                try {
                    if (options.productId) {
                        await productService.updateProduct(options.productId, values);
                        toast.success('Product updated successfully');
                    } else {
                        await productService.createProduct(values);
                        toast.success('Product created successfully');
                    }

                    if (options.onSuccess) {
                        options.onSuccess();
                    }
                } catch (error) {
                    toast.error(error.message || 'Failed to save product');
                    throw error;
                }
            }
        });

        this.productId = options.productId;
        this.initialData = options.initialData || {};
    }

    render() {
        const { errors, isSubmitting, values } = this.state;

        this.container.innerHTML = `
            <form class="product-form" novalidate>
                <h3>${this.productId ? 'Edit Product' : 'Create Product'}</h3>
                
                <div class="form-group">
                    <label for="name">Product Name *</label>
                    <input 
                        type="text" 
                        id="name" 
                        name="name" 
                        class="${this.hasError('name') ? 'error' : ''}"
                        value="${values.name || this.initialData.name || ''}"
                        placeholder="Enter product name"
                        required
                    />
                    ${this.getError('name') ? `<span class="error-message">${this.getError('name')}</span>` : ''}
                </div>

                <div class="form-group">
                    <label for="description">Description</label>
                    <textarea 
                        id="description" 
                        name="description" 
                        class="${this.hasError('description') ? 'error' : ''}"
                        placeholder="Enter product description"
                        rows="4"
                    >${values.description || this.initialData.description || ''}</textarea>
                    ${this.getError('description') ? `<span class="error-message">${this.getError('description')}</span>` : ''}
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="price">Price *</label>
                        <input 
                            type="number" 
                            id="price" 
                            name="price" 
                            class="${this.hasError('price') ? 'error' : ''}"
                            value="${values.price || this.initialData.price || ''}"
                            placeholder="0.00"
                            step="0.01"
                            min="0"
                            required
                        />
                        ${this.getError('price') ? `<span class="error-message">${this.getError('price')}</span>` : ''}
                    </div>

                    <div class="form-group">
                        <label for="stock_quantity">Stock Quantity *</label>
                        <input 
                            type="number" 
                            id="stock_quantity" 
                            name="stock_quantity" 
                            class="${this.hasError('stock_quantity') ? 'error' : ''}"
                            value="${values.stock_quantity || this.initialData.stock_quantity || ''}"
                            placeholder="0"
                            min="0"
                            required
                        />
                        ${this.getError('stock_quantity') ? `<span class="error-message">${this.getError('stock_quantity')}</span>` : ''}
                    </div>
                </div>

                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" data-cancel>Cancel</button>
                    <button type="submit" class="btn btn-primary" ${isSubmitting ? 'disabled' : ''}>
                        ${isSubmitting ? 'Saving...' : 'Save Product'}
                    </button>
                </div>
            </form>
        `;
    }

    attachEventListeners() {
        super.attachFormListeners();

        const cancelBtn = this.$('[data-cancel]');
        if (cancelBtn) {
            this.addEventListener(cancelBtn, 'click', () => {
                if (this.onCancel) {
                    this.onCancel();
                }
            });
        }
    }

    afterMount() {
        // Set initial values
        if (this.initialData) {
            this.setValues(this.initialData);
        }
    }
}
