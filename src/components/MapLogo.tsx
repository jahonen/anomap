'use client';

import React, { useState } from 'react';
import AboutModal from './AboutModal';

export default function MapLogo() {
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);

  const handleLogoClick = () => {
    setIsAboutModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsAboutModalOpen(false);
  };

  return (
    <>
      <div 
        className="map-logo-container"
        onClick={handleLogoClick}
        style={{ cursor: 'pointer', pointerEvents: 'auto' }}
      >
        <img 
          src="/images/anonmap_logo.png"
          alt="Anonmap Logo"
          className="map-logo"
        />
      </div>

      {isAboutModalOpen && (
        <AboutModal onClose={handleCloseModal} />
      )}
    </>
  );
}
