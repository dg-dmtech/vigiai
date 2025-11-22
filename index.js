require('dotenv').config()
const rtsp = require('rtsp-ffmpeg');
const uri = process.env.STREAM_URL || 'rtsp://admin:eletriseg34263426@192.168.15.10:546/cam/realmonitor?channel=1&subtype=0'
const stream = new rtsp.FFMpeg({ input: uri });

console.log('🔗 Conectando ao stream:', uri);

const detectPeople = require('./detectPeople');
const { startRecording, isRecording } = require('./videoRecorder');
const sendToAI = require('./sendToAI');


let lastDetection = 0;
const SAMPLE_INTERVAL = 500; // 1s entre verificações

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
      console.log('🧠 Descrição da IA:', descricao);
    }
  } catch (err) {
    console.error('Erro no processamento:', err);
  }
});