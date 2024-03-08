/**
 * This file will automatically be loaded by vite and run in the "renderer" context.
 * To learn more about the differences between the "main" and the "renderer" context in
 * Electron, visit:
 *
 * https://electronjs.org/docs/tutorial/application-architecture#main-and-renderer-processes
 *
 * By default, Node.js integration in this file is disabled. When enabling Node.js integration
 * in a renderer process, please be aware of potential security implications. You can read
 * more about security risks here:
 *
 * https://electronjs.org/docs/tutorial/security
 *
 * To enable Node.js integration in this file, open up `main.js` and enable the `nodeIntegration`
 * flag:
 *
 * ```
 *  // Create the browser window.
 *  mainWindow = new BrowserWindow({
 *    width: 800,
 *    height: 600,
 *    webPreferences: {
 *      nodeIntegration: true
 *    }
 *  });
 * ```
 */

import './index.css';

let selectPort = ""
let selectFqbn = ""

const list = document.getElementById('board-list');

window.setInterval(async () => {
    const result = await window.api.listBoard();
    if (result === null) {
        return;
    }

    console.debug(result);

    list.innerHTML = result.map(x => `
        <li>
            <input type="radio" id="${x.port}" ${selectPort === x.port ? "checked" : ""} name="option" fqbn=${x.fqbn} port="${x.port}">
            <label for="${x.name}">${x.name}</label>
        </li>
    `).join('');


}, 1000);

list.addEventListener('change', (event) => {
    if (event.target.name === 'option') {
        selectPort = event.target.getAttribute('port')
        selectFqbn = event.target.getAttribute('fqbn')
    }
});

const upload = document.getElementById('upload');

upload.addEventListener('click', async (event) => {
    console.log("selectPort", selectPort, "selectFqbn", selectFqbn);

    const cfg = document.getElementById('name').value || null;

    upload.hidden = true;
    const result = await window.api.uploadBinary(selectPort, selectFqbn, cfg);
    upload.hidden = false;

    console.debug("upload binary", result);
});
