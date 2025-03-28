'use client';

export default function Footer() {
  return (
    <div className="app-footer">
      <div className="flex items-center justify-center w-full">
        <div className="text-xs text-center">
          No logging. No tracing. Anonymous, always. From Europe with Love ❤️
        </div>
        <div className="absolute right-2 text-xs opacity-50">
          <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">
            © OpenStreetMap
          </a>
          {' | '}
          <a href="https://leafletjs.com" target="_blank" rel="noopener noreferrer">
            Leaflet
          </a>
        </div>
      </div>
    </div>
  );
}
