import { getRedisClient } from './redisClient';
import { v4 as uuidv4 } from 'uuid';
import { Message, Reply } from '../contexts/MessagesContext';

// Redis key prefixes
const MESSAGE_PREFIX = 'message:';
const GEO_KEY = 'message_locations';

// Default message lifetime in seconds (24 hours)
const DEFAULT_MESSAGE_LIFETIME = 24 * 60 * 60;

// Add a message to Redis
export async function addMessage(header: string, content: string, lat: number, lng: number): Promise<Message> {
  const redis = getRedisClient();
  
  // Create a new message object
  const messageId = uuidv4();
  const now = Date.now();
  const expiresAt = now + (DEFAULT_MESSAGE_LIFETIME * 1000);
  
  const message: Message = {
    id: messageId,
    header,
    message: content,
    location: {
      lat,
      lng
    },
    timestamp: now,
    expiresAt,
    replyCount: 0,
    replies: []
  };
  
  // Store the message in Redis
  await redis.set(
    `${MESSAGE_PREFIX}${messageId}`, 
    JSON.stringify(message),
    'EX',
    DEFAULT_MESSAGE_LIFETIME
  );
  
  // Add the message location to the geo index
  await redis.geoadd(
    GEO_KEY,
    lng,  // Note: Redis GEO commands expect longitude first, then latitude
    lat,
    messageId
  );
  
  return message;
}

// Get a message by ID
export async function getMessageById(id: string): Promise<Message | null> {
  const redis = getRedisClient();
  
  const messageData = await redis.get(`${MESSAGE_PREFIX}${id}`);
  if (!messageData) return null;
  
  return JSON.parse(messageData) as Message;
}

// Get messages within a radius of a location
export async function getMessagesInRadius(lat: number, lng: number, radius: number = 3): Promise<Message[]> {
  const redis = getRedisClient();
  
  // Convert radius from km to meters
  const radiusMeters = radius * 1000;
  
  // Find message IDs within the radius
  const geoResults = await redis.georadius(
    GEO_KEY,
    lng,  // Note: Redis GEO commands expect longitude first, then latitude
    lat,
    radiusMeters,
    'm'
  );
  
  if (!geoResults || geoResults.length === 0) {
    return [];
  }
  
  // Fetch all messages in parallel
  const messagePromises = geoResults.map(id => redis.get(`${MESSAGE_PREFIX}${id}`));
  const messageDataArray = await Promise.all(messagePromises);
  
  // Filter out any null results and parse the JSON
  return messageDataArray
    .filter(data => data !== null)
    .map(data => JSON.parse(data as string) as Message);
}

// Add a reply to a message
export async function addReply(messageId: string, text: string): Promise<Reply | null> {
  const redis = getRedisClient();
  
  // Get the existing message
  const messageData = await redis.get(`${MESSAGE_PREFIX}${messageId}`);
  if (!messageData) return null;
  
  const message = JSON.parse(messageData) as Message;
  
  // Create a new reply
  const reply: Reply = {
    id: uuidv4(),
    text,
    timestamp: Date.now()
  };
  
  // Add the reply to the message
  message.replies.push(reply);
  message.replyCount = message.replies.length;
  
  // Update the message in Redis
  // Note: We maintain the original expiration by using the remaining TTL
  const ttl = await redis.ttl(`${MESSAGE_PREFIX}${messageId}`);
  
  if (ttl > 0) {
    await redis.set(
      `${MESSAGE_PREFIX}${messageId}`,
      JSON.stringify(message),
      'EX',
      ttl
    );
  } else {
    // If TTL is -1 (no expiration) or -2 (key doesn't exist), use default lifetime
    await redis.set(
      `${MESSAGE_PREFIX}${messageId}`,
      JSON.stringify(message),
      'EX',
      DEFAULT_MESSAGE_LIFETIME
    );
  }
  
  return reply;
}

// Delete a message
export async function deleteMessage(messageId: string): Promise<boolean> {
  const redis = getRedisClient();
  
  // Remove the message from Redis
  const deleted = await redis.del(`${MESSAGE_PREFIX}${messageId}`);
  
  // Remove the message from the geo index
  await redis.zrem(GEO_KEY, messageId);
  
  return deleted > 0;
}

// Delete expired messages (this could be run periodically)
export async function deleteExpiredMessages(): Promise<number> {
  const redis = getRedisClient();
  
  // Redis automatically removes expired keys, but we need to clean up the geo index
  // This is a simplified approach - in production, you might want a more efficient solution
  const allMessageIds = await redis.zrange(GEO_KEY, 0, -1);
  let removedCount = 0;
  
  for (const id of allMessageIds) {
    const exists = await redis.exists(`${MESSAGE_PREFIX}${id}`);
    if (exists === 0) {
      await redis.zrem(GEO_KEY, id);
      removedCount++;
    }
  }
  
  return removedCount;
}
