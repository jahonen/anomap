// src/redux/store.ts
'use client';

import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import messagesReducer from './slices/messagesSlice';

// Create a proper no-op storage for server-side
const createNoopStorage = () => {
  return {
    getItem() {
      return Promise.resolve(null);
    },
    setItem(_key: string, value: any) {
      return Promise.resolve(value);
    },
    removeItem() {
      return Promise.resolve();
    }
  };
};

// Determine if we're on the client or server
const isClient = typeof window !== 'undefined';

// Dynamically import storage only on client-side
let storage: any;
if (isClient) {
  // Only import storage on the client side
  storage = require('redux-persist/lib/storage').default;
} else {
  // Use no-op storage on server side
  storage = createNoopStorage();
}

// Configure Redux Persist
const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['messages'], // only messages will be persisted
};

const rootReducer = combineReducers({
  messages: messagesReducer,
  // Add other reducers here as needed
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
  // Disable devTools in production
  devTools: process.env.NODE_ENV !== 'production',
});

// Only create persistor on the client side
export const persistor = isClient ? persistStore(store) : null;

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
