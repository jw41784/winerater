/**
 * Authentication module for WineRater
 * Handles user registration, login, and session management
 */

const Auth = {
    // Firebase auth instance
    auth: null,
    
    // Current user
    currentUser: null,
    
    // Initialization
    init: function() {
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
                WineRater.showToast('Account created successfully!', 'success');
                
                // Close auth modal and show the app
                this.closeAuthModal();
                this.showApp();
            })
            .catch(error => {
                // Hide loading state
                this.hideLoading();
                
                // Show error message
                WineRater.showToast('Error: ' + error.message, 'error');
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
                WineRater.showToast('Successfully logged in!', 'success');
                
                // Close auth modal and show the app
                this.closeAuthModal();
                this.showApp();
            })
            .catch(error => {
                // Hide loading state
                this.hideLoading();
                
                // Show error message
                WineRater.showToast('Error: ' + error.message, 'error');
                console.error("Login error:", error);
            });
    },
    
    // Login with Google
    loginWithGoogle: function() {
        const provider = new firebase.auth.GoogleAuthProvider();
        
        this.auth.signInWithPopup(provider)
            .then(result => {
                // Check if this is a new user
                const isNewUser = result.additionalUserInfo.isNewUser;
                
                if (isNewUser) {
                    // Create user document in Firestore
                    return firebase.firestore().collection('users').doc(result.user.uid).set({
                        displayName: result.user.displayName,
                        email: result.user.email,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                        preferences: {
                            defaultView: 'dashboard'
                        }
                    });
                }
            })
            .then(() => {
                // Show success message
                WineRater.showToast('Successfully logged in with Google!', 'success');
                
                // Close auth modal and show the app
                this.closeAuthModal();
                this.showApp();
            })
            .catch(error => {
                // Show error message
                WineRater.showToast('Error: ' + error.message, 'error');
                console.error("Google login error:", error);
            });
    },
    
    // Logout current user
    logout: function() {
        this.auth.signOut()
            .then(() => {
                // Show success message
                WineRater.showToast('Successfully logged out', 'success');
                
                // Show the auth screen
                this.showAuthScreen();
            })
            .catch(error => {
                // Show error message
                WineRater.showToast('Error: ' + error.message, 'error');
                console.error("Logout error:", error);
            });
    },
    
    // Reset password
    resetPassword: function(email) {
        this.auth.sendPasswordResetEmail(email)
            .then(() => {
                // Show success message
                WineRater.showToast('Password reset email sent!', 'success');
            })
            .catch(error => {
                // Show error message
                WineRater.showToast('Error: ' + error.message, 'error');
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
        CloudStorage.init(user.uid);
        
        // Show the app
        this.showApp();
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
        modal.classList.remove('open');
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