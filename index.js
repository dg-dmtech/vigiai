require('dotenv').config()
const rtsp = require('rtsp-ffmpeg');
const uri = process.env.STREAM_URL || 'rtsp://admin:eletriseg34263426@192.168.15.10:546/cam/realmonitor?channel=1&subtype=0'
const stream = new rtsp.FFMpeg({ input: uri });
const path = require("path");
console.log('🔗 Conectando ao stream:', uri);

const detectPeople = require('./detectPeople');
const { startRecording, isRecording } = require('./videoRecorder');
const sendToAI = require('./sendToAI');


let lastDetection = 0;
const SAMPLE_INTERVAL = 500; // 1s entre verificações
const outputDir = path.join(__dirname, "debug/analises.txt");
stream.on('data', async (frame) => {
  const now = Date.now();
  if (now - lastDetection < SAMPLE_INTERVAL) return;
  lastDetection = now;

  try {
    const result = await detectPeople(frame);
    if (result.has_people && !isRecording()) {
      console.log('🚨 Pessoa detectada! Iniciando gravação...');
      const videoPath = await startRecording(uri);
      console.log('🎥 Vídeo salvo em:', videoPath);

      const descricao = await sendToAI(videoPath);

    fs.appendFileSync(
      outputDir,
      `\n\nVideo: ${videoPath}\nDescrição da IA:\n${descricao}\n`,
      "utf8"
    );

    }
  } catch (err) {
    console.error('Erro no processamento:', err);
  }
});