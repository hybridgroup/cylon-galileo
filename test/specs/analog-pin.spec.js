'use strict'

var fs = require('fs'),
    EventEmitter = require('events').EventEmitter;

var Cylon = require('cylon');

var AnalogPin = source('analog-pin');

describe("AnalogPin", function() {
  var pin;

  beforeEach(function() {
    var opts = {
      pin: 1,
      mux: { pin: 0, val: 'hello' }
    };

    pin = new AnalogPin(opts);
  });

  it("subclasses EventEmitter", function() {
    expect(pin).to.be.an.instanceOf(EventEmitter);
    expect(pin).to.be.an.instanceOf(AnalogPin);
  });

  describe("constructor", function() {
    it("sets @pinNum to the passed pin", function() {
      expect(pin.pinNum).to.be.eql(1);
    });

    it("sets @mux to the passed mux", function() {
      expect(pin.mux).to.be.eql({ pin: 0, val: 'hello' });
    });

    it("sets @muxPin to null by default", function() {
      expect(pin.muxPin).to.be.eql(null);
    });

    it("sets @pinPath to the calculated pin path", function() {
      expect(pin.pinPath).to.be.eql("/sys/bus/iio/devices/iio:device0/in_voltage1_raw");
    });

    it("sets @ready to false by default", function() {
      expect(pin.ready).to.be.eql(false);
    });
  });

  describe("#connect", function() {
    var muxPin;

    beforeEach(function() {
      muxPin = new EventEmitter();

      muxPin.connect = spy();
      muxPin.digitalWrite = spy();

      stub(Cylon.IO, 'DigitalPin').returns(muxPin);

      pin.connect();
    });

    afterEach(function() {
      Cylon.IO.DigitalPin.restore();
    });

    it("creates a DigitalPin with the provided mux pin", function() {
      expect(Cylon.IO.DigitalPin).to.be.calledWithNew;
      expect(Cylon.IO.DigitalPin).to.be.calledWith(pin.mux);
      expect(pin.muxPin).to.be.eql(muxPin);
    });

    it("tells the mux pin to connect", function() {
      expect(muxPin.connect).to.be.called;
    });

    context("when the pin is connected", function() {
      beforeEach(function() {
        muxPin.emit('connect');
      });

      it("writes the mux value", function() {
        expect(muxPin.digitalWrite).to.be.calledWith(pin.mux.val);
      });
    });

    context("when the mux pin writes", function() {
      beforeEach(function() {
        pin.emit = spy();

        muxPin.emit('connect');
        muxPin.emit('digitalWrite');
      });

      it("emits the 'connect' event", function() {
        expect(pin.emit).to.be.calledWith('connect');
      });
    });
  });

  describe("#disconnect", function() {
    beforeEach(function() {
      stub(pin, '_releaseCallback');
      pin.disconnect();
    });

    afterEach(function() {
      pin._releaseCallback.restore();
    });

    it("triggers the release callback", function() {
      expect(pin._releaseCallback).to.be.calledWith(false);
    });

    describe("on release", function() {
      it("emits the 'disconnect' event", function(done) {
        pin.on('disconnect', done);
        pin.emit('release');
      });
    });
  });

  describe("#disconnectSync", function() {
    beforeEach(function() {
      stub(pin, '_releaseCallback');
    });

    afterEach(function() {
      pin._releaseCallback.restore();
    });

    it("triggers the release callback", function() {
      pin.disconnectSync();
      expect(pin._releaseCallback).to.be.calledWith(false);
    });
  });

  describe("#analogRead", function() {
    var clock;

    beforeEach(function() {
      clock = sinon.useFakeTimers();
      stub(fs, 'readFile');
      pin.analogRead(5);
    });

    afterEach(function() {
      clock.restore();
      fs.readFile.restore();
    });

    it('tries to read from the pin on the provided interval', function() {
      expect(fs.readFile).to.not.be.called;

      clock.tick(5);
      expect(fs.readFile).to.be.calledWith(pin.pinPath);
    });

    context("if an error occurs while reading the pin value", function() {
      beforeEach(function() {
        pin.emit = spy();
        fs.readFile.yields("err")
        clock.tick(5)
      });

      it("emits the error", function() {
        var msg = "Error occurred while reading from pin 1";
        expect(pin.emit).to.be.calledWith('error', msg)
      });
    });

    context("if the pin value is read", function() {
      beforeEach(function() {
        pin.emit = spy();
        fs.readFile.yields(null, "10")
        clock.tick(5)
      });

      it("emits 'analogRead' with the data", function() {
        expect(pin.emit).to.be.calledWith('analogRead', 10)
      });
    });
  });

  describe("#_pinPath", function() {
    context("if @pinPath is already set", function() {
      it("returns @pinPath", function() {
        pin.pinPath = "/path/to/pin";
        expect(pin._pinPath()).to.be.eql("/path/to/pin");
      });
    });

    context("by default", function() {
      it("constructs a analog pin path", function() {
        var path = "/sys/bus/iio/devices/iio:device0/in_voltage1_raw";

        pin.pinPath = null;
        expect(pin._pinPath()).to.be.eql(path);
      });
    });
  });

  describe("#_releaseCallback", function() {
    beforeEach(function() {
      pin.emit = spy();
    });

    context("if an error is passed", function() {
      it("emits the 'error' event", function() {
        pin._releaseCallback('err');
        expect(pin.emit).to.be.calledWith('error');
      });
    });

    context("if no error is passed", function() {
      it("emits the 'release' event", function() {
        pin._releaseCallback(null);
        expect(pin.emit).to.be.calledWith('release', pin.pinNum);
      });
    });
  });
});
