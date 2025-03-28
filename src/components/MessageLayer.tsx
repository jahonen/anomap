'use client';

import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import L from 'leaflet';
import MessageMarker from './MessageMarker';
import { Message } from '../services/messageService';
import { RootState } from '../redux/store';
import { calculateDistance } from '../services/messageService';

interface MessageLayerProps {
  map: L.Map | null;
  center: [number, number];
  radius?: number;
  onMessageClick?: (message: Message) => void;
}

// Convert Redux message format to our Message format
const convertReduxMessage = (reduxMessage: any, center: [number, number]): Message => {
  return {
    id: reduxMessage.id,
    header: reduxMessage.header || 'Untitled',
    message: reduxMessage.content,
    location: {
      lat: reduxMessage.location[0],
      lng: reduxMessage.location[1]
    },
    timestamp: new Date(reduxMessage.timestamp).getTime(),
    expiresAt: new Date(reduxMessage.timestamp).getTime() + (24 * 60 * 60 * 1000), // 24 hours from timestamp
    replyCount: reduxMessage.replies ? reduxMessage.replies.length : 0
  };
};

export default function MessageLayer({ 
  map, 
  center, 
  radius = 3, 
  onMessageClick 
}: MessageLayerProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  
  // Get messages from Redux store
  let reduxMessages: any[] = [];
  try {
    reduxMessages = useSelector((state: RootState) => state.messages.messages) || [];
  } catch (error) {
    console.log('MessageLayer - Redux not available yet:', error);
  }
  
  console.log('MessageLayer rendered - map exists:', !!map, 'center:', center, 'Redux messages:', reduxMessages.length);
  
  // Fetch messages when map or center changes
  useEffect(() => {
    if (!map || !center) {
      console.log('MessageLayer - Map or center not available yet');
      return;
    }
    
    console.log('MessageLayer - Fetching messages at center:', center, 'with radius:', radius);
    
    // Get messages from Redux store within radius
    const nearbyReduxMessages = reduxMessages
      .filter(msg => {
        const distance = calculateDistance(
          center[0], center[1],
          msg.location[0], msg.location[1]
        );
        return distance <= radius;
      })
      .map(msg => convertReduxMessage(msg, center));
    
    console.log('MessageLayer - Found messages:', nearbyReduxMessages.length);
    
    setMessages(nearbyReduxMessages);
    
    // Set up interval to refresh messages (for updating opacity)
    const intervalId = setInterval(() => {
      console.log('MessageLayer - Refreshing messages (interval)');
      
      const updatedReduxMessages = reduxMessages
        .filter(msg => {
          const distance = calculateDistance(
            center[0], center[1],
            msg.location[0], msg.location[1]
          );
          return distance <= radius;
        })
        .map(msg => convertReduxMessage(msg, center));
      
      setMessages(updatedReduxMessages);
    }, 60000); // Refresh every minute
    
    return () => {
      console.log('MessageLayer - Cleaning up interval');
      clearInterval(intervalId);
    };
  }, [map, center, radius, reduxMessages]);
  
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
