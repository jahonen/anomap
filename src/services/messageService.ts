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
}

// In-memory storage
let messages: Message[] = [];

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
  const newMessage: Message = {
    id: generateId(),
    header,
    message,
    location: { lat, lng },
    timestamp: Date.now()
  };
  
  messages.push(newMessage);
  return newMessage;
}

// Get messages within a certain radius (in km)
export function getMessagesInRadius(lat: number, lng: number, radius: number = 3): Message[] {
  return messages.filter(msg => {
    const distance = calculateDistance(
      lat, lng,
      msg.location.lat, msg.location.lng
    );
    return distance <= radius;
  });
}

// Helper function to calculate distance between two points using Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
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
