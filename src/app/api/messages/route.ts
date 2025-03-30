import { NextResponse, NextRequest } from 'next/server';
import {
  getMessagesInRadius, 
  addOrUpdateMessage,
  getMessageById // Import the new function
} from '../../../services/redisMessageService';
import { Message } from '../../../utils/types';

// GET handler to fetch messages
export async function GET(request: NextRequest) {
  console.log("API GET /api/messages called");
  try {
    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get('lat') || '0');
    const lng = parseFloat(searchParams.get('lng') || '0'); // Use 'lng' from query param
    const radius = parseFloat(searchParams.get('radius') || '20000'); // Default to 20000 km (global)

    if (isNaN(lat) || isNaN(lng) || isNaN(radius)) { // Check lng
      console.error('API GET - Invalid query parameters:', { lat, lng, radius });
      return NextResponse.json({ error: 'Invalid query parameters' }, { status: 400 });
    }

    console.log(`API GET - Fetching messages for lat=${lat}, lng=${lng}, radius=${radius}`); // Log lng
    const messages = await getMessagesInRadius(lat, lng, radius); // Pass lng
    console.log(`API GET - Found ${messages.length} messages`);

    // TODO: Consider adding periodic cleanup logic elsewhere if needed, 
    // as automatic expiration is handled by Redis EXPIRE.
    // const deletedCount = await deleteExpiredMessages();
    // console.log(`API GET - Cleaned up ${deletedCount} expired messages`);

    return NextResponse.json(messages);
  } catch (error) {
    console.error('API GET - Error fetching messages:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

// POST handler to add a new message
export async function POST(request: NextRequest) {
  console.log("API POST /api/messages called");
  try {
    const messageData = await request.json() as Partial<Message>; // Receive partial data
    console.log("API POST - Received message data:", messageData);

    // Basic validation
    if (!messageData.content || !messageData.location) {
      console.error('API POST - Missing required message fields (content or location)');
      return NextResponse.json({ error: 'Missing required message fields' }, { status: 400 });
    }

    // Construct the full message object, potentially generating ID and timestamp if not provided
    const newMessage: Message = {
      id: messageData.id || '', // Let service generate if empty
      header: messageData.header,
      content: messageData.content,
      location: messageData.location, 
      timestamp: messageData.timestamp || new Date().toISOString(), // Use current time if missing
      burnRate: messageData.burnRate || 0, // Default burnRate
      replies: messageData.replies || [], // Default replies
    };

    console.log("API POST - Attempting to add/update message:", newMessage);
    const messageId = await addOrUpdateMessage(newMessage);
    console.log(`API POST - Message added/updated with ID: ${messageId}`);

    // Fetch the newly created message to return the full object
    const createdMessage = await getMessageById(messageId);

    if (!createdMessage) {
      console.error(`API POST - Failed to retrieve the newly created message with ID: ${messageId}`);
      // Return success but indicate retrieval failure, or return 500?
      // For now, let's return 500 as something went wrong after creation.
      return NextResponse.json({ error: 'Message created but failed to retrieve details' }, { status: 500 });
    }

    console.log("API POST - Returning created message object:", createdMessage);
    return NextResponse.json(createdMessage, { status: 201 });

  } catch (error) {
    console.error('API POST - Error adding message:', error);
    // Check if error is because of invalid input and return 400
    if (error instanceof Error && (error.message.includes('Invalid location') || error.message.includes('Invalid timestamp'))) {
       return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to add message' }, { status: 500 });
  }
}
