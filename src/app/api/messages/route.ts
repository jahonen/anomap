import { NextResponse } from 'next/server';
import { 
  addMessage, 
  getMessagesInRadius,
  deleteExpiredMessages 
} from '../../../services/redisMessageService';

// GET /api/messages?lat=x&lng=y&radius=z
export async function GET(request) {
  try {
    // Get query parameters
    const url = new URL(request.url);
    const lat = parseFloat(url.searchParams.get('lat') || '0');
    const lng = parseFloat(url.searchParams.get('lng') || '0');
    const radius = parseFloat(url.searchParams.get('radius') || '3');
    
    // Validate parameters
    if (isNaN(lat) || isNaN(lng) || isNaN(radius)) {
      return NextResponse.json(
        { error: 'Invalid parameters. lat, lng, and radius must be numbers.' },
        { status: 400 }
      );
    }
    
    // Get messages
    const messages = await getMessagesInRadius(lat, lng, radius);
    
    // Run cleanup of expired messages (this could be moved to a separate cron job)
    deleteExpiredMessages().catch(err => console.error('Error cleaning up expired messages:', err));
    
    return NextResponse.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

// POST /api/messages
export async function POST(request) {
  try {
    // Parse request body
    const body = await request.json();
    const { header, message, lat, lng } = body;
    
    // Validate required fields
    if (!header || !message || lat === undefined || lng === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: header, message, lat, lng' },
        { status: 400 }
      );
    }
    
    // Add message
    const newMessage = await addMessage(header, message, lat, lng);
    
    if (!newMessage) {
      return NextResponse.json(
        { error: 'Failed to add message' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(newMessage, { status: 201 });
  } catch (error) {
    console.error('Error adding message:', error);
    return NextResponse.json(
      { error: 'Failed to add message' },
      { status: 500 }
    );
  }
}
