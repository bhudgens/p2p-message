/**
 * @fileoverview Main P2P messaging client implementation
 * @module MessageClient
 */

import WebTorrent from "webtorrent";
import CryptoJS from "crypto-js";
import { MessageExtension } from "./extension";

/* eslint-disable lines-around-comment */
/**
 * MessageClient handles P2P communication between browsers
 * @class
 */
class MessageClient {
  /**
   * Creates a new MessageClient instance
   * @param {Object} config - Configuration object
   * @param {string} config.token - Unique network identifier for peer discovery
   * @param {string[]} [config.trackers=["wss://tracker.openwebtorrent.com"]] - WebTorrent tracker URLs
   * @param {Function} [config.onMessage] - Callback for incoming messages
   * @param {Function} [config.onConnect] - Callback for new peer connections
   * @param {boolean} [config.disableShaPrefixing=false] - Disable SHA prefixing for infoHash
   */
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

  /**
   * Logs debug messages
   * @private
   * @param {string} msg - Debug message
   */
  logDebug(msg) {
    console.log(`[Debug] ${msg}`);
  }

  /**
   * Logs wire-related messages
   * @private
   * @param {string} msg - Wire message
   */
  logWire(msg) {
    console.log(`[Wire] ${msg}`);
  }

  /**
   * Logs messaging-related messages
   * @private
   * @param {string} msg - Message content
   */
  logMessage(msg) {
    console.log(`[Message] ${msg}`);
  }

  /**
   * Updates and logs the current peer count
   * @private
   */
  updatePeerCount() {
    const count = this.torrent ? this.torrent.numPeers : 0;
    console.log(`Connected Peers: ${count}`);
    this.logDebug(`Current peer count: ${count}`);
  }

  /**
   * Attaches message extension to a wire connection
   * @private
   * @param {Object} wire - WebTorrent wire object
   */
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

  /**
   * Sends a message to a specific peer
   * @param {string} peerId - Target peer ID
   * @param {string} text - Message content
   */
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

  /**
   * Connects to the P2P network
   * @returns {void}
   */
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

  /**
   * Sets up torrent-related event handlers
   * @private
   */
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

  /**
   * Disconnects from the P2P network and cleans up resources
   */
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

  /**
   * Disconnects from a specific peer
   * @param {string} peerId - ID of the peer to disconnect
   */
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
