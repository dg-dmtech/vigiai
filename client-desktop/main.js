// main.js
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');
const url = require('url');

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

ipcMain.handle('start-stream', async (event, { rtspUrl, id = 'default', port = 31337 }) => {
  const server = http.createServer((req, res) => {
    const parsed = url.parse(req.url, true);
    if (parsed.pathname !== `/stream/${id}`) {
      res.writeHead(404);
      return res.end('not found');
    }

    const args = [
      '-rtsp_transport', 'tcp',
      '-i', rtspUrl,
      '-f', 'mjpeg',
      '-q', '5',
      '-r', '15',
      '-'
    ];

    const proc = spawn('ffmpeg', args, { stdio: ['ignore', 'pipe', 'inherit'] });

    res.writeHead(200, {
      'Content-Type': 'multipart/x-mixed-replace; boundary=ffserver',
      'Cache-Control': 'no-cache',
      Connection: 'close'
    });

    proc.stdout.pipe(res);

    req.on('close', () => proc.kill('SIGKILL'));
  });

  await new Promise((resolve, reject) => {
    server.listen(port, '127.0.0.1', err => (err ? reject(err) : resolve()));
  });

  const streamUrl = `http://127.0.0.1:${port}/stream/${id}`;
  console.log(`📡 Streaming iniciado em: ${streamUrl}`);
  return { url: streamUrl };
});
