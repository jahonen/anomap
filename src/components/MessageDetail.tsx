'use client';

import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { addReply as addReplyAction } from '../redux/slices/messagesSlice';
import { Message, getHoursRemaining } from '../services/messageService';
import Button from './Button';

interface MessageDetailProps {
  message: Message | null;
  onClose: () => void;
}

export default function MessageDetail({ message, onClose }: MessageDetailProps) {
  const [replyText, setReplyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // Get Redux dispatch, but handle the case when Redux is not available
  let dispatch: any = null;
  try {
    dispatch = useDispatch();
  } catch (error) {
    console.log('MessageDetail - Redux not available yet:', error);
  }
  
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
      // Add reply to Redux store if available
      if (dispatch) {
        try {
          dispatch(addReplyAction(message.id, replyText));
          console.log('MessageDetail - Reply added to Redux store');
          setReplyText('');
          // Close the detail view after a short delay to show success
          setTimeout(() => {
            onClose();
          }, 500);
        } catch (error) {
          console.error('Error adding reply to Redux:', error);
          setError('An error occurred while adding your reply');
        }
      } else {
        setError('Redux store is not available');
      }
    } catch (err) {
      setError('An error occurred while adding your reply');
      console.error('Error adding reply:', err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Format timestamp to readable date/time
  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };
  
  // Check if replies exist and is an array
  const hasReplies = message.replies && Array.isArray(message.replies) && message.replies.length > 0;
  
  console.log('MessageDetail - Message:', message);
  console.log('MessageDetail - Replies:', message.replies);
  
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
        
        <div className="social-share-buttons">
          <a 
            href={`https://bsky.app/intent/compose?text=${encodeURIComponent(`"${message.header}" - Anonymous message from Anonmap\n\nCheck out this location on Anonmap: https://anonmap.net/?lat=${message.location.lat}&lng=${message.location.lng}&zoom=18`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="social-share-button bluesky-button"
            aria-label="Share on Bluesky"
          >
            <span className="social-icon">🦋</span>
            <span>Bluesky</span>
          </a>
          
          <a 
            href={`https://www.reddit.com/submit?url=${encodeURIComponent(`https://anonmap.net/?lat=${message.location.lat}&lng=${message.location.lng}&zoom=18`)}&title=${encodeURIComponent(`"${message.header}" - Anonymous message from Anonmap`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="social-share-button reddit-button"
            aria-label="Share on Reddit"
          >
            <span className="social-icon">👽</span>
            <span>Reddit</span>
          </a>
        </div>
        
        <div className="message-detail-content">
          <div className="message-bubble original-message">
            <p className="message-text">{message.message}</p>
            <div className="message-timestamp">{formatTimestamp(message.timestamp)}</div>
          </div>
          
          {/* Display replies as alternating speech bubbles */}
          {hasReplies && (
            <div className="message-replies-container">
              {message.replies.map((reply, index) => (
                <div 
                  key={reply.id} 
                  className={`message-bubble reply ${index % 2 === 0 ? 'reply-right' : 'reply-left'}`}
                >
                  <p className="message-text">{reply.text}</p>
                  <div className="message-timestamp">{formatTimestamp(reply.timestamp)}</div>
                </div>
              ))}
            </div>
          )}
          
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
