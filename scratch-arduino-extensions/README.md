# Scratch3-Arduino-Extensions

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

1. Clone the scratch-gui folder in the top folder

```
cd ..
git clone --depth 1 https://github.com/scratchfoundation/scratch-gui.git
```

2. Install all dependency 

```
cd scratch-gui
npm install
```

3. Run the patch/link script

```
node ../scratch-arduino-extensions/scripts/patch-gui.js
node ../scratch-arduino-extensions/scripts/add-banner.js # (optional)
```

4. Start the scratch gui
```
npm start
```

5. Open the scratch GUI at `http://127.0.0.1:8601`
