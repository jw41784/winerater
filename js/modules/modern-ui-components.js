/**
 * Modern UI Components for WineRater
 * Clean, minimal components inspired by 21st.dev design philosophy
 */

WineRater.ModernUI = (function() {
  'use strict';

  const { utils } = WineRater.Core;
  const { createElement } = utils;

  /**
   * Create a modern wine card
   */
  function createWineCard(wine) {
    const rating = wine.overallRating || 0;
    const imageUrl = wine.image || `https://source.unsplash.com/400x300/?wine,${wine.type}`;
    
    return createElement('div', {
      className: 'modern-wine-card',
      dataset: { wineId: wine.id }
    }, [
      // Image section
      createElement('div', { className: 'modern-wine-image' }, [
        wine.image ? 
          createElement('img', { 
            src: wine.image, 
            alt: wine.name,
            loading: 'lazy'
          }) :
          createElement('div', { 
            className: 'wine-image-placeholder',
            style: `background: linear-gradient(135deg, ${getWineColor(wine.type)} 0%, ${getWineColorLight(wine.type)} 100%);`
          }, [
            createElement('i', { className: 'fas fa-wine-bottle' })
          ]),
        createElement('span', { 
          className: 'modern-wine-badge',
          style: `color: ${getWineColor(wine.type)};`
        }, [wine.type])
      ]),
      
      // Content section
      createElement('div', { className: 'modern-wine-content' }, [
        createElement('h3', { className: 'modern-wine-title' }, [wine.name]),
        createElement('p', { className: 'modern-wine-subtitle' }, [
          `${wine.winery} • ${wine.region}`
        ]),
        
        // Stats row
        createElement('div', { className: 'modern-wine-stats' }, [
          createElement('span', { className: 'modern-wine-stat' }, [
            createElement('i', { className: 'fas fa-star' }),
            ` ${rating.toFixed(1)}`
          ]),
          createElement('span', { className: 'modern-wine-stat' }, [
            createElement('i', { className: 'fas fa-dollar-sign' }),
            ` ${wine.price}`
          ]),
          createElement('span', { className: 'modern-wine-stat' }, [
            createElement('i', { className: 'fas fa-calendar' }),
            ` ${wine.vintage}`
          ])
        ]),
        
        // Rating display
        createRatingDisplay(rating)
      ])
    ]);
  }

  /**
   * Create a modern rating display
   */
  function createRatingDisplay(rating) {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(createElement('i', { 
          className: 'fas fa-star modern-rating-star filled' 
        }));
      } else if (i === fullStars && hasHalfStar) {
        stars.push(createElement('i', { 
          className: 'fas fa-star-half-alt modern-rating-star filled' 
        }));
      } else {
        stars.push(createElement('i', { 
          className: 'far fa-star modern-rating-star' 
        }));
      }
    }

    return createElement('div', { className: 'modern-rating' }, [
      createElement('div', { className: 'modern-rating-stars' }, stars),
      createElement('span', { className: 'modern-rating-value' }, [
        rating.toFixed(1)
      ])
    ]);
  }

  /**
   * Create a modern stat card
   */
  function createStatCard(icon, value, label, color = 'var(--modern-accent)') {
    return createElement('div', { className: 'modern-stat-card' }, [
      createElement('div', { 
        className: 'modern-stat-icon',
        style: `color: ${color};`
      }, [
        createElement('i', { className: icon })
      ]),
      createElement('div', { className: 'modern-stat-value' }, [value]),
      createElement('div', { className: 'modern-stat-label' }, [label])
    ]);
  }

  /**
   * Create a modern search box
   */
  function createSearchBox(placeholder = 'Search wines...', onSearch) {
    const searchInput = createElement('input', {
      type: 'text',
      className: 'modern-search-input',
      placeholder: placeholder
    });

    if (onSearch) {
      searchInput.addEventListener('input', utils.debounce((e) => {
        onSearch(e.target.value);
      }, 300));
    }

    return createElement('div', { className: 'modern-search' }, [
      createElement('i', { className: 'fas fa-search modern-search-icon' }),
      searchInput
    ]);
  }

  /**
   * Create a modern select dropdown
   */
  function createSelect(options, value, onChange) {
    const select = createElement('select', {
      className: 'modern-select-input'
    });

    options.forEach(option => {
      select.appendChild(
        createElement('option', {
          value: option.value,
          selected: option.value === value
        }, [option.label])
      );
    });

    if (onChange) {
      select.addEventListener('change', (e) => onChange(e.target.value));
    }

    return createElement('div', { className: 'modern-select' }, [select]);
  }

  /**
   * Create a modern empty state
   */
  function createEmptyState(icon, title, text, actionLabel, onAction) {
    return createElement('div', { className: 'modern-empty-state' }, [
      createElement('div', { className: 'modern-empty-icon' }, [
        createElement('i', { className: icon })
      ]),
      createElement('h3', { className: 'modern-empty-title' }, [title]),
      createElement('p', { className: 'modern-empty-text' }, [text]),
      actionLabel && createElement('button', {
        className: 'modern-btn',
        onclick: onAction
      }, [
        createElement('i', { className: 'fas fa-plus' }),
        ` ${actionLabel}`
      ])
    ]);
  }

  /**
   * Create a modern toast notification
   */
  function showToast(message, type = 'info', duration = 3000) {
    const icons = {
      success: 'fas fa-check-circle',
      error: 'fas fa-exclamation-circle',
      warning: 'fas fa-exclamation-triangle',
      info: 'fas fa-info-circle'
    };

    const toast = createElement('div', {
      className: `modern-toast modern-toast-${type}`
    }, [
      createElement('i', { className: `${icons[type]} modern-toast-icon` }),
      createElement('div', { className: 'modern-toast-content' }, [
        createElement('div', { className: 'modern-toast-message' }, [message])
      ])
    ]);

    document.body.appendChild(toast);

    // Animate in
    setTimeout(() => {
      toast.style.transform = 'translateY(0)';
      toast.style.opacity = '1';
    }, 10);

    // Remove after duration
    setTimeout(() => {
      toast.style.transform = 'translateY(100%)';
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  /**
   * Create a skeleton loader
   */
  function createSkeleton(type = 'card') {
    if (type === 'card') {
      return createElement('div', { className: 'modern-wine-card' }, [
        createElement('div', { 
          className: 'modern-wine-image modern-skeleton',
          style: 'height: 200px;'
        }),
        createElement('div', { className: 'modern-wine-content' }, [
          createElement('div', { className: 'modern-skeleton modern-skeleton-title' }),
          createElement('div', { 
            className: 'modern-skeleton modern-skeleton-text',
            style: 'width: 70%;'
          }),
          createElement('div', { style: 'height: 1rem;' }),
          createElement('div', { className: 'modern-skeleton modern-skeleton-text' })
        ])
      ]);
    }
    
    return createElement('div', { 
      className: `modern-skeleton modern-skeleton-${type}` 
    });
  }

  /**
   * Create interactive rating input
   */
  function createRatingInput(name, value = 0, onChange) {
    const stars = [];
    
    for (let i = 1; i <= 5; i++) {
      const star = createElement('i', {
        className: i <= value ? 'fas fa-star modern-rating-star filled' : 'far fa-star modern-rating-star',
        dataset: { value: i }
      });
      
      star.addEventListener('click', () => {
        // Update all stars
        stars.forEach((s, idx) => {
          if (idx < i) {
            s.className = 'fas fa-star modern-rating-star filled';
          } else {
            s.className = 'far fa-star modern-rating-star';
          }
        });
        
        if (onChange) onChange(i);
      });
      
      // Hover effect
      star.addEventListener('mouseenter', () => {
        stars.forEach((s, idx) => {
          if (idx < i) {
            s.style.color = 'var(--modern-warning)';
          }
        });
      });
      
      stars.push(star);
    }
    
    const container = createElement('div', {
      className: 'modern-rating-input',
      dataset: { rating: name }
    }, [
      createElement('div', { 
        className: 'modern-rating-stars',
        onmouseleave: () => {
          stars.forEach(s => s.style.color = '');
        }
      }, stars)
    ]);
    
    return container;
  }

  /**
   * Helper functions
   */
  function getWineColor(type) {
    const colors = {
      'Red': '#8B0000',
      'White': '#F4E04D',
      'Rosé': '#FFB6C1',
      'Sparkling': '#FFD700',
      'Dessert': '#8B4513',
      'Fortified': '#4B0082'
    };
    return colors[type] || '#8B0000';
  }

  function getWineColorLight(type) {
    const colors = {
      'Red': '#CD5C5C',
      'White': '#FFFACD',
      'Rosé': '#FFC0CB',
      'Sparkling': '#FFFFE0',
      'Dessert': '#D2691E',
      'Fortified': '#6A5ACD'
    };
    return colors[type] || '#CD5C5C';
  }

  /**
   * Initialize modern UI enhancements
   */
  function init() {
    console.log('Initializing Modern UI Components...');
    
    // Add modern styles to document if not already present
    if (!document.querySelector('link[href*="styles-modern-components.css"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'styles-modern-components.css';
      document.head.appendChild(link);
    }
    
    // Enhance existing UI elements
    enhanceExistingUI();
  }

  /**
   * Enhance existing UI elements with modern styles
   */
  function enhanceExistingUI() {
    // Enhance existing wine cards
    const existingCards = document.querySelectorAll('.wine-card:not(.modern-wine-card)');
    existingCards.forEach(card => {
      card.classList.add('modern-enhanced');
    });
    
    // Enhance buttons
    const buttons = document.querySelectorAll('.btn:not(.modern-btn)');
    buttons.forEach(btn => {
      if (btn.classList.contains('primary')) {
        btn.classList.add('modern-btn');
      } else if (btn.classList.contains('secondary')) {
        btn.classList.add('modern-btn', 'modern-btn-secondary');
      }
    });
    
    // Enhance form inputs
    const inputs = document.querySelectorAll('input[type="text"], input[type="email"], input[type="number"]');
    inputs.forEach(input => {
      if (!input.classList.contains('modern-input')) {
        input.classList.add('modern-input');
      }
    });
    
    // Enhance selects
    const selects = document.querySelectorAll('select');
    selects.forEach(select => {
      if (!select.parentElement.classList.contains('modern-select')) {
        const wrapper = document.createElement('div');
        wrapper.className = 'modern-select';
        select.parentNode.insertBefore(wrapper, select);
        wrapper.appendChild(select);
      }
    });
  }

  // Public API
  return {
    init,
    createWineCard,
    createStatCard,
    createSearchBox,
    createSelect,
    createEmptyState,
    createRatingDisplay,
    createRatingInput,
    createSkeleton,
    showToast,
    enhanceExistingUI
  };
})();

// Register module
WineRater.Core.registerModule('ModernUI', WineRater.ModernUI);