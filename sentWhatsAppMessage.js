
const SentWhatsAppMessage = require("./models/SentWhatsAppMessage");
const axios = require('axios');

module.exports = async function sentWhatsAppMessage(eventId, cam, iaResponse) {

  if (!cam.whatsappNotifyNumber) {
    console.log("⚠️ Número de WhatsApp não configurado. Ignorando notificação.");
    return;
  }

  const countMessage = await SentWhatsAppMessage.countDocuments({ camId: cam._id })
  if (iaResponse.suspect || countMessage < process.env.SENT_NO_SUSPECT_MESSAGES) {
    console.log("🔔 Notificação de evento suspeito enviada!", iaResponse.description);


    const url = `https://api.z-api.io/instances/${process.env.Z_API_INSTANCE_ID}/token/${process.env.Z_API_INSTANCE_TOKEN}/send-text`

    axios.post(url, {
      headers: {
        'Content-Type': 'application/json',
        'Client-Token': process.env.Z_API_CLIENT_TOKEN,

      },
      data: JSON.stringify({
        message: iaResponse.description,
        phone: cam.whatsappNotifyNumber,
      }),
    })
      .then(response => response.json())
      .then(data => {
        console.log('Response message:', data);
        return SentWhatsAppMessage.create({ camId: cam._id, eventId, sentAt: new Date() })
      })
      .catch((error) => {
        console.error(`Erro ao enviar a mensagem para ${am.whatsappNotifyNumber}:`);
      });
  }

}

