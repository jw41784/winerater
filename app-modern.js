/**
 * WineRater App - Modern UI Integration
 * Enhanced with modern components
 */

// Initialize Core if not already available
if (!window.WineRater) {
    window.WineRater = {
        Core: {
            utils: {
                generateId: () => Date.now().toString(36) + Math.random().toString(36).substr(2),
                formatCurrency: (amount) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount),
                formatDate: (date) => new Date(date).toLocaleDateString()
            },
            registerModule: () => {}
        }
    };
}

// Main App Controller with Modern UI
const App = {
    // Data
    wines: [],
    currentRatings: {
        aroma: 0,
        taste: 0,
        body: 0,
        finish: 0,
        value: 0
    },
    
    // Initialize app
    init: function() {
        console.log('Initializing WineRater with modern UI...');
        
        // Initialize modern UI components
        if (window.WineRater && window.WineRater.ModernUI) {
            window.WineRater.ModernUI.init();
        }
        
        // Load data
        this.loadData();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Update UI
        this.updateDashboard();
        this.renderCollection();
        
        // Show initial view
        this.switchView('dashboard');
    },
    
    // Setup event listeners
    setupEventListeners: function() {
        // Navigation with modern enhancement
        document.querySelectorAll('nav li').forEach(li => {
            li.addEventListener('click', () => {
                this.switchView(li.dataset.view);
            });
        });
        
        // Mobile navigation
        document.querySelectorAll('.mobile-nav li').forEach(li => {
            li.addEventListener('click', () => {
                this.switchView(li.dataset.view);
            });
        });
        
        // FAB button
        const fab = document.getElementById('quick-add-fab');
        if (fab) {
            fab.addEventListener('click', () => {
                this.switchView('add-wine');
            });
        }
        
        // Wine form with modern inputs
        const wineForm = document.getElementById('wine-form');
        if (wineForm) {
            wineForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveWine();
            });
            
            wineForm.addEventListener('reset', () => {
                this.resetRatings();
                this.resetImageUpload();
            });
        }
        
        // Modern rating inputs
        this.setupModernRatings();
        
        // Search with modern search box
        const searchInput = document.getElementById('collection-search');
        if (searchInput) {
            searchInput.addEventListener('input', () => {
                this.filterCollection();
            });
        }
        
        // Filters
        document.getElementById('type-filter')?.addEventListener('change', () => {
            this.filterCollection();
        });
        
        document.getElementById('sort-by')?.addEventListener('change', () => {
            this.filterCollection();
        });
        
        // Add wine button clicks
        document.querySelectorAll('.add-wine-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.switchView('add-wine');
            });
        });
        
        // Export buttons
        document.getElementById('export-csv-btn')?.addEventListener('click', () => {
            this.exportToCSV();
        });
        
        document.getElementById('export-pdf-btn')?.addEventListener('click', () => {
            this.exportToPDF();
        });
    },
    
    // Setup modern rating inputs
    setupModernRatings: function() {
        const ratingTypes = ['aroma', 'taste', 'body', 'finish', 'value'];
        
        ratingTypes.forEach(type => {
            const container = document.querySelector(`[data-rating-type="${type}"]`);
            if (container && window.WineRater?.ModernUI) {
                // Replace with modern rating input
                const modernRating = window.WineRater.ModernUI.createRatingInput(
                    type,
                    this.currentRatings[type],
                    (value) => {
                        this.currentRatings[type] = value;
                        this.updateOverallRating();
                    }
                );
                container.replaceWith(modernRating);
            }
        });
    },
    
    // Update dashboard with modern stat cards
    updateDashboard: function() {
        const stats = this.calculateStats();
        
        // Update stat values
        document.getElementById('total-wines').textContent = stats.totalWines;
        document.getElementById('avg-rating').textContent = stats.avgRating.toFixed(1);
        document.getElementById('top-variety').textContent = stats.topVariety || 'None';
        document.getElementById('top-region').textContent = stats.topRegion || 'None';
        
        // Update recent wines with modern cards
        this.updateRecentWines();
        
        // Update top wines with modern cards
        this.updateTopWines();
    },
    
    // Update recent wines section
    updateRecentWines: function() {
        const container = document.getElementById('recent-wines-list');
        const emptyState = document.getElementById('empty-recent-wines');
        
        if (this.wines.length === 0) {
            container.style.display = 'none';
            emptyState.style.display = 'block';
        } else {
            container.style.display = 'grid';
            emptyState.style.display = 'none';
            
            // Clear container
            container.innerHTML = '';
            
            // Get recent wines
            const recentWines = [...this.wines]
                .sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded))
                .slice(0, 3);
            
            // Add modern wine cards
            recentWines.forEach(wine => {
                if (window.WineRater?.ModernUI) {
                    const card = window.WineRater.ModernUI.createWineCard(wine);
                    card.addEventListener('click', () => this.openWineDetails(wine.id));
                    container.appendChild(card);
                } else {
                    container.appendChild(this.createWineCard(wine));
                }
            });
        }
    },
    
    // Update top wines section
    updateTopWines: function() {
        const container = document.getElementById('top-wines-list');
        const emptyState = document.getElementById('empty-top-wines');
        
        const ratedWines = this.wines.filter(w => w.overallRating > 0);
        
        if (ratedWines.length === 0) {
            container.style.display = 'none';
            emptyState.style.display = 'block';
        } else {
            container.style.display = 'grid';
            emptyState.style.display = 'none';
            
            // Clear container
            container.innerHTML = '';
            
            // Get top rated wines
            const topWines = [...ratedWines]
                .sort((a, b) => b.overallRating - a.overallRating)
                .slice(0, 3);
            
            // Add modern wine cards
            topWines.forEach(wine => {
                if (window.WineRater?.ModernUI) {
                    const card = window.WineRater.ModernUI.createWineCard(wine);
                    card.addEventListener('click', () => this.openWineDetails(wine.id));
                    container.appendChild(card);
                } else {
                    container.appendChild(this.createWineCard(wine));
                }
            });
        }
    },
    
    // Render collection with modern cards
    renderCollection: function() {
        const container = document.getElementById('collection-list');
        const emptyState = document.getElementById('empty-collection');
        
        const filteredWines = this.getFilteredWines();
        
        if (filteredWines.length === 0) {
            container.style.display = 'none';
            emptyState.style.display = 'block';
        } else {
            container.style.display = 'grid';
            emptyState.style.display = 'none';
            
            // Clear container
            container.innerHTML = '';
            
            // Show loading skeletons first
            if (window.WineRater?.ModernUI) {
                for (let i = 0; i < 3; i++) {
                    container.appendChild(window.WineRater.ModernUI.createSkeleton('card'));
                }
            }
            
            // Then load actual cards
            setTimeout(() => {
                container.innerHTML = '';
                filteredWines.forEach(wine => {
                    if (window.WineRater?.ModernUI) {
                        const card = window.WineRater.ModernUI.createWineCard(wine);
                        card.addEventListener('click', () => this.openWineDetails(wine.id));
                        container.appendChild(card);
                    } else {
                        container.appendChild(this.createWineCard(wine));
                    }
                });
            }, 300);
        }
    },
    
    // Show modern toast notification
    showToast: function(message, type = 'info') {
        if (window.WineRater?.ModernUI) {
            window.WineRater.ModernUI.showToast(message, type);
        } else {
            // Fallback to console
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    },
    
    // Show loading with skeleton
    showLoading: function(message) {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.classList.add('active');
            const loadingMessage = document.getElementById('loading-message');
            if (loadingMessage) {
                loadingMessage.textContent = message || 'Loading...';
            }
        }
    },
    
    hideLoading: function() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.classList.remove('active');
        }
    },
    
    // Save wine
    saveWine: function() {
        const wine = {
            id: WineRater.Core.utils.generateId(),
            name: document.getElementById('wine-name').value,
            winery: document.getElementById('wine-winery').value,
            vintage: parseInt(document.getElementById('wine-vintage').value),
            type: document.getElementById('wine-type').value,
            varietal: document.getElementById('wine-varietal').value,
            region: document.getElementById('wine-region').value,
            country: document.getElementById('wine-country').value,
            price: parseFloat(document.getElementById('wine-price').value),
            notes: document.getElementById('wine-notes').value,
            ratings: { ...this.currentRatings },
            overallRating: this.calculateOverallRating(),
            image: this.currentImage || null,
            dateAdded: new Date().toISOString(),
            userId: firebase.auth().currentUser?.uid || 'local'
        };
        
        // Add to collection
        this.wines.push(wine);
        
        // Save to storage
        this.saveData();
        
        // Reset form
        document.getElementById('wine-form').reset();
        this.resetRatings();
        this.resetImageUpload();
        
        // Show success toast
        this.showToast('Wine added successfully!', 'success');
        
        // Update UI
        this.updateDashboard();
        this.renderCollection();
        
        // Switch to collection view
        this.switchView('my-collection');
        
        // Sync to cloud if available
        if (window.CloudStorage) {
            CloudStorage.saveWine(wine);
        }
    },
    
    // Calculate overall rating
    calculateOverallRating: function() {
        const ratings = Object.values(this.currentRatings);
        const sum = ratings.reduce((a, b) => a + b, 0);
        return ratings.length > 0 ? sum / ratings.length : 0;
    },
    
    // Update overall rating display
    updateOverallRating: function() {
        const overall = this.calculateOverallRating();
        document.getElementById('overall-rating-display').textContent = overall.toFixed(1);
    },
    
    // Reset ratings
    resetRatings: function() {
        Object.keys(this.currentRatings).forEach(key => {
            this.currentRatings[key] = 0;
        });
        
        // Update UI
        document.querySelectorAll('.star-rating').forEach(rating => {
            rating.querySelectorAll('.star').forEach(star => {
                star.classList.remove('filled');
                star.classList.remove('fas');
                star.classList.add('far');
            });
        });
        
        this.updateOverallRating();
    },
    
    // Load data
    loadData: function() {
        const savedData = localStorage.getItem('wineCollection');
        if (savedData) {
            this.wines = JSON.parse(savedData);
        }
    },
    
    // Save data
    saveData: function() {
        localStorage.setItem('wineCollection', JSON.stringify(this.wines));
    },
    
    // Switch view
    switchView: function(viewName) {
        // Hide all views
        document.querySelectorAll('.view').forEach(view => {
            view.classList.remove('active');
        });
        
        // Show selected view
        const selectedView = document.getElementById(viewName);
        if (selectedView) {
            selectedView.classList.add('active');
        }
        
        // Update navigation
        document.querySelectorAll('nav li').forEach(li => {
            li.classList.toggle('active', li.dataset.view === viewName);
        });
        
        // Update mobile navigation
        document.querySelectorAll('.mobile-nav li').forEach(li => {
            li.classList.toggle('active', li.dataset.view === viewName);
        });
    },
    
    // Calculate stats
    calculateStats: function() {
        const stats = {
            totalWines: this.wines.length,
            avgRating: 0,
            topVariety: null,
            topRegion: null
        };
        
        if (this.wines.length > 0) {
            // Average rating
            const totalRating = this.wines.reduce((sum, wine) => sum + (wine.overallRating || 0), 0);
            stats.avgRating = totalRating / this.wines.length;
            
            // Top variety
            const varieties = {};
            this.wines.forEach(wine => {
                varieties[wine.varietal] = (varieties[wine.varietal] || 0) + 1;
            });
            stats.topVariety = Object.keys(varieties).sort((a, b) => varieties[b] - varieties[a])[0];
            
            // Top region
            const regions = {};
            this.wines.forEach(wine => {
                regions[wine.region] = (regions[wine.region] || 0) + 1;
            });
            stats.topRegion = Object.keys(regions).sort((a, b) => regions[b] - regions[a])[0];
        }
        
        return stats;
    },
    
    // Get filtered wines
    getFilteredWines: function() {
        let filtered = [...this.wines];
        
        // Search filter
        const searchTerm = document.getElementById('collection-search')?.value.toLowerCase();
        if (searchTerm) {
            filtered = filtered.filter(wine => 
                wine.name.toLowerCase().includes(searchTerm) ||
                wine.winery.toLowerCase().includes(searchTerm) ||
                wine.varietal.toLowerCase().includes(searchTerm) ||
                wine.region.toLowerCase().includes(searchTerm)
            );
        }
        
        // Type filter
        const typeFilter = document.getElementById('type-filter')?.value;
        if (typeFilter && typeFilter !== 'all') {
            filtered = filtered.filter(wine => wine.type === typeFilter);
        }
        
        // Sort
        const sortBy = document.getElementById('sort-by')?.value || 'date';
        switch (sortBy) {
            case 'rating':
                filtered.sort((a, b) => b.overallRating - a.overallRating);
                break;
            case 'name':
                filtered.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'vintage':
                filtered.sort((a, b) => b.vintage - a.vintage);
                break;
            case 'price':
                filtered.sort((a, b) => a.price - b.price);
                break;
            default:
                filtered.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
        }
        
        return filtered;
    },
    
    // Filter collection
    filterCollection: function() {
        this.renderCollection();
    },
    
    // Open wine details
    openWineDetails: function(wineId) {
        const wine = this.wines.find(w => w.id === wineId);
        if (!wine) return;
        
        // Show wine details in a modal
        this.showToast(`Opening ${wine.name}...`, 'info');
        
        // TODO: Implement wine details modal
    },
    
    // Export functions
    exportToCSV: function() {
        if (window.Export) {
            Export.exportToCSV();
        } else {
            this.showToast('Export feature not available', 'error');
        }
    },
    
    exportToPDF: function() {
        if (window.Export) {
            Export.exportToPDF();
        } else {
            this.showToast('Export feature not available', 'error');
        }
    },
    
    // Fallback wine card creator
    createWineCard: function(wine) {
        const card = document.createElement('div');
        card.className = 'wine-card';
        card.dataset.id = wine.id;
        
        card.innerHTML = `
            <div class="wine-image">
                ${wine.image ? `<img src="${wine.image}" alt="${wine.name}">` : '<i class="fas fa-wine-bottle"></i>'}
            </div>
            <div class="wine-content">
                <h3>${wine.name}</h3>
                <p class="wine-details">${wine.winery} • ${wine.vintage}</p>
                <p class="wine-region">${wine.region}, ${wine.country}</p>
                <div class="wine-rating">
                    <span class="rating-value">${wine.overallRating.toFixed(1)}</span>
                    <span class="rating-stars">${this.createStars(wine.overallRating)}</span>
                </div>
                <p class="wine-price">${WineRater.Core.utils.formatCurrency(wine.price)}</p>
            </div>
        `;
        
        card.addEventListener('click', () => this.openWineDetails(wine.id));
        
        return card;
    },
    
    createStars: function(rating) {
        let stars = '';
        for (let i = 1; i <= 5; i++) {
            if (i <= rating) {
                stars += '<i class="fas fa-star"></i>';
            } else if (i - 0.5 <= rating) {
                stars += '<i class="fas fa-star-half-alt"></i>';
            } else {
                stars += '<i class="far fa-star"></i>';
            }
        }
        return stars;
    },
    
    // Image handling
    currentImage: null,
    
    resetImageUpload: function() {
        this.currentImage = null;
        document.getElementById('wine-image').value = '';
        const preview = document.getElementById('image-preview');
        if (preview) {
            preview.classList.add('hidden');
            preview.innerHTML = '';
        }
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, checking authentication state...');
    
    // Initialize the app differently based on auth state
    let appInitialized = false;
    
    firebase.auth().onAuthStateChanged(function(user) {
        console.log('Auth state changed:', user ? 'signed in' : 'signed out');
        
        if (user && !appInitialized) {
            // User is signed in, initialize app
            console.log('User signed in, initializing app...');
            App.init();
            appInitialized = true;
            
            // Hide auth container, show app
            const authContainer = document.getElementById('auth-container');
            const appContainer = document.getElementById('app-container');
            if (authContainer) authContainer.style.display = 'none';
            if (appContainer) appContainer.style.display = 'flex';
        } else if (!user) {
            // User is signed out
            console.log('User signed out');
            appInitialized = false;
            
            // Show auth container, hide app
            const authContainer = document.getElementById('auth-container');
            const appContainer = document.getElementById('app-container');
            if (authContainer) authContainer.style.display = 'flex';
            if (appContainer) appContainer.style.display = 'none';
        }
    });
});

// Make App globally available
window.App = App;