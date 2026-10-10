// ═══════════════════════════════════════════════════════════════════════════════
// OBFUSCATED FREE-TIER CLIENT ID
// ─────────────────────────────────────────────────────────────────────────────
// How this works:
//   1. The raw Client ID is XOR-encoded with a key and stored as base64 chunks.
//   2. At runtime, deobf() reassembles and decodes it — never stored in plain text.
//   3. The actual encoding is done OFFLINE by you using the encode-cid.html tool
//      (generated alongside this file). Replace the _E array below with your output.
//
// SECURITY NOTE: This is obfuscation, not encryption. It stops casual scraping
// and automated scans. For real security, lock Authorized Origins in Google Cloud
// Console to https://YOUR-GITHUB-USERNAME.github.io so the CID is useless elsewhere.
// ─────────────────────────────────────────────────────────────────────────────

// ⚠️ REPLACE THIS ARRAY with the output from encode-cid.html ⚠️
// Each element is a base64-encoded XOR'd chunk of your Client ID.
// Example format (NOT real data):
const _E = [
  "dG9QTVtAAA11blVBQRhcQD49",
  "fjcKGgEERFojPFQUVQZaQTkm",
  "JjEREQpHQlE7eAAFHAccUiI5",
  "KjoEAB8RQFYiOBUQAgAcViI7"
];

// XOR key — you can change this in encode-cid.html to match
const _K = [0x4d, 0x56, 0x61, 0x75, 0x6c, 0x74, 0x32, 0x35];

function deobf() {
  try {
    const joined = _E.map(chunk => {
      const raw = atob(chunk);
      return Array.from(raw).map((c, i) => String.fromCharCode(c.charCodeAt(0) ^ _K[i % _K.length])).join('');
    }).join('');
    // Basic sanity check — valid Client IDs end with this
    if (!joined.includes('.apps.googleusercontent.com')) return null;
    return joined;
  } catch (e) {
    return null;
  }
}

// ═══ STATE ═══════════════════════════════════════════════════════════════════
let CID = '';           // active client ID (free or own)
let tierMode = '';      // 'free' | 'own'
let tok = null, allMails = [], filtered = [], sel = new Set(), page = 1, dlCancel = false;
const PG = 50, MON = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const FREE_CAP = 500;   // max emails loaded in free tier per session

// Timing state for ETA
let dlStartTime = 0, dlTotalSteps = 0, dlDoneSteps = 0;

// ═══ INIT ════════════════════════════════════════════════════════════════════
window.onload = () => {
  buildDateSelectors();
  // Show the correct origin hint so users paste the right value in Cloud Console
  const el = document.getElementById('origin-hint');
  if (el) el.textContent = window.location.origin || 'http://localhost';
  // If user had saved their own CID previously, go straight to own-key login
  const savedCid = localStorage.getItem('mv_cid');
  if (savedCid && savedCid.includes('.apps.googleusercontent.com')) {
    CID = savedCid;
    tierMode = 'own';
    document.getElementById('landing-screen').style.display = 'none';
    showScreen('login');
    showSignin();
    loadGapi(CID);
  }
};

function buildDateSelectors() {
  const now = new Date();
  const curYear = now.getFullYear(), curMon = now.getMonth() + 1;
  const syEl = document.getElementById('startYear'), eyEl = document.getElementById('endYear');
  for (let y = curYear; y >= 2004; y--) {
    syEl.innerHTML += `<option value="${y}">${y}</option>`;
    eyEl.innerHTML += `<option value="${y}">${y}</option>`;
  }
  let sm = curMon - 3, sy = curYear;
  if (sm <= 0) {
    sm += 12;
    sy--;
  }
  document.getElementById('startMon').value = sm;
  document.getElementById('startYear').value = sy;
  document.getElementById('endMon').value = curMon;
  document.getElementById('endYear').value = curYear;
}

// ═══ TIER SELECTION ═══════════════════════════════════════════════════════════
function chooseTier(tier) {
  tierMode = tier;
  document.getElementById('landing-screen').style.display = 'none';
  showScreen('login');

  if (tier === 'free') {
    // Decode embedded CID
    const decoded = deobf();
    if (!decoded) {
      alert('Free tier is temporarily unavailable. Please use your own Client ID or try again later.');
      goBack();
      return;
    }
    CID = decoded;
    document.getElementById('login-title').textContent = 'Sign in with Google';
    document.getElementById('login-sub').textContent = 'Using the free MailVault shared app. Quick and easy.';
    document.getElementById('free-sec').style.display = 'block';
    document.getElementById('setup-sec').style.display = 'none';
    document.getElementById('signin-sec').style.display = 'none';
    loadGapi(CID);
    // Show tier badge
    setTierBadge('⚡ Free tier');
  } else {
    // Own key flow
    document.getElementById('login-title').textContent = 'Set up your API key';
    document.getElementById('login-sub').textContent = 'Bring your own Client ID for unlimited access.';
    showOwnSetup();
    setTierBadge('🔑 Own key', true);
  }
}

function showOwnSetup() {
  const savedCid = localStorage.getItem('mv_cid');
  if (savedCid && savedCid.includes('.apps.googleusercontent.com')) {
    document.getElementById('cidinp').value = savedCid;
    document.getElementById('setup-sec').style.display = 'none';
    document.getElementById('signin-sec').style.display = 'block';
    document.getElementById('free-sec').style.display = 'none';
  } else {
    document.getElementById('setup-sec').style.display = 'block';
    document.getElementById('signin-sec').style.display = 'none';
    document.getElementById('free-sec').style.display = 'none';
  }
}

function saveCid() {
  const v = document.getElementById('cidinp').value.trim();
  if (!v.includes('.apps.googleusercontent.com')) {
    alert('Invalid Client ID — it should end in .apps.googleusercontent.com');
    return;
  }
  CID = v;
  tierMode = 'own';
  localStorage.setItem('mv_cid', CID);
  showSignin();
  loadGapi(CID);
}

