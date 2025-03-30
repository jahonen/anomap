// Simple in-memory database for messages
// In a real application, this would be replaced with a proper database

export interface Message {
  id: string;
  header: string;
  content: string;
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
let isInitialized = false;
const RADIUS_OF_EARTH_KM = 6371;

function degreesToRadians(degrees: number): number {
  return degrees * Math.PI / 180;
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLat = degreesToRadians(lat2 - lat1);
  const dLon = degreesToRadians(lon2 - lon1);

  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(degreesToRadians(lat1)) * Math.cos(degreesToRadians(lat2)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return RADIUS_OF_EARTH_KM * c; // Distance in kilometers
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

export function addMessage(header: string, content: string, lat: number, lng: number, durationHours: number = 24): Message {
  const now = Date.now();
  const expiresAt = now + durationHours * 60 * 60 * 1000;
  const newMessage: Message = {
    id: generateId(),
    header,
    content,
    location: { lat, lng },
    timestamp: now,
    expiresAt,
    replyCount: 0,
    replies: [],
  };
  messages.push(newMessage);
  console.log("Message added:", newMessage);
  return newMessage;
}

export function getMessageById(id: string): Message | undefined {
  return messages.find(msg => msg.id === id);
}

export function getMessagesInRadius(lat: number, lon: number, radiusKm: number): Message[] {
  const now = Date.now();
  // Filter out expired messages first
  messages = messages.filter(msg => msg.expiresAt > now);

  console.log(`Filtering ${messages.length} messages for radius ${radiusKm}km around [${lat}, ${lon}]`);
  
  return messages.filter(msg => {
    const distance = calculateDistance(lat, lon, msg.location.lat, msg.location.lng);
    return distance <= radiusKm;
  });
}

export function addReply(messageId: string, text: string): Message | undefined {
  const message = getMessageById(messageId);
  if (message) {
    const newReply = {
      id: generateId(),
      text,
      timestamp: Date.now(),
    };
    message.replies.push(newReply);
    message.replyCount = message.replies.length;
    return message;
  }
  return undefined;
}

// --- Sample Data Generation --- 

const sampleMessages = [
  { header: "Free Coffee Downtown", content: "Grab a free coffee at Central Perk today only!" },
  { header: "Park Cleanup Event", content: "Join us this Saturday at 10 AM for a park cleanup." },
  { header: "Live Music Tonight", content: "Acoustic set at The Blue Note starting 8 PM." },
  { header: "Lost Dog: Fido", content: "Golden Retriever, answers to Fido, lost near Elm Street." },
  { header: "Garage Sale!", content: "Multi-family garage sale on Oak Ave, 9 AM - 3 PM." },
  { header: "Road Closure Alert", content: "Main Street closed between 1st and 3rd Ave due to construction." },
  { header: "Farmers Market Open", content: "Fresh produce available at the town square until 2 PM." },
  { header: "Movie in the Park", content: "Showing 'The Great Outdoors' tonight at dusk, bring blankets!" },
  { header: "Book Club Meeting", content: "Discussing 'The Midnight Library' at the library, 7 PM." },
  { header: "Food Truck Festival", content: "Various food trucks at the waterfront all weekend." },
  { header: "Art Walk Event", content: "Local galleries open late tonight, 6 PM - 9 PM." },
  { header: "Charity Run Sign-up", content: "Sign up for the 5k run next Sunday to support local charities." },
  { header: "New Restaurant Opening", content: "'The Tasty Spoon' opens its doors tomorrow on Pine Street." },
  { header: "Tech Meetup", content: "Discussing the latest in AI at the community center, 7:30 PM." },
  { header: "Public Library Notice", content: "The library will be closed for renovations next week." }
];

function initializeSampleData() {
  if (isInitialized || process.env.NODE_ENV !== 'development') return;

  console.log("Initializing sample message data...");
  messages = []; // Clear existing messages

  // Coordinates roughly around a sample city area (e.g., San Francisco)
  const centerLat = 37.7749;
  const centerLng = -122.4194;
  const spread = 0.05; // Approx 5km spread

  for (let i = 0; i < 15; i++) {
    const sample = sampleMessages[i % sampleMessages.length];
    const lat = centerLat + (Math.random() - 0.5) * spread * 2;
    const lng = centerLng + (Math.random() - 0.5) * spread * 2;
    const now = Date.now();
    const expiresAt = now + (1 + Math.random() * 72) * 60 * 60 * 1000; // Expires in 1-73 hours

    messages.push({
      id: generateId(),
      header: sample.header,
      content: sample.content,
      location: { lat, lng },
      timestamp: now - (Math.random() * 12 * 60 * 60 * 1000), // Random time in the last 12 hours
      expiresAt,
      replyCount: Math.floor(Math.random() * 5), // 0-4 replies
      replies: [], // Sample replies could be added here
    });
  }

  isInitialized = true;
  console.log("Sample data initialization complete.");
}

// Initialize sample data on first import in development
initializeSampleData();
