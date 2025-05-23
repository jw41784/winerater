/**
 * Complete Authentication Fix
 * Ensures proper authentication flow and UI updates
 */

(function() {
    'use strict';
    
    console.log('[Auth Complete Fix] Initializing authentication fixes...');
    
    // Override the Auth.init to ensure proper setup
    document.addEventListener('DOMContentLoaded', function() {
        
        // Fix Google sign-in button
        const googleSignInButton = document.getElementById('google-signin');
        if (googleSignInButton) {
            console.log('[Auth Complete Fix] Setting up Google sign-in button...');
            
            // Remove any existing listeners
            const newButton = googleSignInButton.cloneNode(true);
            googleSignInButton.parentNode.replaceChild(newButton, googleSignInButton);
            
            // Add new click handler
            newButton.addEventListener('click', async function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('[Auth Complete Fix] Google sign-in clicked');
                
                try {
                    // Show loading
                    if (window.App && window.App.showLoading) {
                        window.App.showLoading('Signing in with Google...');
                    }
                    
                    // Create provider
                    const provider = new firebase.auth.GoogleAuthProvider();
                    provider.addScope('profile');
                    provider.addScope('email');
                    provider.setCustomParameters({
                        prompt: 'select_account'
                    });
                    
                    console.log('[Auth Complete Fix] Opening Google sign-in popup...');
                    
                    // Sign in with popup
                    const result = await firebase.auth().signInWithPopup(provider);
                    
                    console.log('[Auth Complete Fix] Sign-in successful:', result.user.email);
                    
                    // The auth state change listener should handle the UI update
                    // But let's make sure it happens
                    setTimeout(() => {
                        handleAuthSuccess(result.user);
                    }, 100);
                    
                } catch (error) {
                    console.error('[Auth Complete Fix] Sign-in error:', error);
                    handleAuthError(error);
                }
            });
        }
        
        // Setup auth state listener
        firebase.auth().onAuthStateChanged(function(user) {
            console.log('[Auth Complete Fix] Auth state changed:', user ? 'User signed in' : 'No user');
            
            if (user) {
                handleAuthSuccess(user);
            } else {
                handleAuthSignOut();
            }
        });
        
        // Check initial auth state
        const currentUser = firebase.auth().currentUser;
        if (currentUser) {
            console.log('[Auth Complete Fix] User already signed in:', currentUser.email);
            handleAuthSuccess(currentUser);
        }
    });
    
    // Handle successful authentication
    function handleAuthSuccess(user) {
        console.log('[Auth Complete Fix] Handling auth success for:', user.email);
        
        // Hide loading
        if (window.App && window.App.hideLoading) {
            window.App.hideLoading();
        }
        
        // Update UI
        const authContainer = document.getElementById('auth-container');
        const appContainer = document.getElementById('app-container');
        
        if (authContainer && appContainer) {
            console.log('[Auth Complete Fix] Updating UI - hiding auth, showing app');
            authContainer.style.display = 'none';
            appContainer.style.display = 'flex';
            
            // Update user info
            updateUserInfo(user);
            
            // Initialize app if needed
            if (window.App && !window.App._initialized) {
                console.log('[Auth Complete Fix] Initializing app...');
                window.App.init();
                window.App._initialized = true;
            }
            
            // Initialize CloudStorage if available
            if (window.CloudStorage && typeof window.CloudStorage.init === 'function') {
                console.log('[Auth Complete Fix] Initializing CloudStorage...');
                window.CloudStorage.init();
            }
            
            // Show success message
            showSuccessMessage(user);
        }
    }
    
    // Handle sign out
    function handleAuthSignOut() {
        console.log('[Auth Complete Fix] Handling sign out');
        
        const authContainer = document.getElementById('auth-container');
        const appContainer = document.getElementById('app-container');
        
        if (authContainer && appContainer) {
            authContainer.style.display = 'flex';
            appContainer.style.display = 'none';
        }
    }
    
    // Handle auth errors
    function handleAuthError(error) {
        console.error('[Auth Complete Fix] Auth error:', error);
        
        // Hide loading
        if (window.App && window.App.hideLoading) {
            window.App.hideLoading();
        }
        
        let message = 'Sign-in failed. Please try again.';
        
        switch (error.code) {
            case 'auth/popup-closed-by-user':
                message = 'Sign-in cancelled';
                break;
            case 'auth/popup-blocked':
                message = 'Please allow popups for this site';
                break;
            case 'auth/account-exists-with-different-credential':
                message = 'An account already exists with this email';
                break;
        }
        
        // Show error
        if (window.App && window.App.showToast) {
            window.App.showToast(message, 'error');
        } else if (window.WineRater && window.WineRater.ModernUI) {
            window.WineRater.ModernUI.showToast(message, 'error');
        } else {
            alert(message);
        }
    }
    
    // Update user info in UI
    function updateUserInfo(user) {
        console.log('[Auth Complete Fix] Updating user info:', user.email);
        
        // Update all user name elements
        const userNameElements = document.querySelectorAll('#user-display-name, .user-name');
        userNameElements.forEach(el => {
            el.textContent = user.displayName || user.email.split('@')[0];
        });
        
        // Update all user email elements
        const userEmailElements = document.querySelectorAll('#dropdown-user-email, .user-email');
        userEmailElements.forEach(el => {
            el.textContent = user.email;
        });
        
        // Update user avatar if photo exists
        if (user.photoURL) {
            const avatarElements = document.querySelectorAll('.user-avatar');
            avatarElements.forEach(el => {
                el.innerHTML = `<img src="${user.photoURL}" alt="${user.displayName}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
            });
        }
    }
    
    // Show success message
    function showSuccessMessage(user) {
        const message = `Welcome${user.displayName ? ' ' + user.displayName.split(' ')[0] : ''}!`;
        
        if (window.App && window.App.showToast) {
            window.App.showToast(message, 'success');
        } else if (window.WineRater && window.WineRater.ModernUI) {
            window.WineRater.ModernUI.showToast(message, 'success');
        }
    }
    
    // Also handle sign out
    document.addEventListener('click', function(e) {
        if (e.target.id === 'logout-btn' || e.target.closest('#logout-btn')) {
            e.preventDefault();
            console.log('[Auth Complete Fix] Logout clicked');
            
            firebase.auth().signOut().then(() => {
                console.log('[Auth Complete Fix] Signed out successfully');
                if (window.App && window.App.showToast) {
                    window.App.showToast('Signed out successfully', 'success');
                }
            }).catch((error) => {
                console.error('[Auth Complete Fix] Sign out error:', error);
            });
        }
    });
    
})();