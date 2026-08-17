/* ============================================================
   allfreecalculators.in - Firebase integration layer (real auth + Firestore)
   ------------------------------------------------------------
   Loads only when js/firebase-config.js has a real config.
   Provides REAL: email/password and Google sign in, plus
   cross-device sync of favorites, history,
   reviews and admin site config via Cloud Firestore.
   Non-invasive: it overrides the demo handlers set by
   calcverse.js and mirrors data into the same localStorage keys
   so the existing UI keeps working unchanged.
   ES5-safe, no build step. CDN: firebase compat SDK 10.x.
   ============================================================ */
(function () {
  'use strict';
  var PFX = 'calcverse:';
  var CFG = window.FIREBASE_CONFIG || {};
  var FB = window.CalcVerseFirebase = { enabled: false, ready: false, user: null, isAdmin: false };
  var configured = !!(CFG.apiKey && CFG.projectId &&
    CFG.apiKey.indexOf('YOUR_') < 0 && CFG.projectId.indexOf('YOUR_') < 0);
  FB.configured = configured;
  if (!configured) { return; } // stay in offline demo mode

  // Performance: do not load heavy Firebase SDKs on every calculator page.
  // Load only on account/auth/contact/vishal4747 pages or when explicitly requested.
  var page = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  var needsFirebase = /^(login|signup|account|forgot-password|contact|admin)\.html$/.test(page) ||
    !!localStorage.getItem(PFX + 'forceFirebase');
  if (!needsFirebase) { return; }

  var SDK = 'https://www.gstatic.com/firebasejs/10.12.2/';
  var FILES = ['firebase-app-compat.js', 'firebase-auth-compat.js', 'firebase-firestore-compat.js'];
  loadSeq(FILES.map(function (f) { return SDK + f; }), init, function () {
    console.warn('[allfreecalculators.in] Firebase SDK failed to load - staying in demo mode.');
  });

  function loadSeq(urls, done, fail) {
    var i = 0;
    (function next() {
      if (i >= urls.length) { done(); return; }
      var s = document.createElement('script');
      s.src = urls[i++]; s.async = false;
      s.onload = next; s.onerror = fail || function () {};
      document.head.appendChild(s);
    })();
  }
  function toast(m) { try { (window.CalcVerse && window.CalcVerse.toast) ? window.CalcVerse.toast(m) : console.log(m); } catch (e) {} }
  function qs(s) { return document.querySelector(s); }
  function qsa(s) { return Array.prototype.slice.call(document.querySelectorAll(s)); }
  function lsSet(k, v) { try { localStorage.setItem(PFX + k, JSON.stringify(v)); } catch (e) {} }
  function lsGet(k, d) { try { var v = localStorage.getItem(PFX + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }
  var auth, db, uid;

  function init() {
    try { firebase.initializeApp(CFG); } catch (e) {}
    auth = firebase.auth(); db = firebase.firestore();
    FB.enabled = true; FB.ready = true; FB.auth = auth; FB.db = db;
    FB.api = api;
    pullSiteConfig();
    auth.onAuthStateChanged(function (u) {
      FB.user = u; uid = u ? u.uid : null;
      var emails = (window.CALCVERSE_ADMIN_EMAILS || []).map(function (e) { return String(e).toLowerCase(); });
      FB.isAdmin = !!(u && u.email && emails.indexOf(u.email.toLowerCase()) >= 0);
      if (u) { ensureUserDoc(u); pullUserData(u); }
      renderAcct();
      // let the rest of the app know
      try { document.dispatchEvent(new CustomEvent('calcverse:auth', { detail: { user: u } })); } catch (e) {}
    });
    overrideForms();
    hookLocalStorageMirror();
    badge();
  }

  /* ---------- header account box (Firebase-aware) ---------- */
  function renderAcct() {
    var box = qs('#acctBox'); if (!box) return; box.innerHTML = '';
    var u = FB.user;
    if (u) {
      var nm = (u.displayName || (u.email || 'User').split('@')[0]).split(' ')[0];
      var s1 = document.createElement('span'); s1.className = 'acct-name'; s1.textContent = '\uD83D\uDC4B ' + nm; box.appendChild(s1);
      var dash = document.createElement('a'); dash.className = 'icon-btn'; dash.href = 'account.html'; dash.title = 'Account'; dash.textContent = '\uD83D\uDC64'; box.appendChild(dash);
      if (FB.isAdmin) { var ad = document.createElement('a'); ad.className = 'icon-btn'; ad.href = 'admin.html'; ad.title = 'Admin'; ad.textContent = '\uD83D\uDEE1\uFE0F'; box.appendChild(ad); }
      var out = document.createElement('button'); out.className = 'icon-btn'; out.title = 'Logout'; out.textContent = '\u23FB';
      out.onclick = function () { auth.signOut().then(function () { toast('Logged out'); }); }; box.appendChild(out);
    } else {
      var l = document.createElement('a'); l.className = 'btn ghost sm'; l.href = 'login.html'; l.textContent = 'Login'; box.appendChild(l);
      var sg = document.createElement('a'); sg.className = 'btn sm'; sg.href = 'signup.html'; sg.textContent = 'Sign up'; box.appendChild(sg);
    }
  }

  /* ---------- auth API ---------- */
  var api = {
    signupEmail: function (name, email, pass) {
      return auth.createUserWithEmailAndPassword(email, pass).then(function (c) {
        return c.user.updateProfile({ displayName: name }).then(function () { return ensureUserDoc(c.user, name); });
      });
    },
    loginEmail: function (email, pass) { return auth.signInWithEmailAndPassword(email, pass); },
    sendPasswordReset: function (email) { return auth.sendPasswordResetEmail(email); },
    loginGoogle: function () { return auth.signInWithPopup(new firebase.auth.GoogleAuthProvider()); },
    loginApple: function () { var p = new firebase.auth.OAuthProvider('apple.com'); return auth.signInWithPopup(p); },
    logout: function () { return auth.signOut(); }
  };

  /* ---------- Firestore docs ---------- */
  function ensureUserDoc(u, name) {
    if (!u) return Promise.resolve();
    var ref = db.collection('users').doc(u.uid);
    return ref.get().then(function (snap) {
      if (!snap.exists) {
        return ref.set({
          name: name || u.displayName || (u.email || '').split('@')[0],
          email: u.email || '', provider: (u.providerData[0] || {}).providerId || 'password',
          created: Date.now()
        });
      }
    }).catch(function () {});
  }
  function pullUserData(u) {
    // favorites
    db.collection('users').doc(u.uid).collection('favorites').get().then(function (q) {
      var f = {}; q.forEach(function (d) { f[d.id] = (d.data() || {}).t || Date.now(); }); lsSet('favs', f);
      if (window.CalcVerse && qs('#popularGrid')) { /* refresh stars next paint */ }
    }).catch(function () {});
    // history
    db.collection('users').doc(u.uid).collection('history').orderBy('t', 'desc').limit(100).get().then(function (q) {
      var h = []; q.forEach(function (d) { h.push(d.data()); }); lsSet('history', h);
    }).catch(function () {});
  }
  function pullSiteConfig() {
    db.collection('config').doc('site').get().then(function (snap) {
      if (snap.exists) { var c = snap.data() || {}; lsSet('config', c); if (c.settings) lsSet('settings', c.settings); applySite(c); }
    }).catch(function () {});
  }
  function applySite(c) {
    try {
      if (c.announcement) { var bar = qs('#cvAnnounce'); if (bar) { bar.textContent = c.announcement; bar.style.display = ''; } }
      if (c.settings && c.settings.brand) qsa('[data-brand]').forEach(function (n) { n.textContent = c.settings.brand; });
    } catch (e) {}
  }
  FB.saveSiteConfig = function (cfg) { return db.collection('config').doc('site').set(cfg, { merge: true }); };
  FB.listUsers = function () { return db.collection('users').limit(500).get().then(function (q) { var a = []; q.forEach(function (d) { var o = d.data() || {}; o.uid = d.id; a.push(o); }); return a; }); };
  FB.setUserRole = function (uid, role) { return db.collection('users').doc(uid).set({ role: role }, { merge: true }); };
  FB.setUserBanned = function (uid, banned) { return db.collection('users').doc(uid).set({ banned: !!banned }, { merge: true }); };
  FB.deleteUser = function (uid) { return db.collection('users').doc(uid).delete(); };
  FB.updateName = function (name) { var u = FB.user; if (!u) return Promise.reject(new Error('Not signed in')); return u.updateProfile({ displayName: name }).then(function () { return db.collection('users').doc(u.uid).set({ name: name }, { merge: true }); }).then(function () { renderAcct(); }); };
  FB.sendPasswordReset = function (email) { return auth.sendPasswordResetEmail(email); };
  FB.listPosts = function () { return db.collection('posts').orderBy('t', 'desc').limit(100).get().then(function (q) { var a = []; q.forEach(function (d) { var o = d.data() || {}; o.id = d.id; a.push(o); }); return a; }); };
  FB.savePost = function (p) { var id = p.id || ('p' + Date.now()); return db.collection('posts').doc(id).set(p, { merge: true }).then(function () { return id; }); };
  FB.deletePost = function (id) { return db.collection('posts').doc(id).delete(); };
  FB.submitContact = function (d) { var x = { name: d.name || '', email: d.email || '', message: d.message || '', t: Date.now() }; return db.collection('contact').add(x); };
  FB.listContact = function () { return db.collection('contact').orderBy('t', 'desc').limit(300).get().then(function (q) { var a = []; q.forEach(function (d) { var o = d.data() || {}; o.id = d.id; a.push(o); }); return a; }); };
  FB.deleteContact = function (id) { return db.collection('contact').doc(id).delete(); };
  FB.listReviews = function () { return db.collectionGroup('items').limit(200).get().then(function (q) { var a = []; q.forEach(function (d) { var o = d.data() || {}; var tid = (d.ref.parent && d.ref.parent.parent) ? d.ref.parent.parent.id : ''; a.push({ tool: tid, id: d.id, data: o }); }); return a; }); };
  FB.deleteReview = function (tool, id) { return db.collection('reviews').doc(tool).collection('items').doc(id).delete(); };
  FB.listCampaigns = function () { return db.collection('campaigns').orderBy('t', 'desc').limit(100).get().then(function (q) { var a = []; q.forEach(function (d) { var o = d.data() || {}; o.id = d.id; a.push(o); }); return a; }); };
  FB.saveCampaign = function (c) { var id = c.id || ('c' + Date.now()); c.t = c.t || Date.now(); return db.collection('campaigns').doc(id).set(c, { merge: true }).then(function () { return id; }); };
  FB.deleteCampaign = function (id) { return db.collection('campaigns').doc(id).delete(); };
  FB.listSubscribers = function () { return db.collection('users').limit(1000).get().then(function (q) { var a = []; q.forEach(function (d) { var o = d.data() || {}; if (o.email && o.banned !== true) a.push({ email: o.email, name: o.name || '' }); }); return a; }); };

  /* ---------- mirror localStorage writes to Firestore ---------- */
  function hookLocalStorageMirror() {
    var orig = localStorage.setItem.bind(localStorage);
    localStorage.setItem = function (k, v) {
      orig(k, v);
      if (!uid) return;
      try {
        if (k === PFX + 'favs') {
          var f = JSON.parse(v) || {}; var col = db.collection('users').doc(uid).collection('favorites');
          // write current set; (simple last-write-wins)
          Object.keys(f).forEach(function (id) { col.doc(id).set({ t: f[id] }); });
        } else if (k === PFX + 'history') {
          var h = (JSON.parse(v) || [])[0]; if (h) db.collection('users').doc(uid).collection('history').add(h);
        } else if (k.indexOf(PFX + 'reviews:') === 0) {
          var toolId = k.substring((PFX + 'reviews:').length); var arr = JSON.parse(v) || []; var r = arr[0];
          if (r) db.collection('reviews').doc(toolId).collection('items').add(r);
        }
      } catch (e) {}
    };
  }

  /* ---------- override demo login/signup handlers ---------- */
  function ok(box, t) { if (box) { box.className = 'auth-msg ok'; box.textContent = t; } }
  function err(box, t) { if (box) { box.className = 'auth-msg err'; box.textContent = t; } }
  function go(url, ms) { setTimeout(function () { location.href = url; }, ms || 600); }
  function overrideForms() {
    var lf = qs('#authLoginForm');
    if (lf) {
      lf.onsubmit = function (e) { e.preventDefault(); var m = qs('#liMsg'); ok(m, 'Signing in\u2026');
        api.loginEmail(qs('#liEmail').value, qs('#liPass').value).then(function () { ok(m, 'Welcome back!'); go('account.html'); })
          .catch(function (er) { err(m, er.message || 'Login failed.'); }); };
    }
    var sf = qs('#authSignupForm');
    if (sf) {
      sf.onsubmit = function (e) { e.preventDefault(); var m = qs('#suMsg'); ok(m, 'Creating account\u2026');
        api.signupEmail(qs('#suName').value, qs('#suEmail').value, qs('#suPass').value).then(function () { ok(m, 'Account created!'); go('account.html'); })
          .catch(function (er) { err(m, er.message || 'Signup failed.'); }); };
    }
    qsa('[data-social]').forEach(function (b) {
      b.onclick = function () {
        var p = b.getAttribute('data-social'); var fn = p === 'google' ? api.loginGoogle : null;
        if (!fn) return; fn().then(function () { go('account.html', 300); }).catch(function (er) { toast(er.message || (p + ' sign-in failed')); });
      };
    });
  }

  function badge() {
    // small "Live" indicator if a status element exists
    var n = qs('#fbStatus'); if (n) { n.textContent = 'Firebase: connected (live accounts + database)'; n.className = 'badge ok'; }
  }
})();
