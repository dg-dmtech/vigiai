const mongoose = require("mongoose");

const DetectionEventSchema = new mongoose.Schema({
  camera: String,
  videoPath: String,
  description: String,
  detectedAt: { type: Date, default: Date.now },
  cocoSsdPeopleCount: Number,
  gptPeopleCount: Number,
  confidence: Number,
  suspect: Boolean
});

module.exports = mongoose.model("DetectionEvent", DetectionEventSchema);
