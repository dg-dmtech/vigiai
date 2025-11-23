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

async function sendToAI(videoPath, cam) {
  const outputDir = path.join(__dirname, "temp_frames", "cam_".concat(cam?.id), Date.now().toString());
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
      model: "gpt-5", // modelo com visão
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Você é um especialista em vigilância. Analise os seguintes frames (1 por segundo) e descreva o que está acontecendo. 
              Informe se há ações suspeitas como vandalismo, roubo, furto, brigas, objetos sendo manipulados ou comportamentos anormais.
              Considere o id da câmera: ${cam.id}, para ver se não se trata da mesma analise.
              Veja também o horario: ${new Date().toLocaleString()} e observe se não se trata da continuação de um evento anterior.
              Tente descrever detalhes relevantes como número de pessoas, ações específicas e contexto geral.
              Analise também se a pessoa está armada ou carregando objetos suspeitos.
              Seja detalhado mas objetivo em sua descrição, sem especulações desnecessárias.
              Se houver alguma caracteristica especifica sobre esta camera, observe também: 
              ${cam.customPrompt || "Nenhuma caracteristica especifica informada."}
                Retorne sua resposta em JSON no formato:
              { "description": "<texto>", "suspect": true|false, "peopleCount": <número de pessoas> }
              `
            },
            ...images.map(img => ({
              type: "image_url",
              image_url: { url: `data:image/jpeg;base64,${img}` }
            }))
          ]
        }
      ]
    })
  });

  const data = await response.json();
 // tenta extrair JSON diretamente da resposta
  let result = { description: "Sem descrição disponível", suspect: false };

  try {
    // tenta fazer parse direto da resposta da IA
    const parsed = JSON.parse(data.choices?.[0]?.message?.content);
    result = parsed;
  } catch {
    // fallback: detecta palavras suspeitas manualmente
    const text = data.choices?.[0]?.message?.content?.toLowerCase() || "";
    const suspectKeywords = ["suspeit", "roubo", "furt", "vandal", "briga", "arma", "violên"];
    const isSuspect = suspectKeywords.some(k => text.includes(k));
    result = { description: text, suspect: isSuspect };
  }

  // limpa frames temporários
  fs.rmSync(outputDir, { recursive: true, force: true });
  return result;
}

module.exports = sendToAI;
