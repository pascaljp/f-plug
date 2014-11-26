goog.provide('FPlug');
goog.require('Util');
goog.require('apps.BluetoothDevice');
goog.require('apps.File');

FPlug = function(fileSystem) {
  var self = this;
  self.receivedData = {};
  self.commandCallback = {};
  self.fileSystem = fileSystem;
  self.stream = null;

  self.tid = 0;
  self.timeoutId = null;
};

FPlug.prototype = new apps.BluetoothDevice('1101');

/**
 * Given BluetoothDevice object, returns if this object can handle it.
 * @param {Object} device Bluetooth Device.
 * @return {boolean}
 */
FPlug.isSupportedDevice = function(device) {
  return device.name.search(/F-PLUG/) != -1;
};

/**
 * @return {apps.File} File object to log data.
 */
FPlug.prototype.getStream = function() {
  var self = this;
  var fileName = self.address + '_' + Util.formatDate('YYYYMMDD') + '.txt';
  if (self.stream == null || self.stream.fileName != fileName) {
    if (self.stream) {
      self.stream.close(function() {});
    }
    self.stream = new apps.File(self.fileSystem);
    self.stream.open(
      fileName, 'w',
      function() {},
      function() {
        self.errorStream.write('Failed to open ' + fileName);
        console.log('Failed to open ' + fileName);
        self.disconnect();
      });
    self.stream.seek(function(fileWriter) {
      console.log(fileWriter.length);
      return fileWriter.length;
    });
  }
  return self.stream;
};

/**
 * Called when a user wants to start using the device.
 */
FPlug.prototype.run = function() {
  var self = this;
  self.loop();
};

/**
 * A function to be called every second after starting.
 */
FPlug.prototype.loop = function() {
  var self = this;
  //console.log('Running');

  var barrier = new CallbackBarrier();
  var time = Util.formatDate('YYYY-MM-DD hh:mm:ss');
  self.receivedData[time] = {};
  self.getTemperature(time, barrier.getCallback());
  self.getHumidity(time, barrier.getCallback());
  self.getBrightness(time, barrier.getCallback());
  self.getElectricity(time, barrier.getCallback());
  barrier.finalize(function() {
    var data = self.receivedData[time];
    var getValue = function(field) {
      var value = data[field];
      if (value === 0.0 || data[field] != 0) {
        return value;
      } else {
        return null;
      }
    };
    var result = Util.formatDate('YYYY/MM/DD hh:mm:ss') + ',' +
          getValue('temperature') + ',' +
          getValue('humidity') + ',' +
          getValue('brightness') + ',' +
          getValue('electricity');
    delete self.receivedData[time];
    //console.log(result);
    self.getStream().write(result);
  });

  self.timeoutId = window.setTimeout(function() { self.loop(); }, 1000);
};

/**
 * Called when a user wants to stop using the device.
 */
FPlug.prototype.stop = function() {
  var self = this;

  if (self.timeoutId != null) {
    window.clearTimeout(self.timeoutId);
    self.timeoutId = null;
  }
};

/**
 * Sends a request to get temperature info to F-PLUG device.
 * @param {string} time Formatted as "YYYY/MM/DD hh:mm:dd"
 * @param {function()} callback Called when temperature information received a
 *     data.
 */
FPlug.prototype.getTemperature = function(time, callback) {
  var self = this;

  var tid = self.tid; self.tid = (self.tid + 1) & 65535;
  self.commandCallback[tid] = function(message) {
    self.onTemperatureReceived(message, time, callback);
  };
  var data = [
    0x10, 0x81, tid % 256, tid / 256, 0x0E, 0xF0, 0x00, 0x00,
    0x11, 0x00, 0x62, 0x01, 0xE0, 0x00];
  self.send(data);
};

/**
 * Sends a request to get energy consumption info to F-PLUG device.
 * @param {string} time Formatted as "YYYY/MM/DD hh:mm:dd"
 * @param {function()} callback Called when energy consumption information
 *     received a data.
 */
