/**
 * WineRater App - Mobile Optimized
 * A professional application for rating and tracking wine experiences on mobile devices
 */

// Main App Controller
const WineRater = {
    // Initialize the application
    init: function() {
        // Set up event listeners
        this.setupEventListeners();
        
        // Load data from localStorage
        this.loadData();
        
        // Update views
        this.updateDashboard();
        this.renderCollection();

        // Check if app is installed (PWA)
        this.checkInstallState();

        // Initialize mobile-specific features
        this.initMobileFeatures();
    },

    // Storage key for app data
    storageKey: 'wineRaterData',
    
    // App state
    data: {
        wines: [], // Array to store wine data
        currentRatings: {
            aroma: 0, 
            taste: 0, 
            body: 0, 
            finish: 0, 
            value: 0
        },
        isInstalled: false
    },

    // Initialize mobile-specific features
    initMobileFeatures: function() {
        // Hide FAB on add wine page
        this.updateFabVisibility();

        // Add class to body to apply mobile-specific CSS
        if (this.isMobileDevice()) {
            document.body.classList.add('mobile-device');
        }

        // Disable pull-to-refresh on mobile browsers 
        document.body.addEventListener('touchmove', function(e) {
            if (document.body.scrollTop === 0) {
                e.preventDefault();
            }
        }, { passive: false });
    },

    // Check if current device is mobile
    isMobileDevice: function() {
        return (window.innerWidth <= 768) || 
               /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    },
    
    // Check if app is installed as PWA
    checkInstallState: function() {
        // Check if app is in standalone mode (installed)
        if (window.matchMedia('(display-mode: standalone)').matches || 
            window.navigator.standalone === true) {
            this.data.isInstalled = true;
            document.body.classList.add('pwa-installed');
        }
    },

    // Update FAB visibility based on current view
    updateFabVisibility: function() {
        const fab = document.getElementById('quick-add-fab');
        const currentView = document.querySelector('.view.active').id;
        
        if (currentView === 'add-wine') {
            fab.style.display = 'none';
        } else {
            fab.style.display = 'flex';
        }
    },
    
    // Setup event listeners
    setupEventListeners: function() {
        // Desktop Navigation
        document.querySelector('.desktop-nav ul').addEventListener('click', (e) => {
            if (e.target.closest('li')) {
                const navItem = e.target.closest('li');
                this.switchView(navItem.dataset.view);
            }
        });

        // Mobile Navigation
        document.querySelector('.mobile-nav ul').addEventListener('click', (e) => {
            if (e.target.closest('li')) {
                const navItem = e.target.closest('li');
                this.switchView(navItem.dataset.view);
            }
        });

        // Floating Action Button
        document.getElementById('quick-add-fab').addEventListener('click', () => {
            this.switchView('add-wine');
        });

        // Add Wine buttons in empty states
        document.querySelectorAll('.add-wine-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.switchView('add-wine');
            });
        });
        
        // Rating stars
        const starRatings = document.querySelectorAll('.star-rating');
        starRatings.forEach(starRating => {
            starRating.addEventListener('click', (e) => {
                if (e.target.tagName === 'I') {
                    const type = e.target.parentElement.dataset.ratingType;
                    const value = parseInt(e.target.dataset.value);
                    this.setRating(type, value);
                }
            });

            // Hover effect on stars (only for non-touch devices)
            if (!('ontouchstart' in window)) {
                starRating.addEventListener('mouseover', (e) => {
                    if (e.target.tagName === 'I') {
                        const value = parseInt(e.target.dataset.value);
                        const stars = e.target.parentElement.children;
                        for (let i = 0; i < stars.length; i++) {
                            if (i < value) {
                                stars[i].classList.add('fas');
                                stars[i].classList.remove('far');
                            } else {
                                stars[i].classList.add('far');
                                stars[i].classList.remove('fas');
                            }
                        }
                    }
                });

                starRating.addEventListener('mouseout', (e) => {
                    const type = e.currentTarget.dataset.ratingType;
                    const value = this.data.currentRatings[type];
                    const stars = e.currentTarget.children;
                    for (let i = 0; i < stars.length; i++) {
                        if (i < value) {
                            stars[i].classList.add('fas');
                            stars[i].classList.remove('far');
                        } else {
                            stars[i].classList.add('far');
                            stars[i].classList.remove('fas');
                        }
                    }
                });
            }
        });
        
        // Wine form submission
        document.getElementById('wine-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveWine();
        });
        
        // Wine form reset
        document.getElementById('wine-form').addEventListener('reset', () => {
            this.resetRatings();
        });
        
        // Image upload preview
        document.getElementById('wine-image').addEventListener('change', (e) => {
            this.handleImageUpload(e);
        });
        
        // Collection search with debounce for mobile performance
        let searchTimeout;
        document.getElementById('collection-search').addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.filterCollection();
            }, 300);
        });
        
        // Collection filters
        document.getElementById('type-filter').addEventListener('change', () => {
            this.filterCollection();
        });
        
        // Collection sorting
        document.getElementById('sort-by').addEventListener('change', () => {
            this.filterCollection();
        });
        
        // Wine card click for details with better mobile touch handling
        const addClickListener = (elementId) => {
            document.getElementById(elementId).addEventListener('click', (e) => {
                const wineCard = e.target.closest('.wine-card');
                if (wineCard) {
                    // Add a visual feedback for touch
                    wineCard.classList.add('tapped');
                    setTimeout(() => {
                        wineCard.classList.remove('tapped');
                        this.openWineDetails(wineCard.dataset.id);
                    }, 150);
                }
            });
        };
        
        addClickListener('collection-list');
        addClickListener('top-wines-list');
        addClickListener('recent-wines-list');
        
        // Close modal with better touch handling
        document.querySelector('.close-modal').addEventListener('click', () => {
            this.closeWineDetails();
        });
        
        // Click outside to close modal
        document.getElementById('wine-details-modal').addEventListener('click', (e) => {
            if (e.target === document.getElementById('wine-details-modal')) {
                this.closeWineDetails();
            }
        });
        
        // Keyboard escape to close modal (for desktop)
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeWineDetails();
            }
        });

        // Handle orientation change for mobile
        window.addEventListener('orientationchange', () => {
            // Slight delay to ensure rendering completes
            setTimeout(() => {
                this.adjustLayoutForOrientation();
            }, 100);
        });

        // Handle back button on Android
        window.addEventListener('popstate', (e) => {
            // Prevent default back behavior if modal is open
            if (document.getElementById('wine-details-modal').classList.contains('open')) {
                e.preventDefault();
                history.pushState(null, document.title, window.location.href);
                this.closeWineDetails();
                return;
            }
        });
    },
    
    // Adjust layout for orientation changes
    adjustLayoutForOrientation: function() {
        const isLandscape = window.innerWidth > window.innerHeight;
        
        if (isLandscape) {
            document.body.classList.add('landscape');
            document.body.classList.remove('portrait');
        } else {
            document.body.classList.add('portrait');
            document.body.classList.remove('landscape');
        }
    },
    
    // Switch between views
    switchView: function(view) {
        // Update active navigation for both desktop and mobile
        document.querySelectorAll('nav li').forEach(li => {
            li.classList.remove('active');
        });
        document.querySelectorAll(`nav li[data-view="${view}"]`).forEach(li => {
            li.classList.add('active');
        });
        
        // Update active view
        document.querySelectorAll('.view').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(view).classList.add('active');

        // Update FAB visibility
        this.updateFabVisibility();

        // Scroll to top on view change
        window.scrollTo(0, 0);
    },
    
    // Handle star ratings
    setRating: function(type, value) {
        // Update data
        this.data.currentRatings[type] = value;
        
        // Update UI
        const stars = document.querySelector(`.star-rating[data-rating-type="${type}"]`).children;
        for (let i = 0; i < stars.length; i++) {
            if (i < value) {
                stars[i].className = 'fas fa-star';
            } else {
                stars[i].className = 'far fa-star';
            }
        }

        // Provide haptic feedback on mobile devices
        if ('vibrate' in navigator) {
            navigator.vibrate(50); // Light vibration
        }
        
        // Update overall rating
        this.updateOverallRating();
    },
    
    // Reset all ratings
    resetRatings: function() {
        const ratingTypes = ['aroma', 'taste', 'body', 'finish', 'value'];
        ratingTypes.forEach(type => {
            this.data.currentRatings[type] = 0;
            
            const stars = document.querySelector(`.star-rating[data-rating-type="${type}"]`).children;
            for (let star of stars) {
                star.className = 'far fa-star';
            }
        });
        
        // Reset image preview
        document.getElementById('image-preview').classList.add('hidden');
        document.getElementById('image-preview').innerHTML = '';
        
        // Reset overall rating
        this.updateOverallRating();
    },
    
    // Calculate and update overall rating
    updateOverallRating: function() {
        const ratings = this.data.currentRatings;
        let sum = 0;
        let count = 0;
        
        for (const key in ratings) {
            if (ratings[key] > 0) {
                sum += ratings[key];
                count++;
            }
        }
        
        const overallRating = count > 0 ? (sum / count).toFixed(1) : '0.0';
        document.getElementById('overall-rating-display').textContent = overallRating;
    },
    
    // Handle image upload
    handleImageUpload: function(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        // Show loading indicator
        const imagePreview = document.getElementById('image-preview');
        imagePreview.innerHTML = `<div class="loading-spinner"></div>`;
        imagePreview.classList.remove('hidden');
        
        const reader = new FileReader();
        
        reader.onload = function(e) {
            // Optimize image for storage
            this.resizeImage(e.target.result, (resizedImage) => {
                imagePreview.innerHTML = `<img src="${resizedImage}" alt="Wine Label">`;
            });
        }.bind(this);
        
        reader.readAsDataURL(file);
    },

    // Resize image to optimize storage
    resizeImage: function(dataUrl, callback) {
        const img = new Image();
        img.onload = function() {
            // Target dimensions for mobile storage optimization
            const maxWidth = 800;
            const maxHeight = 800;
            
            let width = img.width;
            let height = img.height;
            
            // Calculate new dimensions
            if (width > height) {
                if (width > maxWidth) {
                    height *= maxWidth / width;
                    width = maxWidth;
                }
            } else {
                if (height > maxHeight) {
                    width *= maxHeight / height;
                    height = maxHeight;
                }
            }
            
            // Create canvas for resizing
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            
            // Draw resized image to canvas
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            
            // Get resized image as data URL
            const resizedImage = canvas.toDataURL('image/jpeg', 0.85);
            callback(resizedImage);
        };
        img.src = dataUrl;
    },
    
    // Display toast notification
    showToast: function(message, type = 'success') {
        const toastContainer = document.getElementById('toast-container');
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icon = type === 'success' ? 'check-circle' : 'exclamation-circle';
        toast.innerHTML = `<i class="fas fa-${icon}"></i><span>${message}</span>`;
        
        toastContainer.appendChild(toast);
        
        // Provide haptic feedback on mobile
        if ('vibrate' in navigator) {
            navigator.vibrate(type === 'success' ? 100 : 200);
        }
        
        // Remove toast after 3 seconds
        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 2700);
    },
    
    // Save wine data
    saveWine: function() {
        // Generate a unique ID
        const id = Date.now().toString();
        
        // Get form data
        const name = document.getElementById('wine-name').value;
        const winery = document.getElementById('wine-winery').value;
        const vintage = document.getElementById('wine-vintage').value;
        const type = document.getElementById('wine-type').value;
        const varietal = document.getElementById('wine-varietal').value;
        const region = document.getElementById('wine-region').value;
        const country = document.getElementById('wine-country').value;
        const price = document.getElementById('wine-price').value;
        const notes = document.getElementById('wine-notes').value;
        
        // Get image if available
        let imageData = null;
        const imagePreview = document.getElementById('image-preview');
        if (!imagePreview.classList.contains('hidden') && imagePreview.querySelector('img')) {
            imageData = imagePreview.querySelector('img').src;
        }
        
        // Calculate overall rating
        const ratings = this.data.currentRatings;
        let sum = 0;
        let count = 0;
        
        for (const key in ratings) {
            if (ratings[key] > 0) {
                sum += ratings[key];
                count++;
            }
        }
        
        const overallRating = count > 0 ? (sum / count) : 0;
        
        // Create wine object
        const wine = {
            id,
            name,
            winery,
            vintage,
            type,
            varietal,
            region,
            country,
            price,
            notes,
            imageData,
            ratings: { ...this.data.currentRatings },
            overallRating,
            dateAdded: new Date().toISOString()
        };
        
        // Add to data
        this.data.wines.push(wine);
        
        // Save to localStorage
        this.saveData();
        
        // Reset form
        document.getElementById('wine-form').reset();
        this.resetRatings();
        
        // Update views
        this.updateDashboard();
        this.renderCollection();
        
        // Show success toast
        this.showToast('Wine saved successfully!', 'success');
        
        // Switch to collection view
        this.switchView('my-collection');
    },
    
    // Update dashboard
    updateDashboard: function() {
        const wines = this.data.wines;
        
        // Update stats
        document.getElementById('total-wines').textContent = wines.length;
        
        // Calculate average rating
        let totalRating = 0;
        let totalRated = 0;
        
        for (const wine of wines) {
            if (wine.overallRating > 0) {
                totalRating += wine.overallRating;
                totalRated++;
            }
        }
        
        const avgRating = totalRated > 0 ? (totalRating / totalRated).toFixed(1) : '0.0';
        document.getElementById('avg-rating').textContent = avgRating;
        
        // Find top varietal
        const varietalCounts = {};
        for (const wine of wines) {
            if (wine.varietal) {
                varietalCounts[wine.varietal] = (varietalCounts[wine.varietal] || 0) + 1;
            }
        }
        
        let topVarietal = 'None';
        let maxCount = 0;
        
        for (const varietal in varietalCounts) {
            if (varietalCounts[varietal] > maxCount) {
                maxCount = varietalCounts[varietal];
                topVarietal = varietal;
            }
        }
        
        document.getElementById('top-variety').textContent = topVarietal;
        
        // Find top region
        const regionCounts = {};
        for (const wine of wines) {
            if (wine.region) {
                regionCounts[wine.region] = (regionCounts[wine.region] || 0) + 1;
            }
        }
        
        let topRegion = 'None';
        maxCount = 0;
        
        for (const region in regionCounts) {
            if (regionCounts[region] > maxCount) {
                maxCount = regionCounts[region];
                topRegion = region;
            }
        }
        
        document.getElementById('top-region').textContent = topRegion;
        
        // Render top wines
        const topWines = [...wines]
            .filter(wine => wine.overallRating > 0)
            .sort((a, b) => b.overallRating - a.overallRating)
            .slice(0, 3);
            
        this.renderWineCards(topWines, 'top-wines-list');
        
        // Show/hide empty state for top wines
        if (topWines.length === 0) {
            document.getElementById('empty-top-wines').style.display = 'block';
        } else {
            document.getElementById('empty-top-wines').style.display = 'none';
        }
        
        // Render recent wines
        const recentWines = [...wines]
            .sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded))
            .slice(0, 3);
            
        this.renderWineCards(recentWines, 'recent-wines-list');
        
        // Show/hide empty state for recent wines
        if (recentWines.length === 0) {
            document.getElementById('empty-recent-wines').style.display = 'block';
        } else {
            document.getElementById('empty-recent-wines').style.display = 'none';
        }
    },
    
    // Render wine collection
    renderCollection: function() {
        this.filterCollection();
    },
    
    // Filter and sort collection
    filterCollection: function() {
        let wines = [...this.data.wines];
        
        // Apply search filter
        const searchTerm = document.getElementById('collection-search').value.toLowerCase();
        if (searchTerm) {
            wines = wines.filter(wine => 
                wine.name.toLowerCase().includes(searchTerm) || 
                wine.winery.toLowerCase().includes(searchTerm) ||
                wine.varietal.toLowerCase().includes(searchTerm) ||
                wine.region.toLowerCase().includes(searchTerm) ||
                wine.country.toLowerCase().includes(searchTerm)
            );
        }
        
        // Apply type filter
        const typeFilter = document.getElementById('type-filter').value;
        if (typeFilter !== 'all') {
            wines = wines.filter(wine => wine.type === typeFilter);
        }
        
        // Apply sorting
        const sortBy = document.getElementById('sort-by').value;
        
        switch (sortBy) {
            case 'date':
                wines.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
                break;
            case 'rating':
                wines.sort((a, b) => b.overallRating - a.overallRating);
                break;
            case 'name':
                wines.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'vintage':
                wines.sort((a, b) => b.vintage - a.vintage);
                break;
            case 'price':
                wines.sort((a, b) => a.price - b.price);
                break;
        }
        
        // Render filtered wines
        this.renderWineCards(wines, 'collection-list');
        
        // Show/hide empty state
        if (wines.length === 0 && this.data.wines.length === 0) {
            document.getElementById('empty-collection').style.display = 'block';
        } else if (wines.length === 0 && this.data.wines.length > 0) {
            document.getElementById('empty-collection').style.display = 'block';
            document.getElementById('empty-collection').innerHTML = `
                <i class="fas fa-search"></i>
                <h3>No matching wines</h3>
                <p>Try adjusting your filters</p>
                <button class="btn secondary" onclick="document.getElementById('collection-search').value = ''; document.getElementById('type-filter').value = 'all'; WineRater.filterCollection();">Clear Filters</button>
            `;
        } else {
            document.getElementById('empty-collection').style.display = 'none';
        }
    },
    
    // Render wine cards
    renderWineCards: function(wines, containerId) {
        const container = document.getElementById(containerId);
        // Clear container but keep empty state div
        const emptyState = container.querySelector('.empty-collection');
        container.innerHTML = '';
        if (emptyState) {
            container.appendChild(emptyState);
        }
        
        if (wines.length === 0) {
            return;
        }
        
        for (const wine of wines) {
            const wineCard = document.createElement('div');
            wineCard.className = 'wine-card';
            wineCard.dataset.id = wine.id;
            
            const wineImage = wine.imageData ? 
                `<img src="${wine.imageData}" alt="${wine.name}">` : 
                `<div class="wine-placeholder" style="height: 100%; display: flex; align-items: center; justify-content: center;"><i class="fas fa-wine-bottle" style="font-size: 2.5rem; color: rgba(255,255,255,0.3);"></i></div>`;
                
            const ratingStars = this.generateStarRating(wine.overallRating);
            
            wineCard.innerHTML = `
                <div class="wine-card-image">
                    ${wineImage}
                    <span class="wine-type">${wine.type}</span>
                </div>
                <div class="wine-card-content">
                    <h3 class="wine-card-title">${wine.name}</h3>
                    <p class="wine-card-winery">${wine.winery}, ${wine.vintage}</p>
                    <div class="wine-card-rating">
                        <span class="stars">${ratingStars}</span>
                        <span>${wine.overallRating.toFixed(1)}</span>
                    </div>
                </div>
            `;
            
            container.appendChild(wineCard);
        }
    },
    
    // Generate star rating HTML
    generateStarRating: function(rating) {
        const fullStars = Math.floor(rating);
        const halfStar = rating % 1 >= 0.5 ? 1 : 0;
        const emptyStars = 5 - fullStars - halfStar;
        
        let starsHtml = '';
        
        for (let i = 0; i < fullStars; i++) {
            starsHtml += '<i class="fas fa-star"></i>';
        }
        
        if (halfStar) {
            starsHtml += '<i class="fas fa-star-half-alt"></i>';
        }
        
        for (let i = 0; i < emptyStars; i++) {
            starsHtml += '<i class="far fa-star"></i>';
        }
        
        return starsHtml;
    },
    
    // Format date for display
    formatDate: function(dateString) {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    },
    
    // Format price for display
    formatPrice: function(price) {
        return '$' + parseFloat(price).toFixed(2);
    },
    
    // Open wine details modal
    openWineDetails: function(wineId) {
        const wine = this.data.wines.find(wine => wine.id === wineId);
        if (!wine) return;
        
        const modal = document.getElementById('wine-details-modal');
        const content = document.getElementById('wine-details-content');
        
        const wineImage = wine.imageData ? 
            `<img src="${wine.imageData}" alt="${wine.name}">` : 
            `<div class="wine-placeholder" style="height: 100%; display: flex; align-items: center; justify-content: center; background-color: #f5f5f5;"><i class="fas fa-wine-bottle" style="font-size: 4rem; color: rgba(0,0,0,0.1);"></i></div>`;
            
        const ratingStars = this.generateStarRating(wine.overallRating);
        const dateAdded = this.formatDate(wine.dateAdded);
        const formattedPrice = this.formatPrice(wine.price);
        
        content.innerHTML = `
            <div class="wine-details">
                <div class="wine-image-large">
                    ${wineImage}
                </div>
                <div class="wine-info">
                    <h2>${wine.name} <span class="vintage">${wine.vintage}</span></h2>
                    <p class="wine-meta">${wine.winery} | ${wine.varietal} | ${wine.type}</p>
                    <p><i class="fas fa-map-marker-alt"></i> ${wine.region}, ${wine.country}</p>
                    <p><i class="fas fa-tag"></i> ${formattedPrice}</p>
                    <p><i class="fas fa-calendar-alt"></i> Added on ${dateAdded}</p>
                    
                    <div class="wine-overall-rating">
                        <h3>Overall Rating: ${wine.overallRating.toFixed(1)}</h3>
                        <div class="stars large-stars">${ratingStars}</div>
                    </div>
                    
                    <div class="wine-ratings">
                        <div class="wine-rating-item">
                            <div class="rating-label">Aroma</div>
                            <div class="rating-value">${wine.ratings.aroma}</div>
                        </div>
                        <div class="wine-rating-item">
                            <div class="rating-label">Taste</div>
                            <div class="rating-value">${wine.ratings.taste}</div>
                        </div>
                        <div class="wine-rating-item">
                            <div class="rating-label">Body</div>
                            <div class="rating-value">${wine.ratings.body}</div>
                        </div>
                        <div class="wine-rating-item">
                            <div class="rating-label">Finish</div>
                            <div class="rating-value">${wine.ratings.finish}</div>
                        </div>
                        <div class="wine-rating-item">
                            <div class="rating-label">Value</div>
                            <div class="rating-value">${wine.ratings.value}</div>
                        </div>
                    </div>
                    
                    <div class="wine-tasting-notes">
                        <h3>Tasting Notes</h3>
                        <p>${wine.notes || 'No tasting notes provided.'}</p>
                    </div>
                    
                    <div class="wine-actions">
                        <button class="delete-btn" onclick="WineRater.deleteWine('${wine.id}')">
                            <i class="fas fa-trash-alt"></i> Delete Wine
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Push state to handle back button on modal
        history.pushState({modal: 'open'}, document.title, window.location.href);
        
        modal.classList.add('open');
    },
    
    // Close wine details modal
    closeWineDetails: function() {
        const modal = document.getElementById('wine-details-modal');
        modal.classList.remove('open');
    },
    
    // Delete a wine
    deleteWine: function(wineId) {
        const confirmDelete = confirm('Are you sure you want to delete this wine?');
        
        if (confirmDelete) {
            this.data.wines = this.data.wines.filter(wine => wine.id !== wineId);
            this.saveData();
            this.closeWineDetails();
            this.updateDashboard();
            this.renderCollection();
            this.showToast('Wine deleted successfully', 'success');
            
            // Provide haptic feedback on mobile
            if ('vibrate' in navigator) {
                navigator.vibrate([100, 50, 100]);
            }
        }
    },
    
    // Load data from localStorage
    loadData: function() {
        const storedData = localStorage.getItem(this.storageKey);
        if (storedData) {
            this.data.wines = JSON.parse(storedData);
        }
    },
    
    // Save data to localStorage
    saveData: function() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.data.wines));
        } catch (e) {
            // Handle storage quota exceeded
            if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
                this.showToast('Storage limit reached. Try deleting some wines with images.', 'error');
                console.error('LocalStorage quota exceeded:', e);
            } else {
                throw e;
            }
        }
    }
};

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    WineRater.init();
});