import { NextResponse } from 'next/server';
import { addReply, getMessageById } from '../../../../../services/redisMessageService';

// POST /api/messages/[id]/replies
export async function POST(request, { params }) {
  try {
    const { id } = params;
    
    // Check if message exists
    const message = await getMessageById(id);
    if (!message) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      );
    }
    
    // Parse request body
    const body = await request.json();
    const { text } = body;
    
    // Validate required fields
    if (!text) {
      return NextResponse.json(
        { error: 'Missing required field: text' },
        { status: 400 }
      );
    }
    
    // Add reply
    const reply = await addReply(id, text);
    
    if (!reply) {
      return NextResponse.json(
        { error: 'Failed to add reply' },
        { status: 500 }
      );
    }
    
    // Get updated message
    const updatedMessage = await getMessageById(id);
    
    return NextResponse.json({
      message: updatedMessage,
      reply
    }, { status: 201 });
  } catch (error) {
    console.error('Error adding reply:', error);
    return NextResponse.json(
      { error: 'Failed to add reply' },
      { status: 500 }
    );
  }
}
