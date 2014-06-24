/*
 * Beaglebone Analog Pin
 * cylonjs.com
 *
 * Copyright (c) 2013-2014 The Hybrid Group
 * Licensed under the Apache 2.0 license.
*/

'use strict';

var Cylon = require('cylon');
var ANALOG_DIR = "/sys/bus/iio/devices/iio\:device0/";
var EventEmitter = require('events').EventEmitter;
var FS = require('fs');

var AnalogPin = module.exports = function AnalogPin(opts) {
  this.pinNum = opts.pin;
  this.mux = opts.mux;
  this.muxPin = null;
  this.pinPath = this._pinPath();
  this.ready = false;
};

Cylon.Utils.subclass(AnalogPin, EventEmitter);

AnalogPin.prototype.connect = function() {
  var self = this;

  // Create a DigitalPin instance to tell the multiplexor
  // we need to read analog input from the pin.
  this.muxPin = new Cylon.IO.DigitalPin(this.mux);

  this.muxPin.on('connect', function() {
    var _self = self;

    self.muxPin.on('digitalWrite', function() {
      _self.connect();
    });

    self.muxPin.digitalWrite(self.mux.val);
  });

  this.muxPin.connect()
};

AnalogPin.prototype.connect = function() {
  Cylon.Logger.info('Connecting analog pin');
}

AnalogPin.prototype.disconnect = function() {
  var self = this;

  this.on('release', function(err) {
    self.emit('disconnect');
  });

  this._releaseCallback(false);
};

AnalogPin.prototype.disconnectSync = function() {
  this._releaseCallback(false);
};

AnalogPin.prototype.analogRead = function(interval) {
  var self = this;

	Cylon.Utils.every(interval, function() {
	  FS.readFile(self.pinPath, function(err, data) {
	    if (err) {
	      var error = "Error occurred while reading from pin " + self.pinNum;
	      self.emit('error', error);
	    } else {
	      var readData = parseInt(data.toString());
	      self.emit('analogRead', readData);
	    }
	  });
	});

  return true;
};

AnalogPin.prototype._pinPath = function() {
  var path = (this.pinPath) ? this.pinPath : ANALOG_DIR + "in_voltage" + this.pinNum + "_raw";

  return path;
};

AnalogPin.prototype._releaseCallback = function(err) {
  if (err) {
    this.emit('error', 'Error while releasing pwm pin');
  } else {
    this.emit('release', this.pinNum);
  }
};
