import { Message, Reply } from '../utils/types';

// Base API URL
const API_BASE_URL = '/api';

// Fetch messages within a radius of a location
export async function fetchMessagesInRadius(lat: number, lng: number, radius: number = 20000): Promise<Message[]> {
  try {
    console.log(`apiService: Fetching messages at [${lat}, ${lng}] with radius ${radius}km (global search)`);
    
    const response = await fetch(
      `${API_BASE_URL}/messages?lat=${lat}&lng=${lng}&radius=${radius}`,
      { method: 'GET' }
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch messages');
    }
    
    const messages = await response.json();
    console.log(`apiService: Received ${messages.length} messages from API with radius ${radius}km`);
    
    return messages;
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
export async function createMessage(header: string, content: string, lat: number, lng: number): Promise<Message | null> {
  try {
    console.log(`apiService: Creating message "${header}" at [${lat}, ${lng}]`);
    
    const response = await fetch(`${API_BASE_URL}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        header: header,
        content: content, 
        location: { lat: lat, lng: lng } 
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create message');
    }
    
    // The API now returns the full message object
    const newMessage = await response.json();
    console.log(`apiService: Message created successfully:`, newMessage);
    return newMessage;

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

// Delete a message by ID
export async function deleteMessage(messageId: string): Promise<boolean> {
  try {
    console.log(`apiService: Deleting message ${messageId}`);
    const response = await fetch(`${API_BASE_URL}/messages/${messageId}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})); 
      console.error(`apiService: Failed to delete message ${messageId}. Status: ${response.status}, Error: ${errorData.error || 'Unknown error'}`);
      throw new Error(errorData.error || `Failed to delete message (status ${response.status})`);
    }

    console.log(`apiService: Message ${messageId} deleted successfully`);
    return true; 
  } catch (error) {
    console.error('Error deleting message:', error);
    return false; 
  }
}
