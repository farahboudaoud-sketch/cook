// Cherche des photos libres de droits (Wikimedia Commons) pour chaque recette de base
// et écrit www/js/images.js : jusqu'à 5 photos par recette (la première est affichée,
// les suivantes servent au bouton « Autre photo »). Lancé par GitHub Actions.
// scripts/image-queries.json : recherche par recette ; une valeur "File:Nom.jpg" force une photo précise.
// Une liste ["File:a.jpg", "recherche"] combine photo imposée puis résultats de recherche.
import fs from 'node:fs';

const queries = JSON.parse(fs.readFileSync('scripts/image-queries.json', 'utf8'));
const API = 'https://commons.wikimedia.org/w/api.php';
const UA = 'CarnetDeCuisine/1.0 (application perso; https://github.com/farahboudaoud-sketch/cook)';
const BAD = /(logo|map|icon|diagram|drawing|menu|poster|label|packag|stamp|sign|advert|shop|store|market|restaurant|festival|recipe card|cookbook)/i;
const strip = (h) => String(h || '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

async function api(params) {
  const url = API + '?' + new URLSearchParams({ format: 'json', formatversion: '2', ...params });
  for (let i = 0; i < 3; i++) {
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    if (res.ok) return res.json();
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error('API indisponible');
}
function toInfo(p) {
  const ii = p.imageinfo && p.imageinfo[0];
  if (!ii || ii.mime !== 'image/jpeg' || ii.width < 500 || ii.height < 350) return null;
  const m = ii.extmetadata || {};
  return { src: ii.thumburl, page: ii.descriptionurl, author: strip(m.Artist?.value).slice(0, 80) || 'Auteur inconnu', license: strip(m.LicenseShortName?.value) || 'Licence libre' };
}
const common = { prop: 'imageinfo', iiprop: 'url|extmetadata|size|mime', iiurlwidth: '800' };
async function byTitle(t) {
  const pages = (await api({ action: 'query', titles: t, ...common })).query?.pages || [];
  return pages.map(toInfo).filter(Boolean);
}
async function bySearch(q) {
  const r = await api({ action: 'query', generator: 'search', gsrnamespace: '6', gsrsearch: q + ' filetype:bitmap', gsrlimit: '20', ...common });
  return (r.query?.pages || []).sort((a, b) => a.index - b.index).filter((p) => !BAD.test(p.title)).map(toInfo).filter(Boolean);
}

const out = {}; const report = [];
for (const [id, spec] of Object.entries(queries)) {
  try {
    let list = [];
    for (const q of [].concat(spec)) list = list.concat(q.startsWith('File:') ? await byTitle(q) : await bySearch(q));
    const seen = new Set(); list = list.filter((x) => !seen.has(x.src) && seen.add(x.src)).slice(0, 5);
    if (list.length) { out[id] = list; report.push(`OK ${id}: ${list.length} photo(s), 1re = ${list[0].page.split('/').pop()}`); }
    else report.push(`-- ${id}: aucune photo`);
  } catch (e) { report.push(`ERR ${id}: ${e.message}`); }
  await new Promise((r) => setTimeout(r, 250));
}
fs.writeFileSync('www/js/images.js', '/* Photos libres de droits (Wikimedia Commons), générées par scripts/fetch-images.mjs */\n\'use strict\';\nconst IMAGES = ' + JSON.stringify(out) + ';\n');
fs.mkdirSync('review', { recursive: true });
fs.writeFileSync('review/images-report.txt', report.join('\n') + '\n');
console.log(report.join('\n'));
