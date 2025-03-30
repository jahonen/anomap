'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { OpenStreetMapProvider } from 'leaflet-geosearch';
import 'leaflet-geosearch/dist/geosearch.css';
import MessageLayer from './MessageLayer';
import HeatmapLayer from './HeatmapLayer';
import { Message } from '../utils/types';
import { useMessages } from '../contexts/MessagesContext';
import { calculateMapRadius } from '../utils/mapUtils';
import { debounce } from 'lodash';

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

// Minimum zoom level allowed
const MIN_ZOOM_LEVEL = 3;
// Long press duration in milliseconds
const LONG_PRESS_DURATION = 500;

interface MapProps {
  coordinates?: [number, number];
  zoom?: number;
  isHeatmapMode?: boolean;
  onLocationChange?: (coordinates: [number, number]) => void;
  onMessageClick?: (message: Message) => void;
  onBeaconClick?: () => void;
  onMessageCountChange?: (count: number) => void;
}

export default function Map({ 
  coordinates = [60.1699, 24.9384], // Default to Helsinki
  zoom = 13,
  isHeatmapMode = false,
  onLocationChange,
  onMessageClick,
  onBeaconClick,
  onMessageCountChange
}: MapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const pressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressRef = useRef<boolean>(false);
  const [mapReady, setMapReady] = useState(false);
  const [messagesInitialized, setMessagesInitialized] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(Math.max(zoom, MIN_ZOOM_LEVEL));
  const [previousZoom, setPreviousZoom] = useState(Math.max(zoom, MIN_ZOOM_LEVEL));
  const [isLoading, setIsLoading] = useState(true);
  const [isMessagesLoading, setIsMessagesLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [visibleMessages, setVisibleMessages] = useState<Message[]>([]);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);

  const { getMessagesInRadius } = useMessages();

  // Effect 1: Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstance) return; // Don't initialize if ref not ready or map exists
    if (!coordinates) return; // Wait for coordinates

    console.log('Map: Initializing map');
    try {
      // Initialize the map with minimum zoom restriction
      const map = L.map(mapContainerRef.current, {
        center: coordinates,
        zoom: Math.max(zoom, MIN_ZOOM_LEVEL),
        minZoom: MIN_ZOOM_LEVEL,
        zoomControl: false,
        attributionControl: true,
        maxBoundsViscosity: 1.0
      });
      
      // Add tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);
      
      // Add zoom control to bottom right
      L.control.zoom({
        position: 'bottomright'
      }).addTo(map);
      
      // Store map reference
      mapRef.current = map;
      
      // Fix Leaflet default icons
      fixLeafletIcons();
      
      // Add custom controls
      addMapControls(map);
      
      // Set up event handlers
      setupMapEventHandlers(map);
      
      // Set map as ready
      setMapReady(true);
      console.log('Map: Map is ready');
      
      // Set loading state to false
      setIsLoading(false);

      setMapInstance(map);

      // Perform initial fetch ONLY if user location is already known when map becomes ready
      if (coordinates && !messagesInitialized) {
        console.log("Map: Performing initial fetch inside map init useEffect.", coordinates);
        const radiusKm = calculateMapRadius(map.getBounds());
        getMessagesInRadius(map.getCenter(), radiusKm);
        setMessagesInitialized(true); // Mark initial fetch as done
      } else {
        console.log("Map: Skipping initial fetch in map init - user location not yet available.");
      }
    } catch (error) {
      console.error('Map: Error initializing map:', error);
      setIsLoading(false);
    }
    
    // Cleanup function
    return () => {
      if (mapRef.current) {
        console.log('Map: Cleaning up map instance');
        try {
          // Remove all event listeners and layers
          mapRef.current.eachLayer(layer => {
            mapRef.current?.removeLayer(layer);
          });
          mapRef.current.off();
          mapRef.current.remove();
          mapRef.current = null;
          
          // Reset map ready state
          setMapReady(false);
        } catch (error) {
          console.error('Map: Error during cleanup:', error);
        }
      }
    };
  }, [coordinates, zoom]);

  // Effect 2: Handle cases where user location becomes available *after* the map is ready
  useEffect(() => {
    if (mapReady && mapInstance && coordinates && !messagesInitialized) {
      console.log("Map: User location available AFTER map ready, performing initial fetch.", coordinates);
      const radiusKm = calculateMapRadius(mapInstance.getBounds());
      getMessagesInRadius(mapInstance.getCenter(), radiusKm);
      setMessagesInitialized(true);
    }
  }, [mapReady, mapInstance, coordinates, getMessagesInRadius]);

  // Add custom controls to the map
  const addMapControls = (map: L.Map) => {
    try {
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
                
                // Update user location
                if (onLocationChange) {
                  onLocationChange([lat, lng]);
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
    } catch (error) {
      console.error('Error adding map controls:', error);
    }
  };
  
  // Create and update user location marker
  useEffect(() => {
    if (!mapRef.current || !coordinates) return;

    // Remove existing marker if it exists
    if (markerRef.current) {
      markerRef.current.remove();
    }

    // Create a new marker for user location with pulsating effect
    const markerElement = document.createElement('div');
    markerElement.className = 'user-location-pulse';
    
    // Create the marker
    const marker = L.marker([coordinates[0], coordinates[1]], {
      icon: L.divIcon({
        html: `
          <div class="user-location-pulse"></div>
          <div class="user-location-center"></div>
        `,
        className: 'user-location-marker',
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      }),
      zIndexOffset: 1000 // Ensure it's above other markers
    }).addTo(mapRef.current);
    
    // Add click handler to open message creation
    marker.on('click', () => {
      console.log('Map: User location marker clicked');
      if (onBeaconClick) {
        onBeaconClick();
      }
    });
    
    // Store reference to marker
    markerRef.current = marker;
    
    console.log(`Map: Created user location marker at ${JSON.stringify(coordinates)}`);
    
    return () => {
      if (markerRef.current) {
        markerRef.current.remove();
      }
    };
  }, [mapRef, coordinates, onBeaconClick, mapReady]);

  // Set up long press detection for setting user location
  useEffect(() => {
    if (!mapRef.current) return;
    
    const map = mapRef.current;
    
    // Long press handler
    const handleLongPress = (e: L.LeafletMouseEvent) => {
      const newLocation: [number, number] = [e.latlng.lat, e.latlng.lng];
      
      if (onLocationChange) {
        onLocationChange(newLocation);
      }
      
      // Show feedback to user
      const popup = L.popup()
        .setLatLng(e.latlng)
        .setContent('Location set!')
        .openOn(map);
      
      // Close popup after 2 seconds
      setTimeout(() => {
        map.closePopup(popup);
      }, 2000);
    };
    
    const handleMapMouseDown = (e: L.LeafletMouseEvent) => {
      // Start timer for long press
      pressTimerRef.current = setTimeout(() => {
        // This is a long press, set user location
        handleLongPress(e);
      }, 500); // 500ms for long press
    };
    
    const handleMapMouseUp = () => {
      // Cancel timer if mouse is released before long press threshold
      if (pressTimerRef.current) {
        clearTimeout(pressTimerRef.current);
        pressTimerRef.current = null;
      }
    };
    
    const handleMapMouseLeave = () => {
      // Cancel timer if mouse leaves the map
      if (pressTimerRef.current) {
        clearTimeout(pressTimerRef.current);
        pressTimerRef.current = null;
      }
    };
    
    // Add event listeners
    map.on('mousedown', handleMapMouseDown);
    map.on('mouseup', handleMapMouseUp);
    map.on('mouseleave', handleMapMouseLeave);
    
    // Cleanup function
    return () => {
      if (mapRef.current) {
        mapRef.current.off('mousedown', handleMapMouseDown);
        mapRef.current.off('mouseup', handleMapMouseUp);
        mapRef.current.off('mouseleave', handleMapMouseLeave);
      }
      
      if (pressTimerRef.current) {
        clearTimeout(pressTimerRef.current);
        pressTimerRef.current = null;
      }
    };
  }, [onLocationChange]);

  // Set up map event handlers
  const setupMapEventHandlers = (map: L.Map) => {
    try {
      // Touch events for mobile
      const LONG_PRESS_DURATION = 500; // ms
      let touchTimeout: NodeJS.Timeout | null = null;
      
      // Define the long press handler
      const handleLongPress = (latLng: L.LatLng) => {
        const newLocation: [number, number] = [latLng.lat, latLng.lng];
        
        if (onLocationChange) {
          onLocationChange(newLocation);
        }
        
        // Show feedback to user
        const popup = L.popup()
          .setLatLng(latLng)
          .setContent('Location set!')
          .openOn(map);
        
        // Close popup after 2 seconds
        setTimeout(() => {
          map.closePopup(popup);
        }, 2000);
      };
      
      // Handle map events for long press
      const handleMouseDown = (e: L.LeafletMouseEvent) => {
        // Start timer for long press
        pressTimerRef.current = setTimeout(() => {
          isLongPressRef.current = true;
          handleLongPress(e.latlng);
        }, LONG_PRESS_DURATION);
      };
      
      // Handle release events
      const handleRelease = () => {
        // Clear timer if press is released before threshold
        if (pressTimerRef.current) {
          clearTimeout(pressTimerRef.current);
          pressTimerRef.current = null;
        }
        // Reset long press flag after a short delay
        setTimeout(() => {
          isLongPressRef.current = false;
        }, 100);
      };
      
      // Handle click events
      const handleClick = (e: L.LeafletMouseEvent) => {
        // Only process click if it's not part of a long press
        if (!isLongPressRef.current) {
          // Handle normal click behavior
          // ...
        }
      };
      
      // Add event listeners
      map.on('mousedown', handleMouseDown);
      map.on('mouseup', handleRelease);
      map.on('mouseleave', handleRelease);
      map.on('click', handleClick);
      
      // Store cleanup function on the map instance for later use
      (map as any)._eventCleanup = () => {
        map.off('mousedown', handleMouseDown);
        map.off('mouseup', handleRelease);
        map.off('mouseleave', handleRelease);
        map.off('click', handleClick);
      };
    } catch (error) {
      console.error('Error setting up map event handlers:', error);
    }
  };
  
  // Handle message count changes to decide which layer to show
  const handleMessageCountChange = (count: number) => {
    console.log('Map: Message count changed to', count);
    
    // Update state
    setMessageCount(count);
    
    // Notify parent component if callback is provided
    if (onMessageCountChange) {
      onMessageCountChange(count);
    }
    
    // Decide which layer to show based on message count
    // Show detailed markers for 12 or fewer messages, otherwise show heatmap
    const shouldShowHeatmap = count > 12;
    console.log(`Map: Should show heatmap? ${shouldShowHeatmap} (${count} messages)`);
    
    if (shouldShowHeatmap !== showHeatmap) {
      console.log(`Map: Switching to ${shouldShowHeatmap ? 'heatmap' : 'marker'} view`);
      setShowHeatmap(shouldShowHeatmap);
    }
  };

  const updateDisplayMode = (count: number) => {
    const shouldShowHeatmap = count > 12;
    if (shouldShowHeatmap !== showHeatmap) {
      console.log(`Map: Switching to ${shouldShowHeatmap ? 'heatmap' : 'marker'} view`);
      setShowHeatmap(shouldShowHeatmap);
    }
  };

  return (
    <div className={`map-container`}>
      {isLoading && (
        <div className="map-loading-overlay">
          <div className="map-loading-spinner"></div>
          <div className="map-loading-text">Loading map...</div>
        </div>
      )}
      
      {isMessagesLoading && mapReady && (
        <div className="messages-loading-indicator">
          <div className="messages-loading-spinner"></div>
        </div>
      )}
      
      <div 
        id="map-container" 
        ref={mapContainerRef}
        className="leaflet-container"
        style={{ width: '100%', height: '100%' }}
      />
      
      {mapReady && (
        <>
          {console.log(`Map: Rendering ${showHeatmap ? 'heatmap' : 'message'} layer with ${visibleMessages.length} messages`)}
          {showHeatmap ? (
            <HeatmapLayer 
              map={mapInstance}
              messages={visibleMessages}
              onHeatmapReady={(isReady) => {
                console.log(`Map: Heatmap ready: ${isReady}`);
              }}
              onZoomToLocation={(lat, lng) => {
                mapInstance?.setView([lat, lng], 15);
                setShowHeatmap(false);
              }}
            />
          ) : (
            <MessageLayer 
              map={mapInstance}
              onMessageClick={(message: Message) => {
                console.log('Map: Message clicked:', message);
                if (onMessageClick) {
                  onMessageClick(message);
                }
              }}
              onMessagesUpdate={(messages: Message[]) => {
                console.log('Map: Messages updated in layer:', messages.length);
                setVisibleMessages(messages);
                setMessageCount(messages.length);
                
                // Call the parent's onMessageCountChange if provided
                if (onMessageCountChange) {
                  onMessageCountChange(messages.length);
                }
                
                // Auto-switch between heatmap and marker view based on message count
                updateDisplayMode(messages.length);
              }}
            />
          )}
        </>
      )}
    </div>
  );
}
