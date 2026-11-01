/* Carnet de cuisine – images, notes, onglet « Mes recettes », assistant IA (Gemini).
 * Chargé avant app.js ; utilise ses variables globales (state, ui, esc…) au moment des appels. */
'use strict';

/* ---------- Dates ---------- */
function todayIso() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
}

/* ---------- Notes personnelles ---------- */
function noteOf(id) {
  if (!state.notes[id]) state.notes[id] = { text: '', stars: 0, last: null, lastWeek: false };
  return state.notes[id];
}
function starsLabel(id) {
  const n = state.notes[id];
  return n && n.stars ? '★'.repeat(n.stars) + '☆'.repeat(5 - n.stars) : '';
}
function notesHtml(r) {
  const n = state.notes[r.id] || {};
  const last = n.last ? (n.lastWeek ? `Cuisinée la semaine du ${fmtDate(n.last)}` : `Cuisinée le ${fmtDate(n.last)}`) : 'Pas encore cuisinée';
  const stars = [1, 2, 3, 4, 5].map((k) => `<button class="star ${n.stars >= k ? 'on' : ''}" data-act="stars" data-v="${r.id}:${k}" aria-label="${k} ${k > 1 ? 'étoiles' : 'étoile'}" aria-pressed="${n.stars === k}">${n.stars >= k ? ICONS.starFull : ICONS.star}</button>`).join('');
  return `<div class="section-title" style="margin-top:8px">Mes notes</div>
    <div class="stars" role="group" aria-label="Ma note">${stars}</div>
    <div class="row between" style="flex-wrap:wrap;gap:6px"><span class="muted small">${last}</span><button class="link" data-act="cooked-today" data-v="${r.id}">Je l’ai cuisinée aujourd’hui</button></div>
    <label class="lbl" for="note-text">Mes commentaires</label>
    <textarea class="input" id="note-text" data-v="${r.id}" placeholder="Ce que tu changerais, une variante, un avis…">${esc(n.text || '')}</textarea>`;
}

