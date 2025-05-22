/**
 * WineRater Core Application
 * Modern, modular JavaScript architecture
 */

// Application Namespace
window.WineRater = window.WineRater || {};

// Core Module
WineRater.Core = (function() {
  'use strict';

  // Private variables
  let initialized = false;
  const modules = new Map();
  const eventBus = new EventTarget();

  // Public API
  return {
    // Initialize the application
    init() {
      if (initialized) {
        console.warn('WineRater.Core already initialized');
        return;
      }

      console.log('Initializing WineRater Core...');
      
      // Initialize all registered modules
      modules.forEach((module, name) => {
        if (typeof module.init === 'function') {
          console.log(`Initializing module: ${name}`);
          module.init();
        }
      });

      initialized = true;
      this.emit('app:initialized');
    },

    // Register a module
    registerModule(name, module) {
      if (modules.has(name)) {
        console.warn(`Module ${name} already registered`);
        return;
      }
      
      modules.set(name, module);
      console.log(`Module registered: ${name}`);
      
      // Initialize if app already initialized
      if (initialized && typeof module.init === 'function') {
        module.init();
      }
    },

    // Get a registered module
    getModule(name) {
      return modules.get(name);
    },

    // Event handling
    on(event, handler) {
      eventBus.addEventListener(event, handler);
    },

    off(event, handler) {
      eventBus.removeEventListener(event, handler);
    },

    emit(event, data) {
      eventBus.dispatchEvent(new CustomEvent(event, { detail: data }));
    },

    // Utility functions
    utils: {
      // Generate unique ID
      generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
      },

      // Debounce function
      debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
          const later = () => {
            clearTimeout(timeout);
            func(...args);
          };
          clearTimeout(timeout);
          timeout = setTimeout(later, wait);
        };
      },

      // Throttle function
      throttle(func, limit) {
        let inThrottle;
        return function(...args) {
          if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
          }
        };
      },

      // Format currency
      formatCurrency(amount, currency = 'USD') {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: currency
        }).format(amount);
      },

      // Format date
      formatDate(date, format = 'short') {
        const options = format === 'short' 
          ? { year: 'numeric', month: 'short', day: 'numeric' }
          : { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        
        return new Intl.DateTimeFormat('en-US', options).format(new Date(date));
      },

      // Validate email
      isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
      },

      // Deep clone object
      deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
      },

      // Merge objects
      merge(...objects) {
        return Object.assign({}, ...objects);
      },

      // Get element
      $(selector, context = document) {
        return context.querySelector(selector);
      },

      // Get all elements
      $$(selector, context = document) {
        return Array.from(context.querySelectorAll(selector));
      },

      // Create element
      createElement(tag, attrs = {}, children = []) {
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
          } else {
            element.appendChild(child);
          }
        });

        return element;
      },

      // Animation helper
      animate(element, animation, duration = 300) {
        return new Promise((resolve) => {
          element.style.animation = `${animation} ${duration}ms ease`;
          
          const handleAnimationEnd = () => {
            element.style.animation = '';
            element.removeEventListener('animationend', handleAnimationEnd);
            resolve();
          };
          
          element.addEventListener('animationend', handleAnimationEnd);
        });
      },

      // Local storage wrapper
      storage: {
        get(key) {
          try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
          } catch (e) {
            console.error('Error reading from localStorage:', e);
            return null;
          }
        },

        set(key, value) {
          try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
          } catch (e) {
            console.error('Error writing to localStorage:', e);
            return false;
          }
        },

        remove(key) {
          try {
            localStorage.removeItem(key);
            return true;
          } catch (e) {
            console.error('Error removing from localStorage:', e);
            return false;
          }
        },

        clear() {
          try {
            localStorage.clear();
            return true;
          } catch (e) {
            console.error('Error clearing localStorage:', e);
            return false;
          }
        }
      }
    }
  };
})();

// Auto-initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => WineRater.Core.init());
} else {
  WineRater.Core.init();
}