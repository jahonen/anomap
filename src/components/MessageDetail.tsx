'use client';

import { useState } from 'react';
import { Message, addReply, getHoursRemaining } from '../services/messageService';
import Button from './Button';

interface MessageDetailProps {
  message: Message | null;
  onClose: () => void;
}

export default function MessageDetail({ message, onClose }: MessageDetailProps) {
  const [replyText, setReplyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  if (!message) return null;
  
  const hoursRemaining = getHoursRemaining(message);
  const formattedHours = hoursRemaining.toFixed(1);
  
  const handleSubmitReply = () => {
    if (!replyText.trim()) {
      setError('Reply cannot be empty');
      return;
    }
    
    if (replyText.length > 250) {
      setError('Reply must be 250 characters or less');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      const success = addReply(message.id, replyText);
      
      if (success) {
        setReplyText('');
        // Close the detail view after a short delay to show success
        setTimeout(() => {
          onClose();
        }, 500);
      } else {
        setError('Failed to add reply. Message may have expired.');
      }
    } catch (err) {
      setError('An error occurred while adding your reply');
      console.error('Error adding reply:', err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="message-detail-container">
      <div className="message-detail-backdrop" onClick={onClose}></div>
      <div className="message-detail">
        <div className="message-detail-header">
          <h2>{message.header}</h2>
          <button className="message-detail-close" onClick={onClose}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        </div>
        
        <div className="message-detail-content">
          <p className="message-text">{message.message}</p>
          
          <div className="message-meta">
            <span className="message-replies">
              {message.replyCount} {message.replyCount === 1 ? 'reply' : 'replies'}
            </span>
            <span className="message-expiry">
              {formattedHours} {hoursRemaining === 1 ? 'hour' : 'hours'} remaining
            </span>
          </div>
          
          <div className="message-reply-form">
            <h3>Add a Reply</h3>
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Type your reply here..."
              maxLength={250}
              disabled={isSubmitting}
              className={error ? 'input-error' : ''}
            />
            <div className="character-count">
              {replyText.length}/250
            </div>
            {error && <div className="error-message">{error}</div>}
            
            <div className="message-detail-actions">
              <Button
                variant="secondary"
                size="medium"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="medium"
                onClick={handleSubmitReply}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Reply'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
