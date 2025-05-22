/**
 * Authentication UI Components
 * Modern, accessible, and beautiful auth interface
 */

class AuthUI {
  constructor(authSystem) {
    this.auth = authSystem;
    this.currentView = 'signin';
    this.elements = {};
    this.animations = {
      fadeIn: 'fadeIn 0.4s ease-out',
      slideUp: 'slideUp 0.5s ease-out',
      shake: 'shake 0.5s ease-in-out',
    };
  }

  /**
   * Initialize UI
   */
  init() {
    this.createAuthContainer();
    this.attachEventListeners();
    this.setupKeyboardNavigation();
    this.setupAccessibility();
  }

  /**
   * Create the main authentication container
   */
  createAuthContainer() {
    const container = document.createElement('div');
    container.className = 'auth-modal-overlay';
    container.innerHTML = `
      <div class="auth-modal">
        <div class="auth-background">
          <div class="auth-background-shape auth-shape-1"></div>
          <div class="auth-background-shape auth-shape-2"></div>
          <div class="auth-background-shape auth-shape-3"></div>
        </div>
        
        <div class="auth-content">
          <!-- Close button -->
          <button class="auth-close" aria-label="Close authentication">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>

          <!-- Logo and branding -->
          <div class="auth-header">
            <div class="auth-logo">
              <i class="fas fa-wine-glass-alt"></i>
            </div>
            <h1 class="auth-title">WineRater</h1>
            <p class="auth-subtitle">Your personal wine journey</p>
          </div>

          <!-- Main auth form -->
          <div class="auth-form-container">
            ${this.createSignInView()}
            ${this.createSignUpView()}
            ${this.createForgotPasswordView()}
            ${this.createAccountLinkingView()}
          </div>

          <!-- Social auth section -->
          <div class="auth-social-section">
            <div class="auth-divider">
              <span>or continue with</span>
            </div>
            
            <div class="auth-social-buttons">
              <button class="auth-social-btn auth-google-btn" id="google-signin-btn">
                <svg class="auth-social-icon" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>Continue with Google</span>
              </button>
              
              <button class="auth-social-btn auth-apple-btn" id="apple-signin-btn">
                <svg class="auth-social-icon" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"/>
                </svg>
                <span>Continue with Apple</span>
              </button>
            </div>
          </div>

          <!-- Privacy and terms -->
          <div class="auth-footer">
            <p class="auth-terms">
              By continuing, you agree to our 
              <a href="#" class="auth-link">Terms of Service</a> and 
              <a href="#" class="auth-link">Privacy Policy</a>
            </p>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(container);
    this.elements.container = container;
    this.elements.modal = container.querySelector('.auth-modal');
    
    // Cache form elements
    this.cacheElements();
  }

  /**
   * Create sign-in view
   */
  createSignInView() {
    return `
      <div class="auth-view" id="signin-view" data-view="signin">
        <h2 class="auth-form-title">Welcome back</h2>
        <p class="auth-form-subtitle">Sign in to continue to your wine collection</p>
        
        <form class="auth-form" id="signin-form">
          <div class="auth-input-group">
            <label class="auth-label" for="signin-email">Email address</label>
            <div class="auth-input-wrapper">
              <input 
                type="email" 
                id="signin-email" 
                class="auth-input" 
                placeholder="name@example.com"
                required
                autocomplete="email"
                autofocus
              />
              <span class="auth-input-icon">
                <i class="far fa-envelope"></i>
              </span>
            </div>
            <span class="auth-input-error" data-error="email"></span>
          </div>

          <div class="auth-input-group">
            <div class="auth-label-wrapper">
              <label class="auth-label" for="signin-password">Password</label>
              <a href="#" class="auth-link auth-forgot-link" data-action="forgot-password">
                Forgot password?
              </a>
            </div>
            <div class="auth-input-wrapper">
              <input 
                type="password" 
                id="signin-password" 
                class="auth-input" 
                placeholder="Enter your password"
                required
                autocomplete="current-password"
              />
              <button type="button" class="auth-input-toggle" data-toggle="password">
                <i class="far fa-eye"></i>
              </button>
            </div>
            <span class="auth-input-error" data-error="password"></span>
          </div>

          <div class="auth-checkbox-group">
            <label class="auth-checkbox-label">
              <input type="checkbox" id="remember-me" class="auth-checkbox" />
              <span class="auth-checkbox-text">Remember me for 30 days</span>
            </label>
          </div>

          <button type="submit" class="auth-submit-btn">
            <span class="auth-btn-text">Sign In</span>
            <span class="auth-btn-loader">
              <svg class="auth-spinner" viewBox="0 0 24 24">
                <circle class="auth-spinner-circle" cx="12" cy="12" r="10" fill="none" stroke-width="3"></circle>
              </svg>
            </span>
          </button>

          <p class="auth-switch-view">
            Don't have an account? 
            <a href="#" class="auth-link" data-action="show-signup">Sign up</a>
          </p>
        </form>
      </div>
    `;
  }

  /**
   * Create sign-up view
   */
  createSignUpView() {
    return `
      <div class="auth-view" id="signup-view" data-view="signup" style="display: none;">
        <h2 class="auth-form-title">Create your account</h2>
        <p class="auth-form-subtitle">Start your wine journey today</p>
        
        <form class="auth-form" id="signup-form">
          <div class="auth-input-group">
            <label class="auth-label" for="signup-name">Full name</label>
            <div class="auth-input-wrapper">
              <input 
                type="text" 
                id="signup-name" 
                class="auth-input" 
                placeholder="John Doe"
                required
                autocomplete="name"
              />
              <span class="auth-input-icon">
                <i class="far fa-user"></i>
              </span>
            </div>
            <span class="auth-input-error" data-error="name"></span>
          </div>

          <div class="auth-input-group">
            <label class="auth-label" for="signup-email">Email address</label>
            <div class="auth-input-wrapper">
              <input 
                type="email" 
                id="signup-email" 
                class="auth-input" 
                placeholder="name@example.com"
                required
                autocomplete="email"
              />
              <span class="auth-input-icon">
                <i class="far fa-envelope"></i>
              </span>
            </div>
            <span class="auth-input-error" data-error="email"></span>
          </div>

          <div class="auth-input-group">
            <label class="auth-label" for="signup-password">Password</label>
            <div class="auth-input-wrapper">
              <input 
                type="password" 
                id="signup-password" 
                class="auth-input" 
                placeholder="Create a strong password"
                required
                autocomplete="new-password"
                minlength="8"
              />
              <button type="button" class="auth-input-toggle" data-toggle="password">
                <i class="far fa-eye"></i>
              </button>
            </div>
            <div class="auth-password-strength">
              <div class="auth-strength-bar">
                <div class="auth-strength-fill" data-strength="0"></div>
              </div>
              <span class="auth-strength-text">Password strength: <span data-strength-text>Weak</span></span>
            </div>
            <span class="auth-input-error" data-error="password"></span>
          </div>

          <div class="auth-checkbox-group">
            <label class="auth-checkbox-label">
              <input type="checkbox" id="agree-terms" class="auth-checkbox" required />
              <span class="auth-checkbox-text">
                I agree to the Terms of Service and Privacy Policy
              </span>
            </label>
          </div>

          <div class="auth-checkbox-group">
            <label class="auth-checkbox-label">
              <input type="checkbox" id="marketing-consent" class="auth-checkbox" />
              <span class="auth-checkbox-text">
                Send me wine tips and special offers (you can unsubscribe anytime)
              </span>
            </label>
          </div>

          <button type="submit" class="auth-submit-btn">
            <span class="auth-btn-text">Create Account</span>
            <span class="auth-btn-loader">
              <svg class="auth-spinner" viewBox="0 0 24 24">
                <circle class="auth-spinner-circle" cx="12" cy="12" r="10" fill="none" stroke-width="3"></circle>
              </svg>
            </span>
          </button>

          <p class="auth-switch-view">
            Already have an account? 
            <a href="#" class="auth-link" data-action="show-signin">Sign in</a>
          </p>
        </form>
      </div>
    `;
  }

  /**
   * Create forgot password view
   */
  createForgotPasswordView() {
    return `
      <div class="auth-view" id="forgot-view" data-view="forgot" style="display: none;">
        <h2 class="auth-form-title">Reset your password</h2>
        <p class="auth-form-subtitle">We'll send you a link to reset your password</p>
        
        <form class="auth-form" id="forgot-form">
          <div class="auth-input-group">
            <label class="auth-label" for="forgot-email">Email address</label>
            <div class="auth-input-wrapper">
              <input 
                type="email" 
                id="forgot-email" 
                class="auth-input" 
                placeholder="name@example.com"
                required
                autocomplete="email"
              />
              <span class="auth-input-icon">
                <i class="far fa-envelope"></i>
              </span>
            </div>
            <span class="auth-input-error" data-error="email"></span>
          </div>

          <button type="submit" class="auth-submit-btn">
            <span class="auth-btn-text">Send Reset Link</span>
            <span class="auth-btn-loader">
              <svg class="auth-spinner" viewBox="0 0 24 24">
                <circle class="auth-spinner-circle" cx="12" cy="12" r="10" fill="none" stroke-width="3"></circle>
              </svg>
            </span>
          </button>

          <p class="auth-switch-view">
            Remember your password? 
            <a href="#" class="auth-link" data-action="show-signin">Sign in</a>
          </p>
        </form>

        <div class="auth-success-message" id="reset-success" style="display: none;">
          <div class="auth-success-icon">
            <i class="fas fa-check-circle"></i>
          </div>
          <h3>Check your email</h3>
          <p>We've sent a password reset link to <span id="reset-email"></span></p>
          <button class="auth-text-btn" data-action="show-signin">Back to sign in</button>
        </div>
      </div>
    `;
  }

  /**
   * Create account linking view
   */
  createAccountLinkingView() {
    return `
      <div class="auth-view" id="link-view" data-view="link" style="display: none;">
        <h2 class="auth-form-title">Link your accounts</h2>
        <p class="auth-form-subtitle">
          An account with this email already exists. 
          Sign in to link your Google account.
        </p>
        
        <div class="auth-account-info">
          <div class="auth-account-avatar">
            <img id="link-avatar" src="" alt="Account avatar" />
          </div>
          <div class="auth-account-details">
            <p class="auth-account-name" id="link-name"></p>
            <p class="auth-account-email" id="link-email"></p>
          </div>
        </div>

        <form class="auth-form" id="link-form">
          <div class="auth-input-group">
            <label class="auth-label" for="link-password">Enter your password</label>
            <div class="auth-input-wrapper">
              <input 
                type="password" 
                id="link-password" 
                class="auth-input" 
                placeholder="Enter your existing password"
                required
                autocomplete="current-password"
              />
              <button type="button" class="auth-input-toggle" data-toggle="password">
                <i class="far fa-eye"></i>
              </button>
            </div>
            <span class="auth-input-error" data-error="password"></span>
          </div>

          <button type="submit" class="auth-submit-btn">
            <span class="auth-btn-text">Link Accounts</span>
            <span class="auth-btn-loader">
              <svg class="auth-spinner" viewBox="0 0 24 24">
                <circle class="auth-spinner-circle" cx="12" cy="12" r="10" fill="none" stroke-width="3"></circle>
              </svg>
            </span>
          </button>

          <p class="auth-switch-view">
            <a href="#" class="auth-link" data-action="cancel-link">Cancel</a>
          </p>
        </form>
      </div>
    `;
  }

  /**
   * Show authentication modal
   */
  show(view = 'signin') {
    this.currentView = view;
    this.elements.container.classList.add('active');
    this.showView(view);
    
    // Focus first input
    setTimeout(() => {
      const firstInput = this.elements[view + 'View'].querySelector('input');
      if (firstInput) firstInput.focus();
    }, 300);
  }

  /**
   * Hide authentication modal
   */
  hide() {
    this.elements.container.classList.remove('active');
    this.resetForms();
  }

  /**
   * Switch between views
   */
  showView(viewName) {
    // Hide all views
    document.querySelectorAll('.auth-view').forEach(view => {
      view.style.display = 'none';
    });
    
    // Show requested view
    const view = document.getElementById(viewName + '-view');
    if (view) {
      view.style.display = 'block';
      view.style.animation = this.animations.fadeIn;
    }
    
    this.currentView = viewName;
  }

  /**
   * Setup event listeners
   */
  attachEventListeners() {
    // Close button
    this.elements.container.querySelector('.auth-close').addEventListener('click', () => {
      this.hide();
    });

    // Close on overlay click
    this.elements.container.addEventListener('click', (e) => {
      if (e.target === this.elements.container) {
        this.hide();
      }
    });

    // View switching
    document.querySelectorAll('[data-action]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const action = link.dataset.action;
        
        switch (action) {
          case 'show-signin':
            this.showView('signin');
            break;
          case 'show-signup':
            this.showView('signup');
            break;
          case 'forgot-password':
            this.showView('forgot');
            break;
          case 'cancel-link':
            this.showView('signin');
            break;
        }
      });
    });

    // Password visibility toggle
    document.querySelectorAll('[data-toggle="password"]').forEach(toggle => {
      toggle.addEventListener('click', () => {
        const input = toggle.parentElement.querySelector('input');
        const icon = toggle.querySelector('i');
        
        if (input.type === 'password') {
          input.type = 'text';
          icon.className = 'far fa-eye-slash';
        } else {
          input.type = 'password';
          icon.className = 'far fa-eye';
        }
      });
    });

    // Form submissions
    this.setupFormHandlers();

    // Google sign-in button
    document.getElementById('google-signin-btn').addEventListener('click', async () => {
      await this.handleGoogleSignIn();
    });

    // Password strength checker
    const signupPassword = document.getElementById('signup-password');
    if (signupPassword) {
      signupPassword.addEventListener('input', (e) => {
        this.updatePasswordStrength(e.target.value);
      });
    }
  }

  /**
   * Setup form handlers
   */
  setupFormHandlers() {
    // Sign in form
    const signinForm = document.getElementById('signin-form');
    signinForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleSignIn();
    });

    // Sign up form
    const signupForm = document.getElementById('signup-form');
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleSignUp();
    });

    // Forgot password form
    const forgotForm = document.getElementById('forgot-form');
    forgotForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleForgotPassword();
    });

    // Link account form
    const linkForm = document.getElementById('link-form');
    linkForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleAccountLinking();
    });
  }

  /**
   * Handle Google sign-in
   */
  async handleGoogleSignIn() {
    const button = document.getElementById('google-signin-btn');
    this.setButtonLoading(button, true);

    try {
      await this.auth.signInWithGoogle({
        context: this.currentView === 'signup' ? 'signup' : 'signin'
      });
      
      this.hide();
    } catch (error) {
      console.error('Google sign-in failed:', error);
      
      // Check if account exists with different credential
      if (error.code === 'auth/account-exists-with-different-credential') {
        this.showAccountLinking(error.email);
      }
    } finally {
      this.setButtonLoading(button, false);
    }
  }

  /**
   * Handle email/password sign in
   */
  async handleSignIn() {
    const form = document.getElementById('signin-form');
    const email = form.querySelector('#signin-email').value;
    const password = form.querySelector('#signin-password').value;
    const rememberMe = form.querySelector('#remember-me').checked;

    this.clearErrors();
    this.setSubmitLoading(true);

    try {
      // Validate inputs
      if (!this.validateEmail(email)) {
        this.showError('email', 'Please enter a valid email address');
        return;
      }

      // Sign in
      await firebase.auth().signInWithEmailAndPassword(email, password);
      
      // Create session
      const user = firebase.auth().currentUser;
      await this.auth.createSession({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
      }, {
        authMethod: 'email',
        rememberMe
      });

      this.hide();
      this.auth.emit('authSuccess', { user, method: 'email' });

    } catch (error) {
      this.handleFormError(error);
    } finally {
      this.setSubmitLoading(false);
    }
  }

  /**
   * Password strength calculation
   */
  updatePasswordStrength(password) {
    let strength = 0;
    const strengthBar = document.querySelector('.auth-strength-fill');
    const strengthText = document.querySelector('[data-strength-text]');

    // Length check
    if (password.length >= 8) strength += 20;
    if (password.length >= 12) strength += 20;

    // Character variety
    if (/[a-z]/.test(password)) strength += 15;
    if (/[A-Z]/.test(password)) strength += 15;
    if (/[0-9]/.test(password)) strength += 15;
    if (/[^A-Za-z0-9]/.test(password)) strength += 15;

    // Update UI
    strengthBar.style.width = strength + '%';
    strengthBar.setAttribute('data-strength', strength);

    let text = 'Weak';
    let color = '#ef4444';

    if (strength > 80) {
      text = 'Strong';
      color = '#10b981';
    } else if (strength > 60) {
      text = 'Good';
      color = '#3b82f6';
    } else if (strength > 40) {
      text = 'Fair';
      color = '#f59e0b';
    }

    strengthBar.style.backgroundColor = color;
    strengthText.textContent = text;
  }

  /**
   * Form validation helpers
   */
  validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  showError(field, message) {
    const errorElement = document.querySelector(`[data-error="${field}"]`);
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.display = 'block';
    }

    const input = document.getElementById(this.currentView + '-' + field);
    if (input) {
      input.classList.add('error');
    }
  }

  clearErrors() {
    document.querySelectorAll('.auth-input-error').forEach(error => {
      error.style.display = 'none';
    });
    
    document.querySelectorAll('.auth-input').forEach(input => {
      input.classList.remove('error');
    });
  }

  /**
   * Loading states
   */
  setButtonLoading(button, loading) {
    if (loading) {
      button.classList.add('loading');
      button.disabled = true;
    } else {
      button.classList.remove('loading');
      button.disabled = false;
    }
  }

  setSubmitLoading(loading) {
    const button = document.querySelector(`#${this.currentView}-form .auth-submit-btn`);
    this.setButtonLoading(button, loading);
  }

