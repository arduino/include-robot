# Scratch3-Arduino-Extensions

TBD


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
```

4. Start the scratch gui
```
npm start
```

5. Open the scratch GUI at `http://127.0.0.1:8601`
