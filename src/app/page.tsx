'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useLocation } from '../hooks/useLocation';
import Fob from './fob';
import Footer from './footer';
import MessageModal from '../components/MessageModal';
import MessageDetail from '../components/MessageDetail';
import MapLogo from '../components/MapLogo';
import { Message } from '../services/messageService';

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
  const [mapZoom, setMapZoom] = useState<number | undefined>(undefined);
  const [isHeatmapMode, setIsHeatmapMode] = useState(false);

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

  // Handle FOB toggle
  const handleToggleFob = () => {
    setIsFobExpanded(!isFobExpanded);
  };

  // Handle heatmap toggle
  const handleToggleHeatmap = () => {
    setIsHeatmapMode(!isHeatmapMode);
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
          isHeatmapMode={isHeatmapMode}
          onLocationChange={setManualLocation}
          onMessageClick={handleMessageClick}
          zoom={mapZoom}
        />
      )}
      
      {/* Map Logo */}
      <MapLogo />
      
      {/* Floating Action Button */}
      <Fob 
        isEditMode={isEditMode}
        isExpanded={isFobExpanded}
        isHeatmapMode={isHeatmapMode}
        onEditLocation={handleEditLocation}
        onRefreshLocation={handleRefreshLocation}
        onToggleExpanded={handleToggleFob}
        onOpenMessageModal={handleOpenMessageModal}
        onToggleHeatmap={handleToggleHeatmap}
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
