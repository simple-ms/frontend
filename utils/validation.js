/**
 * Enhanced Validation Utilities
 * 
 * Comprehensive validation functions with security in mind.
 */

import { SecurityConfig, validatePassword as secureValidatePassword } from '../core/security.config.js';
import { sanitizeInput, isValidEmail as secureIsValidEmail } from './security.js';

/**
 * Validation Rules
 */
export const ValidationRules = {
    /**
     * Required field validator
     */
    required: (message = 'This field is required') => (value) => {
        if (value === null || value === undefined || value === '') {
            return message;
        }
        if (typeof value === 'string' && value.trim() === '') {
            return message;
        }
        return null;
    },

    /**
     * Email validator
     */
    email: (message = 'Please enter a valid email address') => (value) => {
        if (!value) return null; // Use with required() for mandatory emails
        if (!secureIsValidEmail(value)) {
            return message;
        }
        return null;
    },

    /**
     * Min length validator
     */
    minLength: (min, message) => (value) => {
        if (!value) return null;
        if (value.length < min) {
            return message || `Must be at least ${min} characters`;
        }
        return null;
    },

    /**
     * Max length validator
     */
    maxLength: (max, message) => (value) => {
        if (!value) return null;
        if (value.length > max) {
            return message || `Must be less than ${max} characters`;
        }
        return null;
    },

    /**
     * Pattern validator
     */
    pattern: (regex, message = 'Invalid format') => (value) => {
        if (!value) return null;
        if (!regex.test(value)) {
            return message;
        }
        return null;
    },

    /**
     * Number validator
     */
    number: (message = 'Must be a valid number') => (value) => {
        if (!value) return null;
        if (isNaN(Number(value))) {
            return message;
        }
        return null;
    },

    /**
     * Min value validator
     */
    min: (minValue, message) => (value) => {
        if (!value) return null;
        if (Number(value) < minValue) {
            return message || `Must be at least ${minValue}`;
        }
        return null;
    },

    /**
     * Max value validator
     */
    max: (maxValue, message) => (value) => {
        if (!value) return null;
        if (Number(value) > maxValue) {
            return message || `Must be at most ${maxValue}`;
        }
        return null;
    },

    /**
     * Password validator with security policy
     */
    password: (message) => (value, allValues) => {
        if (!value) return null;

        const result = secureValidatePassword(value, {
            email: allValues?.email
        });

        if (!result.valid) {
            return message || result.errors[0];
        }

        return null;
    },

    /**
     * Password confirmation validator
     */
    passwordMatch: (passwordField = 'password', message = 'Passwords do not match') => (value, allValues) => {
        if (!value) return null;
        if (value !== allValues[passwordField]) {
            return message;
        }
        return null;
    },

    /**
     * URL validator
     */
    url: (message = 'Please enter a valid URL') => (value) => {
        if (!value) return null;
        try {
            new URL(value);
            return null;
        } catch {
            return message;
        }
    },

    /**
     * Phone validator (simple)
     */
    phone: (message = 'Please enter a valid phone number') => (value) => {
        if (!value) return null;
        const phoneRegex = /^[\d\s\-\+\(\)]+$/;
        if (!phoneRegex.test(value) || value.replace(/\D/g, '').length < 10) {
            return message;
        }
        return null;
    },

    /**
     * Date validator
     */
    date: (message = 'Please enter a valid date') => (value) => {
        if (!value) return null;
        const date = new Date(value);
        if (isNaN(date.getTime())) {
            return message;
        }
        return null;
    },

    /**
     * Future date validator
     */
    futureDate: (message = 'Date must be in the future') => (value) => {
        if (!value) return null;
        const date = new Date(value);
        if (date <= new Date()) {
            return message;
        }
        return null;
    },

    /**
     * Past date validator
     */
    pastDate: (message = 'Date must be in the past') => (value) => {
        if (!value) return null;
        const date = new Date(value);
        if (date >= new Date()) {
            return message;
        }
        return null;
    },

    /**
     * Custom validator
     */
    custom: (validatorFn, message = 'Invalid value') => (value, allValues) => {
        if (!value) return null;
        const isValid = validatorFn(value, allValues);
        return isValid ? null : message;
    },

    /**
     * Compose multiple validators
     */
    compose: (...validators) => (value, allValues) => {
        for (const validator of validators) {
            const error = validator(value, allValues);
            if (error) return error;
        }
        return null;
    }
};

/**
 * Common validator combinations
 */
export const CommonValidators = {
    requiredEmail: ValidationRules.compose(
        ValidationRules.required(),
        ValidationRules.email()
    ),

    requiredPassword: ValidationRules.compose(
        ValidationRules.required(),
        ValidationRules.password()
    ),

    requiredText: (min = 1, max = 1000) => ValidationRules.compose(
        ValidationRules.required(),
        ValidationRules.minLength(min),
        ValidationRules.maxLength(max)
    ),

    requiredNumber: (min, max) => ValidationRules.compose(
        ValidationRules.required(),
        ValidationRules.number(),
        ...(min !== undefined ? [ValidationRules.min(min)] : []),
        ...(max !== undefined ? [ValidationRules.max(max)] : [])
    ),

    optionalEmail: ValidationRules.email(),

    optionalUrl: ValidationRules.url(),

    optionalPhone: ValidationRules.phone()
};

/**
 * Sanitize and validate input
 */
export function sanitizeAndValidate(value, validator) {
    // First sanitize
    const sanitized = typeof value === 'string' ? sanitizeInput(value) : value;

    // Then validate
    const error = validator ? validator(sanitized) : null;

    return {
        value: sanitized,
        error,
        isValid: !error
    };
}

export default ValidationRules;
