// src/utils/tileCache.ts
import * as L from 'leaflet';
import 'leaflet.offline';
import localforage from 'localforage';

// Create a storage for the tile layer
const tileLayerStorage = {
  async getItem(key: string) {
    try {
      return await localforage.getItem(key);
    } catch (error) {
      console.error('Error getting item from localforage:', error);
      return null;
    }
  },
  async setItem(key: string, value: any) {
    try {
      return await localforage.setItem(key, value);
    } catch (error) {
      console.error('Error setting item in localforage:', error);
    }
  },
  async clear() {
    try {
      return await localforage.clear();
    } catch (error) {
      console.error('Error clearing localforage:', error);
    }
  },
  async removeItem(key: string) {
    try {
      return await localforage.removeItem(key);
    } catch (error) {
      console.error('Error removing item from localforage:', error);
    }
  },
  async keys() {
    try {
      return await localforage.keys();
    } catch (error) {
      console.error('Error getting keys from localforage:', error);
      return [];
    }
  },
  async length() {
    try {
      return await localforage.length();
    } catch (error) {
      console.error('Error getting length from localforage:', error);
      return 0;
    }
  }
};

// Create a cached tile layer
export const createCachedTileLayer = () => {
  try {
    // @ts-ignore - leaflet.offline types are not included in the package
    return L.tileLayer.offline(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        subdomains: 'abc',
        maxZoom: 19,
      },
      {
        storage: tileLayerStorage
      }
    );
  } catch (error) {
    console.error('Error creating cached tile layer:', error);
    throw error;
  }
};

// Create a function to save tiles in the current view
export const saveTilesInCurrentView = (map: L.Map, tileLayer: any) => {
  // Ensure map is initialized
  if (!map || !map.getBounds) {
    console.error('Map not properly initialized for tile caching');
    return;
  }
  
  try {
    const bounds = map.getBounds();
    const zoom = map.getZoom();
    
    // Create the save tiles control
    // @ts-ignore - leaflet.offline types are not included in the package
    const control = L.control.savetiles(tileLayer, {
      zoomlevels: [zoom], // Only save the current zoom level
      confirm(layer: any, succCount: number) {
        console.log(`Saved ${succCount} tiles`);
        return true;
      },
      confirmRemoval(layer: any, succCount: number) {
        console.log(`Removed ${succCount} tiles`);
        return true;
      },
    });
    
    // Add control to map
    control.addTo(map);
    
    // Check if saveInBounds method exists
    if (typeof control.saveInBounds === 'function') {
      control.saveInBounds(bounds);
    } else if (typeof control._saveTiles === 'function') {
      // Alternative method if saveInBounds is not available
      control._saveTiles();
    } else {
      console.error('No method available to save tiles in bounds');
    }
    
    // Remove control when done
    control.remove();
  } catch (error) {
    console.error('Error saving tiles:', error);
  }
};

// Create a function to clear the tile cache
export const clearTileCache = async () => {
  try {
    await tileLayerStorage.clear();
    console.log('Tile cache cleared');
    return true;
  } catch (error) {
    console.error('Error clearing tile cache:', error);
    return false;
  }
};

// Get the size of the tile cache in MB
export const getTileCacheSize = async (): Promise<number> => {
  try {
    const keys = await tileLayerStorage.keys();
    let totalSize = 0;
    
    for (const key of keys) {
      const item = await tileLayerStorage.getItem(key);
      if (item) {
        // Calculate size of the item
        const itemSize = new Blob([JSON.stringify(item)]).size;
        totalSize += itemSize;
      }
    }
    
    // Convert to MB
    return totalSize / (1024 * 1024);
  } catch (error) {
    console.error('Error getting tile cache size:', error);
    return 0;
  }
};
