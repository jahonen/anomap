'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Fob from './fob';
import Footer from './footer';
import MessageModal from '../components/MessageModal';
import { useLocation } from '../hooks/useLocation';
import { addMessage, isHeaderUnique } from '../services/messageService';

// Dynamically import the Map component to avoid SSR issues with Leaflet
const Map = dynamic(() => import('../components/Map'), {
  ssr: false,
  loading: () => <div>Loading map...</div>
});

export default function Home() {
  const { coordinates, setManualLocation, refreshLocation, source } = useLocation();
  const [isEditMode, setIsEditMode] = useState(false);
  const [isFobExpanded, setIsFobExpanded] = useState(false);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [messageSubmitStatus, setMessageSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  // Reset edit mode when location changes
  useEffect(() => {
    if (isEditMode) {
      console.log('Location changed, resetting edit mode');
      setIsEditMode(false);
    }
  }, [coordinates, isEditMode]);

  // Handle FOB button clicks
  const handleEditLocation = () => {
    console.log('Edit location mode activated');
    setIsEditMode(true);
    setIsFobExpanded(false); // Close FOB after clicking
  };

  const handleRefreshLocation = () => {
    console.log('Refreshing location');
    refreshLocation();
    setIsFobExpanded(false); // Close FOB after clicking
  };

  const handleDropMessage = () => {
    console.log('Opening message modal');
    setIsMessageModalOpen(true);
    setIsFobExpanded(false); // Close FOB after clicking
  };

  // Handle message submission
  const handleMessageSubmit = (header: string, message: string) => {
    if (!coordinates || !coordinates[0] || !coordinates[1]) {
      setMessageSubmitStatus('error');
      setStatusMessage('Location data is required to drop a message.');
      return;
    }

    const lat = coordinates[0];
    const lng = coordinates[1];

    // Check if header is unique in 3km radius
    if (!isHeaderUnique(header, lat, lng)) {
      setMessageSubmitStatus('error');
      setStatusMessage('This header is already used by another message in this area. Please choose a unique header.');
      return;
    }

    try {
      // Add message to database
      const newMessage = addMessage(header, message, lat, lng);
      console.log('Message added:', newMessage);
      
      // Show success message and close modal
      setMessageSubmitStatus('success');
      setStatusMessage('Message dropped successfully!');
      
      // Reset status and close modal after delay
      setTimeout(() => {
        setMessageSubmitStatus('idle');
        setStatusMessage('');
        setIsMessageModalOpen(false);
      }, 1500);
    } catch (error) {
      console.error('Error adding message:', error);
      setMessageSubmitStatus('error');
      setStatusMessage('An error occurred while dropping your message. Please try again.');
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-between">
      {/* Map Component */}
      <div id="map-container">
        <Map 
          coordinates={coordinates} 
          onLocationChange={setManualLocation} 
          isEditMode={isEditMode}
        />
      </div>

      {/* Floating Action Button */}
      <Fob 
        onEditLocation={handleEditLocation} 
        onRefreshLocation={handleRefreshLocation}
        onDropMessage={handleDropMessage}
        onToggleExpanded={setIsFobExpanded}
        isExpanded={isFobExpanded}
        isEditMode={isEditMode}
      />

      {/* Message Modal */}
      <MessageModal 
        isOpen={isMessageModalOpen}
        onClose={() => setIsMessageModalOpen(false)}
        onSubmit={handleMessageSubmit}
        userLocation={coordinates ? { lat: coordinates[0], lng: coordinates[1] } : null}
      />

      {/* Status message toast */}
      {messageSubmitStatus !== 'idle' && (
        <div className={`status-toast ${messageSubmitStatus === 'success' ? 'success' : 'error'}`}>
          {statusMessage}
        </div>
      )}

      {/* Footer */}
      <Footer />
    </main>
  );
}
