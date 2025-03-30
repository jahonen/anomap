'use client';

import { useState } from 'react';
import { useMessages } from '../contexts/MessagesContext';
import { calculateDistance } from '../utils/distance.js';

interface MessageModalProps {
  onClose: () => void;
  onSubmit: (success: boolean, message?: string) => void;
  coordinates: [number, number];
}

export default function MessageModal({ onClose, onSubmit, coordinates }: MessageModalProps) {
  const [header, setHeader] = useState('');
  const [message, setMessage] = useState('');
  const [headerError, setHeaderError] = useState('');
  const [messageError, setMessageError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get messages context
  const { messages, addMessage } = useMessages();

  // Validate header
  const validateHeader = (value: string): boolean => {
    if (!value.trim()) {
      setHeaderError('Header is required');
      return false;
    }
    
    if (value.length > 12) {
      setHeaderError('Header must be 12 characters or less');
      return false;
    }
    
    // Check if header is unique in 3km radius using Context
    const isHeaderUnique = !messages.some(msg => {
      // Extract lat/lng, handling both array and object formats
      let lat: number;
      let lng: number;
      if (Array.isArray(msg.location)) {
        lat = msg.location[0];
        lng = msg.location[1];
      } else {
        lat = msg.location.lat;
        lng = msg.location.lng;
      }

      // Validate coordinates before calculating distance
      if (typeof lat !== 'number' || isNaN(lat) || typeof lng !== 'number' || isNaN(lng)) {
          console.warn('MessageModal - Invalid location for message during uniqueness check:', msg.id, msg.location);
          return false; // Skip this message if location is invalid
      }

      const distance = calculateDistance(
        coordinates[0], coordinates[1],
        lat, lng // Use extracted coordinates
      );
      return distance <= 3 && msg.header && msg.header.toLowerCase() === value.toLowerCase();
    });
    
    if (!isHeaderUnique) {
      setHeaderError('This header is already used by another message in this area');
      return false;
    }
    
    setHeaderError('');
    return true;
  };

  // Validate message
  const validateMessage = (value: string): boolean => {
    if (!value.trim()) {
      setMessageError('Message is required');
      return false;
    }
    
    if (value.length > 250) {
      setMessageError('Message must be 250 characters or less');
      return false;
    }
    
    setMessageError('');
    return true;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const isHeaderValid = validateHeader(header);
    const isMessageValid = validateMessage(message);
    
    if (!isHeaderValid || !isMessageValid) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Add message using Context - now async
      // Pass coordinates array directly as the third argument
      const newMessage = await addMessage(header, message, coordinates); 
      console.log('MessageModal - Message added using Context:', newMessage);
      
      // Call onSubmit with success
      onSubmit(true);
    } catch (error) {
      console.error('Error adding message:', error);
      onSubmit(false, 'Failed to add message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-container">
        <div className="modal-header">
          <h2>Drop a Message</h2>
          <button 
            className="modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            &times;
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="header">Header (max 12 chars)</label>
            <input
              type="text"
              id="header"
              value={header}
              onChange={(e) => {
                setHeader(e.target.value);
                if (headerError) validateHeader(e.target.value);
              }}
              maxLength={12}
              placeholder="Enter a header for your message"
              className={headerError ? 'error' : ''}
            />
            {headerError && <div className="error-message">{headerError}</div>}
          </div>
          
          <div className="form-group">
            <label htmlFor="message">Message (max 250 chars)</label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                if (messageError) validateMessage(e.target.value);
              }}
              maxLength={250}
              placeholder="What do you want to say?"
              rows={5}
              className={messageError ? 'error' : ''}
            />
            {messageError && <div className="error-message">{messageError}</div>}
            <div className="char-count">{message.length}/250</div>
          </div>
          
          <div className="form-group">
            <label>Location</label>
            <div className="location-display">
              Lat: {coordinates[0].toFixed(6)}, Lng: {coordinates[1].toFixed(6)}
            </div>
            <p className="location-note">
              This message will be visible to users within 3km of this location.
            </p>
          </div>
          
          <div className="form-actions">
            <button 
              type="button" 
              onClick={onClose}
              className="button secondary"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="button primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Dropping...' : 'Drop Message'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
