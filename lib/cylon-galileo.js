/*
 * <%= adaptorName %>
 * http://cylonjs.com
 *
 * Copyright (c) 2014 Your Name Here
 * Your License Here
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
    //return(GPIO.driver.apply(GPIO, args) || I2C.driver.apply(I2C, args));
    return new GPIO.driver(opts);
  },

  register: function(robot) {
    Cylon.Logger.debug("Registering Galielo adaptor for " + robot.name);
    robot.registerAdaptor('cylon-galileo', 'galileo');
    GPIO.register(robot);
  }
};
