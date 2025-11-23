require("dotenv").config();
const rtsp = require("rtsp-ffmpeg");
const detectPeople = require("./detectPeople");
const { startRecording, isRecording } = require("./videoRecorder");
const sendToAI = require("./sendToAI");
const DetectionEvent = require("./models/DetectionEvent");
const Camera = require("./models/Camera");
const { connectDB } = require("./db/mongo");
const sentWhatsAppMessage = require("./sentWhatsAppMessage");

const SAMPLE_INTERVAL = process.env.SAMPLE_INTERVAL; 
const lastDetections = {};

function monitorCamera(cam) {
  console.log(`📡 Iniciando monitoramento: ${cam.name}`);
  const stream = new rtsp.FFMpeg({ input: cam.url });

  stream.on("data", async (frame) => {
    const now = Date.now();
    if (lastDetections[cam.name] && now - lastDetections[cam.name] < SAMPLE_INTERVAL) return;
    lastDetections[cam.name] = now;

    try {
      const result = await detectPeople(frame);

      if (result.has_people && !isRecording(cam.name)) {
        console.log(`🚨 [${cam.name}] Pessoa detectada! Iniciando gravação...`);
        const videoPath = await startRecording(cam.url, cam.name);
        console.log(`🎥 [${cam.name}] Vídeo salvo em: ${videoPath}`);

        const iaResponse = await sendToAI(videoPath, cam);
        const event = await DetectionEvent.create({
          camera: cam.name,
          videoPath,
          description: iaResponse.description,
          suspect: iaResponse.suspect,
          cocoSsdPeopleCount: result.peopleCount || 1,
          gptPeopleCount: iaResponse.peopleCount || 0,
          confidence: result.people?.[0]?.confidence || null
        })
        await sentWhatsAppMessage(event._id, cam, iaResponse);
      }
    } catch (err) {
      console.error(`❌ Erro no processamento da câmera ${cam.name}:`, err.message);
    }
  });

  return stream
}

const activeStreams = new Map();

async function reloadCameras() {
  const cameras = await Camera.find();
  for (const cam of cameras) {
    if (!activeStreams.has(cam._id.toString())) {
      console.log(`🆕 Nova câmera detectada: ${cam.name}`);
      const stream = monitorCamera(cam);
      activeStreams.set(cam._id.toString(), stream);
    }
  }

  // Verifica se alguma câmera foi desativada
  for (const [id, stream] of activeStreams) {
    const stillActive = cameras.some(c => c._id.toString() === id);
    if (!stillActive) {
      console.log(`🛑 Câmera desativada, encerrando stream...`);
      stream.stop(); // precisa expor stop() no monitorCamera
      activeStreams.delete(id);
    }
  }
}

// Verifica novas câmeras a cada 60 segundos
setInterval(reloadCameras, process.env.RELOAD_CAM_INTERVAL || 60000);

(async () => {
  await connectDB();
  const cameras = await Camera.find({ isActive: true });
  console.log(`📷 ${cameras.length} câmeras encontradas.`);
  for (const cam of cameras) {
    monitorCamera(cam);
  }
})();