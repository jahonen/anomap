'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon issues
function fixLeafletIcons() {
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  });
}

interface MapProps {
  center: [number, number];
  zoom?: number;
  isEditMode?: boolean;
  onLocationChange?: (newLocation: [number, number]) => void;
}

export default function Map({ 
  center, 
  zoom = 13, 
  isEditMode = false,
  onLocationChange 
}: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const previousIsEditMode = useRef(isEditMode);

  // Log prop changes for debugging
  useEffect(() => {
    console.log('Map props changed - isEditMode:', isEditMode, 'center:', center);
    
    // Track changes to edit mode
    previousIsEditMode.current = isEditMode;
  }, [isEditMode, center]);

  // Detect if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Initialize map
  useEffect(() => {
    // Fix Leaflet icon issues
    fixLeafletIcons();

    // Initialize map only if it doesn't exist yet
    if (!mapInstanceRef.current && mapRef.current) {
      console.log('Initializing map with center:', center);
      const map = L.map(mapRef.current).setView(center, zoom);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '', // Empty attribution since we're showing it in the footer
        maxZoom: 19,
      }).addTo(map);
      
      // Add a marker at the center
      markerRef.current = L.marker(center, { draggable: isEditMode })
        .addTo(map)
        .bindPopup(isEditMode ? 'Drag me to set your location' : 'You are here');
      
      if (isEditMode) {
        markerRef.current.openPopup();
      }
      
      // Store map instance in ref
      mapInstanceRef.current = map;
    }
    
    // Clean up function
    return () => {
      if (mapInstanceRef.current) {
        console.log('Cleaning up map instance');
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, []); // Empty dependency array ensures map is only created once

  // Update map view and marker when center or zoom changes
  useEffect(() => {
    if (mapInstanceRef.current) {
      console.log('Updating map view to center:', center, 'zoom:', zoom);
      mapInstanceRef.current.setView(center, zoom);
      
      if (markerRef.current) {
        markerRef.current.setLatLng(center);
      }
    }
  }, [center, zoom]);

  // Update marker draggability when edit mode changes
  useEffect(() => {
    console.log('Edit mode changed to:', isEditMode);
    if (markerRef.current) {
      // Update marker draggability
      if (isEditMode) {
        console.log('Enabling marker dragging');
        markerRef.current.dragging?.enable();
        markerRef.current.setPopupContent('Drag me to set your location');
        markerRef.current.openPopup();
      } else {
        console.log('Disabling marker dragging');
        markerRef.current.dragging?.disable();
        markerRef.current.setPopupContent('You are here');
        markerRef.current.closePopup();
      }
    }
  }, [isEditMode]);

  // Set up map click handler for location selection
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    
    const handleMapClick = (e: L.LeafletMouseEvent) => {
      // Only process clicks when in edit mode
      if (!isEditMode) return;
      
      const { lat, lng } = e.latlng;
      console.log('Map clicked at:', lat, lng, 'isEditMode:', isEditMode);
      
      // Update marker position
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
        markerRef.current.openPopup();
      }
      
      // Notify parent component
      if (onLocationChange) {
        console.log('Calling onLocationChange with:', [lat, lng]);
        onLocationChange([lat, lng]);
      }
    };
    
    // Set up marker drag end handler
    const handleMarkerDragEnd = () => {
      if (!markerRef.current || !onLocationChange) return;
      
      const position = markerRef.current.getLatLng();
      console.log('Marker dragged to:', position.lat, position.lng);
      onLocationChange([position.lat, position.lng]);
    };
    
    // Add handlers
    console.log('Adding map handlers, isEditMode:', isEditMode);
    mapInstanceRef.current.on('click', handleMapClick);
    
    if (markerRef.current) {
      markerRef.current.on('dragend', handleMarkerDragEnd);
    }
    
    // Clean up
    return () => {
      if (mapInstanceRef.current) {
        console.log('Removing map handlers');
        mapInstanceRef.current.off('click', handleMapClick);
      }
      
      if (markerRef.current) {
        markerRef.current.off('dragend', handleMarkerDragEnd);
      }
    };
  }, [isEditMode, onLocationChange]);

  return <div ref={mapRef} id="map-container" />;
}
