goog.provide('MyFileSystem');
goog.provide('FileObject');

/**
 * @constructor
 */
MyFileSystem = function() {
  var self = this;
  self.rootEntry = null;
}

MyFileSystem.prototype.getRootEntry = function(onSuccess, onFailure) {
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
 */
FileObject = function(fileSystem) {
  var self = this;

  self.fileSystem = fileSystem;
  self.writeQueue = [];
  self.fileName = null;
  self.fileEntry = null;
  self.fileWriter = null;
  self.fileState = FileObject.FILE_STATE_.CLOSED;

  self.prefix = function() {return '';};
  self.suffix = function() {return '\n';};
}

FileObject.FILE_STATE_ = {
  'CLOSED': 0,
  'OPENING': 1,
  'OPENED': 2
};

FileObject.prototype.open = function(filename, mode, onSuccess, onFailure) {
  var self = this;
  console.log('Opening ' + filename);
  self.fileName = filename;
  self.fileState = FileObject.FILE_STATE_.OPENING;
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

FileObject.prototype.opened = function(fileEntry, mode, onSuccess, onFailure) {
  var self = this;

  self.fileEntry = fileEntry;
  if (mode == 'w') {
    self.fileEntry.createWriter(
      function(fileWriter) {
        fileWriter.onwriteend = function(e) {
          self.processWriteQueue_();
        };
        self.fileWriter = fileWriter;
        self.fileState = FileObject.FILE_STATE_.OPENED;
        self.processWriteQueue_();
        onSuccess();
      },
      onFailure);
    return;
  }

  onFailure();
};

FileObject.prototype.seek = function(getSeekPosition) {
  var self = this;

  if (self.fileState != FileObject.FILE_STATE_.OPENED &&
      self.fileState != FileObject.FILE_STATE_.OPENING) {
    console.log('The file is not opened');
    return;
  }
  self.writeQueue.push(function(fileWriter) {
    var seekPosition = getSeekPosition(fileWriter);
    self.fileWriter.seek(seekPosition);
  });
  self.processWriteQueue_();
};

FileObject.prototype.write = function(byteList) {
  var self = this;

  if (self.fileState != FileObject.FILE_STATE_.OPENED &&
      self.fileState != FileObject.FILE_STATE_.OPENING) {
    console.log('The file is not opened');
    return;
  }
  self.writeQueue.push(function(fileWriter) {
    var blob = new Blob([self.prefix() + byteList + self.suffix()]);
    fileWriter.write(blob);
  });
  self.processWriteQueue_();
};

FileObject.prototype.close = function(onSuccess) {
  var self = this;
  self.writeQueue.push(function(fileWriter) {
    if (self.writeQueue.length > 0) {
      console.log('Operations added after calling close()');
    }
    self.fileWriter = null;
    self.fileState = FileObject.FILE_STATE_.CLOSED;
    onSuccess();
    return;
  });
  self.processWriteQueue_();
};

FileObject.prototype.processWriteQueue_ = function() {
  var self = this;

  while (self.writeQueue.length > 0) {
    if (self.fileState != FileObject.FILE_STATE_.OPENED) {
      return;
    }
    if (self.fileWriter.readyState == 1 /* FileSaver.WRITING */) {
      return;
    }
    self.writeQueue.shift()(this.fileWriter);
  }
};
