/**
 * Register Form Component
 * 
 * User registration form with validation.
 */
import { Form } from '../base/Form.js';
import { authService } from '../../services/index.js';
import { toast } from '../base/Toast.js';
import { ValidationRules } from '../../utils/validation.js';
import { eventBus, Events } from '../../core/eventBus.js';

export class RegisterForm extends Form {
    constructor(container) {
        super(container, {
            validators: {
                firstName: ValidationRules.required(),
                lastName: ValidationRules.required(),
                email: ValidationRules.compose(
                    ValidationRules.required(),
                    ValidationRules.email()
                ),
                password: ValidationRules.compose(
                    ValidationRules.required(),
                    ValidationRules.password()
                ),
                confirmPassword: ValidationRules.passwordMatch('password'),
                role: ValidationRules.required()
            },
            onSubmit: async (values) => {
                try {
                    await authService.register({
                        first_name: values.firstName,
                        last_name: values.lastName,
                        email: values.email,
                        password: values.password,
                        role: values.role
                    });
                    toast.success('Account created successfully!');

                    // Clear only password fields, keep user info
                    this.clearPasswords();

                    eventBus.emit(Events.AUTH_REGISTER_SUCCESS, { email: values.email });
                } catch (error) {
                    toast.error(error.message || 'Registration failed');
                    throw error;
                }
            }
        });
    }

    render() {
        const { errors, isSubmitting } = this.state;

        this.container.innerHTML = `
            <form class="auth-form" novalidate>
                <h2>Create Account</h2>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="register-firstName">First Name</label>
                        <input 
                            type="text" 
                            id="register-firstName" 
                            name="firstName" 
                            class="${this.hasError('firstName') ? 'error' : ''}"
                            placeholder="John"
                            autocomplete="given-name"
                            required
                        />
                        ${this.getError('firstName') ? `<span class="error-message">${this.getError('firstName')}</span>` : ''}
                    </div>
                    <div class="form-group">
                        <label for="register-lastName">Last Name</label>
                        <input 
                            type="text" 
                            id="register-lastName" 
                            name="lastName" 
                            class="${this.hasError('lastName') ? 'error' : ''}"
                            placeholder="Doe"
                            autocomplete="family-name"
                            required
                        />
                        ${this.getError('lastName') ? `<span class="error-message">${this.getError('lastName')}</span>` : ''}
                    </div>
                </div>

                <div class="form-group">
                    <label for="register-email">Email</label>
                    <input 
                        type="email" 
                        id="register-email" 
                        name="email" 
                        class="${this.hasError('email') ? 'error' : ''}"
                        placeholder="Enter your email"
                        autocomplete="email"
                        required
                    />
                    ${this.getError('email') ? `<span class="error-message">${this.getError('email')}</span>` : ''}
                </div>

                <div class="form-group">
                    <label for="register-password">Password</label>
                    <input 
                        type="password" 
                        id="register-password" 
                        name="password" 
                        class="${this.hasError('password') ? 'error' : ''}"
                        placeholder="At least 8 characters"
                        autocomplete="new-password"
                        required
                    />
                    ${this.getError('password') ? `<span class="error-message">${this.getError('password')}</span>` : ''}
                </div>

                <div class="form-group">
                    <label for="register-confirmPassword">Confirm Password</label>
                    <input 
                        type="password" 
                        id="register-confirmPassword" 
                        name="confirmPassword" 
                        class="${this.hasError('confirmPassword') ? 'error' : ''}"
                        placeholder="Re-enter password"
                        autocomplete="new-password"
                        required
                    />
                    ${this.getError('confirmPassword') ? `<span class="error-message">${this.getError('confirmPassword')}</span>` : ''}
                </div>

                <div class="form-group">
                    <label for="register-role">I want to</label>
                    <select 
                        id="register-role" 
                        name="role" 
                        class="${this.hasError('role') ? 'error' : ''}"
                        required
                    >
                        <option value="">Select...</option>
                        <option value="buyer">Buy products</option>
                        <option value="seller">Sell products</option>
                    </select>
                    ${this.getError('role') ? `<span class="error-message">${this.getError('role')}</span>` : ''}
                </div>

                <button type="submit" class="btn btn-primary btn-block" ${isSubmitting ? 'disabled' : ''}>
                    ${isSubmitting ? 'Creating account...' : 'Create Account'}
                </button>

                <p class="form-footer">
                    Already have an account? <a href="#" data-switch-to-login>Sign in</a>
                </p>
            </form>
        `;
    }

    attachEventListeners() {
        super.attachFormListeners();

        // Switch to login
        const switchBtn = this.$('[data-switch-to-login]');
        if (switchBtn) {
            this.addEventListener(switchBtn, 'click', (e) => {
                e.preventDefault();
                if (this.onSwitchToLogin) {
                    this.onSwitchToLogin();
                }
            });
        }
    }
}
