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

/* ---------- Images (générées par IA, gardées sur le téléphone) ---------- */
const imgCache = {};
const imgPending = {};
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
  if (!db) return;
  await new Promise((resolve) => {
    try {
      const tx = db.transaction('images', 'readonly');
      const store = tx.objectStore('images');
      const req = store.openCursor();
      req.onsuccess = () => { const c = req.result; if (c) { imgCache[c.key] = c.value; c.continue(); } else resolve(); };
      req.onerror = () => resolve();
    } catch (e) { resolve(); }
  });
}
function storeImage(id, src) {
  imgCache[id] = src;
  try { if (idb) idb.transaction('images', 'readwrite').objectStore('images').put(src, id); } catch (e) { /* ignore */ }
}
function imageSrc(r) {
  if (imgCache[r.id]) return imgCache[r.id];
  if (!r.custom && !r.preview) return (window.IMG_BASE || 'img/') + r.id + '.jpg';
  return null;
}
function imgTag(r, cls) {
  const src = imageSrc(r);
  return src ? `<img class="${cls}" src="${esc(src)}" alt="" loading="lazy" onerror="this.remove()">` : '';
}
async function compress(blob) {
  try {
    const bmp = await createImageBitmap(blob);
    const w = Math.min(768, bmp.width); const h = Math.round(bmp.height * w / bmp.width);
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    c.getContext('2d').drawImage(bmp, 0, 0, w, h);
    return c.toDataURL('image/jpeg', 0.8);
  } catch (e) {
    return await new Promise((res) => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.readAsDataURL(blob); });
  }
}
const IMG_STYLE = 'professional food photography, appetizing home-cooked dish, served on a rustic ceramic plate on a wooden table, soft natural daylight, 45 degree angle, shallow depth of field, no text, no people';
async function generateImageFor(id, manual) {
  const r = recipeById(id);
  if (!r || imgPending[id]) return;
  imgPending[id] = true;
  if (manual) toast('Image en préparation (jusqu’à 1 minute)…');
  render();
  const prompt = `${r.imgPrompt || r.n}, ${IMG_STYLE}`;
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=768&height=576&seed=${Math.floor(Math.random() * 100000)}&nologo=true`;
  let src = null;
  for (let attempt = 0; attempt < 3 && !src; attempt++) {
    try {
      const res = await fetch(url);
      if (res.status === 402 || res.status === 429) {
        const wait = Math.min(70, parseInt(res.headers.get('retry-after') || '45', 10) + 2);
        await new Promise((ok) => setTimeout(ok, wait * 1000));
        continue;
      }
      const type = res.headers.get('content-type') || '';
      if (!res.ok || !type.startsWith('image/')) throw new Error('HTTP ' + res.status);
      src = await compress(await res.blob());
    } catch (e) {
      // Lecture impossible (réseau ou CORS) : on garde l'adresse, l'image s'affichera depuis internet
      if (e instanceof TypeError) { src = url; break; }
    }
  }
  imgPending[id] = false;
  if (src) { storeImage(id, src); if (manual) toast('Nouvelle image prête'); }
  else toast('Image indisponible pour le moment, réessaie plus tard');
  render();
}
function heroHtml(r) {
  const src = imageSrc(r);
  const pending = imgPending[r.id];
  const canGen = !r.preview;
  return `<div class="hero" style="background:${hashColor(r.id)}"><span aria-hidden="true">${r.e || '🍽️'}</span>${src ? `<img src="${esc(src)}" alt="${esc(r.n)}" onerror="this.remove()">` : ''}</div>
    <div class="row between" style="margin-top:-6px">
      <span class="muted" style="font-size:11px">${src ? 'Image générée par IA, illustration non contractuelle' : r.preview ? 'L’image sera générée à l’enregistrement' : 'Pas encore d’image'}</span>
      ${canGen ? (pending ? '<span class="muted small">Image en cours…</span>' : `<button class="link" style="font-size:12px;min-height:36px" data-act="gen-image" data-v="${r.id}">${src ? 'Autre image' : 'Générer une image'}</button>`) : ''}
    </div>`;
}

/* ---------- Étapes et astuces ---------- */
function stepsOf(r) { return (typeof DETAILS !== 'undefined' && DETAILS[r.id] && DETAILS[r.id].st) || r.st || []; }
function tipsOf(r) { return (typeof DETAILS !== 'undefined' && DETAILS[r.id] && DETAILS[r.id].tips) || r.tips || []; }
function stepsHtml(r) {
  const st = stepsOf(r); const tips = tipsOf(r);
  return `${st.length ? `<div class="section-title" style="margin-top:6px">Préparation</div><ol class="steps">${st.map((s) => `<li><span>${esc(s)}</span></li>`).join('')}</ol>` : ''}
    ${tips.length ? `<div class="tips"><div class="serif italic" style="font-size:18px;color:var(--accent)">Astuces</div>${tips.map((t) => `<p>${esc(t)}</p>`).join('')}</div>` : ''}`;
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
const GEMINI_MODELS = ['gemini-flash-latest', 'gemini-3.8-flash', 'gemini-2.5-flash'];
function aiSuggest(q) {
  return `<div class="ai-box"><span>Tu ne trouves pas exactement ce que tu cherches ?</span>
    <button class="btn dark block" data-act="ai-open" data-v="${esc(q)}">${ICONS.spark} Générer « ${esc(q)} » avec l’IA</button></div>`;
}
function keyForm() {
  return `<div class="field"><input id="ai-key" type="password" placeholder="Colle ta clé Gemini ici" value="${esc(state.ai.key || '')}" autocomplete="off" aria-label="Clé Gemini"></div>
    <div class="row" style="gap:16px"><button class="link" data-act="save-key">Enregistrer la clé</button>${state.ai.key ? '<button class="link" data-act="test-key">Tester la clé</button>' : ''}</div>
    <details class="help"><summary>Comment obtenir une clé gratuite ?</summary>
      <ol><li>Ouvre <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener">aistudio.google.com/apikey</a> (adresse à recopier si le lien ne s’ouvre pas).</li>
      <li>Connecte-toi avec ton compte Google et accepte les conditions.</li>
      <li>Touche « Create API key » (Créer une clé), puis copie la clé.</li>
      <li>Colle-la ci-dessus et touche « Enregistrer la clé ».</li></ol>
      <p class="muted small">Gratuit dans la limite d’un quota quotidien largement suffisant. La clé reste uniquement sur ce téléphone.</p>
    </details>`;
}
function readAiInput() { const el = $('#ai-q'); if (el && ui.sheet) ui.sheet.q = el.value; }
function constraintsText() {
  const p = state.profile;
  const allergies = p.allergies.map((a) => (ALLERGENS.find((x) => x.id === a) || {}).name).filter(Boolean);
  const diet = DIETS.find((d) => d.id === p.diet);
  const dislikes = p.dislikes.map((k) => ing(k).n).concat(p.dislikesText);
  const eq = EQUIPMENT.filter((e) => p.equipment.includes(e.id)).map((e) => e.name);
  return { allergies, diet: diet && diet.id !== 'aucun' ? diet.name : '', dislikes, eq, maxTime: p.maxTime, level: (LEVELS.find((l) => l.id === p.level) || {}).n };
}
function aiSheet(sh) {
  if (sh.status === 'done' && sh.recipe) return previewSheet(sh, sh.recipe);
  const head = `<div class="sheet-head"><span class="grab" aria-hidden="true"></span><h2 style="font-size:22px">Générer une recette</h2><button class="icon-btn" data-act="close-sheet" aria-label="Fermer">${ICONS.close}</button></div>`;
  if (!state.ai.key) {
    return `<div class="sheet" role="dialog" aria-modal="true" aria-label="Générer une recette">${head}<div class="sheet-body">
      <p style="margin:0;line-height:1.5">Pour créer des recettes avec l’IA, l’application a besoin d’une clé Gemini (gratuite, à créer une seule fois avec ton compte Google).</p>
      ${keyForm()}</div></div>`;
  }
  const c = constraintsText();
  const recap = [c.allergies.length ? 'sans ' + c.allergies.join(', ').toLowerCase() : '', c.diet, c.dislikes.length ? 'en évitant ' + c.dislikes.join(', ').toLowerCase() : '', c.maxTime ? 'en moins de ' + c.maxTime + ' min' : ''].filter(Boolean).join(' · ');
  let body = '';
  if (sh.status === 'loading') {
    body = `<div class="empty" style="padding:50px 10px"><span class="spinner" aria-hidden="true"></span><span class="big">Recette en préparation…</span><span>Quelques secondes.</span></div>`;
  } else {
    body = `<div><label class="lbl" for="ai-q">Quelle recette veux-tu ?</label>
      <input class="input" id="ai-q" value="${esc(sh.q)}" placeholder="Ex. : gnocchis à la sauce tomate, gâteau sans four…" autocomplete="off" enterkeyhint="go"></div>
      <div class="row between"><span>Pour</span>${stepper('ai-persons', sh.persons, 'Nombre de personnes')}</div>
      ${recap ? `<p class="muted small" style="margin:0">Tes critères seront respectés : ${esc(recap)}.</p>` : ''}
      ${sh.status === 'error' ? `<p class="card-warn" style="margin:0;font-size:14px">${esc(sh.error)}</p>` : ''}`;
  }
  return `<div class="sheet" role="dialog" aria-modal="true" aria-label="Générer une recette">${head}
    <div class="sheet-body has-foot">${body}</div>
    <div class="sheet-foot"><button class="btn primary" data-act="ai-generate" ${sh.status === 'loading' ? 'disabled' : ''}>${ICONS.spark} Générer la recette</button></div></div>`;
}
function previewSheet(sh, r) {
  const reason = hiddenReason(r);
  const dis = dislikedIn(r);
  return `<div class="sheet" role="dialog" aria-modal="true" aria-label="${esc(r.n)}">
    <div class="sheet-head"><span class="grab" aria-hidden="true"></span>
      <button class="link" data-act="ai-back" style="text-decoration:none">← Modifier la demande</button>
      <button class="icon-btn" data-act="close-sheet" aria-label="Fermer">${ICONS.close}</button></div>
    <div class="sheet-body has-foot">
      ${heroHtml(r)}
      <div class="kicker">${esc((TYPES.find((t) => t.id === r.type) || {}).name || '')} · Proposée par l’IA</div>
      <h2>${esc(r.n)}</h2>
      <div class="muted small">${r.t} min · ${DIFF[r.d] || ''} · pour ${r.p} ${plural(r.p, 'personne', 'personnes')}</div>
      ${r.aiNote ? `<div class="card-note" style="font-size:14px">${esc(r.aiNote)}</div>` : ''}
      ${reason ? `<div class="card-warn">Attention : cette recette ne correspond pas entièrement à ton profil (${{ regime: 'régime ou allergie', equipement: 'équipement', niveau: 'niveau', temps: 'temps' }[reason]}).</div>` : ''}
      ${dis.length ? `<div class="card-warn">Contient ${esc(dis.join(', ').toLowerCase())}, que tu n’aimes pas.</div>` : ''}
      <div class="section-title" style="margin-top:6px">Ingrédients</div>
      <div>${r.i.map(([k, q, u]) => `<div class="ing-line"><span>${esc(ing(k).n)}</span><span>${fmtQty(q, u, k, false)}</span></div>`).join('')}</div>
      ${stepsHtml(r)}
      <p class="muted small" style="margin:0">Recette générée automatiquement : vérifie les cuissons et les quantités avant de te lancer.</p>
    </div>
    <div class="sheet-foot" style="flex-wrap:wrap">
      <button class="btn" data-act="ai-again" style="flex:1 1 100%">Une autre version</button>
      <button class="btn" data-act="ai-save">Enregistrer</button>
      <button class="btn primary" data-act="ai-save-menu">Enregistrer et ajouter au menu</button>
    </div></div>`;
}

async function geminiJSON(system, prompt, temperature) {
  let lastErr = 'Erreur inconnue';
  for (const model of GEMINI_MODELS) {
    let res;
    try {
      res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': state.ai.key },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json', temperature: temperature ?? 0.7 }
        })
      });
    } catch (e) { throw new Error('Pas de connexion internet. Réessaie quand tu as du réseau.'); }
    if (res.status === 404) { lastErr = 'Modèle indisponible'; continue; }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = (data.error && data.error.message) || '';
      if (res.status === 400 && /api key/i.test(msg)) throw new Error('La clé Gemini n’est pas valide. Vérifie-la dans ton Profil.');
      if (res.status === 403) throw new Error('La clé Gemini est refusée. Vérifie-la dans ton Profil.');
      if (res.status === 429) throw new Error('Quota gratuit atteint pour le moment. Réessaie dans quelques minutes.');
      if (res.status >= 500) { lastErr = 'Le service Gemini est momentanément indisponible. Réessaie.'; continue; }
      throw new Error('Erreur Gemini : ' + (msg || res.status));
    }
    const text = ((data.candidates || [])[0]?.content?.parts || []).map((p) => p.text || '').join('');
    const a = text.indexOf('{'); const b = text.lastIndexOf('}');
    if (a < 0 || b < a) throw new Error('Réponse inattendue de l’IA. Réessaie.');
    return JSON.parse(text.slice(a, b + 1));
  }
  throw new Error(lastErr);
}

async function testKey() {
  const el = $('#ai-key'); if (el && el.value.trim()) { state.ai.key = el.value.trim(); save(); }
  toast('Test en cours…');
  try { await geminiJSON('Tu réponds en JSON.', 'Réponds exactement {"ok": true}', 0); toast('La clé fonctionne'); }
  catch (e) { toast(e.message); }
}

const AISLE_IDS = () => AISLES.map((a) => a.id);
async function aiGenerate(again) {
  const sh = ui.sheet;
  if (!sh || sh.kind !== 'ai') return;
  if (!String(sh.q || '').trim()) { toast('Écris la recette que tu veux'); return; }
  sh.status = 'loading'; sh.recipe = null; renderOverlays();
  const c = constraintsText();
  const names = [...new Set(Object.values(INGREDIENTS).map((i) => i.n))].join(', ');
  const system = 'Tu es un chef cuisinier français qui écrit des recettes familiales claires, fiables et détaillées pour une application de menus et de liste de courses. Tu réponds uniquement avec un objet JSON valide, sans aucun texte autour.';
  const prompt = `Recette demandée : « ${sh.q} »${again ? ' (propose une version différente de la précédente)' : ''}.
Pour ${sh.persons} personnes.

Contraintes de l'utilisateur, à respecter absolument :
- Ne jamais utiliser d'ingrédient contenant : ${c.allergies.length ? c.allergies.join(', ') : 'aucune allergie'}.
- Régime : ${c.diet || 'aucun régime particulier'}.
- Éviter si possible : ${c.dislikes.length ? c.dislikes.join(', ') : 'rien'}.
- Temps total maximum : ${c.maxTime ? c.maxTime + ' minutes' : 'pas de limite'}.
- Niveau en cuisine : ${c.level || 'intermédiaire'}.
- Équipement disponible uniquement : ${c.eq.join(', ') || 'plaques de cuisson'}.
Si la demande est incompatible avec ces contraintes, adapte la recette (par exemple une version végétarienne) et explique l'adaptation dans "remarque".

Pour les ingrédients, réutilise exactement ces noms quand c'est le même produit : ${names}.

Réponds avec ce JSON :
{
  "nom": "nom de la recette en français",
  "emoji": "un seul emoji représentant le plat",
  "type": "plat" | "soupe" | "salade" | "dessert" | "brunch",
  "temps_min": nombre de minutes au total,
  "difficulte": 1 | 2 | 3,
  "portions": ${sh.persons},
  "equipement": liste parmi ["plaques", "four", "micro", "mixeur", "airfryer"],
  "ingredients": [ { "nom": "…", "quantite": nombre, "unite": "g" | "ml" | "pc" | "cs" | "cc" | "pincee", "rayon": "fl" | "bp" | "cr" | "bo" | "ep" | "es" | "su" | "sg" | "bs" | "au" } ],
  "etapes": [ "de 5 à 9 étapes détaillées, avec temps, températures et repères visuels" ],
  "astuces": [ "1 à 3 astuces utiles" ],
  "image_prompt": "short English description of the finished dish for a food photo",
  "remarque": "adaptation éventuelle, sinon chaîne vide"
}
Rayons : fl fruits et légumes, bp boucherie et poissonnerie, cr crèmerie et frais, bo boulangerie, ep épicerie salée, es épices et condiments, su épicerie sucrée, sg surgelés, bs boissons, au autres.
Unités : "pc" pour ce qui se compte (œufs, oignons, gousses d'ail, citrons, tranches…). Quantités réalistes pour ${sh.persons} personnes.`;
  try {
    const j = await geminiJSON(system, prompt, again ? 1 : 0.7);
    const typeIds = TYPES.map((t) => t.id);
    const units = ['g', 'ml', 'pc', 'cs', 'cc', 'pincee'];
    const ings = (Array.isArray(j.ingredients) ? j.ingredients : []).filter((x) => x && x.nom).map((x) => {
      let key = findIngredientByName(x.nom);
      if (!key) {
        key = 'x_' + norm(x.nom).replace(/[^a-z0-9]+/g, '_');
        if (!state.customIngs[key]) state.customIngs[key] = { n: x.nom.charAt(0).toUpperCase() + x.nom.slice(1), a: AISLE_IDS().includes(x.rayon) ? x.rayon : 'au' };
      }
      const q = parseFloat(String(x.quantite).replace(',', '.'));
      return [key, isFinite(q) && q > 0 ? q : 1, units.includes(x.unite) ? x.unite : 'pc'];
    });
    if (!j.nom || !ings.length) throw new Error('La recette reçue est incomplète. Réessaie.');
    sh.recipe = {
      id: 'ai_' + uid(), custom: true, ai: true, preview: true,
      n: String(j.nom).trim(), e: String(j.emoji || '🍽️').trim().slice(0, 4),
      type: typeIds.includes(j.type) ? j.type : 'plat',
      t: clampInt(parseInt(j.temps_min, 10) || 30, 1, 999), d: [1, 2, 3].includes(+j.difficulte) ? +j.difficulte : 1,
      p: sh.persons, s: [],
      eq: (Array.isArray(j.equipement) ? j.equipement : []).filter((e) => EQUIPMENT.some((x) => x.id === e)),
      i: ings,
      st: (Array.isArray(j.etapes) ? j.etapes : []).map(String).filter(Boolean),
      tips: (Array.isArray(j.astuces) ? j.astuces : []).map(String).filter(Boolean),
      imgPrompt: String(j.image_prompt || '').slice(0, 300),
      aiNote: String(j.remarque || '').trim(),
      query: sh.q
    };
    sh.status = 'done';
    sh.keepScroll = false;
  } catch (e) {
    sh.status = 'error'; sh.error = e.message || 'Erreur';
  }
  if (ui.sheet === sh) renderOverlays();
}
function aiSave(toMenu) {
  const sh = ui.sheet;
  if (!sh || !sh.recipe) return;
  const r = Object.assign({}, sh.recipe); delete r.preview;
  state.custom.push(r);
  if (toMenu) addToMenu(r.id, r.p); else toast('Recette enregistrée dans Mes recettes');
  save();
  ui.sheet = { kind: 'recipe', id: r.id, servings: r.p };
  render();
  generateImageFor(r.id);
}
