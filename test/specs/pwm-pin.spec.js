'use strict';

var fs = require('fs'),
    Cylon = require('cylon'),
    EventEmitter = require('events').EventEmitter;

var PwmPin = source('pwm-pin');

describe("PwmPin", function() {
  var pin;

  beforeEach(function() {
    pin = new PwmPin({});
  });

  it("subclasses EventEmitter", function() {
    expect(pin).to.be.an.instanceOf(EventEmitter);
    expect(pin).to.be.an.instanceOf(PwmPin);
  });

  describe("constructor", function() {
    it("needs tests");
  });

  describe("#connect", function() {
    it("needs tests");
  });

  describe("#disconnect", function() {
    it("needs tests");
  });

  describe("#disconnectSync", function() {
    it("needs tests")
  });

  describe("#_createPWMPin", function() {
    it("needs tests")
  });

  describe("#_enablePin", function() {
    it("needs tests")
  });

  describe("#pwmWrite", function() {
    it("needs tests")
  });

  describe("#_findFile", function() {
    it("needs tests")
  });

  describe("#_pinDir", function() {
    it("needs tests")
  });

  describe("#_exportPath", function() {
    it("needs tests")
  });

  describe("#_unexportPath", function() {
    it("needs tests")
  });

  describe("#_enablePath", function() {
    it("needs tests")
  });

  describe("#_periodPath", function() {
    it("needs tests")
  });

  describe("#_dutyPath", function() {
    it("needs tests")
  });

  describe("#_releaseCallback", function() {
    it("needs tests")
  });
});
