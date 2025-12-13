/**
 * Form Component
 * 
 * Base form component with validation.
 * Uses event delegation for optimal performance.
 */
import { Component } from './Component.js';
import { sanitizeInput } from '../../utils/security.js';

export class Form extends Component {
    constructor(container, options = {}) {
        super(container);

        this.state = {
            values: {},
            errors: {},
            touched: {},
            isSubmitting: false,
            isValid: true
        };

        this.validators = options.validators || {};
        this.onSubmit = options.onSubmit || null;
        this.sanitize = options.sanitize !== false;
    }

    /**
     * Get form value
     * @param {string} name - Field name
     * @returns {*} Field value
     */
    getValue(name) {
        return this.state.values[name];
    }

    /**
     * Get all form values
     * @returns {Object} All values
     */
    getValues() {
        return { ...this.state.values };
    }

    /**
     * Set form value
     * @param {string} name - Field name
     * @param {*} value - Field value
     */
    setValue(name, value) {
        const sanitizedValue = this.sanitize && typeof value === 'string'
            ? sanitizeInput(value)
            : value;

        // Update state WITHOUT triggering re-render
        // Re-rendering destroys and recreates inputs, causing focus loss
        this.state.values = {
            ...this.state.values,
            [name]: sanitizedValue
        };

        // Validate field if it's been touched
        if (this.state.touched[name]) {
            this.validateField(name, sanitizedValue);
        }
    }

    /**
     * Set multiple values
     * @param {Object} values - Values object
     */
    setValues(values) {
        Object.entries(values).forEach(([name, value]) => {
            this.setValue(name, value);
        });
    }

    /**
     * Mark field as touched
     * @param {string} name - Field name
     */
    setTouched(name) {
        // Update state without re-render
        this.state.touched = {
            ...this.state.touched,
            [name]: true
        };
    }

    /**
     * Validate field
     * @param {string} name - Field name
     * @param {*} value - Field value
     * @returns {string|null} Error message or null
     */
    validateField(name, value) {
        const validator = this.validators[name];

        if (!validator) return null;

        const error = validator(value, this.state.values);

        // Update state without re-render
        this.state.errors = {
            ...this.state.errors,
            [name]: error
        };

        // Update error message in DOM directly
        this.updateErrorDisplay(name, error);

        return error;
    }

    /**
     * Update error display for a field
     * @param {string} name - Field name
     * @param {string|null} error - Error message
     */
    updateErrorDisplay(name, error) {
        if (!this._isMounted) return;

        const form = this.container.querySelector('form');
        if (!form) return;

        // Find input by name
        const input = form.querySelector(`[name="${name}"]`);
        if (!input) return;

        // Find or create error message element
        const formGroup = input.closest('.form-group');
        if (!formGroup) return;

        let errorEl = formGroup.querySelector('.error-message');

        if (error && this.state.touched[name]) {
            // Show error
            input.classList.add('error');

            if (!errorEl) {
                errorEl = document.createElement('span');
                errorEl.className = 'error-message';
                formGroup.appendChild(errorEl);
            }
            errorEl.textContent = error;
        } else {
            // Hide error
            input.classList.remove('error');
            if (errorEl) {
                errorEl.remove();
            }
        }
    }

    /**
     * Validate all fields
     * @returns {boolean} Is form valid
     */
    validate() {
        const errors = {};
        let isValid = true;

        Object.keys(this.validators).forEach(name => {
            const value = this.state.values[name];
            const error = this.validators[name](value, this.state.values);

            if (error) {
                errors[name] = error;
                isValid = false;
            }
        });

        this.setState({ errors, isValid });
        return isValid;
    }

    /**
     * Handle form submission
     * @param {Event} e - Submit event
     */
    async handleSubmit(e) {
        if (e) {
            e.preventDefault();
        }

        // Mark all fields as touched
        const touched = {};
        Object.keys(this.validators).forEach(name => {
            touched[name] = true;
        });
        this.state.touched = touched;

        // Validate
        if (!this.validate()) {
            return;
        }

        // Submit
        if (this.onSubmit) {
            // Update button state directly
            this.updateSubmitButton(true);

            try {
                await this.onSubmit(this.getValues());
            } catch (error) {
                console.error('Form submission error:', error);
            } finally {
                this.updateSubmitButton(false);
            }
        }
    }

    /**
     * Update submit button state
     * @param {boolean} isSubmitting - Whether form is submitting
     */
    updateSubmitButton(isSubmitting) {
        this.state.isSubmitting = isSubmitting;

        const form = this.container.querySelector('form');
        if (!form) return;

        const submitBtn = form.querySelector('button[type="submit"]');
        if (!submitBtn) return;

        if (isSubmitting) {
            submitBtn.disabled = true;
            submitBtn.textContent = submitBtn.dataset.loadingText || 'Submitting...';
        } else {
            submitBtn.disabled = false;
            submitBtn.textContent = submitBtn.dataset.defaultText || 'Submit';
        }
    }

    /**
     * Reset form
     */
    reset() {
        this.state = {
            values: {},
            errors: {},
            touched: {},
            isSubmitting: false,
            isValid: true
        };
    }

    /**
     * Clear only password fields (for better UX after registration)
     */
    clearPasswords() {
        const form = this.container.querySelector('form');
        if (!form) return;

        // Clear password field values in state
        Object.keys(this.state.values).forEach(key => {
            if (key.toLowerCase().includes('password')) {
                delete this.state.values[key];
                delete this.state.errors[key];
                delete this.state.touched[key];
            }
        });

        // Clear password input elements
        form.querySelectorAll('input[type="password"]').forEach(input => {
            input.value = '';
        });
    }

    /**
     * Get field error
     * @param {string} name - Field name
     * @returns {string|null} Error message
     */
    getError(name) {
        return this.state.touched[name] ? this.state.errors[name] : null;
    }

    /**
     * Check if field has error
     * @param {string} name - Field name
     * @returns {boolean}
     */
    hasError(name) {
        return !!(this.state.touched[name] && this.state.errors[name]);
    }

    /**
     * Attach form event listeners using event delegation
     * Listeners attached to container survive innerHTML replacement
     */
    attachFormListeners() {
        // Attach to container, not form element
        // This way listeners survive when form innerHTML is replaced

        // Submit handler - use event delegation from container
        this.addEventListener(this.container, 'submit', (e) => {
            // Check if event came from a form
            if (e.target.tagName === 'FORM') {
                this.handleSubmit(e);
            }
        }, true); // Capture phase

        // Input handler - use event delegation from container
        this.addEventListener(this.container, 'input', (e) => {
            const input = e.target;
            const name = input.name;

            if (name && (input.tagName === 'INPUT' || input.tagName === 'SELECT' || input.tagName === 'TEXTAREA')) {
                this.setValue(name, input.value);
            }
        }, true); // Capture phase

        // Blur handler - use event delegation from container
        this.addEventListener(this.container, 'blur', (e) => {
            const input = e.target;
            const name = input.name;

            if (name && (input.tagName === 'INPUT' || input.tagName === 'SELECT' || input.tagName === 'TEXTAREA')) {
                this.setTouched(name);
                this.validateField(name, this.getValue(name));
            }
        }, true); // Capture phase
    }
}
