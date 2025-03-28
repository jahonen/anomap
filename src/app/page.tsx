'use client';

import { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useLocation } from '../hooks/useLocation';
import Footer from './footer';
import Fob from './fob';

// Import the Map component dynamically to prevent SSR issues with Leaflet
const Map = dynamic(() => import('../components/Map'), {
  ssr: false,
  loading: () => <LoadingScreen message="Loading map..." />
});

function LoadingScreen({ message }: { message: string }) {
  return (
    <div className="h-screen w-full flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500 mx-auto mb-4"></div>
        <p>{message}</p>
      </div>
    </div>
  );
}

function LocationBadge({ source }: { source: string }) {
  return (
    <div className="absolute top-4 right-4 bg-white bg-opacity-80 px-3 py-1 rounded-full text-sm shadow-md z-[1000]">
      Location: {source}
    </div>
  );
}

export default function Home() {
  const { coordinates, loading, error, source, refreshLocation, setManualLocation } = useLocation();
  const [isEditMode, setIsEditMode] = useState(false);
  const [isFobExpanded, setIsFobExpanded] = useState(false);

  // Handle errors
  useEffect(() => {
    if (error) {
      console.error('Location error:', error);
    }
  }, [error]);

  // Log state changes for debugging
  useEffect(() => {
    console.log('State changed - isEditMode:', isEditMode, 'isFobExpanded:', isFobExpanded);
  }, [isEditMode, isFobExpanded]);

  // Reset edit mode - use this function to ensure edit mode is turned off
  const resetEditMode = useCallback(() => {
    console.log('Resetting edit mode to false');
    setIsEditMode(false);
    setIsFobExpanded(false);
  }, []);

  // Handle location change from map
  const handleLocationChange = useCallback((newLocation: [number, number]) => {
    console.log('Location changed:', newLocation);
    
    // First set the new location
    setManualLocation(newLocation);
    
    // Then reset the edit mode - this needs to be after the location change
    // to ensure the state updates are processed in the correct order
    setTimeout(() => {
      resetEditMode();
    }, 50);
  }, [setManualLocation, resetEditMode]);

  // Handle edit location button click
  const handleEditLocation = useCallback(() => {
    console.log('Edit location clicked - current isEditMode:', isEditMode);
    setIsEditMode(!isEditMode);
    console.log('After toggling - isEditMode:', !isEditMode);
    
    // If turning off edit mode and we have a manual location, save it
    if (isEditMode && source === 'manual') {
      console.log('Saving manual location:', coordinates);
    }
    
    // Minimize FOB after toggling edit mode
    setIsFobExpanded(false);
  }, [isEditMode, source, coordinates]);

  // Handle refresh location button click
  const handleRefreshLocation = useCallback(() => {
    console.log('Refresh location clicked');
    refreshLocation();
    
    // Turn off edit mode when refreshing location
    resetEditMode();
  }, [refreshLocation, resetEditMode]);
  
  // Handle FOB expansion toggle
  const handleFobToggle = useCallback((expanded: boolean) => {
    console.log('FOB toggle called with expanded:', expanded);
    setIsFobExpanded(expanded);
  }, []);

  // Show loading screen while detecting location
  if (loading) {
    return <LoadingScreen message="Detecting your location..." />;
  }

  return (
    <main className="h-screen w-full relative">
      {/* Full-screen map as the base layer */}
      <Map 
        center={coordinates} 
        zoom={13} 
        isEditMode={isEditMode}
        onLocationChange={handleLocationChange}
      />
      
      {/* Location source indicator */}
      <LocationBadge source={source} />
      
      {/* Instruction overlay when in edit mode */}
      {isEditMode && (
        <div className="absolute top-14 right-4 bg-white bg-opacity-90 px-3 py-2 rounded-md text-sm shadow-md z-[1000] max-w-xs">
          <p>
            {window.innerWidth <= 768 
              ? "Tap and hold anywhere on the map or drag the marker to set your location" 
              : "Click anywhere on the map or drag the marker to set your location"}
          </p>
        </div>
      )}
      
      {/* Floating Action Button (FOB) */}
      <Fob 
        onEditLocation={handleEditLocation} 
        onRefreshLocation={handleRefreshLocation}
        onToggleExpanded={handleFobToggle}
        isExpanded={isFobExpanded}
        isEditMode={isEditMode}
      />
      
      {/* Footer */}
      <Footer />
    </main>
  );
}
