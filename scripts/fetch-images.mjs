// Cherche une photo libre de droits (Wikimedia Commons) pour chaque recette
// et écrit www/js/images.js (adresse de la vignette + crédit). Lancé par GitHub Actions.
// Une valeur commençant par "File:" désigne un fichier précis plutôt qu'une recherche.
import fs from 'node:fs';

const queries = JSON.parse(fs.readFileSync('scripts/image-queries.json', 'utf8'));
const API = 'https://commons.wikimedia.org/w/api.php';
const UA = 'CarnetDeCuisine/1.0 (application perso; https://github.com/farahboudaoud-sketch/cook)';
const BAD = /(logo|map|icon|diagram|drawing|menu|poster|label|package|packaging|\.svg|\.png$|restaurant sign|stamp)/i;

const strip = (h) => String(h || '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

async function api(params) {
  const url = API + '?' + new URLSearchParams({ format: 'json', formatversion: '2', origin: '*', ...params });
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(res.status + ' ' + url);
  return res.json();
}

async function find(q) {
  const common = { prop: 'imageinfo', iiprop: 'url|extmetadata|size|mime', iiurlwidth: '640' };
  let pages;
  if (q.startsWith('File:')) {
    pages = (await api({ action: 'query', titles: q, ...common })).query?.pages || [];
  } else {
    const r = await api({ action: 'query', generator: 'search', gsrnamespace: '6', gsrsearch: q + ' filetype:bitmap', gsrlimit: '15', ...common });
    pages = (r.query?.pages || []).sort((a, b) => a.index - b.index);
  }
  for (const p of pages) {
    const ii = p.imageinfo && p.imageinfo[0];
    if (!ii || ii.mime !== 'image/jpeg' || ii.width < 500 || ii.height < 350) continue;
    if (!q.startsWith('File:') && BAD.test(p.title)) continue;
    const m = ii.extmetadata || {};
    return {
      src: ii.thumburl,
      page: ii.descriptionurl,
      title: p.title,
      author: strip(m.Artist?.value).slice(0, 80) || 'Auteur inconnu',
      license: strip(m.LicenseShortName?.value) || 'Licence libre'
    };
  }
  return null;
}

const out = {};
const report = [];
for (const [id, q] of Object.entries(queries)) {
  try {
    const hit = await find(q);
    if (hit) { out[id] = hit; report.push(`OK  ${id} -> ${hit.title}`); }
    else report.push(`--  ${id} (aucune photo pour "${q}")`);
  } catch (e) { report.push(`ERR ${id} ${e.message}`); }
  await new Promise((r) => setTimeout(r, 300));
}
fs.writeFileSync('www/js/images.js', '/* Photos libres de droits (Wikimedia Commons), générées par scripts/fetch-images.mjs */\nconst IMAGES = ' + JSON.stringify(out, null, 1) + ';\n');
fs.mkdirSync('review', { recursive: true });
fs.writeFileSync('review/images-report.txt', report.join('\n') + '\n');
console.log(report.join('\n'));
