import { NextResponse } from 'next/server';
// Temporarily commented out Redis import as addReply is not yet implemented
// import { addReply, getMessageById } from '../../../../../services/redisMessageService';

// POST /api/messages/[id]/replies
export async function POST(request, context) {
  try {
    const { id: messageId } = context.params;

    /* // --- Temporarily disabled Redis interaction --- 
    // Check if message exists
    const message = await getMessageById(messageId);
    if (!message) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      );
    }
    */

    const body = await request.json();
    const { text } = body; // Changed from 'content' to 'text' to match frontend

    console.log(`API: Received POST request to add reply to message ${messageId}`);
    console.log("API: Reply text:", text);

    if (!text || !messageId) {
      console.error("API: Missing text or messageId for reply.");
      return NextResponse.json({ error: 'Missing text or messageId' }, { status: 400 });
    }

    /* // --- Temporarily disabled Redis interaction --- 
    // Add reply
    const reply = await addReply(messageId, content);

    if (!reply) {
      return NextResponse.json(
        { error: 'Failed to add reply via Redis' }, // More specific error
        { status: 500 }
      );
    }

    // Get updated message - This might be redundant if addReply returns the necessary info
    // const updatedMessage = await getMessageById(messageId);
    */

    // Simulate successful reply creation for now
    const newReply = {
      id: `reply:${Date.now()}:${Math.random().toString(36).substring(2, 8)}`, // Simulate a new ID
      messageId: messageId,
      content: text, // Store as 'content' internally
      timestamp: Date.now(), // Use numeric timestamp to fix date issues
      author: "User" // Placeholder
    };

    console.log("API: Simulated reply creation:", newReply);

    // Return both the reply and a simulated updated message with the reply included
    const updatedMessage = {
      id: messageId,
      header: "Message Header", // Placeholder
      content: "Message Content", // Placeholder
      timestamp: Date.now(), // Use numeric timestamp
      location: { lat: 0, lng: 0 }, // Placeholder
      replies: [newReply] // Include the new reply
    };

    // Return the simulated data with 201 status
    return NextResponse.json({
      message: updatedMessage,
      reply: newReply
    }, { status: 201 });

    /* // --- Original return based on Redis --- 
    return NextResponse.json({
      message: updatedMessage, // Or maybe just return the reply?
      reply: reply,
    }, { status: 201 });
    */

  } catch (error) {
    console.error('API Error: POST /api/messages/[id]/replies:', error);
    // Check if it's a JSON parsing error
    if (error instanceof SyntaxError) {
        return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
