/**
 * @fileoverview WebTorrent extension for P2P messaging functionality
 * @module MessageExtension
 */

// Logging functions
function logExt(msg) {
  console.log(`[MessageExt] ${msg}`);
}
function logMessage(msg) {
  console.log(`[Message] ${msg}`);
}

/**
 * MessageExtension class for handling P2P messaging over WebTorrent
 * @class
 * @param {Object} wire - WebTorrent wire object representing peer connection
 */
export function MessageExtension(wire) {
  this.wire = wire;
  logExt(`New ut_message extension on wire => peerId=${wire.peerId}`);
}

// Static name property on prototype (required by wire.use)
MessageExtension.prototype.name = "ut_message";

/**
 * Handles initial handshake with peer
 * @param {string} infoHash - Torrent info hash
 * @param {string} peerId - Remote peer ID
 * @param {Object} _extensions - Extension metadata
 */
MessageExtension.prototype.onHandshake = function (
  infoHash,
  peerId,
  _extensions
) {
  logExt(`onHandshake from ${peerId}`);
};

/**
 * Handles extended handshake messages
 * @param {Object} _handshake - Handshake data
 * @returns {Object} Extension metadata
 */
MessageExtension.prototype.onExtendedHandshake = function (_handshake) {
  logExt(`onExtendedHandshake from ${this.wire.peerId}`);
  return { m: { ut_message: 1 } };
};

/**
 * Processes incoming messages from peers
 * @param {Buffer} buf - Message buffer
 */
MessageExtension.prototype.onMessage = function (buf) {
  const text = buf.toString("utf8");
  logExt(`Message from ${this.wire.peerId}: "${text}"`);
  logMessage(`Peer: ${text}`);
};

/**
 * Sends a message to the connected peer
 * @param {string} message - Message to send
 */
MessageExtension.prototype.send = function (message) {
  try {
    const encoder = new TextEncoder();
    const encodedMessage = encoder.encode(message);
    this.wire.extended("ut_message", encodedMessage);
    logExt(`Sent to ${this.wire.peerId}: "${message}"`);
  } catch (err) {
    logExt(`Error sending message: ${err.message}`);
  }
};