function showSignin() {
  document.getElementById('setup-sec').style.display = 'none';
  document.getElementById('free-sec').style.display = 'none';
  document.getElementById('signin-sec').style.display = 'block';
}

function goBack() {
  showScreen('landing');
  tierMode = '';
  CID = '';
  // Reset all sections
  document.getElementById('free-sec').style.display = 'none';
  document.getElementById('setup-sec').style.display = 'none';
  document.getElementById('signin-sec').style.display = 'none';
  document.getElementById('tier-badge-hdr').style.display = 'none';
}

function showScreen(name) {
  document.getElementById('landing-screen').style.display = name === 'landing' ? 'flex' : 'none';
  document.getElementById('login-screen').style.display = name === 'login' ? 'flex' : 'none';
  document.getElementById('dash').style.display = name === 'dash' ? 'block' : 'none';
}

function setTierBadge(label, isPro) {
  const el = document.getElementById('tier-badge-hdr');
  el.textContent = label;
  el.className = 'tier-badge' + (isPro ? ' pro' : '');
  el.style.display = '';
}

function loadGapi(clientId) {
  if (document.getElementById('_gsi')) return;
  const s1 = document.createElement('script');
  s1.id = '_gsi';
  s1.src = 'https://accounts.google.com/gsi/client';
  document.head.appendChild(s1);
  const s2 = document.createElement('script');
  s2.src = 'https://apis.google.com/js/api.js';
  s2.onload = () => gapi.load('client', () => gapi.client.init({
    discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest']
  }).then(() => log('Gmail API ready', 'info')));
  document.head.appendChild(s2);
}

// ═══ AUTH ════════════════════════════════════════════════════════════════════
function doSignIn() {
  if (!CID) {
    alert('No Client ID available. Please try again.');
    return;
  }
  google.accounts.oauth2.initTokenClient({
    client_id: CID,
    scope: 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.modify https://mail.google.com/',
    callback: async (r) => {
      if (r.error) {
        log('Auth error: ' + r.error, 'err');
        return;
      }
      tok = r.access_token;
      gapi.client.setToken({ access_token: tok });
      await getProfile();
      showScreen('dash');
      document.getElementById('abar').style.display = 'flex';
      document.getElementById('fnote').style.display = 'block';
      // Update tier badge label in dash
      if (tierMode === 'free') setTierBadge('⚡ Free tier');
      else setTierBadge('🔑 Own key', true);
    }
  }).requestAccessToken();
}

async function getProfile() {
  try {
    const r = await gapi.client.gmail.users.getProfile({ userId: 'me' });
    const em = r.result.emailAddress;
    document.getElementById('uem').textContent = em;
    document.getElementById('uav').textContent = em[0].toUpperCase();
    document.getElementById('uchip').style.display = 'flex';
    document.getElementById('stot').textContent = (r.result.messagesTotal || 0).toLocaleString();
    log('Signed in as ' + em + (tierMode === 'free' ? ' [Free tier — cap: ' + FREE_CAP + ' emails]' : ''), 'ok');
    loadTrashCount();
  } catch (e) {
    log('Profile error: ' + e.message, 'err');
  }
}

async function loadTrashCount() {
  try {
    let count = 0, pt = null;
    do {
      const p = { userId: 'me', labelIds: ['TRASH'], maxResults: 500, fields: 'messages/id,nextPageToken,resultSizeEstimate' };
      if (pt) p.pageToken = pt;
      const r = await gapi.client.gmail.users.messages.list(p);
      count += (r.result.messages || []).length;
      pt = r.result.nextPageToken;
    } while (pt);
    document.getElementById('strash').textContent = count.toLocaleString();
    document.getElementById('strash-sub').textContent = count > 0 ? 'click to purge' : 'trash is empty';
  } catch (e) {
    document.getElementById('strash').textContent = '?';
  }
}

function signOut() {
  if (tok) google.accounts.oauth2.revoke(tok, () => {});
  tok = null;
  allMails = [];
  filtered = [];
  sel.clear();
  showScreen('landing');
  document.getElementById('uchip').style.display = 'none';
  document.getElementById('tier-badge-hdr').style.display = 'none';
  tierMode = '';
  CID = '';
  // Reset login sections
  document.getElementById('free-sec').style.display = 'none';
  document.getElementById('setup-sec').style.display = 'none';
  document.getElementById('signin-sec').style.display = 'none';
  document.getElementById('abar').style.display = 'none';
}

