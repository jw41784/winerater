/**
 * Professional Authentication System
 * Enterprise-grade Google OAuth 2.0 implementation
 */

class AuthSystem {
  constructor() {
    this.config = {
      google: {
        clientId: null, // Set via init
        scopes: ['profile', 'email'],
        discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/people/v1/rest'],
        hostedDomain: null, // Optional: restrict to specific domain
        prompt: 'select_account', // Always show account picker
      },
      session: {
        rememberMeDays: 30,
        sessionTimeout: 30 * 60 * 1000, // 30 minutes
        refreshThreshold: 5 * 60 * 1000, // Refresh if < 5 min left
      },
      security: {
        csrfTokenLength: 32,
        maxLoginAttempts: 5,
        lockoutDuration: 15 * 60 * 1000, // 15 minutes
        requireRecentAuth: ['deleteAccount', 'changeEmail', 'exportData'],
      },
      ui: {
        autoCloseDelay: 3000,
        loadingDelay: 300, // Show loading after 300ms
        animationDuration: 400,
      }
    };

    this.state = {
      user: null,
      session: null,
      isAuthenticating: false,
      authMethod: null,
      loginAttempts: 0,
      lastActivity: Date.now(),
      initialized: false,
      offlineQueue: [],
    };

    this.listeners = new Map();
    this.tokenRefreshTimer = null;
    this.activityTimer = null;
    this.retryTimer = null;
  }

  /**
   * Initialize the authentication system
   */
  async init() {
    try {
      console.log('[Auth] Initializing authentication system...');
      
      // Load saved session
      await this.loadSession();
      
      // Initialize Google API
      await this.initializeGoogleAuth();
      
      // Setup event listeners
      this.setupEventListeners();
      
      // Start monitoring
      this.startSessionMonitoring();
      
      this.state.initialized = true;
      this.emit('initialized');
      
      console.log('[Auth] Authentication system initialized');
      
      return true;
    } catch (error) {
      console.error('[Auth] Initialization failed:', error);
      this.handleError(error);
      return false;
    }
  }

