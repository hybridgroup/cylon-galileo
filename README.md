# Cylon.js For cylon-galileo

Cylon.js (http://cylonjs.com) is a JavaScript framework for robotics and
physical computing using Node.js

This repository contains the Cylon adaptor for Intel's Galileo Board (http://www.intel.com/content/www/us/en/do-it-yourself/galileo-maker-quark-board.html)

Want to use Ruby on robots? Check out our sister project Artoo (http://artoo.io)

Want to use the Go programming language to power your robots? Check out our
sister project Gobot (http://gobot.io).

For more information about Cylon, check out our repo at
https://github.com/hybridgroup/cylon

## Getting Started

### Setting up the Galileo bigger Linux image, connecting and updating node.js.

Setting up Intel's Galileo board takes a bit of work, but luckily you
only have to do it once (we hope :-)... )

The first step is to install the bigger linux image into an SD card and
boot the Galileo from it, you can accomplish this by following the
instructions on the galileo getting started page here:

https://learn.sparkfun.com/tutorials/galileo-getting-started-guide/bigger-linux-image

Please feel free to read through the getting started page, so you can
get familiar with the board features.

Once we have the bigger linux image in the sd card, and the galileo booting up
from it, we need to connect and enable networking (turned off by default
in the Galieleo bigger linux image).

We can accomplish this by using a serialport to terminal program, you
can read more about it in the getting started page here:

https://learn.sparkfun.com/tutorials/galileo-getting-started-guide/using-the-terminal

When you have connected successfully to the Galileo run this command to
enable networking (make sure to connect the board to the network using
an ethernet cable first):

```bash
$ /etc/init.d/networking start
```

This will allow us to connect using SSH, substitute the ip address with
the one assigned to your Galileo:

```bash
$ ssh root@192.168.0.5
```

The final step of the setup is to update the node.js version included
in the galileo bigger linux image, you can download a more up to date
package from  here:

https://communities.intel.com/servlet/JiveServlet/download/221298-75632/nodejs_0.10.25-r0_i586.ipk.zip

Then we need to uncompress the file in the host computer:

```bash
$ unzip nodejs_0.10.25-r0_i586.ipk.zip
```

And copy the IPK package to the board, since the Galileo is already
connected to the network (and we have an active session open that we can use)
we can SCP the ipk package to update node.js to the galileo:

```bash
$ scp nodejs_0.10.25-r0_i586.ipk root@192.168.0.5:/home/root/
```

We then move to the Galileo terminal session and upgrade the installed node.js package
by running the following command:

```bash
opkg upgrade /tmp/nodejs_0.10.25-r0_i586.ipk
```

Let's confirm node.js version by running `node -v`

```bash
$ node -v
v0.10.25
```

Nice! We are good to go! With this we are pretty much setup
to use Cylon.js in the Galileo.

More details regarding updating node.js can be found here:
https://communities.intel.com/thread/48416

Install the module with: `npm install cylon-galileo`


## How to push code to your Galileo

The Galileo is a special case (compared to Beaglebone black and
Raspberry Pi) since it lacks dev tools in the biggel Linux image,
so at this time we do not have a different distribution to run in
the sd card that does contain dev tools, so we'll have to make it
work with what we have.

You'll need to write your code and install npm modules on your
computer, at very least setup your project folder and install NPM
modules, all of this using the 32bit version of both node.js and
NPM modules.

First we need to download the 32bit version of Node.js:

http://nodejs.org/dist/v0.10.26/node-v0.10.26-linux-x86.tar.gz

You'll need to uncompress and run node and npm from that directory, I
recommend creating links to the bin/node and bin/npm files in your home
folder, that way you can easily install npm libraries using the 32bit
version (needed by Galileo) and maintain your current global node
instalation without messing with your path.

```bash
$ ln  ~/node-v0.10.26-linux-x86/bin/node ~/nodex86
$ ln  ~/node-v0.10.26-linux-x86/bin/npm ~/npmx86
```

Now, how to actually push code and run it in the Galileo, let's say
we have a project folder called `galileo-blink`, we change directory into
the project folder, then we can either write our code there, in this case
blink.js, or setup the project folder with all nedded NPM modules and
work directly in the galileo board, of course all of this using the 32bit
version of node.js we just installed:

```bash
$ cd galileo-blink
$ ~/npmx86 install cylon
$ ~/npmx86 install cylon-galileo
$ ~/npmx86 install cylon-gpio
```

This will create the `./node_modules/` folder in our project containing
all the necessary modules that will run in the Galileo, so from here we
can either work on our project and push the code later just for testing
in the galileo, or push the modules and work directly in the Galileo,
let's do the latter since makes development easier and quicker than
having to push everytime we do a small change:


```bash
# From our project root folder run
$ cd ../
$ tar -cf galileo-blink.tar ./galileo-blink
$ scp galileo-blink.tar root@192.168.0.5:/home/root/
```

Once the project package finishes copying we go to our galileo session,
and in the terminal we run the following:

```bash
$ cd ~
$ tar -xf galileo-blink.tar
$ cd galileo-blink
$ vi blink.js
```

We now have our environment ready to run the examples in the galileo,
just copy paste the blink example (found in the examples section below),
save it and run it.

```bash
# From project root folder
$ node blink.js
```

## Examples

### JavaScript

```javascript
var Cylon = require('cylon');

Cylon.robot({
  connection: { name: 'galileo', adaptor: 'galileo' },
  device: { name: 'led', driver: 'led', pin: '13' },

  work: function(my) {
    every((1).second(), my.led.toggle);
  }
}).start();
```

```javascript
var Cylon = require('cylon');

Cylon.robot({
  connection: { name: 'galileo', adaptor: 'galileo' },
  device: { name: 'led', driver: 'led', pin: '9' },

  work: function(my) {
    var brightness = 0,
        fade = 5;

    every(0.05.seconds(), function() {
      brightness += fade;
      my.led.brightness(brightness);
      if ((brightness === 0) || (brightness === 255)) { fade = -fade; }
    });
  }
}).start();
```

```javascript
var Cylon = require('cylon');

Cylon.robot({
  connection: { name: 'galileo', adaptor: 'galileo' },
  device: { name: 'servo', driver: 'servo', pin: '9' },

  work: function(my) {
    // Be carefull with your servo angles or you might DAMAGE the servo!
    // Cylon uses a 50hz/s (20ms period) frequency and a Duty Cycle
    // of 0.5ms to 2.5ms to control the servo angle movement.
    //
    // This means:
    // 1. 0.5ms == 0 degrees
    // 2. 1.5ms == 90 degrees
    // 3. 2.5ms == 180 degrees
    // (It is usually safe to start with a 90 degree angle, 1.5ms duty
    // cycle in most servos)
    //
    // Please review your servo datasheet to make sure of correct
    // angle range and the Freq/MS Duty cycle it requires.
    // If more servo support is needed leave us a comment, raise an
    // issue or help us add more support.

    var angle = 30;
    var increment = 40;

    every((1).seconds(), function() {
      angle += increment;
      my.servo.angle(angle);
      console.log("Current Angle: " + my.servo.currentAngle());

      if ((angle === 30) || (angle === 150)) { increment = -increment; }
    });
  }
}).start();
```  
## Contributing

* All patches must be provided under the Apache 2.0 License
* Please use the -s option in git to "sign off" that the commit is your work and you are providing it under the Apache 2.0 License
* Submit a Github Pull Request to the appropriate branch and ideally discuss the changes with us in IRC.
* We will look at the patch, test it out, and give you feedback.
* Avoid doing minor whitespace changes, renamings, etc. along with merged content. These will be done by the maintainers from time to time but they can complicate merges and should be done seperately.
* Take care to maintain the existing coding style.
* Add unit tests for any new or changed functionality & lint and test your code using `make test` and `make lint`.
* All pull requests should be "fast forward"
  * If there are commits after yours use “git rebase -i <new_head_branch>”
  * If you have local changes you may need to use “git stash”
  * For git help see [progit](http://git-scm.com/book) which is an awesome (and free) book on git

## Release History

Version 0.1.0 - Initial release for ongoing development

## License

Copyright (c) 2013-2014 The Hybrid Group. Licensed under the Apache 2.0 license.