// ═══ LOAD EMAILS (Date Range) ════════════════════════════════════════════════
function getDateRangeQuery() {
  const sm = parseInt(document.getElementById('startMon').value);
  const sy = parseInt(document.getElementById('startYear').value);
  const em = parseInt(document.getElementById('endMon').value);
  const ey = parseInt(document.getElementById('endYear').value);
  const startDate = new Date(sy, sm - 1, 1);
  let afterMon = em + 1, afterYear = ey;
  if (afterMon > 12) {
    afterMon = 1;
    afterYear++;
  }
  const afterDate = new Date(afterYear, afterMon - 1, 1);
  const fmt = d => `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
  return { q: `after:${fmt(startDate)} before:${fmt(afterDate)}`, label: `${MON[sm]} ${sy} – ${MON[em]} ${ey}` };
}

function clearMails() {
  allMails = [];
  filtered = [];
  sel.clear();
  hideResultNotice();
  document.getElementById('slod').textContent = '0';
  document.getElementById('fnote').style.display = 'block';
  document.getElementById('erows').innerHTML = `<div class="empty"><div class="eico">📭</div><div class="empty-title">No emails loaded</div><div class="empty-sub">Select a date range above and click <strong>Load emails</strong></div></div>`;
  document.getElementById('pgn').style.display = 'none';
  document.getElementById('chkall').checked = false;
  updateStats();
}

async function loadMails() {
  const { q, label } = getDateRangeQuery();
  const btn = document.getElementById('ldbtn');
  btn.disabled = true;
  btn.innerHTML = `<div class="spin" style="border-color:rgba(255,255,255,.4);border-top-color:#fff;width:13px;height:13px"></div> Loading…`;
  document.getElementById('fnote').style.display = 'none';
  hideResultNotice();
  allMails = [];
  filtered = [];
  sel.clear();
  log(`Fetching emails: ${label}…`, 'info');
  // Determine cap for this session
  const cap = tierMode === 'free' ? FREE_CAP : 2000;
  try {
    const ids = [];
    let pt = null;
    do {
      const p = { userId: 'me', maxResults: 500, q };
      if (pt) p.pageToken = pt;
      const r = await gapi.client.gmail.users.messages.list(p);
      (r.result.messages || []).forEach(m => ids.push(m.id));
      pt = r.result.nextPageToken;
      log('IDs found: ' + ids.length + '…', 'info');
      if (ids.length >= cap) {
        log((tierMode === 'free' ? 'Free tier capped' : 'Capped') + ' at ' + cap, 'info');
        break;
      }
    } while (pt);

    if (ids.length === 0) {
      showResultNotice('empty', label);
      document.getElementById('slod').textContent = '0';
      btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Load emails`;
      btn.disabled = false;
      updateStats();
      return;
    }

    document.getElementById('slod').textContent = ids.length.toLocaleString();

    for (let i = 0; i < ids.length; i += 200) {
      const chunk = ids.slice(i, i + 200);
      const res = await Promise.all(chunk.map(id =>
        gapi.client.gmail.users.messages.get({ userId: 'me', id, format: 'metadata', metadataHeaders: ['Subject', 'From', 'To', 'Date'] })
          .then(r => r.result).catch(() => null)
      ));
      for (const msg of res) {
        if (!msg) continue;
        const h = {};
        (msg.payload?.headers || []).forEach(x => h[x.name] = x.value);
        const d = new Date(h['Date'] || 0);
        allMails.push({
          id: msg.id,
          threadId: msg.threadId,
          from: h['From'] || '',
          subject: h['Subject'] || '(no subject)',
          date: isNaN(d) ? new Date(0) : d,
          dateStr: h['Date'] || '',
          size: msg.sizeEstimate || 0,
          snippet: msg.snippet || '',
          labels: msg.labelIds || []
        });
      }
      document.getElementById('slod').textContent = ids.length.toLocaleString();
      log('Loaded metadata: ' + allMails.length + '/' + ids.length, 'info');
    }
    allMails.sort((a, b) => b.date - a.date);
    doFilter();
    const capNote = tierMode === 'free' && ids.length >= FREE_CAP ? ' (free tier cap — upgrade for more)' : '';
    log('✓ ' + allMails.length + ' emails loaded for ' + label + capNote, 'ok');
    showResultNotice('ok', label, ids.length, tierMode === 'free' && ids.length >= FREE_CAP);
    btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Refresh`;
  } catch (e) {
    log('Error: ' + e.message, 'err');
    btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Load emails`;
  }
  btn.disabled = false;
}

function showResultNotice(type, label, count, capped) {
  const el = document.getElementById('result-notice');
  if (type === 'empty') {
    el.style.cssText = 'display:block;background:var(--bg3);border:1px solid var(--br);color:var(--tx2)';
    el.innerHTML = `🔍 No emails found for <strong>${label}</strong>. Try a different date range.`;
    document.getElementById('erows').innerHTML = `<div class="empty"><div class="eico">🔍</div><div class="empty-title">No results for ${esc(label)}</div><div class="empty-sub">No emails were found in this date range.<br>Try adjusting the start or end month.</div></div>`;
    document.getElementById('pgn').style.display = 'none';
  } else {
    el.style.cssText = 'display:block;background:var(--gnbg);border:1px solid var(--gnbr);color:var(--gn)';
    const capMsg = capped ? ` <span style="color:var(--am);font-weight:600">(free tier cap — use your own key for more)</span>` : '';
    el.innerHTML = `✅ Loaded <strong>${count.toLocaleString()} emails</strong> for <strong>${label}</strong>${capMsg}`;
  }
}

function hideResultNotice() {
  document.getElementById('result-notice').style.display = 'none';
}

// ═══ FILTER / RENDER ══════════════════════════════════════════════════════════
function doFilter() {
  const q = document.getElementById('sinp').value.toLowerCase();
  const lb = document.getElementById('slbl2').value;
  filtered = allMails.filter(e => {
    if (lb && !e.labels.includes(lb)) return false;
    if (q && !e.from.toLowerCase().includes(q) && !e.subject.toLowerCase().includes(q)) return false;
    return true;
  });
  page = 1;
  renderList();
}

