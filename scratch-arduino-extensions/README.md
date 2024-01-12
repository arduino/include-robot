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
git clone https://github.com/scratchfoundation/scratch-gui.git
```

2. Install all dependency 

```
cd scatch-gui
npm install
```

3. Run the patch/link script

```
node ./scripts/patch-gui.js
```

4. Start the scratch gui
```
cd ../scratch-gui

npm start
```
