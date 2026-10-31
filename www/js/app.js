/* Carnet de cuisine – application */
'use strict';

/* ---------- Utilitaires ---------- */
const $ = (sel, root = document) => root.querySelector(sel);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/œ/g, 'oe').trim();
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const clone = (o) => JSON.parse(JSON.stringify(o));

const STORE_KEY = 'carnet-cuisine.v1';
const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
const SLOTS = [];
DAYS.forEach((d, i) => { SLOTS.push({ id: i + '-midi', name: d + ' midi' }); SLOTS.push({ id: i + '-soir', name: d + ' soir' }); });
const TILE_COLORS = ['#EBD9BE', '#E9C9A8', '#DCD5B8', '#D9CFC3', '#E6D3C4', '#D7DCC6', '#EAD2C0', '#E3D8C8'];
const EMOJIS = ['🍲', '🍛', '🍝', '🥗', '🥘', '🍗', '🐟', '🥩', '🥕', '🍕', '🥞', '🍰', '🍳', '🌮', '🥧', '🍜'];
const DISLIKE_SUGGESTIONS = ['champignons', 'olives', 'poivron', 'aubergine', 'coriandre', 'chevre', 'endive', 'courgette', 'celeri', 'epinards_frais', 'feta', 'navet', 'moules', 'crevettes', 'saumon', 'thon', 'lardons', 'tofu'];
const TIME_OPTIONS = [{ v: 20, n: '20 min' }, { v: 30, n: '30 min' }, { v: 45, n: '45 min' }, { v: 60, n: '1 h' }, { v: 0, n: 'Pas de limite' }];
const LEVELS = [{ id: 'debutant', n: 'Débutant·e', d: 'Recettes simples, pas de recettes difficiles' }, { id: 'intermediaire', n: 'Intermédiaire', d: 'Je me débrouille bien' }, { id: 'confirme', n: 'Confirmé·e', d: 'Tout me va' }];
const DIFF = { 1: 'Facile', 2: 'Moyen', 3: 'Difficile' };
const UNITS = [{ id: 'g', n: 'g' }, { id: 'ml', n: 'ml' }, { id: 'pc', n: 'pièce' }, { id: 'cs', n: 'c. à s.' }, { id: 'cc', n: 'c. à c.' }, { id: 'pincee', n: 'pincée' }];

const ICONS = {
  search: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>',
  plus: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
  check: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" aria-hidden="true"><path d="M5 12l5 5 9-10"/></svg>',
  checkSm: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FBF6EE" stroke-width="3.5" aria-hidden="true"><path d="M5 12l5 5 9-10"/></svg>',
  close: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  home: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M4 11l8-7 8 7v9H4z"/><path d="M10 20v-5h4v5"/></svg>',
  heart: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg>',
  heartFull: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg>',
  trash: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>',
  undo: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/></svg>'
};

function mondayOf(date) {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  const pad = (n) => String(n).padStart(2, '0');
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
}
function fmtDate(iso) {
  try { return new Date(iso + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }); } catch (e) { return iso; }
}
function currentSeason() {
  const m = new Date().getMonth() + 1;
  if (m >= 3 && m <= 5) return 'pr';
  if (m >= 6 && m <= 8) return 'et';
  if (m >= 9 && m <= 11) return 'au';
  return 'hi';
}
function hashColor(id) {
  let h = 0; for (const c of String(id)) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return TILE_COLORS[h % TILE_COLORS.length];
}
function plural(n, one, many) { return n > 1 ? many : one; }

/* ---------- État ---------- */
function defaultState() {
  return {
    v: 1,
    onboarded: false,
    obStep: 0,
    profile: { allergies: [], diet: 'aucun', dislikes: [], dislikesText: [], maxTime: 0, level: 'intermediaire', equipment: ['plaques', 'four', 'micro', 'mixeur'], persons: 2, target: 5 },
    pantry: Object.keys(INGREDIENTS).filter((k) => INGREDIENTS[k].pantry),
    menu: [],
    favorites: [],
    custom: [],
    customIngs: {},
    list: { checked: {}, have: {}, manual: [], showPantry: false, showHave: false },
    history: [],
    weekStart: mondayOf(new Date())
  };
}
let state = load();
const ui = { tab: 'decouvrir', query: '', filter: 'tout', type: 'tous', sheet: null, dialog: null };

function load() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      const s = JSON.parse(raw);
      const d = defaultState();
      return Object.assign(d, s, { profile: Object.assign(d.profile, s.profile || {}), list: Object.assign(d.list, s.list || {}) });
    }
  } catch (e) { /* stockage indisponible */ }
  return defaultState();
}
function save() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
}

/* ---------- Données dérivées ---------- */
function allRecipes() { return RECIPES.concat(state.custom); }
function recipeById(id) { return allRecipes().find((r) => r.id === id); }
function ing(key) { return INGREDIENTS[key] || state.customIngs[key] || { n: key, a: 'au' }; }
function recipeTags(r) { const t = new Set(); r.i.forEach(([k]) => (ing(k).t || []).forEach((x) => t.add(x))); return t; }
function exclusionTags() {
  const d = DIETS.find((x) => x.id === state.profile.diet);
  return new Set([...(state.profile.allergies || []), ...(d ? d.excl : [])]);
}
function hiddenReason(r) {
  const p = state.profile;
  const ex = exclusionTags();
  for (const t of recipeTags(r)) if (ex.has(t)) return 'regime';
  if ((r.eq || []).some((e) => !p.equipment.includes(e))) return 'equipement';
  if (p.level === 'debutant' && r.d >= 3) return 'niveau';
  if (p.maxTime && r.t > p.maxTime) return 'temps';
  return null;
}
function dislikedIn(r) {
  const p = state.profile;
  const out = [];
  r.i.forEach(([k]) => {
    const name = norm(ing(k).n);
    if (p.dislikes.includes(k) || p.dislikesText.some((t) => t && name.includes(norm(t)))) out.push(ing(k).n);
  });
  return [...new Set(out)];
}
function inMenu(id) { return state.menu.find((m) => m.rid === id); }
function menuKeys(excludeId) {
  const s = new Set();
  state.menu.forEach((m) => { if (m.rid === excludeId) return; const r = recipeById(m.rid); if (r) r.i.forEach(([k]) => { if (!state.pantry.includes(k)) s.add(k); }); });
  return s;
}
function shared(r) {
  if (inMenu(r.id)) return [];
  const keys = menuKeys(r.id);
  return [...new Set(r.i.map(([k]) => k).filter((k) => keys.has(k)))];
}
function isSeason(r) { return !r.s || r.s.length === 0 || r.s.includes(currentSeason()); }

