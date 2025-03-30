'use client';

import React, { createContext, useContext, useEffect, useReducer, useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import * as apiService from '../services/apiService';
import { Message, Reply } from '../utils/types'; 
import L from 'leaflet'; 

// Define the location type used within Message
type MessageLocation = [number, number] | { lat: number; lng: number };

// Default message lifetime in milliseconds (24 hours)
const DEFAULT_MESSAGE_LIFETIME_MS = 24 * 60 * 60 * 1000;

// Action types for reducer (using imported Message/Reply)
type MessagesAction =
  | { type: 'ADD_MESSAGE'; payload: Message }
  | { type: 'ADD_REPLY'; payload: { messageId: string; reply: Reply } }
  | { type: 'DELETE_MESSAGE'; payload: string } // messageId
  | { type: 'SET_MESSAGES'; payload: Message[] };

// Reducer function for messages
function messagesReducer(state: Message[], action: MessagesAction): Message[] {
  switch (action.type) {
    case 'ADD_MESSAGE':
      // Avoid adding duplicates if the message already exists
      if (state.some(msg => msg.id === action.payload.id)) {
        return state;
      }
      return [...state, action.payload];
      
    case 'ADD_REPLY': {
      const { messageId, reply } = action.payload;
      return state.map(message => {
        if (message.id === messageId) {
          const currentReplies = message.replies || []; // Handle optional replies
          const updatedReplies = [...currentReplies, reply];
          return {
            ...message,
            replies: updatedReplies,
            replyCount: updatedReplies.length // Update reply count
          };
        }
        return message;
      });
    }
      
    case 'DELETE_MESSAGE':
      return state.filter(message => message.id !== action.payload);
      
    case 'SET_MESSAGES':
      // Replace the entire state, potentially filtering duplicates or merging if needed
      // Basic replacement for now:
      return action.payload;
      
    default:
      return state;
  }
}

// Context interface (using imported Message)
interface MessagesContextType {
  messages: Message[];
  loading: boolean; // Expose loading state
  error: string | null; // Expose error state
  addMessage: (header: string, content: string, location: MessageLocation) => Promise<Message | null>; 
  addReply: (messageId: string, text: string) => Promise<boolean>;
  deleteMessage: (messageId: string) => Promise<void>; // Make async
  getMessagesInRadius: (center: L.LatLng, radiusKm: number) => Promise<void>; // Adjusted signature
  getMessageById: (id: string) => Message | undefined; // Simplify return type
  // getHoursRemaining: (message: Message) => number; // Potentially remove if expiresAt is used directly
  centerMapOn: (location: MessageLocation) => void; // Function to trigger map centering
  registerMapCenterCallback: (callback: (location: MessageLocation) => void) => void; // Function to register map centering callback
}

// Create context with default values matching the type
const MessagesContext = createContext<MessagesContextType>({
  messages: [],
  loading: false,
  error: null,
  addMessage: async () => null,
  addReply: async () => false,
  deleteMessage: async () => {},
  getMessagesInRadius: async () => {},
  getMessageById: () => undefined,
  centerMapOn: () => {},
  registerMapCenterCallback: () => {},
});

// Provider component
export function MessagesProvider({ children }: { children: React.ReactNode }) {
  const [messages, dispatch] = useReducer(messagesReducer, []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mapCenterCallback, setMapCenterCallback] = useState<(location: MessageLocation) => void>(() => () => {}); 

  // Function to be called by consumers to center the map
  const centerMapOn = useCallback((location: MessageLocation) => {
      mapCenterCallback(location); // Execute the stored callback
  }, [mapCenterCallback]);

  // Function exposed to consumers to register their map centering function
  const registerMapCenterCallback = useCallback((callback: (location: MessageLocation) => void) => {
      setMapCenterCallback(() => callback); // Store the callback function
  }, []);

  // Add a new message
  const addMessage = async (header: string, content: string, location: MessageLocation): Promise<Message | null> => {
    setLoading(true);
    setError(null);
    try {
      // Extract lat/lng regardless of format
      const lat = Array.isArray(location) ? location[0] : location.lat;
      const lng = Array.isArray(location) ? location[1] : location.lng;

      console.log(`MessagesContext: Adding message "${header}" at [${lat}, ${lng}]`);
      // Assuming apiService.createMessage expects lat, lng and returns the new Message object
      const newMessage = await apiService.createMessage(header, content, lat, lng);
      
      if (newMessage) {
        dispatch({ type: 'ADD_MESSAGE', payload: newMessage });
        console.log('MessagesContext: Message added successfully', newMessage.id);
        // Optionally fetch messages again for the area, though adding should be sufficient if API is source of truth
        // await getMessagesInRadius(new L.LatLng(location.lat, location.lng), 5); 
        return newMessage;
      }
      return null;
    } catch (err) {
      console.error('MessagesContext: Error adding message:', err);
      setError('Failed to add message.');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Add a reply to a message
  const addReply = async (messageId: string, text: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      console.log(`MessagesContext: Adding reply to message ${messageId}`);
      const result = await apiService.addReplyToMessage(messageId, text);
      
      if (result) {
        console.log('MessagesContext: API response for add reply:', result);
        
        // Check if the result contains the expected data structure
        if (result.reply) {
          // Update the specific message with the new reply
          dispatch({ type: 'ADD_REPLY', payload: { messageId, reply: result.reply } });
          
          // If the API also returned the updated message with all replies, use that to ensure consistency
          if (result.message) {
            // Replace the entire message to ensure all fields are updated
            dispatch({ type: 'ADD_MESSAGE', payload: result.message });
          }
          
          console.log('MessagesContext: Reply added successfully');
          return true;
        }
      }
      console.warn('MessagesContext: Failed to add reply or API response format incorrect.');
      setError('Failed to add reply.');
      return false;
    } catch (err) {
      console.error('MessagesContext: Error adding reply:', err);
      setError('Failed to add reply.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Delete a message
  const deleteMessage = async (messageId: string): Promise<void> => {
     setLoading(true);
     setError(null);
    try {
      console.log(`MessagesContext: Deleting message ${messageId}`);
      // Assuming apiService.deleteMessage handles the API call
      const success = await apiService.deleteMessage(messageId);
      if (success) {
        dispatch({ type: 'DELETE_MESSAGE', payload: messageId });
        console.log('MessagesContext: Message deleted successfully');
      } else {
        console.warn('MessagesContext: Failed to delete message via API.');
         setError('Failed to delete message.');
      }
    } catch (err) {
      console.error('MessagesContext: Error deleting message:', err);
      setError('Failed to delete message.');
    } finally {
       setLoading(false);
    }
  };

  // Fetch messages within a given radius
  const getMessagesInRadius = useCallback(async (center: L.LatLng, radiusKm: number): Promise<void> => {
    setLoading(true);
    setError(null);
    console.log(`MessagesContext: Fetching messages for [${center.lat}, ${center.lng}] with radius ${radiusKm}km`);
    try {
      // Use the correct function name from apiService
      const fetchedMessages = await apiService.fetchMessagesInRadius(center.lat, center.lng, radiusKm); 
      console.log(`MessagesContext: Fetched ${fetchedMessages.length} messages`, fetchedMessages);
      dispatch({ type: 'SET_MESSAGES', payload: fetchedMessages });
    } catch (err) {
      console.error("MessagesContext: Error fetching messages:", err);
      setError('Failed to fetch messages. Please try again later.');
      dispatch({ type: 'SET_MESSAGES', payload: [] }); // Clear messages on error
    } finally {
      setLoading(false);
    }
  }, []);

  // Get a specific message by ID from the current state
  const getMessageById = useCallback((id: string): Message | undefined => {
    return messages.find(message => message.id === id);
  }, [messages]);

  const contextValue = {
    messages,
    loading,
    error,
    addMessage,
    addReply,
    deleteMessage,
    getMessagesInRadius,
    getMessageById,
    centerMapOn, // Expose the centering function
    registerMapCenterCallback // Expose the registration function
  };

  return (
    <MessagesContext.Provider value={contextValue}>
      {children}
    </MessagesContext.Provider>
  );
}

// Custom hook to use the context
export function useMessages() {
  const context = useContext(MessagesContext);
  if (!context) {
    throw new Error('useMessages must be used within a MessagesProvider');
  }
  return context;
}
