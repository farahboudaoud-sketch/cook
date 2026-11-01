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
const UNITS = [{ id: 'g', n: 'g' }, { id: 'ml', n: 'ml' }, { id: 'pc', n: 'pièce' }, { id: 'sachet', n: 'sachet' }, { id: 'cs', n: 'c. à s.' }, { id: 'cc', n: 'c. à c.' }, { id: 'pincee', n: 'pincée' }, { id: 'autre', n: 'Autre…' }];
const KNOWN_UNITS = ['g', 'ml', 'pc', 'sachet', 'cs', 'cc', 'pincee'];
/* Une recette se compte en personnes, en pièces (financiers, cookies…) ou en parts (gâteau, tarte) */
const YIELDS = [{ id: 'pers', one: 'personne', many: 'personnes' }, { id: 'pieces', one: 'pièce', many: 'pièces' }, { id: 'parts', one: 'part', many: 'parts' }];
function yieldOf(r) { return YIELDS.find((y) => y.id === (r && r.pu)) || YIELDS[0]; }
function yieldText(n, r) { const y = yieldOf(r); return n + ' ' + plural(n, y.one, y.many); }
function defaultServings(r) { return r && r.pu && r.pu !== 'pers' ? r.p : state.profile.persons; }

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
  star: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 9.7l5.9-.9z"/></svg>',
  starFull: '<svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 9.7l5.9-.9z"/></svg>',
  spark: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/></svg>',
  back: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>',
  edit: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16z"/></svg>',
  undo: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/></svg>'
};

