# include-robot

Experimental software and hardware project by Arduino

Instructions:

1. Read [required parts](doc/parts.md) 
2. Execute 3D printing of the robot shell - coming soon
3. Mount the robot following [mounting instructions](doc/mounting.md)
4. Upload base firmware on the robot using [Arduino IDE](https://arduino.cc/software) (sketches can be found in the /sketches folder of this repo) 
5. Open [Arduino lab for Scratch](https://labs-scratch.arduino.cc) and program your robot
6. Have fun!


## Development

### How to install Scratch locally with Arduino extensions

If you want to install and launch Scratch on your local machine for development purposes you need to 
follow the instructions in [scratch-arduino-extensions](./scratch-arduino-extensions/README.md) folder.

#### How to install Scratch3-Arduino-Extensions

Scratch is a free programming platform where you can create your own interactive stories, games, and animations.

If you want to connect to an Arduino board via Bluetooth Low Energy (BLE) you need to install a couple of
Arduino specific extensions.

Then you need to install Scratch link (https://scratch.mit.edu/download/scratch-link) which allows you to
connect your Scratch project to a BLE device.

## TODO:

- [ ] Add the extensions in the extension menu
- [ ] Auto reload doesn't work in linux
- [ ] Create a deployment script/ci job

## Development guide

- To clone and install the scratch-gui repository (it also applies the patches)
```
make
```

- To apply the patches

```
make scratch-gui:patch
```

- To start the local server at `http://127.0.0.1:8601`

```
make scratch-gui:start
```

- To remove and clean the scratch-gui directory

```
make scratch-gui:clean
```


### Notes about patch scripts

1. the `patch-gui.js` script copies a custom Arduino extension in the extensions folder and modifies the code of
   Scratch's extension manager to include that extension

2. the `add-banner.js` script copies a new React component in the `scratch-gui` folder and modifies the `gui.jsx` file
   to include that component