/* ---------- Images : générées (IA) puis vraies photos (Wikimedia Commons) ---------- */
const imgPending = {};
const genCache = {};           // images générées dans l'appli (gardées dans IndexedDB)
let idb = null;
function openDb() {
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open('carnet-cuisine', 1);
      req.onupgradeneeded = () => req.result.createObjectStore('images');
      req.onsuccess = () => { idb = req.result; resolve(idb); };
      req.onerror = () => resolve(null);
    } catch (e) { resolve(null); }
  });
}
async function loadImages() {
  const db = await openDb();
  if (!db) { window.imagesReady = true; return; }
  await new Promise((resolve) => {
    try {
      const req = db.transaction('images', 'readonly').objectStore('images').openCursor();
      req.onsuccess = () => { const c = req.result; if (c) { genCache[c.key] = c.value; c.continue(); } else resolve(); };
      req.onerror = () => resolve();
    } catch (e) { resolve(); }
  });
  window.imagesReady = true;
}
function storeGenerated(id, src) {
  genCache[id] = src;
  try { if (idb) idb.transaction('images', 'readwrite').objectStore('images').put(src, id); } catch (e) { /* ignore */ }
}
function photoList(r) {
  const list = [];
  if (genCache['own:' + r.id]) list.push({ src: genCache['own:' + r.id], own: true });
  if (genCache[r.id]) list.push({ src: genCache[r.id], ai: true });
  else if (!r.custom && typeof GEN_IMAGES !== 'undefined' && GEN_IMAGES.includes(r.id)) list.push({ src: (window.IMG_BASE || 'img/') + r.id + '.jpg', ai: true });
  const own = state.photos && state.photos[r.id];
  const commons = (own && own.list && own.list.length) ? own.list : ((typeof IMAGES !== 'undefined' && IMAGES[r.id]) || []);
  return list.concat(commons);
}
function photoOf(r) {
  const list = photoList(r);
  if (!list.length) return null;
  const idx = ((state.photos && state.photos[r.id] && state.photos[r.id].idx) || 0) % list.length;
  return list[idx];
}
function imageSrc(r) { const p = photoOf(r); return p ? p.src : null; }
function imgTag(r, cls) {
  const src = imageSrc(r);
  return src ? `<img class="${cls}" src="${esc(src)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">` : '';
}
const COMMONS_BAD = /(logo|map|icon|diagram|drawing|menu|poster|label|packag|stamp|sign|advert|shop|store|market|restaurant|festival|cookbook)/i;
const stripHtml = (h) => String(h || '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
async function searchCommons(q) {
  const params = new URLSearchParams({ action: 'query', format: 'json', formatversion: '2', origin: '*', generator: 'search', gsrnamespace: '6', gsrsearch: q + ' filetype:bitmap', gsrlimit: '20', prop: 'imageinfo', iiprop: 'url|extmetadata|size|mime', iiurlwidth: '800' });
  const res = await fetch('https://commons.wikimedia.org/w/api.php?' + params);
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const data = await res.json();
  return ((data.query && data.query.pages) || []).sort((a, b) => a.index - b.index).filter((p) => !COMMONS_BAD.test(p.title)).map((p) => {
    const ii = p.imageinfo && p.imageinfo[0];
    if (!ii || ii.mime !== 'image/jpeg' || ii.width < 500 || ii.height < 350) return null;
    const m = ii.extmetadata || {};
    return { src: ii.thumburl, page: ii.descriptionurl, author: stripHtml(m.Artist && m.Artist.value).slice(0, 80) || 'Auteur inconnu', license: stripHtml(m.LicenseShortName && m.LicenseShortName.value) || 'Licence libre' };
  }).filter(Boolean).slice(0, 8);
}
function setPhotoIdx(id, idx) { state.photos[id] = Object.assign({}, state.photos[id] || {}, { idx }); save(); }
/* Bouton « Autre photo » : passe à l'image suivante (image générée, puis vraies photos). */
function nextPhoto(id) {
  const r = recipeById(id); if (!r) return;
  state.photos = state.photos || {};
  const n = photoList(r).length;
  if (n > 1) { setPhotoIdx(id, (((state.photos[id] || {}).idx || 0) + 1) % n); render(); }
  else searchPhotoFor(id, true);
}
/* Cherche de vraies photos en ligne pour une recette. */
async function searchPhotoFor(id, manual) {
  const r = recipeById(id);
  if (!r || imgPending[id]) return;
  state.photos = state.photos || {};
  imgPending[id] = true; render();
  const queries = [r.imgQuery, r.query, r.n].filter(Boolean);
  let found = [];
  try { for (const q of queries) { found = await searchCommons(q); if (found.length) break; } } catch (e) { found = null; }
  imgPending[id] = false;
  if (found && found.length) { state.photos[id] = { list: found, idx: genCache[id] ? 0 : 0 }; save(); if (manual) toast('Photo trouvée'); }
  else if (manual) toast(found === null ? 'Pas de connexion : réessaie plus tard' : 'Aucune photo trouvée pour cette recette');
  render();
}
/* Génère une image avec le service compatible OpenAI (payant, quelques centimes). */
/* Même style, même modèle, même qualité et même format que les images du carnet. */
function genSettings() { return (typeof GEN_IMAGE_SETTINGS !== 'undefined' && GEN_IMAGE_SETTINGS) || {}; }
/* Description détaillée du plat en anglais, comme pour les recettes du carnet. */
async function dishDescription(r) {
  if (typeof IMAGE_PROMPTS !== 'undefined' && IMAGE_PROMPTS[r.id] && !r.edited) return IMAGE_PROMPTS[r.id];
  if (r.imgPrompt) return r.imgPrompt;
  const ex = typeof IMAGE_PROMPTS !== 'undefined' ? Object.values(IMAGE_PROMPTS).slice(0, 3).map((x) => '- ' + x).join('\n') : '';
  try {
    const j = await openaiJSON('You write short visual descriptions of plated dishes for food photography. Answer only with JSON.',
      `Dish: "${r.n}". Main ingredients: ${r.i.map(([k]) => ing(k).n).slice(0, 10).join(', ')}.\nWrite one English sentence (15 to 30 words) describing what the finished dish looks like on the plate, in the same style as these examples:\n${ex}\nAnswer: {"description": "..."}`);
    const d = String(j.description || '').trim();
    if (d) { r.imgPrompt = d; return d; }
  } catch (e) { /* on se rabat sur le nom */ }
  return r.n;
}
async function generateImageFor(id, manual, note) {
  const r = recipeById(id);
  if (!r || imgPending[id]) return;
  if (!openaiReady()) { if (manual) toast('Ajoute ta clé OpenAI dans le Profil pour générer des images'); return; }
  imgPending[id] = true;
  if (manual) toast('Image en cours de création (environ 30 s)…');
  render();
  try {
    const what = await dishDescription(r);
    // On garde la description pour les prochaines fois (recette perso ou modifiée)
    if (r.custom) { const c = state.custom.find((x) => x.id === r.id); if (c && !c.imgPrompt) c.imgPrompt = what; }
    else if (r.edited && state.overrides[r.id] && !state.overrides[r.id].imgPrompt) state.overrides[r.id].imgPrompt = what;
    note = String(note === undefined ? (r.imgNote || '') : note).trim();
    const src = await openaiImage(`${what}.${note ? ' Specific instructions from the cook (follow them, they may be in French): ' + note + '.' : ''} ${IMAGE_STYLE}`);
    storeGenerated(id, src);
    state.photos = state.photos || {}; setPhotoIdx(id, genCache['own:' + id] ? 1 : 0);
    toast('Image prête');
  } catch (e) { toast(e.message || 'Image impossible pour le moment'); }
  imgPending[id] = false;
  render();
}
function creditHtml(p) {
  if (p.own) return 'Ma photo';
  if (p.ai) return 'Image générée par IA, illustration non contractuelle';
  return `Photo : ${esc(p.author)} · ${esc(p.license)} · <a href="${esc(p.page)}" target="_blank" rel="noopener">Wikimedia Commons</a>`;
}
function heroHtml(r) {
  const p = photoOf(r);
  const pending = imgPending[r.id];
  const n = photoList(r).length;
  const actions = pending ? '<span class="muted small">Image en cours…</span>' : '';

  return `<div class="hero" style="background:${hashColor(r.id)}"><span aria-hidden="true">${r.e || '🍽️'}</span>${p ? `<img src="${esc(p.src)}" alt="${esc(r.n)}" referrerpolicy="no-referrer" onerror="this.remove()">` : ''}</div>
    <div class="row between" style="margin-top:-6px;gap:10px;align-items:flex-start">
      <span class="muted credit">${p ? creditHtml(p) : r.preview ? 'L’image sera ajoutée à l’enregistrement' : 'Pas encore d’image'}</span>
      ${actions}
    </div>`;
}

/* ---------- Étapes et astuces ---------- */
function stepsOf(r) { if (r.edited || r.custom) return r.st || []; return (typeof DETAILS !== 'undefined' && DETAILS[r.id] && DETAILS[r.id].st) || r.st || []; }
function tipsOf(r) { if (r.edited || r.custom) return r.tips || []; return (typeof DETAILS !== 'undefined' && DETAILS[r.id] && DETAILS[r.id].tips) || r.tips || []; }
function stepsHtml(r, sh) {
  const st = stepsOf(r); const tips = tipsOf(r);
  const editable = sh && sh.kind === 'recipe' && !r.preview;
  let tipsBlock = '';
  if (editable && sh.tipsEdit) {
    tipsBlock = `<div class="tips"><div class="serif italic" style="font-size:18px;color:var(--accent)">Astuces</div>
      <textarea class="input tips-text" id="tips-text" placeholder="Une astuce par ligne">${esc(tips.join('\n'))}</textarea>
      <div class="row" style="gap:10px;justify-content:flex-end"><button class="btn small-btn" data-act="tips-cancel">Annuler</button><button class="btn primary small-btn" data-act="tips-save" data-v="${r.id}">Enregistrer</button></div></div>`;
  } else if (tips.length || editable) {
    tipsBlock = `<div class="tips"><div class="row between"><span class="serif italic" style="font-size:18px;color:var(--accent)">Astuces</span>${editable ? `<button class="icon-btn tips-pen" data-act="tips-edit" aria-label="Modifier les astuces"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg></button>` : ''}</div>${tips.length ? tips.map((t) => `<p>${esc(t)}</p>`).join('') : '<p class="muted">Pas encore d’astuce : touche le crayon pour en ajouter une.</p>'}</div>`;
  }
  return `${st.length ? `<div class="section-title" style="margin-top:6px">Préparation</div><ol class="steps">${st.map((s) => `<li><span>${esc(s)}</span></li>`).join('')}</ol>` : ''}
    ${tipsBlock}`;
}
/* Crayon des astuces : modification directe depuis la fiche */
function saveTips(id) {
  const r = recipeById(id); const t = $('#tips-text');
  if (!r || !t) return;
  const tips = t.value.split('\n').map((x) => x.trim()).filter(Boolean);
  if (r.custom) { const c = state.custom.find((x) => x.id === id); if (c) c.tips = tips; }
  else {
    const cur = state.overrides[id];
    if (cur) cur.tips = tips;
    else { const b = r; state.overrides[id] = { n: b.n, e: b.e, type: b.type, t: b.t, d: b.d, p: b.p, pu: b.pu || 'pers', i: b.i.map((x) => x.slice()), st: stepsOf(b).slice(), tips }; }
  }
  save(); ui.sheet.tipsEdit = false; toast('Astuces enregistrées'); render();
}

/* ---------- Carte de recette (grilles) ---------- */
function recipeCard(r, sh, dis) {
  sh = sh || []; dis = dis || [];
  const added = !!inMenu(r.id);
  const fav = state.favorites.includes(r.id);
  const stars = starsLabel(r.id);
  return `<div class="card">
    <div class="tile" style="background:${hashColor(r.id)}">
      <span class="tile-emoji" aria-hidden="true">${r.e || '🍽️'}</span>
      ${imgTag(r, 'tile-img')}
      <button class="tile-open" data-act="open" data-v="${r.id}" aria-label="Voir ${esc(r.n)}"></button>
      ${fav ? `<span class="fav" aria-label="Favori">${ICONS.heartFull}</span>` : ''}
      <button class="add ${added ? 'on' : ''}" data-act="toggle-menu" data-v="${r.id}" aria-label="${added ? 'Retirer du menu' : 'Ajouter au menu'}" style="color:${added ? '#fff' : 'var(--ink)'}">${added ? ICONS.check : ICONS.plus}</button>
    </div>
    <button class="card" data-act="open" data-v="${r.id}" style="gap:4px">
      <span class="card-name">${esc(r.n)}</span>
      <span class="card-meta">${r.t} min · ${DIFF[r.d] || ''}${r.ai ? ' · IA' : r.custom ? ' · Perso' : ''}</span>
      ${stars ? `<span class="card-stars" aria-label="${state.notes[r.id].stars} sur 5">${stars}</span>` : ''}
      ${sh.length ? `<span class="card-note">${sh.length} ${plural(sh.length, 'ingrédient', 'ingrédients')} en commun</span>` : ''}
      ${dis.length ? `<span class="card-warn">Contient : ${esc(dis.join(', ').toLowerCase())}</span>` : ''}
    </button>
  </div>`;
}

/* ---------- Onglet « Mes recettes » ---------- */
function renderMyRecipes() {
  const filters = [['toutes', 'Toutes'], ['favoris', 'Favoris'], ['perso', 'Écrites par moi'], ['ia', 'Générées par l’IA']];
  let list = allRecipes().filter((r) => state.favorites.includes(r.id) || r.custom);
  if (ui.recFilter === 'favoris') list = list.filter((r) => state.favorites.includes(r.id));
  if (ui.recFilter === 'perso') list = list.filter((r) => r.custom && !r.ai);
  if (ui.recFilter === 'ia') list = list.filter((r) => r.ai);
  const sections = TYPES.map((t) => {
    const its = list.filter((r) => (r.type || 'plat') === t.id).sort((a, b) => ((state.notes[b.id] || {}).stars || 0) - ((state.notes[a.id] || {}).stars || 0) || a.n.localeCompare(b.n, 'fr'));
    if (!its.length) return '';
    return `<div class="section-title">${t.name} <span class="muted small" style="font-style:normal;font-family:var(--sans)">${its.length}</span></div><div class="grid">${its.map((r) => recipeCard(r)).join('')}</div>`;
  }).join('');
  const empty = {
    toutes: 'Ton carnet est vide pour l’instant. Touche le cœur sur une recette pour la mettre en favori, écris tes propres recettes ou demande-en une à l’IA.',
    favoris: 'Pas encore de favoris. Touche le cœur sur une fiche recette pour l’ajouter ici.',
    perso: 'Tu n’as pas encore écrit de recette.',
    ia: 'Aucune recette générée pour l’instant.'
  }[ui.recFilter];
  return `<div class="page">
    <div class="kicker">Mon carnet</div>
    <div class="title-row"><h1>Mes recettes</h1></div>
    <div class="row" style="gap:10px;flex-wrap:wrap">
      <button class="btn dark" style="flex:1" data-act="ai-open">${ICONS.spark} Générer avec l’IA</button>
      <button class="btn" style="flex:1" data-act="new-recipe">Écrire une recette</button>
    </div>
    <div class="filters" role="tablist">${filters.map(([id, n]) => `<button role="tab" class="${ui.recFilter === id ? 'on' : ''}" data-act="rec-filter" data-v="${id}" aria-selected="${ui.recFilter === id}">${n}</button>`).join('')}</div>
    ${sections || `<div class="empty"><span>${empty}</span></div>`}
  </div>`;
}

/* ---------- Assistant IA (Gemini) ---------- */
const GEMINI_FALLBACK = ['gemini-3.8-flash', 'gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-flash-latest', 'gemini-flash-lite-latest'];
function aiSuggest(q) {
  return `<div class="ai-box"><span>Tu ne trouves pas exactement ce que tu cherches ?</span>
    <button class="btn dark block" data-act="ai-open" data-v="${esc(q)}">${ICONS.spark} Générer « ${esc(q)} » avec l’IA</button></div>`;
}
function aiProvider() { return state.ai.provider || (state.ai.oaKey ? 'openai' : 'gemini'); }
function openaiReady() { return !!(state.ai.oaKey && state.ai.oaBase); }
function aiReady() { return aiProvider() === 'openai' ? openaiReady() : !!state.ai.key; }
function keyForm() {
  const prov = aiProvider();
  const tabs = `<div class="chips"><button class="chip ${prov === 'openai' ? 'on' : 'soft'}" data-act="ai-provider" data-v="openai">OpenAI (compatible)</button><button class="chip ${prov === 'gemini' ? 'on' : 'soft'}" data-act="ai-provider" data-v="gemini">Gemini</button></div>`;
  if (prov === 'openai') {
    const models = state.ai.oaModels || [];
    const opt = (sel, filter) => ['<option value="">Automatique</option>'].concat(models.filter(filter).map((m) => `<option value="${esc(m)}" ${sel === m ? 'selected' : ''}>${esc(m)}</option>`)).join('');
    return `${tabs}
      <div><label class="lbl" for="oa-base">Adresse du service (URL de base)</label><input class="input" id="oa-base" placeholder="https://…/v1" value="${esc(state.ai.oaBase || '')}" autocomplete="off" inputmode="url"></div>
      <div><label class="lbl" for="oa-key">Clé</label><input class="input" id="oa-key" type="password" placeholder="Colle ta clé ici" value="${esc(state.ai.oaKey || '')}" autocomplete="off"></div>
      ${models.length ? `<div class="row" style="gap:14px">
        <div style="flex:1"><label class="lbl" for="oa-text">Modèle pour les recettes</label><select class="input" id="oa-text">${opt(state.ai.oaText, (m) => !/(image|dall|tts|whisper|embed|audio|realtime|moderation|transcribe|search)/i.test(m))}</select></div>
        </div>` : ''}
      <p class="muted small" style="margin:0">Images : même style, même modèle${genSettings().model ? ' (' + esc(genSettings().model) + ')' : ''} et même qualité que les images du carnet, pour un rendu homogène.</p>
      <div class="row" style="gap:16px"><button class="link" data-act="save-key">Enregistrer</button>${openaiReady() ? '<button class="link" data-act="test-key">Tester</button>' : ''}</div>
      ${state.ai.oaInfo ? `<p class="muted small" style="margin:0">${esc(state.ai.oaInfo)}</p>` : ''}
      <p class="muted small" style="margin:0">Payant à l’usage sur ton compte : environ 1 centime par recette et quelques centimes par image. La clé reste uniquement sur ce téléphone.</p>`;
  }
  return `${tabs}<div class="field"><input id="ai-key" type="password" placeholder="Colle ta clé Gemini ici" value="${esc(state.ai.key || '')}" autocomplete="off" aria-label="Clé Gemini"></div>
    <div class="row" style="gap:16px"><button class="link" data-act="save-key">Enregistrer la clé</button>${state.ai.key ? '<button class="link" data-act="test-key">Tester la clé</button>' : ''}</div>
    <details class="help"><summary>Comment obtenir une clé gratuite ?</summary>
      <ol><li>Ouvre <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener">aistudio.google.com/apikey</a> (adresse à recopier si le lien ne s’ouvre pas).</li>
      <li>Connecte-toi avec ton compte Google et accepte les conditions.</li>
      <li>Touche « Create API key » (Créer une clé), puis copie la clé.</li>
      <li>Colle-la ci-dessus et touche « Enregistrer la clé ».</li></ol>
      <p class="muted small">Gratuit dans la limite d’un quota quotidien. La clé reste uniquement sur ce téléphone.</p>
    </details>`;
}
function readKeyForm() {
  oaModelsFetched = false;
  const v = (id) => { const el = $('#' + id); return el ? el.value.trim() : null; };
  if (v('ai-key') !== null) { state.ai.key = v('ai-key'); state.ai.model = ''; geminiModelsCache = null; }
  if (v('oa-key') !== null) state.ai.oaKey = v('oa-key');
  if (v('oa-base') !== null) state.ai.oaBase = v('oa-base').replace(/\/+$/, '');
  if (v('oa-text') !== null) state.ai.oaText = v('oa-text');
}

/* ---------- Service compatible OpenAI ---------- */
async function oaFetch(path, body, method) {
  let res;
  try {
    res = await fetch(state.ai.oaBase + path, {
      method: method || (body ? 'POST' : 'GET'),
      headers: Object.assign({ Authorization: 'Bearer ' + state.ai.oaKey }, body ? { 'Content-Type': 'application/json' } : {}),
      body: body ? JSON.stringify(body) : undefined
    });
  } catch (e) { throw new Error('Impossible de joindre le service. Vérifie l’adresse et ta connexion internet.'); }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (data.error && (data.error.message || data.error)) || data.message || ('HTTP ' + res.status);
    const err = new Error(res.status === 401 ? 'Clé refusée par le service (401). Vérifie la clé.' : res.status === 429 ? 'Limite atteinte ou crédit épuisé (429) : ' + msg : 'Erreur du service (' + res.status + ') : ' + msg);
    err.status = res.status; err.raw = String(msg);
    throw err;
  }
  return data;
}
const rankText = (m) => [/gpt-5[.\d]*-mini/, /gpt-4\.1-mini/, /gpt-4o-mini/, /mini/, /gpt-5/, /gpt-4/, /gpt/].findIndex((re) => re.test(m));
const rankImage = (m) => [/gpt-image-2(?!.*mini)/, /gpt-image-1\.5/, /gpt-image-1-mini/, /gpt-image/, /dall-e-3/, /image/, /dall/].findIndex((re) => re.test(m));
let oaModelsFetched = false;
async function oaListModels() {
  if (oaModelsFetched && state.ai.oaModels && state.ai.oaModels.length) return state.ai.oaModels;
  try {
    const data = await oaFetch('/models');
    const ids = (data.data || data.models || []).map((m) => m.id || m.name).filter(Boolean).sort();
    state.ai.oaModels = ids; oaModelsFetched = true;
    return ids;
  } catch (e) {
    if (e.status === 401) throw e;
    return state.ai.oaModels || [];
  }
}
function pick(models, rank, fallback) {
  const c = models.map((m) => [m, rank(m)]).filter(([, r]) => r >= 0).sort((a, b) => a[1] - b[1]);
  return c.length ? c[0][0] : fallback;
}
async function oaTextModel() {
  if (state.ai.oaText) return state.ai.oaText;
  return pick(await oaListModels(), rankText, 'gpt-4o-mini');
}
async function oaImageModel() {
  if (genSettings().model) return genSettings().model;
  return pick(await oaListModels(), rankImage, 'gpt-image-1-mini');
}
async function openaiJSON(system, prompt) {
  const model = await oaTextModel();
  const body = { model, messages: [{ role: 'system', content: system }, { role: 'user', content: prompt }], response_format: { type: 'json_object' } };
  let data;
  try { data = await oaFetch('/chat/completions', body); }
  catch (e) {
    if (e.status === 400 && /response_format|json/i.test(e.raw || '')) { delete body.response_format; data = await oaFetch('/chat/completions', body); }
    else throw e;
  }
  const text = (((data.choices || [])[0] || {}).message || {}).content || '';
  const a = text.indexOf('{'); const b = text.lastIndexOf('}');
  if (a < 0 || b < a) throw new Error('Réponse inattendue de l’IA. Réessaie.');
  return JSON.parse(text.slice(a, b + 1));
}
function toJpeg(src) {
  return new Promise((resolve) => {
    const img = new Image();
    if (!src.startsWith('data:')) img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const w = Math.min(768, img.naturalWidth); const h = Math.round(img.naturalHeight * w / img.naturalWidth);
        const c = document.createElement('canvas'); c.width = w; c.height = h;
        c.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(c.toDataURL('image/jpeg', 0.82));
      } catch (e) { resolve(src); }
    };
    img.onerror = () => resolve(src);
    img.src = src;
  });
}
async function openaiImage(prompt) {
  const model = await oaImageModel();
  const dalle = /dall-e/.test(model);
  const body = dalle ? { model, prompt, n: 1, size: '1024x1024', response_format: 'b64_json' }
    : { model, prompt, n: 1, size: genSettings().size || IMAGE_SIZE, quality: genSettings().quality || 'medium' };
  let data;
  try { data = await oaFetch('/images/generations', body); }
  catch (e) {
    if (e.status === 400 && /size|quality/i.test(e.raw || '')) { delete body.quality; body.size = '1024x1024'; data = await oaFetch('/images/generations', body); }
    else throw e;
  }
  const d = (data.data || [])[0] || {};
  if (d.b64_json) return toJpeg('data:image/png;base64,' + d.b64_json);
  if (d.url) return toJpeg(d.url);
  throw new Error('Le service n’a pas renvoyé d’image.');
}
async function aiJSON(system, prompt, temperature) {
  return aiProvider() === 'openai' ? openaiJSON(system, prompt) : geminiJSON(system, prompt, temperature);
}

