// Logging functions
function logExt(msg) {
  console.log(`[MessageExt] ${msg}`);
}
function logMessage(msg) {
  console.log(`[Message] ${msg}`);
}

// MessageExtension constructor function
export function MessageExtension(wire) {
  this.wire = wire;
  logExt(`New ut_message extension on wire => peerId=${wire.peerId}`);
}

// Static name property on prototype (required by wire.use)
MessageExtension.prototype.name = "ut_message";

// Instance methods
MessageExtension.prototype.onHandshake = function (
  infoHash,
  peerId,
  _extensions
) {
  logExt(`onHandshake from ${peerId}`);
};

MessageExtension.prototype.onExtendedHandshake = function (_handshake) {
  logExt(`onExtendedHandshake from ${this.wire.peerId}`);
  return { m: { ut_message: 1 } };
};

MessageExtension.prototype.onMessage = function (buf) {
  const text = buf.toString("utf8");
  logExt(`Message from ${this.wire.peerId}: "${text}"`);
  logMessage(`Peer: ${text}`);
};

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