/* ---------- Quantités ---------- */
function fmtNum(x) {
  const r = Math.round(x * 10) / 10;
  return (Number.isInteger(r) ? String(r) : r.toFixed(1)).replace('.', ',');
}
function niceGram(q) {
  if (q < 20) return Math.max(1, Math.round(q));
  if (q < 100) return Math.round(q / 5) * 5;
  if (q < 1000) return Math.round(q / 10) * 10;
  return Math.round(q / 50) * 50;
}
function fmtQty(q, unit, key, forList) {
  const info = ing(key);
  switch (unit) {
    case 'g': { const g = niceGram(q); return g >= 1000 ? fmtNum(g / 1000) + ' kg' : g + ' g'; }
    case 'ml': {
      const v = niceGram(q);
      if (v >= 1000) return fmtNum(v / 1000) + ' L';
      if (v >= 100 && v % 10 === 0) return v / 10 + ' cl';
      return v + ' ml';
    }
    case 'pc': {
      const n = forList ? Math.ceil(q - 0.01) : Math.round(q * 2) / 2;
      if (info.l && !info.l.some((w) => norm(w) === norm(info.n))) return fmtNum(n) + ' ' + (n > 1 ? info.l[1] : info.l[0]);
      return fmtNum(n);
    }
    case 'cs': return fmtNum(Math.round(q * 2) / 2) + ' c. à s.';
    case 'cc': return fmtNum(Math.round(q * 2) / 2) + ' c. à c.';
    case 'pincee': { const n = Math.max(1, Math.round(q)); return n + ' ' + plural(n, 'pincée', 'pincées'); }
    default: return fmtNum(q) + ' ' + unit;
  }
}
function lineCost(key, q, unit) {
  const info = INGREDIENTS[key];
  if (!info || !info.p) return 0;
  if (info.u === 'pc') return unit === 'pc' ? Math.ceil(q - 0.01) * info.p : 0;
  const grams = unit === 'g' || unit === 'ml' ? q : unit === 'cs' ? q * 15 : unit === 'cc' ? q * 5 : unit === 'pincee' ? q * 0.5 : 0;
  return grams / 1000 * info.p;
}
function recipeCostPerPerson(r) {
  let c = 0; r.i.forEach(([k, q, u]) => { c += lineCost(k, q, u); });
  return c / r.p;
}
function fmtEuro(x) { return x.toLocaleString('fr-FR', { minimumFractionDigits: x < 10 ? 2 : 0, maximumFractionDigits: x < 10 ? 2 : 0 }) + ' €'; }

/* ---------- Liste de courses ---------- */
function buildList() {
  const lines = new Map();
  state.menu.forEach((m) => {
    const r = recipeById(m.rid); if (!r) return;
    const f = m.servings / r.p;
    r.i.forEach(([k, q, u]) => {
      if (!lines.has(k)) lines.set(k, { key: k, name: ing(k).n, aisle: ing(k).a || 'au', units: {}, sources: [], pantry: state.pantry.includes(k) });
      const L = lines.get(k);
      L.units[u] = (L.units[u] || 0) + q * f;
      if (!L.sources.includes(r.n)) L.sources.push(r.n);
    });
  });
  const items = [...lines.values()].map((L) => {
    const order = ['pc', 'g', 'ml', 'cs', 'cc', 'pincee'];
    const qty = order.filter((u) => L.units[u]).map((u) => fmtQty(L.units[u], u, L.key, true)).join(' + ');
    let cost = 0; Object.entries(L.units).forEach(([u, q]) => { cost += lineCost(L.key, q, u); });
    return { id: L.key, name: L.name, aisle: L.aisle, qty, src: L.sources.join(', '), pantry: L.pantry, cost, manual: false };
  });
  state.list.manual.forEach((m) => items.push({ id: 'm:' + m.id, name: m.name, aisle: m.aisle, qty: m.qty || '', src: 'Ajouté à la main', pantry: false, cost: 0, manual: true }));
  return items;
}

/* ---------- Navigation et rendu ---------- */
const main = () => $('#main');
function setTab(t) { ui.tab = t; render(true); }
function render(resetScroll) {
  const app = $('#app');
  if (!state.onboarded) {
    app.innerHTML = '<div id="main">' + renderOnboarding() + '</div>';
    renderOverlays();
    return;
  }
  const m = main();
  const prev = m && !resetScroll ? m.scrollTop : 0;
  if (!$('.tabbar')) {
    app.innerHTML = '<div id="main"></div><nav class="tabbar" aria-label="Navigation"></nav>';
  }
  const views = { decouvrir: renderDiscover, semaine: renderWeek, liste: renderList, profil: renderProfile };
  main().innerHTML = views[ui.tab]();
  main().scrollTop = prev;
  const listCount = buildList().filter((i) => !i.pantry && !state.list.checked[i.id] && !state.list.have[i.id]).length;
  $('.tabbar').innerHTML = [['decouvrir', 'Découvrir'], ['semaine', 'Semaine'], ['liste', 'Liste'], ['profil', 'Profil']]
    .map(([id, n]) => `<button class="${ui.tab === id ? 'on' : ''}" data-act="tab" data-v="${id}" aria-current="${ui.tab === id ? 'page' : 'false'}">${n}${id === 'liste' && listCount ? `<span class="pill">${listCount}</span>` : ''}</button>`).join('');
  renderOverlays();
}

/* ---------- Questionnaire de départ ---------- */
const OB_STEPS = 5;
function renderOnboarding() {
  const s = state.obStep;
  if (s === 0) {
    return `<div class="ob"><div class="grow" style="justify-content:center">
      <div class="welcome-mark" aria-hidden="true">🍲</div>
      <div class="kicker">Carnet de cuisine</div>
      <h1>Tes recettes de la semaine, et la liste de courses qui va avec.</h1>
      <p class="lead">Quelques questions pour commencer : ce que tu ne peux pas manger, ce que tu n’aimes pas, et comment tu cuisines. Tout restera modifiable dans ton profil.</p>
    </div><div class="nav"><button class="btn primary" data-act="ob-next">Commencer</button></div></div>`;
  }
  const head = `<div class="kicker">Étape ${s} sur ${OB_STEPS}</div>`;
  const nav = `<div class="nav"><button class="btn" data-act="ob-prev">Retour</button><button class="btn primary" data-act="ob-next">${s === OB_STEPS ? 'C’est parti' : 'Suivant'}</button></div>`;
  let body = '';
  if (s === 1) body = `<h1>Aliments à éviter absolument</h1><p class="lead">Allergies ou interdits : les recettes qui en contiennent ne te seront jamais proposées.</p>${allergyPicker()}`;
  if (s === 2) body = `<h1>Ton régime alimentaire</h1><p class="lead">Les recettes incompatibles sont retirées du catalogue.</p>${dietPicker()}`;
  if (s === 3) body = `<h1>Ce que tu n’aimes pas</h1><p class="lead">Ces recettes resteront visibles, mais passeront en fin de liste avec une mention.</p>${dislikePicker()}`;
  if (s === 4) body = `<h1>En cuisine</h1>${cookingPicker()}`;
  if (s === 5) body = `<h1>Ton foyer</h1><p class="lead">Pour calculer les quantités et ton menu de la semaine.</p>${householdPicker()}`;
  return `<div class="ob"><div class="grow">${head}${body}</div>${nav}</div>`;
}

