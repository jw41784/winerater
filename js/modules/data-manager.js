/**
 * Data Manager Module
 * Handles all data operations (local and cloud storage)
 */

WineRater.DataManager = (function() {
  'use strict';

  const { utils } = WineRater.Core;
  const STORAGE_KEY = 'wineRaterData';
  const SYNC_INTERVAL = 30000; // 30 seconds

  // Private state
  let data = {
    wines: [],
    preferences: {
      sortBy: 'date',
      filterBy: 'all',
      viewMode: 'grid'
    },
    lastSync: null
  };

  let syncTimer = null;
  let isDirty = false;

  // Wine Model
  class Wine {
    constructor(wineData) {
      this.id = wineData.id || utils.generateId();
      this.name = wineData.name;
      this.winery = wineData.winery;
      this.vintage = parseInt(wineData.vintage);
      this.type = wineData.type;
      this.varietal = wineData.varietal;
      this.region = wineData.region;
      this.country = wineData.country;
      this.price = parseFloat(wineData.price);
      this.ratings = wineData.ratings || {};
      this.notes = wineData.notes || '';
      this.image = wineData.image || null;
      this.createdAt = wineData.createdAt || new Date().toISOString();
      this.updatedAt = wineData.updatedAt || new Date().toISOString();
      this.userId = wineData.userId || null;
    }

    get overallRating() {
      const ratings = Object.values(this.ratings);
      if (ratings.length === 0) return 0;
      return ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
    }

    toJSON() {
      return {
        id: this.id,
        name: this.name,
        winery: this.winery,
        vintage: this.vintage,
        type: this.type,
        varietal: this.varietal,
        region: this.region,
        country: this.country,
        price: this.price,
        ratings: this.ratings,
        notes: this.notes,
        image: this.image,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt,
        userId: this.userId
      };
    }

    validate() {
      const errors = [];

      if (!this.name || this.name.trim().length === 0) {
        errors.push('Wine name is required');
      }

      if (!this.winery || this.winery.trim().length === 0) {
        errors.push('Winery is required');
      }

      if (!this.vintage || this.vintage < 1900 || this.vintage > new Date().getFullYear()) {
        errors.push('Valid vintage year is required');
      }

      if (!this.type) {
        errors.push('Wine type is required');
      }

      if (this.price < 0) {
        errors.push('Price cannot be negative');
      }

      return {
        isValid: errors.length === 0,
        errors: errors
      };
    }
  }

  // Data operations
  const operations = {
    // Load data from storage
    loadData() {
      try {
        const savedData = utils.storage.get(STORAGE_KEY);
        if (savedData) {
          data = utils.merge(data, savedData);
          data.wines = data.wines.map(w => new Wine(w));
        }
        return true;
      } catch (error) {
        console.error('Error loading data:', error);
        return false;
      }
    },

    // Save data to storage
    saveData() {
      try {
        const dataToSave = {
          ...data,
          wines: data.wines.map(w => w.toJSON())
        };
        utils.storage.set(STORAGE_KEY, dataToSave);
        isDirty = false;
        WineRater.Core.emit('data:saved');
        return true;
      } catch (error) {
        console.error('Error saving data:', error);
        return false;
      }
    },

    // Add new wine
    addWine(wineData) {
      const wine = new Wine(wineData);
      const validation = wine.validate();

      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      data.wines.push(wine);
      isDirty = true;
      this.saveData();
      
      WineRater.Core.emit('wine:added', { wine });
      return wine;
    },

    // Update wine
    updateWine(id, updates) {
      const index = data.wines.findIndex(w => w.id === id);
      if (index === -1) {
        throw new Error('Wine not found');
      }

      const updatedWine = new Wine({
        ...data.wines[index].toJSON(),
        ...updates,
        updatedAt: new Date().toISOString()
      });

      const validation = updatedWine.validate();
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      data.wines[index] = updatedWine;
      isDirty = true;
      this.saveData();

      WineRater.Core.emit('wine:updated', { wine: updatedWine });
      return updatedWine;
    },

    // Delete wine
    deleteWine(id) {
      const index = data.wines.findIndex(w => w.id === id);
      if (index === -1) {
        throw new Error('Wine not found');
      }

      const deletedWine = data.wines.splice(index, 1)[0];
      isDirty = true;
      this.saveData();

      WineRater.Core.emit('wine:deleted', { wine: deletedWine });
      return true;
    },

    // Get wine by ID
    getWine(id) {
      return data.wines.find(w => w.id === id);
    },

    // Get all wines
    getAllWines() {
      return [...data.wines];
    },

    // Get filtered wines
    getFilteredWines(filters = {}) {
      let filtered = [...data.wines];

      // Apply type filter
      if (filters.type && filters.type !== 'all') {
        filtered = filtered.filter(w => w.type === filters.type);
      }

      // Apply search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filtered = filtered.filter(w => 
          w.name.toLowerCase().includes(searchLower) ||
          w.winery.toLowerCase().includes(searchLower) ||
          w.varietal.toLowerCase().includes(searchLower) ||
          w.region.toLowerCase().includes(searchLower)
        );
      }

      // Apply rating filter
      if (filters.minRating) {
        filtered = filtered.filter(w => w.overallRating >= filters.minRating);
      }

      // Apply price range filter
      if (filters.minPrice !== undefined) {
        filtered = filtered.filter(w => w.price >= filters.minPrice);
      }
      if (filters.maxPrice !== undefined) {
        filtered = filtered.filter(w => w.price <= filters.maxPrice);
      }

      // Apply vintage range filter
      if (filters.minVintage) {
        filtered = filtered.filter(w => w.vintage >= filters.minVintage);
      }
      if (filters.maxVintage) {
        filtered = filtered.filter(w => w.vintage <= filters.maxVintage);
      }

      // Sort results
      filtered = this.sortWines(filtered, filters.sortBy || 'date');

      return filtered;
    },

    // Sort wines
    sortWines(wines, sortBy) {
      const sorted = [...wines];

      switch (sortBy) {
        case 'name':
          sorted.sort((a, b) => a.name.localeCompare(b.name));
          break;
        case 'rating':
          sorted.sort((a, b) => b.overallRating - a.overallRating);
          break;
        case 'price':
          sorted.sort((a, b) => a.price - b.price);
          break;
        case 'vintage':
          sorted.sort((a, b) => b.vintage - a.vintage);
          break;
        case 'date':
        default:
          sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      }

      return sorted;
    },

    // Get statistics
    getStatistics() {
      const wines = data.wines;
      
      if (wines.length === 0) {
        return {
          totalWines: 0,
          averageRating: 0,
          averagePrice: 0,
          totalValue: 0,
          topVarietal: 'None',
          topRegion: 'None',
          typeDistribution: {},
          ratingDistribution: {},
          vintageDistribution: {}
        };
      }

      // Calculate averages
      const totalWines = wines.length;
      const averageRating = wines.reduce((sum, w) => sum + w.overallRating, 0) / totalWines;
      const averagePrice = wines.reduce((sum, w) => sum + w.price, 0) / totalWines;
      const totalValue = wines.reduce((sum, w) => sum + w.price, 0);

      // Calculate distributions
      const varietalCounts = {};
      const regionCounts = {};
      const typeCounts = {};
      const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      const vintageCounts = {};

      wines.forEach(wine => {
        // Varietals
        varietalCounts[wine.varietal] = (varietalCounts[wine.varietal] || 0) + 1;
        
        // Regions
        regionCounts[wine.region] = (regionCounts[wine.region] || 0) + 1;
        
        // Types
        typeCounts[wine.type] = (typeCounts[wine.type] || 0) + 1;
        
        // Ratings
        const roundedRating = Math.round(wine.overallRating);
        if (roundedRating > 0) {
          ratingCounts[roundedRating]++;
        }
        
        // Vintages
        const decade = Math.floor(wine.vintage / 10) * 10;
        vintageCounts[decade] = (vintageCounts[decade] || 0) + 1;
      });

      // Find top varietal and region
      const topVarietal = Object.entries(varietalCounts)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || 'None';
      
      const topRegion = Object.entries(regionCounts)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || 'None';

      return {
        totalWines,
        averageRating,
        averagePrice,
        totalValue,
        topVarietal,
        topRegion,
        typeDistribution: typeCounts,
        ratingDistribution: ratingCounts,
        vintageDistribution: vintageCounts
      };
    },

    // Export data
    exportData(format = 'json') {
      const wines = data.wines.map(w => w.toJSON());

      switch (format) {
        case 'csv':
          return this.exportCSV(wines);
        case 'json':
        default:
          return JSON.stringify(wines, null, 2);
      }
    },

    // Export to CSV
    exportCSV(wines) {
      const headers = [
        'Name', 'Winery', 'Vintage', 'Type', 'Varietal', 
        'Region', 'Country', 'Price', 'Overall Rating', 
        'Aroma', 'Taste', 'Body', 'Finish', 'Value', 'Notes'
      ];

      const rows = wines.map(wine => [
        wine.name,
        wine.winery,
        wine.vintage,
        wine.type,
        wine.varietal,
        wine.region,
        wine.country,
        wine.price,
        Object.values(wine.ratings).reduce((sum, r) => sum + r, 0) / Object.keys(wine.ratings).length || 0,
        wine.ratings.aroma || '',
        wine.ratings.taste || '',
        wine.ratings.body || '',
        wine.ratings.finish || '',
        wine.ratings.value || '',
        wine.notes.replace(/"/g, '""') // Escape quotes
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      return csvContent;
    },

    // Import data
    importData(importedData, options = {}) {
      const { merge = false } = options;
      
      try {
        let wines = [];
        
        if (typeof importedData === 'string') {
          // Try to parse as JSON
          try {
            wines = JSON.parse(importedData);
          } catch {
            // Try to parse as CSV
            wines = this.parseCSV(importedData);
          }
        } else if (Array.isArray(importedData)) {
          wines = importedData;
        }

        // Validate and create Wine objects
        const validWines = wines.map(w => {
          const wine = new Wine(w);
          const validation = wine.validate();
          if (!validation.isValid) {
            console.warn('Invalid wine data:', validation.errors);
            return null;
          }
          return wine;
        }).filter(w => w !== null);

        if (merge) {
          // Merge with existing data
          data.wines = [...data.wines, ...validWines];
        } else {
          // Replace existing data
          data.wines = validWines;
        }

        isDirty = true;
        this.saveData();

        WineRater.Core.emit('data:imported', { count: validWines.length });
        return { success: true, imported: validWines.length };
      } catch (error) {
        console.error('Import error:', error);
        return { success: false, error: error.message };
      }
    },

    // Parse CSV
    parseCSV(csv) {
      const lines = csv.split('\n');
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      return lines.slice(1).map(line => {
        const values = line.match(/(".*?"|[^,]+)/g) || [];
        const wine = {};
        
        headers.forEach((header, index) => {
          let value = values[index] || '';
          value = value.replace(/^"|"$/g, '').replace(/""/g, '"');
          
          // Map CSV headers to wine properties
          switch (header) {
            case 'name': wine.name = value; break;
            case 'winery': wine.winery = value; break;
            case 'vintage': wine.vintage = parseInt(value); break;
            case 'type': wine.type = value; break;
            case 'varietal': wine.varietal = value; break;
            case 'region': wine.region = value; break;
            case 'country': wine.country = value; break;
            case 'price': wine.price = parseFloat(value); break;
            case 'notes': wine.notes = value; break;
            case 'aroma': 
            case 'taste':
            case 'body':
            case 'finish':
            case 'value':
              if (!wine.ratings) wine.ratings = {};
              wine.ratings[header] = parseInt(value) || 0;
              break;
          }
        });
        
        return wine;
      }).filter(wine => wine.name); // Filter out empty rows
    }
  };

  // Cloud sync operations
  const cloudSync = {
    // Initialize cloud sync
    initCloudSync(userId) {
      if (!userId) return;

      // Set user ID for new wines
      data.wines.forEach(wine => {
        if (!wine.userId) {
          wine.userId = userId;
        }
      });

      // Start sync timer
      this.startSyncTimer();
    },

    // Start sync timer
    startSyncTimer() {
      this.stopSyncTimer();
      syncTimer = setInterval(() => {
        if (isDirty && navigator.onLine) {
          this.syncToCloud();
        }
      }, SYNC_INTERVAL);
    },

    // Stop sync timer
    stopSyncTimer() {
      if (syncTimer) {
        clearInterval(syncTimer);
        syncTimer = null;
      }
    },

    // Sync to cloud
    async syncToCloud() {
      if (!WineRater.CloudStorage) return;

      try {
        WineRater.Core.emit('sync:started');
        
        await WineRater.CloudStorage.syncToCloud();
        data.lastSync = new Date().toISOString();
        isDirty = false;
        
        WineRater.Core.emit('sync:completed');
        return true;
      } catch (error) {
        console.error('Sync error:', error);
        WineRater.Core.emit('sync:failed', { error });
        return false;
      }
    },

    // Sync from cloud
    async syncFromCloud() {
      if (!WineRater.CloudStorage) return;

      try {
        WineRater.Core.emit('sync:started');
        
        const cloudData = await WineRater.CloudStorage.loadFromCloud();
        if (cloudData && cloudData.wines) {
          data.wines = cloudData.wines.map(w => new Wine(w));
          operations.saveData();
        }
        
        data.lastSync = new Date().toISOString();
        WineRater.Core.emit('sync:completed');
        return true;
      } catch (error) {
        console.error('Sync error:', error);
        WineRater.Core.emit('sync:failed', { error });
        return false;
      }
    }
  };

  // Initialize module
  function init() {
    console.log('Initializing Data Manager...');
    
    // Load data from local storage
    operations.loadData();
    
    // Listen for auth changes
    WineRater.Core.on('auth:changed', (event) => {
      const { user } = event.detail;
      if (user) {
        cloudSync.initCloudSync(user.uid);
      } else {
        cloudSync.stopSyncTimer();
      }
    });

    // Auto-save on changes
    WineRater.Core.on('wine:added', () => operations.saveData());
    WineRater.Core.on('wine:updated', () => operations.saveData());
    WineRater.Core.on('wine:deleted', () => operations.saveData());
  }

  // Public API
  return {
    init,
    Wine,
    ...operations,
    ...cloudSync,
    
    // Preferences
    getPreferences() {
      return { ...data.preferences };
    },
    
    setPreference(key, value) {
      data.preferences[key] = value;
      operations.saveData();
    },
    
    // Last sync time
    getLastSyncTime() {
      return data.lastSync;
    }
  };
})();

// Register module
WineRater.Core.registerModule('DataManager', WineRater.DataManager);