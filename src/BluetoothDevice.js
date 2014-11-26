goog.provide('apps.BluetoothDevice');

/**
 * @constructor
 * @param {string} uuid UUID of bluetooth profile
 */
apps.BluetoothDevice = function(uuid) {
  var self = this;
  self.uuid = uuid;
  self.address = null;
  self.errorStream = null;

  self.state = apps.BluetoothDevice.STATE_.CLOSED;
  self.socketId = null;

  self.onConnectCallback = null;
  self.onDisconnectCallback = null;
};

/**
 * @private
 */
apps.BluetoothDevice.STATE_ = {
  CLOSED: 0,
  CREATING: 1,
  CONNECTING: 2,
  CONNECTED: 3,
  CLOSING: 4
};

/**
 * Connect to a bluetooth device.
 * @param {string} address
 * @param {function()} onConnectCallback
 * @param {function()} onDisconnectCallback
 * @param {apps.File} errorStream
 */
apps.BluetoothDevice.prototype.connect = function(
  address,  onConnectCallback, onDisconnectCallback, errorStream) {
  var self = this;

  self.address = address;
  self.errorStream = errorStream;
  self.onConnectCallback = function() {
    onConnectCallback();
  };
  self.onDisconnectCallback = function() {
    onDisconnectCallback();
  };

  if (this.state == apps.BluetoothDevice.STATE_.CLOSING) {
    self.errorStream.write(
      'Device ' + self.address + ' is being disconnectd.');
    return;
  }
  if (this.state == apps.BluetoothDevice.STATE_.CONNECTED) {
    self.errorStream.write(
      'Device ' + self.address + ' is already connected.');
    return;
  }
  if (self.state == apps.BluetoothDevice.STATE_.CONNECTING) {
    self.errorStream.write(
      'Device ' + self.address + ' is already connecting.');
    return;
  }
  if (self.state == apps.BluetoothDevice.STATE_.CREATING) {
    self.errorStream.write(
      'Device ' + self.address + ' is already creating.');
    return;
  }

  self.state = apps.BluetoothDevice.STATE_.CREATING;
  chrome.bluetoothSocket.create(
    {},
    function(createInfo) {
      self.state = apps.BluetoothDevice.STATE_.CONNECTING;
      self.errorStream.write('Created a socket (' + createInfo.socketId + ')');
      self.socketId = createInfo.socketId;
      chrome.bluetoothSocket.connect(
        self.socketId,
        self.address,
        self.uuid,
        function() {
          if (chrome.runtime.lastError) {
            self.errorStream.write(
              'Connection failed: ' + chrome.runtime.lastError.message);
            self.disconnect();
            return;
          }

          chrome.bluetoothSocket.onReceive.addListener(function(info) {
            if (info.socketId != self.socketId) {
              return;
            }
            self.onReceive(info.data);
          });
          self.state = apps.BluetoothDevice.STATE_.CONNECTED;
          self.errorStream.write('Connected to device: ' + self.address);
          self.onConnectCallback();
        });
    });
};

/**
 * Disconnect from the bluetooth device.
 */
apps.BluetoothDevice.prototype.disconnect = function() {
  var self = this;

  if (self.state == apps.BluetoothDevice.STATE_.CLOSING ||
      self.state == apps.BluetoothDevice.STATE_.CLOSED) {
    return;
  }

  self.state = apps.BluetoothDevice.STATE_.CLOSING;
  self.errorStream.write(
    'Closing connection with socket ' + self.socketId + ' (' +
      self.address + ')');
  chrome.bluetoothSocket.close(self.socketId, function() {
    self.state = apps.BluetoothDevice.STATE_.CLOSED;
    var disconnectedSocketId = self.socketId;
    self.socketId = null;

    self.errorStream.write('Socket ID ' + disconnectedSocketId + ' is closed');
    self.onDisconnectCallback();
  });
};

/**
 * Send data to the bluetooth device.
 * @param {string} byteList
 */
apps.BluetoothDevice.prototype.send = function(byteList) {
  var self = this;

  if (self.state != apps.BluetoothDevice.STATE_.CONNECTED) {
    self.errorStream.write('Send failed: Not connected to device');
    self.disconnect();
    return;
  }

  var buffer = new ArrayBuffer(byteList.length);
  var message = new Uint8Array(buffer);
  for (var i = 0; i < byteList.length; i++) {
    message[i] = byteList[i];
  }
  chrome.bluetoothSocket.send(self.socketId, buffer, function(bytesSent) {
    if (chrome.runtime.lastError) {
      self.errorStream.write(
        'Send failed: ' + chrome.runtime.lastError.message);
      self.disconnect();
    }
  });
};

/**
 * Called when the bluetooth device receives data.
 * @param {ArrayBuffer} byteList
 */
apps.BluetoothDevice.prototype.onReceive = function(byteList) {
};
