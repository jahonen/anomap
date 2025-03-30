import L from 'leaflet';
import { Message } from './types'; // Assuming Message type is here

// Temporary basic version (replace later if needed)
export const getMessageOpacity = (message: Message): number => 1.0; // Default full opacity

// Calculate radius that encompasses the entire visible map area (in km)
export const calculateMapRadius = (bounds: L.LatLngBounds): number => {
  try {
    if (!bounds || !bounds.isValid()) {
      console.warn('calculateMapRadius - Invalid map bounds, using global radius');
      return 20000; // Global radius if bounds are invalid
    }
    
    const center = bounds.getCenter();
    const northEast = bounds.getNorthEast();
    
    if (!center || !northEast) {
      console.warn('calculateMapRadius - Could not get center or corners of bounds, using global radius');
      return 20000;
    }
    
    // Calculate distance from center to northeast corner (in km)
    const radiusInMeters = center.distanceTo(northEast);
    const radiusInKm = radiusInMeters / 1000;
    
    if (isNaN(radiusInKm) || radiusInKm <= 0) {
      console.warn('calculateMapRadius - Invalid radius calculation, using global radius');
      return 20000;
    }
    
    // Add a buffer to ensure we cover more than just the visible area
    // Return a slightly larger radius than strictly needed
    return Math.ceil(radiusInKm * 1.2); 
  } catch (error) {
    console.error('calculateMapRadius - Error calculating map radius:', error);
    return 20000; // Global radius on error
  }
};

// Check if a message is within the current map bounds
export const isMessageInBounds = (message: Message, bounds: L.LatLngBounds): boolean => {
  try {
    if (!bounds || !bounds.isValid()) return false;
    
    // Extract location coordinates
    let lat: number | undefined;
    let lng: number | undefined;
    
    if (Array.isArray(message.location) && message.location.length >= 2) {
      lat = message.location[0];
      lng = message.location[1];
    } else if (message.location && typeof message.location === 'object') {
      // Use type guard to check if it's the object format
      if ('lat' in message.location && 'lng' in message.location) {
        lat = message.location.lat;
        lng = message.location.lng;
      }
    }

    // Check if coordinates are valid numbers
    if (typeof lat !== 'number' || isNaN(lat) || typeof lng !== 'number' || isNaN(lng)) {
      console.warn('isMessageInBounds - Invalid coordinates for message:', message.id, lat, lng);
      return false;
    }
    
    // Check if the message is within bounds
    return bounds.contains(L.latLng(lat, lng));
  } catch (error) {
    console.error('isMessageInBounds - Error checking if message is in bounds:', error);
    return false;
  }
};
