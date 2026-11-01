/* ---------- Synchronisation des recettes entre téléphones (Gist GitHub privé) ----------
   Ce qui est partagé : recettes perso et IA, ingrédients ajoutés, recettes du carnet modifiées,
   recettes masquées, favoris, notes, choix de photo, images générées et photos perso.
   Chaque élément porte une date de modification : en cas de conflit, la modification la plus récente gagne. */
const SYNC_FILE = 'carnet-cuisine-sync.json';
const SYNC_DESC = 'Carnet de cuisine – sauvegarde (ne pas supprimer)';
const GH_API = 'https://api.github.com';
let syncTimer = null; let syncBusy = false; let syncAgain = false; let syncApplying = false;

function syncCfg() { if (!state.sync) state.sync = { token: '', gistId: '', stamps: {}, last: 0, status: '', error: '' }; if (!state.sync.stamps) state.sync.stamps = {}; return state.sync; }
function syncOn() { const c = syncCfg(); return !!(c.token && c.gistId); }

function strHash(s) { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36) + ':' + s.length; }
function imgHash(src) { return src ? src.length + ':' + src.slice(-60) : ''; }
const imgFileName = (key) => 'img_' + key.replace(/[^a-zA-Z0-9_-]/g, '_') + '.txt';

/* Instantané local de tout ce qui se synchronise : clé → valeur */
function syncEntries() {
  const e = {};
  (state.custom || []).forEach((r) => { if (r && r.id) e['r:' + r.id] = r; });
  Object.entries(state.customIngs || {}).forEach(([k, v]) => { e['i:' + k] = v; });
  Object.entries(state.overrides || {}).forEach(([k, v]) => { e['o:' + k] = v; });
  (state.hidden || []).forEach((id) => { e['h:' + id] = true; });
  (state.favorites || []).forEach((id) => { e['f:' + id] = true; });
  Object.entries(state.notes || {}).forEach(([k, v]) => { if (v && (v.text || v.stars || v.last)) e['n:' + k] = v; });
  Object.entries(state.photos || {}).forEach(([k, v]) => { e['p:' + k] = v; });
  if (state.onboarded) { e['P:profile'] = state.profile; e['P:pantry'] = state.pantry; }
  return e;
}
function syncImageKeys() { return Object.keys(genCache).filter((k) => genCache[k]); }

/* Repère ce qui a changé depuis la dernière fois et date les changements */
function syncMark(baseTime) {
  if (!syncOn() || !window.imagesReady) return false;
  const st = syncCfg().stamps; const now = baseTime || Date.now(); let changed = false;
  const cur = syncEntries();
  Object.entries(cur).forEach(([k, v]) => { const h = strHash(JSON.stringify(v)); if (!st[k] || st[k].h !== h) { st[k] = { h, t: now }; changed = true; } });
  const imgs = new Set(syncImageKeys());
  imgs.forEach((k) => { const h = imgHash(genCache[k]); const sk = 'g:' + k; if (!st[sk] || st[sk].h !== h) { st[sk] = { h, t: now }; changed = true; } });
  Object.keys(st).forEach((k) => {
    if (st[k].h === null) return;
    const present = k.startsWith('g:') ? imgs.has(k.slice(2)) : Object.prototype.hasOwnProperty.call(cur, k);
    if (!present) { st[k] = { h: null, t: now }; changed = true; }
  });
  return changed;
}
/* Appelé à chaque enregistrement : synchronisation quelques secondes après le dernier changement */
function syncAfterSave() {
  if (!syncOn() || syncApplying) return;
  clearTimeout(syncTimer);
  syncTimer = setTimeout(() => { if (!window.imagesReady) { syncAfterSave(); return; } if (syncMark()) { saveRaw(); syncNow(); } }, 3000);
}

