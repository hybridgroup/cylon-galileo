/*
 * Cylon-Galileo
 * http://cylonjs.com
 *
 * Copyright (c) 2014 The Hybrid Group
 * Licensed under the Apache 2.0 license.
*/

"use strict";

var Cylon = require('cylon');

var Adaptor = require('./galileo');

var GPIO = require("cylon-gpio");

module.exports = {
  adaptor: function(opts) {
    return new Adaptor(opts);
  },

  driver: function(opts) {
    return new GPIO.driver(opts);
  },

  register: function(robot) {
    Cylon.Logger.warn("WARNING: The cylon-galileo adaptor has been deprecated. Use cylon-intel-iot module.");
    Cylon.Logger.debug("Registering Galileo adaptor for " + robot.name);
    robot.registerAdaptor('cylon-galileo', 'galileo');
    GPIO.register(robot);
  }
};
