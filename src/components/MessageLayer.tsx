import React, { useEffect, useState, useRef, useCallback } from 'react';
import L from 'leaflet';
import { debounce } from 'lodash';
import { useMessages } from '../contexts/MessagesContext';
import { Message } from '../utils/types'; 
import { formatMessageAge } from '../utils/formatters'; 
import { calculateMapRadius, isMessageInBounds } from '../utils/mapUtils'; 
import { createFlagpoleIcon } from './FlagpoleMarkerIcon';

interface MessageLayerProps {
  map: L.Map;
  onMessageClick?: (message: Message) => void;
  onMessagesUpdate?: (messages: Message[]) => void; // New prop to notify parent of visible messages
}

const convertToStandardMessage = (contextMessage: any): Message | null => {
  try {
    if (!contextMessage || !contextMessage.id || (!contextMessage.message && !contextMessage.content) || !contextMessage.location)
    {
      console.warn("MessageLayer: Invalid message structure received from context, skipping:", contextMessage);
      return null;
    }

    let lat: number | undefined;
    let lng: number | undefined;

    if (Array.isArray(contextMessage.location) && contextMessage.location.length >= 2) {
      lat = contextMessage.location[0];
      lng = contextMessage.location[1];
    } else if (contextMessage.location && typeof contextMessage.location === 'object') {
      if ('lat' in contextMessage.location && 'lng' in contextMessage.location) {
        lat = contextMessage.location.lat;
        lng = contextMessage.location.lng;
      }
    }

    if (typeof lat !== 'number' || isNaN(lat) || typeof lng !== 'number' || isNaN(lng)) {
      console.warn("MessageLayer: Invalid location coordinates in context message, skipping:", contextMessage);
      return null;
    }

    const timestamp = typeof contextMessage.timestamp === 'number'
      ? new Date(contextMessage.timestamp).toISOString()
      : contextMessage.timestamp; 

    if (isNaN(new Date(timestamp).getTime())) {
        console.warn("MessageLayer: Invalid timestamp in context message, skipping:", contextMessage);
        return null;
    }

    return {
      id: contextMessage.id,
      header: contextMessage.header,
      content: contextMessage.content || contextMessage.message, 
      location: { lat, lng }, 
      timestamp: timestamp,
      burnRate: contextMessage.burnRate ?? 0, 
      replies: contextMessage.replies || [], 
    };
  } catch (error) {
    console.error("MessageLayer: Error converting context message:", error, "Message:", contextMessage);
    return null;
  }
};

