// Override the Google button completely
document.addEventListener('DOMContentLoaded', function() {
    console.log('=== OVERRIDE GOOGLE BUTTON ===');
    
    // Wait for Auth to create the button
    setTimeout(function() {
        // Find the button
        const btn = document.getElementById('google-signin');
        if (btn) {
            console.log('Found button, current content:', btn.innerHTML);
            
            // Clear ALL content
            btn.innerHTML = '';
            
            // Add only text
            btn.appendChild(document.createTextNode('Sign in with Google'));
            
            console.log('Button content replaced with text only');
            
            // Remove any classes that might add icons via CSS
            btn.className = 'social-btn';
            
            // Add inline style to ensure no pseudo-elements
            btn.style.cssText = `
                padding: 12px 24px !important;
                background-color: #4285f4 !important;
                color: white !important;
                border: none !important;
                border-radius: 4px !important;
                font-size: 16px !important;
                cursor: pointer !important;
                font-family: Arial, sans-serif !important;
                display: block !important;
                margin: 0 auto !important;
                width: 100% !important;
                max-width: 250px !important;
            `;
            
            // Also center the parent container
            const socialButtons = document.querySelector('.social-buttons');
            if (socialButtons) {
                socialButtons.style.cssText = `
                    display: flex !important;
                    justify-content: center !important;
                    width: 100% !important;
                `;
            }
            
            // Monitor for any changes
            const observer = new MutationObserver(function(mutations) {
                mutations.forEach(function(mutation) {
                    if (mutation.type === 'childList' && mutation.target === btn) {
                        console.warn('Button content changed! Reverting...');
                        btn.innerHTML = '';
                        btn.appendChild(document.createTextNode('Sign in with Google'));
                    }
                });
            });
            
            observer.observe(btn, { childList: true });
        } else {
            console.error('Google button not found!');
        }
    }, 500);
});