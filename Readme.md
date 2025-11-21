# Vigiai – Sistema Inteligente de Detecção de Pessoas via Câmera RTSP + IA

O Vigiai é um sistema de vigilância inteligente que:
- Conecta-se a câmeras IP via RTSP
- Realiza detecção robusta de pessoas usando YOLOv8 (formato ONNX) em Node.js
- Aciona gravações automáticas, IA e ações configuráveis
- Funciona em CPU ou GPU

O foco é:
- Precisão
- Simplicidade
- Performance
- Baixo custo operacional

--------------------------------------------

## Estrutura inicial do projeto

vigiai/
├── detectPeople.js
├── server.js
├── models/
│   └── yolov8n.onnx
├── videos/
├── python/
│   ├── .venv/
│   └── export_onnx.py
├── .env
└── README.md

--------------------------------------------

## Arquitetura geral

1. O sistema conecta ao stream RTSP.
2. Cada frame é enviado ao módulo detectPeople.js.
3. YOLOv8 ONNX (onnxruntime-node) executa a inferência.
4. Se houver pessoas, ações são disparadas:
   - Iniciar gravação com pre-buffer
   - Enviar evento para IA
   - Registrar logs
5. O sistema opera de forma contínua.

--------------------------------------------

## Tecnologias principais

Node.js:
- onnxruntime-node
- sharp
- rtsp-ffmpeg
- ffmpeg para gravação

Python (somente para converter o modelo .pt → .onnx):
- ultralytics

Modelo de IA:
- YOLOv8n (padrão)
- Pode evoluir para YOLOv8s/m/l/x ou YOLOv9/YOLO11.

--------------------------------------------

## Instalação – Node.js

npm install
npm install onnxruntime-node sharp rtsp-ffmpeg

Criar arquivo .env:

STREAM_URL=rtsp://usuario:senha@ip:porta/caminho
CONFIDENCE_THRESHOLD=0.45

--------------------------------------------

## Instalação – Python (para converter YOLOv8)

Criar ambiente virtual em disco com espaço:

cd /media/dg/home
mkdir vigiai-python
cd vigiai-python

python3 -m venv .venv
source .venv/bin/activate

pip install --upgrade pip
pip install ultralytics

Converter:

python export_onnx.py

Isso gera:
yolov8n.onnx

Mover para o Node.js:

mv yolov8n.onnx ~/dmtech/vigiai/models/

--------------------------------------------

## Detecção de Pessoas – descrição

O arquivo detectPeople.js:
- Converte o frame com sharp
- Redimensiona para 640x640
- Normaliza e prepara o tensor
- Executa YOLOv8 ONNX
- Extrai apenas classe 0 (pessoa)
- Retorna:

{
  "has_people": true,
  "count": 2,
  "people": [...]
}

--------------------------------------------

## Gravação Automática

Em desenvolvimento:
- Pre-buffer (N segundos antes)
- Extensão da gravação se novas pessoas forem detectadas
- Pipeline FFmpeg otimizado
- Escrita contínua de buffer

--------------------------------------------

## Integração com IA

Em desenvolvimento:
- Descrição automática de eventos
- Classificação de comportamento
- Resumo diário de ocorrências
- Integração com OpenAI

--------------------------------------------

## Status geral

✔ Detecção via YOLOv8 (robusto)
✔ Conversão para ONNX (em andamento)
⏳ Gravação automática
⏳ IA descritiva
⏳ Painel Web
⏳ Multi-câmera

--------------------------------------------

## Licença
A definir.

--------------------------------------------

## Contato
A definir.
