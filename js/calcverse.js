/* ============================================================
   allfreecalculators.in front-end app layer (vanilla, offline, ES5-safe)
   Theme, search palette, AI assistant, accounts, favorites,
   history, collections, dashboard, reviews, analytics, i18n,
   monetization, no-code calculator builder.
   NOTE: accounts/vishal4747/analytics are client-side (localStorage)
   demo systems. Wire to a backend for real multi-user use.
   ============================================================ */
(function () {
  'use strict';
  var PFX = 'calcverse:';
  var SEO = window.SEO || { ORDER: [], TOOLS: {}, CATS: {} };
  var ORDER = SEO.ORDER || [], TOOLS = SEO.TOOLS || {}, CATS = SEO.CATS || {};

  /* ---------- storage ---------- */
  function get(k, d) { try { var v = localStorage.getItem(PFX + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }
  function set(k, v) { try { localStorage.setItem(PFX + k, JSON.stringify(v)); } catch (e) {} }
  function del(k) { try { localStorage.removeItem(PFX + k); } catch (e) {} }
  function hash(s) { var h = 5381, i = String(s).length; while (i) h = (h * 33) ^ String(s).charCodeAt(--i); return (h >>> 0).toString(36); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]; }); }
  function el(tag, attrs, html) { var e = document.createElement(tag); if (attrs) for (var k in attrs) { if (k === 'class') e.className = attrs[k]; else if (k === 'html') e.innerHTML = attrs[k]; else e.setAttribute(k, attrs[k]); } if (html != null) e.innerHTML = html; return e; }
  function qs(s, r) { return (r || document).querySelector(s); }
  function qsa(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }

  /* ---------- toast ---------- */
  function toast(msg) { var t = el('div', { class: 'toast' }, esc(msg)); document.body.appendChild(t); requestAnimationFrame(function () { t.classList.add('show'); }); setTimeout(function () { t.classList.remove('show'); setTimeout(function () { t.remove(); }, 350); }, 2200); }

  /* ============================================================
     THEME (light / dark / auto)
     ============================================================ */
  var Theme = {
    pref: function () { return get('theme', 'auto'); },
    sysDark: function () { return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches; },
    apply: function () { var p = this.pref(); var d = p === 'auto' ? this.sysDark() : p === 'dark'; document.documentElement.setAttribute('data-theme', d ? 'dark' : 'light'); var b = qs('#themeBtn'); if (b) b.textContent = p === 'auto' ? '\uD83C\uDF13' : (d ? '\u2600\uFE0F' : '\uD83C\uDF19'); },
    cycle: function () { var order = ['light', 'dark', 'auto']; var i = order.indexOf(this.pref()); set('theme', order[(i + 1) % 3]); this.apply(); toast('Theme: ' + this.pref()); }
  };
  try { if (window.matchMedia) window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () { if (Theme.pref() === 'auto') Theme.apply(); }); } catch (e) {}

  /* ============================================================
     AUTH (client-side demo)
     ============================================================ */
  var Auth = {
    users: function () { return get('users', {}); },
    current: function () { var e = get('session', null); return e ? this.users()[e] || null : null; },
    signup: function (name, email, pass) { email = String(email || '').trim().toLowerCase(); if (!name || !email || !pass) return { err: 'All fields required.' }; var u = this.users(); if (u[email]) return { err: 'Email already registered.' }; u[email] = { name: name, email: email, pass: hash(pass), created: Date.now(), provider: 'email' }; set('users', u); set('session', email); return { ok: true }; },
    login: function (email, pass) { email = String(email || '').trim().toLowerCase(); var u = this.users()[email]; if (!u || u.pass !== hash(pass)) return { err: 'Invalid email or password.' }; set('session', email); return { ok: true }; },
    social: function (provider) { var email = provider + '.user@example.com'; var u = this.users(); if (!u[email]) { u[email] = { name: provider[0].toUpperCase() + provider.slice(1) + ' User', email: email, pass: hash(Math.random()), created: Date.now(), provider: provider }; set('users', u); } set('session', email); return { ok: true }; },
    otp: function (email) { email = String(email || '').trim().toLowerCase(); if (!email) return { err: 'Enter email/phone.' }; var u = this.users(); if (!u[email]) u[email] = { name: email.split('@')[0], email: email, pass: hash(Math.random()), created: Date.now(), provider: 'otp' }; set('users', u); set('session', email); return { ok: true }; },
    logout: function () { del('session'); },
    updateName: function (name) { var e = get('session', null); if (!e) return; var u = this.users(); if (u[e]) { u[e].name = name; set('users', u); } },
    setRole: function (email, role) { var u = this.users(); if (u[email]) { u[email].role = role; set('users', u); } },
    setBanned: function (email, b) { var u = this.users(); if (u[email]) { u[email].banned = !!b; set('users', u); } }
  };

  /* ---------- header account box ---------- */
  function renderAccount() {
    var box = qs('#acctBox'); if (!box) return; var u = Auth.current(); box.innerHTML = '';
    if (u) {
      box.appendChild(el('span', { class: 'acct-name' }, '\uD83D\uDC4B ' + esc(u.name.split(' ')[0])));
      var dash = el('a', { class: 'icon-btn', href: 'account.html', title: 'Account' }, '\uD83D\uDC64');
      var out = el('button', { class: 'icon-btn', title: 'Logout' }, '\u23FB');
      out.onclick = function () { Auth.logout(); toast('Logged out'); renderAccount(); };
      box.appendChild(dash); box.appendChild(out);
    } else {
      var login = el('a', { class: 'btn ghost sm', href: 'login.html' }, 'Login');
      var up = el('a', { class: 'btn sm', href: 'signup.html' }, 'Sign up');
      box.appendChild(login); box.appendChild(up);
    }
  }

  /* ============================================================
     SEARCH + COMMAND PALETTE (Ctrl/Cmd-K)
     ============================================================ */
  var Search = {
    all: function () { return ORDER.map(function (id) { var t = TOOLS[id]; return { id: id, name: t.name, cat: t.cat, icon: t.icon, slug: t.slug }; }); },
    query: function (q) { q = String(q || '').trim().toLowerCase(); if (!q) return this.all().slice(0, 12); var toks = q.split(/\s+/); return this.all().map(function (t) { var hay = (t.name + ' ' + t.cat).toLowerCase(); var sc = 0; toks.forEach(function (tk) { var i = hay.indexOf(tk); if (i >= 0) sc += (i === 0 ? 3 : 1) + (t.name.toLowerCase().indexOf(tk) === 0 ? 2 : 0); }); return { t: t, sc: sc }; }).filter(function (x) { return x.sc > 0; }).sort(function (a, b) { return b.sc - a.sc; }).slice(0, 30).map(function (x) { return x.t; }); }
  };
  var cmdk, cmdkInput, cmdkRes, cmdkSel = 0, cmdkItems = [];
  function buildCmdk() {
    if (cmdk) return; var back = el('div', { class: 'cmdk-back', id: 'cmdkBack' });
    cmdk = el('div', { class: 'cmdk' });
    cmdkInput = el('input', { type: 'text', placeholder: 'Search 2900+ calculators & tools\u2026', 'aria-label': 'Search' });
    cmdkRes = el('div', { class: 'cmdk-res' });
    cmdk.appendChild(cmdkInput); cmdk.appendChild(cmdkRes); back.appendChild(cmdk); document.body.appendChild(back);
    back.addEventListener('click', function (e) { if (e.target === back) closeCmdk(); });
    cmdkInput.addEventListener('input', function () { renderCmdk(cmdkInput.value); });
    cmdkInput.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); cmdkSel = Math.min(cmdkSel + 1, cmdkItems.length - 1); paintSel(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); cmdkSel = Math.max(cmdkSel - 1, 0); paintSel(); }
      else if (e.key === 'Enter') { var it = cmdkItems[cmdkSel]; if (it) location.href = it.slug + '.html'; }
      else if (e.key === 'Escape') closeCmdk();
    });
  }
  function renderCmdk(q) {
    cmdkItems = Search.query(q); cmdkSel = 0; cmdkRes.innerHTML = '';
    if (!cmdkItems.length) { cmdkRes.appendChild(el('div', { class: 'cmdk-empty' }, 'No tools found for \u201C' + esc(q) + '\u201D')); return; }
    cmdkItems.forEach(function (t, i) {
      var a = el('a', { href: t.slug + '.html', class: i === 0 ? 'sel' : '' });
      a.innerHTML = '<span class="ic">' + t.icon + '</span><span>' + esc(t.name) + '</span><span class="ct">' + esc(t.cat) + '</span>';
      cmdkRes.appendChild(a);
    });
  }
  function paintSel() { qsa('.cmdk-res a').forEach(function (a, i) { a.className = i === cmdkSel ? 'sel' : ''; if (i === cmdkSel) a.scrollIntoView({ block: 'nearest' }); }); }
  function openCmdk(seed) { buildCmdk(); qs('#cmdkBack').classList.add('open'); cmdkInput.value = seed || ''; renderCmdk(cmdkInput.value); setTimeout(function () { cmdkInput.focus(); }, 30); }
  function closeCmdk() { if (cmdk) qs('#cmdkBack').classList.remove('open'); }
  document.addEventListener('keydown', function (e) { if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) { e.preventDefault(); openCmdk(); } });
  window.CalcVerseSearch = openCmdk;

  /* ============================================================
     AI ASSISTANT (offline, rule-based over the tool registry)
     ============================================================ */
  var AI = {
    find: function (q) { return Search.query(q).slice(0, 5); },
    reply: function (q) {
      q = String(q || '').trim(); if (!q) return { text: 'Ask me to find a calculator, explain a formula, or pick the right tool.' };
      var low = q.toLowerCase(), hits = this.find(q);
      if (/^(hi|hello|hey|namaste)/.test(low)) return { text: 'Hi! I\u2019m your allfreecalculators.in assistant. Tell me what you want to calculate \u2014 e.g. \u201CEMI for a 20 lakh loan\u201D or \u201Cconvert km to miles\u201D.' };
      if (/formula|equation/.test(low) && hits.length) return { text: 'For the ' + hits[0].name + ', open it and check the \u201CFormula & method\u201D section \u2014 it shows the exact formula with a worked example.', hits: hits };
      if (/explain|how.*work|what is/.test(low) && hits.length) return { text: 'The ' + hits[0].name + ' under ' + hits[0].cat + ' does that. Its page includes an explanation, examples and FAQs.', hits: hits };
      if (hits.length) return { text: 'I found ' + hits.length + ' matching tool' + (hits.length > 1 ? 's' : '') + '. Top pick: ' + hits[0].name + '.', hits: hits };
      return { text: 'I couldn\u2019t match that exactly. Try keywords like \u201Closn\u201D, \u201Cbmi\u201D, \u201Ctax\u201D, \u201Cpercentage\u201D or \u201Cconvert\u201D.' };
    }
  };
  function aiBubble(cls, html) { var m = el('div', { class: 'ai-msg ' + cls }); m.innerHTML = html; return m; }
  function aiAsk(log, q) {
    if (!q) return; log.appendChild(aiBubble('me', esc(q))); var r = AI.reply(q);
    var html = esc(r.text);
    if (r.hits) html += '<div style="margin-top:8px;display:flex;flex-direction:column;gap:4px">' + r.hits.map(function (h) { return '<a href="' + h.slug + '.html">' + h.icon + ' ' + esc(h.name) + '</a>'; }).join('') + '</div>';
    log.appendChild(aiBubble('bot', html)); log.scrollTop = log.scrollHeight;
  }
  function wireAI(root) {
    var log = qs('.ai-log', root), input = qs('.ai-input input', root), send = qs('.ai-send', root), mic = qs('.ai-mic', root);
    if (!log) return;
    log.appendChild(aiBubble('bot', 'Hi \uD83D\uDC4B I\u2019m your <b>offline AI assistant</b>. Ask me to find any calculator or explain a result.'));
    function go() { var v = input.value; input.value = ''; aiAsk(log, v); }
    if (send) send.onclick = go;
    if (input) input.addEventListener('keydown', function (e) { if (e.key === 'Enter') go(); });
    qsa('.ai-sugg button', root).forEach(function (b) { b.onclick = function () { aiAsk(log, b.textContent); }; });
    if (mic) mic.onclick = function () {
      var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SR) { toast('Voice not supported in this browser'); return; }
      var rec = new SR(); rec.lang = (get('lang', 'en') === 'hi' ? 'hi-IN' : 'en-US'); rec.onresult = function (ev) { var txt = ev.results[0][0].transcript; input.value = txt; go(); try { var u = new SpeechSynthesisUtterance('Searching ' + txt); speechSynthesis.speak(u); } catch (e) {} }; rec.start(); toast('Listening\u2026');
    };
  }

  /* ============================================================
     RECENTLY USED / FAVORITES / HISTORY
     ============================================================ */
  function recordRecent(id) { if (!id) return; var r = get('recent', []); r = r.filter(function (x) { return x !== id; }); r.unshift(id); set('recent', r.slice(0, 24)); }
  function favs() { return get('favs', {}); }
  function toggleFav(id) { var f = favs(); if (f[id]) delete f[id]; else f[id] = Date.now(); set('favs', f); return !!f[id]; }
  function logHistory(id, summary) { var h = get('history', []); h.unshift({ id: id, t: Date.now(), s: summary || '' }); set('history', h.slice(0, 100)); }
  window.CalcVerseHistory = logHistory;

  /* ============================================================
     ANALYTICS (client-side events)
     ============================================================ */
  var Analytics = {
    log: function (type, data) { var e = get('analytics:events', []); e.push({ ty: type, d: data || {}, t: Date.now() }); if (e.length > 4000) e = e.slice(-4000); set('analytics:events', e); },
    summary: function () {
      var e = get('analytics:events', []); var byTool = {}, byDay = {}, types = {};
      e.forEach(function (x) { types[x.ty] = (types[x.ty] || 0) + 1; if (x.d && x.d.id) byTool[x.d.id] = (byTool[x.d.id] || 0) + 1; var day = new Date(x.t).toISOString().slice(0, 10); byDay[day] = (byDay[day] || 0) + 1; });
      var top = Object.keys(byTool).map(function (k) { return { id: k, n: byTool[k] }; }).sort(function (a, b) { return b.n - a.n; }).slice(0, 10);
      return { total: e.length, views: types.view || 0, calcs: types.calc || 0, users: Object.keys(Auth.users()).length, top: top, byDay: byDay };
    }
  };

  /* ============================================================
     I18N (UI scaffold)
     ============================================================ */
  var I18N = {
    langs: { en: 'English', hi: '\u0939\u093F\u0928\u094D\u0926\u0940', ar: '\u0627\u0644\u0639\u0631\u0628\u064A\u0629', es: 'Espa\u00F1ol', fr: 'Fran\u00E7ais', de: 'Deutsch', zh: '\u4E2D\u6587', ja: '\u65E5\u672C\u8A9E', ru: '\u0420\u0443\u0441\u0441\u043A\u0438\u0439' },
    rtl: { ar: 1 },
    apply: function () { var l = get('lang', 'en'); document.documentElement.lang = l; document.documentElement.dir = this.rtl[l] ? 'rtl' : 'ltr'; }
  };
  function wireLang() { var s = qs('#langSel'); if (!s) return; var cur = get('lang', 'en'); s.innerHTML = ''; for (var k in I18N.langs) { var o = el('option', { value: k }, I18N.langs[k]); if (k === cur) o.selected = true; s.appendChild(o); } s.onchange = function () { set('lang', s.value); I18N.apply(); if (window.CalcVerseI18N) window.CalcVerseI18N.run(s.value); toast('Language: ' + I18N.langs[s.value] + ' \u2014 auto-translation hooks ready (connect a translation API for full content).'); }; }

  /* ============================================================
     ADMIN control (client-side)
     ============================================================ */
  /* ============================================================
     Auto-translate (best-effort) + PWA install
     ============================================================ */
  function csHasAlpha(s){ for (var i=0;i<s.length;i++){ var c=s.charCodeAt(i); if((c>=65&&c<=90)||(c>=97&&c<=122)) return true; } return false; }
  function csCollect(root, out){
    var skip = { SCRIPT:1, STYLE:1, NOSCRIPT:1, CANVAS:1, INPUT:1, TEXTAREA:1, SELECT:1, OPTION:1, CODE:1, PRE:1, KBD:1 };
    (function walk(node){
      for (var c=node.firstChild; c; c=c.nextSibling){
        if (c.nodeType===3){ var s=(c.nodeValue||'').trim(); if(s.length>1 && s.length<460 && csHasAlpha(s)) out.push({ node:c, txt:s }); }
        else if (c.nodeType===1 && !skip[c.tagName] && c.getAttribute('data-no-tr')===null) walk(c);
      }
    })(root);
  }
  var Translate = {
    busy:false,
    run: function (lang){
      try {
        if (!lang || lang === 'en') return;
        var scope = qs('.main-col') || qs('.wrap'); if (!scope) return;
        var ck = 'tr:' + lang; var cache = get(ck, {});
        var nodes = []; csCollect(scope, nodes);
        nodes.forEach(function (n){ if (cache[n.txt]) n.node.nodeValue = cache[n.txt]; });
        var todo = nodes.filter(function (n){ return !cache[n.txt]; }).slice(0, 80);
        if (!todo.length) return;
        if (typeof navigator !== 'undefined' && navigator.onLine === false){ toast('Auto-translate needs internet'); return; }
        if (this.busy) return; this.busy = true;
        var self = this, done = 0; toast('Translating page...');
        todo.forEach(function (n){
          fetch('https://api.mymemory.translated.net/get?q=' + encodeURIComponent(n.txt) + '&langpair=en|' + encodeURIComponent(lang))
            .then(function (r){ return r.json(); })
            .then(function (j){ var t = j && j.responseData && j.responseData.translatedText; if (t && j.responseStatus === 200){ cache[n.txt] = t; n.node.nodeValue = t; } })
            .catch(function (){})
            .then(function (){ done++; if (done === todo.length){ self.busy = false; set(ck, cache); toast('Translated to ' + lang); } });
        });
      } catch (e) {}
    }
  };
  window.CalcVerseI18N = Translate;
  function wirePWA(){
    try {
      var ib = qs('#installBtn'); var dp = null;
      window.addEventListener('beforeinstallprompt', function (e){ e.preventDefault(); dp = e; if (ib) ib.style.display = ''; });
      window.addEventListener('appinstalled', function (){ if (ib) ib.style.display = 'none'; toast('App installed!'); });
      if (ib) ib.onclick = function (){ if (dp){ dp.prompt(); if (dp.userChoice) dp.userChoice.then(function (){ dp = null; ib.style.display = 'none'; }); } else { toast('To install: use your browser menu > Install / Add to Home Screen.'); } };
    } catch (e) {}
  }

  var Admin = {
    pass: function () { return get('admin:pass', hash('admin123')); },
    isIn: function () { return !!get('admin:session', false); },
    login: function (p) { if (hash(p) === this.pass()) { set('admin:session', true); return true; } return false; },
    logout: function () { set('admin:session', false); },
    setPass: function (p) { set('admin:pass', hash(p)); },
    disabled: function () { return get('disabled', {}); },
    setDisabled: function (id, v) { var d = this.disabled(); if (v) d[id] = true; else delete d[id]; set('disabled', d); },
    settings: function () { return get('settings', { brand: 'allfreecalculators.in', tagline: 'Free Online Tools & Calculators', currency: 'INR' }); },
    saveSettings: function (s) { set('settings', s); },
    policy: function (k) { return get('policy:' + k, null); },
    savePolicy: function (k, html) { set('policy:' + k, html); },
    config: function () { return get('config', { adsenseId: '', announcement: '', maintenance: false, premiumPrice: '199', apiBase: '', defaultLang: 'en', features: { ai: true, builder: true, reviews: true, blog: true } }); },
    saveConfig: function (c) { var cur = this.config(); for (var k in c) cur[k] = c[k]; set('config', cur); var FB = window.CalcVerseFirebase; if (FB && FB.enabled && FB.isAdmin && FB.saveSiteConfig) { try { FB.saveSiteConfig({ settings: this.settings(), adsenseId: cur.adsenseId, announcement: cur.announcement, maintenance: cur.maintenance, premiumPrice: cur.premiumPrice, apiBase: cur.apiBase, defaultLang: cur.defaultLang, features: cur.features, cashfree: cur.cashfree }); } catch (e) {} } return cur; }
  };

  /* apply admin-disabled tools + policy overrides globally */
  function applyDisabled() { var d = Admin.disabled(); if (!Object.keys(d).length) return; var slug2id = {}; ORDER.forEach(function (id) { slug2id[TOOLS[id].slug] = id; }); qsa('a.tile').forEach(function (a) { var m = (a.getAttribute('href') || '').replace('.html', ''); if (d[slug2id[m]]) a.style.display = 'none'; }); if (window.__CALC_ID && d[window.__CALC_ID]) { var mt = qs('#calcMount'); if (mt) mt.innerHTML = '<div class="note">This tool has been disabled by the administrator.</div>'; } }
  function applyPolicy() { qsa('[data-policy]').forEach(function (n) { var h = Admin.policy(n.getAttribute('data-policy')); if (h) n.innerHTML = h; }); }
  function applyAnnounce() { var c = Admin.config(); var bar = qs("#cvAnnounce"); if (!bar) return; if (c.announcement) { bar.textContent = c.announcement; bar.style.display = ""; } else { bar.style.display = "none"; } }
  function applyMaintenance() { var c = Admin.config(); var FB = window.CalcVerseFirebase; var adm = Admin.isIn() || (FB && FB.isAdmin); if (c.maintenance && !adm && window.__CALC_ID) { var mt = qs("#calcMount"); if (mt) mt.innerHTML = "<div class=\"note\">This site is under maintenance. Please check back soon.</div>"; } }
  function renderConfigTab(cur, b, st) {
    var cfg = Admin.config();
    function save(patch, m) { Admin.saveConfig(patch); toast(m || 'Saved'); }
    if (cur === 'ads') {
      b.innerHTML = '<div class="section"><h3>Ad Manager</h3><label>AdSense publisher ID<br><input id="cfAds" placeholder="ca-pub-XXXXXXXXXXXXXXXX" value="' + esc(cfg.adsenseId) + '"></label><div style="margin-top:8px"><label class="switch"><input type="checkbox" id="cfAdsOn"' + (cfg.adsEnabled === false ? '' : ' checked') + '><span class="sl"></span></label> <span>Show ad slots across the site</span></div><div style="margin-top:10px"><button class="btn sm" id="cfAdsSave">Save</button></div></div>' + '<div class="section"><h3>Affiliate / sponsored blocks</h3><p class="muted">These render inside the ad slots on the site.</p><input id="afLabel" placeholder="Label" style="max-width:190px"> <input id="afUrl" placeholder="https://link" style="max-width:230px"> <input id="afImg" placeholder="Image URL (optional)" style="max-width:230px"> <button class="btn sm" id="afAdd">Add</button><div id="afList" style="margin-top:10px"></div></div>';
      qs('#cfAdsSave').onclick = function () { save({ adsenseId: qs('#cfAds').value.trim(), adsEnabled: qs('#cfAdsOn').checked }, 'Ad settings saved'); logAudit('Ad settings saved'); applyAds(); };
      function paintAff() { var a = Admin.config().affiliates || []; qs('#afList').innerHTML = a.length ? a.map(function (x, i) { return '<div class="admin-row"><span class="ar-ic">AD</span><span><span class="ar-name">' + esc(x.label || '') + '</span> <span class="ar-cat">' + esc(x.url || '') + '</span></span><button class="btn sm ghost sp" data-delaf="' + i + '">Delete</button></div>'; }).join('') : '<p class="muted">No affiliate blocks yet.</p>'; qsa('[data-delaf]').forEach(function (btn) { btn.onclick = function () { var a = Admin.config().affiliates || []; a.splice(+btn.getAttribute('data-delaf'), 1); save({ affiliates: a }, 'Removed'); paintAff(); }; }); }
      qs('#afAdd').onclick = function () { var a = Admin.config().affiliates || []; var lbl = qs('#afLabel').value.trim(); var url = qs('#afUrl').value.trim(); if (!lbl || !url) { toast('Label and URL required'); return; } a.push({ label: lbl, url: url, img: qs('#afImg').value.trim() }); save({ affiliates: a }, 'Affiliate added'); qs('#afLabel').value = ''; qs('#afUrl').value = ''; qs('#afImg').value = ''; paintAff(); };
      paintAff();
    } else if (cur === 'revenue') {
      b.innerHTML = '<div class="section"><h3>Revenue Manager</h3><p class="muted">Manage pricing and plans. Processing real payments needs a backend (Stripe / Razorpay).</p><label>Premium price / month<br><input id="cfPrem" value="' + esc(cfg.premiumPrice) + '" style="max-width:150px"></label> <label>Currency<br><input id="cfCur" value="' + esc(st.currency) + '" style="max-width:110px"></label><div style="margin-top:10px"><button class="btn sm" id="cfRevSave">Save</button></div></div>' + '<div class="section"><h3>Plans</h3><input id="plName" placeholder="Plan name" style="max-width:170px"> <input id="plPrice" placeholder="Price" style="max-width:110px"> <input id="plFeat" placeholder="features, comma separated" style="max-width:260px"> <button class="btn sm" id="plAdd">Add plan</button><div id="plList" style="margin-top:10px"></div></div>' + '<div class="section"><h3>Coupon codes</h3><input id="cpCode" placeholder="CODE" style="max-width:130px"> <input id="cpOff" placeholder="% off" style="max-width:90px"> <button class="btn sm" id="cpAdd">Add coupon</button><div id="cpList" style="margin-top:10px"></div></div>' + '<div class="section"><h3>Premium (paid) calculators</h3><input id="pmSearch" placeholder="Search a tool to mark premium..."><div id="pmSugg" class="cmp-sugg"></div><div id="pmList" style="margin-top:10px"></div></div>';
      qs('#cfRevSave').onclick = function () { Admin.saveSettings({ brand: st.brand, tagline: st.tagline, currency: qs('#cfCur').value }); save({ premiumPrice: qs('#cfPrem').value }, 'Revenue settings saved'); logAudit('Revenue settings saved'); };
      function paintPlans() { var p = Admin.config().plans || []; qs('#plList').innerHTML = p.length ? p.map(function (x, i) { return '<div class="admin-row"><span class="ar-ic">$</span><span><span class="ar-name">' + esc(x.name) + '</span> <span class="ar-cat">' + esc(x.price) + ' - ' + esc((x.feats || []).join(', ')) + '</span></span><button class="btn sm ghost sp" data-delpl="' + i + '">Delete</button></div>'; }).join('') : '<p class="muted">No custom plans.</p>'; qsa('[data-delpl]').forEach(function (btn) { btn.onclick = function () { var a = Admin.config().plans || []; a.splice(+btn.getAttribute('data-delpl'), 1); save({ plans: a }, 'Removed'); paintPlans(); }; }); }
      qs('#plAdd').onclick = function () { var a = Admin.config().plans || []; var nm = qs('#plName').value.trim(); if (!nm) { toast('Plan name required'); return; } a.push({ name: nm, price: qs('#plPrice').value, feats: qs('#plFeat').value.split(',').map(function (s) { return s.trim(); }).filter(Boolean) }); save({ plans: a }, 'Plan added'); qs('#plName').value = ''; qs('#plPrice').value = ''; qs('#plFeat').value = ''; paintPlans(); };
      function paintCp() { var c = Admin.config().coupons || []; qs('#cpList').innerHTML = c.length ? c.map(function (x, i) { return '<div class="admin-row"><span class="ar-ic">%</span><span><span class="ar-name">' + esc(x.code) + '</span> <span class="ar-cat">' + esc(x.off) + '% off</span></span><button class="btn sm ghost sp" data-delcp="' + i + '">Delete</button></div>'; }).join('') : '<p class="muted">No coupons.</p>'; qsa('[data-delcp]').forEach(function (btn) { btn.onclick = function () { var c = Admin.config().coupons || []; c.splice(+btn.getAttribute('data-delcp'), 1); save({ coupons: c }, 'Removed'); paintCp(); }; }); }
      qs('#cpAdd').onclick = function () { var c = Admin.config().coupons || []; var code = qs('#cpCode').value.trim().toUpperCase(); if (!code) { toast('Code required'); return; } c.push({ code: code, off: parseInt(qs('#cpOff').value, 10) || 0 }); save({ coupons: c }, 'Coupon added'); qs('#cpCode').value = ''; qs('#cpOff').value = ''; paintCp(); };
      function paintPm() { var pt = Admin.config().premiumTools || {}; var ids = Object.keys(pt); qs('#pmList').innerHTML = '<b>Premium tools (' + ids.length + '):</b> ' + (ids.length ? ids.map(function (id) { return '<span class="badge" style="margin:2px;cursor:pointer" data-unpm="' + esc(id) + '">' + esc(TOOLS[id] ? TOOLS[id].name : id) + ' x</span>'; }).join('') : '<span class="muted">none</span>'); qsa('[data-unpm]').forEach(function (s) { s.onclick = function () { var pt = Admin.config().premiumTools || {}; delete pt[s.getAttribute('data-unpm')]; save({ premiumTools: pt }, 'Updated'); paintPm(); }; }); }
      qs('#pmSearch').addEventListener('input', function () { var res = Search.query(this.value).slice(0, 8); qs('#pmSugg').innerHTML = res.map(function (t) { return '<button class="chip" data-pm="' + t.id + '">' + t.icon + ' ' + esc(t.name) + '</button>'; }).join(''); qsa('[data-pm]', qs('#pmSugg')).forEach(function (btn) { btn.onclick = function () { var pt = Admin.config().premiumTools || {}; pt[btn.getAttribute('data-pm')] = true; save({ premiumTools: pt }, 'Marked premium'); paintPm(); }; }); });
      paintPlans(); paintCp(); paintPm();
    } else if (cur === 'sec') {
      var audit = get('audit', []);
      b.innerHTML = '<div class="section"><h3>Security and site control</h3><label class="switch"><input type="checkbox" id="cfMaint"' + (cfg.maintenance ? ' checked' : '') + '><span class="sl"></span></label> <span>Maintenance mode (hide tools for non-admins)</span><br><br><label>Announcement banner (blank = off)<br><input id="cfAnn" value="' + esc(cfg.announcement) + '" placeholder="e.g. New AI tools just launched!"></label><div style="margin-top:10px"><button class="btn sm" id="cfSecSave">Save</button></div></div>' + '<div class="section"><h3>Access policy</h3><label class="switch"><input type="checkbox" id="cfReq2fa"' + (cfg.require2fa ? ' checked' : '') + '><span class="sl"></span></label> <span>Require 2FA (OTP) at login</span><br><br><label>Minimum password length<br><input id="cfMinPass" type="number" value="' + (cfg.minPass || 6) + '" style="max-width:100px"></label><br><br><label>Session timeout (minutes, 0 = never)<br><input id="cfSessTo" type="number" value="' + (cfg.sessionTimeout || 0) + '" style="max-width:120px"></label><div style="margin-top:10px"><button class="btn sm" id="cfPolSave">Save policy</button></div><p class="muted" style="margin-top:8px">Encryption at rest, rate limiting and DDoS protection run at the backend / CDN layer.</p></div>' + '<div class="section"><h3>Audit log (' + audit.length + ')</h3><button class="btn sm ghost" id="auClear">Clear log</button><div class="admin-list" style="margin-top:10px">' + (audit.length ? audit.slice(0, 80).map(function (x) { return '<div class="admin-row"><span class="ar-ic">.</span><span><span class="ar-name">' + esc(x.action) + '</span> <span class="ar-cat">' + new Date(x.t).toLocaleString() + '</span></span></div>'; }).join('') : '<p class="muted">No events yet.</p>') + '</div></div>';
      qs('#cfSecSave').onclick = function () { save({ maintenance: qs('#cfMaint').checked, announcement: qs('#cfAnn').value }, 'Site control saved'); logAudit('Site control saved'); applyAnnounce(); applyMaintenance(); };
      qs('#cfPolSave').onclick = function () { save({ require2fa: qs('#cfReq2fa').checked, minPass: parseInt(qs('#cfMinPass').value, 10) || 6, sessionTimeout: parseInt(qs('#cfSessTo').value, 10) || 0 }, 'Policy saved'); logAudit('Security policy saved'); };
      qs('#auClear').onclick = function () { set('audit', []); toast('Audit log cleared'); paint(); };
    } else if (cur === 'api') {
      b.innerHTML = '<div class="section"><h3>API Manager</h3><label>API base URL<br><input id="cfApi" value="' + esc(cfg.apiBase) + '" placeholder="https://api.yourdomain.com"></label><div style="margin-top:10px"><button class="btn sm" id="cfApiSave">Save</button></div></div>' + '<div class="section"><h3>API keys</h3><button class="btn sm" id="akGen">Generate new key</button><div id="akList" style="margin-top:10px"></div></div>' + '<div class="section"><h3>Webhooks</h3><input id="whUrl" placeholder="https://your-endpoint" style="max-width:300px"> <button class="btn sm" id="whAdd">Add webhook</button><div id="whList" style="margin-top:10px"></div></div>' + '<div class="section"><h3>Endpoints</h3><p class="muted">REST: GET /api/v1/tools, GET /api/v1/calc/:id, POST /api/v1/compute. GraphQL: /graphql. Live endpoints require deploying the backend (NestJS). Full spec in docs.html.</p><a class="btn sm ghost" href="docs.html">Open API docs</a></div>';
      qs('#cfApiSave').onclick = function () { save({ apiBase: qs('#cfApi').value }, 'API base saved'); logAudit('API base saved'); };
      function paintAk() { var k = Admin.config().apiKeys || []; qs('#akList').innerHTML = k.length ? k.map(function (x, i) { return '<div class="admin-row"><span class="ar-ic">K</span><span><span class="ar-name" style="font-family:monospace">' + esc(x.key) + '</span> <span class="ar-cat">' + new Date(x.t).toLocaleDateString() + '</span></span><span class="sp"><button class="btn sm ghost" data-copyk="' + esc(x.key) + '">Copy</button> <button class="btn sm ghost" data-delak="' + i + '">Revoke</button></span></div>'; }).join('') : '<p class="muted">No API keys yet.</p>'; qsa('[data-delak]').forEach(function (btn) { btn.onclick = function () { var k = Admin.config().apiKeys || []; k.splice(+btn.getAttribute('data-delak'), 1); save({ apiKeys: k }, 'Key revoked'); paintAk(); }; }); qsa('[data-copyk]').forEach(function (btn) { btn.onclick = function () { try { navigator.clipboard.writeText(btn.getAttribute('data-copyk')); toast('Copied'); } catch (e) { toast(btn.getAttribute('data-copyk')); } }; }); }
      qs('#akGen').onclick = function () { var k = Admin.config().apiKeys || []; var nk = 'cv_' + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2); k.unshift({ key: nk, t: Date.now() }); save({ apiKeys: k }, 'API key generated'); logAudit('API key generated'); paintAk(); };
      function paintWh() { var w = Admin.config().webhooks || []; qs('#whList').innerHTML = w.length ? w.map(function (x, i) { return '<div class="admin-row"><span class="ar-ic">W</span><span class="ar-name">' + esc(x) + '</span><button class="btn sm ghost sp" data-delwh="' + i + '">Delete</button></div>'; }).join('') : '<p class="muted">No webhooks.</p>'; qsa('[data-delwh]').forEach(function (btn) { btn.onclick = function () { var w = Admin.config().webhooks || []; w.splice(+btn.getAttribute('data-delwh'), 1); save({ webhooks: w }, 'Removed'); paintWh(); }; }); }
      qs('#whAdd').onclick = function () { var w = Admin.config().webhooks || []; var u = qs('#whUrl').value.trim(); if (!u) { toast('URL required'); return; } w.push(u); save({ webhooks: w }, 'Webhook added'); qs('#whUrl').value = ''; paintWh(); };
      paintAk(); paintWh();
    } else if (cur === 'i18n') {
      var opts = ''; for (var lk in I18N.langs) { opts += '<option value="' + lk + '"' + (cfg.defaultLang === lk ? ' selected' : '') + '>' + esc(I18N.langs[lk]) + '</option>'; }
      b.innerHTML = '<div class="section"><h3>Translation Manager</h3><label>Default language<br><select id="cfLang">' + opts + '</select></label><div style="margin-top:8px"><label class="switch"><input type="checkbox" id="cfAutoTr"' + (cfg.autoTranslate === false ? '' : ' checked') + '><span class="sl"></span></label> <span>Auto-translate page content on language change</span></div><br><label>Provider<br><select id="trProv"><option value="mymemory">MyMemory (free)</option><option value="google">Google (key)</option><option value="deepl">DeepL (key)</option></select></label><br><br><label>Translation API key (Google / DeepL, via backend)<br><input id="trKey" value="' + esc(cfg.trKey || '') + '"></label><div style="margin-top:10px"><button class="btn sm" id="cfLangSave">Save</button> <button class="btn sm ghost" id="trClear">Clear translation cache</button></div><p class="muted" style="margin-top:8px">' + Object.keys(I18N.langs).length + ' languages with RTL support. Free MyMemory works now; Google / DeepL need a backend proxy.</p></div>';
      var tp = qs('#trProv'); if (tp && cfg.trProvider) tp.value = cfg.trProvider;
      qs('#cfLangSave').onclick = function () { save({ defaultLang: qs('#cfLang').value, autoTranslate: qs('#cfAutoTr').checked, trProvider: qs('#trProv').value, trKey: qs('#trKey').value }, 'Translation settings saved'); logAudit('Translation settings saved'); };
      qs('#trClear').onclick = function () { try { var rm = []; for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (k && k.indexOf(PFX + 'tr:') === 0) rm.push(k); } rm.forEach(function (k) { localStorage.removeItem(k); }); } catch (e) {} toast('Translation cache cleared'); };
    } else if (cur === 'ai') {
      b.innerHTML = '<div class="section"><h3>AI Manager</h3><label class="switch"><input type="checkbox" id="cfAiOn"' + (cfg.features.ai ? ' checked' : '') + '><span class="sl"></span></label> <span>Enable AI assistant module</span></div>' + '<div class="section"><h3>LLM connection (optional)</h3><p class="muted">The offline assistant works without this. Add a key to enable real generation via your backend proxy.</p><label>Provider<br><select id="aiProv"><option value="openai">OpenAI</option><option value="gemini">Gemini</option><option value="anthropic">Anthropic</option><option value="custom">Custom</option></select></label><br><br><label>API base URL<br><input id="aiBase" value="' + esc(cfg.aiBase || '') + '" placeholder="https://your-proxy/v1"></label><br><br><label>API key (stored locally)<br><input id="aiKey" value="' + esc(cfg.aiKey || '') + '" placeholder="sk-..."></label><br><br><label>Model<br><input id="aiModel" value="' + esc(cfg.aiModel || '') + '" placeholder="gpt-4o-mini"></label><div style="margin-top:10px"><button class="btn sm" id="aiSave">Save</button></div></div>' + '<div class="section"><h3>Content generator (works offline)</h3><p class="muted">Generate an SEO article + FAQ from a topic using built-in templates.</p><input id="aiTopic" placeholder="e.g. Home Loan EMI"> <button class="btn sm" id="aiGen">Generate</button> <button class="btn sm ghost" id="aiToBlog">Save as blog post</button><div id="aiOut" class="calc-res" style="margin-top:10px"></div></div>';
      var ap = qs('#aiProv'); if (ap && cfg.aiProv) ap.value = cfg.aiProv;
      qs('#aiSave').onclick = function () { var f = cfg.features; f.ai = qs('#cfAiOn').checked; save({ features: f, aiProv: qs('#aiProv').value, aiBase: qs('#aiBase').value, aiKey: qs('#aiKey').value, aiModel: qs('#aiModel').value }, 'AI settings saved'); logAudit('AI settings saved'); };
      qs('#aiGen').onclick = function () { var r = genArticle(qs('#aiTopic').value); window.__aiDraft = r; qs('#aiOut').innerHTML = '<h3>' + esc(r.title) + '</h3><p>' + esc(r.body) + '</p><h4>FAQ</h4>' + r.faq.map(function (f) { return '<p><b>' + esc(f.q) + '</b><br>' + esc(f.a) + '</p>'; }).join(''); };
      qs('#aiToBlog').onclick = function () { var r = window.__aiDraft; if (!r) { toast('Generate first'); return; } var p = { id: 'p' + Date.now(), title: r.title, cat: 'Guides', author: Admin.config().defaultAuthor || 'allfreecalculators.in', body: r.body, t: Date.now() }; var local = get('posts', []); local.unshift(p); set('posts', local.slice(0, 100)); var FB = window.CalcVerseFirebase; if (FB && FB.enabled && FB.savePost) FB.savePost(p); toast('Saved as blog post'); };
    } else if (cur === 'blog') {
      var posts = get('posts', []); var cats = cfg.blogCats || ['Finance', 'Health', 'Investment', 'Math', 'Guides'];
      b.innerHTML = '<div class="section"><h3>Blog / CMS Manager</h3><label class="switch"><input type="checkbox" id="cfBlogOn"' + (cfg.features.blog ? ' checked' : '') + '><span class="sl"></span></label> <span>Enable blog module</span><div style="margin-top:8px"><button class="btn sm" id="cfBlogSave">Save</button> <a class="btn sm ghost" href="blog.html">Open blog editor</a></div></div>' + '<div class="section"><h3>' + posts.length + ' posts</h3>' + (posts.length ? posts.slice(0, 50).map(function (p) { return '<div class="admin-row"><span class="ar-ic">B</span><span><span class="ar-name">' + esc(p.title) + '</span> <span class="ar-cat">' + esc(p.cat || 'General') + ' / ' + esc(p.author || '') + '</span></span><button class="btn sm ghost sp" data-delbp="' + esc(p.id) + '">Delete</button></div>'; }).join('') : '<p class="muted">No posts yet. Create them on the blog page.</p>') + '</div>' + '<div class="section"><h3>Categories</h3><input id="bcName" placeholder="New category" style="max-width:200px"> <button class="btn sm" id="bcAdd">Add</button><div id="bcList" style="margin-top:10px"></div></div>' + '<div class="section"><h3>Default author</h3><input id="bAuthor" value="' + esc(cfg.defaultAuthor || 'allfreecalculators.in') + '" style="max-width:240px"> <button class="btn sm" id="bAuthorSave">Save</button></div>';
      qs('#cfBlogSave').onclick = function () { var f = cfg.features; f.blog = qs('#cfBlogOn').checked; save({ features: f }, 'Blog settings saved'); logAudit('Blog settings saved'); };
      qsa('[data-delbp]').forEach(function (btn) { btn.onclick = function () { var id = btn.getAttribute('data-delbp'); set('posts', get('posts', []).filter(function (x) { return x.id !== id; })); var FB = window.CalcVerseFirebase; if (FB && FB.enabled && FB.deletePost) FB.deletePost(id); toast('Post deleted'); paint(); }; });
      function paintBc() { var c = Admin.config().blogCats || cats; qs('#bcList').innerHTML = c.map(function (x, i) { return '<span class="badge" style="margin:2px;cursor:pointer" data-delbc="' + i + '">' + esc(x) + ' x</span>'; }).join(''); qsa('[data-delbc]').forEach(function (s) { s.onclick = function () { var c = Admin.config().blogCats || cats; c.splice(+s.getAttribute('data-delbc'), 1); save({ blogCats: c }, 'Removed'); paintBc(); }; }); }
      qs('#bcAdd').onclick = function () { var c = Admin.config().blogCats || cats.slice(); var n = qs('#bcName').value.trim(); if (!n) { toast('Name required'); return; } c.push(n); save({ blogCats: c }, 'Category added'); qs('#bcName').value = ''; paintBc(); };
      qs('#bAuthorSave').onclick = function () { save({ defaultAuthor: qs('#bAuthor').value.trim() || 'allfreecalculators.in' }, 'Default author saved'); };
      paintBc();
    } else {
      var pageList = ['index.html', 'about.html', 'pricing.html', 'blog.html', 'contact.html', 'builder.html', 'compare.html', 'docs.html', 'privacy.html', 'terms.html'];
      var pageOpts = pageList.map(function (f) { return '<option value="' + f + '">' + f + '</option>'; }).join('');
      b.innerHTML = '<div class="section"><h3>SEO Manager</h3><p class="muted">Per-page meta, canonical, Open Graph, Twitter and JSON-LD are generated at build time. Override any page title / description / keywords below (saved locally, applied on every visit).</p><label>Brand name<br><input id="cfBrand" value="' + esc(st.brand) + '"></label><br><br><label>Tagline<br><input id="cfTag" value="' + esc(st.tagline) + '"></label><div style="margin-top:10px"><button class="btn sm" id="cfSeoSave">Save brand</button></div></div>' + '<div class="section"><h3>Per-page meta override</h3><label>Page<br><select id="ovPage">' + pageOpts + '</select></label><br><br><label>Title<br><input id="ovTitle"></label><br><br><label>Description<br><textarea id="ovDesc"></textarea></label><br><label>Keywords<br><input id="ovKw"></label><div style="margin-top:10px"><button class="btn sm" id="ovSave">Save override</button> <button class="btn sm ghost" id="ovClear">Clear this page</button></div><div id="ovList" style="margin-top:12px"></div></div>' + '<div class="section"><h3>Sitemap and robots</h3><p class="muted">sitemap.xml and robots.txt are auto-generated for all ' + ORDER.length + ' tools + pages. 100k+ programmatic pages need a backend generator (see ARCHITECTURE).</p><a class="btn sm ghost" href="sitemap.xml" target="_blank">View sitemap.xml</a> <a class="btn sm ghost" href="robots.txt" target="_blank">View robots.txt</a></div>';
      qs('#cfSeoSave').onclick = function () { var nb = qs('#cfBrand').value; Admin.saveSettings({ brand: nb, tagline: qs('#cfTag').value, currency: st.currency }); logAudit('SEO brand saved'); toast('Brand saved'); qsa('[data-brand]').forEach(function (n) { n.textContent = nb; }); };
      function paintOv() { var o = seoOverrides(); var keys = Object.keys(o); qs('#ovList').innerHTML = keys.length ? '<b>Active overrides:</b> ' + keys.map(function (k) { return '<span class="badge" style="margin:2px">' + esc(k) + '</span>'; }).join('') : '<span class="muted">No overrides yet.</span>'; }
      function loadOv() { var f = qs('#ovPage').value; var o = seoOverrides()[f] || {}; qs('#ovTitle').value = o.title || ''; qs('#ovDesc').value = o.desc || ''; qs('#ovKw').value = o.keywords || ''; }
      qs('#ovPage').onchange = loadOv;
      qs('#ovSave').onclick = function () { var f = qs('#ovPage').value; var o = seoOverrides(); o[f] = { title: qs('#ovTitle').value, desc: qs('#ovDesc').value, keywords: qs('#ovKw').value }; set('seo:overrides', o); logAudit('SEO override ' + f); toast('Override saved for ' + f); paintOv(); };
      qs('#ovClear').onclick = function () { var f = qs('#ovPage').value; var o = seoOverrides(); delete o[f]; set('seo:overrides', o); toast('Cleared ' + f); loadOv(); paintOv(); };
      loadOv(); paintOv();
    }
  }
  function logAudit(action) { try { var a = get('audit', []); a.unshift({ t: Date.now(), action: action }); set('audit', a.slice(0, 200)); } catch (e) {} }
  function seoOverrides() { return get('seo:overrides', {}); }
  function setMeta(attr, key, val) { var m = document.querySelector('meta[' + attr + '="' + key + '"]'); if (!m) { m = document.createElement('meta'); m.setAttribute(attr, key); document.head.appendChild(m); } m.setAttribute('content', val); }
  function applySeoOverride() { try { var file = (location.pathname.split('/').pop()) || 'index.html'; var ov = seoOverrides()[file]; if (!ov) return; if (ov.title) { document.title = ov.title; setMeta('property', 'og:title', ov.title); setMeta('name', 'twitter:title', ov.title); } if (ov.desc) { setMeta('name', 'description', ov.desc); setMeta('property', 'og:description', ov.desc); setMeta('name', 'twitter:description', ov.desc); } if (ov.keywords) setMeta('name', 'keywords', ov.keywords); } catch (e) {} }
  function applyAds() { try { var cfg = Admin.config(); var slots = qsa('.ad-slot'); if (cfg.adsEnabled === false) { slots.forEach(function (s) { s.style.display = 'none'; }); return; } var aff = cfg.affiliates || []; if (aff.length && slots.length) { slots.forEach(function (s, i) { var a = aff[i % aff.length]; if (a && a.url) { s.innerHTML = '<a href="' + a.url + '" target="_blank" rel="nofollow sponsored noopener" class="aff-block">' + (a.img ? '<img src="' + a.img + '" alt="">' : '') + '<span>' + esc(a.label || 'Sponsored') + '</span></a>'; } }); } } catch (e) {} }
  function genArticle(topic) { topic = (topic || 'this calculator').trim(); var title = 'Complete Guide to the ' + topic; var body = 'The ' + topic + ' helps you compute accurate results instantly. In this guide we explain what it does, the formula behind it, how to use it step by step, and tips to get the most out of it. Why use it? It saves time, removes manual errors and lets you compare scenarios side by side. Enter your values and the result updates live with a chart and a breakdown you can export to PDF, Excel, CSV, JSON or XML. How it works: the tool validates each input, applies the standard formula and renders the output as clear KPIs. Everything runs in your browser, so your data stays private and it works offline. Tips: try different inputs to understand sensitivity, save useful results to your account and bookmark the tool for quick access.'; var faq = [{ q: 'Is the ' + topic + ' free?', a: 'Yes. It is completely free and works on any device.' }, { q: 'Does it work offline?', a: 'Yes, once the page has loaded it runs entirely in your browser.' }, { q: 'Can I export the results?', a: 'Yes, you can export to PDF, Excel, CSV, JSON and XML, or print directly.' }]; return { title: title, body: body, faq: faq }; }

  function onboardingTour() {
    if (get("toured", false)) return; if (!qs("#heroSearch")) return; set("toured", true);
    var steps = ["Welcome to allfreecalculators.in! Search 2900+ calculators from the bar above, or press Ctrl/Cmd-K anywhere.", "Ask the AI assistant to find the right tool or explain a result.", "Tap the star on any tool to save it. Sign up to sync favorites and history across devices.", "Build your own calculator (no code) from the Builder page, and compare tools on the Compare page."];
    var i = 0; var back = el("div", { class: "tour-back" }); var card = el("div", { class: "tour-card" }); back.appendChild(card); document.body.appendChild(back);
    function paint() { card.innerHTML = "<div class=\"tour-msg\">" + esc(steps[i]) + "</div><div class=\"tour-actions\"><span class=\"muted\">" + (i + 1) + "/" + steps.length + "</span><div><button class=\"btn ghost sm\" id=\"tourSkip\">Skip</button> <button class=\"btn sm\" id=\"tourNext\">" + (i < steps.length - 1 ? "Next" : "Got it") + "</button></div></div>"; qs("#tourSkip", card).onclick = function () { back.remove(); }; qs("#tourNext", card).onclick = function () { i++; if (i >= steps.length) back.remove(); else paint(); }; }
    paint();
  }
  function wireCompare() {
    var root = qs("#compareRoot"); if (!root) return; var picks = [];
    root.innerHTML = "<div class=\"section\"><div style=\"display:flex;gap:8px;flex-wrap:wrap\"><input id=\"cmpSearch\" placeholder=\"Search a calculator to add...\" style=\"flex:1;min-width:220px\"><button class=\"btn sm ghost\" id=\"cmpClear\">Clear</button></div><div id=\"cmpSugg\" class=\"cmp-sugg\"></div></div><div class=\"cmp-grid\" id=\"cmpGrid\"></div>";
    function suggest(q) { var box = qs("#cmpSugg"); var res = Search.query(q).slice(0, 8); box.innerHTML = res.map(function (t) { return "<button class=\"chip\" data-add=\"" + t.id + "\">" + t.icon + " " + esc(t.name) + "</button>"; }).join(""); qsa("[data-add]", box).forEach(function (btn) { btn.onclick = function () { var id = btn.getAttribute("data-add"); if (picks.indexOf(id) < 0 && picks.length < 4) picks.push(id); paint(); }; }); }
    function paint() { var g = qs("#cmpGrid"); g.innerHTML = picks.length ? picks.map(function (id) { var t = TOOLS[id]; return "<div class=\"cmp-card\"><div class=\"cmp-h\"><span>" + t.icon + " " + esc(t.name) + "</span><button class=\"x\" data-rm=\"" + id + "\">x</button></div><p class=\"muted\">" + esc((t.desc || "").split(".")[0]) + ".</p><a class=\"btn sm block\" href=\"" + t.slug + ".html\">Open</a></div>"; }).join("") : "<p class=\"muted\">Add 2-4 calculators above to compare them side by side.</p>"; qsa("[data-rm]", g).forEach(function (btn) { btn.onclick = function () { picks = picks.filter(function (x) { return x !== btn.getAttribute("data-rm"); }); paint(); }; }); }
    qs("#cmpSearch").addEventListener("input", function () { suggest(this.value); }); qs("#cmpClear").onclick = function () { picks = []; paint(); }; suggest(""); paint();
  }

  /* ============================================================
     HOMEPAGE rendering
     ============================================================ */
  function tileHTML(id) { var t = TOOLS[id]; if (!t) return ''; var on = favs()[id] ? ' on' : ''; return '<a class="tile reveal" href="' + t.slug + '.html"><span class="fav' + on + '" data-fav="' + id + '">\u2605</span><div class="ic">' + t.icon + '</div><h3>' + esc(t.name) + '</h3><p>' + esc((t.desc || '').split('.')[0]) + '.</p></a>'; }
  function fillGrid(sel, ids) { var g = qs(sel); if (!g) return; g.innerHTML = ids.map(tileHTML).join(''); }
  function renderHome() {
    var pop = ['emi', 'sip', 'bmi', 'percentage', 'age', 'loan', 'tax', 'gst'].filter(function (id) { return TOOLS[id]; });
    while (pop.length < 8 && ORDER.length) { var c = ORDER[pop.length * 7 % ORDER.length]; if (pop.indexOf(c) < 0) pop.push(c); else break; }
    fillGrid('#popularGrid', pop.slice(0, 8));
    var seed = new Date().getDate(); var trend = []; for (var i = 0; i < 8 && i < ORDER.length; i++) trend.push(ORDER[(seed * 13 + i * 97) % ORDER.length]);
    fillGrid('#trendingGrid', trend);
    var recent = get('recent', []).filter(function (id) { return TOOLS[id]; });
    var rs = qs('#recentSec'); if (rs) { if (recent.length) { rs.style.display = ''; fillGrid('#recentGrid', recent.slice(0, 8)); } else rs.style.display = 'none'; }
    var cg = qs('#catGrid');
    if (cg) { var map = {}; ORDER.forEach(function (id) { var c = TOOLS[id].cat; (map[c] = map[c] || []).push(id); }); cg.innerHTML = Object.keys(CATS).filter(function (c) { return map[c]; }).map(function (c) { var ic = (map[c][0] && TOOLS[map[c][0]].icon) || '\uD83E\uDDEE'; return '<a class="cat-card reveal" href="category-' + CATS[c].slug + '.html"><div class="ic">' + ic + '</div><div><div class="nm">' + esc(c) + '</div><div class="ct">' + map[c].length + ' tools</div></div></a>'; }).join(''); }
  }

  /* ============================================================
     REVIEWS / RATINGS / COMMENTS (tool pages)
     ============================================================ */
  function reviewsFor(id) { return get('reviews:' + id, []); }
  function avgRating(id) { var r = reviewsFor(id); if (!r.length) return 0; var s = 0; r.forEach(function (x) { s += x.rating; }); return s / r.length; }
  function starsHTML(n, pick) { var h = ''; for (var i = 1; i <= 5; i++) h += '<span class="' + (i <= Math.round(n) ? 'on' : '') + '"' + (pick ? ' data-star="' + i + '"' : '') + '>\u2605</span>'; return h; }
  function renderReviews(id) {
    var root = qs('#reviewsRoot'); if (!root) return; var list = reviewsFor(id); var u = Auth.current();
    var avg = avgRating(id);
    root.innerHTML = '<div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap"><div class="stars" style="font-size:1.4rem">' + starsHTML(avg) + '</div><b>' + (avg ? avg.toFixed(1) : '\u2014') + '</b><span class="muted">(' + list.length + ' review' + (list.length === 1 ? '' : 's') + ')</span></div>';
    var form = el('div', { class: 'card-block' });
    form.innerHTML = '<div class="ct">Write a review</div><div class="stars rate-pick" id="rvStars" style="font-size:1.5rem">' + starsHTML(0, true) + '</div><textarea id="rvText" placeholder="Share your experience\u2026"></textarea><div style="margin-top:8px"><button class="btn sm" id="rvSubmit">Post review</button></div>';
    root.appendChild(form);
    var picked = 0;
    qsa('#rvStars span', form).forEach(function (s) { s.onclick = function () { picked = +s.getAttribute('data-star'); qsa('#rvStars span', form).forEach(function (z, i) { z.className = i < picked ? 'on' : ''; }); }; });
    qs('#rvSubmit', form).onclick = function () {
      if (!picked) { toast('Pick a star rating'); return; }
      var txt = qs('#rvText', form).value.trim();
      var who = u ? u.name : 'Guest';
      var arr = reviewsFor(id); arr.unshift({ who: who, rating: picked, text: txt, t: Date.now() }); set('reviews:' + id, arr);
      Analytics.log('review', { id: id }); toast('Thanks for your review!'); renderReviews(id);
    };
    var listWrap = el('div'); list.forEach(function (r) {
      var d = el('div', { class: 'review' });
      d.innerHTML = '<div class="rh"><span class="who">' + esc(r.who) + '</span><span class="stars">' + starsHTML(r.rating) + '</span><span class="when">' + new Date(r.t).toLocaleDateString() + '</span></div>' + (r.text ? '<div style="margin-top:6px">' + esc(r.text) + '</div>' : '');
      listWrap.appendChild(d);
    });
    root.appendChild(listWrap);
  }

  /* ============================================================
     SHARE
     ============================================================ */
  function wireShare() { qsa('[data-share]').forEach(function (b) { b.onclick = function () { var url = location.href; if (navigator.share) navigator.share({ title: document.title, url: url }).catch(function () {}); else { try { navigator.clipboard.writeText(url); toast('Link copied'); } catch (e) { toast(url); } } }; }); }

  /* ============================================================
     PAGE WIRES (login/signup/account/vishal4747/dashboard/builder/analytics)
     ============================================================ */
  function msg(box, ok, t) { box.className = 'auth-msg ' + (ok ? 'ok' : 'err'); box.textContent = t; }
  function wireLogin() {
    var f = qs('#authLoginForm'); if (!f) return;
    f.onsubmit = function (e) { e.preventDefault(); var r = Auth.login(qs('#liEmail').value, qs('#liPass').value); var m = qs('#liMsg'); if (r.ok) { msg(m, true, 'Welcome back! Redirecting\u2026'); setTimeout(function () { location.href = 'account.html'; }, 600); } else msg(m, false, r.err); };
    qsa('[data-social]').forEach(function (b) { b.onclick = function () { if (b.getAttribute('data-social') !== 'google') return; Auth.social('google'); location.href = 'account.html'; }; });
  }
  function wireSignup() {
    var f = qs('#authSignupForm'); if (!f) return;
    f.onsubmit = function (e) { e.preventDefault(); var r = Auth.signup(qs('#suName').value, qs('#suEmail').value, qs('#suPass').value); var m = qs('#suMsg'); if (r.ok) { msg(m, true, 'Account created! Redirecting\u2026'); setTimeout(function () { location.href = 'account.html'; }, 600); } else msg(m, false, r.err); };
    qsa('[data-social]').forEach(function (b) { b.onclick = function () { if (b.getAttribute('data-social') !== 'google') return; Auth.social('google'); location.href = 'account.html'; }; });
  }
  function wireAccount() {
    var root = qs('#accountRoot'); if (!root) return; var u = Auth.current();
    var FB = window.CalcVerseFirebase; var fbu = FB && FB.user;
    if (!u && !fbu) { root.innerHTML = '<div class="section">Please <a href="login.html">log in</a> or <a href="signup.html">sign up</a> to view your dashboard.</div>'; return; }
    var name = u ? u.name : (fbu.displayName || (fbu.email || 'User').split('@')[0]);
    var email = u ? u.email : (fbu.email || '');
    var provider = u ? (u.provider || 'email') : 'firebase';
    var f = favs(), favIds = Object.keys(f).filter(function (id) { return TOOLS[id]; });
    var hist = get('history', []), recent = get('recent', []).filter(function (id) { return TOOLS[id]; });
    var cols = get('collections', {});
    var notifs = get('notifs', null); if (!notifs) { notifs = [{ t: Date.now(), m: 'Welcome to allfreecalculators.in! Your favorites and history sync across devices when Firebase is on.', read: false }]; set('notifs', notifs); }
    var unread = notifs.filter(function (n) { return !n.read; }).length;
    root.innerHTML =
      '<div class="dash-grid">' +
        '<div class="stat-card"><div class="v">' + favIds.length + '</div><div class="l">Favorites</div></div>' +
        '<div class="stat-card"><div class="v">' + recent.length + '</div><div class="l">Recently used</div></div>' +
        '<div class="stat-card"><div class="v">' + hist.length + '</div><div class="l">Saved calcs</div></div>' +
        '<div class="stat-card"><div class="v">' + Object.keys(cols).length + '</div><div class="l">Collections</div></div>' +
        '<div class="stat-card"><div class="v">' + unread + '</div><div class="l">Unread alerts</div></div>' +
      '</div>' +
      '<div class="section"><h2>Notifications</h2><div id="notifList"></div><div style="margin-top:8px"><button class="btn sm ghost" id="notifRead">Mark all read</button> <button class="btn sm ghost" id="notifClear">Clear</button></div></div>' +
      '<div class="section"><h2>Favorites</h2><div class="tile-grid" id="accFav"></div>' + (favIds.length ? '' : '<p class="muted">No favorites yet - tap the star on any tool.</p>') + '</div>' +
      '<div class="section"><h2>Recently used</h2><div class="tile-grid" id="accRecent"></div>' + (recent.length ? '' : '<p class="muted">Nothing yet.</p>') + '</div>' +
      '<div class="section"><h2>Collections</h2><div style="display:flex;gap:8px;margin-bottom:10px;flex-wrap:wrap"><input id="colName" placeholder="New collection name" style="max-width:240px"><select id="colTool" style="max-width:220px"></select><button class="btn sm" id="colAdd">Save</button></div><div id="colList"></div></div>' +
      '<div class="section"><h2>Profile</h2><label>Display name<br><input id="pfName" value="' + esc(name) + '" style="max-width:280px"></label> <button class="btn sm" id="pfSave">Save</button><p style="margin-top:8px">Email: <b>' + esc(email) + '</b> &middot; Login method: ' + esc(provider) + '</p><button class="btn sm ghost" id="pfReset">Send password reset email</button> <button class="btn sm ghost" id="pfOut">Log out</button></div><div id="acctExtras"></div>';
    qs('#accFav').innerHTML = favIds.map(tileHTML).join('');
    qs('#accRecent').innerHTML = recent.slice(0, 12).map(tileHTML).join('');
    function paintNotifs() { var ns = get('notifs', []); qs('#notifList').innerHTML = ns.length ? ns.map(function (n) { return '<div class="admin-row"><span class="ar-ic">' + (n.read ? '-' : '!') + '</span><span class="ar-name">' + esc(n.m) + '</span><span class="ar-cat sp">' + new Date(n.t).toLocaleDateString() + '</span></div>'; }).join('') : '<p class="muted">No notifications.</p>'; }
    paintNotifs();
    qs('#notifRead').onclick = function () { var ns = get('notifs', []); ns.forEach(function (n) { n.read = true; }); set('notifs', ns); paintNotifs(); toast('Marked read'); };
    qs('#notifClear').onclick = function () { set('notifs', []); paintNotifs(); };
    var sel = qs('#colTool'); var pool = favIds.concat(recent).filter(function (v, i, a) { return a.indexOf(v) === i; }).slice(0, 50);
    sel.innerHTML = '<option value="">(optional) add a tool</option>' + pool.map(function (id) { return '<option value="' + id + '">' + esc(TOOLS[id].name) + '</option>'; }).join('');
    function paintCols() { var c = get('collections', {}); qs('#colList').innerHTML = Object.keys(c).length ? Object.keys(c).map(function (n) { return '<div class="admin-row"><span class="ar-ic">[ ]</span><span class="ar-name">' + esc(n) + '</span><span class="ar-cat">' + c[n].length + ' items</span><button class="btn sm ghost sp" data-delc="' + esc(n) + '">Delete</button></div>'; }).join('') : '<p class="muted">No collections yet.</p>'; qsa('[data-delc]').forEach(function (btn) { btn.onclick = function () { var c = get('collections', {}); delete c[btn.getAttribute('data-delc')]; set('collections', c); paintCols(); }; }); }
    qs('#colAdd').onclick = function () { var n = qs('#colName').value.replace(/^\s+|\s+$/g, ''); if (!n) return; var c = get('collections', {}); c[n] = c[n] || []; var tid = sel.value; if (tid && c[n].indexOf(tid) < 0) c[n].push(tid); set('collections', c); qs('#colName').value = ''; paintCols(); toast('Collection saved'); };
    paintCols();
    qs('#pfSave').onclick = function () { var nn = qs('#pfName').value.replace(/^\s+|\s+$/g, ''); if (!nn) return; Auth.updateName(nn); if (FB && FB.user && FB.updateName) FB.updateName(nn).catch(function () {}); renderAccount(); toast('Profile saved'); };
    qs('#pfReset').onclick = function () { if (FB && FB.enabled && FB.sendPasswordReset && email) { FB.sendPasswordReset(email).then(function () { toast('Reset email sent to ' + email); }).catch(function (e) { toast(e.message || 'Could not send reset email'); }); } else { toast('Password reset needs Firebase - see FIREBASE-SETUP.md to enable it.'); } };
    qs('#pfOut').onclick = function () { if (FB && FB.api && FB.api.logout) { try { FB.api.logout(); } catch (e) {} } Auth.logout(); toast('Logged out'); location.href = 'index.html'; };
    try { renderAccountExtras(name, email, provider); } catch (e) {}
  }

  function renderAccountExtras(uName, uEmail, uProvider) {
    var box = qs('#acctExtras'); if (!box) return;
    var P = get('prefs', {});
    function gv(k, d) { return (P[k] === undefined ? d : P[k]); }
    function rrow(c) { return '<div class="ax-row">' + c + '</div>'; }
    function chk(k, label, d) { return rrow('<label class="switch"><input type="checkbox" data-pref="' + k + '"' + (gv(k, d) ? ' checked' : '') + '><span class="sl"></span></label> <span class="ax-l">' + label + '</span>'); }
    function sel(k, label, opts, d) { var o = opts.map(function (x) { return '<option value="' + x[0] + '"' + (String(gv(k, d)) === String(x[0]) ? ' selected' : '') + '>' + x[1] + '</option>'; }).join(''); return rrow('<span class="ax-l">' + label + '</span><select data-pref="' + k + '" class="ax-c">' + o + '</select>'); }
    function num(k, label, d, mn, mx) { return rrow('<span class="ax-l">' + label + '</span><input type="number" data-pref="' + k + '" value="' + esc(String(gv(k, d))) + '"' + (mn != null ? ' min="' + mn + '"' : '') + (mx != null ? ' max="' + mx + '"' : '') + ' class="ax-c" style="max-width:90px">'); }
    function txt(k, label, d, ph) { return rrow('<span class="ax-l">' + label + '</span><input type="text" data-pref="' + k + '" value="' + esc(String(gv(k, d))) + '" placeholder="' + (ph || '') + '" class="ax-c">'); }
    var cfg = {}; try { cfg = Admin.config().cashfree || {}; } catch (e) {}
    var payLink = cfg.paymentLink || (window.CALCVERSE_SITE && window.CALCVERSE_SITE.proPaymentLink) || '';
    var proPrice = cfg.proPrice || 'to Pro';
    var html = '';
    html += '<div class="section ax-pro"><h2>\uD83D\uDC8E Upgrade to Pro</h2><p class="muted">Remove ads, unlock premium tools, cloud sync and priority support.</p><div><button class="btn" id="axPro">' + (payLink ? ('Upgrade ' + esc(proPrice) + ' \u2192') : 'Upgrade (coming soon)') + '</button></div></div>';
    html += '<div class="section"><h2>\u2699\uFE0F Display & calculation</h2><div class="ax-grid">' + sel('theme', 'Theme', [['auto', 'Auto'], ['light', 'Light'], ['dark', 'Dark']], 'auto') + sel('accent', 'Accent color', [['orange', 'Orange'], ['blue', 'Blue'], ['green', 'Green'], ['purple', 'Purple'], ['pink', 'Pink']], 'orange') + sel('lang', 'Language', [['en', 'English'], ['hi', '\u0939\u093F\u0928\u094D\u0926\u0940']], 'en') + txt('currency', 'Default currency', 'INR', 'INR') + sel('numfmt', 'Number format', [['in', 'Indian (1,00,000)'], ['intl', 'International (100,000)']], 'in') + num('precision', 'Decimal precision', 2, 0, 8) + chk('thousands', 'Thousands separator', true) + sel('units', 'Unit system', [['metric', 'Metric'], ['imperial', 'Imperial']], 'metric') + chk('liveCalc', 'Live auto-calculate', true) + chk('showSteps', 'Show step-by-step', true) + chk('showFormula', 'Show formula used', true) + chk('showCharts', 'Show charts & graphs', true) + chk('sciNotation', 'Scientific notation', false) + sel('rounding', 'Rounding mode', [['nearest', 'Nearest'], ['up', 'Up'], ['down', 'Down']], 'nearest') + sel('dateFmt', 'Date format', [['dmy', 'DD/MM/YYYY'], ['mdy', 'MM/DD/YYYY'], ['ymd', 'YYYY-MM-DD']], 'dmy') + sel('timeFmt', 'Time format', [['24', '24-hour'], ['12', '12-hour']], '24') + sel('weekStart', 'Week starts on', [['mon', 'Monday'], ['sun', 'Sunday']], 'mon') + txt('timezone', 'Timezone', 'Asia/Kolkata', 'Asia/Kolkata') + '</div></div>';
    html += '<div class="section"><h2>\uD83D\uDD14 Notifications & privacy</h2><div class="ax-grid">' + chk('emailDigest', 'Monthly email digest', false) + chk('weeklyReport', 'Weekly usage report', false) + chk('productAlerts', 'Product update alerts', true) + chk('tips', 'Tips & tricks', true) + chk('soundOnResult', 'Sound on result', false) + chk('haptics', 'Haptic feedback', false) + chk('saveHistory', 'Save calculation history', true) + num('historyLimit', 'History limit', 50, 5, 500) + chk('analyticsOptOut', 'Opt out of analytics', false) + chk('betaFeatures', 'Enable beta features', false) + '</div></div>';
    html += '<div class="section"><h2>\u267F Accessibility</h2><div class="ax-grid">' + chk('largeText', 'Large text', false) + chk('highContrast', 'High contrast', false) + chk('reducedMotion', 'Reduced motion', false) + chk('dyslexiaFont', 'Dyslexia-friendly font', false) + chk('keyboardShortcuts', 'Keyboard shortcuts', true) + chk('confirmReset', 'Confirm before reset', true) + sel('fontScale', 'Font size', [['s', 'Small'], ['m', 'Medium'], ['l', 'Large'], ['xl', 'X-Large']], 'm') + '</div></div>';
    html += '<div class="section"><h2>\uD83D\uDCDD Personal notes & goal</h2><label>Daily goal (calculations)<br><input type="number" data-pref="dailyGoal" value="' + esc(String(gv('dailyGoal', 5))) + '" min="0" style="max-width:120px"></label><br><br><label>Notes<br><textarea id="axNotes" rows="4" placeholder="Your private notes\u2026" style="width:100%;box-sizing:border-box">' + esc(gv('notes', '')) + '</textarea></label><div style="margin-top:8px"><button class="btn sm" id="axNotesSave">Save notes</button></div></div>';
    html += '<div class="section"><h2>\uD83D\uDCE6 Data & account</h2><div class="ax-grid">' + sel('exportFmt', 'Default export format', [['pdf', 'PDF'], ['csv', 'CSV'], ['json', 'JSON']], 'pdf') + '</div><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px"><button class="btn sm ghost" id="axExport">\u2B07 Export my data</button><label class="btn sm ghost" style="cursor:pointer">\u2B06 Import data<input type="file" id="axImport" accept="application/json" style="display:none"></label><button class="btn sm ghost" id="axClearHist">Clear history</button><button class="btn sm ghost" id="axClearFav">Clear favorites</button><button class="btn sm ghost" id="axResetPrefs">Reset preferences</button></div><div class="section" style="margin-top:12px"><h3>\uD83D\uDD11 Personal API token</h3><div class="admin-row"><span class="ar-name" id="axTok" style="font-family:monospace">' + esc(gv('apiToken', '(none)')) + '</span><span class="sp"><button class="btn sm ghost" id="axTokGen">Generate</button> <button class="btn sm ghost" id="axTokCopy">Copy</button></span></div></div><div class="section"><h3>\uD83C\uDF81 Referral link</h3><div class="admin-row"><span class="ar-name" id="axRef" style="font-family:monospace">' + esc('https://allfreecalculators.in/?ref=' + (gv('apiToken', '') || 'yourcode')) + '</span><button class="btn sm ghost sp" id="axRefCopy">Copy</button></div></div></div>';
    html += '<div class="section"><h2>\uD83E\uDDEE Calculator behavior</h2><div class="ax-grid">' + chk('autoFocus', 'Auto-focus first field', true) + chk('enterToCalc', 'Press Enter to calculate', true) + chk('copyResult', 'One-tap copy result', true) + chk('keepInputs', 'Remember last inputs', true) + chk('decimalKeypad', 'Decimal keypad on mobile', true) + chk('vibrateError', 'Vibrate on error', false) + chk('autoSaveDrafts', 'Auto-save drafts', true) + chk('quickClear', 'Quick-clear button', true) + '</div></div>';
    html += '<div class="section"><h2>\uD83D\uDD17 Sharing & social</h2><div class="ax-grid">' + chk('shareBtns', 'Show share buttons', true) + chk('qrResults', 'QR code for results', false) + chk('embedCode', 'Show embed code', false) + chk('copyLink', 'Copy shareable link', true) + sel('shareDefault', 'Default share app', [['whatsapp', 'WhatsApp'], ['telegram', 'Telegram'], ['x', 'X'], ['copy', 'Copy link']], 'whatsapp') + '</div></div>';
    html += '<div class="section"><h2>\u2601\uFE0F Sync & backup</h2><div class="ax-grid">' + chk('cloudSync', 'Cloud sync', false) + chk('autoBackup', 'Auto-backup', false) + sel('backupFreq', 'Backup frequency', [['daily', 'Daily'], ['weekly', 'Weekly'], ['monthly', 'Monthly']], 'weekly') + chk('syncFavorites', 'Sync favorites', true) + chk('syncHistory', 'Sync history', true) + chk('syncPrefs', 'Sync preferences', true) + '</div></div>';
    html += '<div class="section"><h2>\uD83D\uDD10 Security & login</h2><div class="ax-grid">' + chk('twoFactor', 'Two-factor auth', false) + chk('loginAlerts', 'Login alerts', true) + num('autoLogoutMin', 'Auto-logout (min)', 30, 0, 720) + chk('hideEmailPub', 'Hide email publicly', true) + chk('trustedDevices', 'Remember trusted devices', true) + chk('biometric', 'Biometric unlock', false) + '</div></div>';
    html += '<div class="section"><h2>\uD83D\uDE80 Productivity</h2><div class="ax-grid">' + sel('startPage', 'Start page', [['home', 'Home'], ['dashboard', 'Dashboard'], ['favorites', 'Favorites'], ['last', 'Last used']], 'home') + sel('defaultCategory', 'Default category', [['financial', 'Financial'], ['math', 'Math'], ['health', 'Health'], ['conversions', 'Conversions']], 'financial') + chk('compactMode', 'Compact mode', false) + chk('pinnedTools', 'Pinned tools bar', true) + chk('shortcutsHelp', 'Show shortcuts help', true) + chk('autoComplete', 'Smart autocomplete', true) + '</div></div>';
    html += '<div class="section"><h2>\uD83E\uDDEA Labs (experimental)</h2><div class="ax-grid">' + chk('aiAssistant', 'AI assistant', false) + chk('voiceInput', 'Voice input', false) + chk('betaCalculators', 'Beta calculators', false) + chk('experimentalUI', 'Experimental UI', false) + chk('offlineMode', 'Full offline mode', true) + chk('widgets', 'Home-screen widgets', false) + '</div></div>';
    box.innerHTML = html; box.className = 'ax-wrap';
    function persist() { set('prefs', P); }
    qsa('[data-pref]', box).forEach(function (inp) { var ev = (inp.type === 'checkbox' || inp.tagName === 'SELECT') ? 'change' : 'input'; inp.addEventListener(ev, function () { var k = inp.getAttribute('data-pref'); var val = inp.type === 'checkbox' ? inp.checked : (inp.type === 'number' ? (parseFloat(inp.value) || 0) : inp.value); P[k] = val; persist(); if (k === 'theme') { try { localStorage.setItem(PFX + 'theme', JSON.stringify(val)); var d = val === 'auto' ? (window.matchMedia && matchMedia('(prefers-color-scheme:dark)').matches) : val === 'dark'; document.documentElement.setAttribute('data-theme', d ? 'dark' : 'light'); } catch (e) {} } if (k === 'lang') { var ls = qs('#langSel'); if (ls) { ls.value = val; if (ls.onchange) ls.onchange(); } } toast('Saved'); }); });
    qs('#axPro').onclick = function () { if (payLink) { window.open(payLink, '_blank', 'noopener'); } else { toast('Payments coming soon \u2014 add a Cashfree link in Admin \u2192 Settings.'); } };
    qs('#axNotesSave').onclick = function () { P.notes = qs('#axNotes').value; persist(); toast('Notes saved'); };
    qs('#axExport').onclick = function () { var data = {}; try { for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (k && k.indexOf(PFX) === 0) data[k] = localStorage.getItem(k); } } catch (e) {} var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }); var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'calculatorfc-data.json'; a.click(); toast('Exported'); };
    qs('#axImport').onchange = function () { var f = this.files && this.files[0]; if (!f) return; var r = new FileReader(); r.onload = function () { try { var d = JSON.parse(r.result); Object.keys(d).forEach(function (k) { if (k.indexOf(PFX) === 0) localStorage.setItem(k, d[k]); }); toast('Imported \u2014 reloading'); setTimeout(function () { location.reload(); }, 800); } catch (e) { toast('Invalid file'); } }; r.readAsText(f); };
    qs('#axClearHist').onclick = function () { if (!gv('confirmReset', true) || confirm('Clear history?')) { set('history', []); set('recent', []); toast('History cleared'); } };
    qs('#axClearFav').onclick = function () { if (!gv('confirmReset', true) || confirm('Clear favorites?')) { set('favs', {}); toast('Favorites cleared'); } };
    qs('#axResetPrefs').onclick = function () { if (confirm('Reset all preferences?')) { P = {}; persist(); renderAccountExtras(uName, uEmail, uProvider); toast('Preferences reset'); } };
    qs('#axTokGen').onclick = function () { P.apiToken = 'cfc_' + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2); persist(); qs('#axTok').textContent = P.apiToken; qs('#axRef').textContent = 'https://allfreecalculators.in/?ref=' + P.apiToken; toast('Token generated'); };
    qs('#axTokCopy').onclick = function () { try { navigator.clipboard.writeText(gv('apiToken', '')); toast('Copied'); } catch (e) {} };
    qs('#axRefCopy').onclick = function () { try { navigator.clipboard.writeText(qs('#axRef').textContent); toast('Copied'); } catch (e) {} };
  }

  function renderAdminControls(b) {
    var C = (Admin.config().controls) || {};
    function gv(k, d) { return (C[k] === undefined ? d : C[k]); }
    function rrow(c) { return '<div class="ax-row">' + c + '</div>'; }
    function chk(k, label, d) { return rrow('<label class="switch"><input type="checkbox" data-ac="' + k + '"' + (gv(k, d) ? ' checked' : '') + '><span class="sl"></span></label> <span class="ax-l">' + label + '</span>'); }
    function sel(k, label, opts, d) { var o = opts.map(function (x) { return '<option value="' + x[0] + '"' + (String(gv(k, d)) === String(x[0]) ? ' selected' : '') + '>' + x[1] + '</option>'; }).join(''); return rrow('<span class="ax-l">' + label + '</span><select data-ac="' + k + '" class="ax-c">' + o + '</select>'); }
    function num(k, label, d, mn, mx) { return rrow('<span class="ax-l">' + label + '</span><input type="number" data-ac="' + k + '" value="' + esc(String(gv(k, d))) + '"' + (mn != null ? ' min="' + mn + '"' : '') + (mx != null ? ' max="' + mx + '"' : '') + ' class="ax-c" style="max-width:90px">'); }
    function grp(title, body) { return '<div class="section"><h3>' + title + '</h3><div class="ax-grid">' + body + '</div></div>'; }
    var html = '<p class="muted">Master switches for performance, SEO, AI, content, UX, security, privacy, monetization and localization. Saved instantly for this site.</p>';
    html += grp('\u26A1 Performance & loading', chk('lazyImages', 'Lazy-load images', true) + chk('deferScripts', 'Defer scripts', true) + chk('cacheStatic', 'Cache static assets', true) + chk('serviceWorker', 'Service worker (offline)', true) + chk('prefetchLinks', 'Prefetch links on hover', true) + chk('preconnectCDN', 'Preconnect to CDNs', true) + chk('inlineCriticalCSS', 'Inline critical CSS', true) + chk('minifyOutput', 'Minify HTML output', true) + chk('compressAssets', 'Compress assets (gzip)', true) + chk('fontSwap', 'Font-display: swap', true));
    html += grp('\uD83D\uDD0D SEO', chk('autoMeta', 'Auto meta tags', true) + chk('canonical', 'Canonical tags', true) + chk('openGraph', 'Open Graph tags', true) + chk('twitterCards', 'Twitter cards', true) + chk('jsonLd', 'JSON-LD schema', true) + chk('breadcrumbSchema', 'Breadcrumb schema', true) + chk('faqSchema', 'FAQ schema', true) + chk('sitemapAuto', 'Auto sitemap', true) + chk('robotsIndex', 'Allow indexing', true) + chk('hreflang', 'hreflang tags', true) + chk('autoAlt', 'Auto image alt text', true) + chk('internalLinks', 'Auto internal linking', true));
    html += grp('\uD83E\uDD16 AI-friendly SEO', chk('aiCrawlers', 'Allow AI crawlers', true) + chk('llmsTxt', 'llms.txt file', true) + chk('aiTxt', 'ai.txt policy', true) + chk('aiSummaries', 'AI answer summaries', true) + chk('structuredAnswers', 'Structured Q&A blocks', true) + chk('citationMeta', 'Citation metadata', true));
    html += grp('\uD83D\uDCC4 Content', chk('showRelated', 'Related tools', true) + chk('showFAQ', 'FAQ section', true) + chk('showFormula', 'Formula section', true) + chk('showExamples', 'Examples section', true) + chk('showHowTo', 'How-to section', true) + chk('readingTime', 'Reading time', true) + chk('lastUpdated', 'Last-updated date', true) + chk('authorByline', 'Author byline', false));
    html += grp('\uD83C\uDFA8 UX & navigation', chk('darkToggle', 'Dark-mode toggle', true) + chk('stickyHeader', 'Sticky header', true) + chk('backToTop', 'Back-to-top button', true) + chk('breadcrumbs', 'Breadcrumbs', true) + chk('searchBar', 'Search bar', true) + chk('recentTools', 'Recent tools', true) + chk('favorites', 'Favorites', true) + chk('keyboardShortcuts', 'Keyboard shortcuts', true) + chk('printButton', 'Print button', true) + chk('shareButtons', 'Share buttons', true));
    html += grp('\uD83D\uDD12 Security', chk('forceHttps', 'Force HTTPS', true) + chk('hideEmails', 'Obfuscate emails', true) + chk('rateLimitForms', 'Rate-limit forms', true) + chk('captchaForms', 'CAPTCHA on forms', false) + chk('twoFactorAdmin', '2FA for admin', false) + chk('auditLog', 'Audit log', true) + chk('blockBadBots', 'Block bad bots', true) + num('sessionTimeout', 'Session timeout (min)', 60, 5, 1440));
    html += grp('\uD83D\uDEE1\uFE0F Privacy', chk('cookieConsent', 'Cookie consent banner', true) + chk('anonymizeIp', 'Anonymize IP', true) + chk('doNotTrack', 'Honor Do-Not-Track', true) + chk('gdprMode', 'GDPR mode', true) + num('dataRetention', 'Data retention (days)', 365, 1, 3650));
    html += grp('\uD83D\uDCB0 Monetization', chk('showAds', 'Show ads', true) + sel('adDensity', 'Ad density', [['low', 'Low'], ['medium', 'Medium'], ['high', 'High']], 'medium') + chk('affiliateLinks', 'Affiliate links', false) + chk('premiumTools', 'Premium tools', true) + chk('donateButton', 'Donate button', false) + chk('newsletterPopup', 'Newsletter popup', false));
    html += grp('\uD83D\uDCEC Email & alerts', chk('contactNotify', 'Contact form notify', true) + chk('weeklyReportAdm', 'Weekly report', false) + chk('errorAlerts', 'Error alerts', true) + chk('newUserAlert', 'New-user alert', false) + chk('reviewAlert', 'New-review alert', false));
    html += grp('\uD83C\uDF10 Localization', chk('autoTranslate', 'Auto-translate', true) + chk('rtlSupport', 'RTL support', true) + chk('localCurrency', 'Local currency', true) + chk('localNumberFormat', 'Local number format', true) + chk('multiLanguage', 'Multi-language', true));
    html += grp('\uD83D\uDCCA Analytics & tracking', chk('gaEnabled','Google Analytics',true)+chk('gaAnonymize','Anonymize analytics',true)+chk('heatmaps','Heatmaps',false)+chk('scrollDepth','Scroll-depth tracking',false)+chk('eventTracking','Event tracking',true)+chk('outboundTracking','Outbound link tracking',true)+chk('searchTracking','Site-search tracking',true)+chk('conversionGoals','Conversion goals',false)+chk('realtimeStats','Realtime stats',false)+chk('abTesting','A/B testing',false));
    html += grp('\uD83E\uDDE9 Calculator features', chk('showSteps','Show calculation steps',true)+chk('copyResult2','Copy result button',true)+chk('downloadPdf','Download as PDF',true)+chk('downloadCsv','Export CSV',true)+chk('embedWidget','Embeddable widget',true)+chk('historyPanel','History panel',true)+chk('compareMode','Compare mode',false)+chk('unitSwitcher','Unit switcher',true)+chk('precisionControl','Precision control',true)+sel('roundingMode','Rounding',[['half','Half-up'],['down','Down'],['up','Up']],'half')+chk('graphResults','Graph results',false)+chk('voiceInput2','Voice input',false));
    html += grp('\uD83D\uDCDD Blog & content', chk('blogEnabled','Enable blog',true)+chk('commentsBlog','Blog comments',false)+chk('blogRss','RSS feed',true)+chk('authorPages','Author pages',false)+chk('tagPages','Tag pages',true)+chk('relatedPosts','Related posts',true)+chk('blogSchema','Article schema',true)+chk('draftPreview','Draft preview',true)+chk('scheduledPosts','Scheduled posts',false)+chk('featuredPost','Featured post',true));
    html += grp('\uD83D\uDD14 Notifications & engagement', chk('pushNotify','Push notifications',false)+chk('webPush','Web push',false)+chk('exitIntent','Exit-intent popup',false)+chk('welcomeBanner','Welcome banner',false)+chk('cookieReminder','Cookie reminder',true)+chk('surveyPopup','Survey popup',false)+chk('ratingPrompt','Rating prompt',false)+chk('feedbackWidget','Feedback widget',true));
    html += grp('\uD83C\uDF0D Regional & language', chk('autoGeoLang','Auto language by region',true)+chk('currencyByGeo','Currency by region',true)+sel('dateFormat','Date format',[['dmy','DD/MM/YYYY'],['mdy','MM/DD/YYYY'],['ymd','YYYY-MM-DD']],'dmy')+sel('timeFormat','Time format',[['24','24-hour'],['12','12-hour']],'24')+sel('firstDayWeek','Week starts',[['mon','Monday'],['sun','Sunday']],'mon')+sel('unitSystem','Units',[['metric','Metric'],['imperial','Imperial']],'metric')+chk('numberGrouping','Number grouping',true)+chk('translateUgc','Translate user content',false));
    html += grp('\uD83D\uDED2 Monetization extra', chk('adsTxtAuto','Auto ads.txt',true)+chk('lazyAds','Lazy-load ads',true)+chk('stickyAd','Sticky footer ad',false)+chk('inContentAds','In-content ads',true)+chk('adRefresh','Ad auto-refresh',false)+chk('adBlockerMsg','Ad-blocker message',false)+chk('premiumNoAds','No ads for premium',true)+chk('sponsorSlots','Sponsor slots',false));
    html += grp('\uD83D\uDD10 Advanced security', chk('cspHeader','Content-Security-Policy',true)+chk('hstsHeader','HSTS header',true)+chk('xframeHeader','X-Frame-Options',true)+chk('referrerPolicy','Referrer-Policy',true)+chk('permissionsPolicy','Permissions-Policy',true)+chk('sriHashes','SRI hashes',false)+chk('ipAllowlist','Admin IP allowlist',false)+num('loginAttempts','Max login attempts',5,1,20)+sel('passwordPolicy','Password policy',[['basic','Basic'],['strong','Strong'],['strict','Strict']],'strong')+num('autoLogoutAdmin','Admin auto-logout (min)',30,5,720));
    html += grp('\u2699\uFE0F System & maintenance', chk('maintenanceMode','Maintenance mode',false)+chk('debugMode','Debug mode',false)+chk('errorReporting','Error reporting',true)+chk('autoBackup2','Auto backup',true)+sel('backupFreq2','Backup frequency',[['daily','Daily'],['weekly','Weekly'],['monthly','Monthly']],'weekly')+chk('versionDisplay','Show version',false)+chk('healthCheck','Health-check endpoint',true)+chk('apiAccess','Public API access',false));
    html += grp('\uD83C\uDFAF Performance pro', chk('cdnEnabled','Use CDN',true)+chk('http2Push','HTTP/2 push',false)+chk('brotli','Brotli compression',true)+chk('imageWebp','Serve WebP images',true)+chk('imageLazyNative','Native lazy images',true)+chk('criticalFont','Preload critical font',true)+chk('dnsPrefetch','DNS prefetch',true)+chk('idleCallback','Idle-time scripts',true));
    html += '<div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap"><button class="btn sm" id="acSaveAll">Save all controls</button><button class="btn sm ghost" id="acEnableAll">Enable all</button><button class="btn sm ghost" id="acReset">Reset to defaults</button></div>';
    b.innerHTML = html; b.className = 'ax-wrap';
    function persist() { Admin.saveConfig({ controls: C }); }
    qsa('[data-ac]', b).forEach(function (inp) { var ev = (inp.type === 'checkbox' || inp.tagName === 'SELECT') ? 'change' : 'input'; inp.addEventListener(ev, function () { var k = inp.getAttribute('data-ac'); C[k] = inp.type === 'checkbox' ? inp.checked : (inp.type === 'number' ? (parseFloat(inp.value) || 0) : inp.value); persist(); }); });
    qs('#acSaveAll').onclick = function () { persist(); try { logAudit('Site controls saved'); } catch (e) {} toast('All controls saved'); };
    qs('#acEnableAll').onclick = function () { qsa('[data-ac]', b).forEach(function (inp) { if (inp.type === 'checkbox') { inp.checked = true; C[inp.getAttribute('data-ac')] = true; } }); persist(); toast('All enabled'); };
    qs('#acReset').onclick = function () { if (confirm('Reset all site controls to defaults?')) { C = {}; persist(); renderAdminControls(b); toast('Controls reset'); } };
  }

    function wireAdmin() {
    var root = qs('#adminRoot'); if (!root) return;
    if (!Admin.isIn()) {
      root.innerHTML = '<div class="auth2"><h2 class="a2-title" style="font-size:1.3rem">\uD83D\uDEE1\uFE0F Admin login</h2><p class="a2-sub">Owner access only \u2014 enter your admin password</p><div class="a2-field"><span class="a2-ic">\uD83D\uDD12</span><input type="password" id="admPass" autocomplete="off" placeholder="Admin password"></div><button class="btn block" id="admGo">Enter dashboard</button><div class="auth-msg" id="admMsg"></div><div class="a2-links"><a href="#" id="admForgot">Forgot password? (reset via Gmail)</a><a href="#" id="admCreate">Create / set a new password</a></div></div>';
      qs('#admGo').onclick = function () { if (Admin.login(qs('#admPass').value)) wireAdmin(); else msg(qs('#admMsg'), false, 'Wrong password.'); };
      qs('#admPass').addEventListener('keydown', function (e) { if (e.key === 'Enter') qs('#admGo').click(); });
      qs('#admForgot').onclick = function (e) {
        e.preventDefault();
        var FB = window.CalcVerseFirebase;
        var owner = ((window.CALCVERSE_ADMIN_EMAILS || [])[0]) || '';
        if (FB && FB.enabled && FB.user && FB.isAdmin) {
          var np = prompt('Signed in as admin (' + (FB.user.email || '') + '). Enter a NEW admin-panel password (min 4 chars):', '');
          if (np && np.length >= 4) { Admin.setPass(np); msg(qs('#admMsg'), true, 'Admin password updated.'); }
          else if (np != null) { msg(qs('#admMsg'), false, 'Password too short (min 4 chars).'); }
          return;
        }
        if (FB && FB.enabled && owner && FB.sendPasswordReset) {
          if (confirm('Send a password-reset link to the owner Gmail (' + owner + ')?\nOpen it, sign in with Google here, then set a new admin password.')) {
            FB.sendPasswordReset(owner).then(function () { msg(qs('#admMsg'), true, 'Reset link sent to ' + owner + '. Check Gmail, sign in with Google, then create a new admin password.'); }).catch(function (err) { msg(qs('#admMsg'), false, (err && err.message) || 'Could not send reset email.'); });
          }
          return;
        }
        msg(qs('#admMsg'), false, 'Enable Firebase + Google sign-in to reset via Gmail. Owner: ' + (owner || 'not set') + '.');
      };
      qs('#admCreate').onclick = function (e) {
        e.preventDefault();
        var FB = window.CalcVerseFirebase;
        if (!(FB && FB.enabled && FB.user && FB.isAdmin)) { msg(qs('#admMsg'), false, 'Sign in with your owner Google account first, then create your password.'); return; }
        var np = prompt('Create your own admin-panel password (min 4 chars):', '');
        if (np && np.length >= 4) { Admin.setPass(np); msg(qs('#admMsg'), true, 'Admin password created. Use it next time.'); }
        else if (np != null) { msg(qs('#admMsg'), false, 'Password too short (min 4 chars).'); }
      };
      return;
    }
    var tabs = [['dash', '\uD83D\uDCCA Dashboard'], ['tools', '\uD83E\uDDEE Calculators'], ['pages', '\uD83D\uDCC4 Pages & Policies'], ['users', '\uD83D\uDC65 Users'], ['reviews', 'Reviews'], ['seo', '\uD83D\uDD0D SEO'], ['blog', '\u270D\uFE0F Blog'], ['ai', '\uD83E\uDD16 AI'], ['revenue', '\uD83D\uDCB0 Revenue'], ['ads', '\uD83D\uDCE2 Ads'], ['i18n', '\uD83C\uDF10 Translation'], ['api', '\uD83D\uDD0C API'], ['sec', '\uD83D\uDD12 Security'], ['ctrl', '\uD83C\uDF9B\uFE0F Controls'], ['set', '\u2699\uFE0F Settings']];
    var cur = 'dash';
    var fbOn = window.CalcVerseFirebase && window.CalcVerseFirebase.enabled;
    root.innerHTML = '<div class="badge" id="fbStatus"' + (fbOn ? ' style="margin-bottom:12px"' : ' style="margin-bottom:12px"') + '>' + (fbOn ? 'Firebase: connected (live accounts + database)' : 'Demo mode - accounts stored locally. Configure Firebase (see FIREBASE-SETUP.md) for real cross-device accounts.') + '</div><div class="tabset" id="admTabs"></div><div id="admBody"></div><div style="margin-top:14px"><button class="btn ghost sm" id="admOut">Log out admin</button></div>';
    var tabsEl = qs('#admTabs');
    tabs.forEach(function (t) { var b = el('button', { 'data-t': t[0] }, t[1]); if (t[0] === cur) b.className = 'active'; b.onclick = function () { cur = t[0]; qsa('#admTabs button').forEach(function (x) { x.className = x.getAttribute('data-t') === cur ? 'active' : ''; }); paint(); }; tabsEl.appendChild(b); });
    qs('#admOut').onclick = function () { Admin.logout(); wireAdmin(); };
    function paint() {
      var b = qs('#admBody'); var s = Admin.settings();
      if (cur === 'dash') { var sm = Analytics.summary(); b.innerHTML = '<div class="dash-grid"><div class="stat-card"><div class="v">' + ORDER.length + '</div><div class="l">Total tools</div></div><div class="stat-card"><div class="v">' + Object.keys(CATS).length + '</div><div class="l">Categories</div></div><div class="stat-card"><div class="v">' + sm.users + '</div><div class="l">Users</div></div><div class="stat-card"><div class="v">' + sm.views + '</div><div class="l">Page views</div></div><div class="stat-card"><div class="v">' + sm.calcs + '</div><div class="l">Calculations</div></div><div class="stat-card"><div class="v">' + Object.keys(Admin.disabled()).length + '</div><div class="l">Disabled</div></div></div><div class="section"><h3>Top tools (by local events)</h3>' + (sm.top.length ? sm.top.map(function (x) { return '<div class="admin-row"><span class="ar-ic">' + (TOOLS[x.id] ? TOOLS[x.id].icon : '\uD83E\uDDEE') + '</span><span class="ar-name">' + esc(TOOLS[x.id] ? TOOLS[x.id].name : x.id) + '</span><span class="ar-cat sp">' + x.n + ' events</span></div>'; }).join('') : '<p class="muted">No analytics events yet.</p>') + '</div>'; }
      else if (cur === 'tools') {
        b.innerHTML = '<input class="admin-search" id="admSearch" placeholder="Search tools to enable/disable\u2026"><div style="display:flex;gap:8px;margin-bottom:10px"><button class="btn sm ghost" id="enAll">Enable all</button><button class="btn sm ghost" id="disFil">Disable shown</button></div><div class="admin-list" id="admToolList"></div>';
        function paintTools(q) { var d = Admin.disabled(); var ids = q ? Search.query(q).map(function (t) { return t.id; }) : ORDER.slice(0, 300); qs('#admToolList').innerHTML = ids.map(function (id) { var t = TOOLS[id]; if (!t) return ''; return '<div class="admin-row"><span class="ar-ic">' + t.icon + '</span><span><span class="ar-name">' + esc(t.name) + '</span> <span class="ar-cat">' + esc(t.cat) + '</span></span><label class="switch sp"><input type="checkbox" data-id="' + id + '"' + (d[id] ? '' : ' checked') + '><span class="sl"></span></label></div>'; }).join(''); qsa('#admToolList input').forEach(function (c) { c.onchange = function () { Admin.setDisabled(c.getAttribute('data-id'), !c.checked); }; }); }
        qs('#admSearch').addEventListener('input', function () { paintTools(this.value); });
        qs('#enAll').onclick = function () { set('disabled', {}); paintTools(qs('#admSearch').value); toast('All tools enabled'); };
        qs('#disFil').onclick = function () { qsa('#admToolList input').forEach(function (c) { Admin.setDisabled(c.getAttribute('data-id'), true); c.checked = false; }); toast('Disabled shown tools'); };
        paintTools('');
      }
      else if (cur === 'pages') {
        var keys = ['about', 'privacy', 'terms', 'disclaimer', 'cookies', 'contact'];
        b.innerHTML = '<p class="muted">Edit page content. Changes apply live across the site (stored locally).</p>' + keys.map(function (k) { return '<div class="section policy-edit"><h3 style="text-transform:capitalize">' + k + '</h3><textarea data-pk="' + k + '">' + esc(Admin.policy(k) || '') + '</textarea><div style="margin-top:8px"><button class="btn sm" data-save="' + k + '">Save ' + k + '</button></div></div>'; }).join('');
        qsa('[data-save]').forEach(function (btn) { btn.onclick = function () { var k = btn.getAttribute('data-save'); Admin.savePolicy(k, qs('textarea[data-pk="' + k + '"]').value); toast(k + ' saved'); }; });
      }
      else if (cur === 'users') {
        var FB = window.CalcVerseFirebase;
        function rowLocal(e, x) { return '<div class="admin-row"><span class="ar-ic">' + (x.banned ? 'X' : '-') + '</span><span><span class="ar-name">' + esc(x.name || e) + '</span> <span class="ar-cat">' + esc(e) + ' / ' + esc(x.provider || 'email') + (x.role ? ' / ' + esc(x.role) : '') + (x.banned ? ' / BANNED' : '') + '</span></span><span class="sp"><button class="btn sm ghost" data-role="' + esc(e) + '">' + (x.role === 'admin' ? 'Make user' : 'Make admin') + '</button> <button class="btn sm ghost" data-ban="' + esc(e) + '">' + (x.banned ? 'Unban' : 'Ban') + '</button> <button class="btn sm ghost" data-rm="' + esc(e) + '">Remove</button></span></div>'; }
        function wireLocal() {
          qsa('[data-role]').forEach(function (btn) { btn.onclick = function () { var e = btn.getAttribute('data-role'); var uu = Auth.users(); Auth.setRole(e, (uu[e] && uu[e].role === 'admin') ? 'user' : 'admin'); paint(); }; });
          qsa('[data-ban]').forEach(function (btn) { btn.onclick = function () { var e = btn.getAttribute('data-ban'); var uu = Auth.users(); Auth.setBanned(e, !(uu[e] && uu[e].banned)); paint(); }; });
          qsa('[data-rm]').forEach(function (btn) { btn.onclick = function () { var e = btn.getAttribute('data-rm'); var uu = Auth.users(); delete uu[e]; set('users', uu); paint(); toast('User removed'); }; });
        }
        function renderLocal() { var u = Auth.users(); var keys = Object.keys(u); b.innerHTML = '<div class="section"><h3>' + keys.length + ' registered users (local)</h3>' + (keys.length ? keys.map(function (e) { return rowLocal(e, u[e]); }).join('') : '<p class="muted">No users yet.</p>') + '</div>'; wireLocal(); }
        if (FB && FB.enabled && FB.listUsers) {
          b.innerHTML = '<div class="section"><h3>Cloud users</h3><p class="muted">Loading from Firebase...</p></div>';
          FB.listUsers().then(function (arr) {
            b.innerHTML = '<div class="section"><h3>' + arr.length + ' cloud users</h3>' + (arr.length ? arr.map(function (x) { return '<div class="admin-row"><span class="ar-ic">' + (x.banned ? 'X' : '-') + '</span><span><span class="ar-name">' + esc(x.name || x.email) + '</span> <span class="ar-cat">' + esc(x.email || '') + ' / ' + esc(x.provider || '') + (x.role ? ' / ' + esc(x.role) : '') + '</span></span><span class="sp"><button class="btn sm ghost" data-frole="' + esc(x.uid) + '" data-cur="' + esc(x.role || 'user') + '">' + (x.role === 'admin' ? 'Make user' : 'Make admin') + '</button> <button class="btn sm ghost" data-fban="' + esc(x.uid) + '" data-b="' + (x.banned ? '1' : '') + '">' + (x.banned ? 'Unban' : 'Ban') + '</button></span></div>'; }).join('') : '<p class="muted">No users yet.</p>') + '</div>';
            qsa('[data-frole]').forEach(function (btn) { btn.onclick = function () { FB.setUserRole(btn.getAttribute('data-frole'), btn.getAttribute('data-cur') === 'admin' ? 'user' : 'admin').then(function () { toast('Role updated'); paint(); }); }; });
            qsa('[data-fban]').forEach(function (btn) { btn.onclick = function () { FB.setUserBanned(btn.getAttribute('data-fban'), !btn.getAttribute('data-b')).then(function () { toast('Updated'); paint(); }); }; });
          }).catch(renderLocal);
        } else { renderLocal(); }
      }
      else if (cur === 'reviews') {
        var FB = window.CalcVerseFirebase;
        function stars(n) { return new Array((n || 0) + 1).join('*'); }
        function localReviews() { var out = []; try { for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (k && k.indexOf(PFX + 'reviews:') === 0) { var tid = k.substring((PFX + 'reviews:').length); var arr = JSON.parse(localStorage.getItem(k)) || []; for (var z = 0; z < arr.length; z++) out.push({ tool: tid, idx: z, data: arr[z] }); } } } catch (e) {} return out; }
        function renderLocal() { var rv = localReviews(); b.innerHTML = '<div class="section"><h3>' + rv.length + ' reviews (local)</h3>' + (rv.length ? rv.map(function (r) { return '<div class="admin-row"><span class="ar-ic">' + stars((r.data && r.data.stars) || 0) + '</span><span><span class="ar-name">' + esc(TOOLS[r.tool] ? TOOLS[r.tool].name : r.tool) + '</span> <span class="ar-cat">' + esc(((r.data && (r.data.text || r.data.body)) || '').slice(0, 90)) + '</span></span><button class="btn sm ghost sp" data-delr="' + esc(r.tool) + '|' + r.idx + '">Delete</button></div>'; }).join('') : '<p class="muted">No reviews yet.</p>') + '</div>'; qsa('[data-delr]').forEach(function (btn) { btn.onclick = function () { var p = btn.getAttribute('data-delr').split('|'); var k = PFX + 'reviews:' + p[0]; var arr = JSON.parse(localStorage.getItem(k) || '[]'); arr.splice(+p[1], 1); localStorage.setItem(k, JSON.stringify(arr)); toast('Review deleted'); renderLocal(); }; }); }
        if (FB && FB.enabled && FB.listReviews) { b.innerHTML = '<div class="section"><h3>Reviews</h3><p class="muted">Loading from Firebase...</p></div>'; FB.listReviews().then(function (arr) { b.innerHTML = '<div class="section"><h3>' + arr.length + ' reviews (cloud)</h3>' + (arr.length ? arr.map(function (r) { return '<div class="admin-row"><span class="ar-ic">' + stars((r.data && r.data.stars) || 0) + '</span><span><span class="ar-name">' + esc(TOOLS[r.tool] ? TOOLS[r.tool].name : r.tool) + '</span> <span class="ar-cat">' + esc(((r.data && (r.data.text || r.data.body)) || '').slice(0, 90)) + '</span></span><button class="btn sm ghost sp" data-fdelr="' + esc(r.tool) + '|' + esc(r.id) + '">Delete</button></div>'; }).join('') : '<p class="muted">No reviews yet.</p>') + '</div>'; qsa('[data-fdelr]').forEach(function (btn) { btn.onclick = function () { var p = btn.getAttribute('data-fdelr').split('|'); FB.deleteReview(p[0], p[1]).then(function () { toast('Deleted'); paint(); }); }; }); }).catch(renderLocal); } else { renderLocal(); }
      }
      else if (cur === 'set') { var cfp = (Admin.config().cashfree) || {}; b.innerHTML = '<div class="section"><h3>General</h3><label>Brand name<br><input id="stBrand" value="' + esc(s.brand) + '"></label><br><br><label>Tagline<br><input id="stTag" value="' + esc(s.tagline) + '"></label><br><br><label>Default currency<br><input id="stCur" value="' + esc(s.currency) + '" style="max-width:120px"></label><div style="margin-top:12px"><button class="btn sm" id="stSave">Save settings</button></div></div><div class="section"><h3>Admin password</h3><label>New password<br><input type="password" id="stPass"></label><div style="margin-top:10px"><button class="btn sm" id="stPassBtn">Change password</button></div></div><div class="section"><h3>\uD83D\uDCB3 Payment Gateway \u2014 Cashfree</h3><p class="muted">Accept payments / Pro upgrades via Cashfree. A Cashfree <b>Payment Link</b> works with no backend \u2014 just paste it below.</p><label class="switch"><input type="checkbox" id="cfPayEn"' + (cfp.enabled ? ' checked' : '') + '><span class="sl"></span></label> <b>Enable Cashfree</b><br><br><label>Mode<br><select id="cfPayMode" style="max-width:200px"><option value="sandbox"' + (cfp.mode === 'production' ? '' : ' selected') + '>Sandbox (test)</option><option value="production"' + (cfp.mode === 'production' ? ' selected' : '') + '>Production (live)</option></select></label><br><br><label>Cashfree App ID<br><input id="cfPayApp" value="' + esc(cfp.appId || '') + '" placeholder="CF_APP_ID"></label><br><br><label>Cashfree Secret Key<br><input type="password" id="cfPaySecret" value="' + esc(cfp.secret || '') + '" placeholder="cfsk_..."></label><br><br><label>Payment Link URL (used by the Upgrade button)<br><input id="cfPayLink" value="' + esc(cfp.paymentLink || '') + '" placeholder="https://payments.cashfree.com/forms/..."></label><br><br><label>Pro price label<br><input id="cfPayPrice" value="' + esc(cfp.proPrice || '') + '" placeholder="\u20B9199 / year" style="max-width:220px"></label><div style="margin-top:12px"><button class="btn sm" id="cfPaySave">Save Cashfree settings</button></div></div><div class="section"><h3 style="color:var(--bad)">Danger zone</h3><button class="btn sm ghost" id="stReset">Reset all local data</button></div>'; qs('#stSave').onclick = function () { Admin.saveSettings({ brand: qs('#stBrand').value, tagline: qs('#stTag').value, currency: qs('#stCur').value }); toast('Settings saved'); }; qs('#stPassBtn').onclick = function () { var p = qs('#stPass').value; if (p.length < 4) { toast('Min 4 chars'); return; } Admin.setPass(p); toast('Password changed'); }; qs('#cfPaySave').onclick = function () { Admin.saveConfig({ cashfree: { enabled: qs('#cfPayEn').checked, mode: qs('#cfPayMode').value, appId: qs('#cfPayApp').value.replace(/^\s+|\s+$/g, ''), secret: qs('#cfPaySecret').value.replace(/^\s+|\s+$/g, ''), paymentLink: qs('#cfPayLink').value.replace(/^\s+|\s+$/g, ''), proPrice: qs('#cfPayPrice').value.replace(/^\s+|\s+$/g, '') } }); logAudit('Cashfree settings saved'); toast('Cashfree settings saved'); }; qs('#stReset').onclick = function () { if (confirm('Reset ALL allfreecalculators.in local data (users, admin, reviews, settings)?')) { Object.keys(localStorage).forEach(function (k) { if (k.indexOf(PFX) === 0) localStorage.removeItem(k); }); toast('Reset done'); wireAdmin(); } }; }
      else if (cur === 'ctrl') { renderAdminControls(b); }
      else { renderConfigTab(cur, b, Admin.settings()); }
    }
    paint();
  }

  /* ---------- no-code calculator builder ---------- */
  function wireBuilder() {
    var root = qs('#builderRoot'); if (!root) return;
    var fields = [];
    var FT = [['number', 'Number'], ['text', 'Text'], ['email', 'Email'], ['select', 'Dropdown'], ['radio', 'Radio'], ['checkbox', 'Checkbox'], ['date', 'Date'], ['time', 'Time'], ['range', 'Slider/Range']];
    root.innerHTML = '<div class="builder"><div class="palette section"><div class="ct" style="font-weight:700;margin-bottom:8px">Fields</div><div id="palBtns"></div></div><div><div class="canvas" id="bCanvas"><p class="muted">Add fields from the left. Give each a <b>key</b>, then write a formula using those keys.</p></div><div class="section"><label>Calculator name<br><input id="bName" placeholder="My Custom Calculator"></label><br><br><label>Formula (use field keys, JS math, e.g. <code>a*b/100</code>)<br><input id="bFormula" placeholder="principal*rate*time/100"></label><br><br><label>Result label<br><input id="bResLabel" value="Result"></label><div style="margin-top:12px"><button class="btn" id="bRun">Test</button> <button class="btn ghost" id="bSave">Save calculator</button></div><div id="bOut" class="calc-res"></div></div></div><div class="section"><div class="ct" style="font-weight:700">My calculators</div><div id="bSaved"></div></div></div>';
    var pal = qs('#palBtns'); FT.forEach(function (f) { var btn = el('button', {}, '+ ' + f[1]); btn.onclick = function () { fields.push({ type: f[0], key: 'f' + (fields.length + 1), label: f[1] + ' ' + (fields.length + 1), opts: 'A,B,C' }); paintCanvas(); }; pal.appendChild(btn); });
    function paintCanvas() { var c = qs('#bCanvas'); if (!fields.length) { c.innerHTML = '<p class="muted">Add fields from the left.</p>'; return; } c.innerHTML = ''; fields.forEach(function (f, i) { var d = el('div', { class: 'fld' }); d.innerHTML = '<b>' + esc(f.type) + '</b> <input value="' + esc(f.key) + '" data-k="' + i + '" style="max-width:90px" title="key"> <input value="' + esc(f.label) + '" data-l="' + i + '" title="label">' + ((f.type === 'select' || f.type === 'radio') ? ' <input value="' + esc(f.opts) + '" data-o="' + i + '" title="options (comma)">' : '') + '<span class="x" data-x="' + i + '">\u2715</span>'; c.appendChild(d); }); qsa('[data-k]', c).forEach(function (inp) { inp.onchange = function () { fields[+inp.getAttribute('data-k')].key = inp.value; }; }); qsa('[data-l]', c).forEach(function (inp) { inp.onchange = function () { fields[+inp.getAttribute('data-l')].label = inp.value; }; }); qsa('[data-o]', c).forEach(function (inp) { inp.onchange = function () { fields[+inp.getAttribute('data-o')].opts = inp.value; }; }); qsa('[data-x]', c).forEach(function (s) { s.onclick = function () { fields.splice(+s.getAttribute('data-x'), 1); paintCanvas(); }; }); }
    function evalFormula(formula, vals) { try { var keys = Object.keys(vals); var fn = new Function(keys.join(','), 'with(Math){return (' + formula + ');}'); return fn.apply(null, keys.map(function (k) { return vals[k]; })); } catch (e) { return 'Error: ' + e.message; } }
    function collect() { var v = {}; fields.forEach(function (f) { var n = qs('[data-test="' + f.key + '"]'); var val = n ? n.value : 0; v[f.key] = (f.type === 'number' || f.type === 'range') ? (parseFloat(val) || 0) : val; }); return v; }
    function paintTest() { var out = qs('#bOut'); out.innerHTML = ''; var form = el('div', { class: 'calc-wrap' }); fields.forEach(function (f) { var w = el('div', { class: 'field' }); var inp; if (f.type === 'select' || f.type === 'radio') { inp = el('select', { 'data-test': f.key }); String(f.opts).split(',').forEach(function (o) { inp.appendChild(el('option', { value: o.trim() }, o.trim())); }); } else inp = el('input', { type: f.type === 'range' ? 'range' : (f.type === 'number' ? 'number' : 'text'), 'data-test': f.key, value: f.type === 'number' ? '1' : '' }); w.appendChild(el('label', {}, esc(f.label))); w.appendChild(inp); form.appendChild(w); }); out.appendChild(form); var resBox = el('div', { class: 'kpi' }); out.appendChild(resBox); function run() { var r = evalFormula(qs('#bFormula').value || '0', collect()); resBox.innerHTML = '<div class="lbl">' + esc(qs('#bResLabel').value || 'Result') + '</div><div class="val">' + esc(typeof r === 'number' ? (Math.round(r * 1e6) / 1e6) : r) + '</div>'; } qsa('[data-test]', out).forEach(function (n) { n.addEventListener('input', run); n.addEventListener('change', run); }); run(); }
    qs('#bRun').onclick = paintTest;
    qs('#bSave').onclick = function () { var name = qs('#bName').value.trim(); if (!name) { toast('Name your calculator'); return; } var saved = get('customCalcs', []); saved.unshift({ name: name, fields: fields.slice(), formula: qs('#bFormula').value, resLabel: qs('#bResLabel').value, t: Date.now() }); set('customCalcs', saved.slice(0, 50)); toast('Calculator saved'); paintSaved(); };
    function paintSaved() { var saved = get('customCalcs', []); qs('#bSaved').innerHTML = saved.length ? saved.map(function (c, i) { return '<div class="admin-row"><span class="ar-ic">\uD83E\uDDEE</span><span><span class="ar-name">' + esc(c.name) + '</span> <span class="ar-cat">' + c.fields.length + ' fields</span></span><button class="btn sm ghost sp" data-load="' + i + '">Load</button></div>'; }).join('') : '<p class="muted">No saved calculators yet.</p>'; qsa('[data-load]', qs('#bSaved')).forEach(function (btn) { btn.onclick = function () { var c = get('customCalcs', [])[+btn.getAttribute('data-load')]; fields = c.fields.slice(); qs('#bName').value = c.name; qs('#bFormula').value = c.formula; qs('#bResLabel').value = c.resLabel; paintCanvas(); paintTest(); }; }); }
    paintCanvas(); paintSaved();
  }

  function wireAnalyticsPage() { var root = qs('#analyticsRoot'); if (!root) return; var sm = Analytics.summary(); var days = Object.keys(sm.byDay).sort().slice(-14); var maxd = 1; days.forEach(function (d) { maxd = Math.max(maxd, sm.byDay[d]); }); root.innerHTML = '<div class="dash-grid"><div class="stat-card"><div class="v">' + sm.views + '</div><div class="l">Page views</div></div><div class="stat-card"><div class="v">' + sm.calcs + '</div><div class="l">Calculations</div></div><div class="stat-card"><div class="v">' + sm.users + '</div><div class="l">Users</div></div><div class="stat-card"><div class="v">' + sm.total + '</div><div class="l">Total events</div></div></div>' + '<div class="section"><h3>Activity (last ' + days.length + ' days)</h3><div style="display:flex;align-items:flex-end;gap:6px;height:140px">' + (days.length ? days.map(function (d) { var h = Math.round(sm.byDay[d] / maxd * 130) + 4; return '<div title="' + d + ': ' + sm.byDay[d] + '" style="flex:1;background:var(--grad);border-radius:6px 6px 0 0;height:' + h + 'px"></div>'; }).join('') : '<p class="muted">No data yet \u2014 browse some tools.</p>') + '</div></div>' + '<div class="section"><h3>Top tools</h3>' + (sm.top.length ? sm.top.map(function (x) { return '<div class="admin-row"><span class="ar-ic">' + (TOOLS[x.id] ? TOOLS[x.id].icon : '\uD83E\uDDEE') + '</span><span class="ar-name">' + esc(TOOLS[x.id] ? TOOLS[x.id].name : x.id) + '</span><span class="ar-cat sp">' + x.n + '</span></div>'; }).join('') : '<p class="muted">No data yet.</p>') + '</div>'; }

  function defaultPosts() { return [{ id: 'p1', title: 'How to choose the right loan EMI', cat: 'Finance', author: 'allfreecalculators.in', t: Date.now(), body: 'A practical guide to comparing EMIs, tenures and interest rates so you borrow smart.' }, { id: 'p2', title: 'Understanding BMI and what it really means', cat: 'Health', author: 'allfreecalculators.in', t: Date.now(), body: 'BMI is a starting point - here is how to read it correctly alongside other measures.' }, { id: 'p3', title: 'SIP vs lump sum: which builds more wealth?', cat: 'Investment', author: 'allfreecalculators.in', t: Date.now(), body: 'We compare strategies with real numbers using the SIP and lumpsum calculators.' }]; }
  function wireBlog() {
    var root = qs('#blogRoot'); if (!root) return;
    var isAdmin = Admin.isIn() || (window.CalcVerseFirebase && window.CalcVerseFirebase.isAdmin);
    function render(posts) {
      var adminUI = isAdmin ? '<div class="section"><h3>New post</h3><input id="bpTitle" placeholder="Title"><br><br><input id="bpCat" placeholder="Category" style="max-width:220px"> <input id="bpAuthor" placeholder="Author" style="max-width:220px"><br><br><textarea id="bpBody" placeholder="Write your post..."></textarea><div style="margin-top:8px"><button class="btn sm" id="bpSave">Publish post</button></div></div>' : '';
      root.innerHTML = adminUI + '<div class="tile-grid" id="blogGrid">' + (posts.length ? posts.map(function (p) { return '<div class="tile"><div class="ic">B</div><span class="badge">' + esc(p.cat || 'General') + '</span><h3 style="margin-top:8px">' + esc(p.title) + '</h3><p>' + esc((p.body || '').slice(0, 150)) + '</p><p class="muted" style="font-size:.8rem">By ' + esc(p.author || 'allfreecalculators.in') + '</p>' + (isAdmin ? '<button class="btn sm ghost" data-delp="' + esc(p.id) + '">Delete</button>' : '') + '</div>'; }).join('') : '<p class="muted">No posts yet.</p>') + '</div>';
      if (isAdmin) {
        qs('#bpSave').onclick = function () { var p = { id: 'p' + Date.now(), title: (qs('#bpTitle').value || '').replace(/^\s+|\s+$/g, ''), cat: qs('#bpCat').value || 'General', author: qs('#bpAuthor').value || 'Admin', body: qs('#bpBody').value || '', t: Date.now() }; if (!p.title) { toast('Title required'); return; } var local = get('posts', []); local.unshift(p); set('posts', local.slice(0, 100)); var FB = window.CalcVerseFirebase; if (FB && FB.enabled && FB.savePost) FB.savePost(p); toast('Post published'); load(); };
        qsa('[data-delp]').forEach(function (btn) { btn.onclick = function () { var id = btn.getAttribute('data-delp'); set('posts', get('posts', []).filter(function (x) { return x.id !== id; })); var FB = window.CalcVerseFirebase; if (FB && FB.enabled && FB.deletePost) FB.deletePost(id); load(); }; });
      }
    }
    function load() { var local = get('posts', null); if (!local) { local = defaultPosts(); set('posts', local); } render(local); var FB = window.CalcVerseFirebase; if (FB && FB.enabled && FB.listPosts) { FB.listPosts().then(function (arr) { if (arr && arr.length) { set('posts', arr); render(arr); } }).catch(function () {}); } }
    load();
  }
  function wireContact() {
    var form = qs('#contactForm'); if (!form) return;
    form.onsubmit = function (e) { e.preventDefault(); var d = { name: (qs('#ctName') || {}).value || '', email: (qs('#ctEmail') || {}).value || '', message: (qs('#ctMsg') || {}).value || '' }; if (!d.message) { toast('Write a message first'); return; } function saveLocal(x) { var a = get('contact', []); a.unshift({ t: Date.now(), name: x.name, email: x.email, message: x.message }); set('contact', a.slice(0, 100)); } function done() { var m = qs('#ctMsg2'); if (m) { m.className = 'auth-msg ok'; m.textContent = 'Thanks! Your message has been received.'; } try { form.reset(); } catch (er) {} } var FB = window.CalcVerseFirebase; if (FB && FB.enabled && FB.submitContact) { FB.submitContact(d).then(done).catch(function () { saveLocal(d); done(); }); } else { saveLocal(d); done(); } };
  }
  function applyConsentAds() {
    var cfg = Admin.config(); var consent = get('consent', null); var bar = qs('#cookieBar');
    function loadAds() { if (!cfg.adsenseId || window.__adsLoaded) return; window.__adsLoaded = true; var s = document.createElement('script'); s.async = true; s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + encodeURIComponent(cfg.adsenseId); s.crossOrigin = 'anonymous'; document.head.appendChild(s); try { (window.adsbygoogle = window.adsbygoogle || []).push({ google_ad_client: cfg.adsenseId, enable_page_level_ads: true }); } catch (e) {} }
    if (bar) { var ay = qs('#ckAccept', bar), an = qs('#ckDecline', bar); if (consent === null) { bar.style.display = ''; } if (ay) ay.onclick = function () { set('consent', 'yes'); bar.style.display = 'none'; loadAds(); }; if (an) an.onclick = function () { set('consent', 'no'); bar.style.display = 'none'; }; }
    if (consent === 'yes') loadAds();
  }

  /* ============================================================
     REVEAL ON SCROLL
     ============================================================ */
  function reveal() { if (!('IntersectionObserver' in window)) { qsa('.reveal').forEach(function (n) { n.style.opacity = 1; }); return; } var io = new IntersectionObserver(function (ents) { ents.forEach(function (e) { if (e.isIntersecting) { e.target.style.animationDelay = (Math.random() * 0.15).toFixed(2) + 's'; e.target.classList.add('in'); e.target.style.opacity = ''; io.unobserve(e.target); } }); }, { threshold: 0.08 }); qsa('.reveal').forEach(function (n) { io.observe(n); }); }

  /* ============================================================
     BOOT
     ============================================================ */
  function boot() {
    Theme.apply(); I18N.apply(); renderAccount(); wireLang();
    var tb = qs('#themeBtn'); if (tb) tb.onclick = function () { Theme.cycle(); };
    var sb = qs('#cmdkBtn'); if (sb) sb.onclick = function () { openCmdk(); };
    var hs = qs('#heroSearch'); if (hs) { hs.addEventListener('focus', function () { openCmdk(hs.value); }); hs.addEventListener('input', function () { openCmdk(hs.value); }); }
    try { applyDisabled(); applyPolicy(); applyAnnounce(); applyMaintenance(); applyConsentAds(); wirePWA(); applySeoOverride(); applyAds(); if (window.CalcVerseI18N) { var __ls = qs('#langSel'); if (__ls && __ls.value && __ls.value !== 'en') setTimeout(function () { window.CalcVerseI18N.run(__ls.value); }, 600); } } catch (e) { try { console.error('[boot]', e); } catch (_) {} }
    // brand from settings
    try { var s = Admin.settings(); if (s && s.brand) { qsa('[data-brand]').forEach(function (n) { n.textContent = s.brand; }); } } catch (e) {}
    // favorites delegation
    document.addEventListener('click', function (e) { var f = e.target.closest && e.target.closest('[data-fav]'); if (f) { e.preventDefault(); var on = toggleFav(f.getAttribute('data-fav')); f.classList.toggle('on', on); toast(on ? 'Added to favorites' : 'Removed'); } });
    // page-specific
    try { var aiP = qs('#aiPanel'); if (aiP) wireAI(aiP); } catch (e) {}
    try { if (qs('#popularGrid') || qs('#catGrid')) renderHome(); } catch (e) { try { console.error('[boot] renderHome', e); } catch (_) {} }
    [wireLogin, wireSignup, wireAccount, wireAdmin, wireBuilder, wireAnalyticsPage, wireShare, wireCompare, wireBlog, wireContact].forEach(function (fn) { try { fn(); } catch (e) { try { console.error('[boot]', e); } catch (_) {} } });
    // Fix: when Firebase auth state resolves after a login/signup redirect, re-render the account dashboard so the user's record opens automatically.
    document.addEventListener('calcverse:auth', function () { try { wireAccount(); } catch (e) {} });
    // analytics pageview
    Analytics.log('view', { id: window.__CALC_ID || null, page: location.pathname.split('/').pop() });
    // tool page extras
    if (window.__CALC_ID) { recordRecent(window.__CALC_ID); renderReviews(window.__CALC_ID); var fb = qs('#favToolBtn'); if (fb) { var on0 = !!favs()[window.__CALC_ID]; fb.classList.toggle('on', on0); fb.setAttribute('data-fav', window.__CALC_ID); } Analytics.log('calc', { id: window.__CALC_ID }); }
    onboardingTour();
    reveal();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
  window.CalcVerse = { Theme: Theme, Auth: Auth, Admin: Admin, Analytics: Analytics, openSearch: openCmdk, toast: toast };
})();
