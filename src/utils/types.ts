// src/utils/types.ts
export interface Avatar {
  color: string;
  shape: string;
  initials: string;
}

export interface Reply {
  id: string;
  content: string;
  timestamp: string;
  avatar?: Avatar; 
}

export interface Message {
  id: string;
  header: string; // Make header non-optional again
  content: string; 
  location: [number, number] | { lat: number; lng: number }; 
  timestamp: string;
  burnRate: number; 
  replies: Reply[];
  expiresAt?: number;
  replyCount?: number;
}