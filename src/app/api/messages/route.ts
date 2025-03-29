import { NextRequest, NextResponse } from 'next/server';
import { 
  addMessage, 
  getMessagesInRadius,
  deleteExpiredMessages 
} from '../../../services/redisMessageService';

// GET /api/messages?lat=x&lng=y&radius=z
export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const lat = parseFloat(searchParams.get('lat') || '0');
    const lng = parseFloat(searchParams.get('lng') || '0');
    const radius = parseFloat(searchParams.get('radius') || '3');
    
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
export async function POST(request: NextRequest) {
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
    
    return NextResponse.json(newMessage, { status: 201 });
  } catch (error) {
    console.error('Error adding message:', error);
    return NextResponse.json(
      { error: 'Failed to add message' },
      { status: 500 }
    );
  }
}
