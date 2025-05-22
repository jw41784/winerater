/**
 * WineRater Application Initialization
 * Bootstrap the application and all modules
 */

(function() {
  'use strict';

  // Wait for DOM to be ready
  document.addEventListener('DOMContentLoaded', function() {
    console.log('Starting WineRater application...');

    // Initialize core modules in correct order
    const initSequence = [
      initializeFirebase,
      initializeServiceWorker,
      initializeModules,
      setupGlobalHandlers,
      checkAuthState
    ];

    // Execute initialization sequence
    initSequence.forEach(fn => {
      try {
        fn();
      } catch (error) {
        console.error('Initialization error:', error);
      }
    });
  });

  // Initialize Firebase (already done in HTML)
  function initializeFirebase() {
    console.log('Firebase initialized');
    
    // Enable offline persistence
    if (firebase.firestore) {
      firebase.firestore().enablePersistence()
        .catch((err) => {
          if (err.code === 'failed-precondition') {
            console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
          } else if (err.code === 'unimplemented') {
            console.warn('The current browser does not support offline persistence');
          }
        });
    }
  }

  // Initialize Service Worker for PWA
  function initializeServiceWorker() {
    if ('serviceWorker' in navigator && location.protocol === 'https:') {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('Service Worker registered:', registration.scope);
          
          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New content available
                WineRater.UIManager.showToast(
                  'New version available! Refresh to update.',
                  'info',
                  0 // Don't auto-hide
                );
              }
            });
          });
        })
        .catch(error => {
          console.error('Service Worker registration failed:', error);
        });
    }
  }

  // Initialize all application modules
  function initializeModules() {
    // The modules should auto-register with Core
    console.log('All modules initialized');
  }

  // Setup global event handlers
  function setupGlobalHandlers() {
    // Handle online/offline status
    window.addEventListener('online', () => {
      WineRater.UIManager.showToast('Back online!', 'success');
      if (WineRater.DataManager) {
        WineRater.DataManager.syncToCloud();
      }
    });

    window.addEventListener('offline', () => {
      WineRater.UIManager.showToast('You are offline. Changes will sync when reconnected.', 'warning');
    });

    // Handle visibility change
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && WineRater.AuthManager && WineRater.AuthManager.isSignedIn()) {
        // Sync when app becomes visible
        if (WineRater.DataManager) {
          WineRater.DataManager.syncToCloud();
        }
      }
    });

    // Handle before unload
    window.addEventListener('beforeunload', (e) => {
      if (WineRater.DataManager && WineRater.DataManager.hasUnsavedChanges()) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
      }
    });

    // Prevent double-tap zoom on mobile
    let lastTouchEnd = 0;
    document.addEventListener('touchend', (e) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        e.preventDefault();
      }
      lastTouchEnd = now;
    }, false);

    // Handle escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        // Close any open modals
        const modal = document.querySelector('.modal-overlay.active');
        if (modal && WineRater.UIManager) {
          WineRater.UIManager.closeModal(modal);
        }

        // Close user menu dropdown
        const userMenu = document.getElementById('user-menu-dropdown');
        if (userMenu && userMenu.classList.contains('open')) {
          userMenu.classList.remove('open');
        }
      }
    });

    // Add shake to refresh on mobile
    if (window.DeviceMotionEvent) {
      let shakeThreshold = 15;
      let lastUpdate = 0;
      let x, y, z, lastX, lastY, lastZ;
      
      window.addEventListener('devicemotion', (e) => {
        const acceleration = e.accelerationIncludingGravity;
        const curTime = Date.now();
        
        if ((curTime - lastUpdate) > 100) {
          const diffTime = curTime - lastUpdate;
          lastUpdate = curTime;
          
          x = acceleration.x;
          y = acceleration.y;
          z = acceleration.z;
          
          const speed = Math.abs(x + y + z - lastX - lastY - lastZ) / diffTime * 10000;
          
          if (speed > shakeThreshold) {
            // Refresh data on shake
            if (WineRater.UIManager) {
              WineRater.UIManager.showToast('Refreshing...', 'info');
            }
            if (WineRater.DataManager) {
              WineRater.DataManager.syncFromCloud();
            }
          }
          
          lastX = x;
          lastY = y;
          lastZ = z;
        }
      });
    }

    // Setup pull to refresh on mobile
    let touchStartY = 0;
    let touchEndY = 0;
    
    document.addEventListener('touchstart', (e) => {
      touchStartY = e.touches[0].clientY;
    });
    
    document.addEventListener('touchmove', (e) => {
      touchEndY = e.touches[0].clientY;
      
      // Only trigger if at top of page
      if (window.scrollY === 0 && touchEndY > touchStartY + 100) {
        document.body.style.transform = `translateY(${Math.min(touchEndY - touchStartY, 100)}px)`;
      }
    });
    
    document.addEventListener('touchend', () => {
      document.body.style.transform = '';
      
      if (window.scrollY === 0 && touchEndY > touchStartY + 100) {
        if (WineRater.UIManager) {
          WineRater.UIManager.showToast('Refreshing...', 'info');
        }
        if (WineRater.DataManager) {
          WineRater.DataManager.syncFromCloud();
        }
      }
      
      touchStartY = 0;
      touchEndY = 0;
    });

    // Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Ctrl/Cmd + shortcuts
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'n': // New wine
            e.preventDefault();
            if (WineRater.UIManager) {
              WineRater.UIManager.switchView('add-wine');
            }
            break;
          case 's': // Save/Sync
            e.preventDefault();
            if (WineRater.DataManager) {
              WineRater.DataManager.syncToCloud();
            }
            break;
          case 'f': // Focus search
            e.preventDefault();
            const searchInput = document.getElementById('search-wines');
            if (searchInput) {
              searchInput.focus();
            }
            break;
        }
      }
    });

    // Setup intersection observer for animations
    const animateOnScroll = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
          animateOnScroll.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '50px'
    });

    // Observe elements that should animate on scroll
    document.querySelectorAll('.animate-on-scroll').forEach(el => {
      animateOnScroll.observe(el);
    });
  }

  // Check authentication state
  function checkAuthState() {
    // Auth state is handled by AuthManager
    console.log('Auth state check initiated');
  }

  // Export init function for manual initialization if needed
  window.WineRaterInit = {
    reinitialize: function() {
      location.reload();
    },
    
    clearCache: function() {
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => {
            caches.delete(name);
          });
        });
      }
      localStorage.clear();
      sessionStorage.clear();
      WineRater.UIManager.showToast('Cache cleared', 'success');
    }
  };

})();