function constraintsText() {
  const p = state.profile;
  const allergies = p.allergies.map((a) => (ALLERGENS.find((x) => x.id === a) || {}).name).filter(Boolean);
  const diet = DIETS.find((d) => d.id === p.diet);
  const dislikes = p.dislikes.map((k) => ing(k).n).concat(p.dislikesText);
  const eq = EQUIPMENT.filter((e) => p.equipment.includes(e.id)).map((e) => e.name);
  return { allergies, diet: diet && diet.id !== 'aucun' ? diet.name : '', dislikes, eq, maxTime: p.maxTime, level: (LEVELS.find((l) => l.id === p.level) || {}).n };
}
function aiSheet(sh) {
  if ((sh.status === 'done' || sh.status === 'adjust') && sh.recipe) return previewSheet(sh, sh.recipe);
  const head = (title, back) => `<div class="sheet-head">${back ? `<button class="icon-btn" data-act="${back}" aria-label="Retour" style="margin-left:-12px">${ICONS.back}</button>` : ''}<h2 style="font-size:22px;flex:1">${title}</h2><button class="icon-btn" data-act="close-sheet" aria-label="Fermer">${ICONS.close}</button></div>`;
  if (!aiReady()) {
    return `<div class="sheet full" role="dialog" aria-modal="true" aria-label="Générer une recette">${head('Générer une recette')}<div class="sheet-body">
      <p style="margin:0;line-height:1.5">Pour créer des recettes avec l’IA, l’application a besoin d’une clé : celle de ton service compatible OpenAI, ou une clé Gemini gratuite.</p>
      ${keyForm()}</div></div>`;
  }
  if (sh.status === 'loading') {
    const msg = { tiktok: ['Lecture de la vidéo TikTok…', 'Récupération de sa description.'], site: ['Lecture de la page…', 'Récupération de la recette.'] }[sh.step] || ['Recette en préparation…', 'Quelques secondes.'];
    return `<div class="sheet full" role="dialog" aria-modal="true" aria-label="Générer une recette">${head('Générer une recette')}
      <div class="sheet-body"><div class="empty" style="padding:80px 10px"><span class="spinner" aria-hidden="true"></span><span class="big">${msg[0]}</span><span>${msg[1]}</span></div></div></div>`;
  }
  // 1. Choix de la méthode
  if (!sh.mode) {
    const choice = (mode, icon, title, desc) => `<button class="ai-choice" data-act="ai-mode" data-v="${mode}"><span class="ai-choice-ic" aria-hidden="true">${icon}</span><span><span class="ai-choice-t">${title}</span><span class="ai-choice-d">${desc}</span></span></button>`;
    return `<div class="sheet full" role="dialog" aria-modal="true" aria-label="Générer une recette">${head('Générer une recette')}
      <div class="sheet-body">
        <p class="muted" style="margin:0">D’où part ta recette ?</p>
        ${choice('tiktok', '♪', 'Depuis une vidéo TikTok', 'Colle le lien : l’appli lit la description de la vidéo (sans la regarder).')}
        ${choice('site', '🔗', 'Depuis Marmiton ou un site de recettes', 'Colle le lien de la page : la recette est reprise et mise en forme.')}
        ${choice('write', '✎', 'Écrire ma demande', 'Décris ce que tu veux avec tous les détails, ou colle une recette entière à mettre en forme.')}
      </div></div>`;
  }
  // 2. Saisie selon la méthode
  const c = constraintsText();
  const recap = [c.allergies.length ? 'sans ' + c.allergies.join(', ').toLowerCase() : '', c.diet, c.dislikes.length ? 'en évitant ' + c.dislikes.join(', ').toLowerCase() : '', c.maxTime ? 'en moins de ' + c.maxTime + ' min' : ''].filter(Boolean).join(' · ');
  const titles = { tiktok: 'Depuis TikTok', site: 'Depuis un site', write: 'Écrire ma demande' };
  let fields = '';
  if (sh.mode === 'write') {
    fields = `<div><label class="lbl" for="ai-q">Ta demande</label>
      <textarea class="input ai-q" id="ai-q" placeholder="Décris la recette que tu veux avec tous les détails (ingrédients, envies, temps…), ou colle une recette entière à remettre en forme ou à modifier.">${esc(sh.q)}</textarea>
      <details class="help" style="margin-top:6px"><summary>Exemples</summary>
        <ul style="padding-left:18px;margin:4px 0;line-height:1.5"><li>« Un plat réconfortant avec des lentilles et du lait de coco, prêt en 30 minutes »</li>
        <li>Une recette copiée depuis un message : elle sera mise en forme, ses quantités gardées</li>
        <li>« La même recette mais sans four et pour 2 » sous une recette collée</li></ul></details></div>`;
  } else {
    const ph = sh.mode === 'tiktok' ? 'https://vm.tiktok.com/… ou https://www.tiktok.com/@…/video/…' : 'https://www.marmiton.org/recettes/…';
    fields = `<div><label class="lbl" for="ai-link">${sh.mode === 'tiktok' ? 'Lien de la vidéo TikTok' : 'Lien de la recette (Marmiton, 750g, Cuisine AZ…)'}</label>
        <input class="input" id="ai-link" type="url" inputmode="url" value="${esc(sh.link || '')}" placeholder="${ph}" autocomplete="off"></div>
      <div><label class="lbl" for="ai-q">Consignes en plus (facultatif)</label>
        <textarea class="input ai-q small-q" id="ai-q" placeholder="Ex. : sans four, pour 2, plus épicé, remplacer la crème…">${esc(sh.q)}</textarea></div>`;
  }
  return `<div class="sheet full" role="dialog" aria-modal="true" aria-label="Générer une recette">${head(titles[sh.mode], 'ai-mode-back')}
    <div class="sheet-body has-foot">${fields}
      <div class="row between"><span>Pour</span>${stepper('ai-persons', sh.persons, 'Nombre de personnes')}</div>
      ${recap ? `<p class="muted small" style="margin:0">Tes critères seront respectés : ${esc(recap)}.</p>` : ''}
      ${sh.status === 'error' ? `<p class="card-warn" style="margin:0;font-size:14px">${esc(sh.error)}</p>` : ''}
    </div>
    <div class="sheet-foot"><button class="btn primary" data-act="ai-generate">${ICONS.spark} Générer la recette</button></div></div>`;
}
function previewSheet(sh, r) {
  const reason = hiddenReason(r);
  const dis = dislikedIn(r);
  const adjusting = sh.status === 'adjust';
  return `<div class="sheet full" role="dialog" aria-modal="true" aria-label="${esc(r.n)}">
    <div class="sheet-head">
      <button class="icon-btn" data-act="ai-back" aria-label="Revenir à la demande" style="margin-left:-12px">${ICONS.back}</button>
      <span class="muted small" style="flex:1">${sh.versions > 1 ? 'Version ' + sh.versions : ''}</span>
      <button class="icon-btn" data-act="close-sheet" aria-label="Fermer">${ICONS.close}</button></div>
    <div class="sheet-body has-foot">
      ${adjusting ? `<div class="adjust-box">
        <label class="lbl" for="ai-adjust">Que veux-tu changer dans cette recette ?</label>
        <textarea class="input ai-q small-q" id="ai-adjust" placeholder="Ex. : remplace la crème par du lait de coco, ajoute des champignons, pour 4 personnes, moins sucré…">${esc(sh.adjustText || '')}</textarea>
        <p class="muted small" style="margin:0">La recette ci-dessous sert de base : seuls tes changements sont appliqués.</p>
        <div class="row" style="gap:10px"><button class="btn" style="flex:1" data-act="ai-adjust-cancel">Annuler</button><button class="btn primary" style="flex:1" data-act="ai-adjust-go">${ICONS.spark} Appliquer</button></div>
      </div>` : ''}
      ${heroHtml(r)}
      <div class="kicker">${esc((TYPES.find((t) => t.id === r.type) || {}).name || '')} · Proposée par l’IA</div>
      <h2>${esc(r.n)}</h2>
      <div class="muted small">${r.t} min · ${DIFF[r.d] || ''} · pour ${yieldText(r.p, r)}</div>
      ${r.aiNote ? `<div class="card-note" style="font-size:14px">${esc(r.aiNote)}</div>` : ''}
      ${sourceHtml(r)}
      ${reason ? `<div class="card-warn">Attention : cette recette ne correspond pas entièrement à ton profil (${{ regime: 'régime ou allergie', equipement: 'équipement', niveau: 'niveau', temps: 'temps' }[reason]}).</div>` : ''}
      ${dis.length ? `<div class="card-warn">Contient ${esc(dis.join(', ').toLowerCase())}, que tu n’aimes pas.</div>` : ''}
      <div class="section-title" style="margin-top:6px">Ingrédients</div>
      <div>${groupIngredients(r.i).map((g) => `${g.name ? `<div class="part-title">${esc(g.name)}</div>` : ''}${g.items.map(([k, q, u]) => `<div class="ing-line"><span>${esc(ing(k).n)}</span><span>${fmtQty(q, u, k, false)}</span></div>`).join('')}`).join('')}</div>
      ${stepsHtml(r)}
      <p class="muted small" style="margin:0">Recette générée automatiquement : vérifie les cuissons et les quantités avant de te lancer.</p>
    </div>
    ${adjusting ? '' : `<div class="sheet-foot" style="flex-wrap:wrap">
      <button class="btn" data-act="ai-again">Une autre version</button>
      <button class="btn" data-act="ai-adjust">Modifier ma demande</button>
      <button class="btn" data-act="ai-save">Enregistrer</button>
      <button class="btn primary" data-act="ai-save-menu">Enregistrer + menu</button>
    </div>`}</div>`;
}

