import { Redis } from '@upstash/redis';
import { Message, Reply } from '../utils/types'; 

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

const LOCATION_KEY = 'messageLocations'; 

// Fetch messages within a radius
// NOTE: Current implementation fetches ALL messages and relies on client-side filtering (if any).
// Proper geo-filtering needs to be re-implemented if required.
export async function getMessagesInRadius(lat: number, lon: number, radiusKm: number): Promise<Message[]> {
  console.log(`RedisMessageService - Fetching message IDs near [${lat}, ${lon}] within ${radiusKm}km`);
  try {
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      console.error('RedisMessageService - Missing Redis credentials in environment variables');
      return [];
    }
    
    const url = `${process.env.UPSTASH_REDIS_REST_URL}`;
    const headers = {
      Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
      "Content-Type": "application/json",
    };

    console.log(
      `RedisMessageService - Fetching message IDs near [${lat}, ${lon}] within ${radiusKm}km using GEORADIUS`
    );

    let messageIds: string[] = [];
    try {
      // Use GEORADIUS via fetch to find message IDs within the specified radius
      const radiusMeters = radiusKm * 1000;
      const georadiusResponse = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify([
          "GEORADIUS",
          LOCATION_KEY,
          lon.toString(),
          lat.toString(),
          radiusMeters.toString(),
          "m", // Specify radius unit as meters
          // Add any other options if needed, e.g., WITHDIST
        ]),
      });

      if (!georadiusResponse.ok) {
        const errorText = await georadiusResponse.text();
        console.error(
          `Redis GEORADIUS command failed: ${georadiusResponse.status} ${georadiusResponse.statusText}`, errorText
        );
        throw new Error('Failed to fetch message IDs from Redis via GEORADIUS');
      }

      const georadiusResult = await georadiusResponse.json();

      if (georadiusResult.error) {
        console.error("Redis GEORADIUS error:", georadiusResult.error);
        throw new Error(`Redis GEORADIUS error: ${georadiusResult.error}`);
      }

      // The result of GEORADIUS is an array of member names (our message IDs)
      messageIds = georadiusResult.result || [];
      console.log(
        `RedisMessageService - Found ${messageIds.length} message IDs within radius via GEORADIUS.`
      );

    } catch (error) {
      console.error("Error fetching message IDs from Redis via GEORADIUS:", error);
      // Depending on requirements, you might want to return empty array or re-throw
      return [];
    }

    // Fetch full message details for each ID found
    if (messageIds.length === 0) {
      return [];
    }

    console.log(
      `RedisMessageService - Getting details for ${messageIds.length} messages.`
    );
    try {
      const messagePromises = messageIds.map((id) => getMessageById(id)); // Use the existing getMessageById
      const messages = await Promise.all(messagePromises);

      // Filter out any null results (e.g., if a message hash was missing or incomplete)
      const validMessages = messages.filter((msg): msg is Message => msg !== null);
      console.log(
        `RedisMessageService - Retrieved details for ${validMessages.length} valid messages.`
      );
      return validMessages;
    } catch (error) {
      console.error("Error fetching message details:", error);
      return []; // Return empty array on error fetching details
    }

  } catch (redisError) {
    console.error('RedisMessageService - Redis command error:', redisError);
    
    // If we get a specific error about command not existing, try an alternative
    if (redisError instanceof Error && redisError.message.includes('not found')) {
      console.log('RedisMessageService - Trying alternative approach...');
      
      // Try a different command or approach here
      // For now, just return empty array
      return [];
    }
    
    // Otherwise, just return empty array
    return [];
  }
}

