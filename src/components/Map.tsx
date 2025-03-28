'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { OpenStreetMapProvider } from 'leaflet-geosearch';
import 'leaflet-geosearch/dist/geosearch.css';
import MessageLayer from './MessageLayer';
import HeatmapLayer from './HeatmapLayer';
import { Message } from '../services/messageService';

// Fix Leaflet default icon issues
function fixLeafletIcons() {
  // @ts-ignore - _getIconUrl exists in Leaflet's implementation but TypeScript doesn't know about it
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
  isHeatmapMode?: boolean;
  onLocationChange?: (coordinates: [number, number]) => void;
  onMessageClick?: (message: Message) => void;
}

export default function Map({ 
  coordinates = [60.1699, 24.9384], // Default to Helsinki
  zoom = 13,
  isEditMode = false,
  isHeatmapMode = false,
  onLocationChange,
  onMessageClick
}: MapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [messagesInitialized, setMessagesInitialized] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(zoom);
  const [previousZoom, setPreviousZoom] = useState(zoom);

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
          zoom: currentZoom,
          zoomControl: false, // Disable default zoom control, we'll add it manually
          attributionControl: true,
        });
        
        // Add tile layer (map style)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);
        
        // Create search control
        const searchControl = L.Control.extend({
          options: {
            position: 'topleft'
          },
          
          onAdd: function() {
            // Create container
            const container = L.DomUtil.create('div', 'leaflet-control leaflet-bar leaflet-control-search');
            
            // Create input
            const input = L.DomUtil.create('input', 'search-input', container);
            input.type = 'text';
            input.placeholder = 'Search location...';
            
            // Create button
            const button = L.DomUtil.create('button', 'search-button', container);
            button.innerHTML = '🔍';
            
            // Prevent map click events when interacting with the control
            L.DomEvent.disableClickPropagation(container);
            L.DomEvent.disableScrollPropagation(container);
            
            // Add search functionality
            const provider = new OpenStreetMapProvider();
            
            const handleSearch = async (query: string) => {
              if (!query) return;
              
              try {
                const results = await provider.search({ query });
                if (results && results.length > 0) {
                  const { x, y } = results[0];
                  const lat = y;
                  const lng = x;
                  
                  // Update map view
                  map.setView([lat, lng], 15);
                  
                  // Update marker if in edit mode
                  if (isEditMode && onLocationChange) {
                    onLocationChange([lat, lng]);
                    
                    if (markerRef.current) {
                      markerRef.current.setLatLng([lat, lng]);
                    } else {
                      const marker = L.marker([lat, lng], { draggable: isEditMode }).addTo(map);
                      markerRef.current = marker;
                      
                      marker.on('dragend', () => {
                        const position = marker.getLatLng();
                        onLocationChange([position.lat, position.lng]);
                      });
                    }
                  }
                }
              } catch (error) {
                console.error('Search error:', error);
              }
            };
            
            // Add event listeners
            L.DomEvent.on(button, 'click', () => {
              handleSearch(input.value);
            });
            L.DomEvent.on(input, 'keydown', (e: KeyboardEvent) => {
              if (e.key === 'Enter') {
                handleSearch(input.value);
              }
            });
            
            return container;
          }
        });
        
        // Add the search control to the map first
        map.addControl(new searchControl());
        
        // Add zoom control after search control
        L.control.zoom({
          position: 'topleft'
        }).addTo(map);
        
        // Add marker if in edit mode
        if (isEditMode) {
          const marker = L.marker(coordinates, { draggable: isEditMode }).addTo(map);
          markerRef.current = marker;
          
          // Handle marker drag events
          if (isEditMode && onLocationChange) {
            marker.on('dragend', () => {
              const position = marker.getLatLng();
              onLocationChange([position.lat, position.lng]);
            });
          }
        }
        
        // Handle map click events
        map.on('click', (e) => {
          if (isEditMode && onLocationChange) {
            const { lat, lng } = e.latlng;
            onLocationChange([lat, lng]);
            
            // Update marker position
            if (markerRef.current) {
              markerRef.current.setLatLng([lat, lng]);
            } else {
              // Create marker if it doesn't exist
              const marker = L.marker([lat, lng], { draggable: isEditMode }).addTo(map);
              markerRef.current = marker;
              
              // Handle marker drag events
              marker.on('dragend', () => {
                const position = marker.getLatLng();
                onLocationChange([position.lat, position.lng]);
              });
            }
          }
        });
        
        // Store map reference
        mapRef.current = map;
        setMapReady(true);
      }
    }
    
    // Cleanup function
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, []);

  // Initialize sample messages once map is ready
  useEffect(() => {
    if (mapReady && coordinates) {
      console.log('Map is ready with coordinates:', coordinates);
      setMessagesInitialized(true);
    }
  }, [mapReady, coordinates]);

  // Update zoom when prop changes
  useEffect(() => {
    if (zoom !== undefined) {
      setCurrentZoom(zoom);
    }
  }, [zoom]);

  // Update map view when coordinates change
  useEffect(() => {
    if (mapRef.current && mapReady) {
      console.log('Updating map view to:', coordinates);
      mapRef.current.setView(coordinates, currentZoom);
    }
  }, [coordinates, currentZoom, mapReady]);

  // Effect to handle zoom level changes when toggling heatmap mode
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;
    
    console.log('Heatmap mode changed:', isHeatmapMode);
    
    if (isHeatmapMode) {
      // Store current zoom level before switching to heatmap
      setPreviousZoom(currentZoom);
      
      // Zoom out for heatmap view (zoom level 10 gives a good overview)
      mapRef.current.setZoom(10);
    } else {
      // Return to previous zoom level when switching back to message view
      if (previousZoom) {
        mapRef.current.setZoom(previousZoom);
      }
    }
  }, [isHeatmapMode, mapReady, currentZoom, previousZoom]);

  // Render MessageLayer or HeatmapLayer when map is ready
  console.log('Map render - mapReady:', mapReady, 'coordinates:', coordinates, 'messagesInitialized:', messagesInitialized, 'isHeatmapMode:', isHeatmapMode);
  
  return (
    <>
      {mapReady && mapRef.current && (
        <>
          {!isHeatmapMode && (
            <MessageLayer
              map={mapRef.current}
              center={coordinates}
              radius={3}
              onMessageClick={onMessageClick}
            />
          )}
          
          {isHeatmapMode && (
            <HeatmapLayer
              map={mapRef.current}
            />
          )}
        </>
      )}
    </>
  );
}
