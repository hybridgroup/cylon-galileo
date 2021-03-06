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

var PINS = {
  '13': '39',
  '12': '38',
  '11': '25',
  '10': '16',
  '9': '19',
  '8': '26',
  '7': '27',
  '6': '24',
  '5': '17',
  '4': '28',
  '3': '18',
  '2': '31',
  '1': '51',
  '0': '50'
};

var PWM_PINS = {
  '3': '3',
  '5': '5',
  '6': '6',
  '9': '1',
  '10': '7',
  '11': '4'
};

var ANALOG_PINS = {
  '0': { pin: '0', mux: { pin: '37', val: 0, mode: 'w' } },
  '1': { pin: '1', mux: { pin: '37', val: 0, mode: 'w' } },
  '2': { pin: '2', mux: { pin: '37', val: 0, mode: 'w' } },
  '3': { pin: '3', mux: { pin: '37', val: 0, mode: 'w' } },
  '4': { pin: '4', mux: { pin: '37', val: 0, mode: 'w' } },
  '5': { pin: '5', mux: { pin: '37', val: 0, mode: 'w' } }
}

var I2C_INTERFACE = '/dev/i2c-0';

var DEFAULT_FREQ = 2000;
var SERVO_FREQ = 126;

var Galileo = module.exports = function Galileo(opts) {
  Galileo.__super__.constructor.apply(this, arguments);

  this.pins = {};
  this.pwmPins = {};
  this.analogPins = {};
  this.i2cDevices = {};

  var interval = opts.extraParams.interval || 0.01;
  this.interval = interval * 1000;
}

Cylon.Utils.subclass(Galileo, Cylon.Adaptor);

Galileo.prototype.commands = [
  'pins', 'digitalRead', 'digitalWrite', 'pwmWrite',
  'analogRead', 'servoWrite', 'firmwareName', 'i2cWrite', 'i2cRead'
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

  number = number.toString();

  analogPinNumber = ANALOG_PINS[number].pin;
  pin = this.analogPins[analogPinNumber];

  if (pin == null) {
    pin = this._analogPin(number);

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
  var aPin = ANALOG_PINS[pinNum];

  if (this.analogPins[aPin.pin] == null) {
    this.analogPins[aPin.pin] = new AnalogPin(aPin);
  }

  return this.analogPins[aPin.pin];
};

Galileo.prototype._translatePin = function(pinNum) {
  return PINS[pinNum.toString()];
};

Galileo.prototype._translatePwmPin = function(pinNum) {
  return PWM_PINS[pinNum];
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
