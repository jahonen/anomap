# Burnhen

A location-based messaging application that allows users to drop and discover messages in their vicinity.

## Features

- **Location-Based Messaging**: Drop messages at your current location for others to discover
- **Interactive Map**: Explore your surroundings and find messages within a 3km radius
- **Message Flags**: Visually appealing message markers with color coding based on popularity
- **Floating Action Button (FOB)**: Easy access to app functions with a non-intrusive UI
- **Location Management**: Manually set your location or use device geolocation
- **Persistent Storage**: Messages are stored in Redux and persist across sessions

## Technology Stack

- **Frontend**: Next.js, React, TypeScript
- **Map**: Leaflet.js
- **State Management**: Redux with redux-persist
- **Styling**: CSS Modules, Tailwind CSS
- **Deployment**: Vercel (recommended)

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/jahonen/anomap.git
   cd burnhen
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Dropping a Message

1. Click the Floating Action Button (FOB) in the bottom right corner
2. Select "Drop a Message"
3. Enter a header (max 12 characters) and your message (max 250 characters)
4. Submit the form to drop your message at your current location

### Discovering Messages

- Messages appear as colored flags on the map
- Blue flags indicate messages with few replies
- Red flags indicate popular messages with many replies
- Click on a flag to view the message details

### Managing Your Location

- Click the FOB and select "Edit Location" to manually set your location
- Click on the map or drag the marker to your desired location
- Click the FOB and select "Refresh Location" to use your device's geolocation

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Leaflet.js](https://leafletjs.com/) for the interactive maps
- [Next.js](https://nextjs.org/) for the React framework
- [Redux](https://redux.js.org/) for state management
