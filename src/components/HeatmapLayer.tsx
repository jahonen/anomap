'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet.heat';
import { useMessages } from '../contexts/MessagesContext';

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
  
  // Get messages from Context
  const { messages } = useMessages();
  
  console.log('HeatmapLayer - Messages count:', messages?.length || 0);
  
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
    
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      console.log('HeatmapLayer - No messages to display');
      return;
    }
    
    // Create heatmap data points from messages
    const heatPoints: HeatLatLngTuple[] = [];
    
    // Log the first message to understand its structure
    if (messages.length > 0) {
      console.log('HeatmapLayer - Sample message structure:', JSON.stringify(messages[0]));
    }
    
    // Process each message
    messages.forEach((msg) => {
      try {
        const lat = msg.location.lat;
        const lng = msg.location.lng;
        
        // Validate coordinates
        if (typeof lat === 'number' && !isNaN(lat) && 
            typeof lng === 'number' && !isNaN(lng)) {
          
          // Calculate intensity based on reply count (0.5 to 1.0)
          const intensity = Math.min(1.0, 0.5 + (msg.replyCount * 0.1));
          
          heatPoints.push([lat, lng, intensity]);
        } else {
          console.log('HeatmapLayer - Invalid coordinates in message:', msg.id);
        }
      } catch (error) {
        console.log('HeatmapLayer - Error processing message:', error);
      }
    });
    
    console.log('HeatmapLayer - Created heat points:', heatPoints.length);
    
    if (heatPoints.length > 0) {
      // Create heatmap layer with custom gradient
      try {
        // @ts-ignore - Using type assertion to bypass type checking for the gradient option
        const heatLayer = L.heatLayer(heatPoints, {
          radius: 25,
          blur: 15,
          maxZoom: 17,
          max: 1.0,
          gradient: {
            0.4: 'blue',
            0.6: 'lime',
            0.8: 'yellow',
            1.0: 'red'
          }
        } as any).addTo(map);
        
        // @ts-ignore - Assign the layer with type assertion
        heatLayerRef.current = heatLayer as L.HeatLayer;
        console.log('HeatmapLayer - Heatmap created successfully');
      } catch (error) {
        console.error('HeatmapLayer - Error creating heatmap:', error);
      }
    }
    
    // Cleanup function
    return () => {
      if (heatLayerRef.current) {
        try {
          // @ts-ignore
          map.removeLayer(heatLayerRef.current);
          console.log('HeatmapLayer - Removed on cleanup');
        } catch (error) {
          console.log('HeatmapLayer - Error removing layer on cleanup:', error);
        }
        heatLayerRef.current = null;
      }
    };
  }, [map, messages]);
  
  return null; // This component doesn't render anything directly
}
