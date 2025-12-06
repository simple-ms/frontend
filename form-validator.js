// Enhanced Form Validation Module

export class FormValidator {
    constructor(formElement) {
        this.form = formElement;
        this.errors = new Map();
    }

    // Validation rules
    static rules = {
        required: (value) => value.trim() !== '',
        email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
        minLength: (min) => (value) => value.length >= min,
        maxLength: (max) => (value) => value.length <= max,
        pattern: (regex) => (value) => regex.test(value),
        numeric: (value) => !isNaN(value) && value.trim() !== '',
        min: (min) => (value) => parseFloat(value) >= min,
        max: (max) => (value) => parseFloat(value) <= max,
        match: (fieldName) => (value, formData) => value === formData.get(fieldName),
        password: (value) => {
            // At least 8 chars, 1 uppercase, 1 number, 1 special
            return value.length >= 8 &&
                /[A-Z]/.test(value) &&
                /[0-9]/.test(value) &&
                /[!@#$%^&*]/.test(value);
        }
    };

    // Error messages
    static messages = {
        required: 'This field is required',
        email: 'Please enter a valid email address',
        minLength: (min) => `Must be at least ${min} characters`,
        maxLength: (max) => `Must not exceed ${max} characters`,
        numeric: 'Please enter a valid number',
        min: (min) => `Must be at least ${min}`,
        max: (max) => `Must not exceed ${max}`,
        match: (field) => `Must match ${field}`,
        password: 'Password must be at least 8 characters with uppercase, number, and special character'
    };

    validateField(field, rules) {
        const value = field.value;
        const formData = new FormData(this.form);

        for (const [ruleName, ruleValue] of Object.entries(rules)) {
            const validator = typeof ruleValue === 'function'
                ? ruleValue
                : FormValidator.rules[ruleName](ruleValue);

            if (!validator(value, formData)) {
                const message = typeof FormValidator.messages[ruleName] === 'function'
                    ? FormValidator.messages[ruleName](ruleValue)
                    : FormValidator.messages[ruleName];

                this.showError(field, message);
                return false;
            }
        }

        this.clearError(field);
        return true;
    }

    showError(field, message) {
        const formGroup = field.closest('.form-group');
        if (!formGroup) return;

        formGroup.classList.add('error');

        let errorElement = formGroup.querySelector('.form-error');
        if (!errorElement) {
            errorElement = document.createElement('span');
            errorElement.className = 'form-error';
            errorElement.setAttribute('role', 'alert');
            formGroup.appendChild(errorElement);
        }

        errorElement.textContent = message;
        field.setAttribute('aria-invalid', 'true');
        field.setAttribute('aria-describedby', errorElement.id || 'error-' + field.id);

        this.errors.set(field.name, message);
    }

    clearError(field) {
        const formGroup = field.closest('.form-group');
        if (!formGroup) return;

        formGroup.classList.remove('error');
        field.removeAttribute('aria-invalid');
        field.removeAttribute('aria-describedby');

        this.errors.delete(field.name);
    }

    validateAll(fieldRules) {
        let isValid = true;

        for (const [fieldName, rules] of Object.entries(fieldRules)) {
            const field = this.form.querySelector(`[name="${fieldName}"]`);
            if (field && !this.validateField(field, rules)) {
                isValid = false;
            }
        }

        return isValid;
    }

    reset() {
        this.errors.clear();
        this.form.querySelectorAll('.form-group.error').forEach(group => {
            group.classList.remove('error');
        });
        this.form.querySelectorAll('[aria-invalid]').forEach(field => {
            field.removeAttribute('aria-invalid');
            field.removeAttribute('aria-describedby');
        });
    }
}

// Real-time validation helper
export function setupRealtimeValidation(form, fieldRules) {
    const validator = new FormValidator(form);

    for (const fieldName of Object.keys(fieldRules)) {
        const field = form.querySelector(`[name="${fieldName}"]`);
        if (!field) continue;

        field.addEventListener('blur', () => {
            validator.validateField(field, fieldRules[fieldName]);
        });

        field.addEventListener('input', () => {
            if (validator.errors.has(fieldName)) {
                validator.validateField(field, fieldRules[fieldName]);
            }
        });
    }

    return validator;
}

export { FormValidator as default };
