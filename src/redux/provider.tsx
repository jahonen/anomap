// src/redux/provider.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './store';

export function ReduxProvider({ children }: { children: React.ReactNode }) {
  // State to track if we're in the browser
  const [isClient, setIsClient] = useState(false);

  // Effect to set isClient to true once the component mounts
  // This ensures we only render PersistGate on the client
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Simple loading component
  const LoadingComponent = () => (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
    </div>
  );

  // If we're on the server, just render the children without PersistGate
  if (!isClient) {
    return <Provider store={store}>{children}</Provider>;
  }

  // On the client, use PersistGate to handle rehydration
  return (
    <Provider store={store}>
      <PersistGate loading={<LoadingComponent />} persistor={persistor!}>
        {children}
      </PersistGate>
    </Provider>
  );
}
