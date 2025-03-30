import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet.heat';
import { debounce } from 'lodash';
import { Message } from '../utils/types';

// Extend the Leaflet namespace to include the heatLayer function
declare global {
  interface HeatLayer extends L.Layer {
    setLatLngs(latlngs: [number, number, number][]): void;
    redraw(): void;
  }
  
  namespace L {
    function heatLayer(
      latlngs: [number, number, number][],
      options?: {
        minOpacity?: number;
        maxZoom?: number;
        max?: number;
        radius?: number;
        blur?: number;
        gradient?: {[key: string]: string};
      }
    ): HeatLayer;
  }
}

// Define props interface
interface HeatmapLayerProps {
  map: L.Map | null;
  messages: Message[];
  onHeatmapReady?: (isReady: boolean) => void;
  onZoomToLocation?: (lat: number, lng: number) => void;
}

// Helper function to calculate intensity based on message properties
const calculateIntensity = (message: Message): number => {
  // Base intensity
  let intensity = 0.3;
  
  // Increase intensity based on reply count (max +0.4)
  if (message.replies && message.replies.length > 0) {
    intensity += Math.min(0.4, message.replies.length / 20);
  }
  
  // Increase intensity for recent messages (max +0.3)
  const messageAge = Date.now() - new Date(message.timestamp).getTime();
  const hoursOld = messageAge / (1000 * 60 * 60);
  if (hoursOld < 6) {
    intensity += 0.3;
  } else if (hoursOld < 12) {
    intensity += 0.15;
  }
  
  return Math.min(1.0, intensity); // Cap at 1.0
};

