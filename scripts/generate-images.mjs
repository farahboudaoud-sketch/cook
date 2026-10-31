// Génère une image IA (Pollinations, service gratuit) pour chaque recette de base -> www/img/<id>.jpg
// Usage : node scripts/generate-images.mjs [id1 id2 ...]  (sans argument : seulement les images manquantes)
import fs from 'node:fs';

const prompts = JSON.parse(fs.readFileSync('scripts/image-prompts.json', 'utf8'));
export const STYLE = 'professional food photography, appetizing home-cooked dish, served on a rustic ceramic plate on a wooden table, soft natural daylight, 45 degree angle, shallow depth of field, no text, no people';
const only = process.argv.slice(2).filter(Boolean);
fs.mkdirSync('www/img', { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const ids = Object.keys(prompts).filter((id) => (only.length ? only.includes(id) : !fs.existsSync(`www/img/${id}.jpg`)));
console.log(ids.length + ' image(s) à générer');
let ok = 0;
for (const id of ids) {
  const prompt = `${prompts[id]}, ${STYLE}`;
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=768&height=576&seed=7&model=flux&nologo=true`;
  for (let attempt = 1; attempt <= 6; attempt++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'CarnetDeCuisine/1.0 (github.com/farahboudaoud-sketch/cook)' } });
      if (res.status === 402 || res.status === 429) {
        const wait = (parseInt(res.headers.get('retry-after') || '50', 10) + 3) * 1000;
        console.log(`${id}: limite atteinte, attente ${wait / 1000} s`);
        await sleep(wait);
        continue;
      }
      const type = res.headers.get('content-type') || '';
      if (!res.ok || !type.startsWith('image/')) throw new Error(res.status + ' ' + type);
      const buf = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(`www/img/${id}.jpg`, buf);
      console.log(`OK ${id} (${Math.round(buf.length / 1024)} Ko)`);
      ok++;
      break;
    } catch (e) {
      console.log(`${id}: essai ${attempt} raté (${e.message})`);
      await sleep(50000);
    }
  }
  await sleep(47000);
}
console.log(`${ok}/${ids.length} images générées`);
