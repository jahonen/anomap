'use client';

import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addMessage as addMessageAction } from '../redux/slices/messagesSlice';
import { RootState } from '../redux/store';
import { calculateDistance } from '../services/messageService';

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

  // Get Redux dispatch and messages, but handle the case when Redux is not available
  let dispatch: any = null;
  let reduxMessages: any[] = [];
  try {
    dispatch = useDispatch();
    reduxMessages = useSelector((state: RootState) => state.messages.messages) || [];
  } catch (error) {
    console.log('MessageModal - Redux not available yet:', error);
  }

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
    
    // Check if header is unique in 3km radius
    const isHeaderUnique = !reduxMessages.some(msg => {
      const distance = calculateDistance(
        coordinates[0], coordinates[1],
        msg.location[0], msg.location[1]
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
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const isHeaderValid = validateHeader(header);
    const isMessageValid = validateMessage(message);
    
    if (!isHeaderValid || !isMessageValid) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Add message to Redux store if available
      if (dispatch) {
        try {
          dispatch(addMessageAction(message, [coordinates[0], coordinates[1]], 1, header));
          console.log('MessageModal - Message added to Redux store');
          // Call onSubmit with success
          onSubmit(true);
        } catch (error) {
          console.error('Error adding message to Redux:', error);
          onSubmit(false, 'An error occurred while dropping your message');
        }
      } else {
        onSubmit(false, 'Redux store is not available');
      }
    } catch (error) {
      console.error('Error adding message:', error);
      onSubmit(false, 'An error occurred while dropping your message');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal-container">
        <div className="modal-header">
          <h2>Drop a Message</h2>
          <button className="modal-close" onClick={onClose}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="header">Header (12 chars max, must be unique in this area)</label>
            <input
              type="text"
              id="header"
              value={header}
              onChange={(e) => {
                setHeader(e.target.value);
                if (headerError) validateHeader(e.target.value);
              }}
              maxLength={12}
              className={headerError ? 'input-error' : ''}
              disabled={isSubmitting}
            />
            {headerError && <div className="error-message">{headerError}</div>}
          </div>
          
          <div className="form-group">
            <label htmlFor="message">Message (250 chars max)</label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                if (messageError) validateMessage(e.target.value);
              }}
              maxLength={250}
              rows={4}
              className={messageError ? 'input-error' : ''}
              disabled={isSubmitting}
            />
            <div className="character-count">
              {message.length}/250
            </div>
            {messageError && <div className="error-message">{messageError}</div>}
          </div>
          
          <div className="modal-actions">
            <button
              type="button"
              className="button button-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            
            <button
              type="button"
              className="button button-secondary"
              disabled={isSubmitting}
            >
              Add Photo
            </button>
            
            <button
              type="submit"
              className="button button-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
