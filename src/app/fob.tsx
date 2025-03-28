'use client';

import { useState, useEffect } from 'react';

export interface FobProps {
  isEditMode: boolean;
  isExpanded: boolean;
  isHeatmapMode?: boolean;
  onEditLocation: () => void;
  onRefreshLocation: () => void;
  onToggleExpanded: () => void;
  onOpenMessageModal: () => void;
  onToggleHeatmap?: () => void;
}

export default function Fob({ 
  isEditMode, 
  isExpanded, 
  isHeatmapMode = false,
  onEditLocation, 
  onRefreshLocation, 
  onToggleExpanded,
  onOpenMessageModal,
  onToggleHeatmap
}: FobProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Handle animation state
  useEffect(() => {
    if (isExpanded) {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 300); // Match this with the animation duration in CSS
      
      return () => clearTimeout(timer);
    }
  }, [isExpanded]);
  
  return (
    <div className="fob-container footer-relative">
      {/* Main FOB button */}
      <button 
        className={`fob-button ${isEditMode ? 'edit-mode' : ''}`}
        onClick={onToggleExpanded}
        aria-label="Toggle options"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 24 24" 
          fill="currentColor" 
          className="w-6 h-6"
        >
          <path 
            fillRule="evenodd" 
            d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" 
            clipRule="evenodd" 
          />
        </svg>
      </button>
      
      {/* FOB options */}
      {isExpanded && (
        <div className={`fob-options ${isAnimating ? 'animating' : ''}`}>
          {/* Edit Location Button */}
          <button 
            className={`fob-option-button ${isEditMode ? 'active' : ''}`}
            onClick={onEditLocation}
            aria-label={isEditMode ? 'Done Editing' : 'Edit Location'}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              fill="currentColor" 
              className="w-6 h-6"
            >
              <path 
                fillRule="evenodd" 
                d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" 
                clipRule="evenodd" 
              />
            </svg>
            <span>{isEditMode ? 'Done Editing' : 'Edit Location'}</span>
          </button>
          
          {/* Toggle Heatmap Button */}
          {onToggleHeatmap && (
            <button 
              className={`fob-option-button ${isHeatmapMode ? 'active' : ''}`}
              onClick={onToggleHeatmap}
              aria-label={isHeatmapMode ? 'Message View' : 'Heatmap View'}
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill="currentColor" 
                className="w-6 h-6"
              >
                {isHeatmapMode ? (
                  // Message view icon (chat bubbles)
                  <path 
                    d="M4.913 2.658c2.075-.27 4.19-.408 6.337-.408 2.147 0 4.262.139 6.337.408 1.922.25 3.291 1.861 3.405 3.727a4.403 4.403 0 00-1.032-.211 50.89 50.89 0 00-8.42 0c-2.358.196-4.04 2.19-4.04 4.434v4.286a4.47 4.47 0 002.433 3.984L7.28 21.53A.75.75 0 016 21v-4.03a48.527 48.527 0 01-1.087-.128C2.905 16.58 1.5 14.833 1.5 12.862V6.638c0-1.97 1.405-3.718 3.413-3.979z" 
                  />
                ) : (
                  // Heatmap view icon (fire/heat)
                  <path 
                    d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" 
                  />
                )}
              </svg>
              <span>{isHeatmapMode ? 'Message View' : 'Heatmap View'}</span>
            </button>
          )}
          
          {/* Refresh Location Button */}
          <button 
            className="fob-option-button"
            onClick={onRefreshLocation}
            aria-label="Refresh Location"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              fill="currentColor" 
              className="w-6 h-6"
            >
              <path 
                fillRule="evenodd" 
                d="M4.755 10.059a7.5 7.5 0 0112.548-3.364l1.903 1.903h-3.183a.75.75 0 100 1.5h4.992a.75.75 0 00.75-.75V4.356a.75.75 0 00-1.5 0v3.18l-1.9-1.9A9 9 0 003.306 9.67a.75.75 0 101.45.388zm15.408 3.352a.75.75 0 00-.919.53 7.5 7.5 0 01-12.548 3.364l-1.902-1.903h3.183a.75.75 0 000-1.5H2.984a.75.75 0 00-.75.75v4.992a.75.75 0 001.5 0v-3.18l1.9 1.9a9 9 0 0015.059-4.035.75.75 0 00-.53-.918z" 
                clipRule="evenodd" 
              />
            </svg>
            <span>Refresh Location</span>
          </button>
          
          {/* Drop a Message Button */}
          <button 
            className="fob-option-button"
            onClick={onOpenMessageModal}
            aria-label="Drop a Message"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              fill="currentColor" 
              className="w-6 h-6"
            >
              <path 
                d="M21.731 2.269a2.625 2.625 0 00-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 000-3.712zM19.513 8.199l-3.712-3.712-12.15 12.15a5.25 5.25 0 00-1.32 2.214l-.8 2.685a.75.75 0 00.933.933l2.685-.8a5.25 5.25 0 002.214-1.32L19.513 8.2z" 
              />
            </svg>
            <span>Drop a Message</span>
          </button>
        </div>
      )}
    </div>
  );
}