function renderList() {
  const s = (page - 1) * PG, end = Math.min(s + PG, filtered.length), pg = filtered.slice(s, end);
  const rows = document.getElementById('erows');
  if (!pg.length && allMails.length > 0) {
    rows.innerHTML = '<div class="empty"><div class="eico">🔍</div><div class="empty-title">No matches</div><div class="empty-sub">Try a different search or label filter.</div></div>';
    document.getElementById('pgn').style.display = 'none';
    document.getElementById('plbl').textContent = '';
    updateStats();
    return;
  }
  if (!pg.length) {
    rows.innerHTML = `<div class="empty"><div class="eico">📭</div><div class="empty-title">No emails loaded</div><div class="empty-sub">Select a date range above and click <strong>Load emails</strong></div></div>`;
    document.getElementById('pgn').style.display = 'none';
    document.getElementById('plbl').textContent = '';
    updateStats();
    return;
  }
  rows.innerHTML = pg.map(e => {
    const isS = sel.has(e.id);
    const from = e.from.replace(/<[^>]+>/g, '').replace(/"/g, '').trim() || e.from;
    const snip = e.snippet ? ` — <em>${esc(e.snippet.substring(0, 55))}</em>` : '';
    return `<div class="erow${isS ? ' sel' : ''}" onclick="togRow('${e.id}',event)">
      <input type="checkbox" ${isS ? 'checked' : ''} onclick="event.stopPropagation();togRow('${e.id}',{_c:true})" style="accent-color:var(--ac)"/>
      <div class="emeta"><div class="efrom">${esc(from)}</div><div class="esubj">${esc(e.subject)}${snip}</div></div>
      <div class="esz">${fsize(e.size)}</div><div class="edt">${fdate(e.date)}</div>
    </div>`;
  }).join('');
  const tot = Math.ceil(filtered.length / PG);
  document.getElementById('plbl').textContent = tot > 1 ? `Page ${page}/${tot}` : `${filtered.length} emails`;
  renderPgn(tot);
  updateStats();
}

function renderPgn(tot) {
  const pg = document.getElementById('pgn');
  if (tot <= 1) {
    pg.style.display = 'none';
    return;
  }
  pg.style.display = 'flex';
  pg.innerHTML = `<button class="btn btn-gh btn-sm" onclick="goPage(${page - 1})" ${page === 1 ? 'disabled' : ''}>← Prev</button>
    <span style="font-size:13px;color:var(--tx3);padding:0 12px">${page}/${tot}</span>
    <button class="btn btn-gh btn-sm" onclick="goPage(${page + 1})" ${page === tot ? 'disabled' : ''}>Next →</button>`;
}

function goPage(p) {
  const t = Math.ceil(filtered.length / PG);
  if (p < 1 || p > t) return;
  page = p;
  renderList();
  document.getElementById('erows').scrollIntoView({ behavior: 'smooth' });
}

function togRow(id, ev) {
  if (ev._c || ev.target?.tagName === 'INPUT' || ev.target?.closest?.('.erow')) {
    sel.has(id) ? sel.delete(id) : sel.add(id);
    renderList();
  }
}

function togAll(chk) {
  filtered.forEach(e => chk ? sel.add(e.id) : sel.delete(e.id));
  renderList();
}

function updateStats() {
  const n = sel.size;
  document.getElementById('ssel').textContent = n.toLocaleString();
  const bytes = allMails.filter(e => sel.has(e.id)).reduce((s, e) => s + e.size, 0);
  document.getElementById('ssz').textContent = (bytes / 1048576).toFixed(1);
  document.getElementById('slod').textContent = allMails.length.toLocaleString();
  document.getElementById('dldtn').disabled = !n;
  document.getElementById('deltbn').disabled = !n;
  document.getElementById('ainf').innerHTML = n ? `<strong>${n}</strong> email${n !== 1 ? 's' : ''} selected` : 'Select emails above to take action';
  const b = document.getElementById('selbadge');
  if (n) {
    b.textContent = n + ' selected';
    b.style.display = '';
  } else {
    b.style.display = 'none';
  }
}

// ═══ STAGE HELPERS ════════════════════════════════════════════════════════════
function setStage(id) {
  ['fetch', 'atts', 'zip', 'compress'].forEach(s => {
    const el = document.getElementById('stage-' + s);
    el.classList.remove('active', 'done-pill');
  });
  const order = ['fetch', 'atts', 'zip', 'compress'];
  const idx = order.indexOf(id);
  order.forEach((s, i) => {
    const el = document.getElementById('stage-' + s);
    if (i < idx) el.classList.add('done-pill');
    else if (i === idx) el.classList.add('active');
  });
}

// ═══ ETA HELPERS ══════════════════════════════════════════════════════════════
function startTimer(total) {
  dlStartTime = Date.now();
  dlTotalSteps = total;
  dlDoneSteps = 0;
  updateETA(0);
}

function tickTimer(done) {
  dlDoneSteps = done;
  updateETA(done / dlTotalSteps);
}

function updateETA(fraction) {
  const el = document.getElementById('prog-time');
  if (fraction <= 0.02) {
    el.textContent = 'Estimating…';
    el.className = 'prog-time';
    return;
  }
  if (fraction >= 1) {
    el.textContent = 'Almost done…';
    el.className = 'prog-time done';
    return;
  }
  const elapsed = (Date.now() - dlStartTime) / 1000;
  const totalEst = elapsed / fraction;
  const remaining = Math.max(0, totalEst - elapsed);
  const mins = Math.floor(remaining / 60);
  const secs = Math.floor(remaining % 60);
  let txt = '';
  if (mins > 0) txt = `~${mins}m ${secs}s left`;
  else if (secs > 10) txt = `~${secs}s left`;
  else txt = 'Almost done…';
  el.textContent = txt;
  el.className = remaining < 30 ? 'prog-time done' : 'prog-time';
}

// ═══ ATTACHMENT WITH TIMEOUT + RETRY ══════════════════════════════════════════
async function fetchAttWithRetry(messageId, attachmentId, retries = 3, timeoutMs = 20000) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const result = await Promise.race([
        gapi.client.gmail.users.messages.attachments.get({ userId: 'me', messageId, id: attachmentId }),
        new Promise((_, rej) => setTimeout(() => rej(new Error('Timeout')), timeoutMs))
      ]);
      if (!result?.result?.data) {
        if (attempt === retries) throw new Error('No attachment data returned');
        log(`Attachment empty, retry ${attempt + 1}…`, 'info');
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
        continue;
      }
      return result;
    } catch (e) {
      if (attempt === retries) throw e;
      log(`Attachment retry ${attempt + 1}…`, 'info');
      await new Promise(r => setTimeout(r, 1500 * (attempt + 1)));
    }
  }
}

