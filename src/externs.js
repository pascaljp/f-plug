// https://developer.chrome.com/apps/bluetooth
chrome.bluetooth = function() {};
chrome.bluetooth.getAdapterState = function(callback) {};
chrome.bluetooth.getDevice = function(deviceAddress, callback) {};
chrome.bluetooth.getDevices = function(callback) {};
chrome.bluetooth.startDiscovery = function(callback) {};
chrome.bluetooth.stopDiscovery = function(callback) {};

// https://developer.chrome.com/apps/bluetoothSocket
chrome.bluetoothSocket = function() {};
chrome.bluetoothSocket.create = function(properties, callback) {};
chrome.bluetoothSocket.update = function(socketId, properties, callback) {};
chrome.bluetoothSocket.setPaused = function(socketId, paused, callback) {};
chrome.bluetoothSocket.listenUsingRfcomm = function(socketId, uuid, options, callback) {};
chrome.bluetoothSocket.listenUsingL2cap = function(socketId, uuid, options, callback) {};
chrome.bluetoothSocket.connect = function(socketId, address, uuid, callback) {};
chrome.bluetoothSocket.disconnect = function(socketId, callback) {};
chrome.bluetoothSocket.close = function(socketId, callback) {};
chrome.bluetoothSocket.send = function(socketId, data, callback) {};
chrome.bluetoothSocket.getInfo = function(socketId, callback) {};
chrome.bluetoothSocket.getSockets = function(callback) {};
chrome.bluetoothSocket.onAccept = {};
chrome.bluetoothSocket.onAccept.addListener = function(callback) {};
chrome.bluetoothSocket.onAcceptError = {};
chrome.bluetoothSocket.onAcceptError.addListener = function(callback) {};
chrome.bluetoothSocket.onReceive = {};
chrome.bluetoothSocket.onReceive.addListener = function(callback) {};
chrome.bluetoothSocket.onReceiveError = {};
chrome.bluetoothSocket.onReceiveError.addListener = function(callback) {};

// https://developer.chrome.com/apps/fileSystem
chrome.fileSystem.chooseEntry = function(options, callback) {};
chrome.fileSystem.getDisplayPath = function(entry, callback) {};
chrome.fileSystem.getWritableEntry = function(entry, callback) {};
chrome.fileSystem.isWritableEntry = function(entry, callback) {};
chrome.fileSystem.restoreEntry = function(id, callback) {};
chrome.fileSystem.isRestorable = function(id, callback) {};
chrome.fileSystem.retainEntry = function(entry) {};

// https://developer.chrome.com/apps/runtime
chrome.runtime = function() {};
chrome.runtime.lastError = {};
chrome.runtime.lastError.message = null;

// https://developer.chrome.com/apps/bluetoothSocket#type-SocketProperties
var SocketProperties = function() {};
SocketProperties.prototype.persistent = false;
SocketProperties.prototype.name = false;
SocketProperties.prototype.bufferSize = 4096;

// https://developer.chrome.com/apps/bluetoothSocket#type-ListenOptions
var ListenOptions = function() {};
ListenOptions.prototype.channel = 0;
ListenOptions.prototype.psm = 0;
ListenOptions.prototype.backlog = 0;

// https://developer.chrome.com/apps/bluetoothSocket#type-SocketInfo
var SocketInfo = function() {};
SocketInfo.prototype.socketId = 0;
SocketInfo.prototype.persistent = false;
SocketInfo.prototype.name = null;
SocketInfo.prototype.bufferSize = 0;
SocketInfo.prototype.paused = false;
SocketInfo.prototype.connected = false;
SocketInfo.prototype.address = null;
SocketInfo.prototype.uuid = null;

// https://developer.chrome.com/apps/bluetooth#type-AdapterState
var AdapterState = function() {};
AdapterState.prototype.address = null;
AdapterState.prototype.name = null;
AdapterState.prototype.powered = false;
AdapterState.prototype.available = false;
AdapterState.prototype.discovering = false;

// https://developer.chrome.com/apps/bluetooth#type-Device
var Device = function() {};
Device.prototype.address = null;
Device.prototype.name = null;
Device.prototype.deviceClass = 0;
Device.prototype.vendorIdSource = "bluetooth";
Device.prototype.vendorIdSource = 0;
Device.prototype.productId = 0;
Device.prototype.deviceId = 0;
Device.prototype.type = null;
Device.prototype.paired = false;
Device.prototype.connected = false;
Device.prototype.uuids = [];
