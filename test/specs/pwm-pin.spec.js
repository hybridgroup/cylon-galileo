'use strict';

var fs = require('fs'),
    Cylon = require('cylon'),
    EventEmitter = require('events').EventEmitter;

var PwmPin = source('pwm-pin');

describe("PwmPin", function() {
  var pin;

  beforeEach(function() {
    pin = new PwmPin({ pin: 3, period: 100 });
  });

  it("subclasses EventEmitter", function() {
    expect(pin).to.be.an.instanceOf(EventEmitter);
    expect(pin).to.be.an.instanceOf(PwmPin);
  });

  describe("constructor", function() {
    it("sets @pinNum to the provided value", function() {
      expect(pin.pinNum).to.be.eql(3);
    });

    it("sets @period to the provided value", function() {
      expect(pin.period).to.be.eql(100);
    });

    it("sets @connected to false", function() {
      expect(pin.connected).to.be.eql(false);
    });

    it("sets @errCount to 0", function() {
      expect(pin.errCount).to.be.eql(0);
    });
  });

  describe("#connect", function() {
    beforeEach(function() {
      stub(fs, 'existsSync');
      pin._enablePin = spy();
      pin._createPWMPin = spy();
    });

    afterEach(function() {
      fs.existsSync.restore();
    });

    it("checks if the pin exists", function() {
      var path = "/sys/class/pwm/pwmchip0/pwm3";
      pin.connect();
      expect(fs.existsSync).to.be.calledWith(path);
    });

    context("if the pin exists", function() {
      beforeEach(function() {
        fs.existsSync.returns(true);
      });

      it("enables the pin", function() {
        pin.connect();
        expect(pin._enablePin).to.be.called;
      });
    });

    context("if the pin doesn't exist", function() {
      beforeEach(function() {
        fs.existsSync.returns(false);
      });

      it("creates a new PWM Pin", function() {
        pin.connect();
        expect(pin._createPWMPin).to.be.called;
      });
    });
  });

  describe("#disconnect", function() {
    beforeEach(function() {
      stub(fs, 'writeFile');
      pin._releaseCallback = spy();
    });

    afterEach(function() {
      fs.writeFile.restore();
    });

    it("writes to the unexport path with the pin number", function() {
      var path = "/sys/class/pwm/pwmchip0/unexport";
      pin.disconnect();
      expect(fs.writeFile).to.be.calledWith(path, pin.pinNum);
    });

    context("when it's finished writing", function() {
      beforeEach(function() {
        fs.writeFile.yields('maybe-an-err');
      });

      it("triggers the release callback", function() {
        pin.disconnect();
        expect(pin._releaseCallback).to.be.calledWith('maybe-an-err')
      });
    });
  });

  describe("#disconnectSync", function() {
    var write;

    beforeEach(function() {
      stub(fs, 'writeFileSync');
      write = fs.writeFileSync;

      pin._releaseCallback = spy();
      pin.disconnectSync();
    });

    afterEach(function() {
      fs.writeFileSync.restore();
    });

    it("zeroes out the dutyPath file", function() {
      var path = "/sys/class/pwm/pwmchip0/pwm3/duty_cycle";
      expect(write).to.be.calledWith(path, 0);
    });

    it("zeroes out the enablePath file", function() {
      var path = "/sys/class/pwm/pwmchip0/pwm3/enable";
      expect(write).to.be.calledWith(path, 0);
    });

    it("writes the pin number to the unexport path", function() {
      var path = "/sys/class/pwm/pwmchip0/unexport";
      expect(write).to.be.calledWith(path, pin.pinNum);
    });

    it("triggers the release callback", function() {
      expect(pin._releaseCallback).to.be.calledWith(false);
    });
  });

  describe("#_createPWMPin", function() {
    beforeEach(function() {
      stub(fs, 'writeFile');
      pin.emit = spy();
      pin._enablePin = spy();
    });

    afterEach(function() {
      fs.writeFile.restore();
    });

    it("writes the pin number to the export path", function() {
      pin._createPWMPin();
      var path = "/sys/class/pwm/pwmchip0/export";
      expect(fs.writeFile).to.be.calledWith(path, pin.pinNum);
    });

    context("if the write was successful", function() {
      beforeEach(function() {
        fs.writeFile.yields(null);
      });

      it("calls #_enablePin", function() {
        pin._createPWMPin();
        expect(pin._enablePin).to.be.calledWith(true);
      });
    });

    context("if the write was unsuccessful", function() {
      beforeEach(function() {
        fs.writeFile.yields('error');
      });

      it("emits the 'error' event", function() {
        pin._createPWMPin();
        expect(pin.emit).to.be.calledWith('error');
      });
    });
  });

  describe("#_enablePin", function() {
    beforeEach(function() {
      stub(fs, 'writeFile');
      pin.emit = spy();
    });

    afterEach(function() {
      fs.writeFile.restore();
    });

    it("writes '1' to the enable path", function() {
      var path = "/sys/class/pwm/pwmchip0/pwm3/enable";
      pin._enablePin();
      expect(fs.writeFile).to.be.calledWith(path, '1');
    });

    context("if the write was successful", function() {
      beforeEach(function() {
        var path = "/sys/class/pwm/pwmchip0/pwm3/enable";
        fs.writeFile.withArgs(path).yields(null);
      });

      it("writes the period", function() {
        var path = "/sys/class/pwm/pwmchip0/pwm3/period";
        pin._enablePin();
        expect(fs.writeFile).to.be.calledWith(path, pin.period);
      });

      context("if the period write was successful", function() {
        beforeEach(function() {
          var path = "/sys/class/pwm/pwmchip0/pwm3/period";
          fs.writeFile.withArgs(path).yields(null);
        });

        it("emits the 'open' event", function() {
          pin._enablePin();
          expect(pin.emit).to.be.calledWith('open');
        });

        it("emits the 'connect' event if told to", function() {
          pin._enablePin();
          expect(pin.emit).to.not.be.calledWith('connect');

          pin._enablePin(true);
          expect(pin.emit).to.be.calledWith('connect', pin.freq);
          expect(pin.connected).to.be.eql(true);
        });

        it("sets @ready to true", function() {
          pin._enablePin();
          expect(pin.ready).to.be.eql(true);
        });
      });

      context("if the write was unsuccessful", function() {
        beforeEach(function() {
          var path = "/sys/class/pwm/pwmchip0/pwm3/period";
          fs.writeFile.withArgs(path).yields('error');
        });

        it("emits the 'error' event", function() {
          pin._enablePin();
          expect(pin.emit).to.be.calledWith('error', 'Error while setting period');
        });
      })
    });

    context("if the write was unsuccessful", function() {
      beforeEach(function() {
        var path = "/sys/class/pwm/pwmchip0/pwm3/enable";
        fs.writeFile.withArgs(path).yields('error');
      });

      it("emits the 'error' event", function() {
        pin._enablePin();
        expect(pin.emit).to.be.calledWith('error', 'Error while enabling pwm pin');
      });
    })
  });

  describe("#pwmWrite", function() {
    beforeEach(function() {
      stub(fs, 'appendFile');
      pin.emit = spy();
    });

    afterEach(function() {
      fs.appendFile.restore();
    });

    it("sets @duty to the passed duty", function() {
      pin.pwmWrite(100);
      expect(pin.duty).to.be.eql(100);
    });

    it("appends the duty to the dutypath", function() {
      var path = "/sys/class/pwm/pwmchip0/pwm3/duty_cycle";
      pin.pwmWrite(100);
      expect(fs.appendFile).to.be.calledWith(path, "100\n");
    });

    context("if appending the duty is successful", function() {
      beforeEach(function() {
        fs.appendFile.yields(null);
      });

      it("emits 'pwmWrite'", function() {
        pin.pwmWrite(100);
        expect(pin.emit).to.be.calledWith('pwmWrite', 100);
      });
    });

    context("if appending the duty is unsuccessful", function() {
      beforeEach(function() {
        fs.appendFile.yields('err');
      });

      it("emits 'error'", function() {
        pin.pwmWrite(100);
        expect(pin.emit).to.be.calledWith('error');
      });
    });
  });

  describe("#_pinDir", function() {
    it("returns the PWM path for the pin number", function() {
      var path = "/sys/class/pwm/pwmchip0/pwm3";
      expect(pin._pinDir()).to.be.eql(path);
    });
  });

  describe("#_exportPath", function() {
    it("returns the PWM export path", function() {
      var path = "/sys/class/pwm/pwmchip0/export";
      expect(pin._exportPath()).to.be.eql(path);
    });
  });

  describe("#_unexportPath", function() {
    it("returns the PWM unexport path", function() {
      var path = "/sys/class/pwm/pwmchip0/unexport";
      expect(pin._unexportPath()).to.be.eql(path);
    });
  });

  describe("#_enablePath", function() {
    it("returns the enable path for the pin", function() {
      var path = "/sys/class/pwm/pwmchip0/pwm3/enable";
      expect(pin._enablePath()).to.be.eql(path);
    });
  });

  describe("#_periodPath", function() {
    it("returns the period path for the pin", function() {
      var path = "/sys/class/pwm/pwmchip0/pwm3/period";
      expect(pin._periodPath()).to.be.eql(path);
    });
  });

  describe("#_dutyPath", function() {
    it("returns the duty path for the pin", function() {
      var path = "/sys/class/pwm/pwmchip0/pwm3/duty_cycle";
      expect(pin._dutyPath()).to.be.eql(path);
    });
  });

  describe("#_releaseCallback", function() {
    beforeEach(function() {
      pin.emit = spy();
    });

    context("if it is passed an error", function() {
      it("emits the 'error' event", function() {
        pin._releaseCallback('err');
        expect(pin.emit).to.be.calledWith('error');
      });
    });

    context("if it is not passed an error", function() {
      it("emits the 'release' event", function() {
        pin._releaseCallback();
        expect(pin.emit).to.be.calledWith('release', pin.pinNum);
      });
    });
  });
});
