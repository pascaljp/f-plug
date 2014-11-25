goog.require('BluetoothDevice');
goog.require('FPlug');
goog.require('FileObject');
goog.require('MyFileSystem');
goog.require('Util');

var getAvailableBluetoothAdapter = function(onSuccess, onFailure) {
  chrome.bluetooth.getAdapterState(
    function(adapterInfo) {
      console.log(
        'Bluetooth adapter state: ' +
          '[powered:' + adapterInfo.powered + '] ' +
          '[available:' + adapterInfo.available + '] ' +
          '[discovering:' + adapterInfo.discovering + ']');
      if (adapterInfo.powered && adapterInfo.available &&
          !adapterInfo.discovering) {
        onSuccess(adapterInfo);
      } else {
        onFailure();
      }
    });
};

var fileSystem = new MyFileSystem;

var lookupDevices = function(logFile, unusedAdapterInfo) {
  var onDeviceFound = function(device) {
    logFile.write(
      '+ ' + device.address + ' ' + device.name + ' (' + device.type + ')');
    console.log('+ ' + device.address + ' ' + device.name + ' (' + device.type +
                ')');
    if (!device.paired) {
      logFile.write(device.address + ' is not paired');
      console.log(device.address + ' is not paired');
      return;
    }

    var supportedDeviceTypes = [FPlug];
    for (var i = 0; i < supportedDeviceTypes.length; i++) {
      var deviceType = supportedDeviceTypes[i];
      if (!deviceType.isSupportedDevice(device)) {
        continue;
      }
      logFile.write(device.address + ' matched with a device type.');
      console.log(device.address + ' matched with a device type.');
      var errorFile = new FileObject(fileSystem);
      errorFile.prefix = function() {
        return Util.formatDate('[YYYY/MM/DD hh:mm:ss] ');
      };
      var errorFilename = 'error_' + device.address + '.txt';
      errorFile.open(
        errorFilename, 'w',
        function() {
          errorFile.seek(function(fileWriter) { return fileWriter.length; });

          var instance = new deviceType(fileSystem);
          instance.connect(
            device.address,
            function() {
              instance.run();
            },
            function() {
              instance.stop();
              logFile.write('Disconnected. Trying to reconnect in 5 sec');
              console.log('Disconnected. Trying to reconnect in 5 sec');
              window.setTimeout(
                function() {
                  lookupDevices(logFile, unusedAdapterInfo);
                },
                5000);
            },
            errorFile);
        },
        function() {
          errorFile.write('Failed to open ' + errorFilename);
          console.log('Failed to open ' + errorFilename);
        });
      return;
    }
  };
  /*
  var onDeviceRemoved = function(device) {
    logFile.write('- ' + device.address + ' ' + device.name);
    console.log('- ' + device.address + ' ' + device.name);
  };
  var onDeviceUpdated = function(device) {
    onDeviceRemoved(device);
    onDeviceFound(device);
  };
   */

  // Add listeners to receive newly found devices and updates
  // to the previously known devices.
  /*
  chrome.bluetooth.onDeviceAdded.addListener(onDeviceFound);
  chrome.bluetooth.onDeviceRemoved.addListener(onDeviceRemoved);
  chrome.bluetooth.onDeviceChanged.addListener(onDeviceUpdated);
   */

  // With the listeners in place, get the list of devices found in
  // previous discovery sessions, or any currently active ones,
  // along with paired devices.
  console.log('==== Paired devices ====');
  chrome.bluetooth.getDevices(function(devices) {
    console.log(devices);
    for (var i = 0; i < devices.length; i++) {
      onDeviceFound(devices[i]);
    }
  });
  // Now begin the discovery process.
  /*
   chrome.bluetooth.startDiscovery(function() {
   console.log('==== Bluetooth discovery mode started ====');

   // Stop discovery after 5 seconds.
   setTimeout(function() {
   chrome.bluetooth.stopDiscovery(
   function() {
   console.log('==== Bluetooth discovery mode finished ====');
   });
   }, 5000);
   });
   */
};

var run = function() {
  var logFile = new FileObject(fileSystem);
  logFile.prefix = function() { return Util.formatDate('[YYYY/MM/DD hh:mm:ss] '); };
  logFile.open(
    'error_log.txt', 'w',
    function() {
      logFile.seek(function(fileWriter) { return fileWriter.length; });
      getAvailableBluetoothAdapter(
        function(adapterInfo) { lookupDevices(logFile, adapterInfo); },
        function() {
          logFile.write('Bluetooth device is not available now.');
          console.log('Bluetooth device is not available now.');
        });
    },
    function() {
      console.log('Failed to open error_log.txt');
    });
};

run();
