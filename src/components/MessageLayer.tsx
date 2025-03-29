'use client';

import { useEffect, useState } from 'react';
import L from 'leaflet';
import { Message } from '../services/messageService';
import { useMessages, getMessageColor, getMessageOpacity } from '../contexts/MessagesContext';

interface MessageLayerProps {
  map: L.Map | null;
  center: [number, number];
  radius?: number;
  onMessageClick?: (message: Message) => void;
}

// Convert Context message format to our Message format
const convertContextMessage = (contextMessage: any): Message => {
  return {
    id: contextMessage.id,
    header: contextMessage.header || 'Untitled',
    message: contextMessage.message,
    location: contextMessage.location,
    timestamp: contextMessage.timestamp,
    expiresAt: contextMessage.expiresAt,
    replyCount: contextMessage.replyCount || (contextMessage.replies ? contextMessage.replies.length : 0),
    replies: contextMessage.replies || []
  };
};

export default function MessageLayer({ 
  map, 
  center, 
  radius = 3, 
  onMessageClick 
}: MessageLayerProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  
  // Get messages from Context
  const { getMessagesInRadius } = useMessages();
  
  console.log('MessageLayer rendered - map exists:', !!map, 'center:', center);
  
  // Fetch messages when map or center changes
  useEffect(() => {
    if (!map || !center) {
      console.log('MessageLayer - Map or center not available yet');
      return;
    }
    
    console.log('MessageLayer - Fetching messages at center:', center, 'with radius:', radius);
    
    // Get messages from Context within radius - now using async function
    const fetchMessages = async () => {
      try {
        const nearbyMessages = await getMessagesInRadius(center[0], center[1], radius);
        console.log('MessageLayer - Found messages:', nearbyMessages.length);
        setMessages(nearbyMessages.map(msg => convertContextMessage(msg)));
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };
    
    // Initial fetch
    fetchMessages();
    
    // Set up interval to refresh messages (for updating opacity)
    const intervalId = setInterval(() => {
      console.log('MessageLayer - Refreshing messages (interval)');
      fetchMessages();
    }, 60000); // Refresh every minute
    
    return () => {
      console.log('MessageLayer - Cleaning up interval');
      clearInterval(intervalId);
    };
  }, [map, center, radius, getMessagesInRadius]);
  
  // Handle message click
  const handleMessageClick = (message: Message) => {
    console.log('MessageLayer - Message clicked:', message);
    if (onMessageClick) {
      onMessageClick(message);
    }
  };
  
  // Add markers to map when messages change
  useEffect(() => {
    if (!map) return;
    
    console.log('MessageLayer - Adding markers to map:', messages.length);
    
    // Create a layer group for all message markers
    const markersGroup = L.layerGroup().addTo(map);
    
    // Add a marker for each message
    messages.forEach(message => {
      // Get message styling
      const color = getMessageColor(message);
      const opacity = getMessageOpacity(message);
      
      // Create custom message flag icon
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
      
      // Create marker with the custom icon
      const marker = L.marker([message.location.lat, message.location.lng], {
        icon: flagIcon,
        riseOnHover: true,
        zIndexOffset: 1000 // Ensure message markers are above other markers
      }).addTo(markersGroup);
      
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
      
      // Bind popup to marker
      marker.bindPopup(popup);
      
      // Add click handler
      marker.on('click', () => handleMessageClick(message));
    });
    
    // Cleanup function to remove markers when component unmounts or messages change
    return () => {
      console.log('MessageLayer - Removing markers from map');
      map.removeLayer(markersGroup);
    };
  }, [map, messages, onMessageClick]);
  
  return null; // This component doesn't render anything directly
}
