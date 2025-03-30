'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useLocation } from '../hooks/useLocation';
import Footer from './footer';
import MessageModal from '../components/MessageModal';
import MapLogo from '../components/MapLogo';
import { Message } from '../utils/types'; // Import the consolidated Message type

// Import Map component dynamically to avoid SSR issues with Leaflet
const Map = dynamic(() => import('../components/Map'), {
  ssr: false,
  loading: () => <div className="map-loading">Loading map...</div>
});

// Import MessageDetail dynamically
const MessageDetail = dynamic(() => import('../components/MessageDetail'), {
  ssr: false,
  loading: () => <div className="message-detail-loading">Loading message...</div> // Optional loading state
});

export default function Home() {
  // Location state
  const { 
    coordinates, 
    loading: locationLoading, 
    error: locationError, 
    refreshLocation, 
    setManualLocation 
  } = useLocation();
  
  // UI state
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [mapKey, setMapKey] = useState(0); // Force re-render of map when needed
  const [mapZoom, setMapZoom] = useState<number | undefined>(undefined);
  const [isHeatmapMode, setIsHeatmapMode] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const [showModeChangeIndicator, setShowModeChangeIndicator] = useState(false);

  // Check for URL parameters on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const lat = parseFloat(urlParams.get('lat') || '');
      const lng = parseFloat(urlParams.get('lng') || '');
      const zoom = parseInt(urlParams.get('zoom') || '', 10);
      
      // If valid coordinates are provided in URL, set them as manual location
      if (!isNaN(lat) && !isNaN(lng)) {
        console.log('Setting location from URL parameters:', lat, lng);
        setManualLocation([lat, lng]);
        
        // Set zoom level if provided
        if (!isNaN(zoom)) {
          setMapZoom(zoom);
        }
      }
    }
  }, [setManualLocation]);

  // Initialize map when coordinates are available
  useEffect(() => {
    if (coordinates && coordinates[0] && coordinates[1]) {
      console.log('Page: Coordinates available:', coordinates);
      
      // Force map re-render to ensure messages are displayed
      setMapKey(prev => prev + 1);
    }
  }, [coordinates]);

  // Handle toast messages
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Auto-switch between heatmap and message view based on message count
  useEffect(() => {
    if (messageCount > 12 && !isHeatmapMode) {
      setIsHeatmapMode(true);
      // Show mode change indicator
      setShowModeChangeIndicator(true);
      setTimeout(() => setShowModeChangeIndicator(false), 3000);
    } else if (messageCount <= 12 && isHeatmapMode) {
      setIsHeatmapMode(false);
      // Show mode change indicator
      setShowModeChangeIndicator(true);
      setTimeout(() => setShowModeChangeIndicator(false), 3000);
    }
  }, [messageCount, isHeatmapMode]);

  // Handle location refresh
  const handleRefreshLocation = () => {
    refreshLocation();
  };

  // Handle message modal open from beacon click
  const handleBeaconClick = () => {
    console.log('Beacon clicked, coordinates:', coordinates);
    // Make sure we don't open the modal if coordinates aren't available
    if (coordinates) {
      setIsMessageModalOpen(true);
    } else {
      console.error('Cannot open message modal: coordinates not available');
      setToastMessage({
        text: 'Cannot drop message: location not available',
        type: 'error'
      });
    }
  };

  // Handle message modal close
  const handleCloseMessageModal = () => {
    console.log('Closing message modal');
    setIsMessageModalOpen(false);
  };

  // Handle message submission
  const handleMessageSubmit = (success: boolean, message?: string) => {
    setIsMessageModalOpen(false);
    
    if (success) {
      setToastMessage({
        text: 'Message dropped successfully!',
        type: 'success'
      });
      
      // Force map re-render to show the new message
      setMapKey(prev => prev + 1);
    } else {
      setToastMessage({
        text: message || 'Failed to drop message. Please try again.',
        type: 'error'
      });
    }
  };

  // Handler for clicking on a message marker in the map
  const handleMessageClick = useCallback((message: Message) => {
    console.log('Message clicked:', message);
    setSelectedMessage(message);
  }, []);

  // Handler for when messages are updated in the layer (e.g., after fetching)
  const handleMessagesUpdate = useCallback((updatedMessages: Message[]) => {
    console.log('Messages updated in layer:', updatedMessages.length);
    setMessageCount(updatedMessages.length);
  }, []);

  // Handler for when the message count changes in the Map component
  const handleMessageCountUpdate = useCallback((count: number) => {
    console.log('Page: Message count updated:', count);
    setMessageCount(count);
  }, []);

  // Handle message detail close
  const handleCloseMessageDetail = () => {
    setSelectedMessage(null);
  };

  // Handle location change from long press
  const handleLocationChange = (newCoordinates: [number, number]) => {
    console.log('Location changed from long press:', newCoordinates);
    setManualLocation(newCoordinates);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-between">
      {/* Map Container */}
      <div id="map-container" className="w-full h-screen"></div>
      
      {/* Map Component (dynamically loaded) */}
      {coordinates && (
        <Map 
          key={mapKey} // Force re-render when needed
          coordinates={coordinates} 
          isHeatmapMode={isHeatmapMode}
          onLocationChange={handleLocationChange}
          onMessageClick={handleMessageClick}
          onBeaconClick={handleBeaconClick}
          onMessageCountChange={handleMessageCountUpdate} // Pass the correct handler
          zoom={mapZoom}
        />
      )}
      
      {/* Map Logo */}
      <MapLogo />
      
      {/* Footer */}
      <Footer />
      
      {/* Message Modal */}
      {isMessageModalOpen && coordinates && (
        <MessageModal 
          onClose={handleCloseMessageModal}
          onSubmit={handleMessageSubmit}
          coordinates={coordinates}
        />
      )}
      
      {/* Message Detail Modal */}
      {selectedMessage && (
        <MessageDetail 
          message={selectedMessage}
          onClose={handleCloseMessageDetail}
        />
      )}
      
      {/* Toast Messages */}
      {toastMessage && (
        <div className={`toast-message ${toastMessage.type}`}>
          {toastMessage.text}
        </div>
      )}
      
      {/* Display Mode Change Indicator */}
      {showModeChangeIndicator && (
        <div className="mode-change-indicator">
          <div className="mode-change-icon">
            {isHeatmapMode ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M4.913 2.658c2.075-.27 4.19-.408 6.337-.408 2.147 0 4.262.139 6.337.408 1.922.25 3.291 1.861 3.405 3.727a4.403 4.403 0 00-1.032-.211 50.89 50.89 0 00-8.42 0c-2.358.196-4.04 2.19-4.04 4.434v4.286a4.47 4.47 0 002.433 3.984L7.28 21.53A.75.75 0 016 21v-4.03a48.527 48.527 0 01-1.087-.128C2.905 16.58 1.5 14.833 1.5 12.862V6.638c0-1.97 1.405-3.718 3.413-3.979z" />
              </svg>
            )}
          </div>
          <div className="mode-change-text">
            Switched to {isHeatmapMode ? 'heatmap' : 'detailed'} view
            <div className="mode-change-subtext">
              {isHeatmapMode ? 'Many messages in view' : 'Fewer messages in view'}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
