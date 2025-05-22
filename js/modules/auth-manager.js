/**
 * Authentication Manager Module
 * Handles user authentication and session management
 */

WineRater.AuthManager = (function() {
  'use strict';

  const { utils } = WineRater.Core;
  const { $, $$ } = utils;

  // Private state
  let currentUser = null;
  let authStateListeners = [];

  // Auth methods
  const authMethods = {
    // Sign up with email/password
    async signUp(email, password, displayName) {
      try {
        WineRater.UIManager.showLoading('Creating account...');
        
        const userCredential = await firebase.auth()
          .createUserWithEmailAndPassword(email, password);
        
        // Update display name
        if (displayName) {
          await userCredential.user.updateProfile({ displayName });
        }

        // Create user document in Firestore
        await this.createUserDocument(userCredential.user);
        
        WineRater.UIManager.showToast('Account created successfully!', 'success');
        return userCredential.user;
      } catch (error) {
        this.handleAuthError(error);
        throw error;
      } finally {
        WineRater.UIManager.hideLoading();
      }
    },

    // Sign in with email/password
    async signIn(email, password) {
      try {
        WineRater.UIManager.showLoading('Signing in...');
        
        const userCredential = await firebase.auth()
          .signInWithEmailAndPassword(email, password);
        
        WineRater.UIManager.showToast('Welcome back!', 'success');
        return userCredential.user;
      } catch (error) {
        this.handleAuthError(error);
        throw error;
      } finally {
        WineRater.UIManager.hideLoading();
      }
    },

    // Sign in with Google
    async signInWithGoogle() {
      try {
        WineRater.UIManager.showLoading('Signing in with Google...');
        
        const provider = new firebase.auth.GoogleAuthProvider();
        provider.addScope('profile');
        provider.addScope('email');
        
        const userCredential = await firebase.auth().signInWithPopup(provider);
        
        // Create/update user document
        await this.createUserDocument(userCredential.user);
        
        WineRater.UIManager.showToast('Welcome!', 'success');
        return userCredential.user;
      } catch (error) {
        this.handleAuthError(error);
        throw error;
      } finally {
        WineRater.UIManager.hideLoading();
      }
    },

    // Sign out
    async signOut() {
      try {
        const confirmed = await WineRater.UIManager.confirm(
          'Are you sure you want to sign out?',
          { title: 'Sign Out' }
        );
        
        if (!confirmed) return;
        
        WineRater.UIManager.showLoading('Signing out...');
        await firebase.auth().signOut();
        
        WineRater.UIManager.showToast('Signed out successfully', 'success');
      } catch (error) {
        this.handleAuthError(error);
        throw error;
      } finally {
        WineRater.UIManager.hideLoading();
      }
    },

    // Reset password
    async resetPassword(email) {
      try {
        WineRater.UIManager.showLoading('Sending reset email...');
        
        await firebase.auth().sendPasswordResetEmail(email);
        
        WineRater.UIManager.showToast(
          'Password reset email sent. Check your inbox.',
          'success'
        );
      } catch (error) {
        this.handleAuthError(error);
        throw error;
      } finally {
        WineRater.UIManager.hideLoading();
      }
    },

    // Update profile
    async updateProfile(updates) {
      try {
        if (!currentUser) throw new Error('No user signed in');
        
        WineRater.UIManager.showLoading('Updating profile...');
        
        // Update Firebase Auth profile
        await currentUser.updateProfile(updates);
        
        // Update Firestore document
        await firebase.firestore()
          .collection('users')
          .doc(currentUser.uid)
          .update({
            ...updates,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
          });
        
        WineRater.UIManager.showToast('Profile updated successfully', 'success');
      } catch (error) {
        this.handleAuthError(error);
        throw error;
      } finally {
        WineRater.UIManager.hideLoading();
      }
    },

    // Change password
    async changePassword(currentPassword, newPassword) {
      try {
        if (!currentUser) throw new Error('No user signed in');
        
        WineRater.UIManager.showLoading('Changing password...');
        
        // Re-authenticate user
        const credential = firebase.auth.EmailAuthProvider.credential(
          currentUser.email,
          currentPassword
        );
        await currentUser.reauthenticateWithCredential(credential);
        
        // Update password
        await currentUser.updatePassword(newPassword);
        
        WineRater.UIManager.showToast('Password changed successfully', 'success');
      } catch (error) {
        this.handleAuthError(error);
        throw error;
      } finally {
        WineRater.UIManager.hideLoading();
      }
    },

    // Delete account
    async deleteAccount(password) {
      try {
        if (!currentUser) throw new Error('No user signed in');
        
        const confirmed = await WineRater.UIManager.confirm(
          'This will permanently delete your account and all your data. This action cannot be undone.',
          { 
            title: 'Delete Account',
            confirmText: 'Delete',
            dangerous: true
          }
        );
        
        if (!confirmed) return;
        
        WineRater.UIManager.showLoading('Deleting account...');
        
        // Re-authenticate if password provided
        if (password) {
          const credential = firebase.auth.EmailAuthProvider.credential(
            currentUser.email,
            password
          );
          await currentUser.reauthenticateWithCredential(credential);
        }
        
        // Delete user data from Firestore
        await this.deleteUserData(currentUser.uid);
        
        // Delete auth account
        await currentUser.delete();
        
        WineRater.UIManager.showToast('Account deleted successfully', 'success');
      } catch (error) {
        this.handleAuthError(error);
        throw error;
      } finally {
        WineRater.UIManager.hideLoading();
      }
    },

    // Create user document in Firestore
    async createUserDocument(user) {
      const userRef = firebase.firestore().collection('users').doc(user.uid);
      const doc = await userRef.get();
      
      if (!doc.exists) {
        await userRef.set({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || user.email.split('@')[0],
          photoURL: user.photoURL || null,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
          preferences: {
            theme: 'light',
            emailNotifications: true,
            syncEnabled: true
          }
        });
      }
      
      return userRef;
    },

    // Delete user data
    async deleteUserData(userId) {
      // Delete wines
      const winesQuery = firebase.firestore()
        .collection('wines')
        .where('userId', '==', userId);
      
      const wines = await winesQuery.get();
      const batch = firebase.firestore().batch();
      
      wines.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      // Delete user document
      batch.delete(firebase.firestore().collection('users').doc(userId));
      
      await batch.commit();
    },

    // Handle auth errors
    handleAuthError(error) {
      console.error('Auth error:', error);
      
      let message = 'An error occurred. Please try again.';
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          message = 'This email is already registered.';
          break;
        case 'auth/invalid-email':
          message = 'Invalid email address.';
          break;
        case 'auth/weak-password':
          message = 'Password is too weak. Use at least 6 characters.';
          break;
        case 'auth/user-not-found':
          message = 'No account found with this email.';
          break;
        case 'auth/wrong-password':
          message = 'Incorrect password.';
          break;
        case 'auth/too-many-requests':
          message = 'Too many failed attempts. Please try again later.';
          break;
        case 'auth/network-request-failed':
          message = 'Network error. Please check your connection.';
          break;
        case 'auth/popup-closed-by-user':
          message = 'Sign-in cancelled.';
          break;
      }
      
      WineRater.UIManager.showToast(message, 'error');
    }
  };

  // UI handlers
  const uiHandlers = {
    // Setup auth UI
    setupAuthUI() {
      // Tab switching
      $$('.auth-tab').forEach(tab => {
        tab.addEventListener('click', () => {
          $$('.auth-tab').forEach(t => t.classList.remove('active'));
          $$('.tab-pane').forEach(p => p.classList.remove('active'));
          
          tab.classList.add('active');
          $(`#${tab.dataset.tab}-tab`).classList.add('active');
        });
      });

      // Login form
      const loginForm = $('#login-form');
      if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
          e.preventDefault();
          
          const email = $('#login-email').value;
          const password = $('#login-password').value;
          
          try {
            await authMethods.signIn(email, password);
            loginForm.reset();
          } catch (error) {
            // Error already handled
          }
        });
      }

      // Register form
      const registerForm = $('#register-form');
      if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
          e.preventDefault();
          
          const name = $('#register-name').value;
          const email = $('#register-email').value;
          const password = $('#register-password').value;
          const confirm = $('#register-confirm').value;
          
          if (password !== confirm) {
            WineRater.UIManager.showToast('Passwords do not match', 'error');
            return;
          }
          
          try {
            await authMethods.signUp(email, password, name);
            registerForm.reset();
          } catch (error) {
            // Error already handled
          }
        });
      }

      // Google sign-in
      const googleBtn = $('#google-signin');
      if (googleBtn) {
        googleBtn.addEventListener('click', async () => {
          try {
            await authMethods.signInWithGoogle();
          } catch (error) {
            // Error already handled
          }
        });
      }

      // Forgot password
      const forgotLink = $('#forgot-password');
      if (forgotLink) {
        forgotLink.addEventListener('click', async (e) => {
          e.preventDefault();
          
          const email = await WineRater.UIManager.prompt(
            'Enter your email address to reset your password:',
            { 
              title: 'Reset Password',
              type: 'email',
              placeholder: 'email@example.com'
            }
          );
          
          if (email && utils.isValidEmail(email)) {
            try {
              await authMethods.resetPassword(email);
            } catch (error) {
              // Error already handled
            }
          } else if (email) {
            WineRater.UIManager.showToast('Please enter a valid email', 'error');
          }
        });
      }
    },

    // Update UI for auth state
    updateAuthUI(user) {
      const authContainer = $('#auth-container');
      const appContainer = $('#app-container');
      
      if (user) {
        // User is signed in
        if (authContainer) authContainer.style.display = 'none';
        if (appContainer) appContainer.style.display = 'flex';
        
        // Update user info
        $$('.user-name').forEach(el => {
          el.textContent = user.displayName || user.email.split('@')[0];
        });
        
        $$('.user-email').forEach(el => {
          el.textContent = user.email;
        });
        
        // Update avatar
        const avatars = $$('.user-avatar');
        avatars.forEach(avatar => {
          if (user.photoURL) {
            avatar.innerHTML = `<img src="${user.photoURL}" alt="Avatar">`;
          } else {
            avatar.innerHTML = '<i class="fas fa-user"></i>';
          }
        });
      } else {
        // User is signed out
        if (authContainer) authContainer.style.display = 'flex';
        if (appContainer) appContainer.style.display = 'none';
      }
    }
  };

  // Initialize module
  function init() {
    console.log('Initializing Auth Manager...');
    
    // Setup auth UI
    uiHandlers.setupAuthUI();
    
    // Listen for auth state changes
    firebase.auth().onAuthStateChanged((user) => {
      currentUser = user;
      uiHandlers.updateAuthUI(user);
      
      // Emit auth change event
      WineRater.Core.emit('auth:changed', { user });
      
      // Call auth state listeners
      authStateListeners.forEach(listener => listener(user));
    });

    // Setup user menu actions
    const menuItems = $$('[data-action]');
    menuItems.forEach(item => {
      item.addEventListener('click', async (e) => {
        e.preventDefault();
        const action = item.dataset.action;
        
        switch (action) {
          case 'logout':
            await authMethods.signOut();
            break;
          case 'settings':
            WineRater.UIManager.switchView('settings');
            break;
          case 'sync':
            if (WineRater.DataManager) {
              await WineRater.DataManager.syncToCloud();
            }
            break;
          case 'export':
            if (WineRater.ExportManager) {
              WineRater.ExportManager.showExportDialog();
            }
            break;
        }
      });
    });
  }

  // Public API
  return {
    init,
    ...authMethods,
    
    // Get current user
    getCurrentUser() {
      return currentUser;
    },
    
    // Check if user is signed in
    isSignedIn() {
      return currentUser !== null;
    },
    
    // Add auth state listener
    onAuthStateChanged(callback) {
      authStateListeners.push(callback);
      // Call immediately with current state
      callback(currentUser);
    },
    
    // Remove auth state listener
    offAuthStateChanged(callback) {
      authStateListeners = authStateListeners.filter(cb => cb !== callback);
    }
  };
})();

// Register module
WineRater.Core.registerModule('AuthManager', WineRater.AuthManager);