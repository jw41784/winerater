/**
 * Cloud Storage module for WineRater
 * Handles syncing wine data between local storage and Firebase
 */

const CloudStorage = {
    // Firebase firestore instance
    db: null,
    
    // Reference to user's wines collection
    winesRef: null,
    
    // User ID
    userId: null,
    
    // Sync status
    isSyncing: false,
    
    // Last sync timestamp
    lastSyncTime: null,
    
    // Initialization
    init: function(userId) {
        this.db = firebase.firestore();
        this.userId = userId;
        
        if (userId) {
            this.winesRef = this.db.collection('users').doc(userId).collection('wines');
            
            // Load wines from cloud on initial login
            this.syncFromCloud();
            
            // Set up real-time listener for changes
            this.setupRealtimeListener();
        }
    },
    
    // Set up real-time listener for changes
    setupRealtimeListener: function() {
        // Only set up listener if not already set up
        if (this.unsubscribe) {
            return;
        }
        
        // Get the timestamp of the last sync
        const lastSync = localStorage.getItem('lastCloudSync') || 0;
        
        // Listen for changes to wines collection
        this.unsubscribe = this.winesRef
            .where('updatedAt', '>', new Date(parseInt(lastSync)))
            .onSnapshot(snapshot => {
                // Don't process if we're already syncing
                if (this.isSyncing) {
                    return;
                }
                
                this.isSyncing = true;
                
                // Handle changes
                snapshot.docChanges().forEach(change => {
                    const wine = change.doc.data();
                    wine.id = change.doc.id;
                    
                    if (change.type === 'added' || change.type === 'modified') {
                        this.updateLocalWine(wine);
                    } else if (change.type === 'removed') {
                        this.removeLocalWine(wine.id);
                    }
                });
                
                // Update last sync time
                this.updateLastSyncTime();
                
                this.isSyncing = false;
                
                // Refresh UI if there were changes
                if (snapshot.docChanges().length > 0) {
                    WineRater.updateDashboard();
                    WineRater.renderCollection();
                }
            }, error => {
                console.error("Error in real-time listener:", error);
                WineRater.showToast('Error syncing with cloud: ' + error.message, 'error');
            });
    },
    
    // Initial sync from cloud to local
    syncFromCloud: function() {
        // Show syncing indicator
        WineRater.showSyncIndicator();
        this.isSyncing = true;
        
        // Fetch all wines for user
        this.winesRef.get()
            .then(snapshot => {
                const cloudWines = [];
                
                snapshot.forEach(doc => {
                    const wine = doc.data();
                    wine.id = doc.id;
                    cloudWines.push(wine);
                });
                
                // Merge cloud wines with local
                this.mergeWithLocalWines(cloudWines);
                
                // Update last sync time
                this.updateLastSyncTime();
                
                // Hide syncing indicator
                WineRater.hideSyncIndicator();
                this.isSyncing = false;
                
                console.log(`Synced ${cloudWines.length} wines from cloud`);
                
                // Refresh UI
                WineRater.updateDashboard();
                WineRater.renderCollection();
            })
            .catch(error => {
                console.error("Error syncing from cloud:", error);
                WineRater.showToast('Error syncing from cloud: ' + error.message, 'error');
                
                // Hide syncing indicator
                WineRater.hideSyncIndicator();
                this.isSyncing = false;
            });
    },
    
    // Save a wine to the cloud
    saveWineToCloud: function(wine) {
        // Don't try to save if not authenticated
        if (!this.userId || !this.winesRef) {
            return Promise.reject(new Error("Not authenticated"));
        }
        
        // Create a copy of the wine to avoid modifying the original
        const wineToSave = { ...wine };
        
        // Convert dates to Firestore timestamps
        wineToSave.dateAdded = firebase.firestore.Timestamp.fromDate(new Date(wine.dateAdded));
        wineToSave.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
        
        // Add user ID
        wineToSave.userId = this.userId;
        
        // Use the same ID for consistency
        return this.winesRef.doc(wine.id).set(wineToSave)
            .then(() => {
                console.log("Wine saved to cloud:", wine.id);
                this.updateLastSyncTime();
                return wine;
            })
            .catch(error => {
                console.error("Error saving wine to cloud:", error);
                throw error;
            });
    },
    
    // Delete a wine from the cloud
    deleteWineFromCloud: function(wineId) {
        // Don't try to delete if not authenticated
        if (!this.userId || !this.winesRef) {
            return Promise.reject(new Error("Not authenticated"));
        }
        
        return this.winesRef.doc(wineId).delete()
            .then(() => {
                console.log("Wine deleted from cloud:", wineId);
                this.updateLastSyncTime();
                return wineId;
            })
            .catch(error => {
                console.error("Error deleting wine from cloud:", error);
                throw error;
            });
    },
    
    // Sync all local wines to cloud
    syncToCloud: function() {
        // Don't try to sync if not authenticated
        if (!this.userId || !this.winesRef) {
            return Promise.reject(new Error("Not authenticated"));
        }
        
        // Get local wines
        const localWines = WineRater.data.wines || [];
        
        if (localWines.length === 0) {
            return Promise.resolve([]);
        }
        
        // Show syncing indicator
        WineRater.showSyncIndicator();
        this.isSyncing = true;
        
        // Create batch for multiple operations
        const batch = this.db.batch();
        
        // Add each wine to the batch
        localWines.forEach(wine => {
            const wineToSave = { ...wine };
            
            // Convert dates to Firestore timestamps
            wineToSave.dateAdded = firebase.firestore.Timestamp.fromDate(new Date(wine.dateAdded));
            wineToSave.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
            
            // Add user ID
            wineToSave.userId = this.userId;
            
            // Add to batch
            batch.set(this.winesRef.doc(wine.id), wineToSave);
        });
        
        // Commit the batch
        return batch.commit()
            .then(() => {
                console.log(`Synced ${localWines.length} wines to cloud`);
                
                // Update last sync time
                this.updateLastSyncTime();
                
                // Hide syncing indicator
                WineRater.hideSyncIndicator();
                this.isSyncing = false;
                
                return localWines;
            })
            .catch(error => {
                console.error("Error syncing to cloud:", error);
                
                // Hide syncing indicator
                WineRater.hideSyncIndicator();
                this.isSyncing = false;
                
                throw error;
            });
    },
    
    // Merge cloud wines with local wines
    mergeWithLocalWines: function(cloudWines) {
        // Get local wines
        const localWines = WineRater.data.wines || [];
        
        // Create a map of local wines by ID
        const localWinesMap = {};
        localWines.forEach(wine => {
            localWinesMap[wine.id] = wine;
        });
        
        // Create a map of cloud wines by ID
        const cloudWinesMap = {};
        cloudWines.forEach(wine => {
            // Convert Firestore timestamps to JS dates
            if (wine.dateAdded && typeof wine.dateAdded.toDate === 'function') {
                wine.dateAdded = wine.dateAdded.toDate().toISOString();
            }
            if (wine.updatedAt && typeof wine.updatedAt.toDate === 'function') {
                wine.updatedAt = wine.updatedAt.toDate().toISOString();
            }
            
            cloudWinesMap[wine.id] = wine;
        });
        
        // Merge cloud wines into local wines
        const mergedWines = [];
        
        // Add cloud wines, overriding local wines if they exist
        Object.values(cloudWinesMap).forEach(cloudWine => {
            mergedWines.push(cloudWine);
        });
        
        // Add local wines that don't exist in the cloud
        Object.values(localWinesMap).forEach(localWine => {
            if (!cloudWinesMap[localWine.id]) {
                mergedWines.push(localWine);
            }
        });
        
        // Update WineRater data
        WineRater.data.wines = mergedWines;
        
        // Save to local storage
        WineRater.saveData();
    },
    
    // Update a local wine from cloud data
    updateLocalWine: function(cloudWine) {
        // Get local wines
        const localWines = WineRater.data.wines || [];
        
        // Convert Firestore timestamps to JS dates
        if (cloudWine.dateAdded && typeof cloudWine.dateAdded.toDate === 'function') {
            cloudWine.dateAdded = cloudWine.dateAdded.toDate().toISOString();
        }
        if (cloudWine.updatedAt && typeof cloudWine.updatedAt.toDate === 'function') {
            cloudWine.updatedAt = cloudWine.updatedAt.toDate().toISOString();
        }
        
        // Find the wine in local data
        const index = localWines.findIndex(wine => wine.id === cloudWine.id);
        
        if (index >= 0) {
            // Update existing wine
            localWines[index] = cloudWine;
        } else {
            // Add new wine
            localWines.push(cloudWine);
        }
        
        // Update WineRater data
        WineRater.data.wines = localWines;
        
        // Save to local storage
        WineRater.saveData();
    },
    
    // Remove a wine from local storage
    removeLocalWine: function(wineId) {
        // Get local wines
        const localWines = WineRater.data.wines || [];
        
        // Filter out the wine to remove
        const filteredWines = localWines.filter(wine => wine.id !== wineId);
        
        // Update WineRater data
        WineRater.data.wines = filteredWines;
        
        // Save to local storage
        WineRater.saveData();
    },
    
    // Update last sync time
    updateLastSyncTime: function() {
        const now = Date.now();
        localStorage.setItem('lastCloudSync', now.toString());
        this.lastSyncTime = now;
    },
    
    // Get last sync time
    getLastSyncTime: function() {
        if (!this.lastSyncTime) {
            const storedTime = localStorage.getItem('lastCloudSync');
            this.lastSyncTime = storedTime ? parseInt(storedTime) : null;
        }
        return this.lastSyncTime;
    },
    
    // Get formatted last sync time
    getFormattedLastSyncTime: function() {
        const lastSync = this.getLastSyncTime();
        if (!lastSync) {
            return 'Never';
        }
        
        const date = new Date(lastSync);
        return date.toLocaleString();
    },
    
    // Check if online
    isOnline: function() {
        return navigator.onLine;
    }
};