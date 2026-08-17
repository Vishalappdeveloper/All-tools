/* ============================================================
   allfreecalculators.in - cf-boot.js
   Global enhancement layer (vanilla, ES5-safe, no deps).
   - AdSense / GA config override (set from Admin panel)
   - Tool page favorite / share / copy / WhatsApp / print toolbar
   - Admin AdSense & SEO manager
   - Lazy-load images for speed
   Safe to include on every page; activates only where needed.
   ============================================================ */
(function () {
  'use strict';
  var PFX = 'calcverse:';
  function lget(k, d) { try { var v = localStorage.getItem(PFX + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }
  function lset(k, v) { try { localStorage.setItem(PFX + k, JSON.stringify(v)); } catch (e) {} }
  function qs(s, r) { return (r || document).querySelector(s); }
  function ce(t, a, h) { var e = document.createElement(t); if (a) for (var k in a) { if (k === 'class') e.className = a[k]; else e.setAttribute(k, a[k]); } if (h != null) e.innerHTML = h; return e; }
  function toast(m) { var t = ce('div', { 'class': 'cf-toast' }, m); document.body.appendChild(t); setTimeout(function () { t.className = 'cf-toast show'; }, 10); setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 2400); }
  function copy(txt) { try { navigator.clipboard.writeText(txt); toast('Link copied'); } catch (e) { var i = ce('input'); i.value = txt; document.body.appendChild(i); i.select(); try { document.execCommand('copy'); toast('Link copied'); } catch (_) {} i.parentNode && i.parentNode.removeChild(i); } }

  /* ---------- styles ---------- */
  function injectCSS() {
    if (qs('#cfBootCSS')) return;
    var css = '.cf-toolbar{display:flex;gap:8px;flex-wrap:wrap;margin:16px 0}'
      + '.cf-tb-btn{font:inherit;font-size:.85rem;padding:7px 12px;border:1px solid var(--cv-border,#d8dee6);background:var(--cv-card,#fff);color:inherit;border-radius:10px;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;gap:4px;transition:.15s}'
      + '.cf-tb-btn:hover{border-color:#1c6fb3;color:#1c6fb3}'
      + '.cf-tb-btn.on{background:#1c6fb3;color:#fff;border-color:#1c6fb3}'
      + '[data-theme=dark] .cf-tb-btn{background:#1b2330;border-color:#2c3a4d}'
      + '.cf-related{margin:28px 0;padding:18px;border:1px solid var(--cv-border,#e4e9f0);border-radius:14px;background:var(--cv-card,#fafbfc)}'
      + '[data-theme=dark] .cf-related{background:#141b26;border-color:#26313f}'
      + '.cf-related h2{margin:0 0 12px;font-size:1.15rem}'
      + '.cf-rel-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:8px}'
      + '.cf-rel-grid a{display:block;padding:9px 12px;border:1px solid var(--cv-border,#e0e6ee);border-radius:10px;background:var(--cv-bg,#fff);color:inherit;text-decoration:none;font-size:.9rem}'
      + '.cf-rel-grid a:hover{border-color:#1c6fb3;color:#1c6fb3}'
      + '[data-theme=dark] .cf-rel-grid a{background:#0f151e;border-color:#26313f}'
      + '.cf-updated{margin-top:12px;font-size:.8rem;color:#7a8694}'
            + '.cf-admin-seo{margin-top:18px}.cf-admin-seo input{width:100%;padding:9px;margin:4px 0 8px;border:1px solid var(--cv-border,#d8dee6);border-radius:8px;font:inherit;box-sizing:border-box}.cf-admin-seo label{font-size:.84rem;font-weight:600}'
      + '.cf-toast{position:fixed;left:50%;bottom:26px;transform:translateX(-50%) translateY(20px);background:#1c2530;color:#fff;padding:10px 16px;border-radius:10px;font-size:.85rem;opacity:0;transition:.3s;z-index:99999;pointer-events:none}'
      + '.cf-toast.show{opacity:1;transform:translateX(-50%) translateY(0)}'
      + '.cv-social{display:flex;flex-wrap:wrap;gap:12px;justify-content:center;margin:16px 0 4px;padding-top:14px;border-top:1px solid rgba(150,160,175,.25)}'
      + '.cv-social a{color:inherit;opacity:.85;text-decoration:none;font-size:.85rem}'
      + '.cv-social a:hover{opacity:1;color:#1c6fb3}'
      + '@media(max-width:560px){.cf-rel-grid{grid-template-columns:1fr 1fr}}';
    var s = ce('style', { id: 'cfBootCSS' }); s.textContent = css; (document.head || document.documentElement).appendChild(s);
  }

  /* ---------- config override (AdSense / GA / verification) ---------- */
  function applyOverride() {
    var o = lget('cfoverride', null); if (!o) return;
    try {
      if (o.adsenseClient && !window.__cfAds) { window.__cfAds = 1; var a = document.createElement('script'); a.async = true; a.setAttribute('crossorigin', 'anonymous'); a.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + encodeURIComponent(o.adsenseClient); document.head.appendChild(a); }
      if (o.ga4Id && !window.__cfGa) { window.__cfGa = 1; var g = document.createElement('script'); g.async = true; g.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(o.ga4Id); document.head.appendChild(g); window.dataLayer = window.dataLayer || []; window.gtag = window.gtag || function () { window.dataLayer.push(arguments); }; window.gtag('js', new Date()); window.gtag('config', o.ga4Id); }
      if (o.gsv && !qs('meta[name="google-site-verification"]')) { var mt = ce('meta', { name: 'google-site-verification', content: o.gsv }); document.head.appendChild(mt); }
    } catch (e) {}
  }

  /* ---------- favorites + tool toolbar ---------- */
  function toolId() { var b = document.body; if (b && b.getAttribute('data-tool-id')) return b.getAttribute('data-tool-id'); var p = (location.pathname.split('/').pop() || ''); return p.replace(/\.html$/, '') || 'home'; }
  function favs() { return lget('favs', {}); }
  function toggleFav(id) { var f = favs(); if (f[id]) delete f[id]; else f[id] = Date.now(); lset('favs', f); return !!f[id]; }
  function recordRecent(id) { if (!id) return; var r = lget('recent', []); r = r.filter(function (x) { return x !== id; }); r.unshift(id); lset('recent', r.slice(0, 24)); }
  function buildToolbar() {
    var host = qs('#cfToolbar'); if (!host || host.getAttribute('data-done')) return; host.setAttribute('data-done', '1');
    var id = toolId(); recordRecent(id); var url = location.href.split('#')[0];
    var fav = ce('button', { 'type': 'button' });
    function paint() { fav.innerHTML = (favs()[id] ? '\u2605 Saved' : '\u2606 Save'); fav.className = 'cf-tb-btn' + (favs()[id] ? ' on' : ''); }
    paint(); fav.onclick = function () { var on = toggleFav(id); paint(); toast(on ? 'Saved to favorites' : 'Removed from favorites'); };
    var share = ce('button', { 'type': 'button', 'class': 'cf-tb-btn' }, '\uD83D\uDD17 Share'); share.onclick = function () { if (navigator.share) { navigator.share({ title: document.title, url: url }).catch(function () {}); } else { copy(url); } };
    var copyb = ce('button', { 'type': 'button', 'class': 'cf-tb-btn' }, '\uD83D\uDCCB Copy link'); copyb.onclick = function () { copy(url); };
    var wa = ce('a', { 'class': 'cf-tb-btn', 'target': '_blank', 'rel': 'noopener', 'href': 'https://wa.me/?text=' + encodeURIComponent(document.title + ' ' + url) }, '\uD83D\uDCAC WhatsApp');
    var pr = ce('button', { 'type': 'button', 'class': 'cf-tb-btn' }, '\uD83D\uDDA8\uFE0F Print'); pr.onclick = function () { window.print(); };
    host.className = 'cf-toolbar'; host.appendChild(fav); host.appendChild(share); host.appendChild(copyb); host.appendChild(wa); host.appendChild(pr);
  }

  /* ---------- phone OTP signup removed by request ---------- */
  function wirePhone() {}

  /* ---------- admin AdSense & SEO manager ---------- */
  function adminPanel() {
    var root = qs('#adminRoot'); if (!root) return; if (qs('#cfAdminSeo')) return;
    var o = lget('cfoverride', {}) || {};
    var box = ce('section', { id: 'cfAdminSeo', 'class': 'card cf-admin-seo' });
    box.innerHTML = '<h2>\uD83D\uDCB0 AdSense &amp; SEO Manager</h2>'
      + '<p class="muted">Apni ad + analytics IDs yahan set karein. Save karte hi is browser ki sabhi pages par live ho jata hai (Firebase ON ho to sab devices par).</p>'
      + '<label>AdSense Publisher ID</label><input id="cfA1" placeholder="ca-pub-XXXXXXXXXXXXXXXX" value="' + (o.adsenseClient || '') + '">'
      + '<label>Google Analytics 4 ID</label><input id="cfA2" placeholder="G-XXXXXXXXXX" value="' + (o.ga4Id || '') + '">'
      + '<label>Search Console verification code</label><input id="cfA3" placeholder="verification token" value="' + (o.gsv || '') + '">'
      + '<label style="display:flex;gap:8px;align-items:center;margin-top:8px"><input type="checkbox" id="cfA4" style="width:auto" ' + (o.adsEnabled ? 'checked' : '') + '> Ads enabled</label>'
      + '<div style="margin-top:12px"><button id="cfASave" class="btn">Save settings</button> <span id="cfAMsg" class="muted"></span></div>';
    root.appendChild(box);
    qs('#cfASave').onclick = function () {
      var n = { adsenseClient: qs('#cfA1').value.trim(), ga4Id: qs('#cfA2').value.trim(), gsv: qs('#cfA3').value.trim(), adsEnabled: qs('#cfA4').checked };
      lset('cfoverride', n);
      try { if (window.CalcVerseFirebase && window.CalcVerseFirebase.saveSiteConfig && fbApi()) window.CalcVerseFirebase.saveSiteConfig({ settings: n }); } catch (e) {}
      applyOverride();
      qs('#cfAMsg').textContent = 'Saved \u2713 (reload pages to show ads)';
    };
  }

  /* ---------- lazy images ---------- */
  function lazyImgs() { var im = document.getElementsByTagName('img'); for (var i = 0; i < im.length; i++) { if (!im[i].getAttribute('loading')) { im[i].setAttribute('loading', 'lazy'); im[i].setAttribute('decoding', 'async'); } } }

  function wireForgot() {
    var link = qs('#liForgot'); if (!link || link.__cfw) return; link.__cfw = 1;
    link.onclick = function (e) {
      e.preventDefault();
      var em = ((qs('#liEmail') && qs('#liEmail').value) || '').trim();
      if (!em) { em = (prompt('Enter your account email to receive a password reset link:') || '').trim(); }
      if (!em) return;
      var FB = window.CalcVerseFirebase;
      if (FB && FB.enabled && FB.sendPasswordReset) {
        FB.sendPasswordReset(em).then(function () { toast('Password reset link sent to ' + em); }).catch(function (er) { toast((er && er.message) || 'Could not send reset email.'); });
      } else {
        toast('Password reset needs Firebase (see FIREBASE-SETUP.md), or sign in with Google.');
      }
    };
  }

  function init() { injectCSS(); applyOverride(); buildToolbar(); wirePhone(); wireForgot(); lazyImgs(); setTimeout(adminPanel, 400); setTimeout(adminPanel, 1300); }
  if (document.readyState !== 'loading') init(); else document.addEventListener('DOMContentLoaded', init);
})();


/* ============================================================
   allfreecalculators.in ENHANCE LAYER (cf-enhance)
   Auto-adds a rich toolbar of features to EVERY tool page.
   Loaded via cf-boot.js -> applies to all 2900+ tools + home.
   Pure vanilla JS, offline-safe, idempotent, wrapped in try/catch.
   ============================================================ */
(function () {
  'use strict';
  if (window.__CF_ENHANCED) return;
  window.__CF_ENHANCED = true;

  var LS = window.localStorage;
  var KEY_HIST = 'cf:history';
  var KEY_FAV = 'cf:favorites';
  var KEY_FONT = 'cf:fontscale';
  var KEY_PREC = 'cf:precision';

  function $(s, r) { return (r || document).querySelector(s); }
  function $all(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function el(tag, attrs, html) {
    var e = document.createElement(tag);
    if (attrs) for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (html != null) e.innerHTML = html;
    return e;
  }
  function toast(msg) {
    try {
      var t = $('#cfToast');
      if (!t) { t = el('div', { id: 'cfToast' }); document.body.appendChild(t); }
      t.textContent = msg; t.className = 'show';
      clearTimeout(window.__cfToastT);
      window.__cfToastT = setTimeout(function () { t.className = ''; }, 1800);
    } catch (e) {}
  }
  function copy(text) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text); return true;
      }
    } catch (e) {}
    try {
      var ta = el('textarea'); ta.value = text; document.body.appendChild(ta);
      ta.select(); document.execCommand('copy'); document.body.removeChild(ta); return true;
    } catch (e) { return false; }
  }

  /* ---- find the calculator + result text ---- */
  function mount() { return $('#calcMount') || $('.calc-panel') || document.body; }
  function resultText() {
    var sels = ['.cv-result', '.result', '.output', '.cv-out', '[data-result]', '.res', '.answer'];
    var out = [];
    for (var i = 0; i < sels.length; i++) {
      $all(sels[i], mount()).forEach(function (n) { var t = (n.innerText || '').trim(); if (t) out.push(t); });
      if (out.length) break;
    }
    if (!out.length) { var m = mount(); out.push((m.innerText || '').trim().slice(0, 800)); }
    return out.join('\n');
  }
  function inputs() { return $all('input, select, textarea', mount()); }

  /* ---- FEATURES ---- */
  function fCopyResult() { copy(resultText()) ? toast('Result copied \u2713') : toast('Copy failed'); }
  function fCopyLink() { copy(location.href) ? toast('Link copied \u2713') : toast('Copy failed'); }
  function fShare() {
    var data = { title: document.title, text: 'Check this calculator', url: location.href };
    if (navigator.share) { navigator.share(data).catch(function () {}); }
    else { fCopyLink(); }
  }
  function fPrint() { window.print(); }
  function fDownloadTxt() {
    var body = document.title + '\n' + location.href + '\n\n' + resultText() + '\n\nInputs:\n' +
      inputs().map(function (i) { return (i.name || i.id || 'field') + ' = ' + i.value; }).join('\n');
    var blob = new Blob([body], { type: 'text/plain' });
    var a = el('a', { href: URL.createObjectURL(blob), download: 'calculatorfc-result.txt' });
    document.body.appendChild(a); a.click(); a.remove(); toast('Downloaded \u2713');
  }
  function fReset() {
    inputs().forEach(function (i) {
      if (i.type === 'checkbox' || i.type === 'radio') i.checked = false;
      else if (i.tagName === 'SELECT') i.selectedIndex = 0;
      else i.value = '';
      i.dispatchEvent(new Event('input', { bubbles: true }));
      i.dispatchEvent(new Event('change', { bubbles: true }));
    });
    toast('Cleared \u2713');
  }
  function fFullscreen() {
    var p = $('.calc-panel') || mount();
    if (document.fullscreenElement) document.exitFullscreen();
    else if (p.requestFullscreen) p.requestFullscreen();
  }
  function setFont(scale) {
    scale = Math.min(1.6, Math.max(0.8, scale));
    LS.setItem(KEY_FONT, scale);
    var p = $('.calc-panel') || mount();
    p.style.fontSize = (scale * 100) + '%';
  }
  function fFontUp() { setFont(parseFloat(LS.getItem(KEY_FONT) || '1') + 0.1); }
  function fFontDown() { setFont(parseFloat(LS.getItem(KEY_FONT) || '1') - 0.1); }
  function fTheme() {
    var b = $('#themeBtn'); if (b) { b.click(); return; }
    var d = document.documentElement;
    d.setAttribute('data-theme', d.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  }
  function fScrollTop() { window.scrollTo({ top: 0, behavior: 'smooth' }); }
  function fRecalc() {
    inputs().forEach(function (i) { i.dispatchEvent(new Event('input', { bubbles: true })); });
    toast('Recalculated \u2713');
  }

  /* history + favorites */
  function readJSON(k) { try { return JSON.parse(LS.getItem(k) || '[]'); } catch (e) { return []; } }
  function fSaveHistory() {
    var h = readJSON(KEY_HIST);
    h.unshift({ t: Date.now(), title: document.title, url: location.href, result: resultText().slice(0, 300) });
    LS.setItem(KEY_HIST, JSON.stringify(h.slice(0, 100)));
    toast('Saved to history \u2713');
  }
  function fViewHistory() {
    var h = readJSON(KEY_HIST);
    modal('\uD83D\uDD52 History (' + h.length + ')', h.length
      ? h.map(function (x) { return '<div class="cf-row"><a href="' + x.url + '">' + esc(x.title) + '</a><small>' + new Date(x.t).toLocaleString() + '</small><pre>' + esc(x.result) + '</pre></div>'; }).join('')
        + '<button class="btn" id="cfClearHist">Clear history</button>'
      : '<p>Abhi koi history nahi. "Save" dabao.</p>');
    var c = $('#cfClearHist'); if (c) c.onclick = function () { LS.removeItem(KEY_HIST); closeModal(); toast('History cleared'); };
  }
  function fFav() {
    var f = readJSON(KEY_FAV);
    var url = location.href.split('#')[0];
    if (f.some(function (x) { return x.url === url; })) { toast('Already in favorites'); return; }
    f.unshift({ url: url, title: document.title });
    LS.setItem(KEY_FAV, JSON.stringify(f.slice(0, 200)));
    toast('Added to favorites \u2605');
  }
  function fViewFav() {
    var f = readJSON(KEY_FAV);
    modal('\u2605 Favorites (' + f.length + ')', f.length
      ? f.map(function (x) { return '<div class="cf-row"><a href="' + x.url + '">' + esc(x.title) + '</a></div>'; }).join('')
        + '<button class="btn" id="cfClearFav">Clear favorites</button>'
      : '<p>Abhi koi favorite nahi.</p>');
    var c = $('#cfClearFav'); if (c) c.onclick = function () { LS.removeItem(KEY_FAV); closeModal(); toast('Favorites cleared'); };
  }

  /* embed */
  function fEmbed() {
    var code = '<iframe src="' + location.href + '" width="100%" height="600" style="border:1px solid #ddd;border-radius:12px" loading="lazy" title="' + esc(document.title) + '"></iframe>';
    modal('\u2039\u002F\u203A Embed this calculator', '<p>Apni website me paste karein:</p><textarea class="cf-embed" readonly>' + esc(code) + '</textarea><button class="btn" id="cfCopyEmbed">Copy embed code</button>');
    var b = $('#cfCopyEmbed'); if (b) b.onclick = function () { copy(code); toast('Embed copied \u2713'); };
  }

  /* precision */
  function applyPrecision(p) {
    LS.setItem(KEY_PREC, p);
    if (p === 'auto') return;
    var n = parseInt(p, 10);
    var sels = ['.cv-result', '.result', '.output', '[data-result]', '.res', '.answer'];
    sels.forEach(function (s) {
      $all(s, mount()).forEach(function (node) {
        node.innerHTML = node.innerHTML.replace(/-?\d+\.\d+/g, function (m) {
          var v = parseFloat(m); return isNaN(v) ? m : v.toFixed(n);
        });
      });
    });
    toast('Precision: ' + n + ' decimals');
  }

  /* converter swap (two selects) */
  function fSwap() {
    var sels = $all('select', mount());
    if (sels.length >= 2) {
      var a = sels[0].value; sels[0].value = sels[1].value; sels[1].value = a;
      sels[0].dispatchEvent(new Event('change', { bubbles: true }));
      sels[1].dispatchEvent(new Event('change', { bubbles: true }));
      toast('Units swapped \u21c4');
    } else { toast('Swap yahan available nahi'); }
  }

  function fHelp() {
    modal('\u2328 Keyboard shortcuts', '<ul class="cf-keys">'
      + '<li><kbd>C</kbd> Copy result</li><li><kbd>R</kbd> Reset</li><li><kbd>P</kbd> Print</li>'
      + '<li><kbd>F</kbd> Fullscreen</li><li><kbd>S</kbd> Share</li><li><kbd>H</kbd> Save to history</li>'
      + '<li><kbd>+</kbd>/<kbd>-</kbd> Font size</li><li><kbd>T</kbd> Theme</li></ul>');
  }

  /* ---- modal ---- */
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function modal(title, html) {
    closeModal();
    var ov = el('div', { id: 'cfModal', class: 'cf-modal' });
    ov.innerHTML = '<div class="cf-modal-box"><div class="cf-modal-h"><b>' + esc(title) + '</b><button class="cf-x" aria-label="Close">\u00d7</button></div><div class="cf-modal-b">' + html + '</div></div>';
    document.body.appendChild(ov);
    ov.addEventListener('click', function (e) { if (e.target === ov || e.target.className === 'cf-x') closeModal(); });
  }
  function closeModal() { var m = $('#cfModal'); if (m) m.remove(); }

  /* ---- toolbar definition ---- */
  var BTNS = [
    ['\uD83D\uDCCB Copy', fCopyResult, 'Copy the result'],
    ['\uD83D\uDD17 Link', fCopyLink, 'Copy page link'],
    ['\uD83D\uDCE4 Share', fShare, 'Share'],
    ['\uD83D\uDDA8 Print', fPrint, 'Print'],
    ['\uD83D\uDCC4 PDF', fPrint, 'Save as PDF (print dialog)'],
    ['\u2B07 Save .txt', fDownloadTxt, 'Download result as text'],
    ['\u21bb Recalculate', fRecalc, 'Recalculate'],
    ['\u267b Reset', fReset, 'Clear all fields'],
    ['\u21c4 Swap', fSwap, 'Swap units (converters)'],
    ['\u26f6 Fullscreen', fFullscreen, 'Fullscreen'],
    ['A+ Bigger', fFontUp, 'Increase font'],
    ['A- Smaller', fFontDown, 'Decrease font'],
    ['\uD83C\uDF13 Theme', fTheme, 'Light/Dark'],
    ['\uD83D\uDCBE Save', fSaveHistory, 'Save to history'],
    ['\uD83D\uDD52 History', fViewHistory, 'View history'],
    ['\u2605 Favorite', fFav, 'Add to favorites'],
    ['\uD83D\uDCC1 Favorites', fViewFav, 'View favorites'],
    ['\u2039/\u203A Embed', fEmbed, 'Embed code'],
    ['\u2191 Top', fScrollTop, 'Scroll to top'],
    ['\uD83D\uDCAC Feedback', function () { location.href = '/utilities/contact/'; }, 'Send feedback'],
    ['\u2328 Shortcuts', fHelp, 'Keyboard shortcuts']
  ];

  function buildToolbar() {
    var bar = $('#featBar');
    if (!bar) { var p = $('.calc-panel'); if (!p) return false; bar = el('div', { id: 'featBar', class: 'btn-row' }); p.insertBefore(bar, p.firstChild); }
    if (bar.getAttribute('data-cf') === '1') return true;
    bar.setAttribute('data-cf', '1');
    bar.classList.add('cf-toolbar');

    // precision selector
    var wrap = el('span', { class: 'cf-prec' });
    wrap.innerHTML = 'Decimals: <select id="cfPrec"><option value="auto">Auto</option><option>0</option><option>2</option><option>4</option><option>6</option><option>8</option></select>';
    bar.appendChild(wrap);
    var ps = $('#cfPrec'); ps.value = LS.getItem(KEY_PREC) || 'auto';
    ps.addEventListener('change', function () { applyPrecision(ps.value); });

    BTNS.forEach(function (b) {
      var btn = el('button', { type: 'button', class: 'btn sm cf-btn', title: b[2] }, b[0]);
      btn.addEventListener('click', function (e) { e.preventDefault(); try { b[1](); } catch (err) { toast('Error'); } });
      bar.appendChild(btn);
    });
    return true;
  }

  /* keyboard shortcuts */
  function keys(e) {
    if (/input|textarea|select/i.test((e.target.tagName || '')) || e.metaKey || e.ctrlKey || e.altKey) return;
    var k = e.key.toLowerCase();
    var map = { c: fCopyResult, r: fReset, p: fPrint, f: fFullscreen, s: fShare, h: fSaveHistory, t: fTheme, '+': fFontUp, '=': fFontUp, '-': fFontDown };
    if (k === 'escape') { closeModal(); return; }
    if (map[k]) { e.preventDefault(); try { map[k](); } catch (err) {} }
  }

  /* perf: lazy-load images + iframes that are not already lazy */
  function lazyMedia() {
    $all('img:not([loading])').forEach(function (i) { i.setAttribute('loading', 'lazy'); i.setAttribute('decoding', 'async'); });
    $all('iframe:not([loading])').forEach(function (i) { i.setAttribute('loading', 'lazy'); });
  }

  /* inject CSS */
  function injectCSS() {
    if ($('#cfEnhanceCSS')) return;
    var css = '' +
      '.cf-toolbar{display:flex;flex-wrap:wrap;gap:6px;align-items:center}' +
      '.cf-toolbar .cf-btn{cursor:pointer;border:1px solid var(--line,#d0d5e5);background:var(--card,#fff);color:inherit;border-radius:9px;padding:6px 10px;font-size:13px;font-weight:600;line-height:1.1}' +
      '.cf-toolbar .cf-btn:hover{filter:brightness(.97);border-color:var(--accent,#5b7cfa)}' +
      '.cf-prec{font-size:13px;opacity:.85;margin-right:4px}.cf-prec select{padding:4px 6px;border-radius:8px}' +
      '#cfToast{position:fixed;left:50%;bottom:26px;transform:translateX(-50%) translateY(20px);background:#111827;color:#fff;padding:10px 16px;border-radius:10px;font-size:14px;opacity:0;pointer-events:none;transition:.25s;z-index:99999}' +
      '#cfToast.show{opacity:1;transform:translateX(-50%) translateY(0)}' +
      '.cf-modal{position:fixed;inset:0;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;z-index:99998;padding:16px}' +
      '.cf-modal-box{background:var(--card,#fff);color:inherit;max-width:560px;width:100%;max-height:82vh;overflow:auto;border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,.4)}' +
      '.cf-modal-h{display:flex;justify-content:space-between;align-items:center;padding:14px 18px;border-bottom:1px solid var(--line,#e5e7eb);position:sticky;top:0;background:inherit}' +
      '.cf-x{border:0;background:none;font-size:24px;cursor:pointer;color:inherit;line-height:1}' +
      '.cf-modal-b{padding:16px 18px}.cf-modal-b .cf-row{padding:8px 0;border-bottom:1px solid var(--line,#eee)}.cf-modal-b pre{white-space:pre-wrap;font-size:12px;opacity:.8;margin:4px 0 0}' +
      '.cf-embed{width:100%;height:90px;font-size:12px;padding:8px;border-radius:8px}' +
      '.cf-keys{list-style:none;padding:0;margin:0;display:grid;grid-template-columns:1fr 1fr;gap:8px}.cf-keys kbd{background:#111827;color:#fff;border-radius:5px;padding:1px 7px;font-size:12px}' +
      '@media print{.cf-toolbar,.adzone,.cv-header,.cv-nav,.cookie-bar,#cfToast,.cf-modal{display:none!important}}';
    var s = el('style', { id: 'cfEnhanceCSS' }); s.textContent = css; document.head.appendChild(s);
  }

  function init() {
    try {
      injectCSS();
      // apply saved font
      var fs = parseFloat(LS.getItem(KEY_FONT) || '1'); if (fs !== 1) setFont(fs);
      lazyMedia();
      document.addEventListener('keydown', keys);
      // build toolbar now, and retry as calcverse mounts the calculator async
      var tries = 0;
      var iv = setInterval(function () {
        tries++;
        var ok = buildToolbar();
        var prec = LS.getItem(KEY_PREC);
        if (ok && prec && prec !== 'auto') applyPrecision(prec);
        if (ok || tries > 25) clearInterval(iv);
      }, 250);
      // observe late-rendered results for lazy media
      var mo = new MutationObserver(function () { lazyMedia(); });
      mo.observe(document.body, { childList: true, subtree: true });
      setTimeout(function () { mo.disconnect(); }, 8000);
    } catch (e) {}
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

/* ============================================================
   cf-admin-apply  (appended)
   Applies Admin Control Panel (/vishal4747/) settings site-wide.
   Reads localStorage calcverse:cfoverride. ES5-safe, idempotent.
   ============================================================ */
(function(){
  'use strict';
  if(window.__CF_ADMIN_APPLY)return; window.__CF_ADMIN_APPLY=1;
  var PFX='calcverse:';
  function lget(k,d){try{var v=localStorage.getItem(PFX+k);return v==null?d:JSON.parse(v);}catch(e){return d;}}
  function escapeH(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
  function injectHTML(html,target){var d=document.createElement('div');d.innerHTML=html;while(d.firstChild){var n=d.firstChild;if(n.tagName==='SCRIPT'){var sc=document.createElement('script');if(n.src)sc.src=n.src;else sc.textContent=n.textContent;if(n.type)sc.type=n.type;target.appendChild(sc);d.removeChild(n);}else{target.appendChild(n);}}}
  function apply(){
    var o=lget('cfoverride',null); if(!o)return;
    try{ if(o.defaultTheme && !localStorage.getItem(PFX+'theme') && !localStorage.getItem('theme') && !localStorage.getItem('cv:theme')){ document.documentElement.setAttribute('data-theme',o.defaultTheme); } }catch(e){}
    try{ if(o.themeColor){ var mt=document.querySelector('meta[name="theme-color"]'); if(mt)mt.setAttribute('content',o.themeColor); } }catch(e){}
    try{ if(o.gtmId && !window.__cfGtm){ window.__cfGtm=1; var s=document.createElement('script'); s.async=true; s.src='https://www.googletagmanager.com/gtm.js?id='+encodeURIComponent(o.gtmId); document.head.appendChild(s); window.dataLayer=window.dataLayer||[]; window.dataLayer.push({'gtm.start':new Date().getTime(),event:'gtm.js'}); } }catch(e){}
    try{ if(o.announceOn && o.announceText && !document.getElementById('cfAnnounce') && document.body){ var bar=document.createElement('div'); bar.id='cfAnnounce'; bar.style.cssText='background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#fff;text-align:center;padding:8px 30px 8px 14px;font-size:.9rem;font-weight:600;position:relative;z-index:40'; var inner=o.announceLink?('<a href="'+o.announceLink+'" style="color:#fff;text-decoration:underline">'+escapeH(o.announceText)+'</a>'):escapeH(o.announceText); bar.innerHTML=inner+'<span id="cfAnnounceX" style="position:absolute;right:12px;top:7px;cursor:pointer;opacity:.85">\u00d7</span>'; document.body.insertBefore(bar,document.body.firstChild); var x=document.getElementById('cfAnnounceX'); if(x)x.onclick=function(){bar.style.display='none';}; } }catch(e){}
    try{ if(o.customHead && !window.__cfHead){ window.__cfHead=1; injectHTML(o.customHead,document.head); } }catch(e){}
    try{ if(o.customFooter && !window.__cfFoot){ window.__cfFoot=1; injectHTML(o.customFooter,document.body); } }catch(e){}
  }
  if(document.readyState!=='loading')apply(); else document.addEventListener('DOMContentLoaded',apply);
})();

/* ============================================================
   cf-admin-apply-2  (appended)
   Applies the FULL Admin Control Panel feature set site-wide:
   maintenance, cookie consent, back-to-top, scroll progress,
   popup, redirects, auto-ads, FB pixel, Clarity.
   ES5-safe, idempotent, each wrapped in try/catch.
   ============================================================ */
(function(){
  'use strict';
  if(window.__CF_ADMIN_APPLY2)return; window.__CF_ADMIN_APPLY2=1;
  var PFX='calcverse:';
  function lget(k,d){try{var v=localStorage.getItem(PFX+k);return v==null?d:JSON.parse(v);}catch(e){return d;}}
  function sget(k){try{return sessionStorage.getItem(PFX+k);}catch(e){return null;}}
  function sset(k,v){try{sessionStorage.setItem(PFX+k,v);}catch(e){}}
  function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
  var here=location.pathname||'';
  var isAdmin=here.indexOf('/vishal4747')===0||here.indexOf('/pay-admin')===0||here.indexOf('/pay-')===0;
  function apply(){
    var o=lget('cfoverride',null); if(!o)return;
    /* ---- redirects ---- */
    try{ if(o.redirects){ var lines=o.redirects.split(/\n/); for(var i=0;i<lines.length;i++){ var m=lines[i].split('=>'); if(m.length===2){ var from=m[0].trim(), to=m[1].trim(); if(from && to && (here===from || here===from.replace(/\/$/,''))){ location.replace(to); return; } } } } }catch(e){}
    /* ---- maintenance mode ---- */
    try{ if(o.maintOn && !isAdmin && !document.getElementById('cfMaint')){ var mv=document.createElement('div'); mv.id='cfMaint'; mv.style.cssText='position:fixed;inset:0;z-index:99998;background:linear-gradient(160deg,#1e1b4b,#4338ca);color:#fff;display:flex;align-items:center;justify-content:center;text-align:center;padding:24px;font-family:Inter,system-ui,sans-serif'; mv.innerHTML='<div><div style="font-size:3rem">\uD83D\uDEE0\uFE0F</div><h1 style="margin:12px 0 8px">Under maintenance</h1><p style="opacity:.85;max-width:420px;margin:auto">'+esc(o.maintText||'We will be back shortly. Please check again in a little while.')+'</p></div>'; (document.body||document.documentElement).appendChild(mv); return; } }catch(e){}
    /* ---- auto ads ---- */
    try{ if(o.adsEnabled && o.autoAds && o.adsenseClient && !window.__cfAutoAds){ window.__cfAutoAds=1; (window.adsbygoogle=window.adsbygoogle||[]).push({google_ad_client:o.adsenseClient,enable_page_level_ads:true}); } }catch(e){}
    /* ---- Facebook pixel ---- */
    try{ if(o.fbPixel && !window.__cfFbp){ window.__cfFbp=1; !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');window.fbq('init',o.fbPixel);window.fbq('track','PageView'); } }catch(e){}
    /* ---- Microsoft Clarity ---- */
    try{ if(o.clarityId && !window.__cfClarity){ window.__cfClarity=1; (function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src='https://www.clarity.ms/tag/'+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y)})(window,document,'clarity','script',o.clarityId); } }catch(e){}
    /* ---- scroll progress bar ---- */
    try{ if(o.showProgress && !document.getElementById('cfProg')){ var pb=document.createElement('div'); pb.id='cfProg'; pb.style.cssText='position:fixed;top:0;left:0;height:3px;width:0;z-index:99997;background:linear-gradient(90deg,#4f46e5,#7c3aed);transition:width .1s'; document.body.appendChild(pb); window.addEventListener('scroll',function(){var h=document.documentElement;var sc=(h.scrollTop||document.body.scrollTop);var mx=(h.scrollHeight-h.clientHeight)||1;pb.style.width=(sc/mx*100)+'%';}); } }catch(e){}
    /* ---- back to top ---- */
    try{ if(o.showBackToTop!==false && !document.getElementById('cfTop')){ var bt=document.createElement('button'); bt.id='cfTop'; bt.setAttribute('aria-label','Back to top'); bt.innerHTML='\u2191'; bt.style.cssText='position:fixed;right:16px;bottom:16px;z-index:99990;width:44px;height:44px;border:0;border-radius:50%;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#fff;font-size:1.2rem;cursor:pointer;box-shadow:0 6px 18px rgba(79,70,229,.4);display:none'; document.body.appendChild(bt); bt.onclick=function(){window.scrollTo({top:0,behavior:'smooth'});}; window.addEventListener('scroll',function(){bt.style.display=(window.pageYOffset>400)?'block':'none';}); } }catch(e){}
    /* ---- cookie consent ---- */
    try{ if(o.cookieOn && !sget('cookieok') && !lget('cookieok',null) && !document.getElementById('cfCookie')){ var cb=document.createElement('div'); cb.id='cfCookie'; cb.style.cssText='position:fixed;left:12px;right:12px;bottom:12px;z-index:99992;background:#0f1222;color:#fff;border-radius:12px;padding:14px 16px;display:flex;gap:12px;align-items:center;flex-wrap:wrap;box-shadow:0 10px 30px rgba(0,0,0,.3);font-size:.88rem'; var link=o.cookieLink?(' <a href="'+o.cookieLink+'" style="color:#a5b4fc">Learn more</a>'):''; cb.innerHTML='<span style="flex:1;min-width:200px">'+esc(o.cookieText||'We use cookies to improve your experience.')+link+'</span><button id="cfCookieOk" style="background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#fff;border:0;border-radius:9px;padding:9px 18px;font-weight:700;cursor:pointer">'+esc(o.cookieBtn||'Got it')+'</button>'; document.body.appendChild(cb); document.getElementById('cfCookieOk').onclick=function(){try{localStorage.setItem(PFX+'cookieok','1');}catch(e){}cb.style.display='none';}; } }catch(e){}
    /* ---- popup / newsletter (once per session) ---- */
    try{ if(o.popupOn && o.popupText && !isAdmin && !lget('popupseen',null)){ var delay=(parseInt(o.popupDelay,10)||8)*1000; setTimeout(function(){ if(document.getElementById('cfPop'))return; var ov=document.createElement('div'); ov.id='cfPop'; ov.style.cssText='position:fixed;inset:0;z-index:99995;background:rgba(15,18,34,.55);display:flex;align-items:center;justify-content:center;padding:20px'; var link=o.popupLink||'#'; ov.innerHTML='<div style="background:#fff;color:#0f1222;max-width:400px;width:100%;border-radius:18px;padding:26px;text-align:center;position:relative;font-family:Inter,system-ui,sans-serif"><span id="cfPopX" style="position:absolute;right:14px;top:10px;cursor:pointer;font-size:1.4rem;color:#94a3b8">\u00d7</span><h2 style="margin:4px 0 8px">'+esc(o.popupTitle||'Stay updated')+'</h2><p style="color:#64708a;margin:0 0 16px">'+esc(o.popupText)+'</p><a href="'+link+'" style="display:inline-block;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#fff;text-decoration:none;border-radius:10px;padding:11px 24px;font-weight:700">'+esc(o.popupBtn||'Subscribe')+'</a></div>'; document.body.appendChild(ov); try{localStorage.setItem(PFX+'popupseen','1');}catch(e){} function close(){ov.style.display='none';} document.getElementById('cfPopX').onclick=close; ov.onclick=function(e){if(e.target===ov)close();}; },delay); } }catch(e){}
  }
  if(document.readyState!=='loading')apply(); else document.addEventListener('DOMContentLoaded',apply);
})();

/* ============================================================
   cf-phase1  (appended)  -  Client-side UX upgrades site-wide:
   PWA (service-worker + install prompt), auto breadcrumbs +
   BreadcrumbList schema, "/" search shortcut, floating dark-mode
   toggle. ES5-safe, idempotent, each in try/catch.
   ============================================================ */
(function(){
  'use strict';
  if(window.__CF_PHASE1)return; window.__CF_PHASE1=1;
  var PFX='calcverse:';
  function lget(k,d){try{var v=localStorage.getItem(PFX+k);return v==null?d:JSON.parse(v);}catch(e){return d;}}
  function lset(k,v){try{localStorage.setItem(PFX+k,JSON.stringify(v));}catch(e){}}
  var path=location.pathname||'/';
  var isUtility=/^\/(admin|pay-admin|login|signup|account|forgot-password)/.test(path)||/(login|signup|account|forgot-password)\.html$/.test(path);

  /* ---- 1. Service worker (PWA + offline) ---- */
  try{ if('serviceWorker' in navigator){ window.addEventListener('load',function(){ navigator.serviceWorker.register('/sw.js').catch(function(){}); }); } }catch(e){}

  function ready(fn){ if(document.readyState!=='loading')fn(); else document.addEventListener('DOMContentLoaded',fn); }

  ready(function(){
    var o=lget('cfoverride',{})||{};

    /* ---- 2. PWA install button ---- */
    try{
      var standalone=window.matchMedia&&window.matchMedia('(display-mode: standalone)').matches;
      if(!standalone){
        window.addEventListener('beforeinstallprompt',function(ev){
          ev.preventDefault(); window.__cfInstall=ev;
          if(document.getElementById('cfInstall'))return;
          var b=document.createElement('button'); b.id='cfInstall'; b.type='button';
          b.innerHTML='\u2b07\uFE0F Install app';
          b.style.cssText='position:fixed;left:16px;bottom:16px;z-index:99989;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#fff;border:0;border-radius:999px;padding:11px 18px;font-weight:700;font-family:inherit;cursor:pointer;box-shadow:0 6px 18px rgba(79,70,229,.4)';
          document.body.appendChild(b);
          b.onclick=function(){ var e=window.__cfInstall; if(!e)return; e.prompt(); e.userChoice.then(function(){ b.remove(); window.__cfInstall=null; }); };
        });
        window.addEventListener('appinstalled',function(){ var b=document.getElementById('cfInstall'); if(b)b.remove(); });
      }
    }catch(e){}

    /* ---- 3. Breadcrumbs (visible + schema) ---- */
    try{
      var parts=path.split('/').filter(Boolean);
      var isFile=/\.[a-z0-9]+$/i.test(parts[parts.length-1]||'');
      if(parts.length>=1 && !isUtility && !isFile){
        function label(s){ return decodeURIComponent(s).replace(/-/g,' ').replace(/\b\w/g,function(c){return c.toUpperCase();}); }
        var origin=location.origin, acc='', items=[{name:'Home',url:origin+'/'}];
        for(var i=0;i<parts.length;i++){ acc+='/'+parts[i]; items.push({name:label(parts[i]),url:origin+acc+'/'}); }
        /* schema */
        var li=items.map(function(it,idx){ return {'@type':'ListItem','position':idx+1,'name':it.name,'item':it.url}; });
        var hasBc=Array.prototype.some.call(document.querySelectorAll('script[type="application/ld+json"]'),function(sc){return /BreadcrumbList/.test(sc.textContent||'');});
        if(!hasBc){ var ld=document.createElement('script'); ld.type='application/ld+json';
        ld.textContent=JSON.stringify({'@context':'https://schema.org','@type':'BreadcrumbList','itemListElement':li});
        document.head.appendChild(ld); }
        /* visible */
        if(!document.querySelector('.cf-crumbs,.crumbs,.breadcrumb,.cf-breadcrumb,.breadcrumbs,[data-breadcrumb],[class*="breadcrumb"],nav[aria-label="breadcrumb"]')){
          var host=document.querySelector('main')||document.getElementById('main');
          if(host){
            var nav=document.createElement('nav'); nav.className='cf-crumbs'; nav.setAttribute('aria-label','breadcrumb');
            nav.style.cssText='max-width:1200px;margin:10px auto 0;padding:6px 16px;font-size:.82rem;color:#64708a';
            var html=''; for(var j=0;j<items.length;j++){ if(j)html+=' <span style="opacity:.5">\u203a</span> '; if(j<items.length-1)html+='<a href="'+items[j].url+'" style="color:#4f46e5;text-decoration:none">'+items[j].name+'</a>'; else html+='<span>'+items[j].name+'</span>'; }
            nav.innerHTML=html; host.insertBefore(nav,host.firstChild);
          }
        }
      }
    }catch(e){}

    /* ---- 4. "/" keyboard shortcut to focus search ---- */
    try{
      document.addEventListener('keydown',function(e){
        if(e.key!=='/'||e.ctrlKey||e.metaKey||e.altKey)return;
        var t=e.target, tag=(t&&t.tagName||'').toLowerCase();
        if(tag==='input'||tag==='textarea'||(t&&t.isContentEditable))return;
        var s=document.querySelector('#heroSearch,#globalSearch,#searchInput,input[type=search]');
        if(s){ e.preventDefault(); s.focus(); s.select&&s.select(); }
      });
    }catch(e){}

    /* ---- 5. Floating dark-mode toggle (only if page has none) ---- */
    try{
      if(o.showThemeToggle!==false && !document.getElementById('themeBtn') && !document.getElementById('themeToggle') && !document.getElementById('cfTheme')){
        var saved=lget('theme',null);
        if(saved==='dark'||saved==='light'){ document.documentElement.setAttribute('data-theme',saved); }
        var cur=document.documentElement.getAttribute('data-theme')||'light';
        var tb=document.createElement('button'); tb.id='cfTheme'; tb.type='button'; tb.setAttribute('aria-label','Toggle dark mode');
        tb.innerHTML=(cur==='dark')?'\u2600\uFE0F':'\uD83C\uDF19';
        tb.style.cssText='position:fixed;right:16px;bottom:70px;z-index:99990;width:44px;height:44px;border:0;border-radius:50%;background:#fff;color:#4f46e5;font-size:1.1rem;cursor:pointer;box-shadow:0 4px 14px rgba(23,20,60,.18);border:1px solid #e6e8f2';
        document.body.appendChild(tb);
        tb.onclick=function(){ var c=document.documentElement.getAttribute('data-theme')==='dark'?'light':'dark'; document.documentElement.setAttribute('data-theme',c); lset('theme',c); tb.innerHTML=(c==='dark')?'\u2600\uFE0F':'\uD83C\uDF19'; };
      }
    }catch(e){}
  });
})();

/* ===== allfreecalculators.in Phase 4: analytics beacon, A/B testing, GA4, multi-language ===== */
(function () {
  if (window.__CF_PHASE4) return; window.__CF_PHASE4 = 1;
  var PFX = 'calcverse:';
  function lget(k, d) { try { var v = localStorage.getItem(PFX + k); return v == null ? d : v; } catch (e) { return d; } }
  function lset(k, v) { try { localStorage.setItem(PFX + k, v); } catch (e) {} }
  function cfg() { try { return JSON.parse(localStorage.getItem(PFX + 'cfoverride') || '{}'); } catch (e) { return {}; } }
  var O = cfg();
  var path = location.pathname;
  var isAdmin = /\/(admin|pay-admin|admin-pro|admin-enterprise)/.test(path);

  /* ---- A/B testing: assign a stable variant per experiment ---- */
  try {
    var abRaw = lget('ab_assign', null); var ab = abRaw ? JSON.parse(abRaw) : {};
    function pickVariant(exp) {
      var key = exp.id; if (ab[key]) return ab[key];
      var variants = (exp.variants && exp.variants.length) ? exp.variants : ['A', 'B'];
      var v = variants[Math.floor(Math.random() * variants.length)];
      ab[key] = v; lset('ab_assign', JSON.stringify(ab)); return v;
    }
    fetch('/api/ab/config').then(function (r) { return r.json(); }).then(function (d) {
      var exps = (d && d.experiments) || [];
      exps.forEach(function (exp) {
        if (!exp || !exp.id || exp.active === false) return;
        var v = pickVariant(exp);
        document.documentElement.setAttribute('data-ab-' + exp.id, v);
        if (exp.apply && exp.apply[v]) {
          try {
            var a = exp.apply[v];
            if (a.css) { var st = document.createElement('style'); st.textContent = a.css; document.head.appendChild(st); }
            if (a.text && a.selector) { var elx = document.querySelector(a.selector); if (elx) elx.textContent = a.text; }
          } catch (e) {}
        }
      });
    }).catch(function () {});
  } catch (e) {}

  /* ---- First-party analytics beacon (sampled server-side, DNT-aware) ---- */
  try {
    var dnt = (navigator.doNotTrack === '1' || window.doNotTrack === '1');
    if (!dnt && O.analyticsBeacon !== false && !isAdmin) {
      var payload = JSON.stringify({ path: path.slice(0, 120), ref: ((document.referrer || '').replace(/^https?:\/\//, '').split('/')[0]) || 'direct', ab: (lget('ab_assign', '') ? 'set' : '') });
      setTimeout(function () {
        try {
          if (navigator.sendBeacon) { navigator.sendBeacon('/api/analytics/hit', new Blob([payload], { type: 'application/json' })); }
          else { fetch('/api/analytics/hit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload, keepalive: true }); }
        } catch (e) {}
      }, 1200);
    }
  } catch (e) {}

  /* ---- GA4 auto-loader (only if a G-XXXX id is configured in admin) ---- */
  try {
    var ga = O.gaId || O.ga4Id || O.googleAnalyticsId || '';
    if (ga && /^G-/.test(ga) && !window.__CF_GA) {
      window.__CF_GA = 1;
      var g = document.createElement('script'); g.async = true; g.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(ga); document.head.appendChild(g);
      window.dataLayer = window.dataLayer || []; function gtag() { window.dataLayer.push(arguments); } window.gtag = window.gtag || gtag;
      window.gtag('js', new Date()); window.gtag('config', ga, { anonymize_ip: true });
    }
  } catch (e) {}

  /* ---- Multi-language i18n (UI chrome + [data-i18n] elements) ---- */
  try {
    var DICT = {
      en: { search: 'Search', home: 'Home', categories: 'Categories', popular: 'Popular', favorites: 'Favorites', about: 'About', contact: 'Contact', privacy: 'Privacy', terms: 'Terms', login: 'Login', signup: 'Sign up', account: 'Account', pricing: 'Pricing', dark: 'Dark mode', language: 'Language' },
      hi: { search: '\u0916\u094b\u091c\u0947\u0902', home: '\u0939\u094b\u092e', categories: '\u0936\u094d\u0930\u0947\u0923\u093f\u092f\u093e\u0901', popular: '\u0932\u094b\u0915\u092a\u094d\u0930\u093f\u092f', favorites: '\u092a\u0938\u0902\u0926\u0940\u0926\u093e', about: '\u092a\u0930\u093f\u091a\u092f', contact: '\u0938\u0902\u092a\u0930\u094d\u0915', privacy: '\u0917\u094b\u092a\u0928\u0940\u092f\u0924\u093e', terms: '\u0936\u0930\u094d\u0924\u0947\u0902', login: '\u0932\u0949\u0917\u093f\u0928', signup: '\u0938\u093e\u0907\u0928 \u0905\u092a', account: '\u0916\u093e\u0924\u093e', pricing: '\u092e\u0942\u0932\u094d\u092f', dark: '\u0921\u093e\u0930\u094d\u0915 \u092e\u094b\u0921', language: '\u092d\u093e\u0937\u093e' },
      es: { search: 'Buscar', home: 'Inicio', categories: 'Categor\u00edas', popular: 'Popular', favorites: 'Favoritos', about: 'Acerca de', contact: 'Contacto', privacy: 'Privacidad', terms: 'T\u00e9rminos', login: 'Entrar', signup: 'Registrarse', account: 'Cuenta', pricing: 'Precios', dark: 'Modo oscuro', language: 'Idioma' }
    };
    var LNAMES = { en: 'English', hi: '\u0939\u093f\u0928\u094d\u0926\u0940', es: 'Espa\u00f1ol' };
    function applyLang(lang) {
      var d = DICT[lang] || DICT.en;
      document.documentElement.setAttribute('lang', lang);
      document.querySelectorAll('[data-i18n]').forEach(function (el) { var k = el.getAttribute('data-i18n'); if (d[k]) el.textContent = d[k]; });
      document.querySelectorAll('[data-i18n-ph]').forEach(function (el) { var k = el.getAttribute('data-i18n-ph'); if (d[k]) el.setAttribute('placeholder', d[k]); });
    }
    var enabledLangs = (O.languages && O.languages.length) ? O.languages : ['en', 'hi', 'es'];
    if (O.showLangSwitcher !== false && !isAdmin) {
      var cur = lget('lang', (navigator.language || 'en').slice(0, 2));
      if (enabledLangs.indexOf(cur) < 0) cur = 'en';
      applyLang(cur);
      if (!document.getElementById('cfLang')) {
        var sel = document.createElement('select'); sel.id = 'cfLang'; sel.setAttribute('aria-label', 'Language');
        sel.style.cssText = 'position:fixed;right:16px;bottom:122px;z-index:99990;border-radius:22px;border:1px solid #e6e8f2;background:#fff;color:#4f46e5;font-weight:600;padding:8px 10px;cursor:pointer;box-shadow:0 4px 14px rgba(23,20,60,.18)';
        enabledLangs.forEach(function (l) { var op = document.createElement('option'); op.value = l; op.textContent = LNAMES[l] || l; if (l === cur) op.selected = true; sel.appendChild(op); });
        sel.onchange = function () { lset('lang', sel.value); applyLang(sel.value); };
        document.body.appendChild(sel);
      }
    }
  } catch (e) {}
})();

/* ===== allfreecalculators.in Phase 5: notifications, gamification, SEO auto-fix, UX ===== */
(function () {
  if (window.__CF_PHASE5) return; window.__CF_PHASE5 = 1;
  var PFX = 'calcverse:';
  function lget(k, d) { try { var v = localStorage.getItem(PFX + k); return v == null ? d : v; } catch (e) { return d; } }
  function lset(k, v) { try { localStorage.setItem(PFX + k, v); } catch (e) {} }
  var path = location.pathname;
  var isAdmin = /\/(admin|pay-admin|admin-pro|admin-enterprise)/.test(path);

  /* ---- SEO auto-fix: add meta description / OG / canonical if missing ---- */
  try {
    var head = document.head;
    function metaByName(n) { return document.querySelector('meta[name="' + n + '"]'); }
    function metaByProp(p) { return document.querySelector('meta[property="' + p + '"]'); }
    var title = (document.title || 'allfreecalculators.in').trim();
    var firstP = document.querySelector('main p, article p, p');
    var desc = (metaByName('description') && metaByName('description').content) || (firstP ? firstP.textContent.trim().slice(0, 155) : title);
    if (!metaByName('description') && desc) { var m = document.createElement('meta'); m.name = 'description'; m.content = desc; head.appendChild(m); }
    if (!document.querySelector('link[rel="canonical"]')) { var l = document.createElement('link'); l.rel = 'canonical'; l.href = location.origin + path; head.appendChild(l); }
    if (!metaByProp('og:title')) { var o1 = document.createElement('meta'); o1.setAttribute('property', 'og:title'); o1.content = title; head.appendChild(o1); }
    if (!metaByProp('og:description') && desc) { var o2 = document.createElement('meta'); o2.setAttribute('property', 'og:description'); o2.content = desc; head.appendChild(o2); }
    if (!metaByProp('og:type')) { var o3 = document.createElement('meta'); o3.setAttribute('property', 'og:type'); o3.content = 'website'; head.appendChild(o3); }
    if (!metaByName('twitter:card')) { var tw = document.createElement('meta'); tw.name = 'twitter:card'; tw.content = 'summary_large_image'; head.appendChild(tw); }
  } catch (e) {}

  /* ---- External-link security: rel=noopener + target for offsite links ---- */
  try {
    var host = location.hostname;
    Array.prototype.forEach.call(document.querySelectorAll('a[href^="http"]'), function (a) {
      try { var u = new URL(a.href); if (u.hostname && u.hostname !== host) { a.setAttribute('rel', 'noopener noreferrer nofollow'); if (!a.getAttribute('target')) a.setAttribute('target', '_blank'); } } catch (e) {}
    });
  } catch (e) {}

  if (isAdmin) return; /* the widgets below are for the public site only */

  /* ---- Scroll-to-top button ---- */
  try {
    var top = document.createElement('button'); top.id = 'cfTop'; top.type = 'button'; top.setAttribute('aria-label', 'Scroll to top'); top.innerHTML = '\u2191';
    top.style.cssText = 'position:fixed;right:16px;bottom:174px;z-index:99990;width:44px;height:44px;border:0;border-radius:50%;background:#4f46e5;color:#fff;font-size:1.2rem;cursor:pointer;box-shadow:0 4px 14px rgba(23,20,60,.18);display:none';
    top.onclick = function () { window.scrollTo({ top: 0, behavior: 'smooth' }); };
    document.body.appendChild(top);
    window.addEventListener('scroll', function () { top.style.display = (window.scrollY > 500) ? 'block' : 'none'; }, { passive: true });
  } catch (e) {}

  /* ---- Gamification: visit streak + tools-used badges ---- */
  try {
    var today = new Date().toISOString().slice(0, 10);
    var last = lget('lastVisit', ''); var streak = parseInt(lget('streak', '0'), 10) || 0;
    if (last !== today) {
      var y = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      streak = (last === y) ? streak + 1 : 1;
      lset('streak', String(streak)); lset('lastVisit', today);
      var visits = (parseInt(lget('visitCount', '0'), 10) || 0) + 1; lset('visitCount', String(visits));
    }
    // count a "tool used" when a calculator id is present
    if (window.__CALC_ID) {
      var used = {}; try { used = JSON.parse(lget('toolsUsed', '{}')); } catch (e) { used = {}; }
      used[window.__CALC_ID] = (used[window.__CALC_ID] || 0) + 1; lset('toolsUsed', JSON.stringify(used));
    }
    window.CFGamify = {
      streak: function () { return parseInt(lget('streak', '0'), 10) || 0; },
      visits: function () { return parseInt(lget('visitCount', '0'), 10) || 0; },
      toolsUsed: function () { try { return Object.keys(JSON.parse(lget('toolsUsed', '{}'))).length; } catch (e) { return 0; } },
      badges: function () {
        var b = []; var s = this.streak(), v = this.visits(), t = this.toolsUsed();
        if (v >= 1) b.push({ icon: '\uD83C\uDF31', name: 'Newcomer' });
        if (s >= 3) b.push({ icon: '\uD83D\uDD25', name: '3-day streak' });
        if (s >= 7) b.push({ icon: '\u26A1', name: 'Week warrior' });
        if (t >= 5) b.push({ icon: '\uD83E\uDDEE', name: 'Explorer (5 tools)' });
        if (t >= 20) b.push({ icon: '\uD83C\uDFC6', name: 'Power user (20 tools)' });
        if (v >= 30) b.push({ icon: '\uD83D\uDC8E', name: 'Loyal (30 visits)' });
        return b;
      }
    };
  } catch (e) {}

  /* ---- Notifications center (bell + dropdown from /api/announce) ---- */
  try {
    var bell = document.createElement('div'); bell.id = 'cfBell';
    bell.style.cssText = 'position:fixed;right:16px;bottom:226px;z-index:99991';
    bell.innerHTML = '<button type="button" aria-label="Notifications" style="width:44px;height:44px;border:0;border-radius:50%;background:#fff;color:#4f46e5;font-size:1.1rem;cursor:pointer;box-shadow:0 4px 14px rgba(23,20,60,.18);position:relative">\uD83D\uDD14<span id="cfBellDot" style="display:none;position:absolute;top:6px;right:6px;width:10px;height:10px;background:#ef4444;border-radius:50%;border:2px solid #fff"></span></button><div id="cfBellBox" style="display:none;position:absolute;right:0;bottom:52px;width:300px;max-height:360px;overflow:auto;background:#fff;border:1px solid #e6e8f2;border-radius:12px;box-shadow:0 10px 30px rgba(23,20,60,.22);padding:8px"></div>';
    var seen = lget('notifSeen', '');
    fetch('/api/announce').then(function (r) { return r.json(); }).then(function (d) {
      var items = (d && d.items) || [];
      // also surface gamification badges as a friendly local notification
      var box = bell.querySelector('#cfBellBox'); var dot = bell.querySelector('#cfBellDot');
      var html = '';
      if (!items.length) html += '<div style="padding:12px;color:#64708a;font-size:13px">No new notifications.</div>';
      items.forEach(function (it) {
        html += '<div style="padding:10px;border-bottom:1px solid #f0f1f6"><div style="font-weight:700;font-size:13px">' + (it.title || '') + '</div><div style="font-size:12px;color:#64708a">' + (it.body || '') + '</div>' + (it.url ? '<a href="' + it.url + '" style="font-size:12px;color:#4f46e5">Open</a>' : '') + '</div>';
      });
      box.innerHTML = html;
      var sig = items.map(function (i) { return i.title; }).join('|');
      if (sig && sig !== seen) dot.style.display = 'block';
      bell.querySelector('button').onclick = function () { var open = box.style.display === 'block'; box.style.display = open ? 'none' : 'block'; if (!open) { dot.style.display = 'none'; lset('notifSeen', sig); } };
      document.addEventListener('click', function (e) { if (!bell.contains(e.target)) box.style.display = 'none'; });
    }).catch(function () {});
    document.body.appendChild(bell);
  } catch (e) {}

  /* ---- Cookie / privacy consent banner (once) ---- */
  try {
    if (!lget('cookieConsent', '')) {
      var cb = document.createElement('div');
      cb.style.cssText = 'position:fixed;left:0;right:0;bottom:0;z-index:99995;background:#0f1020;color:#fff;padding:14px 16px;font-size:13px;display:flex;gap:12px;align-items:center;justify-content:center;flex-wrap:wrap';
      cb.innerHTML = '<span>We use cookies &amp; local storage for preferences and privacy-first analytics. See our <a href="/utilities/privacy/" style="color:#a5b4fc">Privacy Policy</a>.</span>';
      var ok = document.createElement('button'); ok.textContent = 'Got it'; ok.style.cssText = 'background:#4f46e5;color:#fff;border:0;border-radius:8px;padding:8px 16px;font-weight:700;cursor:pointer';
      ok.onclick = function () { lset('cookieConsent', '1'); cb.remove(); };
      cb.appendChild(ok); document.body.appendChild(cb);
    }
  } catch (e) {}
})();

/* ===== allfreecalculators.in Phase 6: command palette, a11y toolbar, share, UX ===== */
(function () {
  if (window.__CF_PHASE6) return; window.__CF_PHASE6 = 1;
  var PFX = 'calcverse:';
  function lget(k, d) { try { var v = localStorage.getItem(PFX + k); return v == null ? d : v; } catch (e) { return d; } }
  function lset(k, v) { try { localStorage.setItem(PFX + k, v); } catch (e) {} }
  var path = location.pathname;
  var isAdmin = /\/(admin|pay-admin|admin-pro|admin-enterprise)/.test(path);

  /* ---- Skip-to-content link (a11y) ---- */
  try {
    if (!document.getElementById('cfSkip')) {
      var main = document.querySelector('main'); if (main && !main.id) main.id = 'cfMain';
      var sk = document.createElement('a'); sk.id = 'cfSkip'; sk.href = '#' + (main ? main.id : 'cfMain'); sk.textContent = 'Skip to content';
      sk.style.cssText = 'position:fixed;left:8px;top:-60px;z-index:100000;background:#4f46e5;color:#fff;padding:10px 14px;border-radius:8px;transition:top .2s;text-decoration:none';
      sk.addEventListener('focus', function () { sk.style.top = '8px'; }); sk.addEventListener('blur', function () { sk.style.top = '-60px'; });
      document.body.insertBefore(sk, document.body.firstChild);
    }
  } catch (e) {}

  /* ---- Scroll progress bar ---- */
  try {
    var bar = document.createElement('div'); bar.id = 'cfProg';
    bar.style.cssText = 'position:fixed;left:0;top:0;height:3px;width:0;background:linear-gradient(90deg,#4f46e5,#7c3aed);z-index:100000;transition:width .1s';
    document.body.appendChild(bar);
    window.addEventListener('scroll', function () { var h = document.documentElement.scrollHeight - window.innerHeight; var p = h > 0 ? (window.scrollY / h) * 100 : 0; bar.style.width = p + '%'; }, { passive: true });
  } catch (e) {}

  if (isAdmin) return;

  /* ---- Command palette (Ctrl/Cmd+K) ---- */
  try {
    var links = [];
    function gather() {
      links = [];
      var seen = {};
      Array.prototype.forEach.call(document.querySelectorAll('header a[href], nav a[href], footer a[href]'), function (a) {
        var t = (a.textContent || '').trim(); var href = a.getAttribute('href');
        if (t && href && href.length > 1 && !seen[t] && !/^https?:/.test(href)) { seen[t] = 1; links.push({ t: t, h: href }); }
      });
      [['Home', '/'], ['All tools', '/converters/all-calculators-converter/'], ['Pricing', '/pricing/'], ['Blog', '/blog/'], ['FAQ', '/faq/'], ['Contact', '/utilities/contact/']].forEach(function (p) { if (!seen[p[0]]) { links.push({ t: p[0], h: p[1] }); seen[p[0]] = 1; } });
    }
    var ov = document.createElement('div'); ov.id = 'cfCmd';
    ov.style.cssText = 'position:fixed;inset:0;z-index:100001;background:rgba(15,16,32,.45);display:none;align-items:flex-start;justify-content:center;padding-top:12vh';
    ov.innerHTML = '<div style="width:min(560px,92vw);background:#fff;border-radius:14px;box-shadow:0 20px 60px rgba(0,0,0,.3);overflow:hidden"><input id="cfCmdIn" placeholder="Type to search tools &amp; pages\u2026" style="width:100%;border:0;padding:16px;font-size:16px;outline:none;box-sizing:border-box;border-bottom:1px solid #eee"/><div id="cfCmdList" style="max-height:50vh;overflow:auto"></div></div>';
    document.body.appendChild(ov);
    var inp = ov.querySelector('#cfCmdIn'), list = ov.querySelector('#cfCmdList'), sel = 0, filtered = [];
    function render(q) {
      q = (q || '').toLowerCase(); filtered = links.filter(function (l) { return l.t.toLowerCase().indexOf(q) >= 0; }).slice(0, 40);
      if (q && 'search'.indexOf(q) < 0) filtered.unshift({ t: 'Search "' + q + '" in all tools', h: '/converters/all-calculators-converter/?q=' + encodeURIComponent(q), s: 1 });
      sel = 0;
      list.innerHTML = filtered.map(function (l, i) { return '<div class="cfCmdRow" data-i="' + i + '" style="padding:12px 16px;cursor:pointer;font-size:14px;' + (i === 0 ? 'background:#eef2ff' : '') + '">' + (l.s ? '\uD83D\uDD0D ' : '\u2192 ') + l.t + '</div>'; }).join('') || '<div style="padding:16px;color:#888">No matches</div>';
      Array.prototype.forEach.call(list.querySelectorAll('.cfCmdRow'), function (r) { r.onclick = function () { go(filtered[+r.getAttribute('data-i')]); }; });
    }
    function go(l) { if (l) location.href = l.h; }
    function open() { gather(); ov.style.display = 'flex'; inp.value = ''; render(''); setTimeout(function () { inp.focus(); }, 30); }
    function close() { ov.style.display = 'none'; }
    inp.addEventListener('input', function () { render(inp.value); });
    inp.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); sel = Math.min(sel + 1, filtered.length - 1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); sel = Math.max(sel - 1, 0); }
      else if (e.key === 'Enter') { e.preventDefault(); go(filtered[sel]); return; }
      else return;
      Array.prototype.forEach.call(list.querySelectorAll('.cfCmdRow'), function (r, i) { r.style.background = (i === sel) ? '#eef2ff' : ''; if (i === sel) r.scrollIntoView({ block: 'nearest' }); });
    });
    ov.addEventListener('click', function (e) { if (e.target === ov) close(); });
    document.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) { e.preventDefault(); (ov.style.display === 'flex') ? close() : open(); }
      else if (e.key === 'Escape') close();
    });
    window.CFCommand = { open: open };
  } catch (e) {}

  /* ---- Keyboard shortcuts help modal ( ? ) ---- */
  try {
    document.addEventListener('keydown', function (e) {
      if (e.key !== '?' || e.ctrlKey || e.metaKey) return;
      var tag = (e.target && e.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || (e.target && e.target.isContentEditable)) return;
      var m = document.getElementById('cfKeys');
      if (m) { m.remove(); return; }
      m = document.createElement('div'); m.id = 'cfKeys';
      m.style.cssText = 'position:fixed;inset:0;z-index:100001;background:rgba(15,16,32,.45);display:flex;align-items:center;justify-content:center';
      m.innerHTML = '<div style="background:#fff;border-radius:14px;padding:22px;width:min(420px,92vw);box-shadow:0 20px 60px rgba(0,0,0,.3)"><h3 style="margin:0 0 12px">Keyboard shortcuts</h3><table style="width:100%;font-size:14px"><tr><td><kbd>/</kbd></td><td>Focus search</td></tr><tr><td><kbd>Ctrl</kbd>+<kbd>K</kbd></td><td>Command palette</td></tr><tr><td><kbd>?</kbd></td><td>This help</td></tr><tr><td><kbd>Esc</kbd></td><td>Close dialogs</td></tr></table><button style="margin-top:14px;background:#4f46e5;color:#fff;border:0;border-radius:9px;padding:9px 16px;font-weight:700;cursor:pointer">Got it</button></div>';
      m.addEventListener('click', function (ev) { if (ev.target === m || ev.target.tagName === 'BUTTON') m.remove(); });
      document.body.appendChild(m);
    });
  } catch (e) {}

  /* ---- Accessibility toolbar (left side, single button) ---- */
  try {
    var A = JSON.parse(lget('a11y', '{}')) || {};
    function applyA() {
      var r = document.documentElement;
      r.style.setProperty('--cf-font-scale', (A.font || 1));
      document.body.style.fontSize = (A.font && A.font !== 1) ? (A.font * 100) + '%' : '';
      document.body.classList.toggle('cf-contrast', !!A.contrast);
      document.body.classList.toggle('cf-dyslexic', !!A.dyslexic);
      if (A.motion) r.style.scrollBehavior = 'auto';
    }
    if (!document.getElementById('cfA11yStyle')) {
      var s = document.createElement('style'); s.id = 'cfA11yStyle';
      s.textContent = '.cf-contrast{filter:contrast(1.25) saturate(1.2)}.cf-contrast a{text-decoration:underline}.cf-dyslexic,.cf-dyslexic *{font-family:Verdana,Tahoma,sans-serif !important;letter-spacing:.03em;word-spacing:.1em;line-height:1.7 !important}@media(prefers-reduced-motion:reduce){*{animation-duration:.001ms !important;transition-duration:.001ms !important}}';
      document.head.appendChild(s);
    }
    applyA();
    var btn = document.createElement('button'); btn.id = 'cfA11y'; btn.type = 'button'; btn.setAttribute('aria-label', 'Accessibility options'); btn.innerHTML = '\u267F';
    btn.style.cssText = 'position:fixed;left:16px;bottom:16px;z-index:99990;width:44px;height:44px;border:0;border-radius:50%;background:#fff;color:#4f46e5;font-size:1.2rem;cursor:pointer;box-shadow:0 4px 14px rgba(23,20,60,.18);border:1px solid #e6e8f2';
    var panel = document.createElement('div'); panel.id = 'cfA11yBox';
    panel.style.cssText = 'position:fixed;left:16px;bottom:70px;z-index:99991;width:230px;background:#fff;border:1px solid #e6e8f2;border-radius:12px;box-shadow:0 10px 30px rgba(23,20,60,.22);padding:12px;display:none;font-size:14px';
    panel.innerHTML = '<div style="font-weight:700;margin-bottom:8px">Accessibility</div>' +
      '<div style="display:flex;gap:8px;align-items:center;margin-bottom:8px">Text <button data-a="fdown" style="flex:1">A-</button><button data-a="fup" style="flex:1">A+</button></div>' +
      '<label style="display:block;margin:6px 0"><input type="checkbox" data-a="contrast"/> High contrast</label>' +
      '<label style="display:block;margin:6px 0"><input type="checkbox" data-a="dyslexic"/> Readable font</label>' +
      '<label style="display:block;margin:6px 0"><input type="checkbox" data-a="motion"/> Reduce motion</label>' +
      '<button data-a="read" style="width:100%;margin-top:6px;background:#4f46e5;color:#fff;border:0;border-radius:8px;padding:8px;cursor:pointer">\uD83D\uDD0A Read page aloud</button>' +
      '<button data-a="reset" style="width:100%;margin-top:6px;background:#6b7280;color:#fff;border:0;border-radius:8px;padding:8px;cursor:pointer">Reset</button>';
    panel.querySelectorAll('button, input').forEach(function (el) {}); // noop to keep structure
    document.body.appendChild(btn); document.body.appendChild(panel);
    var cbC = panel.querySelector('[data-a="contrast"]'), cbD = panel.querySelector('[data-a="dyslexic"]'), cbM = panel.querySelector('[data-a="motion"]');
    cbC.checked = !!A.contrast; cbD.checked = !!A.dyslexic; cbM.checked = !!A.motion;
    function save() { lset('a11y', JSON.stringify(A)); applyA(); }
    btn.onclick = function () { panel.style.display = panel.style.display === 'block' ? 'none' : 'block'; };
    panel.querySelector('[data-a="fup"]').onclick = function () { A.font = Math.min((A.font || 1) + 0.1, 1.6); save(); };
    panel.querySelector('[data-a="fdown"]').onclick = function () { A.font = Math.max((A.font || 1) - 0.1, 0.8); save(); };
    cbC.onchange = function () { A.contrast = cbC.checked; save(); };
    cbD.onchange = function () { A.dyslexic = cbD.checked; save(); };
    cbM.onchange = function () { A.motion = cbM.checked; save(); };
    panel.querySelector('[data-a="reset"]').onclick = function () { A = {}; cbC.checked = cbD.checked = cbM.checked = false; save(); };
    panel.querySelector('[data-a="read"]').onclick = function () {
      try { if (window.speechSynthesis.speaking) { window.speechSynthesis.cancel(); return; } var main = document.querySelector('main') || document.body; var u = new SpeechSynthesisUtterance((main.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 4000)); window.speechSynthesis.speak(u); } catch (e) {}
    };
  } catch (e) {}

  /* ---- Share + "Was this helpful?" appended to content pages ---- */
  try {
    var main = document.querySelector('main');
    var isHome = (path === '/' || path === '/index.html');
    if (main && !isHome && !document.getElementById('cfShare')) {
      var wrap = document.createElement('div'); wrap.id = 'cfShare';
      wrap.style.cssText = 'max-width:900px;margin:22px auto;padding:14px 16px;border-top:1px solid #eef0f6;display:flex;gap:10px;flex-wrap:wrap;align-items:center';
      var u = encodeURIComponent(location.href), t = encodeURIComponent(document.title || 'allfreecalculators.in');
      wrap.innerHTML = '<span style="font-weight:600;font-size:14px">Share:</span>' +
        '<a target="_blank" rel="noopener" href="https://wa.me/?text=' + t + '%20' + u + '">WhatsApp</a>' +
        '<a target="_blank" rel="noopener" href="https://t.me/share/url?url=' + u + '&text=' + t + '">Telegram</a>' +
        '<a target="_blank" rel="noopener" href="https://twitter.com/intent/tweet?url=' + u + '&text=' + t + '">X</a>' +
        '<a target="_blank" rel="noopener" href="https://www.facebook.com/sharer/sharer.php?u=' + u + '">Facebook</a>' +
        '<button id="cfCopyLink" style="background:#eef2ff;color:#4f46e5;border:0;border-radius:8px;padding:6px 12px;cursor:pointer;font-weight:600">Copy link</button>' +
        '<span style="margin-left:auto;font-size:14px">Was this helpful? <button id="cfHelpY" style="cursor:pointer;border:0;background:#ecfdf5;border-radius:8px;padding:6px 10px">\uD83D\uDC4D</button> <button id="cfHelpN" style="cursor:pointer;border:0;background:#fef2f2;border-radius:8px;padding:6px 10px">\uD83D\uDC4E</button></span>';
      main.appendChild(wrap);
      wrap.querySelector('#cfCopyLink').onclick = function () { try { navigator.clipboard.writeText(location.href); this.textContent = 'Copied!'; } catch (e) {} };
      function fb(v) { try { var p = JSON.stringify({ path: path.slice(0, 120), ref: 'helpful:' + v }); if (navigator.sendBeacon) navigator.sendBeacon('/api/analytics/hit', new Blob([p], { type: 'application/json' })); } catch (e) {} }
      wrap.querySelector('#cfHelpY').onclick = function () { fb('yes'); this.textContent = '\uD83D\uDC4D Thanks!'; };
      wrap.querySelector('#cfHelpN').onclick = function () { fb('no'); this.parentNode.innerHTML = 'Thanks \u2014 <a href="/utilities/contact/">tell us what to improve</a>.'; };
    }
  } catch (e) {}
})();