/* Icônes du nouveau style (trait, couleur héritée) */
const svgI = (d, cls) => `<svg class="ic ${cls || ''}" viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
const IC = {
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
  compass: '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>',
  book: '<path d="M4 19V5a2 2 0 012-2h13v14H6a2 2 0 00-2 2 2 2 0 002 2h13"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  basket: '<path d="M3 9h18l-2 10a2 2 0 01-2 1.6H7A2 2 0 015 19z"/><path d="M8 9l3-6M16 9l-3-6"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.5 3.3-5.5 6.5-5.5s5.7 2 6.5 5.5"/><path d="M16 4.6a3.5 3.5 0 010 6.8M18.5 14.8c1.5.8 2.6 2.6 3 5.2"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  bars: '<path d="M6 18v-4M12 18V9M18 18V5"/>',
  euro: '<path d="M17 6.5A7 7 0 1017 17.5"/><path d="M4 10.5h9M4 13.5h9"/>',
  leaf: '<path d="M5 19c0-8 5-14 15-14 0 10-6 15-14 15"/><path d="M5 19l8-8"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>',
  bulb: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 00-3.5 10.9c.6.4 1 1.1 1 1.9V16h5v-.2c0-.8.4-1.5 1-1.9A6 6 0 0012 3z"/>',
  chevR: '<path d="M9 5l7 7-7 7"/>',
  chevD: '<path d="M6 9l6 6 6-6"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 00-1-1H5a1 1 0 00-1 1v10a1 1 0 001 1h3"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  spark: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 16v4M17 18h4"/>',
  pen: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>',
  ban: '<circle cx="12" cy="12" r="9"/><path d="M5.6 5.6l12.8 12.8"/>',
  meh: '<circle cx="12" cy="12" r="9"/><path d="M8.5 15.5c1-1 2.2-1.5 3.5-1.5s2.5.5 3.5 1.5M9 9.5h.01M15 9.5h.01"/>',
  oven: '<rect x="3.5" y="4" width="17" height="16" rx="2"/><path d="M3.5 9h17"/><circle cx="12" cy="14.5" r="2.5"/>',
  house: '<path d="M4 11l8-7 8 7v9H4z"/><path d="M10 20v-5h4v5"/>',
  jar: '<path d="M9 3h6v4l2 3v10a1 1 0 01-1 1H8a1 1 0 01-1-1V10l2-3z"/><path d="M7 13h10"/>',
  cloud: '<path d="M7 18a4.5 4.5 0 01-.6-9 6 6 0 0111.4 1.5A3.8 3.8 0 0117.5 18z"/><path d="M12 11v6M9.5 13.5L12 11l2.5 2.5"/>',
  fish: '<path d="M3 12c3-4 7-6 11-6 3 0 5 2 7 6-2 4-4 6-7 6-4 0-8-2-11-6z"/><path d="M3 12l-1-3M3 12l-1 3"/><circle cx="16" cy="11" r="1"/>',
  milk: '<path d="M8 3h8v3l2 3v11a1 1 0 01-1 1H7a1 1 0 01-1-1V9l2-3z"/><path d="M6 13h12"/>',
  bread: '<path d="M5 11a4 4 0 01-1-7.5C6 2.5 9 3 12 3s6-.5 8 .5A4 4 0 0119 11v8a1 1 0 01-1 1H6a1 1 0 01-1-1z"/>',
  can: '<path d="M7 4h10v3H7z"/><path d="M6 7h12v12a2 2 0 01-2 2H8a2 2 0 01-2-2z"/><path d="M9 12h6"/>',
  candy: '<path d="M12 21s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 11c0 5.6-7 10-7 10z"/>',
  snow: '<path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9"/>',
  bottle: '<path d="M10 2h4v4l1.5 3V20a1 1 0 01-1 1h-5a1 1 0 01-1-1V9L10 6z"/><path d="M8.5 13h7"/>',
  box: '<path d="M3.5 7.5L12 3l8.5 4.5v9L12 21l-8.5-4.5z"/><path d="M3.5 7.5L12 12l8.5-4.5M12 12v9"/>',
  star: '<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/>',
  chat: '<path d="M4 5h16v11H9l-5 4z"/>',
  photo: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="12" cy="12" r="3.5"/><path d="M8 5l1.5-2h5L16 5"/>'
};
/* Rayons : icône et couleurs */
const AISLE_STYLE = {
  fl: ['leaf', '#E7EFE0', '#3D5A2A'], bp: ['fish', '#F4E6DC', '#A93F26'], cr: ['milk', '#E4ECF1', '#2F5873'],
  bo: ['bread', '#F6E9D2', '#8A5A12'], ep: ['can', '#F1E8DA', '#7A5A2E'], es: ['jar', '#F6E9D2', '#8A5A12'],
  su: ['candy', '#F4E1E6', '#8A3350'], sg: ['snow', '#E4ECF1', '#2F5873'], bs: ['bottle', '#E4ECF1', '#2F5873'], au: ['box', '#F1E8DA', '#5C4D40']
};
function aisleIcon(id) { const a = AISLE_STYLE[id] || AISLE_STYLE.au; return `<span class="aisle-ic" style="background:${a[1]};color:${a[2]}">${svgI(IC[a[0]])}</span>`; }

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
    notes: {},
    photos: {},
    ideas: [],
    ideasSeen: [],
    overrides: {},
    hidden: [],
    ai: { key: '', model: '', provider: '', oaKey: '', oaBase: '', oaText: '', oaImage: '', oaQuality: 'medium', oaModels: [], oaInfo: '' },
    weekStart: mondayOf(new Date())
  };
}
let state = load();
const ui = { tab: 'decouvrir', query: '', filter: 'tout', type: 'tous', recFilter: 'toutes', sheet: null, dialog: null };

function load() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      const s = JSON.parse(raw);
      const d = defaultState();
      return Object.assign(d, s, { profile: Object.assign(d.profile, s.profile || {}), list: Object.assign(d.list, s.list || {}), ai: Object.assign(d.ai, s.ai || {}), notes: s.notes || {}, photos: s.photos || {}, overrides: s.overrides || {}, hidden: s.hidden || [], ideas: s.ideas || [], ideasSeen: s.ideasSeen || [] });
    }
  } catch (e) { /* stockage indisponible */ }
  return defaultState();
}
function saveRaw() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
  pushWidget();
}
function save() { saveRaw(); if (typeof syncAfterSave === 'function') syncAfterSave(); }
/* Widget d'écran d'accueil : résumé de la semaine et des courses */
let widgetTimer = null; let widgetLast = '';
function pushWidget() {
  clearTimeout(widgetTimer);
  widgetTimer = setTimeout(() => {
    try {
      const C = window.Capacitor;
      const plug = C && ((C.Plugins && C.Plugins.RecapWidget) || (C.registerPlugin && (pushWidget.p = pushWidget.p || C.registerPlugin('RecapWidget'))));
      if (!plug || !state.onboarded) return;
      const L = state.list;
      const items = buildList().filter((i) => !i.pantry && !L.have[i.id]);
      const left = items.filter((i) => !L.checked[i.id]);
      const euros = left.reduce((t, i) => t + itemCostEstimate(i), 0);
      const data = {
        done: state.menu.filter((m) => recipeById(m.rid)).length,
        target: state.profile.target,
        todo: left.length,
        budget: euros > 0 ? fmtEuro(euros < 10 ? Math.round(euros * 2) / 2 : Math.round(euros)) : ''
      };
      const key = JSON.stringify(data);
      if (key === widgetLast) return;
      widgetLast = key;
      plug.update(data).catch(() => { widgetLast = ''; });
    } catch (e) { /* hors application */ }
  }, 600);
}

/* ---------- Données dérivées ---------- */
/* Recettes de base (avec les modifications faites à la main), puis recettes personnelles */
function baseRecipe(r) { const o = state.overrides && state.overrides[r.id]; return o ? Object.assign({}, r, o, { edited: true }) : r; }
function allRecipes() { const hidden = state.hidden || []; return RECIPES.filter((r) => !hidden.includes(r.id)).map(baseRecipe).concat(state.custom); }
function recipeById(id) { const b = RECIPES.find((r) => r.id === id); return b ? baseRecipe(b) : state.custom.find((r) => r.id === id); }
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
  if (q < 250) return Math.round(q / 5) * 5;
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
    case 'sachet': { const n = forList ? Math.ceil(q - 0.01) : Math.round(q * 2) / 2; return fmtNum(n) + ' ' + plural(n, 'sachet', 'sachets'); }
    default: return fmtNum(forList ? Math.ceil(q * 2 - 0.01) / 2 : q) + ' ' + unit;
  }
}
/* Prix moyen d'un article quand on ne connaît pas le produit (estimation grossière, par rayon) */
const AISLE_DEFAULT_PRICE = { fl: 1.8, bp: 6, cr: 2.2, bo: 1.6, ep: 1.8, es: 1.5, su: 2, sg: 3.5, bs: 2.5, au: 2 };
function itemCostEstimate(it) {
  if (it.pantry) return 0;
  return it.cost > 0 ? it.cost : (AISLE_DEFAULT_PRICE[it.aisle] || 2);
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
      // « sachet » et « pièce » désignent la même chose pour un produit vendu en sachets (levure, sucre vanillé…)
      const info = ing(k);
      if (u === 'sachet' && info.l && info.l[0] === 'sachet') u = 'pc';
      L.units[u] = (L.units[u] || 0) + q * f;
      if (!L.sources.includes(r.n)) L.sources.push(r.n);
    });
  });
  const items = [...lines.values()].map((L) => {
    const order = ['pc', 'sachet', 'g', 'ml', 'cs', 'cc', 'pincee'];
    const qty = order.concat(Object.keys(L.units).filter((u) => !order.includes(u))).filter((u) => L.units[u]).map((u) => fmtQty(L.units[u], u, L.key, true)).join(' + ');
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
  const views = { decouvrir: renderDiscover, recettes: renderMyRecipes, semaine: renderWeek, liste: renderList, profil: renderProfile };
  main().innerHTML = views[ui.tab]();
  main().scrollTop = prev;
  const listCount = buildList().filter((i) => !i.pantry && !state.list.checked[i.id] && !state.list.have[i.id]).length;
  $('.tabbar').innerHTML = [['decouvrir', 'Découvrir', 'compass'], ['recettes', 'Recettes', 'book'], ['semaine', 'Semaine', 'calendar'], ['liste', 'Liste', 'basket'], ['profil', 'Profil', 'user']]
    .map(([id, n, icn]) => `<button class="${ui.tab === id ? 'on' : ''}" data-act="tab" data-v="${id}" aria-current="${ui.tab === id ? 'page' : 'false'}"><span class="tab-ic">${svgI(IC[icn])}</span><span>${n}</span>${id === 'liste' && listCount ? `<span class="pill">${listCount}</span>` : ''}</button>`).join('');
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
  return `<form class="field" data-form="dislike">${ICONS.plus}<input name="q" data-suggest="ing-names" placeholder="Ajouter un aliment" autocomplete="off" enterkeyhint="done"><button class="link" type="submit">Ajouter</button></form>
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
const CAT_NAMES = { brunch: 'Petit-déj', salade: 'Salades', soupe: 'Soupes', plat: 'Plats', dessert: 'Desserts' };
function catImage(typeId) {
  const list = allRecipes().filter((r) => (typeId === 'tous' || r.type === typeId) && !hiddenReason(r));
  const withImg = list.filter((r) => isSeason(r) && imageSrc(r)).concat(list.filter((r) => imageSrc(r)));
  return withImg[0] || list[0];
}
function renderDiscover() {
  const filters = [['tout', 'Tout'], ['idees', 'Idées IA'], ['saison', 'De saison'], ['rapide', 'Rapide'], ['antigaspi', 'Anti-gaspi']];
  const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  const cats = [['tous', 'Tout']].concat(TYPES.map((t) => [t.id, CAT_NAMES[t.id] || t.name])).map(([id, n]) => {
    if (id === 'tous') return `<button class="cat ${ui.type === id ? 'on' : ''}" data-act="type" data-v="tous" aria-pressed="${ui.type === id}"><span class="cat-img">${svgI(IC.book)}</span>${n}</button>`;
    const r = catImage(id);
    const src = r && imageSrc(r);
    return `<button class="cat ${ui.type === id ? 'on' : ''}" data-act="type" data-v="${id}" aria-pressed="${ui.type === id}">
      <span class="cat-img" style="${src ? '' : `background:${r ? hashColor(r.id) : 'var(--tint)'}`}">${src ? `<img src="${esc(src)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">` : (r ? r.e || '🍽️' : '')}</span>${n}</button>`;
  }).join('');
  return `<div class="page">
    <div class="home-head">
      <div><div class="kicker">${esc(today)}</div><h1>Qu’est-ce qu’on mange cette semaine&nbsp;?</h1></div>
      <button class="round-btn" data-act="ai-open" aria-label="Générer une recette avec l’IA">${svgI(IC.spark)}</button>
    </div>
    <label class="search-box">${svgI(IC.search)}<input id="search" type="search" placeholder="Une recette, un ingrédient…" value="${esc(ui.query)}" autocomplete="off" enterkeyhint="search" aria-label="Rechercher"></label>
    <div class="scroll-x cats">${cats}</div>
    <div class="chips scroll pills" role="tablist">${filters.map(([id, n]) => `<button role="tab" class="chip ${ui.filter === id ? 'on' : 'soft'}" data-act="filter" data-v="${id}" aria-selected="${ui.filter === id}">${n}</button>`).join('')}</div>
    <div id="results">${renderResults()}</div>
  </div>`;
}
/* Petite carte (carrousels) */
function recipeCardSm(r) {
  const added = !!inMenu(r.id);
  return `<div class="card sm">
    <div class="tile" style="background:${hashColor(r.id)}">
      <span class="tile-emoji" aria-hidden="true">${r.e || '🍽️'}</span>${imgTag(r, 'tile-img')}
      <button class="tile-open" data-act="open" data-v="${r.id}" aria-label="Voir ${esc(r.n)}"></button>
      <span class="time">${r.t} min</span>
      <button class="add ${added ? 'on' : ''}" data-act="toggle-menu" data-v="${r.id}" aria-label="${added ? 'Retirer du menu' : 'Ajouter au menu'}">${added ? svgI(IC.check, 'ic-s') : svgI(IC.plus, 'ic-s')}</button>
    </div>
    <button class="card" data-act="open" data-v="${r.id}"><span class="card-name">${esc(r.n)}</span></button>
  </div>`;
}
/* Blocs de l'accueil (sans recherche ni filtre) */
function homeBlocks(visible) {
  const p = state.profile;
  const menu = state.menu.map((m) => recipeById(m.rid)).filter(Boolean);
  const nSlots = Math.max(5, Math.min(7, p.target));
  const slots = Array.from({ length: nSlots }, (_, i) => {
    const r = menu[i];
    if (!r) return i < p.target ? `<span class="week-slot free">${svgI(IC.plus)}</span>` : '';
    return `<span class="week-slot" style="background:${hashColor(r.id)}">${r.e || ''}${imgTag(r, '')}</span>`;
  }).join('');
  const left = Math.max(0, p.target - menu.length);
  const listCount = buildList().filter((i) => !i.pantry && !state.list.checked[i.id] && !state.list.have[i.id]).length;
  const week = `<div class="dark-block">
    <button class="row between" style="background:none;border:0;padding:0;color:inherit;text-align:left;align-items:baseline" data-act="tab" data-v="semaine">
      <span style="display:flex;flex-direction:column;gap:4px"><span class="eyebrow">Ma semaine</span><span class="big">${menu.length} ${plural(menu.length, 'recette', 'recettes')} sur ${p.target}</span></span>
      <span class="serif italic" style="color:#E9B9A6;font-size:15px">${left ? `plus que ${left}&nbsp;!` : 'complet&nbsp;!'}</span>
    </button>
    <div class="week-slots" style="grid-template-columns:repeat(${nSlots},minmax(0,1fr))">${slots}</div>
    ${listCount ? `<button class="dark-link" data-act="tab" data-v="liste"><span>${svgI(IC.basket)}${listCount} ${plural(listCount, 'article', 'articles')} dans ma liste</span>${svgI(IC.chevR, 'ic-s')}</button>` : ''}
  </div>`;

  // Idée du jour : change chaque jour, de saison et pas déjà au menu
  const pool = visible.filter((r) => !inMenu(r.id) && r.type !== 'brunch');
  const seasonal = pool.filter((r) => r.s && r.s.includes(currentSeason()));
  const src = seasonal.length ? seasonal : pool;
  let idea = '';
  if (src.length) {
    const d = new Date(); const dayN = Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 864e5);
    const r = src[dayN % src.length];
    const n = state.notes[r.id];
    const added = !!inMenu(r.id);
    idea = `<section style="display:flex;flex-direction:column;gap:12px"><h2 class="h2">L’idée du jour</h2>
      <div class="feature">
        <div class="feature-img" style="background:${hashColor(r.id)}"><span aria-hidden="true">${r.e || '🍽️'}</span>${imgTag(r, '')}
          <button class="tile-open" data-act="open" data-v="${r.id}" aria-label="Voir ${esc(r.n)}"></button>
          ${r.s && r.s.includes(currentSeason()) ? `<span class="float-tag">${svgI(IC.leaf, 'ic-s')}De saison</span>` : ''}
        </div>
        <div class="feature-body">
          <button class="card" data-act="open" data-v="${r.id}"><h3>${esc(r.n)}</h3></button>
          <div class="row" style="justify-content:space-between;gap:8px">
            <div class="row" style="gap:8px;flex-wrap:wrap">
              <span class="badge">${svgI(IC.clock, 'ic-s')}${r.t} min</span>
              <span class="badge">${svgI(IC.bars, 'ic-s')}${DIFF[r.d] || ''}</span>
              ${n && n.stars ? `<span class="badge">${svgI(IC.star, 'ic-s')}${n.stars}/5</span>` : ''}
            </div>
            <button class="outline-add ${added ? 'on' : ''}" data-act="toggle-menu" data-v="${r.id}" aria-label="${added ? 'Retirer du menu' : 'Ajouter au menu'}">${svgI(added ? IC.check : IC.plus, 'ic-s')}</button>
          </div>
        </div>
      </div></section>`;
  }

  const quick = visible.filter((r) => r.t <= 30).sort((a, b) => isSeason(b) - isSeason(a) || a.t - b.t).slice(0, 10);
  const quickHtml = quick.length ? `<section style="display:flex;flex-direction:column;gap:12px">
      <div class="sec-head"><h2 class="h2">Prêt en 30 min max</h2><button class="link" data-act="filter" data-v="rapide">Tout voir</button></div>
      <div class="scroll-x" style="gap:12px">${quick.map(recipeCardSm).join('')}</div></section>` : '';

  let gaspi = '';
  if (state.menu.length) {
    const sc = visible.map((r) => ({ r, sh: shared(r) })).filter((x) => x.sh.length).sort((a, b) => b.sh.length - a.sh.length).slice(0, 3);
    if (sc.length) {
      gaspi = `<section style="display:flex;flex-direction:column;gap:12px">
        <div class="sec-head"><div><h2 class="h2">Avec ce qui est déjà dans ta liste</h2><div class="sec-sub">Moins de courses, moins de gaspi</div></div></div>
        ${sc.map(({ r, sh }) => `<div class="row-card">
          <span class="thumb" style="background:${hashColor(r.id)}">${r.e || ''}${imgTag(r, '')}</span>
          <button class="body" data-act="open" data-v="${r.id}"><span class="name">${esc(r.n)}</span><span class="badge sage" style="align-self:flex-start">${sh.length} ${plural(sh.length, 'ingrédient', 'ingrédients')} en commun</span></button>
          <button class="outline-add" data-act="toggle-menu" data-v="${r.id}" aria-label="Ajouter au menu">${svgI(IC.plus, 'ic-s')}</button>
        </div>`).join('')}
        <button class="link" style="align-self:flex-start;text-decoration:none" data-act="filter" data-v="antigaspi">Voir toutes les recettes anti-gaspi</button>
      </section>`;
    }
  }
  return week + idea + quickHtml + gaspi;
}
function renderResults() {
  if (ui.filter === 'idees') return renderIdeas();
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
    let msg = q ? 'Aucune recette de ton carnet ne correspond à « ' + esc(ui.query) + ' ».' : 'Aucune recette ne correspond.';
    if (ui.filter === 'antigaspi') msg = state.menu.length ? 'Aucune autre recette ne partage d’ingrédient avec ton menu.' : 'Ajoute d’abord une recette à ton menu : les recettes qui réutilisent ses ingrédients apparaîtront ici.';
    html = `<div class="empty"><span>${msg}</span></div>`;
  } else {
    html = '<div class="grid">' + scored.map(({ r, sh, dis }) => recipeCard(r, sh, dis)).join('') + '</div>';
    if (!q && ui.filter === 'tout' && ui.type === 'tous') {
      html = `<div style="display:flex;flex-direction:column;gap:26px">${homeBlocks(list)}<section style="display:flex;flex-direction:column;gap:14px"><h2 class="h2">Toutes les recettes</h2>${html}</section></div>`;
    }
  }
  if (q) html += aiSuggest(ui.query);
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
  const dayName = (id) => { const sl = SLOTS.find((x) => x.id === id); if (!sl) return ''; const [d, w] = sl.name.split(' '); return d.slice(0, 3) + '. ' + w; };
  const menuHtml = items.length ? items.map(({ m, r }) => `
    <div class="menu-card">
      <button class="mini" style="background:${hashColor(r.id)};border:0;padding:0" data-act="open" data-v="${r.id}" aria-label="Voir ${esc(r.n)}">${r.e || '🍽️'}${imgTag(r, '')}</button>
      <div class="body">
        <div class="row" style="align-items:flex-start;gap:6px"><button class="name" data-act="open" data-v="${r.id}">${esc(r.n)}</button>
        <button class="icon-btn x" data-act="toggle-menu" data-v="${r.id}" aria-label="Retirer ${esc(r.n)} du menu">${ICONS.close}</button></div>
        <span class="muted small">${r.t} min · ${DIFF[r.d] || ''}</span>
        <div class="row" style="flex-wrap:wrap;gap:8px;margin-top:auto">
          <label class="day-pick ${m.day ? '' : 'none'}">${svgI(m.day ? IC.calendar : IC.plus, 'ic-s')}${m.day ? esc(dayName(m.day)) : 'Jour'}
            <select data-act="day" data-v="${r.id}" aria-label="Jour">
              <option value="">Jour non choisi</option>
              ${SLOTS.map((sl) => `<option value="${sl.id}" ${m.day === sl.id ? 'selected' : ''}>${sl.name}</option>`).join('')}
            </select></label>
          ${stepper('servings:' + r.id, m.servings, 'Quantité')}
        </div>
      </div>
    </div>`).join('') : '';

  const hist = state.history.slice().reverse().map((h, i) => {
    const names = h.items.map((x) => recipeById(x.rid)).filter(Boolean).map((r) => r.n);
    return `<div class="rule-row" style="padding:10px 0;display:flex;gap:12px;align-items:center">
      <div style="flex:1;min-width:0"><div class="serif" style="font-size:16px">Semaine du ${fmtDate(h.date)}</div>
      <div class="muted small">${esc(names.slice(0, 3).join(', '))}${names.length > 3 ? ` et ${names.length - 3} autre${names.length - 3 > 1 ? 's' : ''}` : ''}</div></div>
      <button class="link" data-act="reuse-week" data-v="${state.history.length - 1 - i}">Reprendre</button></div>`;
  }).join('');

  const pct = Math.min(100, Math.round(items.length / Math.max(1, p.target) * 100));
  const budget = listBudget();
  const start = new Date(state.weekStart + 'T12:00:00');
  const todayStr = todayIso();
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start); d.setDate(start.getDate() + i);
    const iso = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    const has = items.some(({ m }) => m.day && m.day.startsWith(i + '-'));
    return `<div class="day ${has ? 'has' : ''} ${iso === todayStr ? 'today' : ''}"><small>${DAYS[i].slice(0, 3)}</small><b>${d.getDate()}</b><i></i></div>`;
  }).join('');
  const listCount = buildList().filter((i) => !i.pantry && !state.list.checked[i.id] && !state.list.have[i.id]).length;

  return `<div class="page">
    <div><div class="kicker">Semaine du ${fmtDate(state.weekStart)}</div><div class="title-row" style="margin-top:6px"><h1>Ma semaine</h1></div></div>
    <section class="panel" style="padding:18px;display:flex;flex-direction:column;gap:16px">
      <div class="row" style="gap:16px">
        <div class="ring" style="background:conic-gradient(var(--accent) 0 ${pct}%, #F1E8DA ${pct}% 100%)" aria-label="${items.length} recettes choisies sur ${p.target}"><span>${items.length}/${p.target}</span></div>
        <div style="display:flex;flex-direction:column;gap:4px">
          <span class="serif" style="font-size:19px;font-weight:700;line-height:1.2">${missing ? `Encore ${missing} ${plural(missing, 'recette', 'recettes')} à choisir` : 'Ta semaine est complète'}</span>
          ${budget > 0 ? `<span class="muted" style="font-size:14px">≈ ${fmtEuro(budget < 10 ? Math.round(budget * 2) / 2 : Math.round(budget))} de courses</span>` : ''}
        </div>
      </div>
      <div class="set-grid">
        <div class="set-box"><span class="lab">${svgI(IC.users, 'ic-s')}Je cuisine pour</span>${stepper('persons', p.persons, 'Nombre de personnes')}</div>
        <div class="set-box"><span class="lab">${svgI(IC.book, 'ic-s')}Recettes / sem.</span>${stepper('target', p.target, 'Nombre de recettes')}</div>
      </div>
      ${items.some(({ m, r }) => yieldOf(r).id === 'pers' && m.servings !== p.persons) ? `<button class="link" style="align-self:flex-start;min-height:32px;padding:0" data-act="apply-persons">Mettre toutes les recettes à ${p.persons} ${plural(p.persons, 'personne', 'personnes')}</button>` : ''}
    </section>
    <div class="days" aria-hidden="true">${days}</div>
    ${menuHtml}
    ${missing || !items.length ? `<button class="add-slot" data-act="tab" data-v="decouvrir"><span class="plus">${svgI(IC.plus)}</span><span><b>${items.length ? `Ajouter ${missing} ${plural(missing, 'recette', 'recettes')}` : 'Choisir mes recettes'}</b><small>${state.menu.length ? 'Les recettes qui réutilisent tes ingrédients sont mises en avant' : 'Parcours le carnet dans Découvrir'}</small></span></button>` : ''}
    ${items.length ? `<button class="dark-link" style="min-height:54px;padding:0 18px;font-size:16px;font-weight:600;background:var(--ink)" data-act="tab" data-v="liste"><span>${svgI(IC.basket)}Voir ma liste de courses</span>${listCount ? `<span class="badge solid" style="padding:3px 9px;border-radius:999px">${listCount}</span>` : svgI(IC.chevR, 'ic-s')}</button>` : ''}
    <button class="btn" data-act="new-week">Commencer une nouvelle semaine</button>
    ${hist ? `<div class="section-title" style="margin-top:10px">Semaines précédentes</div><div>${hist}</div>` : ''}
  </div>`;
}
function listBudget() {
  const L = state.list;
  return buildList().filter((i) => !i.pantry && !L.have[i.id]).reduce((t, i) => t + itemCostEstimate(i), 0);
}