  /**
   * Error handling
   */
  handleFormError(error) {
    const errorMessages = {
      'auth/user-not-found': 'No account found with this email',
      'auth/wrong-password': 'Incorrect password',
      'auth/invalid-email': 'Invalid email address',
      'auth/email-already-in-use': 'An account already exists with this email',
      'auth/weak-password': 'Password is too weak',
      'auth/too-many-requests': 'Too many attempts. Please try again later.',
    };

    const message = errorMessages[error.code] || 'An error occurred. Please try again.';
    
    // Show appropriate error
    if (error.code?.includes('email')) {
      this.showError('email', message);
    } else if (error.code?.includes('password')) {
      this.showError('password', message);
    } else {
      // Show toast for general errors
      if (window.WineRater?.UIManager) {
        window.WineRater.UIManager.showToast(message, 'error');
      }
    }

    // Shake animation on error
    const form = document.getElementById(this.currentView + '-form');
    form.style.animation = this.animations.shake;
    setTimeout(() => {
      form.style.animation = '';
    }, 500);
  }

  /**
   * Cache element references
   */
  cacheElements() {
    this.elements = {
      ...this.elements,
      signinView: document.getElementById('signin-view'),
      signupView: document.getElementById('signup-view'),
      forgotView: document.getElementById('forgot-view'),
      linkView: document.getElementById('link-view'),
    };
  }

  /**
   * Reset all forms
   */
  resetForms() {
    document.querySelectorAll('.auth-form').forEach(form => {
      form.reset();
    });
    this.clearErrors();
  }

  /**
   * Setup keyboard navigation
   */
  setupKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
      if (!this.elements.container.classList.contains('active')) return;

      // ESC to close
      if (e.key === 'Escape') {
        this.hide();
      }

      // Tab navigation
      if (e.key === 'Tab') {
        const focusableElements = this.elements.modal.querySelectorAll(
          'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    });
  }

  /**
   * Setup accessibility
   */
  setupAccessibility() {
    // ARIA attributes
    this.elements.container.setAttribute('role', 'dialog');
    this.elements.container.setAttribute('aria-modal', 'true');
    this.elements.container.setAttribute('aria-labelledby', 'auth-title');
    
    // Focus management
    this.elements.container.addEventListener('transitionend', () => {
      if (this.elements.container.classList.contains('active')) {
        const firstInput = this.elements.modal.querySelector('input');
        if (firstInput) firstInput.focus();
      }
    });
  }
}

// Export
window.AuthUI = AuthUI;