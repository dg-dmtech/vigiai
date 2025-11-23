const mongoose = require("mongoose");

const DetectionEventSchema = new mongoose.Schema({
  camera: String,
  videoPath: String,
  description: String,
  detectedAt: { type: Date, default: Date.now },
  peopleCount: Number,
  confidence: Number
});

module.exports = mongoose.model("DetectionEvent", DetectionEventSchema);
