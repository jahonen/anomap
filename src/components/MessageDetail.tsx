'use client';

import { useState, useEffect, useRef } from 'react';
import { Message } from '../services/messageService';
import Button from './Button';
import { useMessages, getMessageOpacity } from '../contexts/MessagesContext';
import blueskyIcon from '../assets/images/bluesky.png';
import redditIcon from '../assets/images/reddit.png';
import googleMapsIcon from '../assets/images/google-maps.png';
import appleMapsIcon from '../assets/images/apple-maps.webp';

interface MessageDetailProps {
  message: Message | null;
  onClose: () => void;
}

export default function MessageDetail({ message: initialMessage, onClose }: MessageDetailProps) {
  const [replyText, setReplyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [message, setMessage] = useState<Message | null>(initialMessage);
  const repliesContainerRef = useRef<HTMLDivElement>(null);
  
  // Get messages context
  const { addReply, getHoursRemaining, getMessageById } = useMessages();
  
  // Update the message when initialMessage changes
  useEffect(() => {
    setMessage(initialMessage);
  }, [initialMessage]);
  
  // Scroll to the bottom of replies when they change
  useEffect(() => {
    if (message?.replies && message.replies.length > 0 && repliesContainerRef.current) {
      // Ensure we scroll to the bottom after the DOM has updated
      setTimeout(() => {
        if (repliesContainerRef.current) {
          repliesContainerRef.current.scrollTop = repliesContainerRef.current.scrollHeight;
          console.log('MessageDetail - Scrolled to bottom, replies count:', message.replies.length);
        }
      }, 100);
    }
  }, [message?.replies?.length]); // Only run when the number of replies changes
  
  if (!message) return null;
  
  const hoursRemaining = getHoursRemaining(message);
  
  // Format timestamp to readable date/time
  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };
  
  // Format remaining time as requested
  const formatRemainingTime = (hoursRemaining: number) => {
    if (hoursRemaining >= 1) {
      // More than 60 minutes: show hours
      return `${Math.floor(hoursRemaining)}h`;
    } else {
      // Less than 60 minutes: show minutes
      const minutesRemaining = Math.floor(hoursRemaining * 60);
      return `${minutesRemaining}m`;
    }
  };
  
  // Check if replies exist and is an array
  const hasReplies = message.replies && Array.isArray(message.replies) && message.replies.length > 0;
  
  // Handle reply submission
  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
      // Add reply using Context - now async
      const success = await addReply(message.id, replyText);
      
      if (success) {
        setReplyText('');
        setSuccess('Reply added successfully');
        
        // Get the updated message with the new reply
        const fetchUpdatedMessage = async () => {
          try {
            const updatedMessage = await getMessageById(message.id);
            if (updatedMessage) {
              setMessage(updatedMessage);
            }
          } catch (error) {
            console.error('Error fetching updated message:', error);
          }
        };
        
        fetchUpdatedMessage();
        
        // Clear success message after a delay
        setTimeout(() => {
          setSuccess('');
        }, 3000);
      } else {
        setError('Failed to add reply. Please try again.');
      }
    } catch (error) {
      console.error('Error adding reply:', error);
      setError('Failed to add reply. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
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
          <div className="share-buttons">
            <h3 className="share-header">Share</h3>
            <a 
              href={`https://bsky.app/intent/compose?text=${encodeURIComponent(`"${message.header}" - Anonymous message from Anonmap\n\nCheck out this location on Anonmap: https://anonmap.net/?lat=${message.location.lat}&lng=${message.location.lng}&zoom=18`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="social-share-button bluesky-button"
              aria-label="Share on Bluesky"
            >
              <img src={blueskyIcon.src} alt="Bluesky" width={20} height={20} />
              <span>Bluesky</span>
            </a>
            
            <a 
              href={`https://www.reddit.com/submit?url=${encodeURIComponent(`https://anonmap.net/?lat=${message.location.lat}&lng=${message.location.lng}&zoom=18`)}&title=${encodeURIComponent(`"${message.header}" - Anonymous message from Anonmap`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="social-share-button reddit-button"
              aria-label="Share on Reddit"
            >
              <img src={redditIcon.src} alt="Reddit" width={20} height={20} />
              <span>Reddit</span>
            </a>
          </div>
          <div className="navigate-buttons">
            <h3 className="navigate-header">Navigate</h3>
            <a 
              href={`https://www.google.com/maps/search/?api=1&query=${message.location.lat},${message.location.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="social-share-button google-maps-button"
              aria-label="Share to Google Maps"
            >
              <img src={googleMapsIcon.src} alt="Google Maps" width={20} height={20} />
              <span>Google Maps</span>
            </a>
            
            <a 
              href={`https://maps.apple.com/?q=${message.location.lat},${message.location.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="social-share-button apple-maps-button"
              aria-label="Share to Apple Maps"
            >
              <img src={appleMapsIcon.src} alt="Apple Maps" width={20} height={20} />
              <span>Apple Maps</span>
            </a>
          </div>
        </div>
        
        <div className="message-detail-content">
          <div className="message-bubble original-message">
            <p className="message-text">{message.message}</p>
            <div className="message-timestamp">{formatTimestamp(message.timestamp)}</div>
            <div className="time-remaining">{formatRemainingTime(hoursRemaining)}</div>
          </div>
          <div className="message-meta">
            <span>Opacity: {getMessageOpacity(message).toFixed(2)}</span>
          </div>
        </div>
        
        <div className="message-replies-container" ref={repliesContainerRef}>
          <h3 className="replies-header">Replies {hasReplies ? `(${message.replies.length})` : ''}</h3>
          
          {hasReplies ? (
            <div className="message-replies">
              {message.replies.map((reply, index) => (
                <div 
                  key={reply.id} 
                  className={`message-bubble reply ${index % 2 === 0 ? 'reply-left' : 'reply-right'}`}
                >
                  <p className="message-text">{reply.text}</p>
                  <div className="message-timestamp">{formatTimestamp(reply.timestamp)}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-replies">No replies yet. Be the first to reply!</p>
          )}
        </div>
        
        <div className="message-reply-form">
          <h3 className="reply-form-header">Add Reply</h3>
          <form onSubmit={handleReplySubmit}>
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Add your reply..."
              maxLength={250}
            />
            <div className="message-detail-actions">
              <span className="char-count">{replyText.length}/250</span>
              {error && <span className="error-message">{error}</span>}
              {success && <span className="success-message">{success}</span>}
              <Button 
                disabled={isSubmitting || !replyText.trim()}
              >
                {isSubmitting ? 'Sending...' : 'Reply'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
