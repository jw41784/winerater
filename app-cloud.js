/**
 * WineRater App - Cloud Version
 * Enhanced application for rating and tracking wine experiences with Firebase integration
 */

// Main App Controller
const WineRater = {
    // Initialize the application
    init: function() {
        // Set up event listeners
        this.setupEventListeners();
        
        // Load data from localStorage initially
        // (will be updated with cloud data when user authenticates)
        this.loadData();
        
        // Set up toast notifications container
        this.setupToastContainer();
        
        // Update views
        this.updateDashboard();
        this.renderCollection();
        
        // Update last sync time display
        this.updateLastSyncTimeDisplay();
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
        }
    },
    
    // Setup event listeners
    setupEventListeners: function() {
        // Desktop Navigation
        const desktopNav = document.querySelector('.desktop-nav ul');
        if (desktopNav) {
            desktopNav.addEventListener('click', (e) => {
                if (e.target.tagName === 'LI') {
                    this.switchView(e.target.dataset.view);
                }
            });
        }
        
        // Mobile Navigation
        const mobileNav = document.querySelector('.mobile-nav ul');
        if (mobileNav) {
            mobileNav.addEventListener('click', (e) => {
                const li = e.target.closest('li');
                if (li) {
                    this.switchView(li.dataset.view);
                }
            });
        }
        
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
        });
        
        // Wine form submission
        const wineForm = document.getElementById('wine-form');
        if (wineForm) {
            wineForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveWine();
            });
            
            // Wine form reset
            wineForm.addEventListener('reset', () => {
                this.resetRatings();
            });
        }
        
        // Image upload preview
        const wineImage = document.getElementById('wine-image');
        if (wineImage) {
            wineImage.addEventListener('change', (e) => {
                this.handleImageUpload(e);
            });
        }
        
        // Collection search
        const collectionSearch = document.getElementById('collection-search');
        if (collectionSearch) {
            collectionSearch.addEventListener('input', () => {
                this.filterCollection();
            });
        }
        
        // Collection filters
        const typeFilter = document.getElementById('type-filter');
        if (typeFilter) {
            typeFilter.addEventListener('change', () => {
                this.filterCollection();
            });
        }
        
        // Collection sorting
        const sortBy = document.getElementById('sort-by');
        if (sortBy) {
            sortBy.addEventListener('change', () => {
                this.filterCollection();
            });
        }
        
        // Collection wine cards
        ['collection-list', 'top-wines-list', 'recent-wines-list'].forEach(listId => {
            const list = document.getElementById(listId);
            if (list) {
                list.addEventListener('click', (e) => {
                    const wineCard = e.target.closest('.wine-card');
                    if (wineCard) {
                        this.openWineDetails(wineCard.dataset.id);
                    }
                });
            }
        });
        
        // Add Wine buttons in empty states
        document.querySelectorAll('.add-wine-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.switchView('add-wine');
            });
        });
        
        // Floating Action Button
        const fab = document.getElementById('quick-add-fab');
        if (fab) {
            fab.addEventListener('click', () => {
                this.switchView('add-wine');
            });
        }
        
        // Close modal
        const closeModal = document.querySelector('.close-modal');
        if (closeModal) {
            closeModal.addEventListener('click', () => {
                this.closeWineDetails();
            });
        }
        
        // Click outside to close modal
        const wineDetailsModal = document.getElementById('wine-details-modal');
        if (wineDetailsModal) {
            wineDetailsModal.addEventListener('click', (e) => {
                if (e.target === wineDetailsModal) {
                    this.closeWineDetails();
                }
            });
        }
        
        // Keyboard escape to close modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeWineDetails();
            }
        });
        
        // Export data
        const exportData = document.getElementById('export-data');
        if (exportData) {
            exportData.addEventListener('click', () => {
                this.exportAllData();
            });
        }
        
        // Import data
        const importData = document.getElementById('import-data');
        if (importData) {
            importData.addEventListener('click', () => {
                this.showImportDialog();
            });
        }
        
        // Profile form
        const profileForm = document.getElementById('profile-form');
        if (profileForm) {
            profileForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const displayName = document.getElementById('profile-name').value;
                Auth.updateProfile(displayName);
            });
        }
        
        // Password form
        const passwordForm = document.getElementById('password-form');
        if (passwordForm) {
            passwordForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const currentPassword = document.getElementById('current-password').value;
                const newPassword = document.getElementById('new-password').value;
                const confirmPassword = document.getElementById('confirm-password').value;
                
                if (newPassword !== confirmPassword) {
                    this.showToast('New passwords do not match', 'error');
                    return;
                }
                
                Auth.updatePassword(currentPassword, newPassword);
            });
        }
        
        // Delete account
        const deleteAccount = document.getElementById('delete-account');
        if (deleteAccount) {
            deleteAccount.addEventListener('click', () => {
                if (confirm('Are you sure you want to delete your account? This action cannot be undone!')) {
                    Auth.deleteAccount();
                }
            });
        }
    },
    
    // Setup toast container
    setupToastContainer: function() {
        this.toastContainer = document.getElementById('toast-container');
        
        if (!this.toastContainer) {
            this.toastContainer = document.createElement('div');
            this.toastContainer.id = 'toast-container';
            this.toastContainer.className = 'toast-container';
            document.body.appendChild(this.toastContainer);
        }
    },
    
    // Show toast notification
    showToast: function(message, type = 'info') {
        if (!this.toastContainer) {
            this.setupToastContainer();
        }
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        let icon = '';
        switch (type) {
            case 'success':
                icon = '<i class="fas fa-check-circle"></i>';
                break;
            case 'error':
                icon = '<i class="fas fa-exclamation-circle"></i>';
                break;
            case 'warning':
                icon = '<i class="fas fa-exclamation-triangle"></i>';
                break;
            default:
                icon = '<i class="fas fa-info-circle"></i>';
        }
        
        toast.innerHTML = `
            ${icon}
            <span class="toast-message">${message}</span>
            <button class="toast-close"><i class="fas fa-times"></i></button>
        `;
        
        // Add close button functionality
        toast.querySelector('.toast-close').addEventListener('click', () => {
            toast.classList.add('hiding');
            setTimeout(() => {
                this.toastContainer.removeChild(toast);
            }, 300);
        });
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (toast.parentNode === this.toastContainer) {
                toast.classList.add('hiding');
                setTimeout(() => {
                    if (toast.parentNode === this.toastContainer) {
                        this.toastContainer.removeChild(toast);
                    }
                }, 300);
            }
        }, 5000);
        
        this.toastContainer.appendChild(toast);
        
        // Trigger animation
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);
    },
    
    // Show syncing indicator
    showSyncIndicator: function() {
        const syncStatus = document.getElementById('sync-status');
        if (syncStatus) {
            syncStatus.classList.add('active');
        }
    },
    
    // Hide syncing indicator
    hideSyncIndicator: function() {
        const syncStatus = document.getElementById('sync-status');
        if (syncStatus) {
            syncStatus.classList.remove('active');
        }
    },
    
    // Show loading indicator
    showLoading: function(message) {
        const loading = document.getElementById('loading-overlay');
        const loadingMessage = document.getElementById('loading-message');
        
        if (loadingMessage) {
            loadingMessage.textContent = message || 'Loading...';
        }
        
        if (loading) {
            loading.style.display = 'flex';
        }
    },
    
    // Hide loading indicator
    hideLoading: function() {
        const loading = document.getElementById('loading-overlay');
        
        if (loading) {
            loading.style.display = 'none';
        }
    },
    
    // Update last sync time display
    updateLastSyncTimeDisplay: function() {
        const lastSyncDisplay = document.getElementById('last-sync-time');
        if (lastSyncDisplay) {
            const lastSyncTime = CloudStorage.getFormattedLastSyncTime();
            lastSyncDisplay.textContent = lastSyncTime;
        }
    },
    
    // Switch between views
    switchView: function(view) {
        // Update active navigation for desktop
        document.querySelectorAll('.desktop-nav li').forEach(li => {
            li.classList.remove('active');
        });
        const desktopNavItem = document.querySelector(`.desktop-nav li[data-view="${view}"]`);
        if (desktopNavItem) {
            desktopNavItem.classList.add('active');
        }

        // Update active navigation for mobile
        document.querySelectorAll('.mobile-nav li').forEach(li => {
            li.classList.remove('active');
        });
        const mobileNavItem = document.querySelector(`.mobile-nav li[data-view="${view}"]`);
        if (mobileNavItem) {
            mobileNavItem.classList.add('active');
        }

        // Update active view
        document.querySelectorAll('.view').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(view).classList.add('active');

        // Dispatch view change event for other components to react
        const viewChangedEvent = new CustomEvent('viewChanged', {
            detail: { view: view }
        });
        document.dispatchEvent(viewChangedEvent);
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
        
        const reader = new FileReader();
        
        reader.onload = function(e) {
            const imagePreview = document.getElementById('image-preview');
            imagePreview.innerHTML = `<img src="${e.target.result}" alt="Wine Label">`;
            imagePreview.classList.remove('hidden');
        };
        
        reader.readAsDataURL(file);
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
        
        // Save to cloud if authenticated
        if (Auth.isAuthenticated()) {
            this.showSyncIndicator();
            CloudStorage.saveWineToCloud(wine)
                .then(() => {
                    this.hideSyncIndicator();
                    this.updateLastSyncTimeDisplay();
                })
                .catch(error => {
                    console.error("Error saving to cloud:", error);
                    this.hideSyncIndicator();
                    this.showToast('Wine saved locally but sync failed. Will try again later.', 'warning');
                });
        }
        
        // Reset form
        document.getElementById('wine-form').reset();
        this.resetRatings();
        
        // Update views
        this.updateDashboard();
        this.renderCollection();
        
        // Switch to collection view
        this.switchView('my-collection');
        
        // Show success message
        this.showToast('Wine saved successfully!', 'success');
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
        
        const topRegionElement = document.getElementById('top-region');
        if (topRegionElement) {
            topRegionElement.textContent = topRegion;
        }
        
        // Render top wines
        const topWines = [...wines]
            .filter(wine => wine.overallRating > 0)
            .sort((a, b) => b.overallRating - a.overallRating)
            .slice(0, 3);
            
        this.renderWineCards(topWines, 'top-wines-list');
        
        // Show/hide empty state for top wines
        const emptyTopWines = document.getElementById('empty-top-wines');
        if (emptyTopWines) {
            emptyTopWines.style.display = topWines.length > 0 ? 'none' : 'flex';
        }
        
        // Render recent wines
        const recentWines = [...wines]
            .sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded))
            .slice(0, 3);
            
        this.renderWineCards(recentWines, 'recent-wines-list');
        
        // Show/hide empty state for recent wines
        const emptyRecentWines = document.getElementById('empty-recent-wines');
        if (emptyRecentWines) {
            emptyRecentWines.style.display = recentWines.length > 0 ? 'none' : 'flex';
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
                wine.region.toLowerCase().includes(searchTerm)
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
        const emptyCollection = document.getElementById('empty-collection');
        if (emptyCollection) {
            emptyCollection.style.display = wines.length > 0 ? 'none' : 'flex';
        }
    },
    
    // Render wine cards
    renderWineCards: function(wines, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        // Keep empty state element if it exists
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
                `<div class="wine-placeholder"><i class="fas fa-wine-bottle"></i></div>`;
                
            const ratingStars = this.generateStarRating(wine.overallRating);
            
            wineCard.innerHTML = `
                <div class="wine-card-image">
                    ${wineImage}
                    <span class="wine-type">${wine.type}</span>
                </div>
                <div class="wine-card-content">
                    <h3 class="wine-card-title">${wine.name}</h3>
                    <p class="wine-card-winery">${wine.winery}, ${wine.vintage}</p>
                    <p class="wine-card-region">${wine.region}, ${wine.country}</p>
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
    
    // Open wine details modal
    openWineDetails: function(wineId) {
        const wine = this.data.wines.find(wine => wine.id === wineId);
        if (!wine) return;
        
        const modal = document.getElementById('wine-details-modal');
        const content = document.getElementById('wine-details-content');
        
        const wineImage = wine.imageData ? 
            `<img src="${wine.imageData}" alt="${wine.name}">` : 
            `<div class="wine-placeholder"><i class="fas fa-wine-bottle"></i></div>`;
            
        const ratingStars = this.generateStarRating(wine.overallRating);
        
        content.innerHTML = `
            <div class="wine-details">
                <div class="wine-image-large">
                    ${wineImage}
                </div>
                <div class="wine-info">
                    <h2>${wine.name} (${wine.vintage})</h2>
                    <p class="wine-meta">${wine.winery} | ${wine.varietal} | ${wine.type}</p>
                    <p>From: ${wine.region}, ${wine.country}</p>
                    <p>Price: $${parseFloat(wine.price).toFixed(2)}</p>
                    
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
                    
                    <div class="date-added">
                        <p>Added on: ${new Date(wine.dateAdded).toLocaleDateString()}</p>
                    </div>
                    
                    <div class="wine-actions">
                        <button class="btn edit" onclick="WineRater.editWine('${wine.id}')">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn danger" onclick="WineRater.deleteWine('${wine.id}')">
                            <i class="fas fa-trash-alt"></i> Delete
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        modal.classList.add('open');
    },
    
    // Close wine details modal
    closeWineDetails: function() {
        const modal = document.getElementById('wine-details-modal');
        if (modal) {
            modal.classList.remove('open');
        }
    },
    
    // Edit wine function (to be implemented)
    editWine: function(wineId) {
        this.showToast('Editing functionality will be added soon', 'info');
    },
    
    // Delete a wine
    deleteWine: function(wineId) {
        if (confirm('Are you sure you want to delete this wine?')) {
            // Remove from local data
            this.data.wines = this.data.wines.filter(wine => wine.id !== wineId);
            
            // Save to localStorage
            this.saveData();
            
            // Delete from cloud if authenticated
            if (Auth.isAuthenticated()) {
                this.showSyncIndicator();
                CloudStorage.deleteWineFromCloud(wineId)
                    .then(() => {
                        this.hideSyncIndicator();
                        this.updateLastSyncTimeDisplay();
                    })
                    .catch(error => {
                        console.error("Error deleting from cloud:", error);
                        this.hideSyncIndicator();
                        this.showToast('Wine deleted locally but cloud sync failed', 'warning');
                    });
            }
            
            this.closeWineDetails();
            this.updateDashboard();
            this.renderCollection();
            
            this.showToast('Wine deleted successfully', 'success');
        }
    },
    
    // Export all data (for backup)
    exportAllData: function() {
        const dataToExport = {
            wines: this.data.wines,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };
        
        const jsonString = JSON.stringify(dataToExport, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `winerater-backup-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        this.showToast('Data exported successfully', 'success');
    },
    
    // Show import dialog
    showImportDialog: function() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/json';
        
        input.onchange = e => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = event => {
                try {
                    const data = JSON.parse(event.target.result);
                    
                    if (!data.wines || !Array.isArray(data.wines)) {
                        this.showToast('Invalid backup file format', 'error');
                        return;
                    }
                    
                    // Ask for confirmation
                    if (confirm(`Are you sure you want to import ${data.wines.length} wines? This will replace your current collection.`)) {
                        this.data.wines = data.wines;
                        this.saveData();
                        
                        // Sync to cloud if authenticated
                        if (Auth.isAuthenticated()) {
                            this.showSyncIndicator();
                            CloudStorage.syncToCloud()
                                .then(() => {
                                    this.hideSyncIndicator();
                                    this.updateLastSyncTimeDisplay();
                                })
                                .catch(error => {
                                    console.error("Error syncing to cloud:", error);
                                    this.hideSyncIndicator();
                                    this.showToast('Data imported locally but cloud sync failed', 'warning');
                                });
                        }
                        
                        this.updateDashboard();
                        this.renderCollection();
                        this.showToast('Data imported successfully', 'success');
                    }
                } catch (error) {
                    console.error('Error parsing import file:', error);
                    this.showToast('Error parsing import file', 'error');
                }
            };
            reader.readAsText(file);
        };
        
        input.click();
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
        localStorage.setItem(this.storageKey, JSON.stringify(this.data.wines));
    }
};

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    WineRater.init();
});