// Simple in-memory database for messages
// In a real application, this would be replaced with a proper database

export interface Message {
  id: string;
  header: string;
  message: string;
  location: {
    lat: number;
    lng: number;
  };
  timestamp: number;
  expiresAt: number; // Timestamp when the message expires
  replyCount: number; // Number of replies to this message
  replies: Array<{
    id: string;
    text: string;
    timestamp: number;
  }>;
}

// In-memory storage
let messages: Message[] = [];

// Default message lifetime in hours
const DEFAULT_MESSAGE_LIFETIME_HOURS = 24;

// Check if a header is unique within 3km radius
export function isHeaderUnique(header: string, lat: number, lng: number): boolean {
  // Calculate a 3km radius around the given coordinates
  const nearbyMessages = messages.filter(msg => {
    const distance = calculateDistance(
      lat, lng,
      msg.location.lat, msg.location.lng
    );
    return distance <= 3; // 3 kilometers
  });
  
  return !nearbyMessages.some(msg => msg.header.toLowerCase() === header.toLowerCase());
}

// Add a new message
export function addMessage(header: string, message: string, lat: number, lng: number): Message {
  const now = Date.now();
  const expiresAt = now + (DEFAULT_MESSAGE_LIFETIME_HOURS * 60 * 60 * 1000); // 24 hours from now
  
  const newMessage: Message = {
    id: generateId(),
    header,
    message,
    location: { lat, lng },
    timestamp: now,
    expiresAt,
    replyCount: 0,
    replies: []
  };
  
  messages.push(newMessage);
  return newMessage;
}

// Add a reply to a message
export function addReply(messageId: string, replyText: string): boolean {
  const messageIndex = messages.findIndex(msg => msg.id === messageId);
  if (messageIndex === -1) return false;
  
  // Increment reply count
  messages[messageIndex].replyCount += 1;
  
  // Add the reply
  messages[messageIndex].replies.push({
    id: generateId(),
    text: replyText,
    timestamp: Date.now()
  });
  
  // Extend expiration time by 6 hours with each reply, up to a maximum of 7 days
  const MAX_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
  const EXTENSION_PER_REPLY_MS = 6 * 60 * 60 * 1000; // 6 hours in milliseconds
  
  const currentExpiry = messages[messageIndex].expiresAt;
  const newExpiry = Math.min(
    currentExpiry + EXTENSION_PER_REPLY_MS,
    messages[messageIndex].timestamp + MAX_LIFETIME_MS
  );
  
  messages[messageIndex].expiresAt = newExpiry;
  
  return true;
}

// Get messages within a certain radius (in km)
export function getMessagesInRadius(lat: number, lng: number, radius: number = 3): Message[] {
  console.log(`getMessagesInRadius called with [${lat}, ${lng}], radius: ${radius}, total messages: ${messages.length}`);
  
  // Filter out expired messages
  const now = Date.now();
  const activeMessages = messages.filter(msg => msg.expiresAt > now);
  
  console.log(`Active (non-expired) messages: ${activeMessages.length}`);
  
  // Update messages array to remove expired messages
  if (activeMessages.length !== messages.length) {
    messages = activeMessages;
  }
  
  const nearbyMessages = activeMessages.filter(msg => {
    const distance = calculateDistance(
      lat, lng,
      msg.location.lat, msg.location.lng
    );
    console.log(`Message "${msg.header}" distance: ${distance}km, within radius: ${distance <= radius}`);
    return distance <= radius;
  });
  
  console.log(`Found ${nearbyMessages.length} messages within ${radius}km of [${lat}, ${lng}]`);
  
  return nearbyMessages;
}

// Get a single message by ID
export function getMessageById(id: string): Message | null {
  return messages.find(msg => msg.id === id) || null;
}

// Calculate hours remaining until message expiration
export function getHoursRemaining(message: Message): number {
  const now = Date.now();
  const hoursRemaining = (message.expiresAt - now) / (60 * 60 * 1000);
  return Math.max(0, hoursRemaining);
}

// Get opacity based on hours remaining
export function getMessageOpacity(message: Message): number {
  const hoursRemaining = getHoursRemaining(message);
  
  if (hoursRemaining <= 1) return 0.5;
  if (hoursRemaining <= 2) return 0.6;
  if (hoursRemaining <= 3) return 0.7;
  if (hoursRemaining <= 4) return 0.8;
  if (hoursRemaining <= 5) return 0.9;
  return 1.0; // 6 hours or more
}

// Get color based on reply count (more replies = more red)
export function getMessageColor(message: Message): string {
  const { replyCount } = message;
  
  // Create a smooth gradient from blue to red
  // 0 replies = blue (#3366cc)
  // 20+ replies = red (#cc3366)
  
  // Cap at 20 replies for color calculation
  const normalizedCount = Math.min(replyCount, 20);
  
  // Calculate the percentage (0 to 1)
  const percentage = normalizedCount / 20;
  
  // Calculate RGB components
  const r = Math.round(51 + (204 - 51) * percentage);  // 51 (33 hex) to 204 (cc hex)
  const g = Math.round(102 - 51 * percentage);         // 102 (66 hex) to 51 (33 hex)
  const b = Math.round(204 - 153 * percentage);        // 204 (cc hex) to 51 (33 hex)
  
  // Return the color in hex format
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// Helper function to calculate distance between two points using Haversine formula
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const distance = R * c; // Distance in km
  return distance;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI/180);
}

// Generate a unique ID
function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

// Add some sample messages for testing
export function addSampleMessages(centerLat: number, centerLng: number): void {
  console.log('Adding sample messages around:', centerLat, centerLng);
  
  // Always clear existing messages and create new ones at the current location
  messages = [];
  
  const samples = [
    { header: "Coffee Shop", message: "Anyone know a good coffee shop around here?", replyCount: 2, hoursLeft: 8 },
    { header: "Dog Park", message: "Looking for a dog park in this area. Any suggestions?", replyCount: 5, hoursLeft: 4 },
    { header: "Street Art", message: "Check out the amazing street art on the corner!", replyCount: 12, hoursLeft: 2 },
    { header: "Traffic Jam", message: "Avoid Main Street, there's a huge traffic jam.", replyCount: 18, hoursLeft: 1 },
    { header: "Free Food", message: "Free food samples at the new grocery store!", replyCount: 25, hoursLeft: 6 }
  ];
  
  const now = Date.now();
  
  samples.forEach((sample, index) => {
    // Create points in roughly different directions from the center
    const angle = (index / samples.length) * 2 * Math.PI;
    const distance = 0.5 + (Math.random() * 1.5); // 0.5 to 2 km away
    
    // Calculate new coordinates (approximate)
    // Use appropriate multipliers to ensure messages appear within visible radius
    // 0.01 is approximately 1km at the equator
    const lat = centerLat + (Math.sin(angle) * distance * 0.01);
    const lng = centerLng + (Math.cos(angle) * distance * 0.01);
    
    console.log(`Creating sample message "${sample.header}" at [${lat}, ${lng}], ${distance}km from center`);
    
    const expiresAt = now + (sample.hoursLeft * 60 * 60 * 1000);
    
    messages.push({
      id: generateId(),
      header: sample.header,
      message: sample.message,
      location: { lat, lng },
      timestamp: now - (Math.random() * 12 * 60 * 60 * 1000), // Random time in the last 12 hours
      expiresAt,
      replyCount: sample.replyCount,
      replies: []
    });
  });
  
  console.log('Added sample messages, total count:', messages.length);
}
