// ===========================================
// Input Validation Module
// ===========================================

/**
 * Lightweight validation library (no external dependencies)
 * Inspired by Zod but simplified for our needs
 */

// ===========================================
// Validation Rules
// ===========================================

const validators = {
    /**
     * String validators
     */
    string: {
        required: (value) => {
            if (typeof value !== 'string' || value.trim().length === 0) {
                return 'This field is required';
            }
            return null;
        },

        email: (value) => {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                return 'Please enter a valid email address';
            }
            return null;
        },

        min: (minLength) => (value) => {
            if (value.length < minLength) {
                return `Must be at least ${minLength} characters`;
            }
            return null;
        },

        max: (maxLength) => (value) => {
            if (value.length > maxLength) {
                return `Must be at most ${maxLength} characters`;
            }
            return null;
        },

        pattern: (regex, message) => (value) => {
            if (!regex.test(value)) {
                return message || 'Invalid format';
            }
            return null;
        },

        url: (value) => {
            try {
                new URL(value);
                return null;
            } catch {
                return 'Please enter a valid URL';
            }
        }
    },

    /**
     * Number validators
     */
    number: {
        required: (value) => {
            if (typeof value !== 'number' || isNaN(value)) {
                return 'This field must be a number';
            }
            return null;
        },

        min: (minValue) => (value) => {
            if (value < minValue) {
                return `Must be at least ${minValue}`;
            }
            return null;
        },

        max: (maxValue) => (value) => {
            if (value > maxValue) {
                return `Must be at most ${maxValue}`;
            }
            return null;
        },

        positive: (value) => {
            if (value <= 0) {
                return 'Must be a positive number';
            }
            return null;
        },

        integer: (value) => {
            if (!Number.isInteger(value)) {
                return 'Must be a whole number';
            }
            return null;
        }
    },

    /**
     * Boolean validators
     */
    boolean: {
        required: (value) => {
            if (typeof value !== 'boolean') {
                return 'This field must be true or false';
            }
            return null;
        },

        mustBeTrue: (value) => {
            if (value !== true) {
                return 'This field must be accepted';
            }
            return null;
        }
    }
};

// ===========================================
// Password Strength Validator
// ===========================================

const passwordValidator = {
    /**
     * Validate password strength
     * Requirements:
     * - At least 8 characters
     * - At least one uppercase letter
     * - At least one lowercase letter
     * - At least one digit
     * - At least one special character
     */
    strong: (value) => {
        const errors = [];

        if (value.length < 8) {
            errors.push('at least 8 characters');
        }
        if (!/[A-Z]/.test(value)) {
            errors.push('one uppercase letter');
        }
        if (!/[a-z]/.test(value)) {
            errors.push('one lowercase letter');
        }
        if (!/[0-9]/.test(value)) {
            errors.push('one number');
        }
        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value)) {
            errors.push('one special character');
        }

        if (errors.length > 0) {
            return `Password must contain ${errors.join(', ')}`;
        }

        return null;
    },

    /**
     * Check if passwords match
     */
    match: (password) => (confirmPassword) => {
        if (password !== confirmPassword) {
            return 'Passwords do not match';
        }
        return null;
    }
};

// ===========================================
// Schema Builder
// ===========================================

class ValidationSchema {
    constructor(fields) {
        this.fields = fields;
    }

    /**
     * Validate data against schema
     * @param {Object} data - Data to validate
     * @returns {Object} { success: boolean, errors: Object, data: Object }
     */
    validate(data) {
        const errors = {};
        const validatedData = {};

        for (const [fieldName, rules] of Object.entries(this.fields)) {
            const value = data[fieldName];

            // Run all validation rules for this field
            for (const rule of rules) {
                const error = rule(value);
                if (error) {
                    errors[fieldName] = error;
                    break; // Stop at first error for this field
                }
            }

            // If no errors, add to validated data
            if (!errors[fieldName]) {
                validatedData[fieldName] = value;
            }
        }

        return {
            success: Object.keys(errors).length === 0,
            errors,
            data: validatedData
        };
    }
}

// ===========================================
// Predefined Schemas
// ===========================================

/**
 * Login validation schema
 */
const loginSchema = new ValidationSchema({
    email: [
        validators.string.required,
        validators.string.email
    ],
    password: [
        validators.string.required,
        validators.string.min(8)
    ]
});

/**
 * Registration validation schema
 */
const registerSchema = new ValidationSchema({
    first_name: [
        validators.string.required,
        validators.string.min(2),
        validators.string.max(50)
    ],
    last_name: [
        validators.string.required,
        validators.string.min(2),
        validators.string.max(50)
    ],
    email: [
        validators.string.required,
        validators.string.email
    ],
    password: [
        validators.string.required,
        passwordValidator.strong
    ],
    password_repeat: [
        validators.string.required
    ],
    role: [
        validators.string.required
    ]
});

/**
 * Password change validation schema
 */
const passwordChangeSchema = new ValidationSchema({
    old_password: [
        validators.string.required
    ],
    new_password: [
        validators.string.required,
        passwordValidator.strong
    ],
    confirm_password: [
        validators.string.required
    ]
});

/**
 * Product validation schema
 */
const productSchema = new ValidationSchema({
    name: [
        validators.string.required,
        validators.string.min(3),
        validators.string.max(100)
    ],
    description: [
        validators.string.required,
        validators.string.min(10),
        validators.string.max(1000)
    ],
    price: [
        validators.number.required,
        validators.number.positive
    ],
    stock: [
        validators.number.required,
        validators.number.integer,
        validators.number.min(0)
    ]
});

// ===========================================
// Helper Functions
// ===========================================

/**
 * Display validation errors in the UI
 */
function displayValidationErrors(errors, messageElementId) {
    const errorMessages = Object.entries(errors)
        .map(([field, message]) => `${field.replace(/_/g, ' ')}: ${message}`)
        .join('\n');

    const messageElement = document.getElementById(messageElementId);
    if (messageElement) {
        messageElement.textContent = errorMessages;
        messageElement.className = 'message error show';
    }
}

/**
 * Clear validation errors
 */
function clearValidationErrors(messageElementId) {
    const messageElement = document.getElementById(messageElementId);
    if (messageElement) {
        messageElement.textContent = '';
        messageElement.className = 'message';
    }
}

// ===========================================
// Exports
// ===========================================

export {
    validators,
    passwordValidator,
    ValidationSchema,
    loginSchema,
    registerSchema,
    passwordChangeSchema,
    productSchema,
    displayValidationErrors,
    clearValidationErrors
};
