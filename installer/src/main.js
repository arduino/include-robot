const { app, BrowserWindow } = require('electron');
const path = require('path');
const { ipcMain } = require('electron');
const util = require('node:util');
const exec = util.promisify(require('node:child_process').exec);

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}


const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});


ipcMain.handle('list-board', async (event, arg) => {
  return await listBoards([BLE_FQBN]);
});

const BINARY = './assets/BLE_Scratch.ino.bin';

ipcMain.handle('upload-binary', async (event, arg) => {
  console.log(arg)
  const out = await uploadBinary(arg.port, arg.fqbn, BINARY);
  console.debug("upload done", out);
  return;
});

const BLE_FQBN = 'arduino:mbed_nano:nano33ble';

async function listBoards(fqbn_list) {
  try {
    const { stdout, stderr } = await exec('arduino-cli --format=json board list', { encoding: 'utf8' });
    const boardList = JSON.parse(stdout);

    const boards = boardList.filter(row => row['matching_boards']?.find(o => fqbn_list.includes(o['fqbn'])));

    return boards.map(board => ({
      name: board['matching_boards'][0]["name"],
      fqbn: board['matching_boards'][0]["fqbn"],
      port: board['port']["address"],
    }))
  } catch (err) {
    console.error("error", err);
  }
}

async function uploadBinary(port, fqbn, binary) {
  try {
    const { stdout, stderr } = await exec(`arduino-cli upload -v -i "${binary}" -b ${fqbn} -p "${port}"`);
    return stdout.toString();
  } catch (error) {
    console.error('An error occurred:', error);
  }
}
