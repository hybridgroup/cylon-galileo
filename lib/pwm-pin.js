/*
* Galileo PWM Pin
* cylonjs.com
*
* Copyright (c) 2013 The Hybrid Group
* Licensed under the Apache 2.0 license.
*/

'use strict';

var Cylon = require('cylon');

var FS = require('fs'),
    EventEmitter = require('events').EventEmitter;

var PwmPin = module.exports = function PwmPin(opts) {
  this.pinNum = opts.pin;
  this.period = opts.period;
  this.connected = false;
  this.errCount = 0;
}

Cylon.Utils.subclass(PwmPin, EventEmitter);

var PWM_PATH = "/sys/class/pwm/pwmchip0";

PwmPin.prototype.connect = function() {
  var exists = FS.existsSync(this._pinDir());

  if (exists) {
    return this._enablePin(true);
  }

  this._createPWMPin();
};

PwmPin.prototype.disconnect = function() {
  FS.writeFile(this._unexportPath(), this.pinNum, function(err) {
    this._releaseCallback(err);
  }.bind(this));
};

PwmPin.prototype.disconnectSync = function() {
  FS.writeFileSync(this._dutyPath(), 0);
  FS.writeFileSync(this._enablePath(), 0);
  FS.writeFileSync(this._unexportPath(), this.pinNum);
  this._releaseCallback(false);
};

// Creates the PWM pin file to write to
PwmPin.prototype._createPWMPin = function() {
  FS.writeFile(this._exportPath(), this.pinNum, function(err) {
    if (err) {
      return this.emit('error', 'Error while creating pin files');
    }

    this._enablePin(true);
  }.bind(this));
};

PwmPin.prototype._enablePin = function(emitConnect) {
  emitConnect = !!emitConnect;

  FS.writeFile(this._enablePath(), '1', function(err) {
    if (err) {
      Cylon.Logger.error(err);
      this.emit('error', 'Error while enabling pwm pin');
      return;
    }

    FS.writeFile(this._periodPath(), this.period, function(err) {
      if (err) {
        Cylon.Logger.error("Error while setting period");
        this.emit('error', 'Error while setting period');
        return;
      }

      this.ready = true;

      if (emitConnect) {
        this.connected = true;
        this.emit('connect', this.freq);
      }

      this.emit('open');
    }.bind(this));
  }.bind(this));
}

PwmPin.prototype.pwmWrite = function(duty) {
  this.duty = duty;

  FS.appendFile(this._dutyPath(),  duty + "\n", function(err) {
    if (err) {
      var msg = "Error occurred while writing duty to pin " + this.pinNum;
      this.emit('error', msg);
      return;
    }

    this.emit('pwmWrite', duty);
  }.bind(this));
};

PwmPin.prototype._pinDir = function() {
  return PWM_PATH + "/pwm" + this.pinNum;
};

PwmPin.prototype._exportPath = function() {
  return PWM_PATH + "/export";
};

PwmPin.prototype._unexportPath = function() {
  return PWM_PATH + "/unexport";
};

PwmPin.prototype._enablePath = function() {
  return "" + (this._pinDir()) + "/enable";
};

PwmPin.prototype._periodPath = function() {
  return "" + (this._pinDir()) + "/period";
};

PwmPin.prototype._dutyPath = function() {
  return "" + (this._pinDir()) + "/duty_cycle";
};

PwmPin.prototype._releaseCallback = function(err) {
  if (err) {
    this.emit('error', 'Error while releasing pwm pin');
  } else {
    this.emit('release', this.pinNum);
  }
};