FPlug.prototype.getElectricity = function(time, callback) {
  var self = this;

  var tid = self.tid; self.tid = (self.tid + 1) & 65535;
  self.commandCallback[tid] = function(message) {
    self.onElectricityReceived(message, time, callback);
  };
  var data = [
    0x10, 0x81, tid % 256, tid / 256, 0x0E, 0xF0, 0x00, 0x00,
    0x22, 0x00, 0x62, 0x01, 0xE2, 0x00];
  self.send(data);
};

/**
 * Sends a request to get humidity info to F-PLUG device.
 * @param {string} time Formatted as "YYYY/MM/DD hh:mm:dd"
 * @param {function()} callback Called when humidity information received a
 *     data.
 */
FPlug.prototype.getHumidity = function(time, callback) {
  var self = this;

  var tid = self.tid; self.tid = (self.tid + 1) & 65535;
  self.commandCallback[tid] = function(message) {
    self.onHumidityReceived(message, time, callback);
  };
  var data = [
    0x10, 0x81, tid % 256, tid / 256, 0x0E, 0xF0, 0x00, 0x00,
    0x12, 0x00, 0x62, 0x01, 0xE0, 0x00];
  self.send(data);
};

/**
 * Sends a request to get brightness info to F-PLUG device.
 * @param {string} time Formatted as "YYYY/MM/DD hh:mm:dd"
 * @param {function()} callback Called when brightness information received a
 *     data.
 */
FPlug.prototype.getBrightness = function(time, callback) {
  var self = this;

  var tid = self.tid; self.tid = (self.tid + 1) & 65535;
  self.commandCallback[tid] = function(message) {
    self.onBrightnessReceived(message, time, callback);
  };
  var data = [
    0x10, 0x81, tid % 256, tid / 256, 0x0E, 0xF0, 0x00, 0x00,
    0x0D, 0x00, 0x62, 0x01, 0xE0, 0x00];
  self.send(data);
};

/**
 * Called when a data is received from the F-PLUG device.
 * @param {ArrayBuffer} byteList Received data
 */
FPlug.prototype.onReceive = function(byteList) {
  var self = this;
  // byteList is an ArrayBuffer.
  var message = new Uint8Array(byteList);

  if (message.length == 2) {
    if (message[0] == 0x87) {
      var value = message[1] == 0 ? 'SUCCESS' : 'FAIL';
      //state('settime', 'Set time: ' + value);
      return;
    } else if (message[0] == 0x85) {
      //state('led', message[1] == 0 ? 'OFF' : 'ON');
      return;
    }
  }

  var tid = message[2] + message[3] * 256;
  self.commandCallback[tid](message);
  delete self.commandCallback[tid];
};

/**
 * @param {Uint8Array} message
 * @param {string} time
 * @param {function()} callback
 */
FPlug.prototype.onTemperatureReceived = function(message, time, callback) {
  var self = this;
  var value = (message[14] + message[15] * 256) / 10.0;
  self.receivedData[time]['temperature'] = value;
  callback();
};

/**
 * @param {Uint8Array} message
 * @param {string} time
 * @param {function()} callback
 */
FPlug.prototype.onElectricityReceived = function(message, time, callback) {
  var self = this;
  var value = (message[14] + message[15] * 256) / 10.0;
  self.receivedData[time]['electricity'] = value;
  callback();
};

/**
 * @param {Uint8Array} message
 * @param {string} time
 * @param {function()} callback
 */
FPlug.prototype.onHumidityReceived = function(message, time, callback) {
  var self = this;
  var value = message[14];
  self.receivedData[time]['humidity'] = value;
  callback();
};

/**
 * @param {Uint8Array} message
 * @param {string} time
 * @param {function()} callback
 */
FPlug.prototype.onBrightnessReceived = function(message, time, callback) {
  var self = this;
  var value = message[14] + message[15] * 256;
  self.receivedData[time]['brightness'] = value;
  callback();
};
