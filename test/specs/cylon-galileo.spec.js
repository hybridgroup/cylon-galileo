"use strict";

var Cylon = require("cylon"),
    GPIO = require("cylon-gpio");

var Adaptor = source("galileo");

var module = source("cylon-galileo");

describe("cylon-galileo", function() {
  describe("#register", function() {
    var bot, adaptor;

    beforeEach(function() {
      bot = { registerAdaptor: spy() };
      adaptor = bot.registerAdaptor = spy();

      stub(GPIO, 'register');

      module.register(bot);
    });

    afterEach(function() {
      GPIO.register.restore();
    });

    it("registers the 'galileo' adaptor with the robot", function() {
      expect(adaptor).to.be.calledWith('cylon-galileo', 'galileo');
    });

    it("registers the GPIO drivers", function() {
      expect(GPIO.register).to.be.calledWith(bot);
    });
  });

  describe("#adaptor", function() {
    it("returns a new instance of the Galileo adaptor", function() {
      var opts = { extraParams: {} };
      expect(module.adaptor(opts)).to.be.an.instanceOf(Adaptor);
    });
  });

  describe("#driver", function() {
    var mockDriver;

    beforeEach(function() {
      mockDriver = {};
      stub(GPIO, 'driver').returns(mockDriver);
    });

    afterEach(function() {
      GPIO.driver.restore();
    });

    it("asks GPIO to get a new instance o f", function() {
      expect(module.driver()).to.be.eql(mockDriver);
    });
  });
});
