// detectPeople.js
const tf = require("@tensorflow/tfjs-node");
const cocoSsd = require("@tensorflow-models/coco-ssd");
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

// ========================
// CONFIG
// ========================
const CONF_THRESHOLD = process.env.COCO_SSD_THRESHOLD || 0.35;
let model = null;

// ========================
// DEBUG PATHS
// ========================
const debugRoot = path.join(process.env.RECORDING_DIR);
const debugFrames = path.join(debugRoot, "frames");
const debugLogs = path.join(debugRoot, "logs");
const debugAnnotated = path.join(debugRoot, "annotated");
[debugRoot, debugFrames, debugLogs, debugAnnotated].forEach((p) => {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
});

// ========================
// LOAD MODEL
// ========================

loadModel()
async function loadModel() {
  if (!model) {
    console.log("📦 Carregando modelo COCO-SSD...");
    model = await cocoSsd.load();
    console.log("✅ Modelo carregado com sucesso.");
  }
  return model;
}

// ========================
// DRAW BOXES
// ========================
async function drawDetections(frameBuffer, detections, outPath) {
  const meta = await sharp(frameBuffer).metadata();
  const svg = Buffer.from(`
  <svg width="${meta.width}" height="${meta.height}">
    ${detections
      .map(
        (d) => `
      <rect x="${d.bbox[0]}" y="${d.bbox[1]}" width="${d.bbox[2]}" height="${d.bbox[3]}"
        fill="none" stroke="red" stroke-width="3"/>
      <text x="${d.bbox[0]}" y="${Math.max(20, d.bbox[1] - 5)}" fill="red" font-size="26">
        ${d.class} ${(d.score * 100).toFixed(1)}%
      </text>`
      )
      .join("")}
  </svg>`);
  await sharp(frameBuffer)
    .composite([{ input: svg, top: 0, left: 0 }])
    .jpeg({ quality: 90 })
    .toFile(outPath);
}

// ========================
// MAIN
// ========================
module.exports = async function detectPeople(frameBuffer) {
  try {
    const ts = Date.now();
    const framePath = path.join(debugFrames, `${ts}.jpg`);
    await sharp(frameBuffer).jpeg({ quality: 90 }).toFile(framePath);

    //const model = await loadModel();
    if(!model){
      return {}
    }
    const imageTensor = tf.node.decodeImage(frameBuffer, 3);
    const predictions = await model.detect(imageTensor);
    imageTensor.dispose();

    // Filtro por pessoas
    const people = predictions.filter(
      (p) => p.class === "person" && p.score > CONF_THRESHOLD
    );


    // ========================
    // DEBUG E LOGS
    // ========================
    const logData = {
      timestamp: ts,
      total_detections: predictions.length,
      people_count: people.length,
      has_people: people.length > 0,
      sample_predictions: predictions.slice(0, 5),
      people,
    };

    const logPath = path.join(debugLogs, `${ts}.json`);
    fs.writeFileSync(logPath, JSON.stringify(logData, null, 2));

    const annotated = path.join(debugAnnotated, `${ts}.jpg`);
    await drawDetections(frameBuffer, people, annotated);

    return logData;
  } catch (err) {
    console.error("❌ detectPeople error:", err);
    return { has_people: false, count: 0, people: [] };
  }
};
