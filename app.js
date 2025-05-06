/**
 * WineRater App
 * A simple application for rating and tracking wine experiences
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
        // Navigation
        document.querySelector('nav ul').addEventListener('click', (e) => {
            if (e.target.tagName === 'LI') {
                this.switchView(e.target.dataset.view);
            }
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
        
        // Collection search
        document.getElementById('collection-search').addEventListener('input', (e) => {
            this.filterCollection();
        });
        
        // Collection filters
        document.getElementById('type-filter').addEventListener('change', () => {
            this.filterCollection();
        });
        
        // Collection sorting
        document.getElementById('sort-by').addEventListener('change', () => {
            this.filterCollection();
        });
        
        // Wine card click for details
        document.getElementById('collection-list').addEventListener('click', (e) => {
            const wineCard = e.target.closest('.wine-card');
            if (wineCard) {
                this.openWineDetails(wineCard.dataset.id);
            }
        });
        
        document.getElementById('top-wines-list').addEventListener('click', (e) => {
            const wineCard = e.target.closest('.wine-card');
            if (wineCard) {
                this.openWineDetails(wineCard.dataset.id);
            }
        });
        
        document.getElementById('recent-wines-list').addEventListener('click', (e) => {
            const wineCard = e.target.closest('.wine-card');
            if (wineCard) {
                this.openWineDetails(wineCard.dataset.id);
            }
        });
        
        // Close modal
        document.querySelector('.close-modal').addEventListener('click', () => {
            this.closeWineDetails();
        });
        
        // Click outside to close modal
        document.getElementById('wine-details-modal').addEventListener('click', (e) => {
            if (e.target === document.getElementById('wine-details-modal')) {
                this.closeWineDetails();
            }
        });
        
        // Keyboard escape to close modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeWineDetails();
            }
        });
    },
    
    // Switch between views
    switchView: function(view) {
        // Update active navigation
        document.querySelectorAll('nav li').forEach(li => {
            li.classList.remove('active');
        });
        document.querySelector(`nav li[data-view="${view}"]`).classList.add('active');
        
        // Update active view
        document.querySelectorAll('.view').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(view).classList.add('active');
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
        
        // Reset form
        document.getElementById('wine-form').reset();
        this.resetRatings();
        
        // Update views
        this.updateDashboard();
        this.renderCollection();
        
        // Switch to collection view
        this.switchView('my-collection');
        
        // Show success message
        alert('Wine saved successfully!');
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
        
        // Render top wines
        const topWines = [...wines]
            .filter(wine => wine.overallRating > 0)
            .sort((a, b) => b.overallRating - a.overallRating)
            .slice(0, 3);
            
        this.renderWineCards(topWines, 'top-wines-list');
        
        // Render recent wines
        const recentWines = [...wines]
            .sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded))
            .slice(0, 3);
            
        this.renderWineCards(recentWines, 'recent-wines-list');
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
                wine.varietal.toLowerCase().includes(searchTerm)
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
    },
    
    // Render wine cards
    renderWineCards: function(wines, containerId) {
        const container = document.getElementById(containerId);
        container.innerHTML = '';
        
        if (wines.length === 0) {
            container.innerHTML = '<p class="no-wines">No wines found.</p>';
            return;
        }
        
        for (const wine of wines) {
            const wineCard = document.createElement('div');
            wineCard.className = 'wine-card';
            wineCard.dataset.id = wine.id;
            
            const wineImage = wine.imageData ? 
                `<img src="${wine.imageData}" alt="${wine.name}">` : 
                `<div class="wine-placeholder"></div>`;
                
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
    
    // Open wine details modal
    openWineDetails: function(wineId) {
        const wine = this.data.wines.find(wine => wine.id === wineId);
        if (!wine) return;
        
        const modal = document.getElementById('wine-details-modal');
        const content = document.getElementById('wine-details-content');
        
        const wineImage = wine.imageData ? 
            `<img src="${wine.imageData}" alt="${wine.name}">` : 
            `<div class="wine-placeholder"></div>`;
            
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
                    
                    <div class="wine-actions">
                        <button class="btn secondary" onclick="WineRater.deleteWine('${wine.id}')">Delete</button>
                    </div>
                </div>
            </div>
        `;
        
        modal.classList.add('open');
    },
    
    // Close wine details modal
    closeWineDetails: function() {
        const modal = document.getElementById('wine-details-modal');
        modal.classList.remove('open');
    },
    
    // Delete a wine
    deleteWine: function(wineId) {
        if (confirm('Are you sure you want to delete this wine?')) {
            this.data.wines = this.data.wines.filter(wine => wine.id !== wineId);
            this.saveData();
            this.closeWineDetails();
            this.updateDashboard();
            this.renderCollection();
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
        localStorage.setItem(this.storageKey, JSON.stringify(this.data.wines));
    }
};

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    WineRater.init();
});