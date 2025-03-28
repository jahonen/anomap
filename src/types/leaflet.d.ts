// src/types/leaflet.d.ts
import * as L from 'leaflet';

declare module 'react-leaflet' {
  // Extend MapContainer props to include center and zoom
  export interface MapContainerProps extends L.MapOptions {
    center: L.LatLngExpression;
    zoom: number;
    children?: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
  }

  // Extend TileLayer props to include attribution and url
  export interface TileLayerProps extends L.TileLayerOptions {
    attribution: string;
    url: string;
    detectRetina?: boolean;
  }
}

declare module 'leaflet' {
  // Add the heatLayer function to the L namespace
  export function heatLayer(
    latlngs: Array<[number, number, number?]>,
    options?: {
      minOpacity?: number;
      maxZoom?: number;
      radius?: number;
      blur?: number;
      max?: number;
    }
  ): L.Layer;
}
