goog.provide('apps.File');
goog.provide('apps.FileSystem');

/**
 * @constructor
 */
apps.FileSystem = function() {
  var self = this;
  self.rootEntry = null;
};

/**
 * @param {function(DirectoryEntry)} onSuccess
 * @param {function()} onFailure
 */
apps.FileSystem.prototype.getRootEntry = function(onSuccess, onFailure) {
  var self = this;
  if (self.rootEntry) {
    onSuccess(self.rootEntry);
    return;
  }
  chrome.fileSystem.chooseEntry(
    {type: 'openDirectory'},
    function(directoryEntry) {
      if (!directoryEntry) {
        onFailure();
        return;
      }
      self.rootEntry = directoryEntry;
      onSuccess(self.rootEntry);
    });
};

/**
 * @constructor
 * @param {apps.FileSystem} fileSystem
 */
apps.File = function(fileSystem) {
  var self = this;

  self.fileSystem = fileSystem;
  self.writeQueue = [];
  self.fileName = null;
  self.fileEntry = null;
  self.fileWriter = null;
  self.fileState = apps.File.FILE_STATE_.CLOSED;

  self.prefix = function() {return '';};
  self.suffix = function() {return '\n';};
};

/**
 * States of files in enum.
 * @private
 */
apps.File.FILE_STATE_ = {
  'CLOSED': 0,
  'OPENING': 1,
  'OPENED': 2
};

/**
 * @param {string} filename
 * @param {string} mode
 * @param {function()} onSuccess Called when the file is opened.
 * @param {function()} onFailure Called when the file could not be opened.
 */
apps.File.prototype.open = function(filename, mode, onSuccess, onFailure) {
  var self = this;
  console.log('Opening ' + filename);
  self.fileName = filename;
  self.fileState = apps.File.FILE_STATE_.OPENING;
  self.fileSystem.getRootEntry(
    function(rootEntry) {
      rootEntry.getFile(
        filename,
        {'create': true, 'exclusive': false},
        function(fileEntry) {
          self.opened(fileEntry, mode, onSuccess, onFailure);
        },
        onFailure);
    },
    onFailure);
};

/**
 * @param {FileEntry} fileEntry
 * @param {string} mode
 * @param {function()} onSuccess Called when the file is opened.
 * @param {function()} onFailure Called when the file could not be opened.
 */
apps.File.prototype.opened = function(fileEntry, mode, onSuccess, onFailure) {
  var self = this;

  self.fileEntry = fileEntry;
  if (mode == 'w') {
    self.fileEntry.createWriter(
      function(fileWriter) {
        fileWriter.onwriteend = function(e) {
          self.processWriteQueue_();
        };
        self.fileWriter = fileWriter;
        self.fileState = apps.File.FILE_STATE_.OPENED;
        self.processWriteQueue_();
        onSuccess();
      },
      onFailure);
    return;
  }

  onFailure();
};

/**
 * @param {function(FileWriter)} getSeekPosition
 */
apps.File.prototype.seek = function(getSeekPosition) {
  var self = this;

  if (self.fileState != apps.File.FILE_STATE_.OPENED &&
      self.fileState != apps.File.FILE_STATE_.OPENING) {
    console.log('The file is not opened');
    return;
  }
  self.writeQueue.push(function(fileWriter) {
    var seekPosition = getSeekPosition(fileWriter);
    self.fileWriter.seek(seekPosition);
  });
  self.processWriteQueue_();
};

/**
 * @param {string} byteList
 */
apps.File.prototype.write = function(byteList) {
  var self = this;

  if (self.fileState != apps.File.FILE_STATE_.OPENED &&
      self.fileState != apps.File.FILE_STATE_.OPENING) {
    console.log('The file is not opened');
    return;
  }
  self.writeQueue.push(function(fileWriter) {
    var blob = new Blob([self.prefix() + byteList + self.suffix()]);
    fileWriter.write(blob);
  });
  self.processWriteQueue_();
};

/**
 * @param {function()} onSuccess
 */
apps.File.prototype.close = function(onSuccess) {
  var self = this;
  self.writeQueue.push(function(fileWriter) {
    if (self.writeQueue.length > 0) {
      console.log('Operations added after calling close()');
    }
    self.fileWriter = null;
    self.fileState = apps.File.FILE_STATE_.CLOSED;
    onSuccess();
    return;
  });
  self.processWriteQueue_();
};

/**
 * @private
 */
apps.File.prototype.processWriteQueue_ = function() {
  var self = this;

  while (self.writeQueue.length > 0) {
    if (self.fileState != apps.File.FILE_STATE_.OPENED) {
      return;
    }
    if (self.fileWriter.readyState == 1 /* FileSaver.WRITING */) {
      return;
    }
    self.writeQueue.shift()(this.fileWriter);
  }
};
