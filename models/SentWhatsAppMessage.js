const mongoose = require("mongoose");

const SentWhatsAppMessage = new mongoose.Schema({
  eventId: String,
  sentAt: { type: Date, default: Date.now },
  camId: String
})

module.exports = mongoose.model("SentWhatsAppMessage", SentWhatsAppMessage);