// ═══ DOWNLOAD BACKUP ══════════════════════════════════════════════════════════
async function dlSelected() {
  const mails = allMails.filter(e => sel.has(e.id));
  if (!mails.length) return;
  dlCancel = false;
  document.getElementById('dldtn').disabled = true;
  document.getElementById('pfil').style.width = '0%';
  document.getElementById('pdon').textContent = '0';
  document.getElementById('ptot').textContent = mails.length;
  document.getElementById('att-prog').classList.remove('show');
  document.getElementById('prog-time').textContent = 'Estimating…';
  document.getElementById('prog-time').className = 'prog-time';
  setStage('fetch');
  showMod('progmod');
  setProg('Fetching email content', 'Loading emails from Gmail…', 0);
  startTimer(mails.length * 3);
  const full = [];
  let done = 0;

  for (let i = 0; i < mails.length; i += 5) {
    if (dlCancel) break;
    const chunk = mails.slice(i, i + 5);
    const res = await Promise.allSettled(chunk.map(e =>
      gapi.client.gmail.users.messages.get({ userId: 'me', id: e.id, format: 'full' }).then(r => ({ ...e, full: r.result }))
    ));
    res.forEach(r => {
      if (r.status === 'fulfilled') full.push(r.value);
      else log('Skipped: ' + (r.reason?.message || 'error'), 'err');
      done++;
    });
    const pct = (done / mails.length) * 33;
    document.getElementById('pfil').style.width = pct + '%';
    document.getElementById('pdon').textContent = done;
    document.getElementById('pstat').textContent = `Fetched ${done} of ${mails.length} emails`;
    tickTimer(done);
    await tick();
  }

  if (!dlCancel && full.length) {
    setProg('Building ZIP', 'Loading JSZip library…', 33);
    if (!window.JSZip) await ldScript('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js');
    await buildZip(full);
  }

  closeMod('progmod');
  document.getElementById('dldtn').disabled = sel.size === 0;
}

