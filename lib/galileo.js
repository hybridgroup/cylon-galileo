/*
 * Cylonjs Galileo adaptor
 * http://cylonjs.com
 *
 * Copyright (c) 2013-2014 The Hybrid Group
 * Licensed under the Apache 2.0 license.
*/

'use strict';

var namespace = require('node-namespace');

namespace("Cylon.Adaptors", function() {
  this.Galileo = (function(klass) {
    subclass(Galileo, klass);

    var I2C_INTERFACE, PINS, PWM_PINS;

    PINS = {
      '13': '39',
      '12': '38',
      '11': '25',
      '10': '16',
      '09': '19',
      '08': '26',
      '07': '27',
      '06': '24',
      '05': '17',
      '04': '28',
      '03': '18',
      '02': '31',
      '01': '51',
      '00': '50'
    };

    PWM_PINS = {
      "P9_14": 'P9_14',
      "P9_21": 'P9_21',
      "P9_22": 'P9_22',
      "P9_29": 'P9_29',
      "P9_42": 'P9_42',
      "P8_13": 'P8_13',
      "P8_34": 'P8_34',
      "P8_45": 'P8_45',
      "P8_46": 'P8_46'
    };

    I2C_INTERFACE = '/dev/i2c-1';

    function Galileo(opts) {
      Galileo.__super__.constructor.apply(this, arguments);
      //this.board;
      this.pins = {};
      this.pwmPins = {};
      this.i2cDevices = {};
      //this.myself;
    }

    Galileo.prototype.commands = function() {
      return ['pins', 'digitalRead', 'digitalWrite', 'pwmWrite', 'servoWrite', 'firmwareName', 'i2cWrite', 'i2cRead'];
    };

    Galileo.prototype.connect = function(callback) {
      Galileo.__super__.connect.apply(this, arguments);
      //this.proxyMethods(this.commands, this.board, this.myself);
    };

    Galileo.prototype.disconnect = function() {
      Logger.debug("Disconnecting all pins...");
      this._disconnectPins();
      Logger.debug("Disconnecting from board '" + this.name + "'...");
      return this.connection.emit('disconnect');
    };

    Galileo.prototype.firmwareName = function() {
      return 'Galileo';
    };

    Galileo.prototype.digitalRead = function(pinNum, drCallback) {
      var pin,
        _this = this;
      pin = this.pins[this._translatePin(pinNum)];
      if (pin == null) {
        pin = this._digitalPin(pinNum, 'r');
        pin.on('digitalRead', function(val) {
          _this.connection.emit('digitalRead', val);
          return drCallback(val);
        });
        pin.on('connect', function(data) {
          return pin.digitalRead(20);
        });
        pin.connect();
      }
      return true;
    };

    Galileo.prototype.digitalWrite = function(pinNum, value) {
      var pin,
        _this = this;
      pin = this.pins[this._translatePin(pinNum)];
      if (pin != null) {
        pin.digitalWrite(value);
      } else {
        pin = this._digitalPin(pinNum, 'w');
        pin.on('digitalWrite', function(val) {
          return _this.connection.emit('digitalWrite', val);
        });
        pin.on('connect', function(data) {
          return pin.digitalWrite(value);
        });
        pin.connect();
      }
      return value;
    };
    /*
    Galileo.prototype.pwmWrite = function(pinNum, value) {
      var pin,
        _this = this;
      pin = this.pwmPins[this._translatePwmPin(pinNum)];
      if (pin != null) {
        pin.pwmWrite(value);
      } else {
        pin = this._pwmPin(pinNum);
        pin.on('pwmWrite', function(val) {
          return _this.connection.emit('pwmWrite', val);
        });
        pin.on('connect', function(data) {
          return pin.pwmWrite(value);
        });
        pin.connect();
      }
      return value;
    };

    Galileo.prototype.servoWrite = function(pinNum, angle) {
      var pin,
        _this = this;
      pin = this.pwmPins[this._translatePwmPin(pinNum)];
      if (pin != null) {
        pin.servoWrite(angle);
      } else {
        pin = this._pwmPin(pinNum);
        pin.on('servoWrite', function(val) {
          return _this.connection.emit('servoWrite', val);
        });
        pin.on('connect', function(data) {
          return pin.servoWrite(angle);
        });
        pin.connect();
      }
      return angle;
    };

    Galileo.prototype.i2cWrite = function(address, cmd, buff, callback) {
      if (callback == null) {
        callback = null;
      }
      buff = buff != null ? buff : [];
      return this._i2cDevice(address).write(cmd, buff, callback);
    };

    Galileo.prototype.i2cRead = function(address, cmd, length, callback) {
      if (callback == null) {
        callback = null;
      }
      return this._i2cDevice(address).read(cmd, length, callback);
    };

    Galileo.prototype._i2cDevice = function(address) {
      if (this.i2cDevices[address] == null) {
        this.i2cDevices[address] = new Cylon.I2C.I2CDevice({
          address: address,
          "interface": I2C_INTERFACE
        });
      }
      return this.i2cDevices[address];
    };

    Galileo.prototype._pwmPin = function(pinNum) {
      var gpioPinNum, size;
      gpioPinNum = this._translatePwmPin(pinNum);
      if (this.pwmPins[gpioPinNum] == null) {
        size = Object.keys(this.pwmPins).length;
        this.pwmPins[gpioPinNum] = new Cylon.IO.PwmPin({
          pin: gpioPinNum,
          loadPwmModule: size === 0
        });
      }
      return this.pwmPins[gpioPinNum];
    };
     */
    Galileo.prototype._digitalPin = function(pinNum, mode) {
      var gpioPinNum;
      gpioPinNum = this._translatePin(pinNum);
      if (this.pins[gpioPinNum] == null) {
        this.pins[gpioPinNum] = new Cylon.IO.DigitalPin({
          pin: gpioPinNum,
          mode: mode
        });
      }
      return this.pins[gpioPinNum];
    };

    Galileo.prototype._translatePin = function(pinNum) {
      return PINS[pinNum];
    };

    Galileo.prototype._translatePwmPin = function(pinNum) {
      return PWM_PINS[pinNum];
    };

    Galileo.prototype._disconnectPins = function() {
      var key, pin, _ref, _ref1, _results;
      _ref = this.pins;
      for (key in _ref) {
        pin = _ref[key];
        pin.closeSync();
      }
      _ref1 = this.pwmPins;
      _results = [];
      for (key in _ref1) {
        pin = _ref1[key];
        _results.push(pin.closeSync());
      }
      return _results;
    };

    return Galileo;

  })(Cylon.Adaptor);
});
