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
  var _this = this;

  FS.exists(this._pinDir(), function(exists) {
    exists ? _this._enablePin(true) : _this._createPWMPin();
  });
};

PwmPin.prototype.disconnect = function() {
 var _this = this;

  FS.writeFile(this._unexportPath(), this.pinNum, function(err) {
    _this._releaseCallback(err);
  });
};

PwmPin.prototype.disconnectSync = function() {
  FS.writeFileSync(this._dutyPath(), 0);
  FS.writeFileSync(this._enablePath(), 0);
  FS.writeFileSync(this._unexportPath(), this.pinNum);
  this._releaseCallback(false);
};

// Creates the PWM pin file to write to
PwmPin.prototype._createPWMPin = function() {
  var _this = this;

  FS.writeFile(this._exportPath(), this.pinNum, function(err) {
    if (err) {
      _this.emit('error', 'Error while creating pin files');
    } else {
      _this._enablePin(true);
    }
  });
};

PwmPin.prototype._enablePin = function(emitConnect) {
  var _this = this;

  if (emitConnect == null) { emitConnect = false; }

  FS.writeFile(this._enablePath(), '1', function(err) {
    if (err) {
      console.log(err);
      _this.emit('error', 'Error while enabling pwm pin');
    } else {
      var __this = _this
      FS.writeFile(_this._periodPath(), _this.period, function(err) {
        if (err) {
          console.log("Error while setting period");
          __this.emit('error', 'Error while setting period');
        } else {
          __this.ready = true;
          if (emitConnect) {
            __this.connected = true;
            __this.emit('connect', __this.freq);
          }
          __this.emit('open');
        }
      });
    }
  });
}

PwmPin.prototype.pwmWrite = function(duty) {
  var _this = this;
  this.duty = duty;

  FS.appendFile(this._dutyPath(), "" + duty + "\n", function(err) {
    if (err) {
      _this.emit('error', "Error occurred while writing value " + _this.pbVal + " to pin " + _this.pinNum);
    } else {
      _this.emit('pwmWrite', duty);
    }
  });
};

PwmPin.prototype._findFile = function(dirName, nameRegex) {
  var f, file, files, _i, _len;
  files = FS.readdirSync(dirName);
  file = null;
  for (_i = 0, _len = files.length; _i < _len; _i++) {
    f = files[_i];
    file = f.match(nameRegex);
    if (file != null) {
      file = file[0];
      break;
    }
  }
  return file;
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
