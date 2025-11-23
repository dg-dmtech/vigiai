// renderer.js
const input = document.getElementById('rtspUrl');
const button = document.getElementById('connect');
const status = document.getElementById('status');

button.addEventListener('click', async () => {
  const rtspUrl = input.value.trim();
  if (!rtspUrl) {
    status.textContent = '⚠️ Informe uma URL RTSP válida.';
    return;
  }

  status.textContent = '⏳ Testando conexão...';
  try {
    const { url } = await window.cameraApi.startStream({ rtspUrl, id: 'camera1' });
    status.textContent = '✅ Conectado com sucesso! Abrindo visualização...';
    window.open(`viewer.html?stream=${encodeURIComponent(url)}`, '_blank', 'width=900,height=600');
  } catch (err) {
    status.textContent = `❌ Erro: ${err.message}`;
  }
});
