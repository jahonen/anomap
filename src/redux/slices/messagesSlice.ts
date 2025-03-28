// src/redux/messagesSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Message } from '../../utils/types';
import { v4 as uuidv4 } from 'uuid';

interface MessagesState {
  messages: Message[];
  loading: boolean;
  error: string | null;
}

const initialState: MessagesState = {
  messages: [],
  loading: false,
  error: null,
};

export const messagesSlice = createSlice({
  name: 'messages',
  initialState,
  reducers: {
    // Add a new message
    addMessage: {
      reducer: (state, action: PayloadAction<Message>) => {
        state.messages.push(action.payload);
      },
      prepare: (content: string, location: [number, number], burnRate: number, header?: string) => {
        return {
          payload: {
            id: uuidv4(),
            header,
            content,
            location,
            burnRate,
            timestamp: new Date().toISOString(),
            replies: [],
          },
        };
      },
    },
    // Add a reply to a message
    addReply: {
      reducer: (state, action: PayloadAction<{ messageId: string; reply: { id: string; content: string; timestamp: string } }>) => {
        const { messageId, reply } = action.payload;
        const message = state.messages.find(msg => msg.id === messageId);
        if (message) {
          message.replies.push(reply);
        }
      },
      prepare: (messageId: string, content: string) => {
        return {
          payload: {
            messageId,
            reply: {
              id: uuidv4(),
              content,
              timestamp: new Date().toISOString(),
            },
          },
        };
      },
    },
    // Delete a message
    deleteMessage: (state, action: PayloadAction<string>) => {
      state.messages = state.messages.filter(message => message.id !== action.payload);
    },
    // Set loading state
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    // Set error state
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    // Clear all messages (for testing or reset)
    clearMessages: (state) => {
      state.messages = [];
    },
  },
});

export const { 
  addMessage, 
  addReply, 
  deleteMessage, 
  setLoading, 
  setError, 
  clearMessages 
} = messagesSlice.actions;

export default messagesSlice.reducer;
