import { Message, Reply } from '../contexts/MessagesContext';

// Base API URL
const API_BASE_URL = '/api';

// Fetch messages within a radius of a location
export async function fetchMessagesInRadius(lat: number, lng: number, radius: number = 3): Promise<Message[]> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/messages?lat=${lat}&lng=${lng}&radius=${radius}`,
      { method: 'GET' }
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch messages');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching messages:', error);
    return [];
  }
}

// Get a message by ID
export async function getMessageById(id: string): Promise<Message | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/messages/${id}`, {
      method: 'GET'
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch message');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching message:', error);
    return null;
  }
}

// Add a new message
export async function createMessage(header: string, message: string, lat: number, lng: number): Promise<Message | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ header, message, lat, lng })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create message');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error creating message:', error);
    return null;
  }
}

// Add a reply to a message
export async function addReplyToMessage(messageId: string, text: string): Promise<{ message: Message, reply: Reply } | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/messages/${messageId}/replies`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to add reply');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error adding reply:', error);
    return null;
  }
}
