var Cylon = require('cylon');

Cylon.robot({
  connection: { name: 'galileo', adaptor: 'galileo' },
  device: {name: 'led', driver: 'led', pin: '7'},

  work: function(my) {
    every((1).second(), function() {
    	console.log("blink");
      my.led.toggle();
    });
  }
});

Cylon.start();