// Add or update a message
export async function addOrUpdateMessage(message: Message): Promise<string> {
  console.log("RedisMessageService - Adding/Updating message:", message);
  
  // Use provided ID or generate one
  const messageId = message.id || `message:${Date.now()}:${Math.random().toString(36).substring(2, 9)}`;
  
  // Ensure location is in { lat, lng } format 
  let latitude: number;
  let longitude: number;
  if (Array.isArray(message.location)) {
    latitude = message.location[0];
    longitude = message.location[1];
  } else {
    latitude = message.location.lat;
    longitude = message.location.lng;
  }

  if (typeof latitude !== 'number' || isNaN(latitude) || typeof longitude !== 'number' || isNaN(longitude)) {
    console.error('RedisMessageService - Invalid location provided for addOrUpdateMessage:', message.location);
    throw new Error('Invalid location data provided for message.');
  }

  // Convert timestamp ISO string back to number for storage
  const timestampMs = new Date(message.timestamp).getTime();
  if (isNaN(timestampMs)) {
     console.error('RedisMessageService - Invalid timestamp provided for addOrUpdateMessage:', message.timestamp);
     throw new Error('Invalid timestamp provided for message.');
  }

  // Base URL and headers for Upstash REST API
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    console.error('RedisMessageService - Missing Redis credentials in environment variables for addOrUpdateMessage');
    throw new Error('Missing Redis credentials.');
  }

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  try {
    // 1. Store message details using HMSET
    const messageData = {
      id: messageId,
      header: message.header || '', 
      content: message.content, 
      lat: latitude.toString(),
      lon: longitude.toString(),
      timestamp: timestampMs.toString(), 
      burnRate: (message.burnRate ?? 0).toString(), 
      replies: JSON.stringify(message.replies || []) 
    };
    // HMSET command requires key followed by field-value pairs
    const hmsetArgs = [messageId, ...Object.entries(messageData).flat()];
    const hmsetResponse = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(["HMSET", ...hmsetArgs])
    });
    if (!hmsetResponse.ok) {
      const errorData = await hmsetResponse.json();
      console.error(`RedisMessageService - Error executing HMSET for ${messageId}:`, errorData);
      throw new Error(`Failed to store message details: ${errorData.error}`);
    }
    const hmsetData = await hmsetResponse.json();
    console.log(`RedisMessageService - HMSET result for ${messageId}:`, hmsetData.result);


    // 2. Add location to geo index using GEOADD (lon, lat, member)
    const geoaddResponse = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(["GEOADD", LOCATION_KEY, longitude, latitude, messageId])
    });
     if (!geoaddResponse.ok) {
      const errorData = await geoaddResponse.json();
      console.error(`RedisMessageService - Error executing GEOADD for ${messageId}:`, errorData);
      // Attempt to clean up the hash if GEOADD fails
      await fetch(url, { method: 'POST', headers: headers, body: JSON.stringify(["DEL", messageId]) });
      throw new Error(`Failed to add message location: ${errorData.error}`);
    }
    const geoaddData = await geoaddResponse.json();
     console.log(`RedisMessageService - GEOADD result for ${messageId}:`, geoaddData.result);

    
    // 3. Set an expiration time (e.g., 72 hours) using EXPIRE
    const expiresInSeconds = 72 * 60 * 60;
    const expireResponse = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(["EXPIRE", messageId, expiresInSeconds])
    });
    if (!expireResponse.ok) {
      const errorData = await expireResponse.json();
      console.error(`RedisMessageService - Error executing EXPIRE for ${messageId}:`, errorData);
      // Note: Data might partially exist if EXPIRE fails. Consider cleanup logic.
      throw new Error(`Failed to set expiration for message: ${errorData.error}`);
    }
    const expireData = await expireResponse.json();
    console.log(`RedisMessageService - EXPIRE result for ${messageId}:`, expireData.result);

    
    console.log(`RedisMessageService - Successfully added/updated message ${messageId} via REST API.`);
    return messageId;

  } catch (error) {
    console.error(`RedisMessageService - Error adding/updating message ${messageId} via REST API:`, error);
    // Ensure the error is re-thrown so the calling function knows about the failure
    if (error instanceof Error) {
       throw error;
    } else {
       throw new Error('An unknown error occurred while adding the message.');
    }
  }
}

