# Cylon.js For cylon-galileo

Cylon.js (http://cylonjs.com) is a JavaScript framework for robotics and
physical computing using Node.js

This repository contains the Cylon adaptor for Intel's Galileo Board (http://www.intel.com/content/www/us/en/do-it-yourself/galileo-maker-quark-board.html)

Want to use Ruby on robots? Check out our sister project Artoo (http://artoo.io)

Want to use the Go programming language to power your robots? Check out our
sister project Gobot (http://gobot.io).

For more information about Cylon, check out our repo at
https://github.com/hybridgroup/cylon

## How To Connect

### Setting up Galileo Linux Image

Setting up the Galileo GEN 2 board for Cylon.js has quite a few steps, but it's not terribly difficult. Luckily, you only have to do it once.

The first step is to ensure we have the latest version of the firmware, and update if not.
You can find instructions to update the firmware [here](https://communities.intel.com/docs/DOC-22872).

Next, we're going to install the "larger" Linux image for the Galileo on a MicroSD card, and boot the Galileo from it.

You can find the larger image on the official Galileo [drivers page](https://communities.intel.com/docs/DOC-22226).
You're looking for the one named [LINUX IMAGE FOR SD for Intel Galileo](http://downloadmirror.intel.com/24000/eng/LINUX_IMAGE_FOR_SD_Intel_Galileo_v1.0.2.zip).

Once you have the larger image on the SD card, you are ready to boot the Galileo from it. Power off the Galileo both from the power adaptor, as well as removing the USB cable. Insert the SD card it into the Galileo, and power it back up. The board should automatically boot from the SD card's Linux image. The first time you boot, it will probably take a lot longer.

After it's started up, we need to connect and enable networking (turned off by default in the image).

We can accomplish this using a serialport to terminal program.
To do this, we have to use the special version of the Arduino IDE that comes with the Galileo. You have probably already installed it, if you've followed the "Getting Started" instructions on the Intel web site.
Just in case you need it, [here](https://communities.intel.com/docs/DOC-22226) is a direct link to the downloads page that has the Arduino IDE for Galileo.

Make sure to download the correct version for your OS.

After you've got that running, upload this sketch to your Galileo:

```cpp
void setup()
{
  system("cp /etc/inittab /etc/inittab.bak");  // Back up inittab
  // Replace all "S:2345" with "S0:2345"'s (switching serial ports):
  system("sed -i 's/S:2345/S0:2345/g' /etc/inittab");
  // Replace all "ttyS1" with "ttyGS0"'s (switching serial ports):
  system("sed -i 's/ttyS1/ttyGS0/g' /etc/inittab");
  // Replace all "grst" with "#grst"'s to comment that line out:
  system("sed -i 's/grst/#grst/g' /etc/inittab");
  // Replace all "clld" with "#clld"'s to comment that line out:
  system("sed -i 's/clld/#clld/g' /etc/inittab");
  system("kill -SIGHUP 1");
}

void loop()
{

}
```

Once the board's connected to your computer, you can connect to it with a serial terminal program.
Some terminal programs:

- [Tera Term](https://learn.sparkfun.com/tutorials/terminal-basics/tera-term-windows) for Windows
- [Cool Term](https://learn.sparkfun.com/tutorials/terminal-basics/coolterm-windows-mac-linux) for OS X
- [GTKTerm](https://apps.ubuntu.com/cat/applications/oneiric/gtkterm/) for Linux

Set the serial port number, and change the baud rate to 115200 bps.

PLEASE NOTE: you must connect an Ethernet cable to the Galileo in order to connect to it via SSH. Connecting via the USB cable is only for uploading to the Arduino part of the board. Connecting via the serial TTY interface cannot be used for SSH connections. A USB to Ethernet adapter is very useful to connect directly from your computer to the Galileo.

When you have a successful connection to the Galileo, run this command to enable networking:

    $ /etc/init.d/networking start

This will allow us to SSH into the board.
Substitute the IP address for that of your Galileo and connect:

    $ ssh root@192.168.0.5


The last bit of setup is to update the version of Node, since the one included with the Linux image is the older 0.8 verison.
You can download a more up-to-date version [here](https://communities.intel.com/servlet/JiveServlet/download/221298-75632/nodejs_0.10.25-r0_i586.ipk.zip).

Uncompress the file on your host computer, and copy the package to the board:

    $ unzip nodejs_0.10.25-r0_i586.ipk.zip
    $ scp nodejs_0.10.25-r0_i586.ipk root@192.168.0.5:/home/root/

Then, on the Galileo, install the package with the `opkg` command:

    root@clanton:~# opkg install nodejs_0.10.25-r0_i586.ipk

With that done, make sure the update worked:

    root@clanton:~# node -v
    v0.10.25

If you need more details on updating Node in the Galileo image, they can be found [here](https://communities.intel.com/thread/48416).

You need to set the system date/time on the Galileo to install npm modules, due to using SSL. You can do this by running `date` using the format `mmddhhmmYY`. For example, to set the date to Sept. 2, 2014, at 3:01 PM GMT:

    root@clanton:~# date 0902150114 

With that done, we can now install the `cylon-galileo` module to the board:

    root@clanton:~# npm install cylon-galileo

Sparkfun's Galileo [getting started page](https://learn.sparkfun.com/tutorials/galileo-getting-started-guide) has a lot of good info about the board.
Even though it refers to the revision 1 board, it can still help you get better acquainted with the features of the Galileo.

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

Version 0.3.0 - Compatibility with Cylon 0.18.0

Version 0.2.0 - Compatibility with Cylon 0.16.0

Version 0.1.0 - Initial release for ongoing development

## License

Copyright (c) 2013-2014 The Hybrid Group. Licensed under the Apache 2.0 license.
