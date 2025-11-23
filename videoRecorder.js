const ffmpeg = require('fluent-ffmpeg');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
const path = require('path');
const fs = require('fs');

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

let recording = false;

function isRecording() {
  return recording;
}

function startRecording(uri) {
  return new Promise((resolve, reject) => {
    const filename = `video_${Date.now()}.mp4`;
    const filepath = path.join(process.env.RECORDING_DIR, filename);
    if (!fs.existsSync(path.dirname(filepath))) fs.mkdirSync(path.dirname(filepath));

    recording = true;
    ffmpeg(uri)
      .inputOptions('-rtsp_transport', 'tcp')
      .duration(process.env.RECORD_DURATION || 10)
      .output(filepath)
      .on('end', () => {
        recording = false;
        resolve(filepath);
      })
      .on('error', (err) => {
        recording = false;
        reject(err);
      })
      .run();
  });
}

module.exports = { startRecording, isRecording };