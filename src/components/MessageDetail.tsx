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
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
              <path d="M12.001 2C6.47813 2 2.00098 6.47715 2.00098 12C2.00098 17.5228 6.47813 22 12.001 22C17.5238 22 22.001 17.5228 22.001 12C22.001 6.47715 17.5238 2 12.001 2ZM16.2574 8.96979C16.2574 8.96979 16.6377 8.96979 16.8279 9.16004C16.9229 9.25504 16.9989 9.43929 16.9989 9.62454C16.9989 9.88979 16.9609 10.2283 16.9229 10.5668C16.7327 12.0283 15.5947 15.1435 15.5947 15.1435C15.5947 15.1435 15.5187 15.3288 15.3665 15.4048C15.2143 15.4808 15.0241 15.4808 14.9101 15.4808C14.7959 15.4808 14.6057 15.4808 14.4535 15.4048C14.3013 15.3288 14.2253 15.1435 14.2253 15.1435C14.2253 15.1435 13.0873 12.0283 12.8971 10.5668C12.8591 10.2283 12.8211 9.88979 12.8211 9.62454C12.8211 9.43929 12.8971 9.25504 12.9921 9.16004C13.1823 8.96979 13.5626 8.96979 13.5626 8.96979H16.2574ZM10.4384 8.96979C10.4384 8.96979 10.8187 8.96979 11.0089 9.16004C11.1039 9.25504 11.1799 9.43929 11.1799 9.62454C11.1799 9.88979 11.1419 10.2283 11.1039 10.5668C10.9137 12.0283 9.77571 15.1435 9.77571 15.1435C9.77571 15.1435 9.69971 15.3288 9.54751 15.4048C9.39531 15.4808 9.20511 15.4808 9.09091 15.4808C8.97671 15.4808 8.78651 15.4808 8.63431 15.4048C8.48211 15.3288 8.40611 15.1435 8.40611 15.1435C8.40611 15.1435 7.26811 12.0283 7.07791 10.5668C7.03991 10.2283 7.00191 9.88979 7.00191 9.62454C7.00191 9.43929 7.07791 9.25504 7.17291 9.16004C7.36311 8.96979 7.74341 8.96979 7.74341 8.96979H10.4384Z" fill="#0085ff"/>
            </svg>
            <span>Bluesky</span>
          </a>
          
          <a 
            href={`https://www.reddit.com/submit?url=${encodeURIComponent(`https://anonmap.net/?lat=${message.location.lat}&lng=${message.location.lng}&zoom=18`)}&title=${encodeURIComponent(`"${message.header}" - Anonymous message from Anonmap`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="social-share-button reddit-button"
            aria-label="Share on Reddit"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
              <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM17.63 14.5C17.27 15.37 16.11 16.1 14.5 16.5C13.94 16.64 13.36 16.72 12.79 16.75C12.55 16.77 12.31 16.77 12.06 16.77C11.81 16.77 11.57 16.77 11.33 16.75C10.76 16.72 10.18 16.64 9.62 16.5C8.01 16.1 6.85 15.37 6.49 14.5C6.37 14.25 6.31 13.98 6.31 13.69C6.31 13.39 6.37 13.12 6.49 12.87C6.85 12 8.01 11.27 9.62 10.87C10.18 10.73 10.76 10.65 11.33 10.62C11.57 10.6 11.81 10.6 12.06 10.6C12.31 10.6 12.55 10.6 12.79 10.62C13.36 10.65 13.94 10.73 14.5 10.87C16.11 11.27 17.27 12 17.63 12.87C17.75 13.12 17.81 13.39 17.81 13.69C17.81 13.98 17.75 14.25 17.63 14.5ZM10.5 13.69C10.5 14.44 11.11 15.06 11.87 15.06C12.62 15.06 13.25 14.44 13.25 13.69C13.25 12.94 12.63 12.31 11.87 12.31C11.11 12.31 10.5 12.94 10.5 13.69ZM14.69 10.12C14.25 10.12 13.88 10.5 13.88 10.94C13.88 11.38 14.25 11.75 14.69 11.75C15.13 11.75 15.5 11.38 15.5 10.94C15.5 10.5 15.13 10.12 14.69 10.12ZM9.31 10.12C8.87 10.12 8.5 10.5 8.5 10.94C8.5 11.38 8.87 11.75 9.31 11.75C9.75 11.75 10.12 11.38 10.12 10.94C10.12 10.5 9.75 10.12 9.31 10.12Z" fill="#FF4500"/>
            </svg>
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
