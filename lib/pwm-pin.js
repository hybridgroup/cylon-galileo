/*
* Galileo PWM Pin
* cylonjs.com
*
* Copyright (c) 2013 The Hybrid Group
* Licensed under the Apache 2.0 license.
*/


'use strict';

var FS = require('fs'),
    EventEmitter = require('events').EventEmitter,
    namespace = require('node-namespace');

namespace('Cylon.IO', function() {
  return this.PwmPin = (function(_parent) {

    subclass(PwmPin, _parent);

    var PWD_PATH = "/sys/class/pwm/pwmchip0",
        SERVO_FREQ = 50;

    function PwmPin(opts) {
      this.pinNum = opts.pin.toString();
      this.freq = 2000;
      this.period = this._calcPeriod(this.freq);
      this.duty = this.period;
      this.ready = false;
    }

    PwmPin.prototype.connect = function() {
      var _this = this;

      FS.exists(this._pwmPinDir(), function(exists) {
        exists ? _this._enablePin(true) : _this._createPWMPin();
      });
    };

    PwmPin.prototype.close = function() {
      return true;
    };

    PwmPin.prototype.closeSync = function() {
      return this._releaseCallback(false);
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
          _this.emit('error', 'Error while enabling pwm pin');
        } else {
          _this.ready = true;
          if (emitConnect) { _this.emit('connect', _this.freq); }
          _this.emit('open');
        }
      });
    }

    PwmPin.prototype.pwmWrite = function(value, servo) {
      var _this = this;
      if (servo == null || servo == void(0)) {
        servo = false;
      }
      this.value = value;
      this.pwmVal = (servo != false) ? this._servoVal(value) : this._pwmVal(value);
      FS.appendFile(this._dutyPath(), "" + this.pwmVal + "\n", function(err) {
        if (err) {
          return _this.emit('error', "Error occurred while writing value " + _this.pbVal + " to pin " + _this.pinNum);
        } else {
          if (servo) {
            return _this.emit('servoWrite', value);
          } else {
            return _this.emit('pwmWrite', value);
          }
        }
      });
      return true;
    };

    PwmPin.prototype.servoWrite = function(angle) {
      if (this.freq === SERVO_FREQ) {
        return this.pwmWrite(angle, true);
      } else {
        return this._setServoFreq(angle);
      }
    };

    PwmPin.prototype._setServoFreq = function(angle) {
      var _this = this,
          servoPeriod = this._calcPeriod(SERVO_FREQ);

      FS.appendFile(this._periodPath(), servoPeriod, function(err) {
        if (err) {
          return _this.emit('error', err);
        } else {
          _this.freq = SERVO_FREQ;
          _this.period = servoPeriod;
          return _this.pwmWrite(angle, true);
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

    DigitalPin.prototype._pwmPinDir = function() {
      return PWM_PATH + "/pwm" + this.pinNum;
    };

    PwmPin.prototype._exportPath = function() {
      return PWM_PATH + "/export";
    };

    PwmPin.prototype._unexportPath = function() {
      return PWM_PATH + "/unexport";
    };

    PwmPin.prototype._enablePath = function() {
      return "" + (this._pwmPinDir()) + "/enable";
    };

    PwmPin.prototype._periodPath = function() {
      return "" + (this._pwmPinDir()) + "/period";
    };

    PwmPin.prototype._dutyPath = function() {
      return "" + (this._pwmPinDir()) + "/duty_cycle";
    };

    PwmPin.prototype._releaseCallback = function(err) {
      if (err) {
        return this.emit('error', 'Error while releasing pwm pin');
      } else {
        return this.emit('release', this.pinNum);
      }
    };

    PwmPin.prototype._pwmVal = function(value) {
      var calc;
      calc = Math.round(((this.period / 255.0) * value) * 100) / 100;
      calc = calc > this.period ? this.period : calc;
      calc = calc < 0 ? 0 : calc;
      return calc | 0;
    };

    PwmPin.prototype._servoVal = function(angle) {
      var calc, maxDutyCycle;
      maxDutyCycle = this.period * 0.90;
      calc = Math.round(((maxDutyCycle / 180) * angle) + 500000);
      calc = calc > 2500000 ? 2500000 : calc;
      calc = calc < 500000 ? 500000 : calc;
      calc = calc;
      return calc | 0;
    };

    PwmPin.prototype._calcPeriod = function(freq) {
      return Math.round(1.0e9 / freq);
    };

    return PwmPin;

  })(EventEmitter);
});