const GEMINI_API = 'https://generativelanguage.googleapis.com/v1beta/';
let geminiModelsCache = null;
/* Liste les modèles réellement accessibles avec la clé (les noms changent souvent chez Google). */
async function geminiModels() {
  if (geminiModelsCache) return geminiModelsCache;
  let found = [];
  try {
    const res = await fetch(GEMINI_API + 'models?pageSize=200', { headers: { 'x-goog-api-key': state.ai.key } });
    if (res.ok) {
      const data = await res.json();
      const ver = (n) => (n.match(/(\d+(?:\.\d+)?)/) || [0, 0])[1] * 1;
      found = (data.models || [])
        .filter((m) => (m.supportedGenerationMethods || []).includes('generateContent'))
        .map((m) => m.name.replace(/^models\//, ''))
        .filter((n) => /flash/.test(n) && !/(image|tts|audio|live|embedding|thinking|exp|vision|robotics|computer|native)/.test(n))
        .sort((x, y) => (/lite/.test(x) - /lite/.test(y)) || (/preview/.test(x) - /preview/.test(y)) || ver(y) - ver(x));
    } else if (res.status === 400 || res.status === 403) {
      const data = await res.json().catch(() => ({}));
      throw new Error('La clé Gemini n’est pas valide ou n’a pas accès à l’API (' + ((data.error && data.error.message) || res.status) + ').');
    }
  } catch (e) {
    if (e instanceof TypeError) throw new Error('Pas de connexion à Google. Vérifie ta connexion internet.');
    if (/clé/.test(e.message)) throw e;
  }
  const list = [state.ai.model].concat(found, GEMINI_FALLBACK).filter(Boolean);
  geminiModelsCache = [...new Set(list)];
  return geminiModelsCache;
}

async function geminiJSON(system, prompt, temperature) {
  const models = await geminiModels();
  let lastErr = null; const tried = [];
  for (const model of models.slice(0, 8)) {
    tried.push(model);
    for (let attempt = 0; attempt < 2; attempt++) {
      let res;
      try {
        res = await fetch(`${GEMINI_API}models/${model}:generateContent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': state.ai.key },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: system }] },
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json', temperature: temperature ?? 0.7 }
          })
        });
      } catch (e) { throw new Error('Pas de connexion internet. Réessaie quand tu as du réseau.'); }
      const data = await res.json().catch(() => ({}));
      const msg = (data.error && data.error.message) || '';
      if (res.ok) {
        const text = ((data.candidates || [])[0]?.content?.parts || []).filter((p) => !p.thought).map((p) => p.text || '').join('');
        const a = text.indexOf('{'); const b = text.lastIndexOf('}');
        if (a < 0 || b < a) { lastErr = lastErr || new Error('Réponse inattendue de l’IA. Réessaie.'); break; }
        if (state.ai.model !== model) { state.ai.model = model; save(); }
        return JSON.parse(text.slice(a, b + 1));
      }
      if (res.status === 400 && /api key/i.test(msg)) throw new Error('La clé Gemini n’est pas valide. Vérifie-la dans ton Profil.');
      if (res.status === 403) throw new Error('La clé Gemini est refusée (' + (msg || '403') + ').');
      if (res.status === 429) { lastErr = new Error('Quota gratuit atteint pour le moment. Réessaie dans quelques minutes.'); break; }
      if (res.status >= 500) { lastErr = new Error('Le service Gemini est momentanément surchargé. Réessaie dans un instant.'); await new Promise((ok) => setTimeout(ok, 1500)); continue; }
      if (res.status === 404) { if (state.ai.model === model) state.ai.model = ''; break; }
      lastErr = new Error('Erreur Gemini (' + res.status + ') : ' + msg); break;
    }
  }
  throw lastErr || new Error('Aucun modèle Gemini n’est accessible avec cette clé (essayés : ' + tried.join(', ') + ').');
}

async function testKey() {
  readKeyForm(); save();
  toast('Test en cours…');
  try {
    if (aiProvider() === 'openai') {
      const models = await oaListModels();
      const t = await oaTextModel(); const i = await oaImageModel();
      await openaiJSON('Tu réponds en JSON.', 'Réponds exactement {"ok": true}');
      state.ai.oaInfo = `Connexion réussie. Recettes : ${t}. Images : ${i}${models.length ? '' : ' (liste des modèles indisponible, valeur par défaut)'}.`;
      save(); render(); toast('La clé fonctionne');
    } else {
      geminiModelsCache = null;
      await geminiJSON('Tu réponds en JSON.', 'Réponds exactement {"ok": true}', 0);
      toast('La clé fonctionne (modèle ' + state.ai.model + ')');
    }
  } catch (e) { state.ai.oaInfo = ''; toast(e.message); render(); }
}

const AISLE_IDS = () => AISLES.map((a) => a.id);
const RECIPE_SCHEMA = (persons) => `{
  "nom": "nom de la recette en français",
  "emoji": "un seul emoji représentant le plat",
  "type": "plat" | "soupe" | "salade" | "dessert" | "brunch",
  "temps_min": nombre de minutes au total,
  "difficulte": 1 | 2 | 3,
  "portions": nombre (celui de la recette fournie s'il est indiqué, sinon ${persons}),
  "unite_portions": "personnes" | "pièces" | "parts" (pièces pour ce qui se compte à l'unité : cookies, muffins, crêpes… ; parts pour un gâteau ou une tarte),
  "equipement": liste parmi ["plaques", "four", "micro", "mixeur", "airfryer"],
  "ingredients": [ { "partie": "nom de la partie si la recette en a plusieurs (ex. : Pâte, Garniture, Crumble), sinon chaîne vide", "nom": "…", "quantite": nombre, "unite": "g" | "ml" | "pc" | "sachet" | "cs" | "cc" | "pincee" ou une autre unité courte en texte, "rayon": "fl" | "bp" | "cr" | "bo" | "ep" | "es" | "su" | "sg" | "bs" | "au" } ],
  "etapes": [ "de 5 à 9 étapes détaillées, avec temps, températures et repères visuels" ],
  "astuces": [ "1 à 3 astuces utiles" ],
  "image_query": "2 à 4 mots-clés en anglais pour trouver une photo du plat (ex. : gnocchi tomato sauce)",
  "image_description": "une phrase en anglais (15 à 30 mots) décrivant le plat fini dans l'assiette",
  "remarque": "adaptation ou information complétée, sinon chaîne vide"
}
Rayons : fl fruits et légumes, bp boucherie et poissonnerie, cr crèmerie et frais, bo boulangerie, ep épicerie salée, es épices et condiments, su épicerie sucrée, sg surgelés, bs boissons, au autres.
Unités : "pc" pour ce qui se compte (œufs, oignons, gousses d'ail, citrons, tranches…).`;
function constraintsPrompt() {
  const c = constraintsText();
  return `Contraintes de l'utilisateur, à respecter absolument :
- Ne jamais utiliser d'ingrédient contenant : ${c.allergies.length ? c.allergies.join(', ') : 'aucune allergie'}.
- Régime : ${c.diet || 'aucun régime particulier'}.
- Éviter si possible : ${c.dislikes.length ? c.dislikes.join(', ') : 'rien'}.
- Temps total maximum : ${c.maxTime ? c.maxTime + ' minutes' : 'pas de limite'}.
- Niveau en cuisine : ${c.level || 'intermédiaire'}.
- Équipement disponible uniquement : ${c.eq.join(', ') || 'plaques de cuisson'}.
Si la demande est incompatible avec ces contraintes, adapte la recette (par exemple une version végétarienne) et explique l'adaptation dans "remarque".`;
}
const AI_SYSTEM = 'Tu es un chef cuisinier français qui écrit des recettes familiales claires, fiables et détaillées pour une application de menus et de liste de courses. Tu réponds uniquement avec un objet JSON valide, sans aucun texte autour.';
function readAiInput() {
  if (!ui.sheet) return;
  const q = $('#ai-q'); if (q) ui.sheet.q = q.value;
  const l = $('#ai-link'); if (l) ui.sheet.link = l.value.trim();
  const a = $('#ai-adjust'); if (a) ui.sheet.adjustText = a.value;
}
/* Transforme la réponse JSON de l'IA en recette de l'appli */
function recipeFromAI(j, sh, extra) {
  const typeIds = TYPES.map((t) => t.id);
  const units = ['g', 'ml', 'pc', 'sachet', 'cs', 'cc', 'pincee'];
  const ings = (Array.isArray(j.ingredients) ? j.ingredients : []).filter((x) => x && x.nom).map((x) => {
    let key = findIngredientByName(x.nom);
    if (!key) {
      key = 'x_' + norm(x.nom).replace(/[^a-z0-9]+/g, '_');
      if (!state.customIngs[key]) state.customIngs[key] = { n: x.nom.charAt(0).toUpperCase() + x.nom.slice(1), a: AISLE_IDS().includes(x.rayon) ? x.rayon : 'au' };
    }
    const q = parseFloat(String(x.quantite).replace(',', '.'));
    const u = String(x.unite || '').trim();
    const line = [key, isFinite(q) && q > 0 ? q : 1, units.includes(u) ? u : (u && u.length <= 15 ? unitFromLabel(u) : 'pc')];
    if (x.partie && String(x.partie).trim()) line.push(String(x.partie).trim());
    return line;
  });
  if (!j.nom || !ings.length) throw new Error('La recette reçue est incomplète. Réessaie.');
  return Object.assign({
    id: 'ai_' + uid(), custom: true, ai: true, preview: true,
    n: String(j.nom).trim(), e: String(j.emoji || '🍽️').trim().slice(0, 4),
    type: typeIds.includes(j.type) ? j.type : 'plat',
    t: clampInt(parseInt(j.temps_min, 10) || 30, 1, 999), d: [1, 2, 3].includes(+j.difficulte) ? +j.difficulte : 1,
    pu: ({ pieces: 'pieces', parts: 'parts' })[norm(j.unite_portions)] || 'pers',
    p: parseInt(j.portions, 10) > 0 ? clampInt(parseInt(j.portions, 10), 1, 200) : sh.persons, s: [],
    eq: (Array.isArray(j.equipement) ? j.equipement : []).filter((e) => EQUIPMENT.some((x) => x.id === e)),
    i: ings,
    st: (Array.isArray(j.etapes) ? j.etapes : []).map(String).filter(Boolean),
    tips: (Array.isArray(j.astuces) ? j.astuces : []).map(String).filter(Boolean),
    imgQuery: String(j.image_query || '').slice(0, 80),
    imgPrompt: String(j.image_description || '').slice(0, 300),
    aiNote: String(j.remarque || '').trim()
  }, extra || {});
}
/* Recette de l'appli → même format JSON que celui demandé à l'IA (pour l'ajuster) */
function recipeToAIJSON(r) {
  return {
    nom: r.n, emoji: r.e, type: r.type, temps_min: r.t, difficulte: r.d, portions: r.p,
    unite_portions: { pers: 'personnes', pieces: 'pièces', parts: 'parts' }[r.pu || 'pers'], equipement: r.eq || [],
    ingredients: r.i.map(([k, q, u, g]) => ({ partie: g || '', nom: ing(k).n, quantite: q, unite: u, rayon: ing(k).a || 'au' })),
    etapes: r.st || [], astuces: r.tips || [], image_query: r.imgQuery || '', image_description: r.imgPrompt || '', remarque: ''
  };
}
async function aiGenerate(again) {
  const sh = ui.sheet;
  if (!sh || sh.kind !== 'ai') return;
  readAiInput();
  const mode = sh.mode || 'write';
  const text = String(sh.q || '').trim();
  const link = mode === 'write' ? (findTikTok(text) || null) : (sh.link || '');
  if (mode !== 'write' && !link) { toast('Colle d’abord le lien'); return; }
  if (mode === 'write' && !text) { toast('Écris ta demande'); return; }
  sh.status = 'loading'; sh.recipe = null; renderOverlays();
  let source = null; let sourceText = '';
  try {
    if (link && (mode === 'tiktok' || findTikTok(link))) {
      sh.step = 'tiktok'; renderOverlays();
      const t = await tiktokCaption(link);
      source = { url: link, label: 'Vidéo TikTok' + (t.author ? ' de ' + t.author : '') };
      sourceText = `Description de la vidéo TikTok${t.author ? ' de ' + t.author : ''} (seule cette description est disponible, pas la vidéo) :\n"""\n${t.caption}\n"""`;
    } else if (link) {
      sh.step = 'site'; renderOverlays();
      const w = await webRecipe(link);
      source = { url: link, label: w.site + (w.name ? ' : ' + w.name : '') };
      sourceText = `Recette trouvée sur la page ${w.site} (à reprendre fidèlement) :\n"""\n${w.text}\n"""`;
    }
  } catch (e) { sh.status = 'error'; sh.step = ''; sh.error = e.message; if (ui.sheet === sh) renderOverlays(); return; }
  sh.step = ''; if (ui.sheet === sh) renderOverlays();
  const names = [...new Set(Object.values(INGREDIENTS).map((i) => i.n))].join(', ');
  const prompt = `${mode === 'write' ? `Demande de l'utilisateur (un nom de plat, une description détaillée, ou une recette complète copiée à remettre en forme ou à modifier) :\n"""\n${text}\n"""` : `Consignes de l'utilisateur : ${text || 'aucune, reprends simplement la recette'}`}
${sourceText}
${again ? 'Propose une version différente de la précédente.' : ''}
Si une recette complète est fournie (texte collé, page web ou description de vidéo), reprends fidèlement ses ingrédients, quantités et étapes en les mettant en forme ; n'invente pas ce qui y est déjà précisé et applique les consignes. Si des informations manquent (quantités, temps, étapes), complète-les de façon réaliste et signale-le en une phrase dans "remarque".
Nombre de personnes : ${sh.persons}, sauf si la recette fournie indique son propre nombre de portions ou de pièces : garde alors le sien.

${constraintsPrompt()}

Pour les ingrédients, réutilise exactement ces noms quand c'est le même produit : ${names}.

Réponds avec ce JSON :
${RECIPE_SCHEMA(sh.persons)}`;
  try {
    const j = await aiJSON(AI_SYSTEM, prompt, again ? 1 : 0.7);
    sh.recipe = recipeFromAI(j, sh, { query: (text || link).slice(0, 300), source });
    sh.status = 'done'; sh.versions = (sh.versions || 0) + 1; sh.keepScroll = false;
  } catch (e) { sh.status = 'error'; sh.error = e.message || 'Erreur'; }
  if (ui.sheet === sh) renderOverlays();
}
/* « Modifier ma demande » : la recette générée sert de base, seules les nouvelles consignes sont appliquées */
async function aiAdjust() {
  const sh = ui.sheet;
  if (!sh || !sh.recipe) return;
  readAiInput();
  const changes = String(sh.adjustText || '').trim();
  if (!changes) { toast('Écris ce que tu veux changer'); return; }
  const base = sh.recipe;
  sh.status = 'loading'; renderOverlays();
  const names = [...new Set(Object.values(INGREDIENTS).map((i) => i.n))].join(', ');
  const prompt = `Voici une recette existante (au format JSON) :
${JSON.stringify(recipeToAIJSON(base), null, 1)}

Modifie-la selon ces consignes de l'utilisateur :
"""
${changes}
"""
Garde tout ce qui n'est pas concerné par les consignes (ingrédients, quantités, étapes, nom si pertinent). Ajuste les quantités, les étapes et le temps de façon cohérente avec les changements. Résume en une phrase ce qui a changé dans "remarque".

${constraintsPrompt()}

Pour les ingrédients, réutilise exactement ces noms quand c'est le même produit : ${names}.

Réponds avec la recette complète modifiée, dans ce JSON :
${RECIPE_SCHEMA(base.p)}`;
  try {
    const j = await aiJSON(AI_SYSTEM, prompt, 0.4);
    sh.recipe = recipeFromAI(j, sh, { query: base.query, source: base.source });
    sh.status = 'done'; sh.versions = (sh.versions || 1) + 1; sh.adjustText = ''; sh.keepScroll = false;
  } catch (e) { sh.status = 'adjust'; sh.recipe = base; toast(e.message || 'Modification impossible pour le moment'); }
  if (ui.sheet === sh) renderOverlays();
}
function aiSave(toMenu) {
  const sh = ui.sheet;
  if (!sh || !sh.recipe) return;
  const r = Object.assign({}, sh.recipe); delete r.preview;
  state.custom.push(r);
  if (sh.ideaName) state.ideas = state.ideas.filter((x) => x.nom !== sh.ideaName);
  if (toMenu) addToMenu(r.id, r.p); else toast('Recette enregistrée dans Mes recettes');
  save();
  ui.sheet = { kind: 'recipe', id: r.id, servings: r.p };
  render();
  if (openaiReady()) generateImageFor(r.id); else searchPhotoFor(r.id);
}

/* ---------- Idées IA : 10 nouvelles recettes à chaque rafraîchissement ---------- */
let ideasLoading = false;
function renderIdeas() {
  const ideas = state.ideas || [];
  const head = `<div class="ideas-head">
      <p class="muted small" style="margin:0">Des recettes qui ne sont pas encore dans ton carnet, choisies selon ton profil et la saison.</p>
      <button class="btn dark block" data-act="ideas-refresh" ${ideasLoading ? 'disabled' : ''}>${ideasLoading ? '<span class="spinner small-spin" aria-hidden="true"></span> Recherche d’idées…' : (ideas.length ? '↻ Rafraîchir : 10 nouvelles idées' : '✦ Proposer 10 nouvelles recettes')}</button>
    </div>`;
  if (!ideas.length) {
    return head + (ideasLoading ? '' : `<div class="empty"><span>${aiReady() ? 'Touche le bouton pour découvrir 10 recettes qui ne sont pas encore dans l’appli.' : 'Pour proposer de nouvelles recettes, l’appli a besoin de ta clé d’IA (Profil → Assistant IA).'}</span></div>`);
  }
  const shown = ideas.map((x, i) => [x, i]).filter(([x]) => ui.type === 'tous' || x.type === ui.type);
  if (!shown.length) return head + '<div class="empty"><span>Aucune idée de ce type dans cette série. Rafraîchis pour en voir d’autres.</span></div>';
  return head + '<div class="grid">' + shown.map(([x, i]) => `<div class="card">
      <div class="tile" style="background:${hashColor(x.nom)}">
        <span class="tile-emoji" aria-hidden="true">${esc(x.emoji || '🍽️')}</span>
        ${x.photo ? `<img class="tile-img" src="${esc(x.photo)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">` : ''}
        <button class="tile-open" data-act="idea-open" data-v="${i}" aria-label="Voir la recette ${esc(x.nom)}"></button>
        <span class="idea-tag">Nouveau</span>
      </div>
      <button class="card" data-act="idea-open" data-v="${i}" style="gap:4px">
        <span class="card-name">${esc(x.nom)}</span>
        <span class="card-meta">${x.temps_min ? x.temps_min + ' min · ' : ''}${DIFF[x.difficulte] || ''}</span>
        ${x.description ? `<span class="card-meta" style="font-style:italic">${esc(x.description)}</span>` : ''}
      </button>
    </div>`).join('') + '</div>' + (ideasLoading ? '' : '<p class="muted small" style="text-align:center;margin:20px 0 0">Touche une idée pour voir la recette complète, puis enregistre-la dans ton carnet.</p>');
}
function refreshResultsView() { const res = $('#results'); if (res && ui.tab === 'decouvrir' && ui.filter === 'idees') res.innerHTML = renderIdeas(); }
async function refreshIdeas() {
  if (ideasLoading) return;
  if (!aiReady()) { ui.sheet = { kind: 'ai', q: '', persons: state.profile.persons, status: 'idle' }; renderOverlays(); return; }
  ideasLoading = true; refreshResultsView();
  const c = constraintsText();
  const existing = [...new Set(allRecipes().map((r) => r.n).concat(state.ideasSeen || []))];
  const season = SEASONS[currentSeason()].toLowerCase();
  const system = 'Tu es un chef cuisinier français qui propose des idées de recettes familiales variées. Tu réponds uniquement avec un objet JSON valide.';
  const prompt = `Propose exactement 10 idées de recettes, variées (cuisines du monde et françaises, plats, soupes, salades, quelques desserts ou petits-déjeuners), adaptées à la saison (${season}).
Elles doivent être différentes de toutes ces recettes, déjà connues de l'utilisateur : ${existing.join(' ; ')}.

Contraintes à respecter absolument :
- Ne jamais utiliser : ${c.allergies.length ? c.allergies.join(', ') : 'aucune allergie'}.
- Régime : ${c.diet || 'aucun régime particulier'}.
- Éviter si possible : ${c.dislikes.length ? c.dislikes.join(', ') : 'rien'}.
- Temps total maximum : ${c.maxTime ? c.maxTime + ' minutes' : 'pas de limite'}.
- Équipement disponible : ${c.eq.join(', ') || 'plaques de cuisson'}.
- Niveau : ${c.level || 'intermédiaire'}.

Réponds avec ce JSON :
{ "idees": [ { "nom": "nom de la recette en français", "emoji": "un emoji", "type": "plat" | "soupe" | "salade" | "dessert" | "brunch", "temps_min": nombre, "difficulte": 1 | 2 | 3, "description": "une phrase courte et appétissante (12 mots maximum)", "image_query": "2 à 4 mots-clés en anglais pour trouver une photo du plat" } ] }`;
  try {
    const j = await aiJSON(system, prompt, 1);
    const known = new Set(existing.map(norm));
    const list = (Array.isArray(j.idees) ? j.idees : []).filter((x) => x && x.nom && !known.has(norm(x.nom))).slice(0, 10)
      .map((x) => ({ nom: String(x.nom).trim(), emoji: String(x.emoji || '🍽️').slice(0, 4), type: x.type, temps_min: parseInt(x.temps_min, 10) || 0, difficulte: [1, 2, 3].includes(+x.difficulte) ? +x.difficulte : 1, description: String(x.description || '').trim(), image_query: String(x.image_query || '').trim() }));
    if (!list.length) throw new Error('Aucune idée reçue. Réessaie.');
    state.ideas = list;
    state.ideasSeen = (state.ideasSeen || []).concat(list.map((x) => x.nom)).slice(-300);
    save();
    ideasLoading = false; refreshResultsView();
    // Vraies photos en ligne pour illustrer les idées (gratuit)
    for (const x of list) {
      if (!x.image_query) continue;
      try { const found = await searchCommons(x.image_query); if (found.length) { x.photo = found[0].src; refreshResultsView(); } } catch (e) { break; }
    }
    save();
  } catch (e) {
    ideasLoading = false; refreshResultsView();
    toast(e.message || 'Impossible de proposer des idées pour le moment');
  }
}
function openIdea(i) {
  const x = (state.ideas || [])[i];
  if (!x) return;
  ui.sheet = { kind: 'ai', q: x.nom + (x.description ? ' : ' + x.description : ''), persons: state.profile.persons, status: 'idle', mode: 'write', ideaName: x.nom };
  renderOverlays();
  aiGenerate();
}

/* Section « Image » de l'éditeur : ma photo, photo en ligne ou image générée (avec consignes) */
function editorImageHtml(sh) {
  const r = sh.editId ? recipeById(sh.editId) : null;
  if (!r) return '<div><span class="lbl">Image</span><p class="muted small" style="margin:4px 0 0">Tu pourras ajouter ta photo ou en générer une après l’enregistrement.</p></div>';
  const p = photoOf(r); const n = photoList(r).length; const pending = imgPending[r.id];
  const own = !!genCache['own:' + r.id];
  return `<div><span class="lbl">Image</span>
    <div class="ed-image">
      <div class="ed-thumb" style="background:${hashColor(r.id)}"><span aria-hidden="true">${r.e || '🍽️'}</span>${p ? `<img src="${esc(p.src)}" alt="" referrerpolicy="no-referrer" onerror="this.remove()">` : ''}</div>
      <div class="ed-image-actions">
        ${pending ? '<span class="muted small">Image en cours…</span>' : `
          <button type="button" class="link" data-act="pick-photo" data-v="${r.id}">Choisir dans ma galerie</button>
          ${own ? `<button type="button" class="link" data-act="rm-own-photo" data-v="${r.id}">Retirer ma photo</button>` : ''}
          ${n > 1 ? `<button type="button" class="link" data-act="next-photo" data-v="${r.id}">Autre image (${(((state.photos[r.id] || {}).idx || 0) % n) + 1}/${n})</button>` : ''}
          <button type="button" class="link" data-act="search-photo" data-v="${r.id}">Chercher une photo en ligne</button>`}
      </div>
    </div>
    <input type="file" id="photo-file" accept="image/*" data-v="${r.id}" hidden>
    ${openaiReady() ? `<div style="margin-top:12px"><label class="lbl" for="ed-img-note">Consignes pour l’image générée (facultatif)</label>
      <textarea class="input img-note" id="ed-img-note" name="img-note" placeholder="Ex. : servi dans un bol bleu, avec du persil, vue du dessus, sans pain…">${esc(sh.draft.imgNote || '')}</textarea>
      ${pending ? '' : `<button type="button" class="btn" style="margin-top:8px" data-act="gen-image" data-v="${r.id}">${ICONS.spark} Générer une nouvelle image</button>`}</div>` : ''}
  </div>`;
}
/* Photo prise ou choisie dans la galerie du téléphone */
function readFileAsDataUrl(file) { return new Promise((res, rej) => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.onerror = rej; fr.readAsDataURL(file); }); }
function compressPhoto(dataUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const w = Math.min(1200, img.naturalWidth); const h = Math.round(img.naturalHeight * w / img.naturalWidth);
        const c = document.createElement('canvas'); c.width = w; c.height = h;
        c.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(c.toDataURL('image/jpeg', 0.85));
      } catch (e) { resolve(dataUrl); }
    };
    img.onerror = () => resolve(null);
    img.src = dataUrl;
  });
}
async function useOwnPhoto(id, file) {
  if (!file || !/^image\//.test(file.type || 'image/')) { toast('Ce fichier n’est pas une image'); return; }
  try {
    const src = await compressPhoto(await readFileAsDataUrl(file));
    if (!src) throw new Error();
    storeGenerated('own:' + id, src);
    state.photos = state.photos || {}; setPhotoIdx(id, 0);
    toast('Photo ajoutée'); render();
  } catch (e) { toast('Impossible de lire cette photo'); }
}
function removeOwnPhoto(id) {
  delete genCache['own:' + id];
  try { if (idb) idb.transaction('images', 'readwrite').objectStore('images').delete('own:' + id); } catch (e) { /* ignore */ }
  setPhotoIdx(id, 0); toast('Photo retirée'); render();
}
document.addEventListener('change', (e) => {
  if (e.target.id === 'photo-file' && e.target.files && e.target.files[0]) { if (ui.sheet && ui.sheet.kind === 'editor') readEditorForm(); useOwnPhoto(e.target.dataset.v, e.target.files[0]); e.target.value = ''; }
});

/* ---------- Liens TikTok et sites de recettes ---------- */
function findTikTok(text) {
  const m = String(text || '').match(/https?:\/\/(?:www\.|vm\.|vt\.|m\.)?tiktok\.com\/[^\s"'<>]+/i);
  return m ? m[0].replace(/[).,;!?]+$/, '') : null;
}
const BROWSER_UA = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36';
/* Requête « comme un navigateur » : dans l'appli, passe par le moteur natif (pas de blocage CORS, adresse finale connue) */
async function httpGet(url, opts) {
  opts = opts || {};
  const headers = Object.assign({ 'User-Agent': BROWSER_UA, 'Accept-Language': 'fr-FR,fr;q=0.9' }, opts.headers || {});
  const native = window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform() && window.Capacitor.Plugins && window.Capacitor.Plugins.CapacitorHttp;
  if (native) {
    const r = await native.request({ url, method: 'GET', headers, responseType: 'text', disableRedirects: !!opts.noRedirect, connectTimeout: 15000, readTimeout: 20000 });
    const h = {}; Object.keys(r.headers || {}).forEach((k) => { h[k.toLowerCase()] = r.headers[k]; });
    return { status: r.status, url: r.url || url, headers: h, text: typeof r.data === 'string' ? r.data : JSON.stringify(r.data) };
  }
  const r = await fetch(url, { redirect: opts.noRedirect ? 'manual' : 'follow' });
  const h = {}; r.headers.forEach((v, k) => { h[k] = v; });
  return { status: r.status, url: r.url || url, headers: h, text: await r.text() };
}
function decodeEntities(s) {
  return String(s || '').replace(/&quot;/g, '"').replace(/&#39;|&#x27;/g, "'").replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#(\d+);/g, (m, n) => String.fromCharCode(+n));
}
async function tiktokCaption(url) {
  const oembed = async (u) => {
    const r = await httpGet('https://www.tiktok.com/oembed?url=' + encodeURIComponent(u), { headers: { Accept: 'application/json' } });
    if (r.status !== 200) throw new Error('HTTP ' + r.status);
    const j = JSON.parse(r.text);
    if (!j || (!j.title && !j.author_name)) throw new Error('vide');
    return { caption: String(j.title || '').trim(), author: j.author_unique_id || j.author_name ? '@' + String(j.author_unique_id || j.author_name).replace(/^@/, '') : '' };
  };
  const fromHtml = (html) => {
    // Description dans les données de la page, sinon dans la balise og:description
    let m = html.match(/"desc":"((?:[^"\\]|\\.)*)"/);
    if (m) { try { const d = JSON.parse('"' + m[1] + '"'); if (d.trim()) return { caption: d.trim(), author: ((html.match(/"uniqueId":"([^"]+)"/) || [])[1] ? '@' + html.match(/"uniqueId":"([^"]+)"/)[1] : '') }; } catch (e) { /* ignore */ } }
    m = html.match(/<meta[^>]+(?:property|name)="og:description"[^>]+content="([^"]*)"/i) || html.match(/<meta[^>]+content="([^"]*)"[^>]+(?:property|name)="og:description"/i);
    if (m && decodeEntities(m[1]).trim()) return { caption: decodeEntities(m[1]).trim(), author: '' };
    return null;
  };
  let full = /\/(video|photo)\/\d+/.test(url) ? url.split('?')[0] : null;
  let html = '';
  // Lien court (vm.tiktok.com…) : on récupère l'adresse complète de la vidéo
  if (!full) {
    try {
      const r = await httpGet(url, { noRedirect: true });
      const loc = r.headers.location;
      if (loc && /\/(video|photo)\/\d+/.test(loc)) full = loc.split('?')[0];
    } catch (e) { /* on essaie autrement */ }
    if (!full) {
      try {
        const r = await httpGet(url);
        html = r.text || '';
        if (r.url && /\/(video|photo)\/\d+/.test(r.url)) full = r.url.split('?')[0];
        else { const m = html.match(/https:\/\/www\.tiktok\.com\/@[\w.-]+\/(?:video|photo)\/\d+/); if (m) full = m[0]; }
      } catch (e) { /* ignore */ }
    }
  }
  const tries = [full, url].filter(Boolean);
  for (const u of tries) { try { const info = await oembed(u); if (info.caption) return info; } catch (e) { /* suivant */ } }
  if (!html && full) { try { html = (await httpGet(full)).text || ''; } catch (e) { /* ignore */ } }
  const info = html ? fromHtml(html) : null;
  if (info) return info;
  throw new Error('Impossible de lire cette vidéo TikTok (vidéo privée ou supprimée, lien incomplet ou pas de connexion). Tu peux aussi copier sa description et utiliser « Écrire ma demande ».');
}
/* Page de recette (Marmiton, 750g, Cuisine AZ…) : on lit les données « Recipe » de la page */
async function webRecipe(url) {
  let r;
  try { r = await httpGet(url); } catch (e) { throw new Error('Impossible d’ouvrir cette page. Vérifie le lien et ta connexion.'); }
  if (r.status >= 400) throw new Error('La page n’est pas accessible (erreur ' + r.status + ').');
  const html = r.text || '';
  const site = (() => { try { return new URL(r.url || url).hostname.replace(/^www\./, ''); } catch (e) { return 'le site'; } })().replace(/^marmiton\.org$/, 'Marmiton');
  const blocks = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1]);
  let recipe = null;
  const visit = (o) => {
    if (!o || recipe) return;
    if (Array.isArray(o)) { o.forEach(visit); return; }
    if (typeof o !== 'object') return;
    const t = o['@type']; if (t === 'Recipe' || (Array.isArray(t) && t.includes('Recipe'))) { recipe = o; return; }
    if (o['@graph']) visit(o['@graph']);
  };
  blocks.forEach((b) => { try { visit(JSON.parse(b.trim())); } catch (e) { /* bloc illisible */ } });
  const isoMin = (d) => { const m = String(d || '').match(/PT(?:(\d+)H)?(?:(\d+)M)?/); return m ? (+(m[1] || 0)) * 60 + (+(m[2] || 0)) : 0; };
  if (recipe) {
    const steps = [];
    const addStep = (s) => { if (!s) return; if (typeof s === 'string') steps.push(decodeEntities(s)); else if (s.itemListElement) [].concat(s.itemListElement).forEach(addStep); else if (s.text) steps.push(decodeEntities(s.text)); };
    [].concat(recipe.recipeInstructions || []).forEach(addStep);
    const text = [
      'Nom : ' + decodeEntities(recipe.name || ''),
      recipe.recipeYield ? 'Portions : ' + [].concat(recipe.recipeYield).join(' / ') : '',
      isoMin(recipe.totalTime) ? 'Temps total : ' + isoMin(recipe.totalTime) + ' min' : (isoMin(recipe.cookTime) ? 'Cuisson : ' + isoMin(recipe.cookTime) + ' min' : ''),
      'Ingrédients :', ...[].concat(recipe.recipeIngredient || []).map((x) => '- ' + decodeEntities(x)),
      'Étapes :', ...steps.map((x, i) => (i + 1) + '. ' + x)
    ].filter(Boolean).join('\n');
    return { site, name: decodeEntities(recipe.name || ''), text: text.slice(0, 8000) };
  }
  // Pas de données structurées : on transmet le texte de la page
  const plain = decodeEntities(html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')).trim();
  if (plain.length < 200) throw new Error('Je n’ai pas trouvé de recette sur cette page.');
  return { site, name: '', text: plain.slice(0, 8000) };
}
function sourceHtml(r) {
  return r.source && r.source.url ? `<div class="muted small">Source : <a href="${esc(r.source.url)}" target="_blank" rel="noopener" style="color:var(--accent)">${esc(r.source.label || r.source.url)}</a></div>` : '';
}
