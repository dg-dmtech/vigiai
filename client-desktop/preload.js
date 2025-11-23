// preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('cameraApi', {
  startStream: (data) => ipcRenderer.invoke('start-stream', data)
});
