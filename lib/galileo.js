/*
 * Cylonjs Galileo adaptor
 * http://cylonjs.com
 *
 * Copyright (c) 2013-2014 The Hybrid Group
 * Licensed under the Apache 2.0 license.
*/

'use strict';

var Cylon = require('cylon');

var PwmPin = require('./pwm-pin');
var AnalogPin = require('./analog-pin');

var PinMapping = require('./pin-mappings');

var DEFAULT_FREQ = 2000;
var SERVO_FREQ = 126;

var Galileo = module.exports = function Galileo(opts) {
  Galileo.__super__.constructor.apply(this, arguments);
  var extraParams = opts.extraParams || {};

  this.pins = {};
  this.pwmPins = {};
  this.analogPins = {};
  this.revision = extraParams.revision || "GEN2"
  this.pinMapper = new PinMapping(this.revision);

  var interval = extraParams.interval || 0.01;
  this.interval = interval * 1000;
}

Cylon.Utils.subclass(Galileo, Cylon.Adaptor);

Galileo.prototype.commands = [
  'pins', 'digitalRead', 'digitalWrite', 'pwmWrite',
  'analogRead', 'servoWrite', 'firmwareName'
];

Galileo.prototype.connect = function(callback) {
  Galileo.__super__.connect.apply(this, arguments);
};

Galileo.prototype.disconnect = function() {
  this._noop();

  Cylon.Logger.debug("Disconnecting all pins...");
  this._disconnectPins();

  Cylon.Logger.debug("Disconnecting from board '" + this.name + "'...");
  Galileo.__super__.disconnect.apply(this, arguments);
};

Galileo.prototype.firmwareName = function() {
  return 'Galileo';
};

Galileo.prototype.analogRead = function(number, callback) {
  var pin, analogPinNumber;

  analogPinNumber = this._translateAnalogPin(number.toString());
  pin = this.analogPins[analogPinNumber];

  if (pin == null) {
    pin = this._analogPin(number.toString());

    pin.on('analogRead', function(data) {
      this.connection.emit('analogRead', data);
      callback(data);
    }.bind(this));

    pin.on('connect', function(data) {
      pin.analogRead(this.interval);
    }.bind(this));

    pin.connect();
  }
};

Galileo.prototype.digitalRead = function(pinNum, callback) {
  var pin;

  pin = this.pins[this._translatePin(pinNum)];

  if (pin == null) {
    pin = this._digitalPin(pinNum, 'r');

    pin.on('digitalRead', function(val) {
      this.connection.emit('digitalRead', val);
      callback(val);
    }.bind(this));

    pin.on('connect', function(data) {
      pin.digitalRead(this.interval);
    }.bind(this));

    pin.connect();
  }

  return true;
};

Galileo.prototype.digitalWrite = function(pinNum, value) {
  var pin = this.pins[this._translatePin(pinNum)];

  if (!!pin) {
    return pin.digitalWrite(value);
  }

  pin = this._digitalPin(pinNum, 'w');

  pin.on('digitalWrite', function(val) {
    this.connection.emit('digitalWrite', val);
  }.bind(this));

  pin.on('connect', function(data) {
    pin.digitalWrite(value);
  });

  pin.connect();

  return value;
};

Galileo.prototype._pwmWrite = function(pinNum, period, duty, value, eventName) {
  var pin, _this = this;

  pin = this._pwmPin(pinNum, period);

  if (pin.connected) {
    return pin.pwmWrite(duty);
  }

  pin.on('pwmWrite', function(val) {
    this.connection.emit(eventName + 'Write');
  }.bind(this));

  pin.on('connect', function(data) {
    this.connection.emit(eventName + 'Connect');
    pin.pwmWrite(duty);
  }.bind(this));

  pin.connect();
};

Galileo.prototype.pwmWrite = function(pinNum, scaledDuty, freq, pulseWidth, eventName) {
  freq = freq || DEFAULT_FREQ;
  eventName = eventName || 'pwm';

  var pwm = Cylon.IO.Utils.periodAndDuty(scaledDuty, freq, pulseWidth, 'high');

  this._pwmWrite(pinNum, pwm.period, pwm.duty, eventName);
};

Galileo.prototype.servoWrite = function(pinNum, scaledDuty, freq, pulseWidth) {
  var args = Array.prototype.slice.call(arguments);

  args[2] = (freq < SERVO_FREQ) ? SERVO_FREQ : freq;
  args.push('servo');

  this.pwmWrite.apply(this, args);
};

Galileo.prototype._pwmPin = function(pinNum, period) {
  var gpioPinNum = this._translatePwmPin(pinNum.toString()),
      pin = this.pwmPins[gpioPinNum];

  if (!pin) {
    pin = this.pwmPins[gpioPinNum] = new PwmPin({
      pin: gpioPinNum,
      period: period
    });
  }

  return pin;
};

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

Galileo.prototype._analogPin = function(pinNum, mode) {
  var aPin = this._translateAnalogPin(pinNum);

  if (this.analogPins[aPin] == null) {
    this.analogPins[aPin] = new AnalogPin(aPin);
  }

  return this.analogPins[aPin];
};

Galileo.prototype._translatePin = function(pinNum) {
  return this.pinMapper.forPin(pinNum);
};

Galileo.prototype._translateAnalogPin = function(pinNum) {
  return this.pinMapper.forAnalogPin(pinNum);
};

Galileo.prototype._translatePwmPin = function(pinNum) {
  return this.pinMapper.forPwmPin(pinNum);  
};

Galileo.prototype._disconnectPins = function() {
  var p;

  for (p in this.pins) {
    this.pins[p].disconnectSync();
  }

  for (p in this.pwmPins) {
    this.pwmPins[p].disconnectSync();
  }
};
