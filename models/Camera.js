const mongoose = require("mongoose");

const CameraSchema = new mongoose.Schema({
  name: { type: String, required: true },
  url: { type: String, required: true },
  location: String,
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  whatsappNotifyNumber: String
});

module.exports = mongoose.model("Camera", CameraSchema);
