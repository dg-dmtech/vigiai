
const SentWhatsAppMessage = require("./models/SentWhatsAppMessage");

module.exports = async function sentWhatsAppMessage(eventId, cam, iaResponse) {

  if (!cam.whatsappNotifyNumber) {
    console.log("⚠️ Número de WhatsApp não configurado. Ignorando notificação.");
    return;
  }

  const countMessage = await SentWhatsAppMessage.countDocuments({ camId: cam._id })
  if (iaResponse.suspect || countMessage < process.env.SENT_NO_SUSPECT_MESSAGES) {
    console.log("🔔 Notificação de evento suspeito enviada!", iaResponse.description);  
  }

  await SentWhatsAppMessage.create({ camId: cam._id, eventId, sentAt: new Date() })
  
}