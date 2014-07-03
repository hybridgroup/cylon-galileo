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
  this.interval = (opts.extraParams.interval) ? opts.extraParams.interval.seconds() : (0.01).seconds();
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
  return this.connection.emit('disconnect');
};

Galileo.prototype.firmwareName = function() {
  return 'Galileo';
};

Galileo.prototype.analogRead = function(pinNum, callback) {
  var pin, aPinNum,
    _this = this;

  pinNum = pinNum.toString();
  aPinNum = ANALOG_PINS[pinNum].pin;
  pin = this.analogPins[aPinNum];

  if (pin == null) {
    pin = this._analogPin(pinNum);

    pin.on('analogRead', function(data) {
      _this.connection.emit('digitalRead', data);
      callback(data);
    });

    pin.on('connect', function(data) {
      pin.analogRead(_this.interval);
    });

    pin.connect();
  }
};

Galileo.prototype.digitalRead = function(pinNum, callback) {
  var pin,
    _this = this;

  pin = this.pins[this._translatePin(pinNum)];

  if (pin == null) {
    pin = this._digitalPin(pinNum, 'r');
    pin.on('digitalRead', function(val) {
      _this.connection.emit('digitalRead', val);
      callback(val);
    });
    pin.on('connect', function(data) {
      pin.digitalRead(_this.interval);
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
      _this.connection.emit('digitalWrite', val);
    });
    pin.on('connect', function(data) {
      pin.digitalWrite(value);
    });
    pin.connect();
  }
  return value;
};

Galileo.prototype._pwmWrite = function(pinNum, period, duty, value, eventName) {
  var pin, _this = this;

  pin = this._pwmPin(pinNum, period);

  if (pin.connected) {
    pin.pwmWrite(duty);
  } else {

    pin.on('pwmWrite', function(val) {
      _this.connection.emit(eventName + 'Write');
    });

    pin.on('connect', function(data) {
      _this.connection.emit(eventName + 'Connect');
      pin.pwmWrite(duty);
    });

    pin.connect();
  }
};

Galileo.prototype.pwmWrite = function(pinNum, scaledDuty, freq, pulseWidth, eventName) {
  freq = freq || DEFAULT_FREQ;

  var pwm = Cylon.IO.Utils.periodAndDuty(scaledDuty, freq, pulseWidth, 'high');

  eventName = eventName || 'pwm';

  this._pwmWrite(pinNum, pwm.period, pwm.duty, eventName);
};

Galileo.prototype.servoWrite = function() {
  var args = Array.prototype.slice.call(arguments);

  args[2] = (freq < SERVO_FREQ) ? SERVO_FREQ : freq;
  args.push('servo');

  this.pwmWrite.apply(this, args);
};

/*
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
*/

Galileo.prototype._pwmPin = function(pinNum, period) {
  var pin, gpioPinNum;

  gpioPinNum = this._translatePwmPin(pinNum.toString());
  pin = this.pwmPins[gpioPinNum];

  if (pin == null) {
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
  var key, pin,
      _pins = this.pins,
      _pwmPins = this.pwmPins;

  for (key in _pins) {
    pin = _pins[key];
    pin.disconnectSync();
  }

  for (key in _pwmPins) {
    pin = _pwmPins[key];
    pin.disconnectSync();
  }
};
