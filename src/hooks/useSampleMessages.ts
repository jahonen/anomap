'use client';

import { useEffect } from 'react';
import { useMessages } from '../contexts/MessagesContext';

// Sample message topics and content
const topics = [
  'Lost dog',
  'Community meetup',
  'Free furniture',
  'Road closure',
  'Power outage',
  'Yard sale',
  'Missing cat',
  'Local event',
  'Food truck',
  'Noise complaint',
  'Found keys',
  'Bike stolen',
  'New restaurant',
  'Street cleaning',
  'Free plants'
];

const contents = [
  'Has anyone seen my dog? Golden retriever, answers to Max.',
  'Community meetup this Saturday at the park. Everyone welcome!',
  'Free furniture on the curb, first come first served.',
  'Road closed due to construction until Friday.',
  'Power outage reported in the area. Anyone else affected?',
  'Yard sale this weekend, lots of great items!',
  'Missing cat, orange tabby with white paws. Please call if found.',
  'Local band playing at the coffee shop tonight. No cover charge.',
  'Food truck festival downtown this weekend. Over 20 vendors!',
  'Loud music coming from the apartment building on Oak St. Anyone else hearing this?',
  'Found keys near the bus stop. DM me to identify.',
  'My bike was stolen from outside the library. Blue mountain bike with a black basket.',
  'New Thai restaurant opened on Main St. Has anyone tried it yet?',
  'Street cleaning scheduled for tomorrow. Remember to move your cars!',
  'Giving away plant cuttings. Message me if interested.'
];

// Random replies
const replies = [
  'Thanks for sharing!',
  'I saw this earlier today.',
  'Has anyone else noticed this?',
  'This is really helpful information.',
  'I\'ll check it out, thanks!',
  'Is this still available?',
  'What time does this start?',
  'I had a similar experience yesterday.',
  'Can you provide more details?',
  'I\'ll be there!'
];

// Hook to generate sample messages around a location
export function useSampleMessages(centerLat: number, centerLng: number) {
  const { messages, addMessage, addReply } = useMessages();
  
  useEffect(() => {
    // Only add sample messages if there are none
    if (messages.length === 0 && centerLat && centerLng) {
      console.log('Generating sample messages around', centerLat, centerLng);
      
      // Generate 10-15 random messages in the area
      const messageCount = Math.floor(Math.random() * 6) + 10; // 10-15 messages
      
      for (let i = 0; i < messageCount; i++) {
        // Random position within ~1km of the center
        // 0.01 in lat/lng is roughly 1km
        const latOffset = (Math.random() - 0.5) * 0.02;
        const lngOffset = (Math.random() - 0.5) * 0.02;
        
        const lat = centerLat + latOffset;
        const lng = centerLng + lngOffset;
        
        // Random topic and content
        const topicIndex = Math.floor(Math.random() * topics.length);
        const contentIndex = Math.floor(Math.random() * contents.length);
        
        const header = topics[topicIndex];
        const content = contents[contentIndex];
        
        // Add the message
        const message = addMessage(header, content, lat, lng);
        
        // Add random number of replies (0-5)
        const replyCount = Math.floor(Math.random() * 6);
        for (let j = 0; j < replyCount; j++) {
          const replyIndex = Math.floor(Math.random() * replies.length);
          addReply(message.id, replies[replyIndex]);
        }
      }
      
      console.log('Generated', messageCount, 'sample messages');
    }
  }, [centerLat, centerLng, messages.length, addMessage, addReply]);
  
  return null;
}
