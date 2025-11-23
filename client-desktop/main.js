// main.js
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const express = require('express');
const ffmpegPath = require('ffmpeg-static');

let servers = new Map();

function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  });

  win.loadFile('index.html');
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });

ipcMain.handle('stop-stream', async (event, { id = 'default' }) => {
  const srv = servers.get(id);
  if (srv) {
    srv.server.close();
    srv.proc.kill('SIGKILL');
    servers.delete(id);
    console.log(`🛑 Stream encerrado: ${id}`);
  }
});

ipcMain.handle('start-stream', async (event, { rtspUrl, id = 'default', port = 31337 }) => {
  // encerra stream anterior se existir
  const prev = servers.get(id);
  if (prev) {
    prev.server.close();
    prev.proc.kill('SIGKILL');
    servers.delete(id);
  }

  console.log("🟢 start-stream chamado:", rtspUrl);

  const appExpress = express();

  appExpress.get(`/stream/${id}`, (req, res) => {
    res.writeHead(200, {
      'Content-Type': 'multipart/x-mixed-replace; boundary=frame',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      Connection: 'close'
    });

    console.log(`🎥 Iniciando ffmpeg para: ${rtspUrl}`);

    const args = [
      '-rtsp_transport', 'tcp',
      '-i', rtspUrl,
      '-f', 'mjpeg',
      '-q:v', '5',
      '-r', '15',
      '-'
    ];

    const proc = spawn(ffmpegPath, args, { stdio: ['ignore', 'pipe', 'inherit'] });
    proc.stdout.on('data', chunk => {
      res.write(`--frame\r\nContent-Type: image/jpeg\r\nContent-Length: ${chunk.length}\r\n\r\n`);
      res.write(chunk);
      res.write('\r\n');
    });


    req.on('close', () => {
      proc.kill('SIGKILL');
      console.log(`❌ Conexão encerrada: ${id}`);
    });

    servers.set(id, { server: serverInstance, proc });
  });

  const serverInstance = appExpress.listen(port, '127.0.0.1', () => {
    console.log(`📡 Servidor MJPEG ouvindo em http://127.0.0.1:${port}/stream/${id}`);
  });

  const streamUrl = `http://127.0.0.1:${port}/stream/${id}`;
  return { url: streamUrl };
});
