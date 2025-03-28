'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon issues
function fixLeafletIcons() {
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconUrl: '/marker-icon.png',
    iconRetinaUrl: '/marker-icon-2x.png',
    shadowUrl: '/marker-shadow.png',
  });
}

interface MapProps {
  coordinates?: [number, number];
  zoom?: number;
  isEditMode?: boolean;
  onLocationChange?: (coordinates: [number, number]) => void;
}

export default function Map({ 
  coordinates = [60.1699, 24.9384], // Default to Helsinki
  zoom = 13,
  isEditMode = false,
  onLocationChange
}: MapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [mapReady, setMapReady] = useState(false);

  // Initialize map
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Fix Leaflet icon issues
      fixLeafletIcons();
      
      // Create map instance if it doesn't exist
      if (!mapRef.current) {
        console.log('Creating new map instance');
        
        // Initialize the map
        const map = L.map('map-container', {
          center: coordinates,
          zoom: zoom,
          zoomControl: true,
          attributionControl: true,
        });
        
        // Add tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);
        
        // Store map reference
        mapRef.current = map;
        setMapReady(true);
      }
    }
    
    // Cleanup function
    return () => {
      if (mapRef.current) {
        console.log('Removing map instance');
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, []);

  // Update map when center or zoom changes
  useEffect(() => {
    if (mapRef.current && mapReady) {
      console.log('Updating map view to:', coordinates);
      mapRef.current.setView(coordinates, zoom);
    }
  }, [coordinates, zoom, mapReady]);

  // Handle marker creation and updates
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;
    
    const map = mapRef.current;
    
    // Create or update marker
    if (!markerRef.current && coordinates) {
      console.log('Creating new marker at:', coordinates);
      
      // Create marker with default icon (already fixed by fixLeafletIcons)
      const marker = L.marker(coordinates, { 
        draggable: isEditMode 
      }).addTo(map);
      
      // Add drag events if in edit mode
      if (isEditMode) {
        marker.on('dragend', function(e) {
          const position = e.target.getLatLng();
          const newCoords: [number, number] = [position.lat, position.lng];
          console.log('Marker dragged to:', newCoords);
          
          if (onLocationChange) {
            onLocationChange(newCoords);
          }
        });
      }
      
      markerRef.current = marker;
    } 
    // Update existing marker
    else if (markerRef.current && coordinates) {
      console.log('Updating marker position to:', coordinates);
      markerRef.current.setLatLng(coordinates);
      
      // Update draggable state
      if (markerRef.current.dragging) {
        if (isEditMode && !markerRef.current.dragging.enabled()) {
          markerRef.current.dragging.enable();
        } else if (!isEditMode && markerRef.current.dragging.enabled()) {
          markerRef.current.dragging.disable();
        }
      }
    }
    
    // Handle map clicks in edit mode
    const handleMapClick = (e: L.LeafletMouseEvent) => {
      if (isEditMode) {
        const newCoords: [number, number] = [e.latlng.lat, e.latlng.lng];
        console.log('Map clicked at:', newCoords);
        
        if (onLocationChange) {
          onLocationChange(newCoords);
        }
      }
    };
    
    // Add or remove click handler based on edit mode
    if (isEditMode) {
      console.log('Adding map click handler for edit mode');
      map.on('click', handleMapClick);
    } else {
      console.log('Removing map click handler for edit mode');
      map.off('click', handleMapClick);
    }
    
    return () => {
      if (mapRef.current) {
        mapRef.current.off('click', handleMapClick);
      }
    };
  }, [coordinates, isEditMode, onLocationChange, mapReady]);

  // The map container is defined in page.tsx, so we don't need to return anything here
  return null;
}
