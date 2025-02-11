import WebTorrent from "webtorrent";
import CryptoJS from "crypto-js";
import { MessageExtension } from "./extension";

class MessageClient {
  constructor(config) {
    this.client = null;
    this.torrent = null;
    this.messageExtensions = new Map();
    this.config = {
      token: config.token,
      trackers: config.trackers || ["wss://tracker.openwebtorrent.com"],
      onMessage: config.onMessage || (() => {}),
      onConnect: config.onConnect || (() => {}),
      disableShaPrefixing: config.disableShaPrefixing || false
    };
  }

  logDebug(msg) {
    console.log(`[Debug] ${msg}`);
  }

  logWire(msg) {
    console.log(`[Wire] ${msg}`);
  }

  logMessage(msg) {
    console.log(`[Message] ${msg}`);
  }

  updatePeerCount() {
    const count = this.torrent ? this.torrent.numPeers : 0;
    console.log(`Connected Peers: ${count}`);
    this.logDebug(`Current peer count: ${count}`);
  }

  attachMessageExtension(wire) {
    if (!this.messageExtensions.has(wire.peerId)) {
      wire.use(MessageExtension);
      const extension = wire.ut_message;
      
      // Set up message handler through prototype method
      extension.onMessage = (buf) => {
        const data = buf.toString('utf8');
        const separatorIndex = data.indexOf(':');

        if (separatorIndex > 0) {
          const messageSize = parseInt(data.substring(0, separatorIndex), 10);
          const message = data.substring(separatorIndex + 1);

          console.debug(`Received message size: ${messageSize}, message: ${message}`);
          this.config.onMessage(wire.peerId, message);
        } else {
          console.warn("Received message without size delimiter");
          this.config.onMessage(wire.peerId, data);
        }
      };
      
      this.messageExtensions.set(wire.peerId, extension);
      this.logWire(`Attached message extension to wire ${wire.peerId}`);
      this.updatePeerCount();
      
      // Notify about new peer connection
      this.config.onConnect(wire.peerId);
    }
  }

  send(peerId, text) {
    if (!this.torrent) {
      console.log("Not connected to network");
      return;
    }

    const extension = this.messageExtensions.get(peerId);
    if (extension) {
      extension.send(text);
      this.logMessage(`Sent to ${peerId}: ${text}`);
    } else {
      this.logDebug(`Peer ${peerId} not found`);
    }
  }

  connect() {
    if (!this.config.token) {
      console.log("Please provide a key in the config");
      return;
    }

    if (!this.client) {
      this.client = new WebTorrent();
      this.client.on("error", (err) => this.logDebug(`Client error: ${err.message}`));
      this.client.on("warning", (warn) => this.logDebug(`Client warning: ${warn.message}`));
    }

    const shouldUsePrefix = !this.config.disableShaPrefixing;
    const shaPrefix = shouldUsePrefix ? window?.location?.host || "default" : '';
    const infoHash = CryptoJS.SHA1(shaPrefix + this.config.token).toString();

    let magnetUri = `magnet:?xt=urn:btih:${infoHash}`;
    this.config.trackers.forEach((tracker) => {
      magnetUri += `&tr=${encodeURIComponent(tracker)}`;
    });

    try {
      console.log("Joining swarm...");
      this.torrent = this.client.add(magnetUri, {
        announce: this.config.trackers,
      });
      
      this.setupTorrentEvents();
      console.log("Connected! Waiting for peers...");
      this.updatePeerCount();
    } catch (err) {
      console.log(`Failed to join: ${err.message}`);
    }
  }

  setupTorrentEvents() {
    this.torrent.on("wire", (wire) => {
      this.logWire(`New peer connected: ${wire.peerId}`);
      this.attachMessageExtension(wire);
    });

    this.torrent.on("error", (err) => this.logDebug(`Torrent error: ${err.message}`));
    this.torrent.on("warning", (warn) =>
      this.logDebug(`Torrent warning: ${warn.message}`)
    );

    this.torrent.on("wire-disconnect", (wire, reason) => {
      this.logWire(`Peer disconnected: ${wire.peerId}, reason: ${reason}`);
      this.messageExtensions.delete(wire.peerId);
      this.updatePeerCount();
    });

    setInterval(() => this.updatePeerCount(), 2000);
  }

  disconnect() {
    if (this.torrent) {
      this.torrent.destroy();
      this.torrent = null;
    }
    if (this.client) {
      this.client.destroy();
      this.client = null;
    }
    this.messageExtensions.clear();
    console.log("Disconnected from P2P network");
  }

  disconnectPeer(peerId) {
    if (!this.torrent) {
      console.log("Not connected to network");
      return;
    }

    const peerWire = this.torrent.wires.find((wire) => wire.peerId === peerId);
    if (peerWire) {
      peerWire.destroy();
      this.logDebug(`Disconnected from peer ${peerId}`);
    } else {
      this.logDebug(`Peer ${peerId} not found`);
    }
  }
}

export default MessageClient;
