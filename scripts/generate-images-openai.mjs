// Génère les images des recettes de base avec un service compatible OpenAI (secrets GitHub
// OPENAI_API_KEY et OPENAI_BASE_URL). Usage : node scripts/generate-images-openai.mjs [ids…]
// Sans id : seulement les recettes qui n'ont pas encore d'image. Les PNG bruts vont dans tmp-img/.
import fs from 'node:fs';

const KEY = process.env.OPENAI_API_KEY;
const BASE = (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/+$/, '');
const QUALITY = process.env.IMAGE_QUALITY || 'medium';
let MODEL = process.env.IMAGE_MODEL || '';
if (!KEY) { console.error('Secret OPENAI_API_KEY manquant'); process.exit(1); }

const prompts = JSON.parse(fs.readFileSync('scripts/image-prompts.json', 'utf8'));
const STYLE = 'Professional food photography of a home-cooked dish, appetizing and realistic, served on a rustic ceramic plate on a wooden table, soft natural daylight, 45 degree angle, shallow depth of field, no text, no people, no hands.';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const headers = { Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' };

async function call(path, body) {
  const res = await fetch(BASE + path, { method: body ? 'POST' : 'GET', headers, body: body ? JSON.stringify(body) : undefined });
  const text = await res.text();
  let data = {}; try { data = JSON.parse(text); } catch (e) { /* ignore */ }
  if (!res.ok) { const e = new Error(`HTTP ${res.status} ${text.slice(0, 300)}`); e.status = res.status; throw e; }
  return data;
}
if (!MODEL) {
  try {
    const ids = ((await call('/models')).data || []).map((m) => m.id);
    const ranks = [/gpt-image-2(?!.*mini)/, /gpt-image-1\.5/, /gpt-image-1-mini/, /gpt-image/, /dall-e-3/, /image/];
    MODEL = ids.map((m) => [m, ranks.findIndex((re) => re.test(m))]).filter(([, r]) => r >= 0).sort((a, b) => a[1] - b[1])[0]?.[0];
    console.log('Modèles image disponibles : ' + ids.filter((m) => /image|dall/i.test(m)).join(', '));
  } catch (e) { console.log('Liste des modèles indisponible : ' + e.message); }
  MODEL = MODEL || 'gpt-image-1-mini';
}
console.log(`Service : ${BASE} · modèle : ${MODEL} · qualité : ${QUALITY}`);

const only = process.argv.slice(2).filter(Boolean);
const ids = Object.keys(prompts).filter((id) => (only.length ? only.includes(id) : !fs.existsSync(`www/img/${id}.jpg`)));
fs.mkdirSync('tmp-img', { recursive: true });
let ok = 0;
for (const id of ids) {
  const dalle = /dall-e/.test(MODEL);
  const body = dalle ? { model: MODEL, prompt: `${prompts[id]}. ${STYLE}`, n: 1, size: '1024x1024', response_format: 'b64_json' }
    : { model: MODEL, prompt: `${prompts[id]}. ${STYLE}`, n: 1, size: '1536x1024', quality: QUALITY };
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const d = ((await call('/images/generations', body)).data || [])[0] || {};
      let buf;
      if (d.b64_json) buf = Buffer.from(d.b64_json, 'base64');
      else if (d.url) buf = Buffer.from(await (await fetch(d.url)).arrayBuffer());
      else throw new Error('aucune image dans la réponse');
      fs.writeFileSync(`tmp-img/${id}.png`, buf);
      console.log(`OK ${id}`); ok++;
      break;
    } catch (e) {
      console.log(`${id} : essai ${attempt} raté (${e.message})`);
      if (e.status === 401 || e.status === 403) process.exit(1);
      if (e.status === 400 && body.quality) { delete body.quality; body.size = '1024x1024'; }
      await sleep(e.status === 429 ? 30000 : 5000);
    }
  }
  await sleep(4000);
}
console.log(`${ok}/${ids.length} images générées`);
