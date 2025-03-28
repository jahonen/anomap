'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useLocation } from '../hooks/useLocation';
import Fob from './fob';
import Footer from './footer';
import MessageModal from '../components/MessageModal';
import MessageDetail from '../components/MessageDetail';
import { Message, addSampleMessages } from '../services/messageService';

// Import Map component dynamically to avoid SSR issues with Leaflet
const Map = dynamic(() => import('../components/Map'), {
  ssr: false,
  loading: () => <div className="map-loading">Loading map...</div>
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
  const [isEditMode, setIsEditMode] = useState(false);
  const [isFobExpanded, setIsFobExpanded] = useState(false);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [mapKey, setMapKey] = useState(0); // Force re-render of map when needed

  // Initialize sample messages when coordinates are available
  useEffect(() => {
    if (coordinates && coordinates[0] && coordinates[1]) {
      console.log('Page: Initializing sample messages with coordinates:', coordinates);
      addSampleMessages(coordinates[0], coordinates[1]);
      
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

  // Handle location edit mode toggle
  const handleEditLocation = () => {
    setIsEditMode(!isEditMode);
    setIsFobExpanded(false);
  };

  // Handle location refresh
  const handleRefreshLocation = () => {
    refreshLocation();
    setIsFobExpanded(false);
  };

  // Handle FOB expansion toggle
  const handleToggleFob = () => {
    setIsFobExpanded(!isFobExpanded);
  };

  // Handle message modal open
  const handleOpenMessageModal = () => {
    setIsMessageModalOpen(true);
    setIsFobExpanded(false);
  };

  // Handle message modal close
  const handleCloseMessageModal = () => {
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

  // Handle message click on map
  const handleMessageClick = (message: Message) => {
    console.log('Message clicked:', message);
    setSelectedMessage(message);
  };

  // Handle message detail close
  const handleCloseMessageDetail = () => {
    setSelectedMessage(null);
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
          isEditMode={isEditMode}
          onLocationChange={setManualLocation}
          onMessageClick={handleMessageClick}
        />
      )}
      
      {/* Floating Action Button */}
      <Fob 
        isEditMode={isEditMode}
        isExpanded={isFobExpanded}
        onEditLocation={handleEditLocation}
        onRefreshLocation={handleRefreshLocation}
        onToggleExpanded={handleToggleFob}
        onOpenMessageModal={handleOpenMessageModal}
      />
      
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
      
      {/* Message Detail View */}
      {selectedMessage && (
        <MessageDetail
          message={selectedMessage}
          onClose={handleCloseMessageDetail}
        />
      )}
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`toast-notification ${toastMessage.type}`}>
          {toastMessage.text}
        </div>
      )}
      
      {/* Edit Mode Indicator */}
      {isEditMode && (
        <div className="edit-mode-indicator">
          Tap on the map or drag the marker to set your location
        </div>
      )}
      
      {/* Location Loading Indicator */}
      {locationLoading && (
        <div className="location-loading">
          Detecting your location...
        </div>
      )}
      
      {/* Location Error Message */}
      {locationError && (
        <div className="location-error">
          {locationError}
        </div>
      )}
    </main>
  );
}
