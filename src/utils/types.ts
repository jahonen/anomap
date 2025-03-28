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
  header?: string; // Optional header field for the message
  content: string;
  location: [number, number]; 
  timestamp: string;
  burnRate: number; 
  replies: Reply[];
}