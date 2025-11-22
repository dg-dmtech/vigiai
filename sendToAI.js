const fs = require("fs");
const fetch = require("node-fetch");
const ffmpeg = require("fluent-ffmpeg");
const path = require("path");

async function extractFrames(videoPath, outputDir) {
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .on("end", () => {
        const files = fs
          .readdirSync(outputDir)
          .filter(f => f.endsWith(".jpg"))
          .map(f => path.join(outputDir, f))
          .sort();
        resolve(files);
      })
      .on("error", reject)
      .outputOptions([
        "-vf", "fps=1" // 1 frame por segundo
      ])
      .save(`${outputDir}/frame_%03d.jpg`);
  });
}

async function sendToAI(videoPath) {
  const outputDir = path.join(__dirname, "frames_temp");
  const frames = await extractFrames(videoPath, outputDir);

  // limitar a no máximo 10 frames (caso o vídeo seja maior)
  const selectedFrames = frames.slice(0, 10);
  const images = selectedFrames.map(f => fs.readFileSync(f).toString("base64"));

  console.log(`🎞️ Extraídos ${images.length} frames do vídeo.`);

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-4o-mini", // modelo com visão
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Você é um especialista em vigilância. Analise os seguintes frames (1 por segundo) e descreva o que está acontecendo. 
              Informe se há pessoas, ações suspeitas, objetos sendo manipulados ou comportamentos anormais.`
            },
            ...images.map(img => ({
              type: "image_url",
              image_url: `data:image/jpeg;base64,${img}`
            }))
          ]
        }
      ]
    })
  });

  const data = await response.json();
  const description = data.choices?.[0]?.message?.content || "Sem descrição disponível";

  // limpa frames temporários
  fs.rmSync(outputDir, { recursive: true, force: true });

  return description;
}

module.exports = sendToAI;
