'use client';

import { useEffect, useState } from 'react';

export default function Footer() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if we're on the client side
    if (typeof window !== 'undefined') {
      const checkIfMobile = () => {
        setIsMobile(window.innerWidth <= 768);
      };
      
      // Initial check
      checkIfMobile();
      
      // Add event listener for window resize
      window.addEventListener('resize', checkIfMobile);
      
      // Cleanup
      return () => window.removeEventListener('resize', checkIfMobile);
    }
  }, []);

  return (
    <div className="app-footer">
      <div className="flex items-center justify-center w-full footer-content">
        <div className="text-xs text-center">
          No logging. No tracing.{isMobile ? <br /> : ' '}Anonymous, always. From Europe with Love ❤️
        </div>
        <div className="absolute right-2 text-xs opacity-50 footer-attribution">
          <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">
            © OpenStreetMap
          </a>
          {' | '}
          <a href="https://leafletjs.com" target="_blank" rel="noopener noreferrer">
            Leaflet
          </a>
        </div>
      </div>
    </div>
  );
}
