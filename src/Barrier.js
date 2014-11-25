goog.provide('CallbackBarrier');

/**
 * @constructor
 */
CallbackBarrier = function() {
  var self = this;
  self.callbackHandle = null;
  self.asyncCount = 0;
  self.finalized = false;
}

CallbackBarrier.prototype.getCallback = function() {
  if (this.finalized) {
    throw "You can't add a callback after finalizing";
  }
  this.asyncCount++;
  return function() {
    this.asyncCount--;
    if (this.asyncCount === 0 && this.finalized) {
      this.callbackHandle();
    }
  }.bind(this);
};

CallbackBarrier.prototype.finalize = function(callback) {
  this.callbackHandle = callback;
  this.finalized = true;
  if (this.asyncCount === 0) {
    this.callbackHandle();
  }
};
