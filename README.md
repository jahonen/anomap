# Anonmap

A location-based anonymous messaging application that allows users to drop and discover messages in their vicinity.

## Features

- **Location-Based Messaging**: Drop messages at your current location for others to discover
- **Anonymous Communication**: No user accounts or personal information required
- **Interactive Map**: Explore your surroundings and find messages within a 3km radius
- **Message Flags**: Visually appealing message markers with color coding based on popularity
- **Conversation Threads**: Reply to messages and create conversations
- **Floating Action Button (FOB)**: Easy access to app functions with a non-intrusive UI
- **Location Management**: Manually set your location or use device geolocation
- **Persistent Storage**: Messages are stored in Redis for cross-device accessibility
- **Location Search**: Find and navigate to specific locations on the map
- **Social Sharing**: Share message locations via Bluesky and Reddit

## Privacy First

Anonmap is built with privacy as a core principle:
- No logging of user activity
- No tracking of user movements
- No personal information required
- Messages are anonymous by default
- European-based development and hosting

## Technology Stack

- **Frontend**: Next.js, React, TypeScript
- **Map**: Leaflet.js with OpenStreetMap
- **Backend**: Next.js API Routes
- **Database**: Redis for message storage and geospatial queries
- **Styling**: CSS Modules with custom styling
- **Deployment**: Vercel (recommended)

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm or yarn
- Redis (local or remote instance)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/jahonen/anomap.git
   cd anonmap
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up Redis:
   - For local development: Install Redis and run it on the default port (6379)
   - For production: Set the `REDIS_URL` environment variable to your Redis instance

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Usage

- **View Messages**: Messages within 3km of your location will appear as colored flags on the map
- **Create a Message**: Click the Floating Action Button (bottom right) and select "Drop a Message"
- **Reply to Messages**: Click on a message flag to view details and add replies
- **Change Location**: Use the location edit feature in the FOB menu to manually set your position
- **Search Locations**: Use the search box in the top left to find and navigate to specific places

## Contact

For support or inquiries, please contact: [info@anonmap.net](mailto:info@anonmap.net)

## Website

Visit [anonmap.net](https://anonmap.net) for more information.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Leaflet.js](https://leafletjs.com/) for the interactive maps
- [Next.js](https://nextjs.org/) for the React framework
- [Redis](https://redis.io/) for message storage and geospatial queries
