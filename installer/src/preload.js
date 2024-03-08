// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts


const { contextBridge, ipcRenderer } = require('electron/renderer')

contextBridge.exposeInMainWorld('api', {
    listBoard: async () => await ipcRenderer.invoke('list-board'),
    uploadBinary: async (port, fqbn) => await ipcRenderer.invoke('upload-binary', { port, fqbn })
})
