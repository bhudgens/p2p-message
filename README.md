# p2p-message

A simple and efficient peer-to-peer messaging library for direct browser-to-browser communication. Any peers using the same network key will automatically discover and connect to each other through configurable tracker servers.

## Features

- 🔒 Secure P2P messaging
- 🚀 Zero server requirements - pure browser-to-browser communication
- 🎯 Simple API with event-based architecture
- 📡 Automatic peer discovery through tracker servers
- 📊 Connection status monitoring
- 🛠 Configurable network settings and trackers

## Installation

```bash
npm install p2p-message
```

Or include directly in your HTML:

```html
<script src="https://unpkg.com/p2p-message@1.0.0/dist/p2p-message.min.js"></script>
```

## Usage

Key functionality:
- Initialize P2P messaging with a unique network key (all peers using this key will connect)
- Configure tracker servers for peer discovery
- Set up message and connection event handlers
- Connect to the P2P network
- Send messages to specific peers
- Broadcast messages to all connected peers
- Disconnect and clean up when done

```javascript
// Initialize with configuration
const config = {
  key: 'unique-network-key',  // All peers using this key will connect
  trackers: [                 // Tracker servers for peer discovery
    'wss://tracker.openwebtorrent.com'
  ],
  onMessage: (peerId, message) => {
    console.log(`Message from ${peerId}: ${message}`);
  },
  onConnect: (peerId) => {
    console.log(`New peer connected: ${peerId}`);
  }
};

// Create instance and connect
const p2p = new P2PMessage(config);
p2p.connect();

// Send message to a specific peer
p2p.send('peer-id-123', 'Hello, peer!');

// Broadcast implementation
const peers = new Set();

// Track connected peers
config.onConnect = (peerId) => {
  peers.add(peerId);
  console.log(`New peer connected: ${peerId}`);
};

// Broadcast to all peers
function broadcast(message) {
  peers.forEach(peerId => {
    p2p.send(peerId, message);
  });
}

// Clean up when done
p2p.disconnect();
```

## API Reference

Constructor options:
- `key` (required): String - Unique network identifier. All peers using the same key will automatically connect
- `trackers` (optional): Array - List of WebSocket tracker URLs for peer discovery. Defaults to public trackers
- `onMessage` (optional): Function(peerId, message) - Called when receiving messages
- `onConnect` (optional): Function(peerId) - Called when a new peer connects

Available methods:
- `connect()` - Connects to the P2P network through configured trackers
- `send(peerId, message)` - Sends a message to a specific peer
- `disconnect()` - Disconnects from network and cleans up resources

## Browser Support

- Chrome/Chromium (Desktop & Android)
- Firefox (Desktop & Android)
- Safari (Desktop & iOS)
- Edge (Chromium-based)

## Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for more details.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for release notes.
