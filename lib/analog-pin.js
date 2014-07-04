/*
 * Galileo Analog Pin
 * cylonjs.com
 *
 * Copyright (c) 2014 The Hybrid Group
 * Licensed under the Apache 2.0 license.
*/

'use strict';

var FS = require('fs'),
    Cylon = require('cylon'),
    EventEmitter = require('events').EventEmitter;

var ANALOG_DIR = "/sys/bus/iio/devices/iio\:device0/";

var AnalogPin = module.exports = function AnalogPin(opts) {
  this.pinNum = opts.pin;
  this.mux = opts.mux;
  this.muxPin = null;
  this.pinPath = this._pinPath();
  this.ready = false;
};

Cylon.Utils.subclass(AnalogPin, EventEmitter);

AnalogPin.prototype.connect = function() {
  // Create a DigitalPin instance to tell the multiplexor
  // we need to read analog input from the pin.
  this.muxPin = new Cylon.IO.DigitalPin(this.mux);

  this.muxPin.on('digitalWrite', function() {
    this.emit('connect');
  }.bind(this));

  this.muxPin.on('connect', function() {
    this.muxPin.digitalWrite(this.mux.val);
  }.bind(this));

  this.muxPin.connect()
};

AnalogPin.prototype.disconnect = function() {
  this.on('release', function(err) {
    this.emit('disconnect');
  }.bind(this));

  this._releaseCallback(false);
};

AnalogPin.prototype.disconnectSync = function() {
  this._releaseCallback(false);
};

AnalogPin.prototype.analogRead = function(interval) {
  Cylon.Utils.every(interval, function() {
    FS.readFile(this.pinPath, function(err, data) {
      if (err) {
        var error = "Error occurred while reading from pin " + this.pinNum;
        return this.emit('error', error);
      }

      var readData = parseInt(data.toString());
      this.emit('analogRead', readData);
    }.bind(this));
  }.bind(this));

  return true;
};

AnalogPin.prototype._pinPath = function() {
  if (this.pinPath) {
    return this.pinPath;
  }

  return ANALOG_DIR + "in_voltage" + this.pinNum + "_raw";
};

AnalogPin.prototype._releaseCallback = function(err) {
  if (!!err) {
    return this.emit('error', 'Error while releasing pwm pin');
  }

  this.emit('release', this.pinNum);
};
