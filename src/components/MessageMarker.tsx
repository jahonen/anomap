'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Message } from '../utils/types';
import { getMessageOpacity } from '../utils/mapUtils';

// Temporary basic versions of helper functions (replace later if needed)
const getMessageColor = (message: Message): string => '#3b82f6'; // Default blue

interface MessageMarkerProps {
  message: Message;
  map: L.Map;
  onClick?: (message: Message) => void;
}

export default function MessageMarker({ message, map, onClick }: MessageMarkerProps) {
  const markerRef = useRef<L.Marker | null>(null);
  const popupRef = useRef<L.Popup | null>(null);

  useEffect(() => {
    if (!map) return;

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

    // Validate coordinates
    if (typeof lat !== 'number' || isNaN(lat) || typeof lng !== 'number' || isNaN(lng)) {
        console.warn('MessageMarker - Invalid location for message:', message.id, message.location);
        return; // Don't create marker if location is invalid
    }

    console.log('MessageMarker - Creating/updating marker for message:', message.header);

    // Create marker if it doesn't exist
    if (!markerRef.current) {
      // Create custom message flag icon
      const color = getMessageColor(message);
      const opacity = getMessageOpacity(message);
      
      console.log(`MessageMarker - Creating new flag marker at [${lat}, ${lng}] with color ${color} and opacity ${opacity}`);
      
      const flagIcon = L.divIcon({
        className: 'message-flag-icon',
        html: `
          <div class="message-flag" style="opacity: ${opacity};">
            <div class="message-flag-pole"></div>
            <div class="message-flag-content" style="background-color: ${color};">
              <span class="message-flag-header">${message.header}</span>
              <span class="message-flag-replies">${message.replyCount}</span>
            </div>
          </div>
        `,
        iconSize: [140, 80],
        iconAnchor: [10, 80]
      });

      // Create popup with message content
      const popup = L.popup({
        className: 'message-popup',
        offset: [15, -25]
      }).setContent(`
        <div class="message-popup-header">${message.header}</div>
        <div class="message-popup-content">${message.content}</div>
        <div class="message-popup-footer">
          <span>${message.replyCount} ${message.replyCount === 1 ? 'reply' : 'replies'}</span>
        </div>
      `);

      // Create marker with the custom icon
      const marker = L.marker([lat, lng], {
        icon: flagIcon,
        riseOnHover: true,
        zIndexOffset: 1000 // Ensure message markers are above the user location marker
      }).addTo(map);

      // Bind popup to marker
      marker.bindPopup(popup);

      // Add click handler
      marker.on('click', () => {
        if (onClick) {
          onClick(message);
        }
      });

      // Store references
      markerRef.current = marker;
      popupRef.current = popup;
    } else {
      // Update existing marker
      const color = getMessageColor(message);
      const opacity = getMessageOpacity(message);
      
      console.log(`MessageMarker - Updating marker for ${message.header} with color ${color} and opacity ${opacity}`);
      
      // Update icon
      const updatedIcon = L.divIcon({
        className: 'message-flag-icon',
        html: `
          <div class="message-flag" style="opacity: ${opacity};">
            <div class="message-flag-pole"></div>
            <div class="message-flag-content" style="background-color: ${color};">
              <span class="message-flag-header">${message.header}</span>
              <span class="message-flag-replies">${message.replyCount}</span>
            </div>
          </div>
        `,
        iconSize: [140, 80],
        iconAnchor: [10, 80]
      });
      
      markerRef.current.setIcon(updatedIcon);
      markerRef.current.setLatLng([lat, lng]); // Update position just in case
      
      // Update popup content
      if (popupRef.current) {
        const newPopupContent = `
          <div class="message-popup-header">${message.header}</div>
          <div class="message-popup-content">${message.content}</div>
          <div class="message-popup-footer">
            <span>${message.replyCount} ${message.replyCount === 1 ? 'reply' : 'replies'}</span>
          </div>
        `;
        popupRef.current.setContent(newPopupContent);
      }
    }

    // Cleanup function to remove marker when component unmounts or message changes
    return () => {
      if (markerRef.current && map) {
        console.log('MessageMarker - Removing marker for message:', message.header);
        map.removeLayer(markerRef.current);
        markerRef.current = null;
        popupRef.current = null;
      }
    };
  }, [message, map, onClick]); // Re-run effect if message, map, or onClick changes

  // Component doesn't render anything itself, it manages the Leaflet marker
  return null;
}
