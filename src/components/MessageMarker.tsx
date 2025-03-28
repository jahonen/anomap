'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Message, getMessageColor, getMessageOpacity } from '../services/messageService';

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

    console.log('MessageMarker - Creating/updating marker for message:', message.header);

    // Create marker if it doesn't exist
    if (!markerRef.current) {
      // Create custom message flag icon
      const color = getMessageColor(message);
      const opacity = getMessageOpacity(message);
      
      console.log(`MessageMarker - Creating new flag marker at [${message.location.lat}, ${message.location.lng}] with color ${color} and opacity ${opacity}`);
      
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
        <div class="message-popup-content">${message.message}</div>
        <div class="message-popup-footer">
          <span>${message.replyCount} ${message.replyCount === 1 ? 'reply' : 'replies'}</span>
        </div>
      `);

      // Create marker with the custom icon
      const marker = L.marker([message.location.lat, message.location.lng], {
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
      
      // Update popup content
      if (popupRef.current) {
        popupRef.current.setContent(`
          <div class="message-popup-header">${message.header}</div>
          <div class="message-popup-content">${message.message}</div>
          <div class="message-popup-footer">
            <span>${message.replyCount} ${message.replyCount === 1 ? 'reply' : 'replies'}</span>
          </div>
        `);
      }
    }

    // Cleanup function
    return () => {
      if (markerRef.current) {
        console.log(`MessageMarker - Removing marker for ${message.header}`);
        markerRef.current.remove();
        markerRef.current = null;
        popupRef.current = null;
      }
    };
  }, [map, message, onClick]);

  // This component doesn't render anything directly
  return null;
}
