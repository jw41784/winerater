/**
 * Background Circles Component
 * Inspired by shadcn and 21st.dev
 */

const BackgroundCircles = {
  // Initialize the background circles
  init: function() {
    // Create background circles container if it doesn't exist
    this.createBackgroundCircles();

    // Add parallax effect
    this.setupParallaxEffect();

    // Add color adjustments based on page content
    this.setupColorAdjustment();
    
    console.log('Background circles initialized');
  },

  // Create the background circles DOM elements
  createBackgroundCircles: function() {
    // Check if container already exists
    if (document.querySelector('.background-circles-container')) {
      return;
    }

    // Create container
    const container = document.createElement('div');
    container.className = 'background-circles-container';

    // Create circles wrapper
    const circlesWrapper = document.createElement('div');
    circlesWrapper.className = 'background-circles';

    // Create individual circles
    for (let i = 0; i < 4; i++) {
      const circle = document.createElement('div');
      circle.className = 'background-circle';
      circlesWrapper.appendChild(circle);
    }

    // Add to container and then to body
    container.appendChild(circlesWrapper);
    document.body.appendChild(container);
  },

  // Setup parallax effect for the circles
  setupParallaxEffect: function() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return; // Skip for reduced motion
    }

    // Get all circles
    const circles = document.querySelectorAll('.background-circle');
    if (!circles.length) return;

    // Add mousemove event to document
    document.addEventListener('mousemove', (e) => {
      const mouseX = e.clientX / window.innerWidth;
      const mouseY = e.clientY / window.innerHeight;

      circles.forEach((circle, index) => {
        // Different factors for each circle
        const factorX = (index + 1) * 10;
        const factorY = (index + 1) * 15;
        
        // Calculate new position
        const moveX = (mouseX - 0.5) * factorX;
        const moveY = (mouseY - 0.5) * factorY;
        
        // Apply transform with existing animation
        circle.style.transform = `translate(${moveX}px, ${moveY}px)`;
      });
    });
  },

  // Adjust colors based on the page content
  setupColorAdjustment: function() {
    // Get theme from body or html attribute if available
    const currentTheme = document.body.getAttribute('data-theme') || 
                         document.documentElement.getAttribute('data-theme') || 
                         'light';

    // Apply theme class to container
    const container = document.querySelector('.background-circles-container');
    if (container) {
      container.setAttribute('data-theme', currentTheme);
    }

    // Add visibility transitions
    document.querySelectorAll('.background-circle').forEach(circle => {
      circle.style.transition = 'opacity 0.5s ease, background-color 0.5s ease';
    });

    // Adjust for different views
    document.addEventListener('viewChanged', (e) => {
      const view = e.detail?.view || '';
      
      // Subtle adjustments based on view
      if (view === 'dashboard') {
        this.adjustCirclesForView('dashboard');
      } else if (view === 'add-wine') {
        this.adjustCirclesForView('add-wine');
      } else if (view === 'my-collection') {
        this.adjustCirclesForView('my-collection');
      }
    });
  },

  // Make subtle adjustments to circles for different views
  adjustCirclesForView: function(viewName) {
    const circles = document.querySelectorAll('.background-circle');
    
    if (viewName === 'dashboard') {
      circles.forEach((circle, index) => {
        if (index === 2) {
          circle.style.opacity = '0.8';
          circle.style.backgroundColor = 'var(--wine-gold)';
        }
      });
    } else if (viewName === 'add-wine') {
      circles.forEach((circle, index) => {
        if (index === 0 || index === 1) {
          circle.style.opacity = '0.7';
          circle.style.backgroundColor = 'var(--wine-red)';
        }
      });
    } else if (viewName === 'my-collection') {
      circles.forEach((circle, index) => {
        if (index === 3) {
          circle.style.opacity = '0.8';
          circle.style.backgroundColor = 'var(--wine-red-light)';
        }
      });
    }
  }
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Wait for rest of the UI to initialize
  setTimeout(() => {
    BackgroundCircles.init();
  }, 300);
});