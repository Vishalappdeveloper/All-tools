/* app-extra.js \u2013 user auth (login/signup), account, full admin control panel,
   editable policy content, and per-tool enable/disable. 100% client-side (localStorage).
   NOTE: this is a front-end demo auth/control system. Real multi-user accounts and
   server-enforced control require a backend; here everything lives in the browser. */
(function () {
  'use strict';
  var PFX = 'calcsuite:';
  function get(k, d) { try { var v = localStorage.getItem(PFX + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }
  function set(k, v) { try { localStorage.setItem(PFX + k, JSON.stringify(v)); } catch (e) {} }
  function hash(s) { var h = 5381; s = String(s); for (var i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0; return ('00000000' + h.toString(16)).slice(-8); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function qs(s, r) { return (r || document).querySelector(s); }

  /* ---------- AUTH ---------- */
  var Auth = {
    users: function () { return get('users', {}); },
    session: function () { return get('session', null); },
    current: function () { var e = Auth.session(); var u = Auth.users(); return e && u[e] ? u[e] : null; },
    signup: function (name, email, pass) {
      email = String(email || '').trim().toLowerCase();
      if (!name || !email || !pass) return { ok: false, msg: 'Please fill in all fields.' };
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { ok: false, msg: 'Enter a valid email address.' };
      if (pass.length < 6) return { ok: false, msg: 'Password must be at least 6 characters.' };
      var u = Auth.users(); if (u[email]) return { ok: false, msg: 'An account with this email already exists.' };
      u[email] = { name: name, email: email, pass: hash(pass), created: Date.now() }; set('users', u); set('session', email);
      return { ok: true };
    },
    login: function (email, pass) {
      email = String(email || '').trim().toLowerCase();
      var u = Auth.users(); if (!u[email]) return { ok: false, msg: 'No account found for this email.' };
      if (u[email].pass !== hash(pass)) return { ok: false, msg: 'Incorrect password.' };
      set('session', email); return { ok: true };
    },
    logout: function () { set('session', null); }
  };
  window.CalcAuth = Auth;

  /* ---------- ADMIN settings ---------- */
  var DEFAULT_ADMIN = hash('admin123');
  var Admin = {
    pass: function () { return get('admin:pass', DEFAULT_ADMIN); },
    isLoggedIn: function () { return get('admin:session', false) === true; },
    login: function (p) { if (hash(p) === Admin.pass()) { set('admin:session', true); return true; } return false; },
    logout: function () { set('admin:session', false); },
    setPass: function (p) { set('admin:pass', hash(p)); },
    disabled: function () { return get('disabled', {}); },
    isDisabled: function (id) { return Admin.disabled()[id] === true; },
    setDisabled: function (id, off) { var d = Admin.disabled(); if (off) d[id] = true; else delete d[id]; set('disabled', d); },
    setMany: function (idsArr, off) { var d = Admin.disabled(); idsArr.forEach(function (id) { if (off) d[id] = true; else delete d[id]; }); set('disabled', d); },
    settings: function () { return get('settings', { brand: 'CalcSuite', tagline: 'Free online tools & calculators', currency: 'INR' }); },
    saveSettings: function (s) { set('settings', s); },
    policy: function (key) { return get('policy:' + key, null); },
    savePolicy: function (key, html) { set('policy:' + key, html); }
  };
  window.CalcAdmin = Admin;

  /* ---------- header account UI ---------- */
  function injectHeader() {
    var tools = qs('.top-tools'); if (!tools || qs('#acctArea')) return;
    var span = document.createElement('span'); span.id = 'acctArea'; span.className = 'acct-area';
    var cur = Auth.current();
    if (cur) span.innerHTML = '<a href="account.html" class="acct-link">\uD83D\uDC64 ' + esc(cur.name.split(' ')[0]) + '</a> <a href="#" id="logoutBtn" class="acct-link">Logout</a>';
    else span.innerHTML = '<a href="login.html" class="acct-link">Login</a> <a href="signup.html" class="acct-link signup">Sign up</a>';
    tools.insertBefore(span, tools.firstChild);
    var lo = qs('#logoutBtn'); if (lo) lo.addEventListener('click', function (e) { e.preventDefault(); Auth.logout(); location.reload(); });
  }

  /* ---------- hide disabled tools + block disabled tool pages ---------- */
  function applyDisabled() {
    var d = Admin.disabled();
    var SEO = window.SEO; if (SEO && SEO.TOOLS) {
      var slugToId = {}; Object.keys(SEO.TOOLS).forEach(function (id) { slugToId[SEO.TOOLS[id].slug] = id; });
      Array.prototype.forEach.call(document.querySelectorAll('a.tile-card'), function (a) {
        var m = (a.getAttribute('href') || '').replace('.html', ''); var id = slugToId[m];
        if (id && d[id]) a.style.display = 'none';
      });
    }
    var cid = window.__CALC_ID;
    if (cid && d[cid]) {
      var mount = qs('#calcMount');
      if (mount) mount.innerHTML = '<div class="calc-note" style="padding:24px;text-align:center">\u26A0\uFE0F This tool has been temporarily disabled by the site administrator.</div>';
    }
  }

  /* ---------- policy content override ---------- */
  function applyPolicy() {
    var el = qs('[data-policy]'); if (!el) return;
    var key = el.getAttribute('data-policy');
    var ov = Admin.policy(key);
    if (ov != null && ov !== '') el.innerHTML = ov;
  }

  /* ---------- auth page wiring ---------- */
  function wireLogin() {
    var f = qs('#authLoginForm'); if (!f) return;
    f.addEventListener('submit', function (e) { e.preventDefault(); var r = Auth.login(qs('#liEmail').value, qs('#liPass').value); var m = qs('#liMsg'); if (r.ok) { m.className = 'auth-msg ok'; m.textContent = 'Logged in! Redirecting\u2026'; setTimeout(function () { location.href = 'account.html'; }, 600); } else { m.className = 'auth-msg err'; m.textContent = r.msg; } });
  }
  function wireSignup() {
    var f = qs('#authSignupForm'); if (!f) return;
    f.addEventListener('submit', function (e) { e.preventDefault(); var r = Auth.signup(qs('#suName').value, qs('#suEmail').value, qs('#suPass').value); var m = qs('#suMsg'); if (r.ok) { m.className = 'auth-msg ok'; m.textContent = 'Account created! Redirecting\u2026'; setTimeout(function () { location.href = 'account.html'; }, 600); } else { m.className = 'auth-msg err'; m.textContent = r.msg; } });
  }
  function wireAccount() {
    var root = qs('#accountRoot'); if (!root) return;
    var cur = Auth.current();
    if (!cur) { root.innerHTML = '<div class="auth-card"><p>You are not logged in.</p><p><a class="btn" href="login.html">Login</a> <a class="btn ghost" href="signup.html">Sign up</a></p></div>'; return; }
    var favs = get('favs', []);
    var hist = get('history', []);
    root.innerHTML = '<div class="auth-card">' +
      '<h2>\uD83D\uDC64 ' + esc(cur.name) + '</h2>' +
      '<p class="muted">' + esc(cur.email) + ' \u00B7 member since ' + new Date(cur.created).toLocaleDateString() + '</p>' +
      '<h3>\u2B50 Favorite tools</h3>' + (favs.length ? '<ul>' + favs.map(function (id) { var t = window.SEO && window.SEO.TOOLS[id]; return '<li><a href="' + (t ? t.slug : id) + '.html">' + esc(t ? t.name : id) + '</a></li>'; }).join('') + '</ul>' : '<p class="muted">No favorites yet. Open any tool and tap \u201CSave to favorites\u201D.</p>') +
      '<h3>\uD83D\uDD52 Recent calculations</h3>' + (hist.length ? '<ul>' + hist.slice(0, 10).map(function (h) { return '<li>' + esc(typeof h === 'string' ? h : (h.name || JSON.stringify(h))) + '</li>'; }).join('') + '</ul>' : '<p class="muted">No history yet.</p>') +
      '<p style="margin-top:18px"><a href="#" id="acctLogout" class="btn">Logout</a></p></div>';
    var b = qs('#acctLogout'); if (b) b.addEventListener('click', function (e) { e.preventDefault(); Auth.logout(); location.href = 'index.html'; });
  }

  /* ---------- ADMIN dashboard ---------- */
  function renderAdmin() {
    var root = qs('#adminRoot'); if (!root) return;
    if (!Admin.isLoggedIn()) {
      root.innerHTML = '<div class="auth-card"><h2>\uD83D\uDD10 Admin Login</h2><form id="adminLoginForm"><label>Admin password<br><input type="password" id="adPass" placeholder="default: admin123"></label><button class="btn" type="submit">Login</button></form><div id="adMsg" class="auth-msg"></div><p class="muted" style="margin-top:10px">Default password is <code>admin123</code> \u2013 change it from Settings after logging in.</p></div>';
      qs('#adminLoginForm').addEventListener('submit', function (e) { e.preventDefault(); if (Admin.login(qs('#adPass').value)) renderAdmin(); else { var m = qs('#adMsg'); m.className = 'auth-msg err'; m.textContent = 'Incorrect admin password.'; } });
      return;
    }
    var SEO = window.SEO || { TOOLS: {}, ORDER: [], CATS: {} };
    var ids = (SEO.ORDER && SEO.ORDER.length) ? SEO.ORDER : Object.keys(SEO.TOOLS);
    root.innerHTML =
      '<div class="admin-bar"><div><b>Admin Control Panel</b></div><a href="#" id="adLogout" class="btn ghost sm">Logout</a></div>' +
      '<div class="admin-tabs">' +
        '<button class="atab active" data-tab="tools">\uD83D\uDD27 Tools</button>' +
        '<button class="atab" data-tab="pages">\uD83D\uDCC4 Pages &amp; Policies</button>' +
        '<button class="atab" data-tab="settings">\u2699\uFE0F Settings</button>' +
        '<button class="atab" data-tab="users">\uD83D\uDC65 Users</button>' +
      '</div><div id="adPanel"></div>';
    qs('#adLogout').addEventListener('click', function (e) { e.preventDefault(); Admin.logout(); renderAdmin(); });
    var tabs = root.querySelectorAll('.atab');
    Array.prototype.forEach.call(tabs, function (b) { b.addEventListener('click', function () { Array.prototype.forEach.call(tabs, function (x) { x.className = 'atab'; }); b.className = 'atab active'; showTab(b.getAttribute('data-tab')); }); });
    showTab('tools');

    function showTab(tab) {
      var p = qs('#adPanel');
      if (tab === 'tools') return tabTools(p);
      if (tab === 'pages') return tabPages(p);
      if (tab === 'settings') return tabSettings(p);
      if (tab === 'users') return tabUsers(p);
    }

    function tabTools(p) {
      var d = Admin.disabled();
      var total = ids.length, off = Object.keys(d).length;
      p.innerHTML = '<p class="muted">' + total + ' tools \u00B7 <b>' + (total - off) + '</b> enabled \u00B7 <b>' + off + '</b> disabled. Showing up to 400 matches \u2013 use search to find a tool.</p>' +
        '<div class="admin-toolctl"><input id="adSearch" placeholder="Search tools by name / category\u2026" class="admin-search"><span><button class="btn sm" id="adEnableAll">Enable all</button> <button class="btn sm ghost" id="adDisableAll">Disable all (filtered)</button></span></div>' +
        '<div id="adToolList" class="admin-tool-list"></div>';
      var listEl = qs('#adToolList'), searchEl = qs('#adSearch');
      function paint(filter) {
        filter = (filter || '').toLowerCase(); var dd = Admin.disabled(); var html = []; var shown = 0;
        for (var i = 0; i < ids.length; i++) {
          if (shown >= 400) break;
          var id = ids[i]; var t = SEO.TOOLS[id]; if (!t) continue;
          if (filter && t.name.toLowerCase().indexOf(filter) < 0 && id.indexOf(filter) < 0 && (t.cat || '').toLowerCase().indexOf(filter) < 0) continue;
          shown++;
          html.push('<label class="admin-row"><input type="checkbox" data-id="' + esc(id) + '"' + (dd[id] ? '' : ' checked') + '> <span class="ar-ic">' + (t.icon || '') + '</span> <span class="ar-name">' + esc(t.name) + '</span> <span class="ar-cat">' + esc(t.cat || '') + '</span></label>');
        }
        listEl.innerHTML = html.join('') || '<p class="muted">No tools match.</p>';
        Array.prototype.forEach.call(listEl.querySelectorAll('input[type=checkbox]'), function (cb) { cb.addEventListener('change', function () { Admin.setDisabled(cb.getAttribute('data-id'), !cb.checked); }); });
      }
      paint('');
      searchEl.addEventListener('input', function () { paint(searchEl.value); });
      qs('#adEnableAll').addEventListener('click', function () { Admin.setMany(ids, false); paint(searchEl.value); });
      qs('#adDisableAll').addEventListener('click', function () { var f = searchEl.value.toLowerCase(); var sel = ids.filter(function (id) { var t = SEO.TOOLS[id]; return t && (!f || t.name.toLowerCase().indexOf(f) >= 0 || (t.cat || '').toLowerCase().indexOf(f) >= 0); }); Admin.setMany(sel, true); paint(searchEl.value); });
    }

    function tabPages(p) {
      var keys = [['privacy', 'Privacy Policy'], ['terms', 'Terms of Service'], ['disclaimer', 'Disclaimer'], ['cookies', 'Cookie Policy'], ['about', 'About'], ['contact', 'Contact']];
      p.innerHTML = '<p class="muted">Edit the content of any policy / info page. Saved overrides appear instantly on the live page (stored in this browser).</p>' +
        '<label>Choose page<br><select id="adPolSel">' + keys.map(function (k) { return '<option value="' + k[0] + '">' + k[1] + '</option>'; }).join('') + '</select></label>' +
        '<textarea id="adPolBody" class="admin-policy" rows="12" placeholder="HTML content for this page\u2026"></textarea>' +
        '<div><button class="btn" id="adPolSave">Save page</button> <button class="btn ghost" id="adPolReset">Reset to default</button> <span id="adPolMsg" class="auth-msg"></span></div>';
      var sel = qs('#adPolSel'), body = qs('#adPolBody');
      function load() { var ov = Admin.policy(sel.value); body.value = ov != null ? ov : '(Using built-in default content. Type here to override it.)'; }
      load(); sel.addEventListener('change', load);
      qs('#adPolSave').addEventListener('click', function () { Admin.savePolicy(sel.value, body.value); var m = qs('#adPolMsg'); m.className = 'auth-msg ok'; m.textContent = 'Saved!'; });
      qs('#adPolReset').addEventListener('click', function () { set('policy:' + sel.value, null); load(); var m = qs('#adPolMsg'); m.className = 'auth-msg'; m.textContent = 'Reset to default.'; });
    }

    function tabSettings(p) {
      var s = Admin.settings();
      p.innerHTML = '<div class="admin-form">' +
        '<label>Site brand name<br><input id="adBrand" value="' + esc(s.brand) + '"></label>' +
        '<label>Tagline<br><input id="adTag" value="' + esc(s.tagline) + '"></label>' +
        '<label>Default currency<br><input id="adCur" value="' + esc(s.currency || 'INR') + '"></label>' +
        '<button class="btn" id="adSaveSet">Save settings</button> <span id="adSetMsg" class="auth-msg"></span>' +
        '<hr><h3>Change admin password</h3>' +
        '<label>New admin password<br><input type="password" id="adNewPass" placeholder="min 6 characters"></label>' +
        '<button class="btn" id="adSavePass">Update password</button> <span id="adPassMsg" class="auth-msg"></span>' +
        '<hr><h3>Danger zone</h3><button class="btn ghost" id="adReset">Reset all admin data</button></div>';
      qs('#adSaveSet').addEventListener('click', function () { Admin.saveSettings({ brand: qs('#adBrand').value, tagline: qs('#adTag').value, currency: qs('#adCur').value }); var m = qs('#adSetMsg'); m.className = 'auth-msg ok'; m.textContent = 'Saved!'; });
      qs('#adSavePass').addEventListener('click', function () { var v = qs('#adNewPass').value; var m = qs('#adPassMsg'); if (v.length < 6) { m.className = 'auth-msg err'; m.textContent = 'Min 6 characters.'; return; } Admin.setPass(v); m.className = 'auth-msg ok'; m.textContent = 'Password updated.'; });
      qs('#adReset').addEventListener('click', function () { if (confirm('Reset all admin settings, disabled tools and policy edits?')) { ['disabled', 'settings', 'admin:pass'].forEach(function (k) { localStorage.removeItem(PFX + k); }); Object.keys(localStorage).forEach(function (k) { if (k.indexOf(PFX + 'policy:') === 0) localStorage.removeItem(k); }); renderAdmin(); } });
    }

    function tabUsers(p) {
      var u = Auth.users(); var keys = Object.keys(u);
      p.innerHTML = '<p class="muted">' + keys.length + ' registered user account(s) on this device.</p>' +
        (keys.length ? '<table class="admin-users"><tr><th>Name</th><th>Email</th><th>Joined</th><th></th></tr>' + keys.map(function (e) { return '<tr><td>' + esc(u[e].name) + '</td><td>' + esc(e) + '</td><td>' + new Date(u[e].created).toLocaleDateString() + '</td><td><button class="btn sm ghost" data-del="' + esc(e) + '">Remove</button></td></tr>'; }).join('') + '</table>' : '<p class="muted">No users have signed up yet.</p>');
      Array.prototype.forEach.call(p.querySelectorAll('[data-del]'), function (b) { b.addEventListener('click', function () { var e = b.getAttribute('data-del'); var uu = Auth.users(); delete uu[e]; set('users', uu); tabUsers(p); }); });
    }
  }

  /* ---------- boot ---------- */
  function boot() { injectHeader(); applyDisabled(); applyPolicy(); wireLogin(); wireSignup(); wireAccount(); renderAdmin(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