const HeatmapLayer: React.FC<HeatmapLayerProps> = ({ map, messages, onHeatmapReady, onZoomToLocation }) => {
  // Create refs to track component state
  const heatLayerRef = useRef<L.HeatLayer | null>(null);
  const isMounted = useRef(true);
  const lastUpdateTime = useRef(0);
  const UPDATE_COOLDOWN = 1000; // 1 second cooldown between updates
  
  // Cleanup function to remove the heatmap layer
  const cleanupHeatmap = () => {
    try {
      if (heatLayerRef.current && map) {
        console.log('HeatmapLayer - Removing heatmap layer');
        map.removeLayer(heatLayerRef.current);
        heatLayerRef.current = null;
      }
    } catch (error) {
      console.error('HeatmapLayer - Error cleaning up heatmap:', error);
    }
  };
  
  // Create heatmap with the provided messages
  const createHeatmap = () => {
    if (!map || !isMounted.current) return;
    
    try {
      // Clean up existing heatmap first
      cleanupHeatmap();
      
      // Check if we have messages to display
      if (!messages || messages.length === 0) {
        console.log('HeatmapLayer - No messages to display in heatmap');
        if (onHeatmapReady) onHeatmapReady(true);
        return;
      }
      
      console.log('HeatmapLayer - Creating heatmap with messages:', messages.length);
      
      // Create heat points with intensity based on message properties
      const heatPoints: [number, number, number][] = messages
        .filter(message => {
          // Filter out messages with invalid locations
          if (!message.location) return false;
          
          if (Array.isArray(message.location)) {
            return message.location.length >= 2;
          } else if (message.location && typeof message.location === 'object') {
            return message.location.lat !== undefined && message.location.lng !== undefined;
          }
          return false;
        })
        .map(message => {
          let lat, lng;
          
          if (Array.isArray(message.location)) {
            lat = message.location[0];
            lng = message.location[1];
          } else if (message.location && typeof message.location === 'object') {
            lat = message.location.lat;
            lng = message.location.lng;
          } else {
            return [0, 0, 0]; // This should never happen due to the filter above
          }
          
          return [
            lat,
            lng,
            calculateIntensity(message)
          ];
        });
      
      console.log(`HeatmapLayer - Generated ${heatPoints.length} heat points`);
      
      if (heatPoints.length === 0) {
        console.log('HeatmapLayer - No valid heat points to display');
        if (onHeatmapReady) onHeatmapReady(true);
        return;
      }
      
      // Create the heatmap layer
      const heatLayer = L.heatLayer(heatPoints, {
        radius: 25,
        blur: 15,
        maxZoom: 17,
        gradient: {
          0.0: 'blue',
          0.3: 'lime',
          0.5: 'yellow',
          0.7: 'orange',
          1.0: 'red'
        }
      });
      
      // Add the heatmap to the map
      heatLayer.addTo(map);
      
      // Store reference to heatmap layer
      heatLayerRef.current = heatLayer;
      
      console.log('HeatmapLayer - Heatmap created successfully');
      
      // Notify that heatmap is ready
      if (onHeatmapReady) {
        onHeatmapReady(true);
      }
    } catch (error) {
      console.error('HeatmapLayer - Error creating heatmap:', error);
      if (onHeatmapReady) {
        onHeatmapReady(false);
      }
    }
  };
  
  // Handle click on heatmap to zoom in on heat concentrations
  const handleHeatmapClick = (e: L.LeafletMouseEvent) => {
    if (!map || !isMounted.current || !messages || messages.length === 0) return;
    
    try {
      const clickLat = e.latlng.lat;
      const clickLng = e.latlng.lng;
      
      // Find nearby heat points
      const nearbyPoints = messages
        .filter(message => {
          if (!message.location) {
            return false;
          }
          
          let lat, lng;
          
          if (Array.isArray(message.location)) {
            if (message.location.length < 2) return false;
            lat = message.location[0];
            lng = message.location[1];
          } else if (message.location && typeof message.location === 'object') {
            lat = message.location.lat;
            lng = message.location.lng;
          } else {
            return false;
          }
          
          const distance = Math.sqrt(
            Math.pow(lat - clickLat, 2) + Math.pow(lng - clickLng, 2)
          );
          return distance < 0.01; // Approximately 1km
        })
        .map(message => calculateIntensity(message));
      
      // If there are nearby points, zoom in
      if (nearbyPoints.length > 0) {
        console.log(`HeatmapLayer - Found ${nearbyPoints.length} nearby points, zooming in`);
        
        // If onZoomToLocation callback is provided, use it
        if (onZoomToLocation) {
          onZoomToLocation(clickLat, clickLng);
        } else {
          // Otherwise, zoom in directly
          map.setView([clickLat, clickLng], 15);
        }
      }
    } catch (error) {
      console.error('Error handling heatmap click:', error);
    }
  };
  
  // Update heatmap with debouncing to prevent excessive updates
  const updateHeatmap = debounce(() => {
    if (!map || !isMounted.current) return;
    
    // Check if we need to respect the cooldown
    const now = Date.now();
    if (now - lastUpdateTime.current < UPDATE_COOLDOWN) {
      console.log('HeatmapLayer - Update skipped due to cooldown');
      return;
    }
    
    // Update the last update time
    lastUpdateTime.current = now;
    
    try {
      console.log('HeatmapLayer - Updating heatmap');
      createHeatmap();
    } catch (error) {
      console.error('HeatmapLayer - Error updating heatmap:', error);
    }
  }, 500);
  
  // Set up the heatmap when the component mounts or when messages change
  useEffect(() => {
    if (!map) {
      console.log('HeatmapLayer - Map not available yet');
      return;
    }
    
    console.log(`HeatmapLayer - Setting up with ${messages.length} messages`);
    
    // Wait a moment for the map to be fully ready
    setTimeout(() => {
      try {
        console.log('HeatmapLayer - Creating initial heatmap');
        createHeatmap();
        
        // Add click handler for the map
        map.on('click', handleHeatmapClick);
      } catch (error) {
        console.error('HeatmapLayer - Error in initial setup:', error);
      }
    }, 100);
    
    // Cleanup function
    return () => {
      try {
        // Remove click handler if map exists
        if (map) {
          console.log('HeatmapLayer - Removing click handler');
          map.off('click', handleHeatmapClick);
        }
        
        // Cancel any pending debounced calls
        updateHeatmap.cancel();
      } catch (error) {
        console.error('HeatmapLayer - Error cleaning up event handlers:', error);
      }
    };
  }, [map, messages]);
  
  // Update heatmap when messages change
  useEffect(() => {
    if (messages && messages.length > 0) {
      console.log(`HeatmapLayer - Messages updated, now have ${messages.length} messages`);
      updateHeatmap();
    }
  }, [messages]);
  
  // Clean up when the component unmounts
  useEffect(() => {
    return () => {
      console.log('HeatmapLayer - Component unmounting');
      isMounted.current = false;
      updateHeatmap.cancel();
      cleanupHeatmap();
    };
  }, []);
  
  // The component doesn't render anything visible
  return null;
};

export default HeatmapLayer;
