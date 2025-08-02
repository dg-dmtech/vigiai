const fs = require('fs');
const fetch = require('node-fetch');

async function sendToAI(filePath) {
  const stream = fs.createReadStream(filePath);
  const response = await fetch('https://sua-api-de-ia.com/analise', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer SUA_CHAVE_AQUI'
    },
    body: stream
  });

  const json = await response.json();
  return json.descricao || 'Sem descrição disponível';
}

module.exports = sendToAI;