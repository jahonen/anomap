'use client';

import { useEffect, useState } from 'react';
import L from 'leaflet';
import MessageMarker from './MessageMarker';
import { Message, getMessagesInRadius } from '../services/messageService';

interface MessageLayerProps {
  map: L.Map | null;
  center: [number, number];
  radius?: number;
  onMessageClick?: (message: Message) => void;
}

export default function MessageLayer({ 
  map, 
  center, 
  radius = 3, 
  onMessageClick 
}: MessageLayerProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  
  console.log('MessageLayer rendered - map exists:', !!map, 'center:', center);
  
  // Fetch messages when map or center changes
  useEffect(() => {
    if (!map || !center) {
      console.log('MessageLayer - Map or center not available yet');
      return;
    }
    
    console.log('MessageLayer - Fetching messages at center:', center, 'with radius:', radius);
    
    // Get messages in radius
    const nearbyMessages = getMessagesInRadius(center[0], center[1], radius);
    console.log('MessageLayer - Found messages:', nearbyMessages.length);
    setMessages(nearbyMessages);
    
    // Set up interval to refresh messages (for updating opacity)
    const intervalId = setInterval(() => {
      console.log('MessageLayer - Refreshing messages (interval)');
      const updatedMessages = getMessagesInRadius(center[0], center[1], radius);
      setMessages(updatedMessages);
    }, 60000); // Refresh every minute
    
    return () => {
      console.log('MessageLayer - Cleaning up interval');
      clearInterval(intervalId);
    };
  }, [map, center, radius]);
  
  // Handle message click
  const handleMessageClick = (message: Message) => {
    console.log('MessageLayer - Message clicked:', message.header);
    if (onMessageClick) {
      onMessageClick(message);
    }
  };
  
  // Render message markers
  console.log('MessageLayer - Rendering', messages.length, 'message markers');
  
  return (
    <>
      {map && messages.map(message => (
        <MessageMarker
          key={message.id}
          message={message}
          map={map}
          onClick={handleMessageClick}
        />
      ))}
    </>
  );
}
