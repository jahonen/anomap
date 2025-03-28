'use client';

import { useState, useEffect } from 'react';
import Button from './Button';

interface MessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (header: string, message: string) => void;
  userLocation: { lat: number; lng: number } | null;
}

export default function MessageModal({ isOpen, onClose, onSubmit, userLocation }: MessageModalProps) {
  const [header, setHeader] = useState('');
  const [message, setMessage] = useState('');
  const [headerError, setHeaderError] = useState('');
  const [messageError, setMessageError] = useState('');

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setHeader('');
      setMessage('');
      setHeaderError('');
      setMessageError('');
    }
  }, [isOpen]);

  const handleSubmit = () => {
    // Validate inputs
    let isValid = true;

    if (!header.trim()) {
      setHeaderError('Header is required');
      isValid = false;
    } else if (header.length > 12) {
      setHeaderError('Header must be 12 characters or less');
      isValid = false;
    } else {
      setHeaderError('');
    }

    if (!message.trim()) {
      setMessageError('Message is required');
      isValid = false;
    } else if (message.length > 250) {
      setMessageError('Message must be 250 characters or less');
      isValid = false;
    } else {
      setMessageError('');
    }

    if (isValid) {
      onSubmit(header, message);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="modal-backdrop" onClick={onClose}></div>
      <div className="message-modal">
        <div className="modal-header">
          <h2>Drop a Message</h2>
          <button className="modal-close-button" onClick={onClose}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        </div>
        
        <div className="modal-content">
          <div className="form-group">
            <label htmlFor="message-header">
              Header <span className="character-count">{header.length}/12</span>
            </label>
            <input
              id="message-header"
              type="text"
              value={header}
              onChange={(e) => {
                setHeader(e.target.value);
                if (e.target.value.length <= 12) {
                  setHeaderError('');
                }
              }}
              maxLength={12}
              placeholder="Enter a unique header"
              className={headerError ? 'input-error' : ''}
            />
            {headerError && <div className="error-message">{headerError}</div>}
            <div className="helper-text">Must be unique in 3 KM radius</div>
          </div>
          
          <div className="form-group">
            <label htmlFor="message-content">
              Message <span className="character-count">{message.length}/250</span>
            </label>
            <textarea
              id="message-content"
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                if (e.target.value.length <= 250) {
                  setMessageError('');
                }
              }}
              maxLength={250}
              placeholder="Enter your message"
              rows={5}
              className={messageError ? 'input-error' : ''}
            />
            {messageError && <div className="error-message">{messageError}</div>}
          </div>
          
          {!userLocation && (
            <div className="warning-message">
              Location data is required to drop a message. Please enable location services.
            </div>
          )}
        </div>
        
        <div className="modal-footer">
          <Button 
            variant="secondary" 
            size="medium" 
            onClick={onClose}
          >
            Cancel
          </Button>
          
          <Button 
            variant="secondary" 
            size="medium" 
            onClick={() => alert('Photo upload not implemented yet')}
            disabled={!userLocation}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                <path d="M3 4V1h2v3h3v2H5v3H3V6H0V4h3zm3 6V7h3V4h7l1.83 2H21c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2V10h3zm7 9c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-3.2-5c0 1.77 1.43 3.2 3.2 3.2s3.2-1.43 3.2-3.2-1.43-3.2-3.2-3.2-3.2 1.43-3.2 3.2z" />
              </svg>
            }
          >
            Add Photo
          </Button>
          
          <Button 
            variant="primary" 
            size="medium" 
            onClick={handleSubmit}
            disabled={!userLocation}
          >
            Submit
          </Button>
        </div>
      </div>
    </>
  );
}
