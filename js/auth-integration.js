/**
 * Authentication Integration
 * Connects the modern auth system to WineRater
 */

(function() {
  'use strict';

  // Wait for all dependencies to load
  document.addEventListener('DOMContentLoaded', async function() {
    console.log('[Auth Integration] Initializing authentication...');

    try {
      // Initialize authentication system
      const authSystem = new AuthSystem();
      
      // Configure Google OAuth
      authSystem.config.google.clientId = firebase.app().options.authDomain;
      
      // Initialize auth system
      await authSystem.init();
      
      // Create and initialize UI
      const authUI = new AuthUI(authSystem);
      authUI.init();
      
      // Make globally available
      window.WineAuth = {
        system: authSystem,
        ui: authUI,
        
        // Public methods
        signIn: () => authUI.show('signin'),
        signUp: () => authUI.show('signup'),
        signOut: () => authSystem.signOut(),
        getCurrentUser: () => authSystem.getCurrentUser(),
        isAuthenticated: () => authSystem.isAuthenticated(),
      };

      // Setup authentication event handlers
      setupAuthHandlers(authSystem, authUI);
      
      // Setup UI triggers
      setupUITriggers(authUI);
      
      // Check initial auth state
      checkInitialAuthState(authSystem);
      
      console.log('[Auth Integration] Authentication ready');
      
    } catch (error) {
      console.error('[Auth Integration] Failed to initialize:', error);
    }
  });

  /**
   * Setup authentication event handlers
   */
  function setupAuthHandlers(authSystem, authUI) {
    // Auth state changes
    firebase.auth().onAuthStateChanged(async (user) => {
      if (user) {
        // User signed in
        console.log('[Auth Integration] User signed in:', user.email);
        
        // Update UI
        updateUserInterface(user);
        
        // Hide auth modal if open
        authUI.hide();
        
        // Show main app
        showMainApp();
        
        // Initialize user data
        if (window.WineRater?.DataManager) {
          await window.WineRater.DataManager.initCloudSync(user.uid);
        }
        
      } else {
        // User signed out
        console.log('[Auth Integration] User signed out');
        
        // Show auth interface
        showAuthInterface();
        
        // Clear user data
        if (window.WineRater?.DataManager) {
          window.WineRater.DataManager.clearUserData();
        }
      }
    });

    // Auth events
    authSystem.on('authStart', (data) => {
      console.log('[Auth Integration] Authentication started:', data.method);
    });

    authSystem.on('authSuccess', async (data) => {
      console.log('[Auth Integration] Authentication successful:', data.user.email);
      
      // Show success message
      if (window.WineRater?.UIManager) {
        window.WineRater.UIManager.showToast(
          `Welcome ${data.isNewUser ? '' : 'back'}, ${data.user.firstName || data.user.email}!`,
          'success'
        );
      }
      
      // Handle new user onboarding
      if (data.isNewUser) {
        await handleNewUserOnboarding(data.user);
      }
    });

    authSystem.on('authError', (data) => {
      console.error('[Auth Integration] Authentication error:', data.error);
    });

    authSystem.on('signOutComplete', () => {
      console.log('[Auth Integration] Sign out complete');
      
      // Redirect to auth screen
      showAuthInterface();
      
      // Show sign in prompt after a delay
      setTimeout(() => {
        authUI.show('signin');
      }, 500);
    });

    authSystem.on('sessionTimeout', () => {
      console.log('[Auth Integration] Session timeout');
      
      if (window.WineRater?.UIManager) {
        window.WineRater.UIManager.showToast(
          'Your session has expired. Please sign in again.',
          'warning'
        );
      }
    });

    authSystem.on('showOnboarding', (data) => {
      console.log('[Auth Integration] Show onboarding for:', data.user.email);
      // Implement onboarding flow
      showOnboardingFlow(data.user);
    });
  }

  /**
   * Setup UI triggers
   */
  function setupUITriggers(authUI) {
    // Sign in buttons
    document.querySelectorAll('[data-auth-action="signin"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        authUI.show('signin');
      });
    });

    // Sign up buttons
    document.querySelectorAll('[data-auth-action="signup"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        authUI.show('signup');
      });
    });

    // Sign out buttons
    document.querySelectorAll('[data-auth-action="signout"]').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        await window.WineAuth.signOut();
      });
    });

    // Update existing auth UI elements
    const googleSigninBtn = document.getElementById('google-signin');
    if (googleSigninBtn) {
      googleSigninBtn.addEventListener('click', (e) => {
        e.preventDefault();
        authUI.show('signin');
        // Trigger Google sign-in after modal opens
        setTimeout(() => {
          document.getElementById('google-signin-btn')?.click();
        }, 300);
      });
    }
  }

  /**
   * Check initial authentication state
   */
  async function checkInitialAuthState(authSystem) {
    // Give Firebase time to restore auth state
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const user = firebase.auth().currentUser;
    if (user) {
      console.log('[Auth Integration] User already authenticated:', user.email);
      updateUserInterface(user);
      showMainApp();
    } else {
      console.log('[Auth Integration] No authenticated user');
      showAuthInterface();
    }
  }

  /**
   * Update user interface with user data
   */
  function updateUserInterface(user) {
    // Update user name displays
    document.querySelectorAll('.user-name, #user-display-name').forEach(el => {
      el.textContent = user.displayName || user.email.split('@')[0];
    });

    // Update user email displays
    document.querySelectorAll('.user-email, #dropdown-user-email').forEach(el => {
      el.textContent = user.email;
    });

    // Update user avatar
    const avatars = document.querySelectorAll('.user-avatar');
    avatars.forEach(avatar => {
      if (user.photoURL) {
        avatar.innerHTML = `<img src="${user.photoURL}" alt="${user.displayName}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
      } else {
        avatar.innerHTML = '<i class="fas fa-user"></i>';
      }
    });

    // Update full name displays
    const fullNameElements = document.querySelectorAll('.user-name-full, #dropdown-user-name');
    fullNameElements.forEach(el => {
      el.textContent = user.displayName || 'User';
    });
  }

  /**
   * Show main application
   */
  function showMainApp() {
    const authContainer = document.getElementById('auth-container');
    const appContainer = document.getElementById('app-container');
    
    if (authContainer) {
      authContainer.style.display = 'none';
    }
    
    if (appContainer) {
      appContainer.style.display = 'flex';
      
      // Initialize app components if needed
      if (window.WineRater && !window.WineRater.initialized) {
        window.WineRater.init();
        window.WineRater.initialized = true;
      }
    }
  }

  /**
   * Show authentication interface
   */
  function showAuthInterface() {
    const authContainer = document.getElementById('auth-container');
    const appContainer = document.getElementById('app-container');
    
    if (authContainer) {
      authContainer.style.display = 'flex';
    }
    
    if (appContainer) {
      appContainer.style.display = 'none';
    }
  }

  /**
   * Handle new user onboarding
   */
  async function handleNewUserOnboarding(user) {
    console.log('[Auth Integration] Starting onboarding for:', user.email);
    
    // Create onboarding steps
    const steps = [
      {
        title: 'Welcome to WineRater!',
        content: `Hi ${user.firstName || 'there'}! We're excited to help you track and discover amazing wines.`,
        action: 'Next'
      },
      {
        title: 'Personalize Your Experience',
        content: 'Set your preferences to get personalized wine recommendations.',
        action: 'Set Preferences'
      },
      {
        title: 'Add Your First Wine',
        content: 'Start building your collection by adding a wine you\'ve recently enjoyed.',
        action: 'Add Wine'
      }
    ];

    // Show onboarding modal
    // This would be implemented with a proper onboarding UI component
    console.log('[Auth Integration] Onboarding steps:', steps);
    
    // For now, just show the add wine view
    if (window.WineRater?.UIManager) {
      setTimeout(() => {
        window.WineRater.UIManager.switchView('add-wine');
        window.WineRater.UIManager.showToast(
          'Start by adding your first wine to the collection!',
          'info'
        );
      }, 1000);
    }
  }

  /**
   * Show onboarding flow
   */
  function showOnboardingFlow(user) {
    // This would show a step-by-step onboarding process
    // For now, we'll just log it
    console.log('[Auth Integration] Onboarding flow for:', user);
    
    // Could implement:
    // - Welcome tour
    // - Feature highlights
    // - Initial preferences setup
    // - First wine addition guidance
  }

  /**
   * Extend existing auth functionality
   */
  function extendAuthFunctionality() {
    // Add convenience methods to the global Auth object if it exists
    if (window.Auth) {
      // Extend with new functionality
      window.Auth.loginWithGoogleEnhanced = async () => {
        if (window.WineAuth) {
          window.WineAuth.ui.show('signin');
          setTimeout(() => {
            document.getElementById('google-signin-btn')?.click();
          }, 300);
        }
      };
      
      window.Auth.showAuthModal = (view = 'signin') => {
        if (window.WineAuth) {
          window.WineAuth.ui.show(view);
        }
      };
    }
  }

  // Call extension after a delay to ensure Auth is loaded
  setTimeout(extendAuthFunctionality, 2000);

})();