/* ---------- Liste ---------- */
function renderList() {
  const items = buildList();
  const L = state.list;
  const visible = items.filter((i) => !i.pantry && !L.have[i.id]);
  const pantryItems = items.filter((i) => i.pantry && !L.have[i.id]);
  const haveItems = items.filter((i) => L.have[i.id]);
  const todo = visible.filter((i) => !L.checked[i.id]).length;
  const budget = visible.reduce((s, i) => s + itemCostEstimate(i), 0);
  const left = visible.filter((i) => !L.checked[i.id]).reduce((s, i) => s + itemCostEstimate(i), 0);
  const byAisle = AISLES.map((a) => ({ a, v: visible.filter((i) => i.aisle === a.id).reduce((s, i) => s + itemCostEstimate(i), 0) })).filter((x) => x.v > 0).sort((x, y) => y.v - x.v);
  const round = (x) => (x < 10 ? Math.round(x * 2) / 2 : Math.round(x));
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
  const view = ui.listView || 'tout';
  const doneCount = visible.length - todo;
  const closed = ui.aisleClosed || (ui.aisleClosed = {});
  const sections = AISLES.map((a) => {
    const all = visible.filter((i) => i.aisle === a.id);
    if (!all.length) return '';
    const its = all.filter((i) => view === 'tout' || (view === 'todo' ? !L.checked[i.id] : L.checked[i.id]));
    if (!its.length) return '';
    its.sort((x, y) => (!!L.checked[x.id]) - (!!L.checked[y.id]) || x.name.localeCompare(y.name, 'fr'));
    const sub = all.reduce((t, i) => t + itemCostEstimate(i), 0);
    const got = all.filter((i) => L.checked[i.id]).length;
    const open = !closed[a.id];
    return `<section class="aisle ${open ? 'open' : ''}">
      <button class="aisle-head" data-act="aisle" data-v="${a.id}" aria-expanded="${open}">${aisleIcon(a.id)}
        <span class="aisle-t"><b>${a.name}</b><small>${got === all.length ? 'Tout est pris' : `${got} / ${all.length} ${plural(got, 'pris', 'pris')}`}</small></span>
        ${sub > 0 ? `<span class="aisle-cost">≈ ${fmtEuro(round(sub))}</span>` : ''}${svgI(IC.chevD, 'ic-s aisle-chev')}
      </button>
      ${open ? `<div class="aisle-body">${its.map(itemHtml).join('')}</div>` : ''}
    </section>`;
  }).join('');

  const addForm = `<form class="field" data-form="manual" style="flex-wrap:nowrap">${svgI(IC.plus)}
      <input name="name" placeholder="Ajouter un article" autocomplete="off" data-suggest="ing-names" enterkeyhint="done" aria-label="Article">
      <input name="qty" placeholder="Qté" autocomplete="off" style="max-width:52px;text-align:right" aria-label="Quantité">
      <button class="btn primary" style="min-height:38px;padding:0 14px;font-size:14px;box-shadow:none" type="submit">Ajouter</button></form>${ingredientDatalist()}`;

  const empty = !visible.length && !pantryItems.length && !haveItems.length;
  const pct = visible.length ? Math.round(doneCount / visible.length * 100) : 0;
  return `<div class="page">
    <div class="home-head" style="align-items:flex-end">
      <div><div class="kicker">${visible.length} ${plural(visible.length, 'article', 'articles')} · ${recipesCount} ${plural(recipesCount, 'recette', 'recettes')}</div><h1 style="font-size:32px;margin-top:6px">Les courses</h1></div>
      ${visible.length ? `<button class="round-btn" style="color:var(--ink)" data-act="copy" aria-label="Copier la liste">${svgI(IC.copy)}</button>` : ''}
    </div>
    ${visible.length ? `<section class="dark-block">
      <div class="row between" style="align-items:flex-end">
        <div style="display:flex;flex-direction:column;gap:2px"><span style="font-size:13px;color:#E9B9A6">Dans le panier</span><span class="serif" style="font-size:26px;font-weight:700">${doneCount} <span style="font-size:17px;font-weight:500;color:#CDBBAA">/ ${visible.length}</span></span></div>
        ${budget > 0 ? `<div style="display:flex;flex-direction:column;gap:2px;align-items:flex-end"><span style="font-size:13px;color:#E9B9A6">${left < budget - 0.01 ? 'Reste à acheter' : 'Budget estimé'}</span><span class="serif" style="font-size:26px;font-weight:700">≈ ${fmtEuro(round(left < budget - 0.01 ? left : budget))}</span></div>` : ''}
      </div>
      <div class="prog" aria-hidden="true"><i style="width:${pct}%"></i></div>
      ${budget > 0 ? `<span style="font-size:11px;color:#CDBBAA">Prix moyens indicatifs${left < budget - 0.01 ? ` · panier complet ≈ ${fmtEuro(round(budget))}` : ''}, hors placard et articles « déjà à la maison ».</span>` : ''}
    </section>` : ''}
    ${addForm}
    ${visible.length ? `<div class="chips scroll pills">${[['tout', 'Tout', visible.length], ['todo', 'À acheter', todo], ['done', 'Pris', doneCount]].map(([id, n, c]) => `<button class="chip dark ${view === id ? 'on' : 'soft'}" data-act="list-view" data-v="${id}" aria-pressed="${view === id}">${n} · ${c}</button>`).join('')}</div>` : ''}
    ${empty ? `<div class="empty"><span class="empty-ic">${svgI(IC.basket)}</span><span class="big" style="font-size:18px">Ta liste est vide</span><span>Ajoute des recettes à ta semaine : leurs ingrédients s’afficheront ici, regroupés par rayon.</span><button class="btn primary" data-act="tab" data-v="decouvrir">Choisir des recettes</button></div>` : sections || (visible.length ? `<p class="muted" style="text-align:center;margin:8px 0">${view === 'todo' ? 'Tout est dans le panier !' : 'Rien de coché pour l’instant.'}</p>` : '')}
    ${pantryItems.length ? `<div class="side-card">
      <div class="row between"><span class="serif" style="font-size:17px;font-weight:700">Dans ton placard</span><button class="link" style="text-decoration:none" data-act="toggle-pantry">${L.showPantry ? 'Masquer' : `Afficher (${pantryItems.length})`}</button></div>
      ${L.showPantry ? pantryItems.map(itemHtml).join('') : '<span class="muted small">Sel, huile, épices… considérés comme déjà chez toi.</span>'}
    </div>` : ''}
    ${haveItems.length ? `<div class="side-card">
      <div class="row between"><span class="serif" style="font-size:17px;font-weight:700">Déjà à la maison</span><button class="link" style="text-decoration:none" data-act="toggle-have">${L.showHave ? 'Masquer' : `Afficher (${haveItems.length})`}</button></div>
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
  const open = ui.profOpen || (ui.profOpen = {});
  const timeName = (TIME_OPTIONS.find((o) => o.v === p.maxTime) || {}).n || '';
  const levelName = (LEVELS.find((l) => l.id === p.level) || {}).n || '';
  const dislikes = (p.dislikes || []).map((k) => ing(k).n).concat((p.dislikesText || []).filter(Boolean));
  const short = (arr, n) => arr.length ? arr.slice(0, n).join(', ') + (arr.length > n ? ` +${arr.length - n}` : '') : '';
  const sec = (id, icn, colors, title, summary, body, stateTag) => `<section class="prof-sec ${open[id] ? 'open' : ''}">
      <button class="prof-head" data-act="prof-sec" data-v="${id}" aria-expanded="${!!open[id]}">
        <span class="prof-ic" style="background:${colors[0]};color:${colors[1]}">${svgI(IC[icn])}</span>
        <span class="prof-txt"><span class="prof-title">${title}</span><span class="prof-sum">${esc(summary)}</span></span>
        ${stateTag || ''}${svgI(open[id] ? IC.chevD : IC.chevR, 'ic-s prof-chev')}
      </button>
      ${open[id] ? `<div class="prof-body">${body}</div>` : ''}
    </section>`;
  const T = ['#F4E6DC', '#A93F26'], S = ['#E7EFE0', '#3D5A2A'], B = ['#F1E8DA', '#7A5A2E'], J = ['#F6E9D2', '#8A5A12'], D = ['#2B211A', '#FBF6EE'];
  const chips = [allergies.length ? 'Sans ' + allergies.join(', ').toLowerCase() : 'Aucune allergie', diet && p.diet !== 'aucun' ? diet : 'Pas de régime', `${p.persons} ${plural(p.persons, 'personne', 'personnes')}`, `${p.target} ${plural(p.target, 'recette', 'recettes')} / semaine`, levelName ? 'Niveau ' + levelName.toLowerCase() : '', p.maxTime ? 'Max ' + timeName : ''].filter(Boolean);
  const syncOk = typeof syncOn === 'function' && syncOn();
  return `<div class="page">
    <div><div class="kicker">Mes réglages</div><div class="title-row" style="margin-top:6px"><h1>Profil</h1></div></div>
    <section class="dark-block">
      <div class="row" style="gap:14px">
        <span style="flex:none;width:54px;height:54px;border-radius:50%;background:var(--accent);display:flex;align-items:center;justify-content:center">${svgI('<path d="M6 13.5V19a1 1 0 001 1h10a1 1 0 001-1v-5.5"/><path d="M6 13.5a4 4 0 01-.6-7.9A4.5 4.5 0 0112 3.6a4.5 4.5 0 016.6 2 4 4 0 01-.6 7.9z"/><path d="M6 16.5h12"/>')}</span>
        <span style="display:flex;flex-direction:column;gap:2px"><span class="serif" style="font-size:20px;font-weight:700">Ma cuisine</span><span style="font-size:13px;color:#D9C8B8">Ce qui guide les recettes proposées</span></span>
      </div>
      <div class="sum-chips">${chips.map((c) => `<span>${esc(c)}</span>`).join('')}</div>
    </section>
    <div class="prof-group"><div class="mini-lbl">Mes goûts</div><div class="prof-list">
    ${sec('allergies', 'ban', T, 'À éviter absolument', short(allergies, 3) || 'Aucune allergie', `<p class="muted small" style="margin:0">Les recettes qui en contiennent ne sont jamais proposées.</p>${allergyPicker()}`)}
    ${sec('diet', 'leaf', S, 'Régime', diet || 'Aucun', dietPicker())}
    ${sec('dislikes', 'meh', B, 'Ce que je n’aime pas', short(dislikes, 3) || 'Rien de particulier', dislikePicker())}
    </div></div>
    <div class="prof-group"><div class="mini-lbl">Ma cuisine</div><div class="prof-list">
    ${sec('cooking', 'oven', T, 'Temps, niveau et équipement', [timeName, levelName, (p.equipment || []).length + ' équipement' + ((p.equipment || []).length > 1 ? 's' : '')].filter(Boolean).join(' · '), cookingPicker())}
    ${sec('household', 'house', T, 'Mon foyer', `${p.persons} ${plural(p.persons, 'personne', 'personnes')} · ${p.target} ${plural(p.target, 'recette', 'recettes')} par semaine`, householdPicker())}
    ${sec('pantry', 'jar', J, 'Mon placard de base', state.pantry.length + ' ' + plural(state.pantry.length, 'produit', 'produits') + ' toujours à la maison', `<p class="muted small" style="margin:0">Ces produits sont toujours chez toi : ils sont masqués de la liste de courses.</p>
      <div class="chips">${pantry || '<span class="muted small">Placard vide.</span>'}</div>
      <form class="field" data-form="pantry">${svgI(IC.plus)}<input name="q" data-suggest="ing-names" placeholder="Ajouter au placard" autocomplete="off" enterkeyhint="done"><button class="link" type="submit">Ajouter</button></form>`)}
    </div></div>
    <div class="prof-group"><div class="mini-lbl">Appli</div><div class="prof-list">
    ${sec('ai', 'spark', D, 'Assistant IA', 'Recettes et images générées', `<p class="muted small" style="margin:0">Pour générer des recettes qui ne sont pas dans le carnet, et des images.</p>${keyForm()}`, `<span class="prof-state ${aiReady() ? 'ok' : ''}">${aiReady() ? 'Activé' : 'Pas de clé'}</span>`)}
    ${sec('sync', 'cloud', B, 'Sauvegarde sur GitHub', syncOk ? syncSummary() : 'Pour tout retrouver sur un autre téléphone', syncHtml(), `<span class="prof-state ${syncOk ? 'ok' : ''}" style="${syncOk ? '' : 'background:#F1E8DA;color:#5C4D40'}">${syncOk ? 'Activée' : 'Désactivée'}</span>`)}
    </div></div>
    ${(state.hidden || []).length ? `<div class="row between"><span class="muted small">${state.hidden.length} ${plural(state.hidden.length, 'recette masquée', 'recettes masquées')}</span><button class="link" data-act="unhide-all">Tout réafficher</button></div>` : ''}
    <div style="display:flex;justify-content:center;margin-top:6px">
      <button class="btn" data-act="reset" style="border-color:var(--accent);color:var(--accent);min-height:44px;border-radius:999px">Tout réinitialiser</button>
    </div>
  </div>`;
}

