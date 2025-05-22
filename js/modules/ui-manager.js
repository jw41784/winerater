/**
 * UI Manager Module
 * Handles all UI interactions and animations
 */

WineRater.UIManager = (function() {
  'use strict';

  const { utils } = WineRater.Core;
  const { $, $$, animate, createElement } = utils;

  // Private state
  let currentView = 'dashboard';
  let isLoading = false;
  let toastQueue = [];
  let toastTimeout = null;

  // UI Components
  const components = {
    // Show loading overlay
    showLoading(message = 'Loading...') {
      isLoading = true;
      
      let overlay = $('#loading-overlay');
      if (!overlay) {
        overlay = createElement('div', {
          id: 'loading-overlay',
          className: 'loading-overlay active'
        }, [
          createElement('div', { className: 'spinner' }),
          createElement('p', { id: 'loading-message' }, [message])
        ]);
        document.body.appendChild(overlay);
      } else {
        overlay.classList.add('active');
        $('#loading-message').textContent = message;
      }
    },

    // Hide loading overlay
    hideLoading() {
      isLoading = false;
      const overlay = $('#loading-overlay');
      if (overlay) {
        overlay.classList.remove('active');
      }
    },

    // Show toast notification
    showToast(message, type = 'info', duration = 3000) {
      const toast = createElement('div', {
        className: `toast toast-${type} show`
      }, [
        createElement('div', { className: 'toast-content' }, [
          createElement('i', { className: getToastIcon(type) }),
          createElement('span', { className: 'toast-message' }, [message])
        ]),
        createElement('button', {
          className: 'toast-close',
          onclick: () => removeToast(toast)
        }, [
          createElement('i', { className: 'fas fa-times' })
        ])
      ]);

      let container = $('#toast-container');
      if (!container) {
        container = createElement('div', {
          id: 'toast-container',
          className: 'toast-container'
        });
        document.body.appendChild(container);
      }

      container.appendChild(toast);
      
      // Auto-remove after duration
      setTimeout(() => removeToast(toast), duration);
    },

    // Show modal
    showModal(content, options = {}) {
      const {
        title = '',
        size = 'medium',
        closeButton = true,
        actions = []
      } = options;

      const modal = createElement('div', {
        className: 'modal-overlay active'
      }, [
        createElement('div', {
          className: `modal modal-${size}`
        }, [
          // Header
          title && createElement('div', { className: 'modal-header' }, [
            createElement('h3', { className: 'modal-title' }, [title]),
            closeButton && createElement('button', {
              className: 'modal-close',
              onclick: () => this.closeModal(modal)
            }, [
              createElement('i', { className: 'fas fa-times' })
            ])
          ]),
          
          // Body
          createElement('div', { className: 'modal-body' }, [content]),
          
          // Footer
          actions.length > 0 && createElement('div', { className: 'modal-footer' }, 
            actions.map(action => 
              createElement('button', {
                className: `btn ${action.className || 'btn-secondary'}`,
                onclick: () => {
                  if (action.handler() !== false) {
                    this.closeModal(modal);
                  }
                }
              }, [action.label])
            )
          )
        ])
      ]);

      document.body.appendChild(modal);
      return modal;
    },

    // Close modal
    closeModal(modal) {
      modal.classList.remove('active');
      setTimeout(() => modal.remove(), 300);
    },

    // Create wine card
    createWineCard(wine) {
      const rating = wine.ratings ? 
        Object.values(wine.ratings).reduce((sum, val) => sum + val, 0) / Object.keys(wine.ratings).length : 0;

      return createElement('div', {
        className: 'wine-card fade-in',
        dataset: { id: wine.id }
      }, [
        // Image section
        createElement('div', { className: 'wine-card-image' }, [
          wine.image ? 
            createElement('img', { src: wine.image, alt: wine.name }) :
            createElement('div', { className: 'wine-placeholder' }, [
              createElement('i', { className: 'fas fa-wine-bottle' })
            ]),
          createElement('span', { 
            className: `wine-type-badge badge-${wine.type.toLowerCase()}`
          }, [wine.type])
        ]),
        
        // Content section
        createElement('div', { className: 'wine-card-content' }, [
          createElement('h3', { className: 'wine-name' }, [wine.name]),
          createElement('p', { className: 'wine-winery' }, [wine.winery]),
          
          createElement('div', { className: 'wine-details' }, [
            createElement('span', { className: 'wine-vintage' }, [
              createElement('i', { className: 'far fa-calendar' }),
              ` ${wine.vintage}`
            ]),
            createElement('span', { className: 'wine-region' }, [
              createElement('i', { className: 'fas fa-map-marker-alt' }),
              ` ${wine.region}`
            ])
          ]),
          
          createElement('div', { className: 'wine-footer' }, [
            createElement('div', { className: 'wine-rating' }, [
              createElement('div', { className: 'wine-rating-stars' }, 
                createStarRating(rating)
              ),
              createElement('span', { className: 'wine-rating-value' }, [
                rating.toFixed(1)
              ])
            ]),
            createElement('span', { className: 'wine-price' }, [
              utils.formatCurrency(wine.price)
            ])
          ])
        ])
      ]);
    },

    // Create star rating display
    createStarRating(rating, interactive = false) {
      const stars = [];
      const fullStars = Math.floor(rating);
      const hasHalfStar = rating % 1 >= 0.5;

      for (let i = 1; i <= 5; i++) {
        const starClass = i <= fullStars ? 'fas fa-star' : 
                         (i === fullStars + 1 && hasHalfStar ? 'fas fa-star-half-alt' : 'far fa-star');
        
        stars.push(createElement('i', {
          className: `star ${starClass}`,
          dataset: interactive ? { value: i } : {}
        }));
      }

      return stars;
    },

    // Update stat card
    updateStatCard(statId, value, animate = true) {
      const element = $(`#${statId}`);
      if (!element) return;

      if (animate) {
        element.style.opacity = '0';
        element.style.transform = 'scale(0.8)';
        
        setTimeout(() => {
          element.textContent = value;
          element.style.opacity = '1';
          element.style.transform = 'scale(1)';
        }, 150);
      } else {
        element.textContent = value;
      }
    }
  };

  // Helper functions
  function getToastIcon(type) {
    const icons = {
      success: 'fas fa-check-circle',
      error: 'fas fa-exclamation-circle',
      warning: 'fas fa-exclamation-triangle',
      info: 'fas fa-info-circle'
    };
    return icons[type] || icons.info;
  }

  function removeToast(toast) {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }

  function createStarRating(rating) {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      const filled = i <= Math.round(rating);
      stars.push(createElement('i', {
        className: filled ? 'fas fa-star' : 'far fa-star'
      }));
    }
    return stars;
  }

  // View management
  const viewManager = {
    // Switch between views
    switchView(viewName) {
      if (viewName === currentView) return;

      // Hide current view
      const currentElement = $(`#${currentView}`);
      if (currentElement) {
        currentElement.classList.remove('active');
        animate(currentElement, 'fadeOut', 200).then(() => {
          currentElement.style.display = 'none';
        });
      }

      // Show new view
      const newElement = $(`#${viewName}`);
      if (newElement) {
        newElement.style.display = 'block';
        setTimeout(() => {
          newElement.classList.add('active');
          animate(newElement, 'fadeIn', 300);
        }, 50);
      }

      // Update navigation
      this.updateNavigation(viewName);
      
      currentView = viewName;
      WineRater.Core.emit('view:changed', { view: viewName });
    },

    // Update navigation active states
    updateNavigation(viewName) {
      // Desktop nav
      $$('.nav-link').forEach(link => {
        const linkView = link.dataset.view;
        link.classList.toggle('active', linkView === viewName);
      });

      // Mobile nav
      $$('.nav-mobile-link').forEach(link => {
        const linkView = link.dataset.view;
        link.classList.toggle('active', linkView === viewName);
      });
    },

    // Get current view
    getCurrentView() {
      return currentView;
    }
  };

  // Initialize module
  function init() {
    console.log('Initializing UI Manager...');
    
    // Set up navigation event listeners
    setupNavigation();
    
    // Set up other UI interactions
    setupUserMenu();
    setupModals();
    setupFormEnhancements();
    
    // Initialize animations
    initializeAnimations();
  }

  function setupNavigation() {
    // Desktop navigation
    $$('.nav-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const view = link.dataset.view;
        if (view) {
          viewManager.switchView(view);
        }
      });
    });

    // Mobile navigation
    $$('.nav-mobile-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const view = link.dataset.view;
        if (view) {
          viewManager.switchView(view);
        }
      });
    });

    // FAB button
    const fab = $('.fab');
    if (fab) {
      fab.addEventListener('click', () => {
        viewManager.switchView('add-wine');
      });
    }
  }

  function setupUserMenu() {
    const trigger = $('#user-menu-trigger');
    const dropdown = $('#user-menu-dropdown');
    
    if (trigger && dropdown) {
      trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('open');
      });

      document.addEventListener('click', () => {
        dropdown.classList.remove('open');
      });

      dropdown.addEventListener('click', (e) => {
        e.stopPropagation();
      });
    }
  }

  function setupModals() {
    // Close modal on overlay click
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal-overlay')) {
        components.closeModal(e.target);
      }
    });

    // Close modal on ESC key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const modal = $('.modal-overlay.active');
        if (modal) {
          components.closeModal(modal);
        }
      }
    });
  }

  function setupFormEnhancements() {
    // Auto-resize textareas
    $$('textarea').forEach(textarea => {
      textarea.addEventListener('input', () => {
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
      });
    });

    // Form validation feedback
    $$('form').forEach(form => {
      form.addEventListener('submit', (e) => {
        if (!form.checkValidity()) {
          e.preventDefault();
          e.stopPropagation();
          
          // Show validation errors
          const firstInvalid = form.querySelector(':invalid');
          if (firstInvalid) {
            firstInvalid.focus();
            components.showToast('Please fill in all required fields', 'error');
          }
        }
        
        form.classList.add('was-validated');
      });
    });
  }

  function initializeAnimations() {
    // Intersection Observer for fade-in animations
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1
    });

    // Observe elements with animation classes
    $$('.fade-in-up, .fade-in-down, .fade-in-left, .fade-in-right').forEach(el => {
      observer.observe(el);
    });
  }

  // Public API
  return {
    init,
    ...components,
    ...viewManager,
    
    // Additional UI utilities
    confirm(message, options = {}) {
      return new Promise((resolve) => {
        const content = createElement('p', {}, [message]);
        
        this.showModal(content, {
          title: options.title || 'Confirm',
          size: 'small',
          actions: [
            {
              label: options.cancelText || 'Cancel',
              className: 'btn-secondary',
              handler: () => {
                resolve(false);
                return true;
              }
            },
            {
              label: options.confirmText || 'Confirm',
              className: options.dangerous ? 'btn-danger' : 'btn-primary',
              handler: () => {
                resolve(true);
                return true;
              }
            }
          ]
        });
      });
    },

    prompt(message, options = {}) {
      return new Promise((resolve) => {
        const input = createElement('input', {
          type: options.type || 'text',
          className: 'form-input',
          placeholder: options.placeholder || '',
          value: options.defaultValue || ''
        });

        const content = createElement('div', {}, [
          createElement('p', {}, [message]),
          input
        ]);

        this.showModal(content, {
          title: options.title || 'Input',
          size: 'small',
          actions: [
            {
              label: 'Cancel',
              className: 'btn-secondary',
              handler: () => {
                resolve(null);
                return true;
              }
            },
            {
              label: 'OK',
              className: 'btn-primary',
              handler: () => {
                resolve(input.value);
                return true;
              }
            }
          ]
        });

        setTimeout(() => input.focus(), 100);
      });
    }
  };
})();

// Register module
WineRater.Core.registerModule('UIManager', WineRater.UIManager);