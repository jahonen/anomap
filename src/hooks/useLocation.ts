'use client';

import { useState, useEffect, useCallback } from 'react';

// Default location: Athens, Greece
const DEFAULT_LOCATION: [number, number] = [37.9838, 23.7275];

// Cache keys
const LOCATION_CACHE_KEY = 'burnhen_location';
const LOCATION_CACHE_EXPIRY_KEY = 'burnhen_location_expiry';
const CACHE_DURATION = 1000 * 60 * 30; // 30 minutes

export interface LocationState {
  coordinates: [number, number];
  loading: boolean;
  error: string | null;
  source: 'geolocation' | 'ip' | 'default' | 'manual';
}

export function useLocation() {
  const [state, setState] = useState<LocationState>({
    coordinates: DEFAULT_LOCATION,
    loading: true,
    error: null,
    source: 'default'
  });

  // Check cache for location data
  const getLocationFromCache = useCallback((): { 
    coordinates: [number, number]; 
    source: 'geolocation' | 'ip' | 'default' | 'manual';
  } | null => {
    if (typeof window === 'undefined') return null;
    
    try {
      const cachedLocation = localStorage.getItem(LOCATION_CACHE_KEY);
      const cachedExpiry = localStorage.getItem(LOCATION_CACHE_EXPIRY_KEY);
      
      if (!cachedLocation || !cachedExpiry) return null;
      
      const expiryTime = parseInt(cachedExpiry, 10);
      
      // Check if cache is still valid
      if (Date.now() > expiryTime) {
        localStorage.removeItem(LOCATION_CACHE_KEY);
        localStorage.removeItem(LOCATION_CACHE_EXPIRY_KEY);
        return null;
      }
      
      const locationData = JSON.parse(cachedLocation);
      return locationData;
    } catch (error) {
      console.error('Error reading from cache:', error);
      return null;
    }
  }, []);

  // Save location to cache
  const saveLocationToCache = useCallback((
    coordinates: [number, number], 
    source: 'geolocation' | 'ip' | 'default' | 'manual'
  ) => {
    if (typeof window === 'undefined') return;
    
    try {
      const locationData = { coordinates, source };
      localStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify(locationData));
      localStorage.setItem(LOCATION_CACHE_EXPIRY_KEY, (Date.now() + CACHE_DURATION).toString());
    } catch (error) {
      console.error('Error saving to cache:', error);
    }
  }, []);

  // Function to get user's location via browser Geolocation API
  const getUserLocation = useCallback((): Promise<{
    coordinates: [number, number];
    source: 'geolocation';
  } | null> => {
    return new Promise((resolve) => {
      console.log('Attempting to get user location via Geolocation API');
      
      if (!navigator.geolocation) {
        console.log('Geolocation is not supported by this browser');
        resolve(null);
        return;
      }
      
      // Add a backup timeout in case the geolocation API hangs
      const timeoutId = setTimeout(() => {
        console.log('Geolocation request timed out with our backup timer');
        resolve(null);
      }, 15000); // 15 seconds backup timeout
      
      navigator.geolocation.getCurrentPosition(
        // Success callback
        (position) => {
          clearTimeout(timeoutId); // Clear the backup timeout
          const { latitude, longitude } = position.coords;
          console.log('Geolocation successful:', latitude, longitude);
          resolve({
            coordinates: [latitude, longitude],
            source: 'geolocation'
          });
        },
        // Error callback
        (error) => {
          clearTimeout(timeoutId); // Clear the backup timeout
          console.log('Geolocation error:', error.message);
          resolve(null);
        },
        // Options
        { 
          enableHighAccuracy: true,
          timeout: 10000, // Increased from 5000 to 10000 (10 seconds)
          maximumAge: 60000 // Allow cached positions up to 1 minute old
        }
      );
    });
  }, []);

  // Function to get location from IP address
  const getIPLocation = useCallback(async (): Promise<{
    coordinates: [number, number];
    source: 'ip';
  } | null> => {
    console.log('Attempting to get location via IP');
    
    try {
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      
      if (data.latitude && data.longitude) {
        console.log('IP location successful:', data.latitude, data.longitude);
        return {
          coordinates: [data.latitude, data.longitude],
          source: 'ip'
        };
      } else {
        throw new Error('Invalid location data from IP');
      }
    } catch (error) {
      console.error('IP location error:', error);
      return null;
    }
  }, []);

  // Function to manually set location
  const setManualLocation = useCallback((coordinates: [number, number]) => {
    console.log('Setting manual location:', coordinates);
    
    saveLocationToCache(coordinates, 'manual');
    setState({
      coordinates,
      loading: false,
      error: null,
      source: 'manual'
    });
    
    return true;
  }, [saveLocationToCache]);

  // Function to locate user with fallbacks
  const locateUser = useCallback(async (forceRefresh = false) => {
    console.log('Starting location detection process');
    
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    // Check cache first (unless forced refresh)
    if (!forceRefresh) {
      const cachedLocation = getLocationFromCache();
      if (cachedLocation) {
        console.log('Using cached location:', cachedLocation);
        setState({
          coordinates: cachedLocation.coordinates,
          loading: false,
          error: null,
          source: cachedLocation.source
        });
        return;
      }
    }
    
    // Try browser geolocation first
    const geolocationResult = await getUserLocation();
    
    if (geolocationResult) {
      saveLocationToCache(geolocationResult.coordinates, geolocationResult.source);
      setState({
        coordinates: geolocationResult.coordinates,
        loading: false,
        error: null,
        source: geolocationResult.source
      });
      return;
    }
    
    // If geolocation fails, try IP-based location
    const ipLocationResult = await getIPLocation();
    
    if (ipLocationResult) {
      saveLocationToCache(ipLocationResult.coordinates, ipLocationResult.source);
      setState({
        coordinates: ipLocationResult.coordinates,
        loading: false,
        error: null,
        source: ipLocationResult.source
      });
      return;
    }
    
    // If IP location fails, use default location
    console.log('Using default location (Athens, Greece)');
    saveLocationToCache(DEFAULT_LOCATION, 'default');
    setState({
      coordinates: DEFAULT_LOCATION,
      loading: false,
      error: null,
      source: 'default'
    });
  }, [getUserLocation, getIPLocation, getLocationFromCache, saveLocationToCache]);

  // Initialize location on component mount
  useEffect(() => {
    locateUser();
  }, [locateUser]);

  return {
    ...state,
    locateUser,
    refreshLocation: () => locateUser(true),
    setManualLocation
  };
}
