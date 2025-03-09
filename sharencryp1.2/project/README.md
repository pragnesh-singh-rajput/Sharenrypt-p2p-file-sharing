# Sharencrypt - Secure Peer-to-Peer File Sharing

This project demonstrates how to establish reliable peer-to-peer connections without using WebRTC, using a custom relay server approach.

## Features

- Direct communication between two or more users
- Secure data transfer with end-to-end encryption
- Cross-browser and cross-platform compatibility
- NAT/firewall traversal through relay servers
- Automatic reconnection and fallback mechanisms
- File transfer with progress tracking

## Architecture

The solution uses a hybrid approach:

1. **Relay Server**: A WebSocket server that facilitates communication between peers
2. **Client Library**: A JavaScript library that handles connections, encryption, and data transfer
3. **Fallback Mechanisms**: Automatic reconnection and error handling

## Getting Started

### Prerequisites

- Node.js 14.x or higher
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Start the relay server:

```bash
npm run start-relay
```

4. Start the development server:

```bash
npm run dev
```

## How It Works

### Connection Establishment

1. Both peers connect to the relay server via WebSockets
2. Peer A initiates a connection request to Peer B through the relay server
3. Peer B accepts the connection request
4. Both peers can now exchange data through the relay server

### Data Transfer

1. Data is encrypted on the sender's side using AES-GCM
2. Encrypted data is split into chunks and sent through the relay server
3. Receiver reassembles the chunks and decrypts the data
4. Large files are transferred with progress tracking

### Security

- All data is encrypted end-to-end using AES-GCM
- Encryption keys are generated for each session
- No data is stored on the relay server

## Deployment

### Relay Server

The relay server can be deployed to any Node.js hosting platform:

1. **Heroku**:
   ```bash
   heroku create
   git push heroku main
   ```

2. **DigitalOcean**:
   Deploy using App Platform or a Droplet

3. **AWS**:
   Deploy to EC2, Elastic Beanstalk, or Lambda with API Gateway

### Client Application

The client application can be deployed to any static hosting service:

1. **Netlify**:
   ```bash
   npm run build
   netlify deploy
   ```

2. **Vercel**:
   ```bash
   npm run build
   vercel
   ```

## Performance Considerations

- **Bandwidth**: The relay server requires sufficient bandwidth to handle all connections
- **Latency**: Using a relay server adds some latency compared to direct WebRTC connections
- **Scalability**: For large-scale deployments, consider using multiple relay servers with load balancing

## Limitations

- Higher latency compared to WebRTC
- Increased server costs due to relay traffic
- No UDP support (TCP only)
- No direct peer-to-peer connections

## License

This project is licensed under the MIT License - see the LICENSE file for details.