async function gh(path, opts) {
  opts = opts || {};
  const res = await fetch(GH_API + path, {
    method: opts.method || 'GET',
    headers: Object.assign({ Authorization: 'Bearer ' + syncCfg().token, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' }, opts.body ? { 'Content-Type': 'application/json' } : {}),
    body: opts.body ? JSON.stringify(opts.body) : undefined
  });
  if (res.status === 401) throw new Error('Clé GitHub refusée : vérifie-la (ou crée-en une nouvelle) dans le Profil.');
  if (res.status === 403 || res.status === 404) {
    if (path.startsWith('/gists/')) { const e = new Error('Sauvegarde introuvable.'); e.notFound = true; throw e; }
    throw new Error('Accès refusé : la clé GitHub doit avoir l’autorisation « gist ».');
  }
  if (!res.ok) throw new Error('GitHub ne répond pas correctement (erreur ' + res.status + '). Réessaie plus tard.');
  return res.status === 204 ? null : res.json();
}
async function fileContent(f) {
  if (!f) return null;
  if (!f.truncated && typeof f.content === 'string') return f.content;
  const r = await fetch(f.raw_url, { headers: { Authorization: 'Bearer ' + syncCfg().token } });
  if (!r.ok) throw new Error('Fichier de synchronisation illisible.');
  return r.text();
}

/* Applique une valeur venue d'un autre téléphone */
function syncApply(k, v, del) {
  const id = k.slice(2);
  switch (k[0]) {
    case 'r': {
      const i = state.custom.findIndex((r) => r.id === id);
      if (del) { if (i >= 0) state.custom.splice(i, 1); state.menu = state.menu.filter((m) => m.rid !== id); } else if (i >= 0) state.custom[i] = v; else state.custom.push(v);
      break;
    }
    case 'i': if (del) delete state.customIngs[id]; else state.customIngs[id] = v; break;
    case 'o': if (del) delete state.overrides[id]; else state.overrides[id] = v; break;
    case 'h': state.hidden = state.hidden.filter((x) => x !== id); if (!del) state.hidden.push(id); break;
    case 'f': state.favorites = state.favorites.filter((x) => x !== id); if (!del) state.favorites.push(id); break;
    case 'n': if (del) delete state.notes[id]; else state.notes[id] = v; break;
    case 'p': if (del) delete state.photos[id]; else state.photos[id] = v; break;
    case 'P': if (!del && v) { if (id === 'profile') state.profile = Object.assign({}, state.profile, v); if (id === 'pantry') state.pantry = v; } break;
  }
}

async function syncNow(manual) {
  if (!syncOn()) return;
  if (syncBusy) { syncAgain = true; return; }
  syncBusy = true; const c = syncCfg(); c.status = 'running'; c.error = ''; syncRefreshUi();
  try {
    syncMark();
    const gist = await gh('/gists/' + c.gistId);
    const raw = await fileContent(gist.files[SYNC_FILE]);
    let remote = { v: 1, entries: {} };
    try { if (raw) remote = JSON.parse(raw); } catch (e) { /* fichier abîmé : on le réécrit */ }
    remote.entries = remote.entries || {};
    const st = c.stamps; const R = remote.entries; const local = syncEntries();
    let localChanged = false; let remoteChanged = false; const upFiles = {};
    const keys = new Set(Object.keys(st).concat(Object.keys(R)));
    syncApplying = true;
    for (const k of keys) {
      const L = st[k]; const Rm = R[k];
      const lt = L ? L.t : -1; const rt = Rm ? Rm.t : -1;
      if (rt > lt) {
        // Plus récent ailleurs : on le récupère
        if (k.startsWith('g:')) {
          const key = k.slice(2);
          if (Rm.del) { delete genCache[key]; try { if (idb) idb.transaction('images', 'readwrite').objectStore('images').delete(key); } catch (e) { /* ignore */ } st[k] = { h: null, t: rt }; }
          else {
            const src = await fileContent(gist.files[Rm.file]);
            if (src && src.startsWith('data:image')) { storeGenerated(key, src); st[k] = { h: imgHash(src), t: rt }; } else continue;
          }
        } else {
          syncApply(k, Rm.v, !!Rm.del);
          st[k] = { h: Rm.del ? null : strHash(JSON.stringify(Rm.v)), t: rt };
        }
        localChanged = true;
      } else if (lt > rt) {
        // Plus récent ici : on l'envoie
        if (L.h === null) R[k] = { t: lt, del: true };
        else if (k.startsWith('g:')) {
          const key = k.slice(2); const src = genCache[key]; if (!src) continue;
          const file = imgFileName(key); upFiles[file] = { content: src }; R[k] = { t: lt, file };
        } else if (Object.prototype.hasOwnProperty.call(local, k)) R[k] = { t: lt, v: local[k] };
        else continue;
        if (L.h === null && k.startsWith('g:') && Rm && Rm.file && gist.files[Rm.file]) upFiles[Rm.file] = null;
        remoteChanged = true;
      }
    }
    syncApplying = false;
    if (remoteChanged) {
      remote.updated = Date.now();
      // Images envoyées par petits paquets (elles peuvent être lourdes)
      const imgs = Object.entries(upFiles);
      for (let i = 0; i < imgs.length; i += 4) await gh('/gists/' + c.gistId, { method: 'PATCH', body: { files: Object.fromEntries(imgs.slice(i, i + 4)) } });
      await gh('/gists/' + c.gistId, { method: 'PATCH', body: { files: { [SYNC_FILE]: { content: JSON.stringify(remote) } } } });
    }
    c.last = Date.now(); c.status = 'ok';
    if (localChanged) { saveRaw(); render(); toast('Recettes récupérées depuis ta sauvegarde'); }
    else if (manual) toast('Sauvegarde à jour');
  } catch (e) {
    syncApplying = false;
    c.status = 'error'; c.error = e.message || 'Sauvegarde impossible pour le moment';
    if (e.notFound) { c.gistId = ''; c.error = 'La sauvegarde a été supprimée sur GitHub. Réactive-la.'; }
    if (manual) toast(c.error);
  }
  saveRaw(); syncBusy = false; syncRefreshUi();
  if (syncAgain) { syncAgain = false; syncNow(); }
}

/* Activation : retrouve la synchronisation existante (autre téléphone) ou la crée */
async function syncEnable() {
  const c = syncCfg(); const inp = $('#sync-token');
  const token = inp ? inp.value.trim() : c.token;
  if (!token) { toast('Colle d’abord ta clé GitHub'); return; }
  c.token = token; c.status = 'running'; c.error = ''; syncRefreshUi();
  try {
    let found = null;
    for (let page = 1; page <= 5 && !found; page++) {
      const list = await gh('/gists?per_page=100&page=' + page);
      found = list.find((g) => g.files && g.files[SYNC_FILE]);
      if (list.length < 100) break;
    }
    if (found) {
      c.gistId = found.id; c.stamps = {};
      // Ce qui existe déjà sur ce téléphone passe après ce qui est déjà synchronisé, sans rien perdre
      syncMark(1);
      toast('Sauvegarde retrouvée : récupération de tes recettes…');
    } else {
      const g = await gh('/gists', { method: 'POST', body: { description: SYNC_DESC, public: false, files: { [SYNC_FILE]: { content: JSON.stringify({ v: 1, entries: {} }) } } } });
      c.gistId = g.id; c.stamps = {}; syncMark();
      toast('Sauvegarde activée');
    }
    saveRaw(); syncBusy = false; await syncNow();
  } catch (e) { c.status = 'error'; c.error = e.message; saveRaw(); syncRefreshUi(); toast(e.message); }
}
function syncDisable() {
  const c = syncCfg(); c.token = ''; c.gistId = ''; c.stamps = {}; c.status = ''; c.error = ''; saveRaw(); render();
  toast('Sauvegarde désactivée sur ce téléphone');
}

function fmtAgo(t) {
  if (!t) return 'jamais';
  const m = Math.round((Date.now() - t) / 60000);
  if (m < 1) return 'à l’instant'; if (m < 60) return 'il y a ' + m + ' min';
  const d = new Date(t); return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) + ' à ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}
function syncSummary() {
  const c = syncCfg();
  if (!syncOn()) return 'Désactivée';
  if (c.status === 'running') return 'Envoi en cours…';
  if (c.status === 'error') return 'Problème : touche pour voir';
  return 'Active · dernière ' + fmtAgo(c.last);
}
function syncHtml() {
  const c = syncCfg();
  if (syncOn()) {
    return `<p class="muted small" style="margin:0">Chaque nouvelle recette ou modification est envoyée sur ton compte GitHub (espace privé) : recettes perso et IA, recettes modifiées ou masquées, favoris, notes, images, profil et placard. Si tu changes de téléphone, réinstalle l’appli et colle une clé GitHub ici : tout revient.</p>
      <div class="sync-state ${c.status === 'error' ? 'err' : ''}" id="sync-state">${c.status === 'running' ? '<span class="spinner small-spin dark-spin" aria-hidden="true"></span> Sauvegarde…' : c.status === 'error' ? esc(c.error) : 'Dernière sauvegarde : ' + fmtAgo(c.last)}</div>
      <button class="btn" data-act="sync-now">Sauvegarder maintenant</button>
      <button class="link" style="align-self:flex-start" data-act="sync-off">Désactiver la sauvegarde</button>`;
  }
  return `<p class="muted small" style="margin:0">Garde une copie de tes recettes sur ton compte GitHub (espace privé, gratuit). En cas de perte ou de changement de téléphone, tu réinstalles l’appli, tu colles une clé GitHub ici et tout revient.</p>
    <details class="help"><summary>Créer ta clé GitHub</summary><ol>
      <li>Sur github.com, ouvre <a href="https://github.com/settings/tokens/new?scopes=gist&description=Carnet%20de%20cuisine" target="_blank" rel="noopener">Settings › Developer settings › Tokens (classic) › Generate new token</a>.</li>
      <li>Nom : « Carnet de cuisine ». Expiration : « No expiration ». Coche uniquement <b>gist</b>.</li>
      <li>Clique « Generate token », copie la clé (elle commence par ghp_) et colle-la ci-dessous.</li>
      <li>Nouveau téléphone : une nouvelle clé créée de la même façon suffit, l’appli retrouve ta sauvegarde toute seule.</li></ol></details>
    <div><label class="lbl" for="sync-token">Clé GitHub</label><input class="input" id="sync-token" type="password" autocomplete="off" placeholder="ghp_…" value="${esc(c.token || '')}"></div>
    ${c.status === 'error' ? `<p class="card-warn" style="margin:0;font-size:14px">${esc(c.error)}</p>` : ''}
    <button class="btn primary" data-act="sync-on">${c.status === 'running' ? 'Activation…' : 'Activer la sauvegarde'}</button>`;
}
function syncRefreshUi() {
  if (ui.tab === 'profil' && !ui.sheet) { const y = ($('#main') || {}).scrollTop; render(); const m = $('#main'); if (m && y) m.scrollTop = y; }
}
