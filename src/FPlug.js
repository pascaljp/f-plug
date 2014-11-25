goog.provide('FPlug');
goog.require('BluetoothDevice');
goog.require('FileObject');
goog.require('MyFileSystem');
goog.require('Util');

FPlug = function(fileSystem) {
  var self = this;
  self.receivedData = {};
  self.commandCallback = {};
  self.fileSystem = fileSystem;
  self.stream = null;

  self.tid = 0;
  self.timeoutId = null;
}

FPlug.prototype = new BluetoothDevice('1101');

FPlug.isSupportedDevice = function(device) {
  return device.name.search(/F-PLUG/) != -1;
};

FPlug.prototype.getStream = function() {
  var self = this;
  var fileName = self.address + '_' + Util.formatDate('YYYYMMDD') + '.txt';
  if (self.stream == null || self.stream.fileName != fileName) {
    if (self.stream) {
      self.stream.close(function() {});
    }
    self.stream = new FileObject(self.fileSystem);
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

FPlug.prototype.run = function() {
  var self = this;
  self.loop();
};

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

FPlug.prototype.stop = function() {
  var self = this;

  if (self.timeoutId != null) {
    window.clearTimeout(self.timeoutId);
    self.timeoutId = null;
  }
};

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

FPlug.prototype.onTemperatureReceived = function(message, time, callback) {
  var self = this;
  var value = (message[14] + message[15] * 256) / 10.0;
  self.receivedData[time]['temperature'] = value;
  callback();
};

FPlug.prototype.onElectricityReceived = function(message, time, callback) {
  var self = this;
  var value = (message[14] + message[15] * 256) / 10.0;
  self.receivedData[time]['electricity'] = value;
  callback();
};

FPlug.prototype.onHumidityReceived = function(message, time, callback) {
  var self = this;
  var value = message[14];
  self.receivedData[time]['humidity'] = value;
  callback();
};

FPlug.prototype.onBrightnessReceived = function(message, time, callback) {
  var self = this;
  var value = message[14] + message[15] * 256;
  self.receivedData[time]['brightness'] = value;
  callback();
};