/* ---------- Fiches et fenêtres ---------- */
function renderOverlays() {
  let host = $('#overlays');
  if (!host) { host = document.createElement('div'); host.id = 'overlays'; document.body.appendChild(host); }
  let html = '';
  if (ui.sheet) {
    const body = ui.sheet.kind === 'recipe' ? recipeSheet(ui.sheet) : ui.sheet.kind === 'ai' ? aiSheet(ui.sheet) : editorSheet(ui.sheet);
    const full = true;
    html += `<div class="overlay ${ui.sheet.keepScroll ? '' : 'anim'} ${full ? 'ov-full' : ''}" data-act="close-sheet-bg">${body}</div>`;
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
  const r = sh.preview ? sh.preview : recipeById(sh.id);
  if (!r) return '';
  if (sh.preview) return previewSheet(sh, r);
  const m = inMenu(r.id);
  const servings = m ? m.servings : sh.servings;
  const f = servings / r.p;
  const fav = state.favorites.includes(r.id);
  const dis = dislikedIn(r);
  const sh2 = shared(r);
  const reason = hiddenReason(r);
  const seasons = (r.s && r.s.length ? r.s.map((x) => SEASONS[x]).join(', ') : 'Toute l’année');
  const cost = recipeCostPerPerson(r);
  const ph = photoOf(r);
  const note = state.notes[r.id] || {};
  const typeName = (TYPES.find((t) => t.id === r.type) || {}).name || '';
  const groups = groupIngredients(r.i).map((g) => ({ name: g.name, items: g.items.filter(([k]) => !state.pantry.includes(k)) })).filter((g) => g.items.length);
  const pantryLines = r.i.filter(([k]) => state.pantry.includes(k));
  const info3 = cost > 0 && !r.custom
    ? [svgI(IC.euro), fmtEuro(cost), 'par ' + yieldOf(r).one]
    : [svgI(IC.leaf), r.s && r.s.length ? r.s.map((x) => SEASONS[x]).join(', ') : 'Toute l’année', 'Saison'];
  const tiles = (items) => `<div class="ing-tiles">${items.map(([k, q, u]) => `<div class="ing-tile"><b>${fmtQty(q * f, u, k, false)}</b><span>${esc(ing(k).n)}</span></div>`).join('')}</div>`;
  return `<div class="sheet full recipe" role="dialog" aria-modal="true" aria-label="${esc(r.n)}">
    <div class="sheet-head">
      <button class="float-btn" data-act="close-sheet" aria-label="Fermer">${ICONS.back}</button>
      <div class="row" style="gap:10px">
        <button class="float-btn" data-act="edit-recipe" data-v="${r.id}" aria-label="Modifier la recette">${svgI(IC.pen)}</button>
        <button class="float-btn accent" data-act="fav" data-v="${r.id}" aria-pressed="${fav}" aria-label="${fav ? 'Retirer des favoris' : 'Ajouter aux favoris'}">${fav ? ICONS.heartFull : ICONS.heart}</button>
      </div>
    </div>
    <div class="sheet-body has-foot">
      <div class="r-hero" style="background:${hashColor(r.id)}"><span aria-hidden="true">${r.e || '🍽️'}</span>${ph ? `<img src="${esc(ph.src)}" alt="${esc(r.n)}" referrerpolicy="no-referrer" onerror="this.remove()">` : ''}
        ${ph ? `<span class="credit-tag">${creditHtml(ph)}</span>` : imgPending[r.id] ? '<span class="credit-tag">Image en cours…</span>' : ''}
      </div>
      <div class="r-sheet">
        <div class="kicker">${esc(typeName)}${r.custom ? ' · Ma recette' : ''}${r.edited ? ' · Modifiée' : ''}</div>
        <h2>${esc(r.n)}</h2>
        ${note.stars ? `<div class="r-stars" aria-label="Ma note : ${note.stars} sur 5">${[1, 2, 3, 4, 5].map((k) => svgI(IC.star, k <= note.stars ? 'on' : '')).join('')}<span>Ma note${note.last ? ' · faite le ' + fmtDate(note.last) : ''}</span></div>` : ''}
      </div>
      ${sourceHtml(r)}
      <div class="info-grid">
        <div class="info"><span class="info-ic">${svgI(IC.clock)}</span><b>${r.t} min</b><small>Temps total</small></div>
        <div class="info"><span class="info-ic">${svgI(IC.bars)}</span><b>${DIFF[r.d] || '—'}</b><small>Niveau</small></div>
        <div class="info"><span class="info-ic">${info3[0]}</span><b>${esc(info3[1])}</b><small>${esc(info3[2])}</small></div>
      </div>
      ${reason ? `<div class="callout warn">${svgI(IC.ban)}<span>Cette recette ne correspond pas à ton profil (${{ regime: 'régime ou allergie', equipement: 'équipement', niveau: 'niveau', temps: 'temps' }[reason]}).</span></div>` : ''}
      ${dis.length ? `<div class="callout warn">${svgI(IC.meh)}<span>Contient ${esc(dis.join(', ').toLowerCase())}, que tu n’aimes pas.</span></div>` : ''}
      ${sh2.length ? `<div class="callout sage">${svgI(IC.leaf)}<span><b style="font-weight:600">${sh2.length} ${plural(sh2.length, 'ingrédient déjà', 'ingrédients déjà')} dans ton menu</b> : ${esc(sh2.map((k) => ing(k).n.toLowerCase()).join(', '))}.</span></div>` : ''}
      <div class="jump"><button data-act="jump" data-v="sec-ing">Ingrédients</button><button data-act="jump" data-v="sec-prep">Préparation</button><button data-act="jump" data-v="sec-notes">Mes notes</button></div>
      <section id="sec-ing" style="display:flex;flex-direction:column;gap:12px">
        <div class="row between"><span style="font-size:15px;color:var(--muted)">Pour <b style="color:var(--ink)">${yieldText(servings, r)}</b></span>${stepper('sheet-servings', servings, 'Portions')}</div>
        ${groups.map((g) => `${g.name ? `<div class="part-title">${esc(g.name)}</div>` : ''}${tiles(g.items)}`).join('')}
        ${pantryLines.length ? `<div class="pantry-box"><span class="mini-lbl">Dans ton placard</span><span>${pantryLines.map(([k, q, u]) => `${esc(ing(k).n)} · ${fmtQty(q * f, u, k, false)}`).join(' &nbsp;—&nbsp; ')}</span></div>` : ''}
      </section>
      ${stepsHtml(r, sh)}
      ${notesHtml(r)}
      <div class="r-links">${r.custom ? `<button class="link" data-act="delete-recipe" data-v="${r.id}">Supprimer</button>` : `${r.edited ? `<button class="link" data-act="restore-recipe" data-v="${r.id}">Rétablir l’original</button>` : ''}<button class="link" data-act="hide-recipe" data-v="${r.id}">Masquer du carnet</button>`}</div>
    </div>
    <div class="sheet-foot">
      ${m ? `<button class="btn" data-act="toggle-menu" data-v="${r.id}">Retirer de ma semaine</button>` : `<button class="btn primary" data-act="add-from-sheet" data-v="${r.id}">${svgI(IC.calendar)}Ajouter à ma semaine · ${yieldOf(r).id === 'pers' ? servings + ' pers.' : yieldText(servings, r)}</button>`}
    </div>
  </div>`;
}
/* Unités : liste proposée + saisie libre dans le même champ */
const UNIT_LABELS = { g: 'g', ml: 'ml', pc: 'pièce', sachet: 'sachet', cs: 'c. à s.', cc: 'c. à c.', pincee: 'pincée' };
function unitLabel(u) { return UNIT_LABELS[u] || u || ''; }
function unitFromLabel(txt) {
  const t = norm(txt).replace(/\s+/g, ' ').replace(/\.$/, '');
  if (!t) return 'pc';
  const aliases = { g: 'g', gr: 'g', gramme: 'g', grammes: 'g', ml: 'ml', piece: 'pc', pieces: 'pc', pc: 'pc', sachet: 'sachet', sachets: 'sachet', 'c. a s': 'cs', 'c.a.s': 'cs', cas: 'cs', 'cuillere a soupe': 'cs', 'c. a c': 'cc', 'c.a.c': 'cc', cac: 'cc', 'cuillere a cafe': 'cc', pincee: 'pincee', pincees: 'pincee' };
  return aliases[t] || String(txt).trim();
}
function editorSheet(sh) {
  const d = sh.draft;
  const tab = sh.edTab || (sh.editId ? 'ing' : 'infos');
  const showParts = d.parts.length > 1 || d.parts.some((x) => x.name);
  const hide = (t) => (tab === t ? '' : 'style="display:none"');
  const tabs = [['infos', 'Infos'], ['ing', 'Ingrédients'], ['st', 'Étapes']];
  return `<div class="sheet full" role="dialog" aria-modal="true" aria-label="Modifier la recette">
    <div class="sheet-head"><span class="grab" aria-hidden="true"></span><h2 style="font-size:22px">${sh.editId ? 'Modifier la recette' : 'Nouvelle recette'}</h2><button class="icon-btn" data-act="close-sheet" aria-label="Fermer">${ICONS.close}</button></div>
    <div class="ed-tabs" role="tablist">${tabs.map(([id, n]) => `<button type="button" role="tab" class="${tab === id ? 'on' : ''}" aria-selected="${tab === id}" data-act="ed-tab" data-v="${id}">${n}</button>`).join('')}</div>
    <form class="sheet-body has-foot" data-form="editor" id="editor-form">
      <div class="ed-pane" ${hide('infos')}>
        <div><label class="lbl" for="ed-name">Nom</label><input class="input" id="ed-name" name="n" value="${esc(d.n)}" placeholder="Ex. : Gratin de mamie" required></div>
        <div class="row" style="gap:14px;align-items:flex-end">
          <div style="flex:1"><label class="lbl" for="ed-type">Type</label><select class="input" id="ed-type" name="type">${TYPES.map((t) => `<option value="${t.id}" ${d.type === t.id ? 'selected' : ''}>${t.name}</option>`).join('')}</select></div>
          <div style="flex:1"><label class="lbl" for="ed-d">Difficulté</label><select class="input" id="ed-d" name="d">${[1, 2, 3].map((x) => `<option value="${x}" ${+d.d === x ? 'selected' : ''}>${DIFF[x]}</option>`).join('')}</select></div>
        </div>
        <div class="row" style="gap:14px">
          <div style="flex:1"><label class="lbl" for="ed-t">Temps (min)</label><input class="input" id="ed-t" name="t" type="number" inputmode="numeric" min="1" value="${esc(d.t)}"></div>
          <div style="flex:1"><label class="lbl" for="ed-p">Pour</label><div class="row" style="gap:8px"><input class="input" id="ed-p" name="p" type="number" inputmode="numeric" min="1" value="${esc(d.p)}" style="width:64px"><select class="input" name="pu" aria-label="Unité des portions">${YIELDS.map((y) => `<option value="${y.id}" ${(d.pu || 'pers') === y.id ? 'selected' : ''}>${y.many}</option>`).join('')}</select></div></div>
        </div>
        ${editorImageHtml(sh)}
        ${sh.base ? '<p class="muted small" style="margin:0">Tes modifications sont gardées sur ce téléphone. Tu pourras toujours rétablir la recette d’origine.</p>' : ''}
      </div>
      <div class="ed-pane" ${hide('ing')}>
        <div class="ed-grid ed-head" aria-hidden="true"><span>Ingrédient</span><span style="text-align:right">Qté</span><span>Unité</span><span></span></div>
        ${d.parts.map((part, pi) => `<div class="ed-part">
          ${showParts ? `<div class="ed-part-head"><input class="ed-part-name" id="ed-pn-${pi}" name="pn-${pi}" value="${esc(part.name)}" placeholder="Nom de la partie (ex. : Pâte)" autocomplete="off" aria-label="Nom de la partie ${pi + 1}">${d.parts.length > 1 ? `<button type="button" class="icon-btn" style="width:36px;height:36px" data-act="ed-rm-part" data-v="${pi}" aria-label="Supprimer la partie ${pi + 1}">${ICONS.trash}</button>` : ''}</div>` : ''}
          ${part.rows.map((row, ri) => { const id = pi + '-' + ri; return `<div class="ed-grid ed-line">
            <div class="ed-name-cell">
              <input class="ed-name" id="ed-in-${id}" name="in-${id}" data-suggest="ing-names" value="${esc(row.name)}" placeholder="Ingrédient" autocomplete="off" aria-label="Ingrédient">
              <input type="hidden" name="ia-${id}" id="ed-ia-${id}" value="${esc(row.a || 'au')}"><button type="button" class="ed-aisle-btn" data-act="ed-aisle" data-v="${id}" aria-label="Rayon : ${esc(aisleLabel(row.a))}">${esc(aisleLabel(row.a))}<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg></button>
            </div>
            <input class="ed-qty" id="ed-iq-${id}" name="iq-${id}" type="number" inputmode="decimal" step="any" min="0" value="${esc(row.q)}" placeholder="0" aria-label="Quantité">
            <div class="ed-unit"><input class="unit-input" id="ed-iu-${id}" name="iu-${id}" value="${esc(unitLabel(row.u))}" placeholder="unité" autocomplete="off" aria-label="Unité (choisis ou écris)"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6A5649" stroke-width="2" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg></div>
            <button type="button" class="ed-del" data-act="ed-rm-ing" data-v="${pi}:${ri}" aria-label="Retirer cet ingrédient">${ICONS.close}</button>
          </div>`; }).join('')}
          <button type="button" class="link ed-add" data-act="ed-add-ing" data-v="${pi}">+ Ingrédient</button>
        </div>`).join('')}
        <button type="button" class="ed-add-part" data-act="ed-add-part">+ ${showParts ? 'Nouvelle partie' : 'Séparer en parties (pâte, garniture, crumble…)'}</button>
      </div>
      <div class="ed-pane" ${hide('st')}>
        <div class="ed-steps">${d.steps.map((stp, k) => `<div class="ed-step">
          <div class="ed-step-head"><span class="ed-step-num">${k + 1}</span><span class="ed-step-lbl">Étape ${k + 1}</span>
            ${k > 0 ? `<button type="button" class="ed-step-btn" data-act="ed-mv-step" data-v="${k}" aria-label="Monter l’étape ${k + 1}"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M18 15l-6-6-6 6"/></svg></button>` : ''}
            <button type="button" class="ed-step-btn" data-act="ed-rm-step" data-v="${k}" aria-label="Supprimer l’étape ${k + 1}">${ICONS.trash}</button></div>
          <textarea class="ed-step-text" id="ed-st-${k}" name="st-${k}" rows="3" placeholder="${k ? 'Étape suivante…' : 'Ex. : Préchauffer le four à 180 °C.'}">${esc(stp)}</textarea>
        </div>`).join('')}</div>
        <button type="button" class="btn ed-add-step" data-act="ed-add-step">+ Ajouter une étape</button>
      </div>
    </form>
    <div class="sheet-foot"><button class="btn" data-act="close-sheet">Annuler</button><button class="btn primary" data-act="ed-save">Enregistrer</button></div>
  </div>`;
}
function readEditorForm() {
  const form = $('#editor-form');
  if (!form) return;
  const d = ui.sheet.draft;
  const fd = new FormData(form);
  d.n = fd.get('n') || ''; d.type = fd.get('type'); d.d = +fd.get('d'); d.t = fd.get('t'); d.p = fd.get('p'); d.pu = fd.get('pu') || 'pers';
  d.steps = d.steps.map((x, k) => (fd.has('st-' + k) ? String(fd.get('st-' + k) || '').replace(/\s*\n\s*/g, ' ') : x));
  if (fd.has('img-note')) d.imgNote = String(fd.get('img-note') || '');
  d.parts.forEach((part, pi) => {
    if (fd.has('pn-' + pi)) part.name = String(fd.get('pn-' + pi) || '');
    part.rows.forEach((row, ri) => {
      const id = pi + '-' + ri;
      const name = fd.get('in-' + id) || '';
      const changedName = name !== row.name;
      row.name = name; row.q = fd.get('iq-' + id); row.a = fd.get('ia-' + id);
      row.u = unitFromLabel(fd.get('iu-' + id) || '');
      if (changedName && name && row.a === 'au') { const k = findIngredientByName(name); row.a = k ? (ing(k).a || 'au') : guessAisle(name); }
    });
  });
}

/* Liste d'unités qui s'ouvre sous le champ « Unité » : on choisit, ou on garde ce qu'on a écrit */
function closeUnitPop() { const p = $('.unit-pop'); if (p) p.remove(); }
function openUnitPop(input) {
  closeUnitPop();
  const q = norm(input.value);
  const opts = Object.values(UNIT_LABELS).filter((l) => !q || norm(l).startsWith(q) || q === norm(input.dataset.orig || ''));
  const pop = document.createElement('div');
  pop.className = 'unit-pop';
  const custom = input.value.trim() && !Object.values(UNIT_LABELS).some((l) => norm(l) === q) ? `<button type="button" data-u="${esc(input.value.trim())}" class="on">« ${esc(input.value.trim())} »</button>` : '';
  pop.innerHTML = `<div class="unit-pop-hint">Choisis ou écris ton unité</div>${custom}${(opts.length ? opts : Object.values(UNIT_LABELS)).map((l) => `<button type="button" data-u="${esc(l)}">${esc(l)}</button>`).join('')}`;
  const r = input.getBoundingClientRect();
  const below = window.innerHeight - r.bottom > 260;
  pop.style.left = Math.max(8, Math.min(window.innerWidth - 168, r.left - 8)) + 'px';
  pop.style[below ? 'top' : 'bottom'] = (below ? r.bottom + 4 : window.innerHeight - r.top + 4) + 'px';
  pop.addEventListener('pointerdown', (e) => {
    const b = e.target.closest('[data-u]'); if (!b) return;
    e.preventDefault(); input.value = b.dataset.u; closeUnitPop(); input.blur();
  });
  document.body.appendChild(pop);
}
document.addEventListener('focusin', (e) => { if (e.target.classList && e.target.classList.contains('unit-input')) { e.target.dataset.orig = e.target.value; e.target.select(); openUnitPop(e.target); } });
document.addEventListener('focusout', (e) => { if (e.target.classList && e.target.classList.contains('unit-input')) setTimeout(closeUnitPop, 150); });
document.addEventListener('input', (e) => { if (e.target.classList && e.target.classList.contains('unit-input')) openUnitPop(e.target); });

/* Rayons : petite liste stylée à la place du menu déroulant du téléphone */
function aisleLabel(id) { const a = AISLES.find((x) => x.id === id) || AISLES.find((x) => x.id === 'au'); return a ? a.name : 'Autres'; }
function closeAislePop() { const p = $('.aisle-pop'); if (p) p.remove(); }
function placePop(pop, anchorEl, h) {
  const r = anchorEl.getBoundingClientRect();
  const below = window.innerHeight - r.bottom > h + 10;
  pop.style.left = Math.max(8, Math.min(window.innerWidth - pop.offsetWidth - 8, r.left)) + 'px';
  if (below) pop.style.top = (r.bottom + 4) + 'px'; else pop.style.bottom = (window.innerHeight - r.top + 4) + 'px';
}
function openAislePop(btn) {
  if ($('.aisle-pop') && $('.aisle-pop').dataset.for === btn.dataset.v) { closeAislePop(); return; }
  closeAislePop(); closeSugPop();
  const hidden = $('#ed-ia-' + btn.dataset.v);
  const cur = hidden ? hidden.value : 'au';
  const pop = document.createElement('div');
  pop.className = 'pop-list aisle-pop'; pop.dataset.for = btn.dataset.v;
  pop.innerHTML = `<div class="pop-hint">Rayon du magasin</div>${AISLES.map((a) => `<button type="button" data-a="${a.id}" class="${a.id === cur ? 'on' : ''}"><span class="pop-dot" aria-hidden="true"></span>${esc(a.name)}</button>`).join('')}`;
  document.body.appendChild(pop);
  placePop(pop, btn, Math.min(360, pop.offsetHeight));
  pop.addEventListener('pointerdown', (e) => {
    const b = e.target.closest('[data-a]'); if (!b) return;
    e.preventDefault();
    if (hidden) hidden.value = b.dataset.a;
    btn.firstChild.textContent = aisleLabel(b.dataset.a);
    btn.setAttribute('aria-label', 'Rayon : ' + aisleLabel(b.dataset.a));
    closeAislePop();
  });
}
/* Suggestions d'ingrédients (à partir de 2 lettres), au même style */
function closeSugPop() { const p = $('.sug-pop'); if (p) p.remove(); }
function openSugPop(input) {
  const q = norm(input.value.trim());
  const seen = new Set(); const items = [];
  Object.values(INGREDIENTS).concat(Object.values(state.customIngs)).forEach((x) => { const k = norm(x.n); if (!seen.has(k)) { seen.add(k); items.push(x); } });
  const starts = items.filter((x) => norm(x.n).startsWith(q));
  const inside = items.filter((x) => !norm(x.n).startsWith(q) && norm(x.n).includes(q));
  const list = starts.sort((a, b) => a.n.localeCompare(b.n, 'fr')).concat(inside.sort((a, b) => a.n.localeCompare(b.n, 'fr'))).slice(0, 7);
  if (!list.length || (list.length === 1 && norm(list[0].n) === q)) { closeSugPop(); return; }
  let pop = $('.sug-pop');
  if (!pop) {
    pop = document.createElement('div'); pop.className = 'pop-list sug-pop';
    pop.addEventListener('pointerdown', (e) => {
      const b = e.target.closest('[data-n]'); if (!b) return;
      e.preventDefault();
      const inp = pop._input; inp.value = b.dataset.n;
      const m = inp.id && inp.id.match(/^ed-in-(\d+-\d+)$/);
      if (m) { const hid = $('#ed-ia-' + m[1]); const btn = $(`.ed-aisle-btn[data-v="${m[1]}"]`); if (hid) hid.value = b.dataset.a; if (btn) btn.firstChild.textContent = aisleLabel(b.dataset.a); }
      closeSugPop();
      const next = inp.id && inp.id.startsWith('ed-in-') ? $('#' + inp.id.replace('ed-in-', 'ed-iq-')) : null;
      if (next) next.focus();
    });
    document.body.appendChild(pop);
  }
  pop._input = input;
  pop.style.top = ''; pop.style.bottom = '';
  pop.style.width = Math.min(window.innerWidth - 16, Math.max(240, input.getBoundingClientRect().width + 60)) + 'px';
  const hl = (n) => { const i = norm(n).indexOf(q); return i < 0 ? esc(n) : esc(n.slice(0, i)) + '<b>' + esc(n.slice(i, i + q.length)) + '</b>' + esc(n.slice(i + q.length)); };
  pop.innerHTML = list.map((x) => `<button type="button" data-n="${esc(x.n)}" data-a="${x.a || 'au'}"><span class="sug-name">${hl(x.n)}</span><span class="sug-aisle">${esc(aisleLabel(x.a))}</span></button>`).join('');
  placePop(pop, input, pop.offsetHeight);
}
document.addEventListener('focusout', (e) => { if (e.target.dataset && e.target.dataset.suggest) setTimeout(() => { if (document.activeElement !== e.target) closeSugPop(); }, 150); });
document.addEventListener('scroll', (e) => {
  if (e.target && e.target.closest && e.target.closest('.pop-list')) return;
  closeAislePop();
  const sp = $('.sug-pop'); if (sp && sp._input) { sp.style.top = ''; sp.style.bottom = ''; placePop(sp, sp._input, sp.offsetHeight); }
}, true);
window.addEventListener('resize', () => { const sp = $('.sug-pop'); if (sp && sp._input) { sp.style.top = ''; sp.style.bottom = ''; placePop(sp, sp._input, sp.offsetHeight); } });
document.addEventListener('pointerdown', (e) => { if (!e.target.closest('.aisle-pop, .ed-aisle-btn')) closeAislePop(); });

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
  const r = recipeById(id);
  state.menu.push({ rid: id, servings: servings || defaultServings(r), day: '' });
  toast(`${r ? r.n : 'Recette'} ajoutée au menu`);
}
function removeFromMenu(id) { state.menu = state.menu.filter((m) => m.rid !== id); }
function clampInt(v, min, max) { return Math.max(min, Math.min(max, v)); }

