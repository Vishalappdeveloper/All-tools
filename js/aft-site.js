/* aft-site.js — applies admin Header/Footer/Homepage/Theme design settings to the live site.
   Reads public settings from /api/aft/settings/<key>. Fully defensive: only acts when data + target exist.
   Falls back silently (no backend / offline) so static pages keep working. */
(function () {
  'use strict';
  var API = '/api/aft/settings/';
  function get(key) {
    return fetch(API + key, { credentials: 'same-origin' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) { return d && d.value ? d.value : null; })
      .catch(function () { return null; });
  }
  function el(tag, attrs, html) {
    var e = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) { if (attrs[k] != null) e.setAttribute(k, attrs[k]); });
    if (html != null) e.innerHTML = html;
    return e;
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]; }); }
  function truthy(v) { return v === true || v === 'true' || v === 1 || v === '1' || v === 'on'; }
  function lines(v) { return String(v || '').split(/\n+/).map(function (s) { return s.trim(); }).filter(Boolean); }
  function pipe(line) { return line.split('|').map(function (s) { return s.trim(); }); }

  // ---------- THEME ----------
  function applyTheme(t) {
    if (!t) return;
    var r = document.documentElement.style;
    if (t.th_brand) { r.setProperty('--brand', t.th_brand); r.setProperty('--accent', t.th_accent || t.th_brand); }
    if (t.th_accent) r.setProperty('--accent', t.th_accent);
    if (t.th_bg) r.setProperty('--bg', t.th_bg);
    if (t.th_text) r.setProperty('--text', t.th_text);
    if (t.th_radius) r.setProperty('--radius', /px|%|em|rem/.test(t.th_radius) ? t.th_radius : t.th_radius + 'px');
    if (t.th_font) { document.body.style.fontFamily = t.th_font; }
    if (t.th_brand) {
      var mc = document.querySelector('meta[name="theme-color"]');
      if (mc) mc.setAttribute('content', t.th_brand);
    }
    if (truthy(t.th_dark_default) && !localStorage.getItem('aft_theme')) {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }

  // ---------- HEADER ----------
  function applyHeader(h) {
    if (!h) return;
    var hdr = document.querySelector('.aft-header') || document.querySelector('header');
    if (!hdr) return;
    if (h.hdr_bg) hdr.style.background = h.hdr_bg;
    if (h.hdr_fg) hdr.style.color = h.hdr_fg;
    if (truthy(h.hdr_sticky)) { hdr.style.position = 'sticky'; hdr.style.top = '0'; hdr.style.zIndex = '50'; }
    // logo / brand
    if (h.hdr_logo) {
      var logo = hdr.querySelector('.aft-logo');
      if (!logo) { logo = el('a', { href: '/', class: 'aft-logo', style: 'font-weight:800;font-size:18px;text-decoration:none;color:inherit;display:flex;flex-direction:column;line-height:1.1' }); hdr.insertBefore(logo, hdr.firstChild); }
      logo.innerHTML = esc(h.hdr_logo) + (h.hdr_tagline ? '<small style="font-weight:400;font-size:11px;opacity:.7">' + esc(h.hdr_tagline) + '</small>' : '');
    }
    // nav links
    if (h.hdr_nav) {
      var nav = hdr.querySelector('nav');
      if (nav) {
        var extra = lines(h.hdr_nav).map(function (l) { var p = pipe(l); return '<a href="' + esc(p[1] || '#') + '" style="color:inherit;text-decoration:none">' + esc(p[0]) + '</a>'; }).join('');
        var holder = nav.querySelector('.aft-nav-custom');
        if (!holder) { holder = el('span', { class: 'aft-nav-custom', style: 'display:contents' }); nav.insertBefore(holder, nav.firstChild); }
        holder.innerHTML = extra;
      }
    }
    // CTA button
    if (h.hdr_cta_text) {
      var cta = hdr.querySelector('.aft-cta');
      if (!cta) { cta = el('a', { class: 'aft-cta', style: 'background:var(--brand,#F6931F);color:#fff;padding:8px 14px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px' }); hdr.appendChild(cta); }
      cta.textContent = h.hdr_cta_text; cta.href = h.hdr_cta_url || '#';
    }
  }

  // ---------- FOOTER ----------
  function applyFooter(f) {
    if (!f) return;
    var ftr = document.querySelector('.aft-footer') || document.querySelector('footer');
    if (!ftr) return;
    if (f.ftr_bg) ftr.style.background = f.ftr_bg;
    if (f.ftr_fg) ftr.style.color = f.ftr_fg;
    var parts = [];
    if (f.ftr_about) parts.push('<div style="max-width:600px;margin:0 auto 16px;font-size:14px;opacity:.85">' + esc(f.ftr_about) + '</div>');
    if (f.ftr_cols) {
      var groups = {};
      lines(f.ftr_cols).forEach(function (l) { var p = pipe(l); var head = p[0] || 'Links'; (groups[head] = groups[head] || []).push('<a href="' + esc(p[2] || '#') + '" style="color:inherit;text-decoration:none;display:block;margin:3px 0;opacity:.85">' + esc(p[1] || p[0]) + '</a>'); });
      var cols = Object.keys(groups).map(function (h) { return '<div style="min-width:140px;text-align:left"><strong style="display:block;margin-bottom:6px">' + esc(h) + '</strong>' + groups[h].join('') + '</div>'; }).join('');
      if (cols) parts.push('<div style="display:flex;gap:32px;flex-wrap:wrap;justify-content:center;margin:0 auto 18px;max-width:900px">' + cols + '</div>');
    }
    if (f.ftr_social) {
      var soc = lines(f.ftr_social).map(function (l) { var p = pipe(l); return '<a href="' + esc(p[1] || '#') + '" style="color:inherit;text-decoration:none;margin:0 8px;opacity:.85">' + esc(p[0]) + '</a>'; }).join('');
      if (soc) parts.push('<div style="margin:0 auto 12px">' + soc + '</div>');
    }
    if (parts.length) {
      var box = ftr.querySelector('.aft-footer-custom');
      if (!box) { box = el('div', { class: 'aft-footer-custom' }); ftr.insertBefore(box, ftr.firstChild); }
      box.innerHTML = parts.join('');
    }
    if (f.ftr_copyright) {
      var cp = ftr.querySelector('.aft-copyright');
      if (!cp) { cp = el('div', { class: 'aft-copyright', style: 'margin-top:10px;font-size:13px;opacity:.7' }); ftr.appendChild(cp); }
      cp.textContent = f.ftr_copyright;
    }
  }

  // ---------- HOMEPAGE ----------
  function applyHome(h) {
    if (!h) return;
    if (h.home_announce) {
      if (!document.querySelector('.aft-announce')) {
        var bar = el('div', { class: 'aft-announce', style: 'background:var(--brand,#F6931F);color:#fff;text-align:center;padding:8px 14px;font-size:14px;font-weight:500' }, esc(h.home_announce));
        document.body.insertBefore(bar, document.body.firstChild);
      }
    }
    var isHome = location.pathname === '/' || /\/index\.html$/.test(location.pathname);
    if (!isHome) return;
    var hero = document.querySelector('.hero');
    if (hero) {
      if (h.home_hero_title) { var ht = hero.querySelector('h1'); if (ht) ht.textContent = h.home_hero_title; }
      if (h.home_hero_sub) { var hs = hero.querySelector('p'); if (hs) hs.textContent = h.home_hero_sub; }
      if (h.home_cta_text) {
        var hc = hero.querySelector('.aft-home-cta');
        if (!hc) { hc = el('a', { class: 'aft-home-cta', style: 'display:inline-block;margin-top:14px;background:var(--brand,#F6931F);color:#fff;padding:11px 22px;border-radius:10px;text-decoration:none;font-weight:600' }); hero.appendChild(hc); }
        hc.textContent = h.home_cta_text; hc.href = h.home_cta_url || '/tools/';
      }
    }
  }

  function run() {
    Promise.all([get('theme'), get('header'), get('footer'), get('homepage')]).then(function (r) {
      try { applyTheme(r[0]); } catch (e) {}
      try { applyHeader(r[1]); } catch (e) {}
      try { applyFooter(r[2]); } catch (e) {}
      try { applyHome(r[3]); } catch (e) {}
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run); else run();
})();