const MessageLayer: React.FC<MessageLayerProps> = ({ map, onMessageClick, onMessagesUpdate }) => {
  const { messages: contextMessages, getMessagesInRadius } = useMessages(); 
  const [visibleMessages, setVisibleMessages] = useState<Message[]>([]);
  const layerGroupRef = useRef<L.LayerGroup>(L.layerGroup()); // Use a layer group for markers
  const isFetchingRef = useRef(false);

  const debouncedFetchMessages = useCallback(
    debounce((center: L.LatLng, bounds: L.LatLngBounds) => {
      if (isFetchingRef.current) return; // Prevent overlapping fetches
      
      const radiusKm = calculateMapRadius(bounds);
      console.log(`MessageLayer: Debounced fetch triggered. Center: ${center.lat}, ${center.lng}, Radius: ${radiusKm}km`);
      isFetchingRef.current = true;
      getMessagesInRadius(center, radiusKm) // Pass center LatLng object and radius
         .finally(() => {
             isFetchingRef.current = false;
          });
    }, 300), // 300ms debounce delay
    [getMessagesInRadius] // Update dependency
  );

  // Effect to add/remove the main layer group from the map
  useEffect(() => {
    console.log("MessageLayer: Map Effect RUNNING. Map prop:", map);
    if (!map) {
      console.warn("MessageLayer: Map Effect - Map instance not available.");
      return; // Ensure map instance exists
    }

    // Check if map seems like a valid Leaflet instance
    if (typeof map.addLayer !== 'function') {
        console.error("MessageLayer: Map Effect - Invalid map object received:", map);
        return;
    }

    const layerGroup = layerGroupRef.current;
    if (!layerGroup) {
        console.error("MessageLayer: Map Effect - Layer group ref is invalid!");
        return;
    }

    console.log("MessageLayer: Map Effect - Adding marker layer group to map.");
    try {
      layerGroup.addTo(map); // The potential error point
      console.log("MessageLayer: Map Effect - Layer group added successfully.");
    } catch (error) {
        console.error("MessageLayer: Map Effect - ERROR adding layer group to map:", error, "Map:", map, "LayerGroup:", layerGroup);
    }

    // Cleanup function to remove the layer group when map changes or component unmounts
    return () => {
      console.log("MessageLayer: Map Effect CLEANUP. Map prop:", map);
      // Check map validity again in cleanup
      if (map && typeof map.hasLayer === 'function' && map.hasLayer(layerGroup)) { 
        console.log("MessageLayer: Map Effect CLEANUP - Removing marker layer group from map.");
        try {
            layerGroup.remove();
            console.log("MessageLayer: Map Effect CLEANUP - Layer group removed successfully.");
        } catch (cleanupError) {
             console.error("MessageLayer: Map Effect CLEANUP - ERROR removing layer group:", cleanupError, "Map:", map, "LayerGroup:", layerGroup);
        }
      } else {
         console.warn("MessageLayer: Map Effect CLEANUP - Map invalid or layer not found, skipping remove.", "Map:", map, "LayerGroup:", layerGroup);
      }
    };
  }, [map]); // This effect runs only when the map instance changes

  // Effect to update markers within the layer group when visibleMessages change
  useEffect(() => {
    console.log(`MessageLayer: Marker Update Effect RUNNING. Visible messages: ${visibleMessages.length}. Map prop:`, map);
    // Note: No need to check for map here if the above effect handles adding/removing the group
    // However, map is still needed for marker creation logic below, so keep the check
    if (!map) {
        console.warn("MessageLayer: Marker Update Effect - Map instance not available.");
        return;
    }
    if (typeof map.addLayer !== 'function') { // Extra check
        console.error("MessageLayer: Marker Update Effect - Invalid map object received:", map);
        return;
    }

    const layerGroup = layerGroupRef.current;
    if (!layerGroup) {
        console.error("MessageLayer: Marker Update Effect - Layer group ref is invalid!");
        return;
    }
    
    console.log(`MessageLayer: Marker Update Effect - Clearing ${layerGroup.getLayers().length} existing markers.`);
    layerGroup.clearLayers(); // Clear existing markers

    console.log(`MessageLayer: Marker Update Effect - Updating markers for ${visibleMessages.length} visible messages.`);
    visibleMessages.forEach(message => {
      try {
        // Extract lat/lng, handling both array and object formats
        let lat: number;
        let lng: number;
        
        if (Array.isArray(message.location)) {
          lat = message.location[0];
          lng = message.location[1];
        } else {
          lat = message.location.lat;
          lng = message.location.lng;
        }
        
        const markerLatLng = L.latLng(lat, lng);
        // Use our custom flagpole icon, passing header
        const icon = createFlagpoleIcon(message.replies?.length || 0, message.header || 'Message');
        const marker = L.marker(markerLatLng, { icon: icon });

        // Add popup with message info
        const popupContent = `
          <b>${message.header || 'Message'}</b><br>
          ${message.content.substring(0, 50)}${message.content.length > 50 ? '...' : ''}<br>
          <small>Age: ${formatMessageAge(new Date(message.timestamp))}</small><br>
          <small>Replies: ${message.replies?.length || 0}</small>
        `;
        marker.bindPopup(popupContent);

        marker.on('click', () => {
          console.log("MessageLayer: Marker clicked:", message.id);
          onMessageClick?.(message);
        });

        layerGroup.addLayer(marker);
      } catch(error) {
        console.error("MessageLayer: Error creating marker for message:", message.id, error);
      }
    });

    // Notify parent component about visible messages
    onMessagesUpdate?.(visibleMessages);

  }, [visibleMessages, map, onMessageClick, onMessagesUpdate]); // Dependencies

  // Effect to update visibleMessages when contextMessages change
  useEffect(() => {
    console.log("MessageLayer: Context Update Effect RUNNING. Context messages count:", contextMessages.length);
    if (!map) {
        console.warn("MessageLayer: Context Update Effect - Map instance not available for bounds check.");
        return; // Guard against map not being ready
    }
    const bounds = map.getBounds();
    // Log raw context messages
    console.log("MessageLayer: Raw contextMessages received:", contextMessages);
    const standardMessages = contextMessages
        .map(convertToStandardMessage)
        .filter((msg): msg is Message => msg !== null); 

    const currentlyVisible = standardMessages.filter(msg => 
      isMessageInBounds(msg, bounds)
    );
    setVisibleMessages(currentlyVisible);
    console.log(`MessageLayer: Context messages updated. Total: ${standardMessages.length}, Visible: ${currentlyVisible.length}`);
  }, [contextMessages, map]); 

  // Effect to handle map events for fetching messages
  useEffect(() => {
    console.log("MessageLayer: Fetch Event Setup Effect RUNNING. Map prop:", map);
    if (!map) {
        console.warn("MessageLayer: Fetch Event Setup Effect - Map instance not available.");
        return; // Ensure map instance exists
    }

    const handleMoveEnd = (e: L.LeafletEvent) => {
      console.log("MessageLayer: Map moveend event (manual listener)");
      const mapInstance = e.target as L.Map;
      debouncedFetchMessages(mapInstance.getCenter(), mapInstance.getBounds());
    };

    const handleZoomEnd = (e: L.LeafletEvent) => {
      console.log("MessageLayer: Map zoomend event (manual listener)");
      const mapInstance = e.target as L.Map;
      debouncedFetchMessages(mapInstance.getCenter(), mapInstance.getBounds());
    };

    map.on('moveend', handleMoveEnd);
    map.on('zoomend', handleZoomEnd);

    // Cleanup function to remove listeners
    return () => {
      if (map) { // Check if map still exists on cleanup
        map.off('moveend', handleMoveEnd);
        map.off('zoomend', handleZoomEnd);
      }
      
      // Cancel any pending debounced calls
      debouncedFetchMessages.cancel();
    };
  }, [map, debouncedFetchMessages]); // Re-run if map instance or fetch function changes

  // Return null - markers are added directly via Leaflet API
  return null;
};

export default MessageLayer;
