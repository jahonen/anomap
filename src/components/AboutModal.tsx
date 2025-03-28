'use client';

import React from 'react';

interface AboutModalProps {
  onClose: () => void;
}

export default function AboutModal({ onClose }: AboutModalProps) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container about-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>About Anonmap</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-content">
          <div className="about-logo-container">
            <img 
              src="/images/anonmap_logo.png" 
              alt="Anonmap Logo" 
              className="about-logo"
            />
          </div>
          
          <div className="about-description">
            <p>
              Anonmap is a location-based anonymous messaging application that allows users to 
              drop messages at specific locations for others to discover.
            </p>
            <p>
              No logging. No tracing. Anonymous, always. From Europe with Love ❤️
            </p>
          </div>
          
          <div className="about-info">
            <p><strong>Website:</strong> <a href="https://anonmap.net" target="_blank" rel="noopener noreferrer">anonmap.net</a></p>
            <p><strong>Support:</strong> <a href="mailto:info@anonmap.net">info@anonmap.net</a></p>
            <p><strong>Copyright:</strong> © 2025 Anonmap, All Rights Reserved.</p>
            <p className="terms">Use of service only allowed for good stuff.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
