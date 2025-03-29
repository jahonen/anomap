import { NextResponse } from 'next/server';
import { getMessageById, deleteMessage } from '../../../../services/redisMessageService';

// GET /api/messages/[id]
export async function GET(request, { params }) {
  try {
    const { id } = params;
    
    // Get message
    const message = await getMessageById(id);
    
    if (!message) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(message);
  } catch (error) {
    console.error('Error fetching message:', error);
    return NextResponse.json(
      { error: 'Failed to fetch message' },
      { status: 500 }
    );
  }
}

// DELETE /api/messages/[id]
export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    
    // Delete message
    const success = await deleteMessage(id);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete message or message not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting message:', error);
    return NextResponse.json(
      { error: 'Failed to delete message' },
      { status: 500 }
    );
  }
}