// Get message details by ID
export async function getMessageById(messageId: string): Promise<Message | null> {
  console.log(`RedisMessageService - Getting message details for ID: ${messageId}`);
  
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    console.error(`RedisMessageService - Missing Redis credentials for getMessageById`);
    return null;
  }

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(["HGETALL", messageId])
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error(`RedisMessageService - Error executing HGETALL for ${messageId}:`, errorData);
      return null;
    }

    const data = await response.json();
    const hashData = data.result;

    // HGETALL returns a flat array [key1, value1, key2, value2, ...]
    if (!hashData || hashData.length === 0) {
      console.log(`RedisMessageService - No data found for message ID: ${messageId}`);
      return null;
    }

    // Convert the flat array into an object
    const messageObj: { [key: string]: string } = {};
    for (let i = 0; i < hashData.length; i += 2) {
      messageObj[hashData[i]] = hashData[i + 1];
    }

    // Parse and structure the data into the Message type
    if (!messageObj.id || !messageObj.lat || !messageObj.lon || !messageObj.timestamp || !messageObj.content) {
        console.error(`RedisMessageService - Incomplete message data retrieved for ${messageId}:`, messageObj);
        return null; // Essential fields missing
    }

    const message: Message = {
      id: messageObj.id,
      header: messageObj.header || '',
      content: messageObj.content,
      location: {
        lat: parseFloat(messageObj.lat),
        lng: parseFloat(messageObj.lon),
      },
      timestamp: new Date(parseInt(messageObj.timestamp, 10)).toISOString(),
      burnRate: messageObj.burnRate ? parseInt(messageObj.burnRate, 10) : 0,
      replies: messageObj.replies ? JSON.parse(messageObj.replies) : [],
    };

    console.log(`RedisMessageService - Successfully retrieved message details for ${messageId}`);
    return message;

  } catch (error) {
    console.error(`RedisMessageService - Error getting message details for ${messageId}:`, error);
    return null;
  }
}

// Get color based on message properties (example)
export function getMessageColor(message: Message): string {
  const ageHours = (Date.now() - new Date(message.timestamp).getTime()) / (1000 * 60 * 60);
  if (ageHours < 1) return '#ff6347'; 
  if (ageHours < 6) return '#ffa500'; 
  if (ageHours < 24) return '#ffd700'; 
  return '#add8e6'; 
}

// Get opacity based on message properties (example)
export function getMessageOpacity(message: Message): number {
  const ageHours = (Date.now() - new Date(message.timestamp).getTime()) / (1000 * 60 * 60);
  const maxAgeHours = 72; 
  if (ageHours > maxAgeHours) return 0.3;
  return Math.max(0.3, 1 - (ageHours / maxAgeHours));
}

// Delete message by ID
export async function removeMessage(messageId: string): Promise<boolean> {
  // Implementation of the message deletion logic
  console.log(`RedisMessageService - Removing message with ID: ${messageId}`);
  
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    console.error(`RedisMessageService - Missing Redis credentials for removeMessage`);
    return false;
  }

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  try {
    // 1. Get message to extract location for GEOREM
    const message = await getMessageById(messageId);
    if (!message) {
      console.warn(`RedisMessageService - Message ${messageId} not found for deletion`);
      return false;
    }

    // 2. Remove message from geo index using ZREM
    const locationRemoveResponse = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(["ZREM", LOCATION_KEY, messageId])
    });

    if (!locationRemoveResponse.ok) {
      const errorData = await locationRemoveResponse.json();
      console.error(`RedisMessageService - Error removing message ${messageId} from geo index:`, errorData);
      // Continue with deletion even if geo index removal fails
    }

    // 3. Delete message hash using DEL
    const deleteResponse = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(["DEL", messageId])
    });

    if (!deleteResponse.ok) {
      const errorData = await deleteResponse.json();
      console.error(`RedisMessageService - Error deleting message ${messageId}:`, errorData);
      return false;
    }

    const deleteResult = await deleteResponse.json();
    if (deleteResult.result === 1) {
      console.log(`RedisMessageService - Successfully deleted message ${messageId}`);
      return true;
    } else {
      console.warn(`RedisMessageService - Message ${messageId} not found or already deleted`);
      return false;
    }
  } catch (error) {
    console.error(`RedisMessageService - Error deleting message ${messageId}:`, error);
    return false;
  }
}

// Alias for removeMessage to maintain compatibility
export const deleteMessage = removeMessage;
