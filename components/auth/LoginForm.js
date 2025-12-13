/**
 * Login Form Component
 * 
 * User login form with validation.
 */
import { Form } from '../base/Form.js';
import { authService } from '../../services/index.js';
import { toast } from '../base/Toast.js';
import { ValidationRules } from '../../utils/validation.js';

export class LoginForm extends Form {
    constructor(container) {
        super(container, {
            validators: {
                email: ValidationRules.compose(
                    ValidationRules.required(),
                    ValidationRules.email()
                ),
                password: ValidationRules.required()
            },
            onSubmit: async (values) => {
                try {
                    await authService.login(values.email, values.password);
                    toast.success('Welcome back!');
                } catch (error) {
                    toast.error(error.message || 'Login failed');
                    throw error;
                }
            }
        });
    }

    render() {
        const { errors, isSubmitting } = this.state;

        this.container.innerHTML = `
            <form class="auth-form" novalidate>
                <h2>Sign In</h2>
                
                <div class="form-group">
                    <label for="login-email">Email</label>
                    <input 
                        type="email" 
                        id="login-email" 
                        name="email" 
                        class="${this.hasError('email') ? 'error' : ''}"
                        placeholder="Enter your email"
                        autocomplete="email"
                        required
                    />
                    ${this.getError('email') ? `<span class="error-message">${this.getError('email')}</span>` : ''}
                </div>

                <div class="form-group">
                    <label for="login-password">Password</label>
                    <input 
                        type="password" 
                        id="login-password" 
                        name="password" 
                        class="${this.hasError('password') ? 'error' : ''}"
                        placeholder="Enter your password"
                        autocomplete="current-password"
                        required
                    />
                    ${this.getError('password') ? `<span class="error-message">${this.getError('password')}</span>` : ''}
                </div>

                <button type="submit" class="btn btn-primary btn-block" ${isSubmitting ? 'disabled' : ''}>
                    ${isSubmitting ? 'Signing in...' : 'Sign In'}
                </button>

                <p class="form-footer">
                    Don't have an account? <a href="#" data-switch-to-register>Sign up</a>
                </p>
            </form>
        `;
    }

    attachEventListeners() {
        super.attachFormListeners();

        // Switch to register
        const switchBtn = this.$('[data-switch-to-register]');
        if (switchBtn) {
            this.addEventListener(switchBtn, 'click', (e) => {
                e.preventDefault();
                if (this.onSwitchToRegister) {
                    this.onSwitchToRegister();
                }
            });
        }
    }
}