  /**
   * Initialize Google OAuth
   */
  async initializeGoogleAuth() {
    return new Promise((resolve, reject) => {
      // Dynamically load Google API
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        gapi.load('auth2', async () => {
          try {
            // Initialize with enhanced options
            this.googleAuth = await gapi.auth2.init({
              client_id: this.config.google.clientId || firebase.app().options.authDomain,
              scope: this.config.google.scopes.join(' '),
              hosted_domain: this.config.google.hostedDomain,
              fetch_basic_profile: true,
              ux_mode: 'popup', // Better UX than redirect
              redirect_uri: window.location.origin,
            });

            // Listen for Google auth state changes
            this.googleAuth.isSignedIn.listen((isSignedIn) => {
              this.handleGoogleAuthStateChange(isSignedIn);
            });

            // Check if already signed in
            if (this.googleAuth.isSignedIn.get()) {
              await this.handleGoogleSignIn(this.googleAuth.currentUser.get());
            }

            resolve();
          } catch (error) {
            reject(error);
          }
        });
      };

      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  /**
   * Sign in with Google - Enhanced implementation
   */
  async signInWithGoogle(options = {}) {
    const {
      prompt = this.config.google.prompt,
      loginHint = null,
      context = 'signin',
    } = options;

    if (this.state.isAuthenticating) {
      console.warn('[Auth] Authentication already in progress');
      return null;
    }

    try {
      this.state.isAuthenticating = true;
      this.emit('authStart', { method: 'google', context });

      // Show loading state
      this.showAuthLoading('Connecting to Google...');

      // Configure sign-in options
      const signInOptions = {
        prompt,
        login_hint: loginHint,
      };

      // Perform Google sign-in
      const googleUser = await this.googleAuth.signIn(signInOptions);
      const profile = googleUser.getBasicProfile();
      const authResponse = googleUser.getAuthResponse();

      // Validate response
      if (!authResponse || !authResponse.id_token) {
        throw new Error('Invalid Google authentication response');
      }

      // Update loading message
      this.showAuthLoading('Verifying credentials...');

      // Create Firebase credential
      const credential = firebase.auth.GoogleAuthProvider.credential(
        authResponse.id_token
      );

      // Sign in to Firebase
      const userCredential = await firebase.auth().signInWithCredential(credential);
      const user = userCredential.user;

      // Check if this is a new user
      const isNewUser = userCredential.additionalUserInfo?.isNewUser;

      // Enhanced user data
      const userData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || profile.getName(),
        photoURL: user.photoURL || profile.getImageUrl(),
        firstName: profile.getGivenName(),
        lastName: profile.getFamilyName(),
        provider: 'google',
        googleId: profile.getId(),
        emailVerified: user.emailVerified,
        metadata: {
          createdAt: user.metadata.creationTime,
          lastSignIn: user.metadata.lastSignInTime,
        },
        preferences: {
          theme: 'light',
          notifications: true,
          privacy: 'standard',
        }
      };

      // Handle new vs existing user
      if (isNewUser) {
        await this.handleNewUser(userData);
      } else {
        await this.handleExistingUser(userData);
      }

      // Create session
      await this.createSession(userData, {
        authMethod: 'google',
        rememberMe: true,
        accessToken: authResponse.access_token,
        refreshToken: authResponse.id_token,
        expiresAt: authResponse.expires_at,
      });

      // Update state
      this.state.user = userData;
      this.state.authMethod = 'google';
      this.state.loginAttempts = 0;

      // Success feedback
      this.showAuthSuccess(`Welcome${isNewUser ? '' : ' back'}, ${userData.firstName}!`);

      this.emit('authSuccess', { user: userData, isNewUser });
      
      return userData;

    } catch (error) {
      console.error('[Auth] Google sign-in failed:', error);
      this.handleAuthError(error);
      throw error;
    } finally {
      this.state.isAuthenticating = false;
      this.hideAuthLoading();
    }
  }

  /**
   * Handle new user onboarding
   */
  async handleNewUser(userData) {
    try {
      // Create user profile in Firestore
      const userRef = firebase.firestore().collection('users').doc(userData.uid);
      
      await userRef.set({
        ...userData,
        settings: {
          notifications: {
            email: true,
            push: false,
            frequency: 'weekly',
          },
          privacy: {
            showProfile: true,
            shareCollection: false,
            dataRetention: '1year',
          },
          preferences: {
            theme: 'light',
            language: navigator.language || 'en',
            currency: 'USD',
            measurementSystem: 'metric',
          }
        },
        stats: {
          totalWines: 0,
          totalRatings: 0,
          joinDate: firebase.firestore.FieldValue.serverTimestamp(),
        },
        subscription: {
          plan: 'free',
          status: 'active',
        },
        onboarding: {
          completed: false,
          steps: {
            welcome: false,
            preferences: false,
            firstWine: false,
          }
        },
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      });

      // Initialize user data
      await this.initializeUserData(userData.uid);

      // Track analytics
      this.trackEvent('user_signup', {
        method: 'google',
        referrer: document.referrer,
      });

      // Show onboarding
      this.emit('showOnboarding', { user: userData });

    } catch (error) {
      console.error('[Auth] Failed to create new user:', error);
      throw error;
    }
  }

  /**
   * Handle existing user sign-in
   */
  async handleExistingUser(userData) {
    try {
      const userRef = firebase.firestore().collection('users').doc(userData.uid);
      const userDoc = await userRef.get();

      if (userDoc.exists) {
        // Update last sign-in
        await userRef.update({
          lastSignIn: firebase.firestore.FieldValue.serverTimestamp(),
          'metadata.lastSignInTime': new Date().toISOString(),
        });

        // Merge with existing data
        const existingData = userDoc.data();
        Object.assign(userData, {
          settings: existingData.settings,
          preferences: existingData.preferences,
          subscription: existingData.subscription,
        });

        // Check for required actions
        await this.checkRequiredActions(userData);

        // Sync user data
        await this.syncUserData(userData.uid);

      } else {
        // User exists in Auth but not Firestore (edge case)
        await this.handleNewUser(userData);
      }

      // Track analytics
      this.trackEvent('user_signin', {
        method: 'google',
        daysSinceLastLogin: this.calculateDaysSinceLastLogin(userData),
      });

    } catch (error) {
      console.error('[Auth] Failed to handle existing user:', error);
      throw error;
    }
  }

  /**
   * Create and manage user session
   */
  async createSession(user, options = {}) {
    const {
      authMethod = 'unknown',
      rememberMe = false,
      accessToken = null,
      refreshToken = null,
      expiresAt = null,
    } = options;

    const session = {
      id: this.generateSessionId(),
      userId: user.uid,
      authMethod,
      createdAt: Date.now(),
      expiresAt: expiresAt || Date.now() + this.config.session.sessionTimeout,
      lastActivity: Date.now(),
      rememberMe,
      tokens: {
        access: accessToken,
        refresh: refreshToken,
      },
      device: {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        screenResolution: `${screen.width}x${screen.height}`,
      },
      security: {
        csrfToken: this.generateCSRFToken(),
        ipAddress: null, // Would need server-side support
      }
    };

    // Save session
    this.state.session = session;
    await this.saveSession(session);

    // Setup token refresh
    if (refreshToken && expiresAt) {
      this.scheduleTokenRefresh(expiresAt);
    }

    // Setup activity monitoring
    this.startActivityMonitoring();

    return session;
  }

  /**
   * Enhanced error handling
   */
  handleAuthError(error) {
    const errorMessages = {
      'auth/popup-closed-by-user': 'Sign-in cancelled',
      'auth/cancelled-popup-request': 'Another sign-in is in progress',
      'auth/popup-blocked': 'Pop-up blocked. Please allow pop-ups for this site.',
      'auth/account-exists-with-different-credential': 'An account already exists with this email.',
      'auth/credential-already-in-use': 'This credential is already associated with another account.',
      'auth/network-request-failed': 'Network error. Please check your connection.',
      'auth/too-many-requests': 'Too many attempts. Please try again later.',
      'auth/user-disabled': 'This account has been disabled.',
      'auth/operation-not-allowed': 'This sign-in method is not enabled.',
    };

    const message = errorMessages[error.code] || 'Authentication failed. Please try again.';
    
    this.emit('authError', { error, message });
    this.showAuthError(message);

    // Track error
    this.trackEvent('auth_error', {
      error_code: error.code,
      error_message: error.message,
      auth_method: this.state.authMethod,
    });
  }

  /**
   * UI Helper Methods
   */
  showAuthLoading(message) {
    if (typeof WineRater !== 'undefined' && WineRater.UIManager) {
      WineRater.UIManager.showLoading(message);
    }
  }

  hideAuthLoading() {
    if (typeof WineRater !== 'undefined' && WineRater.UIManager) {
      WineRater.UIManager.hideLoading();
    }
  }

  showAuthSuccess(message) {
    if (typeof WineRater !== 'undefined' && WineRater.UIManager) {
      WineRater.UIManager.showToast(message, 'success');
    }
  }

  showAuthError(message) {
    if (typeof WineRater !== 'undefined' && WineRater.UIManager) {
      WineRater.UIManager.showToast(message, 'error');
    }
  }

  /**
   * Session Management
   */
  async saveSession(session) {
    try {
      // Encrypt sensitive data before storing
      const encryptedSession = await this.encryptSession(session);
      
      if (session.rememberMe) {
        localStorage.setItem('auth_session', JSON.stringify(encryptedSession));
      } else {
        sessionStorage.setItem('auth_session', JSON.stringify(encryptedSession));
      }
    } catch (error) {
      console.error('[Auth] Failed to save session:', error);
    }
  }

  async loadSession() {
    try {
      let sessionData = localStorage.getItem('auth_session') || 
                       sessionStorage.getItem('auth_session');
      
      if (!sessionData) return null;

      const session = JSON.parse(sessionData);
      
      // Validate session
      if (this.isSessionValid(session)) {
        // Decrypt session
        const decryptedSession = await this.decryptSession(session);
        this.state.session = decryptedSession;
        
        // Restore user
        await this.restoreUser(decryptedSession.userId);
        
        return decryptedSession;
      } else {
        // Clear invalid session
        this.clearSession();
        return null;
      }
    } catch (error) {
      console.error('[Auth] Failed to load session:', error);
      return null;
    }
  }

  isSessionValid(session) {
    if (!session) return false;
    
    // Check expiration
    if (session.expiresAt && session.expiresAt < Date.now()) {
      return false;
    }
    
    // Validate CSRF token
    if (!session.security?.csrfToken) {
      return false;
    }
    
    return true;
  }

  /**
   * Security Helpers
   */
  generateSessionId() {
    return 'sess_' + this.generateRandomString(32);
  }

  generateCSRFToken() {
    return this.generateRandomString(this.config.security.csrfTokenLength);
  }

  generateRandomString(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    
    for (let i = 0; i < length; i++) {
      result += chars[array[i] % chars.length];
    }
    
    return result;
  }

  async encryptSession(session) {
    // In production, use proper encryption
    // For now, we'll use a simple approach
    return {
      ...session,
      encrypted: true,
      timestamp: Date.now(),
    };
  }

  async decryptSession(encryptedSession) {
    // In production, use proper decryption
    return encryptedSession;
  }

  /**
   * Activity Monitoring
   */
  startActivityMonitoring() {
    // Monitor user activity
    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    
    const updateActivity = () => {
      this.state.lastActivity = Date.now();
      if (this.state.session) {
        this.state.session.lastActivity = Date.now();
      }
    };

    activityEvents.forEach(event => {
      document.addEventListener(event, updateActivity, { passive: true });
    });

    // Check for inactivity
    this.activityTimer = setInterval(() => {
      const inactiveTime = Date.now() - this.state.lastActivity;
      
      if (inactiveTime > this.config.session.sessionTimeout) {
        this.handleSessionTimeout();
      }
    }, 60000); // Check every minute
  }

  handleSessionTimeout() {
    this.emit('sessionTimeout');
    this.signOut({ reason: 'timeout' });
  }

  /**
   * Token Management
   */
  scheduleTokenRefresh(expiresAt) {
    const timeUntilExpiry = expiresAt - Date.now();
    const refreshTime = timeUntilExpiry - this.config.session.refreshThreshold;

    if (refreshTime > 0) {
      this.tokenRefreshTimer = setTimeout(() => {
        this.refreshTokens();
      }, refreshTime);
    }
  }

  async refreshTokens() {
    try {
      if (this.state.authMethod === 'google' && this.googleAuth) {
        const googleUser = this.googleAuth.currentUser.get();
        if (googleUser) {
          const authResponse = await googleUser.reloadAuthResponse();
          
          // Update session with new tokens
          if (this.state.session) {
            this.state.session.tokens = {
              access: authResponse.access_token,
              refresh: authResponse.id_token,
            };
            this.state.session.expiresAt = authResponse.expires_at;
            
            await this.saveSession(this.state.session);
            this.scheduleTokenRefresh(authResponse.expires_at);
          }
        }
      }
    } catch (error) {
      console.error('[Auth] Token refresh failed:', error);
      // Don't sign out on refresh failure, try again later
      this.scheduleTokenRefresh(Date.now() + 5 * 60 * 1000); // Try again in 5 min
    }
  }

  /**
   * Sign Out
   */
  async signOut(options = {}) {
    const { reason = 'user_initiated' } = options;

    try {
      this.emit('signOutStart', { reason });

      // Sign out from Google
      if (this.googleAuth) {
        await this.googleAuth.signOut();
      }

      // Sign out from Firebase
      await firebase.auth().signOut();

      // Clear session
      this.clearSession();

      // Clear timers
      this.clearTimers();

      // Reset state
      this.state = {
        ...this.state,
        user: null,
        session: null,
        authMethod: null,
        loginAttempts: 0,
      };

      // Track analytics
      this.trackEvent('user_signout', { reason });

      this.emit('signOutComplete');
      this.showAuthSuccess('Signed out successfully');

    } catch (error) {
      console.error('[Auth] Sign out failed:', error);
      this.handleError(error);
    }
  }

  clearSession() {
    localStorage.removeItem('auth_session');
    sessionStorage.removeItem('auth_session');
  }

  clearTimers() {
    if (this.tokenRefreshTimer) {
      clearTimeout(this.tokenRefreshTimer);
      this.tokenRefreshTimer = null;
    }
    
    if (this.activityTimer) {
      clearInterval(this.activityTimer);
      this.activityTimer = null;
    }
  }

  /**
   * Event System
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    if (!this.listeners.has(event)) return;
    
    const callbacks = this.listeners.get(event);
    const index = callbacks.indexOf(callback);
    
    if (index > -1) {
      callbacks.splice(index, 1);
    }
  }

  emit(event, data = {}) {
    if (!this.listeners.has(event)) return;
    
    const callbacks = this.listeners.get(event);
    callbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`[Auth] Error in event listener for ${event}:`, error);
      }
    });
  }

  /**
   * Analytics
   */
  trackEvent(eventName, parameters = {}) {
    // Google Analytics
    if (typeof gtag !== 'undefined') {
      gtag('event', eventName, parameters);
    }
    
    // Firebase Analytics
    if (firebase.analytics) {
      firebase.analytics().logEvent(eventName, parameters);
    }
    
    // Custom analytics
    this.emit('analytics', { event: eventName, parameters });
  }

  /**
   * Utility Methods
   */
  async getCurrentUser() {
    return this.state.user;
  }

  isAuthenticated() {
    return this.state.user !== null && this.isSessionValid(this.state.session);
  }

  getAuthMethod() {
    return this.state.authMethod;
  }

  async requireAuth() {
    if (!this.isAuthenticated()) {
      this.emit('authRequired');
      throw new Error('Authentication required');
    }
    return this.state.user;
  }

  async requireRecentAuth(action) {
    const recentAuthTime = 5 * 60 * 1000; // 5 minutes
    const timeSinceAuth = Date.now() - this.state.session?.createdAt;
    
    if (timeSinceAuth > recentAuthTime) {
      const confirmed = await this.reauthenticate(action);
      if (!confirmed) {
        throw new Error('Recent authentication required');
      }
    }
  }
}

// Export for use
window.AuthSystem = AuthSystem;