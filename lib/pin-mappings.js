/*
 * Cylonjs Galileo pin mappings
 * http://cylonjs.com
 *
 * Copyright (c) 2013-2014 The Hybrid Group
 * Licensed under the Apache 2.0 license.
*/

var PinMapping = module.exports = function PinMapping(rev) {
  this.revision = rev;
}

PinMapping.prototype.forPin = function(pinNum) {
  if (this.revision == "GEN1") {
    return GEN1_PINS[pinNum.toString()];
  } else {
    return GEN2_PINS[pinNum.toString()];
  }
};

PinMapping.prototype.forAnalogPin = function(pinNum) {
  if (this.revision == "GEN1") {
    return GEN1_ANALOG_PINS[pinNum.toString()];
  } else {
    return GEN2_ANALOG_PINS[pinNum.toString()];
  }
};

PinMapping.prototype.forPwmPin = function(pinNum) {
  if (this.revision == "GEN1") {
    return GEN1_PWM_PINS[pinNum.toString()];
  } else {
    return GEN2_PWM_PINS[pinNum.toString()];
  }
};

var GEN1_PINS = {
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

var GEN1_PWM_PINS = {
  '3': '3',
  '5': '5',
  '6': '6',
  '9': '1',
  '10': '7',
  '11': '4'
};

var GEN1_ANALOG_PINS = {
  '0': { pin: '0', mux: { pin: '37', val: 0, mode: 'w' } },
  '1': { pin: '1', mux: { pin: '37', val: 0, mode: 'w' } },
  '2': { pin: '2', mux: { pin: '37', val: 0, mode: 'w' } },
  '3': { pin: '3', mux: { pin: '37', val: 0, mode: 'w' } },
  '4': { pin: '4', mux: { pin: '37', val: 0, mode: 'w' } },
  '5': { pin: '5', mux: { pin: '37', val: 0, mode: 'w' } }
};

var GEN2_PINS = {
  '13': '7',
  '12': '16',
  '11': '5',
  '10': '10',
  '9': '4',
  '8': '40',
  '7': '38',
  '6': '1',
  '5': '0',
  '4': '6',
  '3': '62',
  '2': '13',
  '1': '12',
  '0': '11'
};

var GEN2_PWM_PINS = {
  '3': '3',
  '5': '5',
  '6': '6',
  '9': '1',
  '10': '7',
  '11': '4'
};

var GEN2_ANALOG_PINS = {
  '0': { pin: '0', mux: { pin: '37', val: 0, mode: 'w' } },
  '1': { pin: '1', mux: { pin: '37', val: 0, mode: 'w' } },
  '2': { pin: '2', mux: { pin: '37', val: 0, mode: 'w' } },
  '3': { pin: '3', mux: { pin: '37', val: 0, mode: 'w' } },
  '4': { pin: '4', mux: { pin: '37', val: 0, mode: 'w' } },
  '5': { pin: '5', mux: { pin: '37', val: 0, mode: 'w' } }
};
