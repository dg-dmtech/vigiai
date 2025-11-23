// main/streamServer.js
const { spawn } = require('child_process');
const http = require('http');
const url = require('url');

const servers = new Map();

async function startStream({ id, rtspUrl, port = 31337 }) {
  if (servers.has(id)) {
    return { url: `http://127.0.0.1:${port}/stream/${id}` };
  }

  const server = http.createServer((req, res) => {
    const parsed = url.parse(req.url, true);
    if (!parsed.pathname.startsWith(`/stream/${id}`)) {
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
    req.on('close', () => { try { proc.kill('SIGKILL'); } catch {} });
  });

  await new Promise((resolve, reject) => {
    server.listen(port, '127.0.0.1', err => err ? reject(err) : resolve());
  });

  servers.set(id, { server });
  return { url: `http://127.0.0.1:${port}/stream/${id}` };
}

async function stopStream({ id }) {
  const s = servers.get(id);
  if (!s) return { ok: false };
  try { s.server.close(); } catch {}
  servers.delete(id);
  return { ok: true };
}

module.exports = { startStream, stopStream };
