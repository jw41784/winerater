/**
 * Modern UI Components Fix
 * Ensures proper initialization order
 */

(function() {
    'use strict';
    
    console.log('[Modern UI Fix] Initializing...');
    
    // Create WineRater namespace if it doesn't exist
    window.WineRater = window.WineRater || {};
    
    // Create Core with minimal utilities if needed
    if (!window.WineRater.Core) {
        console.log('[Modern UI Fix] Creating minimal WineRater.Core...');
        
        window.WineRater.Core = {
            utils: {
                generateId: () => Date.now().toString(36) + Math.random().toString(36).substr(2),
                formatCurrency: (amount) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount),
                formatDate: (date) => new Date(date).toLocaleDateString(),
                createElement: (tag, attrs = {}, children = []) => {
                    const element = document.createElement(tag);
                    Object.entries(attrs).forEach(([key, value]) => {
                        if (key === 'className') {
                            element.className = value;
                        } else if (key === 'dataset') {
                            Object.entries(value).forEach(([dataKey, dataValue]) => {
                                element.dataset[dataKey] = dataValue;
                            });
                        } else if (key.startsWith('on')) {
                            element.addEventListener(key.slice(2).toLowerCase(), value);
                        } else {
                            element.setAttribute(key, value);
                        }
                    });
                    children.forEach(child => {
                        if (typeof child === 'string') {
                            element.appendChild(document.createTextNode(child));
                        } else if (child) {
                            element.appendChild(child);
                        }
                    });
                    return element;
                }
            },
            registerModule: function(name, module) {
                window.WineRater[name] = module;
            }
        };
    }
    
    // Fix for app initialization - ensure auth UI is not blocked
    document.addEventListener('DOMContentLoaded', function() {
        console.log('[Modern UI Fix] DOM loaded, ensuring auth is visible...');
        
        // Make sure we're not blocking the auth UI
        const authContainer = document.getElementById('auth-container');
        const appContainer = document.getElementById('app-container');
        
        // Check if user is already signed in
        setTimeout(() => {
            firebase.auth().onAuthStateChanged(function(user) {
                console.log('[Modern UI Fix] Auth state:', user ? 'signed in' : 'signed out');
                
                if (!user && authContainer && appContainer) {
                    // Ensure auth is visible if not signed in
                    authContainer.style.display = 'flex';
                    appContainer.style.display = 'none';
                }
            });
        }, 100);
    });
    
    // Also ensure the auth fix is working
    if (window.Auth && !window.Auth._modernUIFixed) {
        window.Auth._modernUIFixed = true;
        
        // Make sure init is called
        if (typeof window.Auth.init === 'function') {
            console.log('[Modern UI Fix] Calling Auth.init()...');
            try {
                window.Auth.init();
            } catch (e) {
                console.error('[Modern UI Fix] Error in Auth.init():', e);
            }
        }
    }
    
})();