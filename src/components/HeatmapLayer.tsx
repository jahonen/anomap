'use client';

import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import L from 'leaflet';
import 'leaflet.heat';
import { RootState } from '../redux/store';

// Define the HeatLatLngTuple type for leaflet.heat
type HeatLatLngTuple = [number, number, number?];

// Declare the HeatLayer type since it's not included in the @types/leaflet package
declare module 'leaflet' {
  namespace HeatLayer {
    interface HeatLayerOptions {
      minOpacity?: number;
      maxZoom?: number;
      max?: number;
      radius?: number;
      blur?: number;
      gradient?: { [key: number]: string };
    }
  }
  
  class HeatLayer extends L.Layer {
    constructor(latlngs: HeatLatLngTuple[], options?: HeatLayer.HeatLayerOptions);
    setLatLngs(latlngs: HeatLatLngTuple[]): this;
    addLatLng(latlng: HeatLatLngTuple): this;
    setOptions(options: HeatLayer.HeatLayerOptions): this;
    redraw(): this;
  }
  
  function heatLayer(latlngs: HeatLatLngTuple[], options?: HeatLayer.HeatLayerOptions): HeatLayer;
}

interface HeatmapLayerProps {
  map: L.Map | null;
}

export default function HeatmapLayer({ map }: HeatmapLayerProps) {
  const heatLayerRef = useRef<L.HeatLayer | null>(null);
  
  // Get messages from Redux store
  // The Redux message format has location as an array [lat, lng]
  const reduxMessages = useSelector((state: any) => {
    try {
      return state.messages?.messages || [];
    } catch (error) {
      console.log('HeatmapLayer - Error accessing Redux store:', error);
      return [];
    }
  });
  
  console.log('HeatmapLayer - Redux messages count:', reduxMessages?.length || 0);
  
  useEffect(() => {
    if (!map) {
      console.log('HeatmapLayer - Map not available yet');
      return;
    }
    
    // Clean up any existing heatmap layer
    if (heatLayerRef.current) {
      try {
        // @ts-ignore
        map.removeLayer(heatLayerRef.current);
      } catch (error) {
        console.log('HeatmapLayer - Error removing existing layer:', error);
      }
      heatLayerRef.current = null;
    }
    
    if (!reduxMessages || !Array.isArray(reduxMessages) || reduxMessages.length === 0) {
      console.log('HeatmapLayer - No messages to display');
      return;
    }
    
    // Create heatmap data points from messages
    const heatPoints: HeatLatLngTuple[] = [];
    
    // Log the first message to understand its structure
    if (reduxMessages.length > 0) {
      console.log('HeatmapLayer - Sample message structure:', JSON.stringify(reduxMessages[0]));
    }
    
    // Safely process each message
    reduxMessages.forEach((msg: any) => {
      try {
        // Handle both possible location formats in Redux:
        // 1. location as an array [lat, lng]
        // 2. location as an object {lat, lng}
        let lat: number, lng: number;
        
        if (Array.isArray(msg.location)) {
          // Format: location: [lat, lng]
          [lat, lng] = msg.location;
        } else if (msg.location && typeof msg.location === 'object') {
          // Format: location: {lat, lng}
          lat = msg.location.lat;
          lng = msg.location.lng;
        } else {
          console.log('HeatmapLayer - Skipping message with invalid location format:', msg.id);
          return;
        }
        
        // Skip if lat/lng are not valid numbers
        if (isNaN(lat) || isNaN(lng)) {
          console.log('HeatmapLayer - Skipping message with invalid coordinates:', msg.id);
          return;
        }
        
        // Calculate intensity based on reply count (more replies = higher intensity)
        let replyCount = 0;
        
        if (Array.isArray(msg.replies)) {
          replyCount = msg.replies.length;
        } else if (typeof msg.replyCount === 'number') {
          replyCount = msg.replyCount;
        }
        
        // Intensity should be at least 1 (for the message itself) plus replies
        const intensity = replyCount + 1;
        
        console.log(`HeatmapLayer - Adding point at [${lat}, ${lng}] with intensity ${intensity}`);
        heatPoints.push([lat, lng, intensity]);
      } catch (error) {
        console.log('HeatmapLayer - Error processing message:', error);
      }
    });
    
    console.log('HeatmapLayer - Creating heatmap with points:', heatPoints.length);
    
    if (heatPoints.length === 0) {
      console.log('HeatmapLayer - No valid points to display');
      return;
    }
    
    try {
      // Create and add heatmap layer with more visible settings
      // @ts-ignore
      heatLayerRef.current = L.heatLayer(heatPoints, {
        radius: 30,       // Increased from 25 to 30
        blur: 20,         // Increased from 15 to 20
        maxZoom: 18,      // Increased from 17 to 18
        max: 8,           // Decreased from 10 to 8 (makes lower values more visible)
        minOpacity: 0.5,  // Added minimum opacity to ensure visibility
        gradient: { 0.4: 'blue', 0.65: 'lime', 0.9: 'yellow', 1: 'red' }
      }).addTo(map);
      
      console.log('HeatmapLayer - Heatmap created successfully');
    } catch (error) {
      console.error('HeatmapLayer - Error creating heatmap:', error);
    }
    
    return () => {
      if (heatLayerRef.current && map) {
        try {
          // @ts-ignore
          map.removeLayer(heatLayerRef.current);
        } catch (error) {
          console.error('HeatmapLayer - Error removing layer:', error);
        }
      }
    };
  }, [map, reduxMessages]);
  
  return null; // This component doesn't render anything directly
}
