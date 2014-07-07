"use strict";

var EventEmitter = require('events').EventEmitter;

var Cylon = require('cylon');

var Galileo = source("galileo");

var PwmPin = source('pwm-pin'),
    AnalogPin = source('analog-pin');

describe("Galileo", function() {
  var adaptor;

  beforeEach(function() {
    adaptor = new Galileo({ extraParams: {} });
  });

  it("subclasses Cylon.Adaptor", function() {
    expect(adaptor).to.be.an.instanceOf(Cylon.Adaptor);
    expect(adaptor).to.be.an.instanceOf(Galileo);
  });

  describe("constructor", function() {
    it('sets @pins to an empty object by default', function() {
      expect(adaptor.pins).to.be.eql({});
    });

    it('sets @pwmPins to an empty object by default', function() {
      expect(adaptor.pwmPins).to.be.eql({});
    });

    it('sets @analogPins to an empty object by default', function() {
      expect(adaptor.analogPins).to.be.eql({});
    });

    it('sets @i2cDevices to an empty object by default', function() {
      expect(adaptor.i2cDevices).to.be.eql({});
    });

    it("sets @interval to 10ms by default", function() {
      expect(adaptor.interval).to.be.eql(10);
    });

    it("sets @interval to the provided interval", function() {
      adaptor = new Galileo({ extraParams: { interval: 1 } });
      expect(adaptor.interval).to.be.eql(1000);
    });
  });

  describe("#commands", function() {
    it("is an array of Galileo commands", function() {
      var commands = adaptor.commands;

      expect(commands).to.be.an('array');

      commands.forEach(function(command) {
        expect(command).to.be.a('string');
      });
    })
  });

  describe("#disconnect", function() {
    beforeEach(function() {
      adaptor._noop = spy();
      adaptor._disconnectPins = spy();
      adaptor.disconnect(function() {});
    });

    it("no-ops all the commands", function() {
      expect(adaptor._noop).to.be.called;
      expect(adaptor._disconnectPins).to.be.called;
    });
  });

  describe("#firmwareName", function() {
    it("returns 'Galileo'", function() {
      expect(adaptor.firmwareName()).to.be.eql('Galileo');
    })
  });

  describe("#analogRead", function() {
    beforeEach(function() {
      adaptor._analogPin = stub();
    });

    context("if the pin already eixsts", function() {
      var mockPin;

      beforeEach(function() {
        mockPin = { connect: spy(), on: spy() };
        adaptor.analogPins["1"] = mockPin;
      });

      it('does not try to connect it', function() {
        adaptor.analogRead(1);
        expect(mockPin.connect).to.not.be.called;
      });
    });

    context("if the pin has not been created", function() {
      var mockPin, callback;

      beforeEach(function() {
        callback = spy();

        mockPin = new EventEmitter();
        mockPin.connect = spy();
        mockPin.analogRead = spy();

        adaptor._analogPin.returns(mockPin)
        adaptor.analogRead(1, callback);
      });

      it("creates a pin", function() {
        expect(adaptor._analogPin).to.be.calledWith("1");
      });

      it("tells the pin to connect", function() {
        expect(mockPin.connect).to.be.called;
      });

      context("when the pin is connected", function() {
        beforeEach(function() {
          mockPin.emit('connect');
        });

        it("tells the pin to #analogRead", function() {
          expect(mockPin.analogRead).to.be.calledWith(adaptor.interval);
        });
      });

      context("when the pin emits an analogRead value", function() {
        beforeEach(function() {
          adaptor.connection = { emit: spy() };
          mockPin.emit('connect');
          mockPin.emit('analogRead', 'data');
        });

        it("emits the 'analogRead' event with the data", function() {
          expect(adaptor.connection.emit).to.be.calledWith('analogRead', 'data');
        });

        it("triggers the callback with the data", function() {
          expect(callback).to.be.calledWith('data');
        });
      })
    });
  });

  describe("#digitalRead", function() {
    beforeEach(function() {
      adaptor._digitalPin = stub();
    });

    context("if the pin already eixsts", function() {
      var mockPin;

      beforeEach(function() {
        mockPin = { connect: spy(), on: spy() };
        adaptor.pins["51"] = mockPin;
      });

      it('does not try to connect it', function() {
        adaptor.digitalRead(1);
        expect(mockPin.connect).to.not.be.called;
      });
    });

    context("if the pin has not been created", function() {
      var mockPin, callback;

      beforeEach(function() {
        callback = spy();

        mockPin = new EventEmitter();
        mockPin.connect = spy();
        mockPin.digitalRead = spy();

        adaptor._digitalPin.returns(mockPin)
        adaptor.digitalRead(1, callback);
      });

      it("creates a pin", function() {
        expect(adaptor._digitalPin).to.be.calledWith(1, "r");
      });

      it("tells the pin to connect", function() {
        expect(mockPin.connect).to.be.called;
      });

      context("when the pin is connected", function() {
        beforeEach(function() {
          mockPin.emit('connect');
        });

        it("tells the pin to #digitalRead", function() {
          expect(mockPin.digitalRead).to.be.calledWith(adaptor.interval);
        });
      });

      context("when the pin emits an digitalRead value", function() {
        beforeEach(function() {
          adaptor.connection = { emit: spy() };
          mockPin.emit('connect');
          mockPin.emit('digitalRead', 'data');
        });

        it("emits the 'digitalRead' event with the data", function() {
          expect(adaptor.connection.emit).to.be.calledWith('digitalRead', 'data');
        });

        it("triggers the callback with the data", function() {
          expect(callback).to.be.calledWith('data');
        });
      })
    });
  });

  describe("#digitalWrite", function() {
    beforeEach(function() {
      adaptor._digitalPin = stub();
    });

    context("if the pin already exists", function() {
      var mockPin;

      beforeEach(function() {
        mockPin = { digitalWrite: spy() };
        adaptor.pins["51"] = mockPin;
        adaptor.digitalWrite(1, "data");
      });

      it("tells the pin to write the value", function() {
        expect(mockPin.digitalWrite).to.be.calledWith("data");
      });
    });

    context("if the pin doesn't exist", function() {
      var mockPin;

      beforeEach(function() {
        mockPin = new EventEmitter();
        mockPin.connect = spy();
        mockPin.digitalWrite = spy();

        adaptor.connection = { emit: spy() };

        adaptor._digitalPin.returns(mockPin);
        adaptor.digitalWrite(1, "data")
      });

      it("creates a pin", function() {
        expect(adaptor._digitalPin).to.be.calledWith(1, "w")
      });

      it("connects the pin", function() {
        expect(mockPin.connect).to.be.called;
      });

      context("when the pin is connected", function() {
        beforeEach(function() {
          mockPin.emit('connect');
        });

        it("tells the pin to write the value", function() {
          expect(mockPin.digitalWrite).to.be.calledWith("data");
        });
      });

      context("when the pin has written the value", function() {
        beforeEach(function() {
          mockPin.emit('digitalWrite', "value");
        });

        it("emits the 'digitalWrite' event, with the written value", function() {
          expect(adaptor.connection.emit).to.be.calledWith("digitalWrite", "value");
        });
      });
    });
  });

  describe("#_pwmWrite", function() {
    var mockPin;

    beforeEach(function() {
      mockPin = new EventEmitter();
      mockPin.connect = spy();
      mockPin.pwmWrite = spy();
      mockPin.connected = false;

      adaptor._pwmPin = stub().returns(mockPin);
    });

    it("looks up or creates a new PWM pin", function() {
      adaptor._pwmWrite(2, 10, 20, 30, 'pwm');
      expect(adaptor._pwmPin).to.be.calledWith(2, 10);
    });

    context("if the pin is connected", function() {
      beforeEach(function() {
        mockPin.connected = true;
        adaptor._pwmWrite(2, 10, 20, 30, 'pwm');
      });

      it("writes the duty cycle to the pin", function() {
        expect(mockPin.pwmWrite).to.be.calledWith(20);
      });
    });

    context("if the pin is not connected", function() {
      beforeEach(function() {
        adaptor._pwmWrite(2, 10, 20, 30, 'pwm');
      });

      it("connects the pin", function() {
        expect(mockPin.connect).to.be.called;
      });

      context("when the pin is connected", function() {
        beforeEach(function() {
          adaptor.connection = { emit: spy() };
          mockPin.emit('connect');
        });

        it("emits the 'connect' event", function() {
          expect(adaptor.connection.emit).to.be.calledWith('pwmConnect');
        });

        it("writes the duty cycle to the pin", function() {
          expect(mockPin.pwmWrite).to.be.calledWith(20);
        });
      });

      context("when the pin is written", function() {
        beforeEach(function() {
          adaptor.connection = { emit: spy() };
          mockPin.emit('pwmWrite');
        });

        it("emits the 'write' event", function() {
          expect(adaptor.connection.emit).to.be.calledWith('pwmWrite');
        });
      });
    })
  });

  describe("#pwmWrite", function() {
    var mockPwm;

    beforeEach(function() {
      mockPwm = { period: 'period', duty: 'duty' };

      stub(Cylon.IO.Utils, 'periodAndDuty').returns(mockPwm);
      adaptor._pwmWrite = spy();

      adaptor.pwmWrite(2, 100, 1000, 101, 'event');
    });

    afterEach(function() {
      Cylon.IO.Utils.periodAndDuty.restore();
    });

    it("uses Cylon.IO.Utils to calculate the period and duty", function() {
      expect(Cylon.IO.Utils.periodAndDuty).to.be.calledWith(100, 1000, 101, 'high');
    });

    it("calls #_pwmWrite with the calculated values", function() {
      expect(adaptor._pwmWrite).to.be.calledWith(2, 'period', 'duty', 'event');
    })

    context("if no event name is provided", function() {
      beforeEach(function() {
        adaptor.pwmWrite(2, 100, 1000, 101);
      });

      it("defaults to 'pwm'", function() {
        expect(adaptor._pwmWrite).to.be.calledWith(2, 'period', 'duty', 'pwm');
      });
    });

    context("if no frequency is provided", function() {
      beforeEach(function() {
        adaptor.pwmWrite(2, 100, null, 101);
      });

      it("defaults to 2000", function() {
        expect(Cylon.IO.Utils.periodAndDuty).to.be.calledWith(100, 2000, 101, 'high');
      });
    });
  });

  describe("#servoWrite", function() {
    it("needs tests");
  });

  describe("#_pwmPin", function() {
    it("needs tests");
  });

  describe("#_digitalPin", function() {
    it("needs tests");
  });

  describe("#_analogPin", function() {
    it("needs tests");
  });

  describe("#_translatePin", function() {
    it("needs tests");
  });

  describe("#_translatePwmPin", function() {
    it("needs tests");
  });

  describe("#_disconnectPins", function() {
    it("needs tests");
  });
});
