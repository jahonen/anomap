'use client';

import { useState, useEffect, useRef } from 'react';
import Button from '../components/Button';

interface FobProps {
  onEditLocation?: () => void;
  onRefreshLocation?: () => void;
  onDropMessage?: () => void;
  onToggleExpanded?: (expanded: boolean) => void;
  isExpanded?: boolean;
  isEditMode?: boolean;
}

export default function Fob({ 
  onEditLocation, 
  onRefreshLocation, 
  onDropMessage,
  onToggleExpanded,
  isExpanded = false,
  isEditMode = false 
}: FobProps) {
  const [isLocalExpanded, setIsLocalExpanded] = useState(isExpanded);
  const [isHovered, setIsHovered] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const optionsRef = useRef<HTMLDivElement>(null);
  
  // Sync local state with prop when it changes
  useEffect(() => {
    setIsLocalExpanded(isExpanded);
  }, [isExpanded]);
  
  const handleMainButtonClick = () => {
    const newExpandedState = !isLocalExpanded;
    setIsLocalExpanded(newExpandedState);
    setIsAnimating(true);
    
    // Notify parent component of expansion state change
    if (onToggleExpanded) {
      onToggleExpanded(newExpandedState);
    }
    
    // Reset animation state after animation completes
    setTimeout(() => {
      setIsAnimating(false);
    }, 500); // A bit longer than the animation duration to ensure it completes
  };
  
  const handleEditLocationClick = () => {
    if (onEditLocation) {
      onEditLocation();
    }
  };
  
  const handleRefreshLocationClick = () => {
    if (onRefreshLocation) {
      onRefreshLocation();
    }
  };
  
  const handleDropMessageClick = () => {
    if (onDropMessage) {
      onDropMessage();
    }
  };
  
  const handleBackdropClick = () => {
    if (isLocalExpanded) {
      handleMainButtonClick();
    }
  };
  
  return (
    <>
      {/* Semi-transparent backdrop when FOB is expanded */}
      <div 
        className={`fob-backdrop ${isLocalExpanded ? 'visible' : ''}`} 
        onClick={handleBackdropClick}
      />
      
      <div className="fob-container">
        {/* FOB options */}
        {(isLocalExpanded || isAnimating) && (
          <div ref={optionsRef} className="fob-options">
            <Button
              variant="primary"
              size="medium"
              onClick={handleDropMessageClick}
              className={`fob-option-button ${isLocalExpanded ? 'visible' : ''}`}
              ariaLabel="Drop a Message"
              icon={
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 24 24" 
                  fill="currentColor" 
                  className="fob-option-icon"
                >
                  <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" />
                </svg>
              }
            >
              Drop a Message
            </Button>
            
            <Button
              variant="primary"
              size="medium"
              onClick={handleEditLocationClick}
              className={`fob-option-button ${isLocalExpanded ? 'visible' : ''}`}
              ariaLabel="Edit Location"
              icon={
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 24 24" 
                  fill="currentColor" 
                  className="fob-option-icon"
                >
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                </svg>
              }
            >
              Change Location
            </Button>
            
            <Button
              variant="primary"
              size="medium"
              onClick={handleRefreshLocationClick}
              className={`fob-option-button ${isLocalExpanded ? 'visible' : ''}`}
              ariaLabel="Refresh Location"
              icon={
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 24 24" 
                  fill="currentColor" 
                  className="fob-option-icon"
                >
                  <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 9h7V2l-2.35 4.35z" />
                </svg>
              }
            >
              Refresh Location
            </Button>
          </div>
        )}
        
        {/* Main FOB button */}
        <button 
          className={`fob-button ${isEditMode ? 'fob-button-active' : ''}`}
          onClick={handleMainButtonClick}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          style={{
            transform: isHovered ? 'scale(1.1)' : 'scale(1)',
            transition: 'transform 0.2s ease-in-out'
          }}
          aria-label="Action Button"
        >
          {isEditMode ? (
            // Show checkmark icon when in edit mode
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              fill="white" 
              className="fob-icon"
            >
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
            </svg>
          ) : (
            // Show plus icon by default with rotation animation
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              fill="white" 
              className={`fob-icon ${isLocalExpanded ? 'fob-icon-rotate' : ''}`}
            >
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
            </svg>
          )}
        </button>
      </div>
    </>
  );
}