async function buildZip(mails) {
  const zip = new JSZip();
  let built = 0;
  let totalAtts = 0;
  const allAttsPerMail = mails.map(e => {
    const a = getAtts(e.full.payload);
    totalAtts += a.length;
    return a;
  });
  setStage('atts');
  document.getElementById('pdon').textContent = '0';
  document.getElementById('ptot').textContent = mails.length;

  for (let mi = 0; mi < mails.length; mi++) {
    if (dlCancel) break;
    const e = mails[mi];
    const yr = e.date.getFullYear() || 'Unknown';
    const mo = MON[e.date.getMonth() + 1] || 'Unknown';
    const safeSub = e.subject.replace(/[/\\?%*:|"<>]/g, '-').substring(0, 80);
    const dp = e.date.getTime() === 0 ? '0000-00-00' : e.date.toISOString().slice(0, 10);
    const fn = `${dp} - ${safeSub}`;
    const fld = zip.folder(`${yr}/${mo}`);
    const atts = allAttsPerMail[mi];
    const attMap = {};

    if (atts.length) {
      const af = fld.folder(`${fn}_attachments`);
      const attProg = document.getElementById('att-prog');
      attProg.classList.add('show');

      for (let ai = 0; ai < atts.length; ai++) {
        if (dlCancel) break;
        const att = atts[ai];
        document.getElementById('att-label').textContent = `📎 ${att.filename} (${fsize(att.size)}) — email ${mi + 1}/${mails.length}`;
        document.getElementById('att-bar').style.width = ((ai / atts.length) * 100) + '%';
        try {
          const r = await fetchAttWithRetry(e.id, att.attachmentId);
          if (r.result?.data) {
            const b64 = r.result.data.replace(/-/g, '+').replace(/_/g, '/');
            const bin = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
            const sn = att.filename.replace(/[/\\?%*:|"<>]/g, '-');
            af.file(sn, bin, { binary: true });
            attMap[att.attachmentId] = sn;
            log('📎 ' + att.filename, 'ok');
          }
        } catch (er) {
          log('Att skipped (' + att.filename + '): ' + er.message, 'err');
        }
        const attsDoneSoFar = allAttsPerMail.slice(0, mi).reduce((s, a) => s + a.length, 0) + ai + 1;
        const attPct = totalAtts > 0 ? (attsDoneSoFar / totalAtts) * 33 : 0;
        document.getElementById('pfil').style.width = (33 + attPct) + '%';
      }
      document.getElementById('att-bar').style.width = '100%';
      await tick();
    }

    fld.file(`${fn}.html`, makeEmailHtml(e, attMap, atts.length ? `${fn}_attachments` : null));
    built++;
    setStage('zip');
    const buildPct = (built / mails.length) * 17;
    document.getElementById('pfil').style.width = (66 + buildPct) + '%';
    document.getElementById('pdon').textContent = built;
    document.getElementById('pstat').textContent = `Built ${built} of ${mails.length} emails`;
    tickTimer(mails.length + built);
    if (built % 5 === 0) await tick();
  }

  document.getElementById('att-prog').classList.remove('show');
  zip.file('index.html', makeIndex(mails));
  setStage('compress');
  setProg('Compressing…', 'Compressing ZIP file…', 83);
  document.getElementById('prog-time').textContent = 'Almost done…';
  document.getElementById('prog-spin-txt').textContent = 'Compressing…';
  await tick();
  let lastYield = Date.now();
  const blob = await zip.generateAsync(
    { type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 4 } },
    async m => {
      const pct = 83 + (m.percent / 100) * 17;
      document.getElementById('pfil').style.width = pct.toFixed(0) + '%';
      document.getElementById('pstat').textContent = 'Compressing… ' + m.percent.toFixed(0) + '%';
      if (Date.now() - lastYield > 150) {
        lastYield = Date.now();
        await tick();
      }
    }
  );
  document.getElementById('pfil').style.width = '100%';
  document.getElementById('prog-time').textContent = 'Done!';
  document.getElementById('prog-time').className = 'prog-time done';
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `MailVault_${new Date().toISOString().slice(0, 10)}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 8000);
  log('✓ Downloaded ' + mails.length + ' emails + attachments', 'ok');
}

// ── UTF-8 safe base64 decode ──────────────────────────────────────────────────
function b64dec(data) {
  if (!data) return '';
  try {
    const b64 = (data + '').replace(/-/g, '+').replace(/_/g, '/');
    const pad = b64.length % 4 ? b64 + '===='.slice(b64.length % 4) : '';
    const raw = atob(pad || b64);
    const bytes = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
    return new TextDecoder('utf-8', { fatal: false }).decode(bytes);
  } catch (e) {
    return '';
  }
}

function getBodies(payload, r = { h: null, t: null }) {
  if (!payload) return r;
  const m = (payload.mimeType || '').toLowerCase();
  if (m === 'text/html' && payload.body?.data && !r.h) {
    r.h = b64dec(payload.body.data);
  } else if (m === 'text/plain' && payload.body?.data && !r.t) {
    r.t = b64dec(payload.body.data);
  }
  if (m.startsWith('multipart/') && payload.parts) {
    payload.parts.forEach(p => getBodies(p, r));
  }
  return { html: r.h, text: r.t };
}

function getAtts(payload, list = []) {
  if (!payload) return list;
  if (payload.filename && payload.filename.length > 0 && payload.body?.attachmentId) {
    list.push({ filename: payload.filename, mimeType: payload.mimeType || '', size: payload.body.size || 0, attachmentId: payload.body.attachmentId });
  }
  if (payload.parts) payload.parts.forEach(p => getAtts(p, list));
  return list;
}

function makeEmailHtml(e, attMap, attFolder) {
  const H = {};
  (e.full.payload?.headers || []).forEach(h => H[h.name] = h.value);
  const { html, text } = getBodies(e.full.payload);
  const atts = getAtts(e.full.payload);
  let body;
  if (html) {
    body = `<div class="ehtml">${html}</div>`;
  } else if (text) {
    const lines = text.split('\n').map(l => {
      const e2 = l.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const linked = e2.replace(/(https?:\/\/[^\s<>"]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
      if (l.startsWith('>') || l.startsWith('&gt;')) return `<span class="qt">${linked}</span>`;
      return linked;
    });
    body = `<pre class="plain">${lines.join('\n')}</pre>`;
  } else {
    body = '<p class="nocon">No readable content found.</p>';
  }
  let attSec = '';
  if (atts.length) {
    const items = atts.map(a => {
      const nm = a.filename || 'attachment';
      const saved = attMap && attMap[a.attachmentId];
      return saved
        ? `<a class="abtn" href="${safeEnc(attFolder)}/${safeEnc(attMap[a.attachmentId])}" download="${esc(nm)}">📎 ${esc(nm)} <small>(${fsize(a.size)})</small></a>`
        : `<span class="abtn amis">📎 ${esc(nm)} <small>(${fsize(a.size)})</small></span>`;
    }).join('');
    attSec = `<div class="awrap"><div class="ahead">Attachments (${atts.length})</div><div class="alist">${items}</div></div>`;
  }
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(e.subject)}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:#f4f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#111;min-height:100vh}
.wrap{max-width:820px;margin:24px auto;background:#fff;border-radius:14px;border:1px solid #e0e3e8;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.07)}
.hdr{padding:22px 28px 18px;border-bottom:1px solid #edeef1}
.subj{font-size:20px;font-weight:700;line-height:1.35;letter-spacing:-.3px;color:#0f1117;margin-bottom:14px}
.meta{display:grid;grid-template-columns:52px 1fr;gap:4px 10px;font-size:13px}
.ml{color:#9098a6;font-weight:600}.mv{color:#4b5260;word-break:break-word}.mv a{color:#4f6ef7}
.awrap{padding:12px 28px;background:#f7f8fa;border-bottom:1px solid #edeef1}
.ahead{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#9098a6;margin-bottom:8px}
.alist{display:flex;flex-wrap:wrap;gap:8px}
.abtn{display:inline-flex;align-items:center;gap:6px;padding:6px 13px;background:#eef1fe;color:#4f6ef7;border:1px solid rgba(79,110,247,.2);border-radius:8px;font-size:13px;text-decoration:none}
.abtn:hover{background:#dde4fd}.abtn small{color:#9098a6;font-size:11px}
.amis{background:#f0f0f0;color:#888;border-color:#ddd;cursor:default}
.body{padding:24px 28px}
.ehtml{font-size:14px;line-height:1.6;color:#111}.ehtml img{max-width:100%;height:auto}.ehtml a{color:#4f6ef7}.ehtml table{max-width:100%;border-collapse:collapse}
.plain{font-family:'Menlo','Consolas',monospace;font-size:13.5px;line-height:1.75;white-space:pre-wrap;word-break:break-word;color:#1e2030}
.plain .qt{color:#9098a6;border-left:3px solid #d0d4dc;padding-left:8px;display:block;margin:1px 0}
.plain a{color:#4f6ef7}.nocon{color:#9098a6;font-style:italic;font-size:14px}
.foot{padding:12px 28px;background:#f7f8fa;border-top:1px solid #edeef1;font-size:11px;color:#b0b8c6;text-align:center}
@media(max-width:600px){.wrap{margin:0;border-radius:0}.hdr,.body,.awrap,.foot{padding-left:16px;padding-right:16px}}
</style></head>
<body><div class="wrap">
<div class="hdr">
  <div class="subj">${esc(e.subject)}</div>
  <div class="meta">
    <span class="ml">From</span><span class="mv">${esc(H['From']||e.from)}</span>
    <span class="ml">To</span><span class="mv">${esc(H['To']||'')}</span>
    ${H['Cc']?`<span class="ml">Cc</span><span class="mv">${esc(H['Cc'])}</span>`:''}
    <span class="ml">Date</span><span class="mv">${esc(H['Date']||e.dateStr)}</span>
  </div>
</div>
${attSec}
<div class="body">${body}</div>
<div class="foot">Saved by MailVault · ${new Date().toLocaleDateString()}</div>
</div></body></html>`;
}

function makeIndex(mails) {
  const rows = mails.map(e => {
    const yr = e.date.getFullYear() || 'Unknown', mo = MON[e.date.getMonth() + 1] || 'Unknown';
    const ss = e.subject.replace(/[/\\?%*:|"<>]/g, '-').substring(0, 80);
    const dp = e.date.getTime() === 0 ? '0000-00-00' : e.date.toISOString().slice(0, 10);
    const fn = safeEnc(yr) + '/' + safeEnc(mo) + '/' + safeEnc(`${dp} - ${ss}.html`);
    const from = e.from.replace(/<[^>]+>/g, '').replace(/"/g, '').trim();
    return `<tr><td>${esc(dp)}</td><td>${esc(from)}</td><td><a href="${fn}">${esc(e.subject)}</a></td></tr>`;
  }).join('');
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>MailVault Backup</title>
<style>body{font-family:sans-serif;max-width:900px;margin:0 auto;padding:2rem;background:#f4f5f7}h1{font-size:22px;margin-bottom:.5rem}p{color:#666;font-size:13px;margin-bottom:1.5rem}
table{width:100%;background:#fff;border-collapse:collapse;border-radius:10px;overflow:hidden;border:1px solid #e0e3e8}th{text-align:left;padding:10px 14px;font-size:11px;text-transform:uppercase;letter-spacing:.4px;color:#9098a6;border-bottom:2px solid #e0e3e8}
td{padding:9px 14px;font-size:13px;border-bottom:1px solid #f0f0f0}td:first-child{color:#9098a6;white-space:nowrap}tr:hover td{background:#f7f8fa}a{color:#4f6ef7;text-decoration:none}a:hover{text-decoration:underline}</style></head>
<body><h1>📬 MailVault Backup</h1><p>Generated ${new Date().toLocaleString()} · ${mails.length} emails</p>
<table><thead><tr><th>Date</th><th>From</th><th>Subject</th></tr></thead><tbody>${rows}</tbody></table></body></html>`;
}

// ═══ DELETE EMAILS ════════════════════════════════════════════════════════════
function confirmDel() {
  if (!sel.size) return;
  document.getElementById('delcnt').textContent = sel.size + ' email' + (sel.size !== 1 ? 's' : '');
  showMod('delmod');
}

async function doDelete() {
  closeMod('delmod');
  const ids = [...sel];
  document.getElementById('deltbn').disabled = true;
  document.getElementById('dldtn').disabled = true;
  document.getElementById('att-prog').classList.remove('show');
  document.querySelector('.stages').style.display = 'none';
  document.querySelector('.prog-tip').style.display = 'none';
  document.getElementById('pfil').style.width = '0%';
  document.getElementById('pdon').textContent = '0';
  document.getElementById('ptot').textContent = ids.length;
  document.getElementById('ptitl').textContent = 'Moving to Trash…';
  document.getElementById('pstat').textContent = 'Starting…';
  document.getElementById('prog-time').textContent = 'Estimating…';
  document.getElementById('prog-time').className = 'prog-time';
  document.getElementById('prog-spin-txt').textContent = 'Working…';
  dlCancel = false;
  showMod('progmod');
  startTimer(ids.length);
  log('Moving ' + ids.length + ' emails to Trash…', 'info');
  let moved = 0, errs = 0;

  for (let i = 0; i < ids.length; i += 10) {
    if (dlCancel) break;
    const chunk = ids.slice(i, i + 10);
    const res = await Promise.allSettled(chunk.map(id =>
      gapi.client.gmail.users.messages.trash({ userId: 'me', id }).then(() => id)
    ));
    res.forEach(r => {
      if (r.status === 'fulfilled') moved++;
      else errs++;
    });
    const pct = (moved / ids.length) * 100;
    document.getElementById('pfil').style.width = pct + '%';
    document.getElementById('pdon').textContent = moved;
    document.getElementById('pstat').textContent = `Moved ${moved} of ${ids.length} emails`;
    tickTimer(moved);
    log('Trashed: ' + moved + '/' + ids.length, 'info');
    await tick();
  }

  document.getElementById('pfil').style.width = '100%';
  document.getElementById('prog-time').textContent = 'Done!';
  document.getElementById('prog-time').className = 'prog-time done';
  document.getElementById('prog-spin-txt').textContent = errs > 0 ? `Done — ${errs} error(s)` : 'All done!';
  document.getElementById('pstat').textContent = dlCancel
    ? `Cancelled — moved ${moved} of ${ids.length}`
    : `✓ Moved ${moved} to Trash${errs > 0 ? ' (' + errs + ' errors)' : ''}`;

  await new Promise(r => setTimeout(r, 1200));
  closeMod('progmod');
  document.querySelector('.stages').style.display = '';
  document.querySelector('.prog-tip').style.display = '';
  allMails = allMails.filter(e => !sel.has(e.id));
  sel.clear();
  doFilter();
  log('✓ Moved ' + moved + ' to Trash. Errors: ' + errs, errs > 0 ? 'err' : 'ok');
  try {
    const r = await gapi.client.gmail.users.getProfile({ userId: 'me' });
    document.getElementById('stot').textContent = (r.result.messagesTotal || 0).toLocaleString();
  } catch (e) {}
  document.getElementById('slod').textContent = allMails.length > 0 ? allMails.length.toLocaleString() : '0';
  document.getElementById('dldtn').disabled = sel.size === 0;
  loadTrashCount();
}

// ═══ PURGE TRASH ══════════════════════════════════════════════════════════════
async function confirmPurge() {
  document.getElementById('purgecnt').textContent = '…';
  showMod('purgemod');
  try {
    const ids = [];
    let pt = null;
    do {
      const p = { userId: 'me', labelIds: ['TRASH'], maxResults: 500 };
      if (pt) p.pageToken = pt;
      const r = await gapi.client.gmail.users.messages.list(p);
      (r.result.messages || []).forEach(m => ids.push(m.id));
      pt = r.result.nextPageToken;
      if (ids.length >= 5000) break;
    } while (pt);
    document.getElementById('purgecnt').textContent = ids.length.toLocaleString();
    window._purgeIds = ids;
  } catch (e) {
    document.getElementById('purgecnt').textContent = 'unknown number of';
    window._purgeIds = null;
  }
}

async function doPurge() {
  closeMod('purgemod');
  const ids = window._purgeIds;
  if (!ids || !ids.length) {
    log('No trash emails to delete', 'info');
    return;
  }
  document.getElementById('att-prog').classList.remove('show');
  document.querySelector('.stages').style.display = 'none';
  document.querySelector('.prog-tip').style.display = 'none';
  document.getElementById('pfil').style.width = '0%';
  document.getElementById('pdon').textContent = '0';
  document.getElementById('ptot').textContent = ids.length;
  document.getElementById('ptitl').textContent = 'Purging Trash…';
  document.getElementById('pstat').textContent = 'Permanently deleting emails…';
  document.getElementById('prog-time').textContent = 'Estimating…';
  document.getElementById('prog-time').className = 'prog-time';
  document.getElementById('prog-spin-txt').textContent = 'Deleting…';
  dlCancel = false;
  showMod('progmod');
  startTimer(ids.length);
  log('Permanently deleting ' + ids.length + ' trash emails…', 'info');
  let deleted = 0, errs = 0;

  for (let i = 0; i < ids.length; i += 10) {
    if (dlCancel) break;
    const chunk = ids.slice(i, i + 10);
    const res = await Promise.allSettled(chunk.map(id =>
      gapi.client.gmail.users.messages.delete({ userId: 'me', id }).then(() => id)
    ));
    res.forEach(r => {
      if (r.status === 'fulfilled') deleted++;
      else errs++;
    });
    const pct = (deleted / ids.length) * 100;
    document.getElementById('pfil').style.width = pct + '%';
    document.getElementById('pdon').textContent = deleted;
    document.getElementById('pstat').textContent = `Deleted ${deleted} of ${ids.length} emails`;
    tickTimer(deleted);
    await tick();
  }

  document.getElementById('pfil').style.width = '100%';
  document.getElementById('prog-time').textContent = 'Done!';
  document.getElementById('prog-time').className = 'prog-time done';
  document.getElementById('prog-spin-txt').textContent = errs > 0 ? `Done — ${errs} error(s)` : 'All done!';
  document.getElementById('pstat').textContent = dlCancel
    ? `Cancelled — deleted ${deleted} of ${ids.length}`
    : `✓ Permanently deleted ${deleted} emails${errs > 0 ? ' (' + errs + ' errors)' : ''}`;

  await new Promise(r => setTimeout(r, 1400));
  closeMod('progmod');
  document.querySelector('.stages').style.display = '';
  document.querySelector('.prog-tip').style.display = '';
  log('✓ Purged ' + deleted + ' from Trash. Errors: ' + errs, errs > 0 ? 'err' : 'ok');
  window._purgeIds = null;
  loadTrashCount();
  try {
    const r = await gapi.client.gmail.users.getProfile({ userId: 'me' });
    document.getElementById('stot').textContent = (r.result.messagesTotal || 0).toLocaleString();
  } catch (e) {}
}

// ═══ HELPERS ══════════════════════════════════════════════════════════════════
function swTab(id, el) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('on'));
  document.querySelectorAll('.tpan').forEach(t => t.classList.remove('on'));
  el.classList.add('on');
  document.getElementById('tab-' + id).classList.add('on');
}

function showMod(id) {
  document.getElementById(id).style.display = 'flex';
}

function closeMod(id) {
  document.getElementById(id).style.display = 'none';
}

function setProg(title, status, pct) {
  document.getElementById('ptitl').textContent = title;
  document.getElementById('pstat').textContent = status;
  document.getElementById('pfil').style.width = (pct || 0) + '%';
}

function setStat(s) {
  document.getElementById('pstat').textContent = s;
}

function log(msg, type = 'info') {
  const b = document.getElementById('logbox');
  const c = type === 'ok' ? 'lok' : type === 'err' ? 'lerr' : 'linf';
  const t = new Date().toLocaleTimeString();
  b.innerHTML += `<div class="${c}">[${t}] ${esc(String(msg))}</div>`;
  b.scrollTop = b.scrollHeight;
}

function fdate(d) {
  if (!d || d.getTime() === 0) return '—';
  const n = new Date();
  if (d.toDateString() === n.toDateString()) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (d.getFullYear() === n.getFullYear()) return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  return d.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
}

function fsize(b) {
  if (!b) return '';
  if (b < 1024) return b + 'B';
  if (b < 1048576) return (b / 1024).toFixed(0) + 'KB';
  return (b / 1048576).toFixed(1) + 'MB';
}

function esc(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function safeEnc(s) {
  try {
    return encodeURIComponent(s || '');
  } catch (e) {
    return encodeURIComponent(String(s || '').replace(/[\uD800-\uDFFF]/g, '_'));
  }
}

function ldScript(src) {
  return new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = res;
    s.onerror = rej;
    document.head.appendChild(s);
  });
}

function tick() {
  return new Promise(r => setTimeout(r, 0));
}
