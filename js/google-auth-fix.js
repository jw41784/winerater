/**
 * Simplified Google Authentication for WineRater
 * Uses Firebase Auth instead of Google API directly
 */

(function() {
  'use strict';

  // Wait for DOM and Firebase to be ready
  document.addEventListener('DOMContentLoaded', function() {
    console.log('[Google Auth] Initializing simplified Google authentication...');

    // Override the complex Google sign-in with a simpler approach
    if (window.AuthSystem) {
      // Replace the signInWithGoogle method
      AuthSystem.prototype.signInWithGoogle = async function(options = {}) {
        if (this.state.isAuthenticating) {
          console.warn('[Auth] Authentication already in progress');
          return null;
        }

        try {
          this.state.isAuthenticating = true;
          this.emit('authStart', { method: 'google' });

          // Show loading state
          if (window.WineRater?.UIManager) {
            window.WineRater.UIManager.showLoading('Signing in with Google...');
          }

          // Create Google provider
          const provider = new firebase.auth.GoogleAuthProvider();
          
          // Add scopes
          provider.addScope('profile');
          provider.addScope('email');
          
          // Force account selection
          provider.setCustomParameters({
            prompt: 'select_account'
          });

          // Sign in with popup
          const result = await firebase.auth().signInWithPopup(provider);
          
          // Get user data
          const user = result.user;
          const isNewUser = result.additionalUserInfo?.isNewUser || false;
          
          // Create user data object
          const userData = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            firstName: result.additionalUserInfo?.profile?.given_name || user.displayName?.split(' ')[0] || '',
            lastName: result.additionalUserInfo?.profile?.family_name || '',
            provider: 'google',
            emailVerified: user.emailVerified,
            metadata: {
              createdAt: user.metadata.creationTime,
              lastSignIn: user.metadata.lastSignInTime,
            }
          };

          // Handle new vs existing user
          if (isNewUser) {
            await this.createUserDocument(userData);
          } else {
            await this.updateUserDocument(userData);
          }

          // Update state
          this.state.user = userData;
          this.state.authMethod = 'google';
          this.state.loginAttempts = 0;

          // Hide loading
          if (window.WineRater?.UIManager) {
            window.WineRater.UIManager.hideLoading();
            window.WineRater.UIManager.showToast(
              `Welcome${isNewUser ? '' : ' back'}, ${userData.firstName || userData.email}!`,
              'success'
            );
          }

          this.emit('authSuccess', { user: userData, isNewUser });
          
          return userData;

        } catch (error) {
          console.error('[Auth] Google sign-in failed:', error);
          
          // Handle specific errors
          let errorMessage = 'Sign-in failed. Please try again.';
          
          switch (error.code) {
            case 'auth/popup-closed-by-user':
              errorMessage = 'Sign-in cancelled';
              break;
            case 'auth/popup-blocked':
              errorMessage = 'Please allow popups for this site';
              break;
            case 'auth/account-exists-with-different-credential':
              errorMessage = 'An account already exists with this email';
              // Could implement account linking here
              break;
            case 'auth/network-request-failed':
              errorMessage = 'Network error. Please check your connection';
              break;
          }
          
          if (window.WineRater?.UIManager) {
            window.WineRater.UIManager.showToast(errorMessage, 'error');
          }
          
          throw error;
        } finally {
          this.state.isAuthenticating = false;
          if (window.WineRater?.UIManager) {
            window.WineRater.UIManager.hideLoading();
          }
        }
      };

      // Add helper method to create user document
      AuthSystem.prototype.createUserDocument = async function(userData) {
        const userRef = firebase.firestore().collection('users').doc(userData.uid);
        
        const userDoc = {
          uid: userData.uid,
          email: userData.email,
          displayName: userData.displayName,
          photoURL: userData.photoURL,
          firstName: userData.firstName,
          lastName: userData.lastName,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
          preferences: {
            theme: 'light',
            notifications: true,
            measurementSystem: 'metric'
          },
          stats: {
            totalWines: 0,
            totalRatings: 0,
            joinDate: firebase.firestore.FieldValue.serverTimestamp()
          }
        };

        await userRef.set(userDoc);
        console.log('[Auth] User document created');
      };

      // Add helper method to update user document
      AuthSystem.prototype.updateUserDocument = async function(userData) {
        const userRef = firebase.firestore().collection('users').doc(userData.uid);
        
        await userRef.update({
          lastSignIn: firebase.firestore.FieldValue.serverTimestamp(),
          updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
          photoURL: userData.photoURL, // Update photo in case it changed
          displayName: userData.displayName // Update name in case it changed
        });
        
        console.log('[Auth] User document updated');
      };

      // Skip the complex Google API initialization
      AuthSystem.prototype.initializeGoogleAuth = async function() {
        console.log('[Auth] Using Firebase Google Auth (no additional initialization needed)');
        return Promise.resolve();
      };
    }

    // Also fix the simple Auth.loginWithGoogle if it exists
    if (window.Auth && window.Auth.loginWithGoogle) {
      window.Auth.loginWithGoogle = async function() {
        try {
          console.log('[Google Auth] Starting Google sign-in...');
          
          const provider = new firebase.auth.GoogleAuthProvider();
          provider.addScope('profile');
          provider.addScope('email');
          provider.setCustomParameters({
            prompt: 'select_account'
          });

          const result = await firebase.auth().signInWithPopup(provider);
          
          console.log('[Google Auth] Sign-in successful:', result.user.email);
          
          // The auth state change will be handled by the existing auth state listener
          return result.user;
          
        } catch (error) {
          console.error('[Google Auth] Sign-in failed:', error);
          
          // Show user-friendly error
          if (window.App && window.App.showToast) {
            let message = 'Sign-in failed. Please try again.';
            if (error.code === 'auth/popup-closed-by-user') {
              message = 'Sign-in cancelled';
            } else if (error.code === 'auth/popup-blocked') {
              message = 'Please allow popups for this site';
            }
            window.App.showToast(message, 'error');
          }
          
          throw error;
        }
      };
    }

    console.log('[Google Auth] Google authentication fixes applied');
  });

  // Also handle the old-style Google sign-in button if it exists
  document.addEventListener('click', async function(e) {
    // Check if clicked element is the Google sign-in button
    if (e.target.closest('#google-signin') || 
        e.target.closest('#google-signin-btn') ||
        e.target.closest('.auth-google-btn')) {
      
      e.preventDefault();
      e.stopPropagation();
      
      console.log('[Google Auth] Google sign-in button clicked');
      
      try {
        // Use the simplified approach
        const provider = new firebase.auth.GoogleAuthProvider();
        provider.addScope('profile');
        provider.addScope('email');
        provider.setCustomParameters({
          prompt: 'select_account'
        });

        // Show loading if available
        if (window.WineRater?.UIManager) {
          window.WineRater.UIManager.showLoading('Signing in with Google...');
        } else if (window.App?.showLoading) {
          window.App.showLoading('Signing in with Google...');
        }

        const result = await firebase.auth().signInWithPopup(provider);
        
        console.log('[Google Auth] Sign-in successful:', result.user.email);
        
        // Hide loading
        if (window.WineRater?.UIManager) {
          window.WineRater.UIManager.hideLoading();
        } else if (window.App?.hideLoading) {
          window.App.hideLoading();
        }
        
        // Show success message
        const message = `Welcome${result.additionalUserInfo?.isNewUser ? '' : ' back'}!`;
        if (window.WineRater?.UIManager) {
          window.WineRater.UIManager.showToast(message, 'success');
        } else if (window.App?.showToast) {
          window.App.showToast(message, 'success');
        }
        
      } catch (error) {
        console.error('[Google Auth] Sign-in failed:', error);
        
        // Hide loading
        if (window.WineRater?.UIManager) {
          window.WineRater.UIManager.hideLoading();
        } else if (window.App?.hideLoading) {
          window.App.hideLoading();
        }
        
        // Show error
        let errorMessage = 'Sign-in failed. Please try again.';
        if (error.code === 'auth/popup-closed-by-user') {
          errorMessage = 'Sign-in cancelled';
        } else if (error.code === 'auth/popup-blocked') {
          errorMessage = 'Please allow popups for this site';
        }
        
        if (window.WineRater?.UIManager) {
          window.WineRater.UIManager.showToast(errorMessage, 'error');
        } else if (window.App?.showToast) {
          window.App.showToast(errorMessage, 'error');
        }
      }
    }
  });

})();