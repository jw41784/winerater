// This script removes any floating Google icons that appear on the page
// Add this to your index.html after all other scripts

document.addEventListener('DOMContentLoaded', function() {
    // Function to remove floating Google icons
    function removeFloatingGoogleIcons() {
        // Find all Google icons
        const googleIcons = document.querySelectorAll('i.fa-google, i.fab.fa-google');
        
        googleIcons.forEach(icon => {
            // Check if icon is inside the button (where it should be)
            const button = icon.closest('#google-signin');
            if (!button) {
                // This icon is not inside the Google sign-in button, remove it
                console.log('Removing floating Google icon:', icon);
                icon.remove();
            }
        });
    }
    
    // Run immediately
    removeFloatingGoogleIcons();
    
    // Run again after a short delay to catch any dynamically added icons
    setTimeout(removeFloatingGoogleIcons, 100);
    setTimeout(removeFloatingGoogleIcons, 500);
    
    // Watch for any new icons being added
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.addedNodes.length) {
                removeFloatingGoogleIcons();
            }
        });
    });
    
    // Start observing
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
});

// Also add CSS to hide any floating Google icons
const style = document.createElement('style');
style.textContent = `
    /* Hide any Google icons that are not inside the button */
    i.fa-google:not(#google-signin i),
    i.fab.fa-google:not(#google-signin i) {
        display: none !important;
    }
`;
document.head.appendChild(style);