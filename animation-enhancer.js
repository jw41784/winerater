/**
 * Animation Enhancer for WineRater
 * Provides staggered animations and UI enhancements
 */

const AnimationEnhancer = {
    // Initialize animations
    init: function() {
        // Add animation delay to elements
        this.setupStaggeredAnimations();
        
        // Set up scroll animations
        this.setupScrollAnimations();
        
        // Enhance form feedback
        this.enhanceFormFeedback();
        
        // Console welcome message
        console.log(
            '%cWineRater',
            'font-size: 20px; font-weight: bold; color: #8B0000;',
            '- Your personal wine journal'
        );
    },
    
    // Add staggered animations to cards and other elements
    setupStaggeredAnimations: function() {
        // Add increasing delay to wine cards 
        document.querySelectorAll('.wine-card').forEach((card, index) => {
            card.style.animationDelay = `${index * 0.05}s`;
        });
        
        // Add increasing delay to stat cards
        document.querySelectorAll('.stat-card').forEach((card, index) => {
            card.style.transitionDelay = `${index * 0.1}s`;
            setTimeout(() => {
                card.classList.add('shown');
            }, 100);
        });
    },
    
    // Setup scroll animations for elements
    setupScrollAnimations: function() {
        // Simple function to detect if element is in viewport
        const isInViewport = (elem) => {
            const rect = elem.getBoundingClientRect();
            return (
                rect.top <= (window.innerHeight || document.documentElement.clientHeight) &&
                rect.bottom >= 0
            );
        };
        
        // Elements to animate on scroll
        const animateElements = document.querySelectorAll('.top-wines, .recent-wines, .section-header');
        
        // Add scroll listener
        if (animateElements.length > 0) {
            const checkIfInView = () => {
                animateElements.forEach(elem => {
                    if (isInViewport(elem) && !elem.classList.contains('has-animated')) {
                        elem.classList.add('has-animated');
                        elem.style.opacity = '1';
                        elem.style.transform = 'translateY(0)';
                    }
                });
            };
            
            // Set initial state
            animateElements.forEach(elem => {
                elem.style.opacity = '0';
                elem.style.transform = 'translateY(20px)';
                elem.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            });
            
            // Add listener and trigger initial check
            window.addEventListener('scroll', checkIfInView);
            checkIfInView();
        }
    },
    
    // Enhance form interactions 
    enhanceFormFeedback: function() {
        // Add focus and blur effects to form inputs
        const inputs = document.querySelectorAll('input, select, textarea');
        
        inputs.forEach(input => {
            // Add focused class to parent on focus
            input.addEventListener('focus', () => {
                input.parentElement.classList.add('focused');
            });
            
            // Remove focused class from parent on blur
            input.addEventListener('blur', () => {
                input.parentElement.classList.remove('focused');
            });
            
            // Check if input has value on load
            if (input.value) {
                input.parentElement.classList.add('has-value');
            }
            
            // Add/remove has-value class when input value changes
            input.addEventListener('input', () => {
                if (input.value) {
                    input.parentElement.classList.add('has-value');
                } else {
                    input.parentElement.classList.remove('has-value');
                }
            });
        });
        
        // Enhance star rating interactions
        const starRatings = document.querySelectorAll('.star-rating');
        
        starRatings.forEach(starRating => {
            const stars = Array.from(starRating.children);
            
            // Add hover effect
            stars.forEach((star, index) => {
                star.addEventListener('mouseenter', () => {
                    // Highlight stars up to the hovered one
                    stars.forEach((s, i) => {
                        if (i <= index) {
                            s.classList.add('hover');
                        } else {
                            s.classList.remove('hover');
                        }
                    });
                });
            });
            
            // Remove hover effect when leaving the container
            starRating.addEventListener('mouseleave', () => {
                stars.forEach(s => {
                    s.classList.remove('hover');
                });
            });
        });
    }
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Wait a bit for the UI to stabilize before enhancing it
    setTimeout(() => {
        AnimationEnhancer.init();
    }, 100);
});