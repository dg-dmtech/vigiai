const Human = require('@vladmandic/human').default;
const { Image } = require('canvas');

const human = new Human({
    body: { enabled: true },
    face: { enabled: false },
    hand: { enabled: false },
    object: { enabled: false },
  });
  
let loaded = false;

async function detectPeople(imageBuffer) {
  if (!loaded) {
    await human.load();
    await human.warmup();
    loaded = true;
  }

  const img = new Image();
  img.src = imageBuffer;

  const result = await human.detect(img);
  const peopleCount = result.body?.length || 0;

  return {
    people_detected: peopleCount,
    has_people: peopleCount > 0
  };
}

module.exports = detectPeople;