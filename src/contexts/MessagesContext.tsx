'use client';

import React, { createContext, useContext, useEffect, useReducer, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { fetchMessagesInRadius, createMessage, addReplyToMessage, getMessageById as apiGetMessageById } from '../services/apiService';

// Message interface
export interface Message {
  id: string;
  header: string;
  message: string;
  location: {
    lat: number;
    lng: number;
  };
  timestamp: number;
  expiresAt: number; // Timestamp when the message expires (24 hours after creation)
  replyCount: number;
  replies: Array<{
    id: string;
    text: string;
    timestamp: number;
  }>;
}

// Reply interface
export interface Reply {
  id: string;
  text: string;
  timestamp: number;
}

// Default message lifetime in milliseconds (24 hours)
const DEFAULT_MESSAGE_LIFETIME_MS = 24 * 60 * 60 * 1000;

// Action types for reducer
type MessagesAction =
  | { type: 'ADD_MESSAGE'; payload: Message }
  | { type: 'ADD_REPLY'; payload: { messageId: string; reply: Reply } }
  | { type: 'DELETE_MESSAGE'; payload: string } // messageId
  | { type: 'SET_MESSAGES'; payload: Message[] };

// Reducer function for messages
function messagesReducer(state: Message[], action: MessagesAction): Message[] {
  switch (action.type) {
    case 'ADD_MESSAGE':
      return [...state, action.payload];
      
    case 'ADD_REPLY': {
      const { messageId, reply } = action.payload;
      return state.map(message => {
        if (message.id === messageId) {
          const updatedReplies = [...message.replies, reply];
          return {
            ...message,
            replies: updatedReplies,
            replyCount: updatedReplies.length
          };
        }
        return message;
      });
    }
      
    case 'DELETE_MESSAGE':
      return state.filter(message => message.id !== action.payload);
      
    case 'SET_MESSAGES':
      return action.payload;
      
    default:
      return state;
  }
}

// Context interface
interface MessagesContextType {
  messages: Message[];
  addMessage: (header: string, content: string, lat: number, lng: number) => Promise<Message | null>;
  addReply: (messageId: string, text: string) => Promise<boolean>;
  deleteMessage: (messageId: string) => void;
  getMessagesInRadius: (lat: number, lng: number, radius?: number) => Promise<Message[]>;
  getMessageById: (id: string) => Promise<Message | undefined>;
  getHoursRemaining: (message: Message) => number;
}

// Create context
const MessagesContext = createContext<MessagesContextType>({
  messages: [],
  addMessage: async () => null,
  addReply: async () => false,
  deleteMessage: () => {},
  getMessagesInRadius: async () => [],
  getMessageById: async () => undefined,
  getHoursRemaining: () => 0
});

// Calculate distance between two points using Haversine formula
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

// Convert degrees to radians
function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

// Provider component
export function MessagesProvider({ children }: { children: React.ReactNode }) {
  const [messages, dispatch] = useReducer(messagesReducer, []);
  const [isLoading, setIsLoading] = useState(true);

  // Add a new message
  const addMessage = async (header: string, content: string, lat: number, lng: number): Promise<Message | null> => {
    try {
      const newMessage = await createMessage(header, content, lat, lng);
      
      if (newMessage) {
        dispatch({ type: 'ADD_MESSAGE', payload: newMessage });
        return newMessage;
      }
      
      return null;
    } catch (error) {
      console.error('Error adding message:', error);
      return null;
    }
  };

  // Add a reply to a message
  const addReply = async (messageId: string, text: string): Promise<boolean> => {
    try {
      const result = await addReplyToMessage(messageId, text);
      
      if (result) {
        dispatch({
          type: 'ADD_REPLY',
          payload: { messageId, reply: result.reply }
        });
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error adding reply:', error);
      return false;
    }
  };

  // Delete a message
  const deleteMessage = (messageId: string) => {
    dispatch({ type: 'DELETE_MESSAGE', payload: messageId });
  };

  // Get messages within a radius of a location
  const getMessagesInRadius = async (lat: number, lng: number, radius: number = 3): Promise<Message[]> => {
    try {
      const messagesInRadius = await fetchMessagesInRadius(lat, lng, radius);
      
      // Update local state with fetched messages
      dispatch({ type: 'SET_MESSAGES', payload: messagesInRadius });
      
      return messagesInRadius;
    } catch (error) {
      console.error('Error fetching messages in radius:', error);
      return [];
    }
  };

  // Get a message by ID
  const getMessageById = async (id: string): Promise<Message | undefined> => {
    try {
      const message = await apiGetMessageById(id);
      return message || undefined;
    } catch (error) {
      console.error('Error getting message by ID:', error);
      return undefined;
    }
  };

  // Calculate hours remaining before message expires
  const getHoursRemaining = (message: Message): number => {
    const now = Date.now();
    const timeRemaining = message.expiresAt - now;
    return Math.max(0, timeRemaining / (1000 * 60 * 60));
  };

  // Context value
  const contextValue: MessagesContextType = {
    messages,
    addMessage,
    addReply,
    deleteMessage,
    getMessagesInRadius,
    getMessageById,
    getHoursRemaining
  };

  return (
    <MessagesContext.Provider value={contextValue}>
      {children}
    </MessagesContext.Provider>
  );
}

// Custom hook to use the messages context
export function useMessages() {
  const context = useContext(MessagesContext);
  if (!context) {
    throw new Error('useMessages must be used within a MessagesProvider');
  }
  return context;
}

// Helper functions for message styling
export function getMessageOpacity(message: Message): number {
  const hoursRemaining = (message.expiresAt - Date.now()) / (1000 * 60 * 60);
  const totalHours = DEFAULT_MESSAGE_LIFETIME_MS / (1000 * 60 * 60);
  const opacity = Math.max(0.4, Math.min(1, hoursRemaining / totalHours));
  return opacity;
}

export function getMessageColor(message: Message): string {
  // Color based on reply count
  const replyCount = message.replyCount || 0;
  
  if (replyCount === 0) return '#3b82f6'; // Blue
  if (replyCount < 3) return '#60a5fa'; // Light blue
  if (replyCount < 5) return '#8b5cf6'; // Purple
  if (replyCount < 10) return '#f59e0b'; // Amber
  return '#ef4444'; // Red for very active messages
}
