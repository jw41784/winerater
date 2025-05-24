/**
 * Authentication module for WineRater
 * Handles user registration, login, and session management
 */

const Auth = {
    // Firebase auth instance
    auth: null,
    
    // Current user
    currentUser: null,
    
    // Helper method to show toast notifications
    showToast: function(message, type = 'info') {
        if (window.App && window.App.showToast) {
            window.App.showToast(message, type);
        } else if (type === 'error') {
            alert('Error: ' + message);
        } else {
            console.log(message);
        }
    },
    
    // Initialization
    init: function() {
        console.log('Initializing Auth module');
        this.auth = firebase.auth();
        
        // Set up auth state listener
        this.auth.onAuthStateChanged(user => {
            this.currentUser = user;
            
            if (user) {
                // User is signed in
                console.log("User signed in:", user.email);
                this.onSignIn(user);
            } else {
                // User is signed out
                console.log("User signed out");
                this.onSignOut();
            }
        });
        
        // Set up UI event listeners
        this.setupEventListeners();
        
        console.log('Auth module initialized');
    },
    
    // Set up UI event listeners
    setupEventListeners: function() {
        // Register form submission
        const registerForm = document.getElementById('register-form');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.register(
                    registerForm.email.value,
                    registerForm.password.value,
                    registerForm.displayName.value
                );
            });
        }
        
        // Login form submission
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.login(
                    loginForm.email.value,
                    loginForm.password.value
                );
            });
        }
        
        // Create and setup Google Sign-in button
        const buttonContainer = document.getElementById('google-button-container');
        if (buttonContainer) {
            // Create a fresh button with no icons
            const googleButton = document.createElement('button');
            googleButton.type = 'button';
            googleButton.id = 'google-signin';
            googleButton.className = 'social-btn google';
            googleButton.textContent = 'Sign in with Google';
            
            // Add click handler
            googleButton.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Google sign-in button clicked');
                this.loginWithGoogle();
            });
            
            // Clear container and add button
            buttonContainer.innerHTML = '';
            buttonContainer.appendChild(googleButton);
            
            console.log('Google Sign-in button created');
        }
        
        // Logout button
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.logout();
            });
        }
    },
    
    // Register new user
    register: function(email, password, displayName) {
        // Show loading state
        this.showLoading('Creating your account...');
        
        this.auth.createUserWithEmailAndPassword(email, password)
            .then(userCredential => {
                // Update the user's profile
                return userCredential.user.updateProfile({
                    displayName: displayName
                });
            })
            .then(() => {
                // Create user document in Firestore
                return firebase.firestore().collection('users').doc(this.auth.currentUser.uid).set({
                    displayName: displayName,
                    email: email,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    preferences: {
                        defaultView: 'dashboard'
                    }
                });
            })
            .then(() => {
                // Hide loading state
                this.hideLoading();
                
                // Show success message
                this.showToast('Account created successfully!', 'success');
                
                // Close auth modal and show the app
                this.closeAuthModal();
                this.showApp();
            })
            .catch(error => {
                // Hide loading state
                this.hideLoading();
                
                // Show error message
                this.showToast('Error: ' + error.message, 'error');
                console.error("Registration error:", error);
            });
    },
    
    // Login existing user
    login: function(email, password) {
        // Show loading state
        this.showLoading('Logging in...');
        
        this.auth.signInWithEmailAndPassword(email, password)
            .then(userCredential => {
                // Hide loading state
                this.hideLoading();
                
                // Show success message
                this.showToast('Successfully logged in!', 'success');
                
                // Close auth modal and show the app
                this.closeAuthModal();
                this.showApp();
            })
            .catch(error => {
                // Hide loading state
                this.hideLoading();
                
                // Show error message
                this.showToast('Error: ' + error.message, 'error');
                console.error("Login error:", error);
            });
    },
    
    // Login with Google
    loginWithGoogle: function() {
        console.log('Starting Google login process');
        this.showLoading('Connecting to Google...');
        
        // Create a simple Google provider
        const provider = new firebase.auth.GoogleAuthProvider();
        
        // Use popup for immediate feedback rather than redirect
        this.auth.signInWithPopup(provider)
            .then(result => {
                console.log('Google sign-in successful');
                const user = result.user;
                const isNewUser = result.additionalUserInfo?.isNewUser;
                
                if (isNewUser && user) {
                    console.log('Creating new user document in Firestore');
                    // Create user document in Firestore
                    return firebase.firestore().collection('users').doc(user.uid).set({
                        displayName: user.displayName,
                        email: user.email,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                        preferences: {
                            defaultView: 'dashboard'
                        }
                    });
                }
            })
            .then(() => {
                this.hideLoading();
                
                // Show success message
                this.showToast('Successfully logged in with Google!', 'success');
                
                // The auth state change handler will handle showing the app
                // Don't call showApp() here as it will be called by onSignIn()
            })
            .catch(error => {
                this.hideLoading();
                console.error("Google login error:", error);
                
                // Show user-friendly error message
                if (error.code === 'auth/popup-blocked') {
                    this.showToast('Google login popup was blocked. Please allow popups for this site.', 'error');
                } else if (error.code === 'auth/popup-closed-by-user') {
                    this.showToast('Google login was cancelled. Please try again.', 'info');
                } else {
                    this.showToast('Error logging in with Google: ' + error.message, 'error');
                }
            });
    },
    
    // Logout current user
    logout: function() {
        this.auth.signOut()
            .then(() => {
                // Show success message
                this.showToast('Successfully logged out', 'success');
                
                // Show the auth screen
                this.showAuthScreen();
            })
            .catch(error => {
                // Show error message
                this.showToast('Error: ' + error.message, 'error');
                console.error("Logout error:", error);
            });
    },
    
    // Reset password
    resetPassword: function(email) {
        this.auth.sendPasswordResetEmail(email)
            .then(() => {
                // Show success message
                this.showToast('Password reset email sent!', 'success');
            })
            .catch(error => {
                // Show error message
                this.showToast('Error: ' + error.message, 'error');
                console.error("Password reset error:", error);
            });
    },
    
    // Handler for when user signs in
    onSignIn: function(user) {
        // Update UI to show logged in state
        document.body.classList.add('user-logged-in');
        
        // Update user display name in UI
        const userDisplayName = document.getElementById('user-display-name');
        if (userDisplayName) {
            userDisplayName.textContent = user.displayName || user.email;
        }
        
        // Initialize cloud data
        try {
            if (window.CloudStorage && window.CloudStorage.init) {
                CloudStorage.init(user.uid);
            } else {
                console.warn('CloudStorage not available');
            }
        } catch (error) {
            console.error('CloudStorage init error:', error);
            // Continue anyway - don't block auth flow
        }
        
        // Show the app
        this.showApp();
        
        // Initialize App if available
        if (window.App && window.App.init) {
            console.log('Initializing App after auth...');
            window.App.init();
        }
    },
    
    // Handler for when user signs out
    onSignOut: function() {
        // Update UI to show logged out state
        document.body.classList.remove('user-logged-in');
        
        // Show the auth screen
        this.showAuthScreen();
    },
    
    // Show the authentication screen
    showAuthScreen: function() {
        document.getElementById('auth-container').style.display = 'flex';
        document.getElementById('app-container').style.display = 'none';
    },
    
    // Show the app after successful authentication
    showApp: function() {
        document.getElementById('auth-container').style.display = 'none';
        document.getElementById('app-container').style.display = 'flex';
    },
    
    // Show the auth modal
    showAuthModal: function(mode = 'login') {
        const modal = document.getElementById('auth-modal');
        modal.classList.add('open');
        
        // Switch between login and register forms
        if (mode === 'login') {
            document.getElementById('login-form-container').style.display = 'block';
            document.getElementById('register-form-container').style.display = 'none';
        } else {
            document.getElementById('login-form-container').style.display = 'none';
            document.getElementById('register-form-container').style.display = 'block';
        }
    },
    
    // Close the auth modal
    closeAuthModal: function() {
        const modal = document.getElementById('auth-modal');
        if (modal) {
            modal.classList.remove('open');
        }
        // Also hide auth container if no modal exists
        const authContainer = document.getElementById('auth-container');
        if (authContainer) {
            authContainer.style.display = 'none';
        }
    },
    
    // Show loading indicator
    showLoading: function(message) {
        const loading = document.getElementById('loading-overlay');
        const loadingMessage = document.getElementById('loading-message');
        
        if (loadingMessage) {
            loadingMessage.textContent = message || 'Loading...';
        }
        
        if (loading) {
            loading.style.display = 'flex';
        }
    },
    
    // Hide loading indicator
    hideLoading: function() {
        const loading = document.getElementById('loading-overlay');
        
        if (loading) {
            loading.style.display = 'none';
        }
    },
    
    // Get current user ID
    getCurrentUserId: function() {
        return this.currentUser ? this.currentUser.uid : null;
    },
    
    // Check if user is authenticated
    isAuthenticated: function() {
        return !!this.currentUser;
    }
};

// Make Auth globally accessible
window.Auth = Auth;