function startNewWeek() {
  state.menu.forEach((m) => { const n = noteOf(m.rid); n.last = state.weekStart; n.lastWeek = true; });
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

function newDraft() { return { n: '', e: EMOJIS[0], type: 'plat', d: 1, t: 30, p: state.profile.persons, pu: 'pers', parts: [{ name: '', rows: [emptyRow()] }], steps: [''], tips: '', imgNote: '' }; }
function emptyRow() { return { name: '', q: '', u: 'g', a: 'au' }; }
/* Regroupe les ingrédients par partie (4e élément), dans l'ordre d'apparition */
function groupIngredients(list) {
  const parts = [];
  list.forEach((x) => { const g = x[3] || ''; let p = parts.find((y) => y.name === g); if (!p) { p = { name: g, items: [] }; parts.push(p); } p.items.push(x); });
  return parts;
}
function draftFrom(r) {
  return { n: r.n, e: r.e, type: r.type, d: r.d, t: r.t, p: r.p, pu: r.pu || 'pers', parts: groupIngredients(r.i).map((g) => ({ name: g.name, rows: g.items.map(([k, q, u]) => ({ name: ing(k).n, q, u, a: ing(k).a || 'au' })) })), steps: stepsOf(r).length ? stepsOf(r).slice() : [''], tips: tipsOf(r).join('\n'), imgNote: r.imgNote || '' };
}
function saveDraft() {
  readEditorForm();
  const d = ui.sheet.draft;
  const named = d.parts.length > 1 || d.parts.some((x) => x.name.trim());
  const rows = [];
  d.parts.forEach((part) => part.rows.forEach((row) => { if (row.name.trim()) rows.push(Object.assign({}, row, { g: named ? part.name.trim() : '' })); }));
  if (!d.n.trim()) { ui.sheet.edTab = 'infos'; renderOverlays(); toast('Donne un nom à ta recette'); return; }
  if (!rows.length) { ui.sheet.edTab = 'ing'; renderOverlays(); toast('Ajoute au moins un ingrédient'); return; }
  const i = rows.map((row) => {
    let key = findIngredientByName(row.name);
    if (!key) {
      key = 'x_' + norm(row.name).replace(/[^a-z0-9]+/g, '_');
      state.customIngs[key] = { n: row.name.trim().charAt(0).toUpperCase() + row.name.trim().slice(1), a: row.a || 'au' };
    } else if (state.customIngs[key]) {
      state.customIngs[key].a = row.a || state.customIngs[key].a;
    }
    const q = parseFloat(String(row.q).replace(',', '.'));
    const line = [key, isFinite(q) && q > 0 ? q : 1, (!row.u || row.u === 'autre') ? 'pc' : row.u];
    if (row.g) line.push(row.g);
    return line;
  });
  const lines = (txt) => String(txt || '').split('\n').map((x) => x.trim()).filter(Boolean);
  const fields = { n: d.n.trim(), e: d.e, type: d.type, t: clampInt(parseInt(d.t, 10) || 30, 1, 999), d: +d.d || 1, p: clampInt(parseInt(d.p, 10) || 4, 1, 200), pu: d.pu || 'pers', i, st: d.steps.map((x) => String(x || '').trim()).filter(Boolean), tips: lines(d.tips), imgNote: String(d.imgNote || '').trim() };
  let rec;
  if (ui.sheet.base) {
    // Recette du carnet modifiée à la main : la version modifiée est gardée sur le téléphone
    const prev = state.overrides[ui.sheet.editId] || {};
    if (prev.imgPrompt) fields.imgPrompt = prev.imgPrompt;
    state.overrides[ui.sheet.editId] = fields;
    rec = recipeById(ui.sheet.editId);
  } else {
    const old = state.custom.find((r) => r.id === ui.sheet.editId) || {};
    rec = Object.assign({}, old, fields, { id: ui.sheet.editId || 'c_' + uid(), custom: true, s: old.s || [], eq: old.eq || [] });
    if (ui.sheet.editId) state.custom = state.custom.map((r) => (r.id === rec.id ? rec : r));
    else state.custom.push(rec);
  }
  save();
  ui.sheet = { kind: 'recipe', id: rec.id, servings: (inMenu(rec.id) || {}).servings || defaultServings(rec) };
  toast('Recette enregistrée');
  render();
  if (!photoList(rec).length) searchPhotoFor(rec.id);
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
    case 'apply-persons': state.menu.forEach((m) => { if (yieldOf(recipeById(m.rid)).id === 'pers') m.servings = p.persons; }); break;
    case 'filter': ui.filter = v; break;
    case 'type': ui.type = v; break;
    case 'open': ui.sheet = { kind: 'recipe', id: v, servings: (inMenu(v) || {}).servings || defaultServings(recipeById(v)) }; save(); renderOverlays(); return;
    case 'jump': { const t = document.getElementById(v); if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
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
    case 'list-view': ui.listView = v; render(); return;
    case 'aisle': ui.aisleClosed = ui.aisleClosed || {}; ui.aisleClosed[v] = !ui.aisleClosed[v]; render(); return;
    case 'uncheck-all': state.list.checked = {}; break;
    case 'copy': copyList(); return;
    case 'rm-pantry': state.pantry = state.pantry.filter((x) => x !== v); break;
    case 'new-recipe': ui.sheet = { kind: 'editor', edTab: 'infos', draft: newDraft() }; renderOverlays(); return;
    case 'edit-recipe': { const r = recipeById(v); if (!r) return; ui.sheet = { kind: 'editor', editId: v, base: !r.custom, draft: draftFrom(r) }; renderOverlays(); return; }
    case 'restore-recipe':
      confirmBox('Revenir à la recette d’origine ? Tes modifications seront perdues.', 'Rétablir', () => { delete state.overrides[v]; ui.sheet = { kind: 'recipe', id: v, servings: (inMenu(v) || {}).servings || defaultServings(recipeById(v)) }; toast('Recette d’origine rétablie'); });
      return;
    case 'hide-recipe':
      confirmBox('Masquer cette recette du carnet ? Tu pourras la faire réapparaître depuis le Profil.', 'Masquer', () => { state.hidden = (state.hidden || []).concat(v); removeFromMenu(v); state.favorites = state.favorites.filter((x) => x !== v); ui.sheet = null; toast('Recette masquée'); });
      return;
    case 'unhide-all': state.hidden = []; toast('Toutes les recettes sont de nouveau visibles'); break;
    case 'delete-recipe':
      confirmBox('Supprimer définitivement cette recette ?', 'Supprimer', () => {
        state.custom = state.custom.filter((r) => r.id !== v); removeFromMenu(v); state.favorites = state.favorites.filter((x) => x !== v); ui.sheet = null; toast('Recette supprimée');
      });
      return;
    case 'ed-emoji': readEditorForm(); ui.sheet.draft.e = v; renderOverlays(); return;
    case 'ed-add-ing': readEditorForm(); ui.sheet.draft.parts[+v || 0].rows.push(emptyRow()); renderOverlays(); return;
    case 'ed-rm-ing': { readEditorForm(); const [pi, ri] = v.split(':').map(Number); const part = ui.sheet.draft.parts[pi]; part.rows.splice(ri, 1); if (!part.rows.length) part.rows.push(emptyRow()); renderOverlays(); return; }
    case 'ed-tab': readEditorForm(); ui.sheet.edTab = v; renderOverlays(); { const b2 = $('.sheet-body'); if (b2) b2.scrollTop = 0; } return;
    case 'ed-add-part': {
      readEditorForm(); const parts = ui.sheet.draft.parts;
      parts.push({ name: '', rows: [emptyRow()] }); renderOverlays();
      const el2 = document.getElementById('ed-pn-' + (parts.length > 1 && !parts[0].name ? 0 : parts.length - 1)); if (el2) el2.focus();
      return;
    }
    case 'ed-rm-part': readEditorForm(); if (ui.sheet.draft.parts.length > 1) ui.sheet.draft.parts.splice(+v, 1); renderOverlays(); return;
    case 'ed-save': saveDraft(); return;
    case 'sync-on': syncEnable(); return;
    case 'sync-off': confirmBox('Arrêter la sauvegarde ? Tes recettes restent sur ce téléphone et la copie déjà faite reste sur GitHub.', 'Désactiver', () => syncDisable()); renderOverlays(); return;
    case 'sync-now': syncNow(true); return;
    case 'prof-sec': ui.profOpen = ui.profOpen || {}; ui.profOpen[v] = !ui.profOpen[v]; render(); return;
    case 'ed-add-step': readEditorForm(); ui.sheet.draft.steps.push(''); renderOverlays(); setTimeout(() => { const t = $('#ed-st-' + (ui.sheet.draft.steps.length - 1)); if (t) { t.focus(); t.scrollIntoView({ block: 'center' }); } }, 50); return;
    case 'ed-rm-step': readEditorForm(); ui.sheet.draft.steps.splice(+v, 1); if (!ui.sheet.draft.steps.length) ui.sheet.draft.steps.push(''); renderOverlays(); return;
    case 'ed-mv-step': { readEditorForm(); const st = ui.sheet.draft.steps; const k = +v; [st[k - 1], st[k]] = [st[k], st[k - 1]]; renderOverlays(); return; }
    case 'ed-aisle': openAislePop(el); return;
    case 'pick-photo': if (ui.sheet && ui.sheet.kind === 'editor') readEditorForm(); { const f = $('#photo-file'); if (f) f.click(); } return;
    case 'rm-own-photo': if (ui.sheet && ui.sheet.kind === 'editor') readEditorForm(); removeOwnPhoto(v); return;
    case 'tips-edit': ui.sheet.tipsEdit = true; renderOverlays(); setTimeout(() => { const t = $('#tips-text'); if (t) { t.focus(); t.scrollIntoView({ block: 'center' }); } }, 50); return;
    case 'tips-cancel': ui.sheet.tipsEdit = false; renderOverlays(); return;
    case 'tips-save': saveTips(v); return;
    case 'rec-filter': ui.recFilter = v; break;
    case 'stars': { const n = noteOf(v.split(':')[0]); const k = +v.split(':')[1]; n.stars = n.stars === k ? 0 : k; break; }
    case 'cooked-today': { const n = noteOf(v); n.last = todayIso(); n.lastWeek = false; toast('Date enregistrée'); break; }
    case 'ai-open': ui.sheet = { kind: 'ai', q: v || ui.query || '', persons: p.persons, status: 'idle', mode: (v || ui.query) ? 'write' : null }; renderOverlays(); return;
    case 'ai-mode': readAiInput(); ui.sheet.mode = v; ui.sheet.status = 'idle'; renderOverlays(); setTimeout(() => { const f = $('#ai-link') || $('#ai-q'); if (f) f.focus(); }, 60); return;
    case 'ai-mode-back': readAiInput(); ui.sheet.mode = null; ui.sheet.status = 'idle'; renderOverlays(); return;
    case 'ai-adjust': ui.sheet.status = 'adjust'; ui.sheet.keepScroll = false; renderOverlays(); setTimeout(() => { const f = $('#ai-adjust'); if (f) f.focus(); }, 60); return;
    case 'ai-adjust-cancel': readAiInput(); ui.sheet.status = 'done'; renderOverlays(); return;
    case 'ai-adjust-go': aiAdjust(); return;
    case 'ai-persons': ui.sheet.persons = clampInt(ui.sheet.persons + +v, 1, 20); readAiInput(); renderOverlays(); return;
    case 'ai-generate': readAiInput(); aiGenerate(); return;
    case 'ai-again': aiGenerate(true); return;
    case 'ai-back': ui.sheet = { kind: 'ai', q: ui.sheet.q, link: ui.sheet.link, mode: ui.sheet.mode || 'write', persons: ui.sheet.persons, status: 'idle' }; renderOverlays(); return;
    case 'ai-save': aiSave(false); return;
    case 'ai-save-menu': aiSave(true); return;
    case 'ideas-refresh': refreshIdeas(); return;
    case 'idea-open': openIdea(+v); return;
    case 'save-key': { readKeyForm(); if (!state.ai.provider) state.ai.provider = aiProvider(); save(); toast(aiReady() ? 'Réglages enregistrés' : 'Clé supprimée'); if (aiProvider() === 'openai' && openaiReady()) testKey(); if (ui.sheet && ui.sheet.kind === 'ai') { renderOverlays(); return; } break; }
    case 'test-key': testKey(); return;
    case 'gen-image': if (ui.sheet && ui.sheet.kind === 'editor') readEditorForm(); generateImageFor(v, true, ui.sheet && ui.sheet.kind === 'editor' ? ui.sheet.draft.imgNote : undefined); return;
    case 'next-photo': if (ui.sheet && ui.sheet.kind === 'editor') readEditorForm(); nextPhoto(v); return;
    case 'search-photo': if (ui.sheet && ui.sheet.kind === 'editor') readEditorForm(); searchPhotoFor(v, true); return;
    case 'ai-provider': readKeyForm(); state.ai.provider = v; save(); if (ui.sheet && ui.sheet.kind === 'ai') { renderOverlays(); return; } break;
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
document.addEventListener('keydown', (e) => {
  // Dans la grande zone de texte, Entrée passe à la ligne ; Ctrl/Cmd + Entrée lance la génération
  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && e.target.id === 'ai-q') { e.preventDefault(); handle('ai-generate'); }
});
document.addEventListener('change', (e) => {
  if (e.target.classList && e.target.classList.contains('ed-name') && ui.sheet && ui.sheet.kind === 'editor') {
    // Rayon deviné dès que le nom est saisi
    const sel = document.getElementById(e.target.id.replace('ed-in-', 'ed-ia-'));
    if (sel && sel.value === 'au') { const g = guessAisle(e.target.value); if (g !== 'au') sel.value = g; }
    return;
  }
  const el = e.target.closest('[data-act="day"]');
  if (el) handle('day', el.dataset.v, el);
});
document.addEventListener('submit', (e) => {
  const form = e.target.closest('form[data-form]');
  if (!form) return;
  e.preventDefault();
  handleForm(form);
});
/* Les suggestions d'ingrédients n'apparaissent qu'à partir de 2 caractères */
function syncSuggest(el) { el.removeAttribute('list'); if ((el.value || '').trim().length >= 2) openSugPop(el); else closeSugPop(); }
document.addEventListener('focusin', (e) => { if (e.target.dataset && e.target.dataset.suggest) syncSuggest(e.target); });
let noteTimer;
document.addEventListener('input', (e) => {
  if (e.target.dataset && e.target.dataset.suggest) syncSuggest(e.target);
  if (e.target.id === 'note-text') {
    const n = noteOf(e.target.dataset.v); n.text = e.target.value;
    clearTimeout(noteTimer); noteTimer = setTimeout(save, 400);
    return;
  }
  if (e.target.id === 'rec-search') {
    ui.recQuery = e.target.value;
    const box = $('#rec-results'); const tmp = document.createElement('div'); tmp.innerHTML = renderMyRecipes();
    const fresh = tmp.querySelector('#rec-results'); if (box && fresh) box.innerHTML = fresh.innerHTML;
    return;
  }
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
      if (ui.sheet && ui.sheet.kind === 'ai' && ui.sheet.status === 'adjust') { handle('ai-adjust-cancel'); return; }
      if (ui.sheet && ui.sheet.kind === 'ai' && ui.sheet.status === 'done') { handle('ai-back'); return; }
      if (ui.sheet && ui.sheet.kind === 'ai' && ui.sheet.mode && ui.sheet.status !== 'loading') { handle('ai-mode-back'); return; }
      if (ui.sheet) { ui.sheet = null; renderOverlays(); return; }
      if (!state.onboarded && state.obStep > 0) { handle('ob-prev'); return; }
      if (state.onboarded && ui.tab !== 'decouvrir') { setTab('decouvrir'); return; }
      App.exitApp();
    });
  } catch (e) { /* hors application */ }
}

loadImages().then(() => { render(); if (syncOn()) syncNow(); });
pushWidget();
render(true);
setupBackButton();
/* Fin de l'animation d'ouverture */
(function endIntro() {
  const el = document.getElementById('intro');
  if (!el) return;
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 500); }, reduce ? 300 : 2300);
  el.addEventListener('click', () => { el.classList.add('out'); setTimeout(() => el.remove(), 450); });
})();