function allergyPicker() {
  return '<div>' + ALLERGENS.map((a) => {
    const on = state.profile.allergies.includes(a.id);
    return `<button class="option ${on ? 'on' : ''}" data-act="toggle-allergy" data-v="${a.id}" aria-pressed="${on}"><span class="box-ic">${on ? ICONS.checkSm : ''}</span>${esc(a.name)}</button>`;
  }).join('') + '</div>';
}
function dietPicker() {
  return '<div>' + DIETS.map((d) => {
    const on = state.profile.diet === d.id;
    return `<button class="option ${on ? 'on' : ''}" data-act="set-diet" data-v="${d.id}" aria-pressed="${on}"><span class="radio"></span>${esc(d.name)}</button>`;
  }).join('') + '</div>';
}
function dislikePicker() {
  const p = state.profile;
  const selected = p.dislikes.map((k) => `<button class="chip on" data-act="rm-dislike" data-v="${esc(k)}">${esc(ing(k).n)} <span class="x" aria-hidden="true">×</span><span class="sr">retirer</span></button>`)
    .concat(p.dislikesText.map((t, i) => `<button class="chip on" data-act="rm-dislike-text" data-v="${i}">${esc(t)} <span class="x" aria-hidden="true">×</span></button>`)).join('');
  const sugg = DISLIKE_SUGGESTIONS.filter((k) => !p.dislikes.includes(k) && INGREDIENTS[k])
    .map((k) => `<button class="chip soft" data-act="add-dislike" data-v="${k}">${esc(INGREDIENTS[k].n)}</button>`).join('');
  return `<form class="field" data-form="dislike">${ICONS.plus}<input name="q" list="ing-names" placeholder="Ajouter un aliment" autocomplete="off" enterkeyhint="done"><button class="link" type="submit">Ajouter</button></form>
    ${selected ? `<div class="chips">${selected}</div>` : '<p class="muted small" style="margin:0">Aucun aliment pour l’instant.</p>'}
    <div class="lbl" style="margin-top:6px">Suggestions</div><div class="chips">${sugg}</div>${ingredientDatalist()}`;
}
function cookingPicker() {
  const p = state.profile;
  return `<div class="section-title">Temps maximum par repas</div>
    <div class="chips">${TIME_OPTIONS.map((o) => `<button class="chip ${p.maxTime === o.v ? 'on' : ''}" data-act="set-time" data-v="${o.v}">${o.n}</button>`).join('')}</div>
    <div class="section-title">Niveau</div>
    <div>${LEVELS.map((l) => `<button class="option ${p.level === l.id ? 'on' : ''}" data-act="set-level" data-v="${l.id}"><span class="radio"></span><span><span style="display:block">${l.n}</span><span class="muted small">${l.d}</span></span></button>`).join('')}</div>
    <div class="section-title">Équipement</div>
    <div>${EQUIPMENT.map((e) => { const on = p.equipment.includes(e.id); return `<button class="option ${on ? 'on' : ''}" data-act="toggle-eq" data-v="${e.id}" aria-pressed="${on}"><span class="box-ic">${on ? ICONS.checkSm : ''}</span>${e.name}</button>`; }).join('')}</div>`;
}
function stepper(act, value, label) {
  return `<span class="stepper" role="group" aria-label="${esc(label)}"><button data-act="${act}" data-v="-1" aria-label="Moins">−</button><span>${value}</span><button data-act="${act}" data-v="1" aria-label="Plus">+</button></span>`;
}
function householdPicker() {
  const p = state.profile;
  return `<div class="row between rule-row" style="padding:12px 0"><span>Je cuisine pour</span>${stepper('persons', p.persons, 'Nombre de personnes')}</div>
    <div class="row between rule-row" style="padding:12px 0"><span>Recettes par semaine</span>${stepper('target', p.target, 'Nombre de recettes')}</div>
    <p class="muted small" style="margin:0">${p.persons} ${plural(p.persons, 'personne', 'personnes')}, ${p.target} ${plural(p.target, 'recette', 'recettes')} : soit environ ${p.persons * p.target} portions dans la semaine.</p>`;
}
function ingredientDatalist() {
  const names = Object.values(INGREDIENTS).map((i) => i.n).concat(Object.values(state.customIngs).map((i) => i.n));
  return `<datalist id="ing-names">${[...new Set(names)].sort((a, b) => a.localeCompare(b, 'fr')).map((n) => `<option value="${esc(n)}"></option>`).join('')}</datalist>`;
}
function findIngredientByName(name) {
  const n = norm(name);
  if (!n) return null;
  const all = Object.entries(INGREDIENTS).concat(Object.entries(state.customIngs));
  let hit = all.find(([, v]) => norm(v.n) === n);
  if (!hit) hit = all.find(([, v]) => norm(v.n).replace(/s$/, '') === n.replace(/s$/, ''));
  return hit ? hit[0] : null;
}
function guessAisle(name) {
  const n = norm(name);
  if (!n) return 'au';
  const key = findIngredientByName(name);
  if (key) return ing(key).a;
  const first = (x) => norm(x).split(/[ ’']/)[0].replace(/(s|x)$/, '');
  const f = first(name);
  const hit = f.length > 3 ? Object.values(INGREDIENTS).find((v) => first(v.n) === f) : null;
  return hit ? hit.a : 'au';
}

/* ---------- Découvrir ---------- */
function renderDiscover() {
  const p = state.profile;
  const filters = [['tout', 'Tout'], ['saison', 'De saison'], ['rapide', 'Rapide'], ['antigaspi', 'Anti-gaspi'], ['favoris', 'Favoris'], ['perso', 'Mes recettes']];
  return `<div class="page">
    <div class="kicker">Semaine du ${fmtDate(state.weekStart)}</div>
    <div class="title-row"><h1>Découvrir</h1><span class="counter">${state.menu.length} sur ${p.target}</span></div>
    <label class="field">${ICONS.search}<input id="search" type="search" placeholder="Chercher une recette, un ingrédient" value="${esc(ui.query)}" autocomplete="off" enterkeyhint="search" aria-label="Rechercher"></label>
    <div class="filters" role="tablist">${filters.map(([id, n]) => `<button role="tab" class="${ui.filter === id ? 'on' : ''}" data-act="filter" data-v="${id}" aria-selected="${ui.filter === id}">${n}</button>`).join('')}</div>
    <div class="chips scroll">${[['tous', 'Tous les types']].concat(TYPES.map((t) => [t.id, t.name])).map(([id, n]) => `<button class="chip ${ui.type === id ? 'on' : 'soft'}" data-act="type" data-v="${id}">${n}</button>`).join('')}</div>
    <div id="results">${renderResults()}</div>
  </div>`;
}
function renderResults() {
  const q = norm(ui.query);
  let hiddenCount = 0;
  let list = allRecipes().filter((r) => {
    if (hiddenReason(r)) { hiddenCount++; return false; }
    return true;
  });
  if (ui.type !== 'tous') list = list.filter((r) => r.type === ui.type);
  if (q) list = list.filter((r) => norm(r.n).includes(q) || r.i.some(([k]) => norm(ing(k).n).includes(q)));
  if (ui.filter === 'saison') list = list.filter(isSeason);
  if (ui.filter === 'rapide') list = list.filter((r) => r.t <= 30);
  if (ui.filter === 'favoris') list = list.filter((r) => state.favorites.includes(r.id));
  if (ui.filter === 'perso') list = list.filter((r) => r.custom);
  const scored = list.map((r) => ({ r, sh: shared(r), dis: dislikedIn(r) }));
  if (ui.filter === 'antigaspi') {
    const withShared = scored.filter((x) => x.sh.length > 0);
    withShared.sort((a, b) => b.sh.length - a.sh.length);
    scored.length = 0; scored.push(...withShared);
  } else {
    scored.sort((a, b) => (a.dis.length > 0) - (b.dis.length > 0) || isSeason(b.r) - isSeason(a.r) || b.sh.length - a.sh.length || a.r.n.localeCompare(b.r.n, 'fr'));
  }
  let html = '';
  if (!scored.length) {
    let msg = 'Aucune recette ne correspond.';
    if (ui.filter === 'favoris') msg = 'Pas encore de favoris. Touche le cœur sur une fiche recette pour l’ajouter ici.';
    if (ui.filter === 'perso') msg = 'Tu n’as pas encore ajouté de recette.';
    if (ui.filter === 'antigaspi') msg = state.menu.length ? 'Aucune autre recette ne partage d’ingrédient avec ton menu.' : 'Ajoute d’abord une recette à ton menu : les recettes qui réutilisent ses ingrédients apparaîtront ici.';
    html = `<div class="empty"><span>${msg}</span>${ui.filter === 'perso' ? '<button class="btn" data-act="new-recipe">Ajouter une recette</button>' : ''}</div>`;
  } else {
    html = '<div class="grid">' + scored.map(({ r, sh, dis }) => {
      const added = !!inMenu(r.id);
      const fav = state.favorites.includes(r.id);
      return `<div class="card">
        <div class="tile" style="background:${hashColor(r.id)}">
          <button class="icon-btn" data-act="open" data-v="${r.id}" aria-label="Voir ${esc(r.n)}" style="width:100%;height:100%;border-radius:4px;font-size:54px">${r.e || '🍽️'}</button>
          ${fav ? `<span class="fav" aria-label="Favori">${ICONS.heartFull}</span>` : ''}
          <button class="add ${added ? 'on' : ''}" data-act="toggle-menu" data-v="${r.id}" aria-label="${added ? 'Retirer du menu' : 'Ajouter au menu'}" style="color:${added ? '#fff' : 'var(--ink)'}">${added ? ICONS.check : ICONS.plus}</button>
        </div>
        <button class="card" data-act="open" data-v="${r.id}" style="gap:4px">
          <span class="card-name">${esc(r.n)}</span>
          <span class="card-meta">${r.t} min · ${DIFF[r.d] || ''}${r.custom ? ' · Perso' : ''}</span>
          ${sh.length ? `<span class="card-note">${sh.length} ${plural(sh.length, 'ingrédient', 'ingrédients')} en commun</span>` : ''}
          ${dis.length ? `<span class="card-warn">Contient : ${esc(dis.join(', ').toLowerCase())}</span>` : ''}
        </button>
      </div>`;
    }).join('') + '</div>';
  }
  if (hiddenCount) html += `<p class="muted small" style="text-align:center;margin:24px 0 0">${hiddenCount} ${plural(hiddenCount, 'recette masquée', 'recettes masquées')} selon ton profil (régime, temps, équipement ou niveau).</p>`;
  return html;
}

/* ---------- Ma semaine ---------- */
function renderWeek() {
  const p = state.profile;
  const items = state.menu.map((m, idx) => ({ m, idx, r: recipeById(m.rid) })).filter((x) => x.r);
  const slotIndex = (d) => { const i = SLOTS.findIndex((s) => s.id === d); return i < 0 ? 999 : i; };
  items.sort((a, b) => slotIndex(a.m.day) - slotIndex(b.m.day));
  const missing = Math.max(0, p.target - items.length);
  const dots = Array.from({ length: Math.max(p.target, items.length) }, (_, i) => `<i class="${i < items.length ? 'on' : ''}"></i>`).join('');
  const menuHtml = items.length ? items.map(({ m, r }) => `
    <div class="menu-item">
      <div class="mini" style="background:${hashColor(r.id)}" aria-hidden="true">${r.e || '🍽️'}</div>
      <div class="body">
        <button class="name" data-act="open" data-v="${r.id}">${esc(r.n)}</button>
        <div class="row" style="flex-wrap:wrap;gap:10px">
          ${stepper('servings:' + r.id, m.servings, 'Portions')}
          <select class="day-select" data-act="day" data-v="${r.id}" aria-label="Jour">
            <option value="">Jour non choisi</option>
            ${SLOTS.map((s) => `<option value="${s.id}" ${m.day === s.id ? 'selected' : ''}>${s.name}</option>`).join('')}
          </select>
        </div>
      </div>
      <button class="icon-btn" data-act="toggle-menu" data-v="${r.id}" aria-label="Retirer ${esc(r.n)} du menu">${ICONS.close}</button>
    </div>`).join('') : `<div class="empty"><span class="big">Ton menu est vide</span><span>Choisis des recettes dans l’onglet Découvrir.</span><button class="btn primary" data-act="tab" data-v="decouvrir">Découvrir des recettes</button></div>`;

  const hist = state.history.slice().reverse().map((h, i) => {
    const names = h.items.map((x) => recipeById(x.rid)).filter(Boolean).map((r) => r.n);
    return `<div class="rule-row" style="padding:10px 0;display:flex;gap:12px;align-items:center">
      <div style="flex:1;min-width:0"><div class="serif" style="font-size:16px">Semaine du ${fmtDate(h.date)}</div>
      <div class="muted small">${esc(names.slice(0, 3).join(', '))}${names.length > 3 ? ` et ${names.length - 3} autre${names.length - 3 > 1 ? 's' : ''}` : ''}</div></div>
      <button class="link" data-act="reuse-week" data-v="${state.history.length - 1 - i}">Reprendre</button></div>`;
  }).join('');

  return `<div class="page">
    <div class="kicker">Semaine du ${fmtDate(state.weekStart)}</div>
    <div class="title-row"><h1>Ma semaine</h1><span class="counter">${items.length} sur ${p.target}</span></div>
    <div class="box">
      <div class="row between"><span>Je cuisine pour</span>${stepper('persons', p.persons, 'Nombre de personnes')}</div>
      <div class="row between"><span>Recettes cette semaine</span>${stepper('target', p.target, 'Nombre de recettes')}</div>
      ${items.some(({ m }) => m.servings !== p.persons) ? `<button class="link" style="align-self:flex-start" data-act="apply-persons">Mettre toutes les recettes à ${p.persons} ${plural(p.persons, 'personne', 'personnes')}</button>` : ''}
    </div>
    <div class="dots" aria-label="${items.length} recettes choisies sur ${p.target}">${dots}</div>
    <div>${menuHtml}</div>
    ${items.length && missing ? `<button class="btn" data-act="tab" data-v="decouvrir">Choisir encore ${missing} ${plural(missing, 'recette', 'recettes')}</button>` : ''}
    ${items.length ? `<button class="btn primary" data-act="tab" data-v="liste">Voir la liste de courses</button>` : ''}
    <button class="btn" data-act="new-week">Commencer une nouvelle semaine</button>
    ${hist ? `<div class="section-title" style="margin-top:10px">Semaines précédentes</div><div>${hist}</div>` : ''}
  </div>`;
}

/* ---------- Liste ---------- */
function renderList() {
  const items = buildList();
  const L = state.list;
  const visible = items.filter((i) => !i.pantry && !L.have[i.id]);
  const pantryItems = items.filter((i) => i.pantry && !L.have[i.id]);
  const haveItems = items.filter((i) => L.have[i.id]);
  const todo = visible.filter((i) => !L.checked[i.id]).length;
  const budget = visible.reduce((s, i) => s + i.cost, 0);
  const recipesCount = state.menu.length;

  const itemHtml = (i) => {
    const done = !!L.checked[i.id];
    return `<div class="item ${done ? 'done' : ''}">
      <button class="check" data-act="check" data-v="${esc(i.id)}" aria-pressed="${done}" aria-label="${done ? 'Décocher' : 'Cocher'} ${esc(i.name)}"><span class="dot">${done ? ICONS.checkSm : ''}</span></button>
      <div class="body"><span class="name">${esc(i.name)}</span>${i.src ? `<span class="src">${esc(i.src)}</span>` : ''}</div>
      <span class="qty">${esc(i.qty)}</span>
      ${i.manual
        ? `<button class="icon-btn" data-act="rm-manual" data-v="${esc(i.id)}" aria-label="Supprimer ${esc(i.name)}">${ICONS.trash}</button>`
        : `<button class="icon-btn" data-act="have" data-v="${esc(i.id)}" aria-label="Je l’ai déjà : ${esc(i.name)}" title="Je l’ai déjà">${ICONS.home}</button>`}
    </div>`;
  };
  const sections = AISLES.map((a) => {
    const its = visible.filter((i) => i.aisle === a.id);
    if (!its.length) return '';
    its.sort((x, y) => (!!L.checked[x.id]) - (!!L.checked[y.id]) || x.name.localeCompare(y.name, 'fr'));
    return `<div><div class="section-title">${a.name}</div>${its.map(itemHtml).join('')}</div>`;
  }).join('');

  const addForm = `<form class="field" data-form="manual" style="flex-wrap:nowrap">${ICONS.plus}
      <input name="name" placeholder="Ajouter un article" autocomplete="off" list="ing-names" enterkeyhint="done" aria-label="Article">
      <input name="qty" placeholder="Qté" autocomplete="off" style="max-width:62px;text-align:right" aria-label="Quantité">
      <button class="link" type="submit">Ajouter</button></form>${ingredientDatalist()}`;

  const empty = !visible.length && !pantryItems.length && !haveItems.length;
  return `<div class="page">
    <div class="kicker">${todo} ${plural(todo, 'article', 'articles')} à prendre · ${recipesCount} ${plural(recipesCount, 'recette', 'recettes')}</div>
    <div class="title-row"><h1>Les courses</h1>${visible.length ? '<button class="link" data-act="copy">Copier</button>' : ''}</div>
    ${budget > 0 ? `<div class="muted small">Budget estimé : environ ${fmtEuro(budget)} (indicatif)</div>` : ''}
    ${addForm}
    ${empty ? `<div class="empty"><span class="big">Ta liste est vide</span><span>Ajoute des recettes à ton menu : leurs ingrédients s’afficheront ici, regroupés par rayon.</span><button class="btn primary" data-act="tab" data-v="decouvrir">Choisir des recettes</button></div>` : sections}
    ${pantryItems.length ? `<div class="box">
      <div class="row between"><span class="serif italic" style="font-size:18px">Dans ton placard</span><button class="link" data-act="toggle-pantry">${L.showPantry ? 'Masquer' : `Afficher (${pantryItems.length})`}</button></div>
      ${L.showPantry ? pantryItems.map(itemHtml).join('') : '<span class="muted small">Sel, huile, épices… considérés comme déjà chez toi.</span>'}
    </div>` : ''}
    ${haveItems.length ? `<div class="box">
      <div class="row between"><span class="serif italic" style="font-size:18px">Déjà à la maison</span><button class="link" data-act="toggle-have">${L.showHave ? 'Masquer' : `Afficher (${haveItems.length})`}</button></div>
      ${L.showHave ? haveItems.map((i) => `<div class="item"><div class="body"><span class="name">${esc(i.name)}</span></div><span class="qty">${esc(i.qty)}</span><button class="icon-btn" data-act="unhave" data-v="${esc(i.id)}" aria-label="Remettre ${esc(i.name)} dans la liste">${ICONS.undo}</button></div>`).join('') : ''}
    </div>` : ''}
    ${Object.keys(L.checked).length ? '<button class="link" style="align-self:center" data-act="uncheck-all">Tout décocher</button>' : ''}
  </div>`;
}
function listAsText() {
  const items = buildList();
  const L = state.list;
  const visible = items.filter((i) => !i.pantry && !L.have[i.id] && !L.checked[i.id]);
  let out = `Liste de courses – semaine du ${fmtDate(state.weekStart)}\n`;
  AISLES.forEach((a) => {
    const its = visible.filter((i) => i.aisle === a.id).sort((x, y) => x.name.localeCompare(y.name, 'fr'));
    if (!its.length) return;
    out += `\n${a.name}\n` + its.map((i) => `- ${i.name}${i.qty ? ' : ' + i.qty : ''}`).join('\n') + '\n';
  });
  return out.trim();
}

/* ---------- Profil ---------- */
function renderProfile() {
  const p = state.profile;
  const allergies = p.allergies.map((a) => (ALLERGENS.find((x) => x.id === a) || {}).name).filter(Boolean);
  const diet = (DIETS.find((d) => d.id === p.diet) || {}).name;
  const pantry = state.pantry.map((k) => `<button class="chip" data-act="rm-pantry" data-v="${esc(k)}">${esc(ing(k).n)} <span class="x" aria-hidden="true">×</span></button>`).join('');
  const customs = state.custom.map((r) => `<div class="rule-row row" style="padding:8px 0"><span aria-hidden="true" style="font-size:24px">${r.e}</span><button class="name serif" style="flex:1;text-align:left;background:none;border:none;font-size:16px;padding:8px 0" data-act="open" data-v="${r.id}">${esc(r.n)}</button><button class="link" data-act="edit-recipe" data-v="${r.id}">Modifier</button></div>`).join('');
  return `<div class="page">
    <div class="kicker">Mes réglages</div>
    <div class="title-row"><h1>Profil</h1></div>

    <div class="section-title">À éviter absolument</div>
    <p class="muted small" style="margin:-8px 0 0">Les recettes qui en contiennent ne sont jamais proposées.</p>
    ${allergyPicker()}

    <div class="section-title">Régime</div>
    ${dietPicker()}

    <div class="section-title">Ce que je n’aime pas</div>
    ${dislikePicker()}

    ${cookingPicker()}

    <div class="section-title">Mon foyer</div>
    ${householdPicker()}

    <div class="section-title">Mon placard de base</div>
    <p class="muted small" style="margin:-8px 0 0">Ces produits sont toujours chez toi : ils sont masqués de la liste de courses.</p>
    <div class="chips">${pantry || '<span class="muted small">Placard vide.</span>'}</div>
    <form class="field" data-form="pantry">${ICONS.plus}<input name="q" list="ing-names" placeholder="Ajouter au placard" autocomplete="off" enterkeyhint="done"><button class="link" type="submit">Ajouter</button></form>

    <div class="section-title">Mes recettes</div>
    <div>${customs || '<p class="muted small" style="margin:0">Aucune recette personnelle pour l’instant.</p>'}</div>
    <button class="btn" data-act="new-recipe">Ajouter une recette</button>

    <div class="box" style="margin-top:20px">
      <span class="muted small">Résumé : ${allergies.length ? 'sans ' + esc(allergies.join(', ').toLowerCase()) : 'aucune allergie'} · ${esc(diet || '')}</span>
      <button class="btn" data-act="reset" style="border-color:var(--accent);color:var(--accent)">Tout réinitialiser</button>
    </div>
  </div>`;
}

/* ---------- Fiches et fenêtres ---------- */
function renderOverlays() {
  let host = $('#overlays');
  if (!host) { host = document.createElement('div'); host.id = 'overlays'; document.body.appendChild(host); }
  let html = '';
  if (ui.sheet) {
    const body = ui.sheet.kind === 'recipe' ? recipeSheet(ui.sheet) : editorSheet(ui.sheet);
    html += `<div class="overlay ${ui.sheet.keepScroll ? '' : 'anim'}" data-act="close-sheet-bg">${body}</div>`;
  }
  if (ui.dialog) {
    html += `<div class="overlay ${ui.dialog.shown ? '' : 'anim'}" style="align-items:center;z-index:30"><div class="dialog" role="alertdialog" aria-modal="true">
      <p>${esc(ui.dialog.text)}</p>
      <div class="row" style="gap:10px"><button class="btn" style="flex:1" data-act="dialog-no">Annuler</button><button class="btn primary" style="flex:1" data-act="dialog-yes">${esc(ui.dialog.ok || 'Confirmer')}</button></div>
    </div></div>`;
  }
  const hadSheet = host.querySelector('.sheet-body');
  const keep = hadSheet ? hadSheet.scrollTop : 0;
  host.innerHTML = html;
  const nb = host.querySelector('.sheet-body');
  if (nb && ui.sheet && ui.sheet.keepScroll) nb.scrollTop = keep;
  if (ui.sheet) ui.sheet.keepScroll = true;
  if (ui.dialog) ui.dialog.shown = true;
}
function recipeSheet(sh) {
  const r = recipeById(sh.id);
  if (!r) return '';
  const m = inMenu(r.id);
  const servings = m ? m.servings : sh.servings;
  const f = servings / r.p;
  const fav = state.favorites.includes(r.id);
  const dis = dislikedIn(r);
  const sh2 = shared(r);
  const reason = hiddenReason(r);
  const seasons = (r.s && r.s.length ? r.s.map((x) => SEASONS[x]).join(', ') : 'Toute l’année');
  const cost = recipeCostPerPerson(r);
  return `<div class="sheet" role="dialog" aria-modal="true" aria-label="${esc(r.n)}">
    <div class="sheet-head"><span class="grab" aria-hidden="true"></span>
      <button class="icon-btn" data-act="fav" data-v="${r.id}" aria-pressed="${fav}" aria-label="${fav ? 'Retirer des favoris' : 'Ajouter aux favoris'}" style="color:var(--accent);margin-left:-12px">${fav ? ICONS.heartFull : ICONS.heart}</button>
      <button class="icon-btn" data-act="close-sheet" aria-label="Fermer">${ICONS.close}</button>
    </div>
    <div class="sheet-body has-foot">
      <div class="hero" style="background:${hashColor(r.id)}" aria-hidden="true">${r.e || '🍽️'}</div>
      <div class="kicker">${esc((TYPES.find((t) => t.id === r.type) || {}).name || '')}${r.custom ? ' · Ma recette' : ''}</div>
      <h2>${esc(r.n)}</h2>
      <div class="muted small">${r.t} min · ${DIFF[r.d] || ''} · ${seasons}${cost > 0 && !r.custom ? ` · environ ${fmtEuro(cost)} par personne` : ''}</div>
      ${reason ? `<div class="card-warn">Cette recette ne correspond pas à ton profil (${{ regime: 'régime ou allergie', equipement: 'équipement', niveau: 'niveau', temps: 'temps' }[reason]}).</div>` : ''}
      ${dis.length ? `<div class="card-warn">Contient ${esc(dis.join(', ').toLowerCase())}, que tu n’aimes pas.</div>` : ''}
      ${sh2.length ? `<div class="card-note">Réutilise ${esc(sh2.map((k) => ing(k).n.toLowerCase()).join(', '))}, déjà dans ton menu.</div>` : ''}
      <div class="row between" style="margin-top:6px"><span class="section-title">Ingrédients</span>${stepper('sheet-servings', servings, 'Portions')}</div>
      <div class="muted small" style="margin-top:-8px">Pour ${servings} ${plural(servings, 'personne', 'personnes')}</div>
      <div>${r.i.map(([k, q, u]) => `<div class="ing-line"><span>${esc(ing(k).n)}${state.pantry.includes(k) ? ' <span class="muted small">(placard)</span>' : ''}</span><span>${fmtQty(q * f, u, k, false)}</span></div>`).join('')}</div>
      ${r.st && r.st.length ? `<div class="section-title" style="margin-top:6px">Préparation</div><ol class="steps">${r.st.map((s) => `<li><span>${esc(s)}</span></li>`).join('')}</ol>` : ''}
      ${r.custom ? `<div class="row" style="gap:16px"><button class="link" data-act="edit-recipe" data-v="${r.id}">Modifier</button><button class="link" data-act="delete-recipe" data-v="${r.id}">Supprimer</button></div>` : ''}
    </div>
    <div class="sheet-foot">
      ${m ? `<button class="btn" data-act="toggle-menu" data-v="${r.id}">Retirer du menu</button>` : `<button class="btn primary" data-act="add-from-sheet" data-v="${r.id}">Ajouter au menu · ${servings} pers.</button>`}
    </div>
  </div>`;
}
function editorSheet(sh) {
  const d = sh.draft;
  const aisleOpts = (sel) => AISLES.map((a) => `<option value="${a.id}" ${a.id === sel ? 'selected' : ''}>${a.name}</option>`).join('');
  return `<div class="sheet" role="dialog" aria-modal="true" aria-label="Recette personnelle">
    <div class="sheet-head"><span class="grab" aria-hidden="true"></span><h2 style="font-size:22px">${sh.editId ? 'Modifier la recette' : 'Nouvelle recette'}</h2><button class="icon-btn" data-act="close-sheet" aria-label="Fermer">${ICONS.close}</button></div>
    <form class="sheet-body has-foot" data-form="editor" id="editor-form">
      <div><label class="lbl" for="ed-name">Nom</label><input class="input" id="ed-name" name="n" value="${esc(d.n)}" placeholder="Ex. : Gratin de mamie" required></div>
      <div><span class="lbl">Illustration</span><div class="chips">${EMOJIS.map((e) => `<button type="button" class="chip ${d.e === e ? 'on' : 'soft'}" data-act="ed-emoji" data-v="${e}" style="font-size:20px;padding:0 10px">${e}</button>`).join('')}</div></div>
      <div class="row" style="gap:14px;align-items:flex-end">
        <div style="flex:1"><label class="lbl" for="ed-type">Type</label><select class="input" id="ed-type" name="type">${TYPES.map((t) => `<option value="${t.id}" ${d.type === t.id ? 'selected' : ''}>${t.name}</option>`).join('')}</select></div>
        <div style="flex:1"><label class="lbl" for="ed-d">Difficulté</label><select class="input" id="ed-d" name="d">${[1, 2, 3].map((x) => `<option value="${x}" ${+d.d === x ? 'selected' : ''}>${DIFF[x]}</option>`).join('')}</select></div>
      </div>
      <div class="row" style="gap:14px">
        <div style="flex:1"><label class="lbl" for="ed-t">Temps (min)</label><input class="input" id="ed-t" name="t" type="number" inputmode="numeric" min="1" value="${esc(d.t)}"></div>
        <div style="flex:1"><label class="lbl" for="ed-p">Pour (personnes)</label><input class="input" id="ed-p" name="p" type="number" inputmode="numeric" min="1" value="${esc(d.p)}"></div>
      </div>
      <div class="section-title">Ingrédients</div>
      ${d.i.map((row, idx) => `<div class="ing-row">
        <div><label class="lbl" for="ed-in-${idx}">Ingrédient</label><input class="input" id="ed-in-${idx}" name="in-${idx}" list="ing-names" value="${esc(row.name)}" placeholder="Ex. : Carotte" autocomplete="off"></div>
        <div><label class="lbl" for="ed-iq-${idx}">Qté</label><input class="input" id="ed-iq-${idx}" name="iq-${idx}" type="number" inputmode="decimal" step="any" min="0" value="${esc(row.q)}"></div>
        <div><label class="lbl" for="ed-iu-${idx}">Unité</label><select class="input" id="ed-iu-${idx}" name="iu-${idx}">${UNITS.map((u) => `<option value="${u.id}" ${row.u === u.id ? 'selected' : ''}>${u.n}</option>`).join('')}</select></div>
        <button type="button" class="icon-btn" data-act="ed-rm-ing" data-v="${idx}" aria-label="Retirer cet ingrédient" style="width:32px">${ICONS.close}</button>
        <div style="grid-column:1 / span 3"><label class="lbl" for="ed-ia-${idx}">Rayon</label><select class="input" id="ed-ia-${idx}" name="ia-${idx}" style="font-size:14px;padding:6px 0">${aisleOpts(row.a)}</select></div>
      </div>`).join('')}
      <button type="button" class="link" style="align-self:flex-start" data-act="ed-add-ing">+ Ajouter un ingrédient</button>
      <div><label class="lbl" for="ed-st">Étapes (une par ligne)</label><textarea class="input" id="ed-st" name="st" placeholder="Préchauffer le four…">${esc(d.st)}</textarea></div>
      ${ingredientDatalist()}
    </form>
    <div class="sheet-foot"><button class="btn" data-act="close-sheet">Annuler</button><button class="btn primary" data-act="ed-save">Enregistrer</button></div>
  </div>`;
}
function readEditorForm() {
  const form = $('#editor-form');
  if (!form) return;
  const d = ui.sheet.draft;
  const fd = new FormData(form);
  d.n = fd.get('n') || ''; d.type = fd.get('type'); d.d = +fd.get('d'); d.t = fd.get('t'); d.p = fd.get('p'); d.st = fd.get('st') || '';
  d.i.forEach((row, idx) => {
    const name = fd.get('in-' + idx) || '';
    const changedName = name !== row.name;
    row.name = name; row.q = fd.get('iq-' + idx); row.u = fd.get('iu-' + idx); row.a = fd.get('ia-' + idx);
    if (changedName && name && row.a === 'au') row.a = guessAisle(name);
  });
}

/* ---------- Toast et confirmation ---------- */
let toastTimer;
function toast(msg) {
  let t = $('.toast');
  if (!t) { t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
  t.textContent = msg;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.remove(), 2200);
}
function confirmBox(text, ok, onYes) { ui.dialog = { text, ok, onYes }; renderOverlays(); }

/* ---------- Actions ---------- */
function addToMenu(id, servings) {
  if (inMenu(id)) return;
  state.menu.push({ rid: id, servings: servings || state.profile.persons, day: '' });
  const r = recipeById(id);
  toast(`${r ? r.n : 'Recette'} ajoutée au menu`);
}
function removeFromMenu(id) { state.menu = state.menu.filter((m) => m.rid !== id); }
function clampInt(v, min, max) { return Math.max(min, Math.min(max, v)); }

function startNewWeek() {
  if (state.menu.length) state.history.push({ date: state.weekStart, items: state.menu.map((m) => ({ rid: m.rid, servings: m.servings })) });
  if (state.history.length > 20) state.history = state.history.slice(-20);
  state.menu = [];
  state.list = { checked: {}, have: {}, manual: [], showPantry: false, showHave: false };
  state.weekStart = mondayOf(new Date());
}

async function copyList() {
  const text = listAsText();
  let ok = false;
  try { if (navigator.clipboard && navigator.clipboard.writeText) { await navigator.clipboard.writeText(text); ok = true; } } catch (e) { ok = false; }
  if (!ok) {
    try {
      const ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select(); ok = document.execCommand('copy'); ta.remove();
    } catch (e) { ok = false; }
  }
  toast(ok ? 'Liste copiée : colle-la dans un message' : 'Copie impossible sur cet appareil');
}

function newDraft() { return { n: '', e: EMOJIS[0], type: 'plat', d: 1, t: 30, p: state.profile.persons, i: [{ name: '', q: '', u: 'g', a: 'au' }], st: '' }; }
function draftFrom(r) {
  return { n: r.n, e: r.e, type: r.type, d: r.d, t: r.t, p: r.p, i: r.i.map(([k, q, u]) => ({ name: ing(k).n, q, u, a: ing(k).a || 'au' })), st: (r.st || []).join('\n') };
}
function saveDraft() {
  readEditorForm();
  const d = ui.sheet.draft;
  const rows = d.i.filter((row) => row.name.trim());
  if (!d.n.trim()) { toast('Donne un nom à ta recette'); return; }
  if (!rows.length) { toast('Ajoute au moins un ingrédient'); return; }
  const i = rows.map((row) => {
    let key = findIngredientByName(row.name);
    if (!key) {
      key = 'x_' + norm(row.name).replace(/[^a-z0-9]+/g, '_');
      state.customIngs[key] = { n: row.name.trim().charAt(0).toUpperCase() + row.name.trim().slice(1), a: row.a || 'au' };
    } else if (state.customIngs[key]) {
      state.customIngs[key].a = row.a || state.customIngs[key].a;
    }
    const q = parseFloat(String(row.q).replace(',', '.'));
    return [key, isFinite(q) && q > 0 ? q : 1, row.u || 'pc'];
  });
  const rec = {
    id: ui.sheet.editId || 'c_' + uid(), custom: true, n: d.n.trim(), e: d.e, type: d.type, t: clampInt(parseInt(d.t, 10) || 30, 1, 999), d: +d.d || 1,
    s: [], eq: [], p: clampInt(parseInt(d.p, 10) || 4, 1, 50), i, st: d.st.split('\n').map((s) => s.trim()).filter(Boolean)
  };
  if (ui.sheet.editId) state.custom = state.custom.map((r) => (r.id === rec.id ? rec : r));
  else state.custom.push(rec);
  save();
  ui.sheet = { kind: 'recipe', id: rec.id, servings: state.profile.persons };
  toast('Recette enregistrée');
  render();
}

function handle(act, v, el) {
  const p = state.profile;
  switch (act) {
    case 'tab': ui.sheet = null; setTab(v); return;
    case 'ob-next':
      if (state.obStep >= OB_STEPS) { state.onboarded = true; ui.tab = 'decouvrir'; save(); render(true); return; }
      state.obStep++; save(); render(true); return;
    case 'ob-prev': state.obStep = Math.max(0, state.obStep - 1); save(); render(true); return;
    case 'toggle-allergy': p.allergies = p.allergies.includes(v) ? p.allergies.filter((x) => x !== v) : p.allergies.concat(v); break;
    case 'set-diet': p.diet = v; break;
    case 'add-dislike': if (!p.dislikes.includes(v)) p.dislikes.push(v); break;
    case 'rm-dislike': p.dislikes = p.dislikes.filter((x) => x !== v); break;
    case 'rm-dislike-text': p.dislikesText.splice(+v, 1); break;
    case 'set-time': p.maxTime = +v; break;
    case 'set-level': p.level = v; break;
    case 'toggle-eq': p.equipment = p.equipment.includes(v) ? p.equipment.filter((x) => x !== v) : p.equipment.concat(v); break;
    case 'persons': p.persons = clampInt(p.persons + +v, 1, 20); break;
    case 'target': p.target = clampInt(p.target + +v, 1, 21); break;
    case 'apply-persons': state.menu.forEach((m) => { m.servings = p.persons; }); break;
    case 'filter': ui.filter = v; break;
    case 'type': ui.type = v; break;
    case 'open': ui.sheet = { kind: 'recipe', id: v, servings: (inMenu(v) || {}).servings || p.persons }; save(); renderOverlays(); return;
    case 'close-sheet': ui.sheet = null; renderOverlays(); return;
    case 'close-sheet-bg': if (el === ui._target) { ui.sheet = null; renderOverlays(); } return;
    case 'sheet-servings': {
      const m = inMenu(ui.sheet.id);
      if (m) m.servings = clampInt(m.servings + +v, 1, 50);
      else ui.sheet.servings = clampInt(ui.sheet.servings + +v, 1, 50);
      break;
    }
    case 'add-from-sheet': addToMenu(v, ui.sheet.servings); break;
    case 'toggle-menu':
      if (inMenu(v)) { removeFromMenu(v); toast('Retirée du menu'); } else addToMenu(v);
      break;
    case 'fav': state.favorites = state.favorites.includes(v) ? state.favorites.filter((x) => x !== v) : state.favorites.concat(v); break;
    case 'day': { const m = inMenu(v); if (m) m.day = el.value; break; }
    case 'new-week':
      confirmBox(state.menu.length ? 'Archiver ce menu et commencer une nouvelle semaine ? La liste de courses sera remise à zéro.' : 'Commencer une nouvelle semaine ? La liste de courses sera remise à zéro.', 'Nouvelle semaine', () => { startNewWeek(); toast('Nouvelle semaine prête'); });
      return;
    case 'reuse-week': {
      const h = state.history[+v];
      if (!h) return;
      const doIt = () => {
        state.menu = h.items.filter((x) => recipeById(x.rid)).map((x) => ({ rid: x.rid, servings: x.servings, day: '' }));
        toast('Menu repris');
      };
      if (state.menu.length) confirmBox('Remplacer ton menu actuel par celui de cette semaine-là ?', 'Remplacer', doIt);
      else { doIt(); break; }
      return;
    }
    case 'check': if (state.list.checked[v]) delete state.list.checked[v]; else state.list.checked[v] = 1; break;
    case 'have': state.list.have[v] = 1; delete state.list.checked[v]; toast('Retiré : déjà à la maison'); break;
    case 'unhave': delete state.list.have[v]; break;
    case 'rm-manual': state.list.manual = state.list.manual.filter((m) => 'm:' + m.id !== v); delete state.list.checked[v]; break;
    case 'toggle-pantry': state.list.showPantry = !state.list.showPantry; break;
    case 'toggle-have': state.list.showHave = !state.list.showHave; break;
    case 'uncheck-all': state.list.checked = {}; break;
    case 'copy': copyList(); return;
    case 'rm-pantry': state.pantry = state.pantry.filter((x) => x !== v); break;
    case 'new-recipe': ui.sheet = { kind: 'editor', draft: newDraft() }; renderOverlays(); return;
    case 'edit-recipe': { const r = recipeById(v); if (!r) return; ui.sheet = { kind: 'editor', editId: v, draft: draftFrom(r) }; renderOverlays(); return; }
    case 'delete-recipe':
      confirmBox('Supprimer définitivement cette recette ?', 'Supprimer', () => {
        state.custom = state.custom.filter((r) => r.id !== v); removeFromMenu(v); state.favorites = state.favorites.filter((x) => x !== v); ui.sheet = null; toast('Recette supprimée');
      });
      return;
    case 'ed-emoji': readEditorForm(); ui.sheet.draft.e = v; renderOverlays(); return;
    case 'ed-add-ing': readEditorForm(); ui.sheet.draft.i.push({ name: '', q: '', u: 'g', a: 'au' }); renderOverlays(); return;
    case 'ed-rm-ing': readEditorForm(); ui.sheet.draft.i.splice(+v, 1); if (!ui.sheet.draft.i.length) ui.sheet.draft.i.push({ name: '', q: '', u: 'g', a: 'au' }); renderOverlays(); return;
    case 'ed-save': saveDraft(); return;
    case 'dialog-no': ui.dialog = null; renderOverlays(); return;
    case 'dialog-yes': { const fn = ui.dialog && ui.dialog.onYes; ui.dialog = null; if (fn) fn(); save(); render(); return; }
    case 'reset':
      confirmBox('Tout effacer (profil, menu, liste, recettes personnelles) et recommencer le questionnaire ?', 'Tout effacer', () => { state = defaultState(); ui.tab = 'decouvrir'; ui.sheet = null; });
      return;
    default:
      if (act.startsWith('servings:')) { const m = inMenu(act.slice(9)); if (m) m.servings = clampInt(m.servings + +v, 1, 50); break; }
      return;
  }
  save();
  render();
}

function handleForm(form) {
  const kind = form.dataset.form;
  const fd = new FormData(form);
  const p = state.profile;
  if (kind === 'dislike' || kind === 'pantry') {
    const q = String(fd.get('q') || '').trim();
    if (!q) return;
    const key = findIngredientByName(q);
    if (kind === 'dislike') {
      if (key) { if (!p.dislikes.includes(key)) p.dislikes.push(key); }
      else if (!p.dislikesText.some((t) => norm(t) === norm(q))) p.dislikesText.push(q);
    } else {
      if (!key) { toast('Choisis un ingrédient de la liste proposée'); return; }
      if (!state.pantry.includes(key)) state.pantry.push(key);
    }
  } else if (kind === 'manual') {
    const name = String(fd.get('name') || '').trim();
    if (!name) return;
    state.list.manual.push({ id: uid(), name: name.charAt(0).toUpperCase() + name.slice(1), qty: String(fd.get('qty') || '').trim(), aisle: guessAisle(name) });
    toast('Article ajouté');
  } else if (kind === 'editor') { saveDraft(); return; }
  save();
  render();
  const again = document.querySelector(`form[data-form="${kind}"] input`);
  if (again && kind === 'manual') again.focus();
}

/* ---------- Écouteurs ---------- */
document.addEventListener('pointerdown', (e) => { ui._target = e.target; });
document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-act]');
  if (!el) return;
  const act = el.dataset.act;
  if (act === 'day') return; // géré par change
  if (act === 'close-sheet-bg' && e.target !== el) return;
  e.preventDefault();
  handle(act, el.dataset.v, el);
});
document.addEventListener('change', (e) => {
  const el = e.target.closest('[data-act="day"]');
  if (el) handle('day', el.dataset.v, el);
});
document.addEventListener('submit', (e) => {
  const form = e.target.closest('form[data-form]');
  if (!form) return;
  e.preventDefault();
  handleForm(form);
});
document.addEventListener('input', (e) => {
  if (e.target.id === 'search') {
    ui.query = e.target.value;
    const res = $('#results');
    if (res) res.innerHTML = renderResults();
  }
});

/* Bouton retour d’Android */
function setupBackButton() {
  try {
    const App = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App;
    if (!App) return;
    App.addListener('backButton', () => {
      if (ui.dialog) { ui.dialog = null; renderOverlays(); return; }
      if (ui.sheet) { ui.sheet = null; renderOverlays(); return; }
      if (!state.onboarded && state.obStep > 0) { handle('ob-prev'); return; }
      if (state.onboarded && ui.tab !== 'decouvrir') { setTab('decouvrir'); return; }
      App.exitApp();
    });
  } catch (e) { /* hors application */ }
}

render(true);
setupBackButton();
