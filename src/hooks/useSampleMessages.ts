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
    // Only generate sample messages if there are none
    if (messages.length === 0) {
      console.log('Generating sample messages around', centerLat, centerLng);
      
      const generateSampleMessages = async () => {
        const messageCount = 10; // Number of sample messages to generate
        
        for (let i = 0; i < messageCount; i++) {
          // Generate random coordinates within ~1km radius
          const latOffset = (Math.random() - 0.5) * 0.02;
          const lngOffset = (Math.random() - 0.5) * 0.02;
          
          const lat = centerLat + latOffset;
          const lng = centerLng + lngOffset;
          
          // Pick random topic and content
          const topicIndex = Math.floor(Math.random() * topics.length);
          const contentIndex = Math.floor(Math.random() * contents.length);
          
          const header = topics[topicIndex];
          const content = contents[contentIndex];
          
          try {
            // Add the message
            const message = await addMessage(header, content, lat, lng);
            
            if (message) {
              // Add random number of replies (0-5)
              const replyCount = Math.floor(Math.random() * 6);
              for (let j = 0; j < replyCount; j++) {
                const replyIndex = Math.floor(Math.random() * replies.length);
                await addReply(message.id, replies[replyIndex]);
              }
            }
          } catch (error) {
            console.error('Error generating sample message:', error);
          }
        }
        
        console.log('Generated', messageCount, 'sample messages');
      };
      
      generateSampleMessages();
    }
  }, [centerLat, centerLng, messages.length, addMessage, addReply]);
  
  return null;
}
