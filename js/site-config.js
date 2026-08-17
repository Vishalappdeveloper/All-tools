/* ============================================================
 * allfreecalculators.in - site config injector.
 * Reads settings from window.CALCVERSE_SITE (site-config-data.js)
 * and, if a backend is configured, from the live admin panel
 * (GET {apiBase}/settings/site). Then injects:
 *   - Custom <head> code
 *   - Google / Bing site verification meta tags
 *   - Google Analytics 4 (GA4)
 *   - Google Tag Manager (GTM)
 *   - Google AdSense loader
 *   - Custom body-start and body-end code
 * Idempotent: har cheez sirf ek baar inject hoti hai.
 * ============================================================ */
(function () {
  if (window.__CALCVERSE_SITE_CONFIG_DONE) return;
  window.__CALCVERSE_SITE_CONFIG_DONE = true;

  var injectedFlags = {};

  function val(cfg, key) {
    var v = cfg ? cfg[key] : undefined;
    if (v && typeof v === 'object' && 'value' in v) v = v.value; // tolerate {value:..}
    return v == null ? '' : v;
  }

  // Inject a raw HTML string into a target element (head or body).
  function injectHtml(html, target, flag) {
    if (!html || injectedFlags[flag]) return;
    injectedFlags[flag] = true;
    var tpl = document.createElement('template');
    tpl.innerHTML = html;
    var nodes = Array.prototype.slice.call(tpl.content.childNodes);
    nodes.forEach(function (n) {
      // <script> from template doesn't execute; recreate it so it runs.
      if (n.tagName === 'SCRIPT') {
        var s = document.createElement('script');
        for (var i = 0; i < n.attributes.length; i++) {
          s.setAttribute(n.attributes[i].name, n.attributes[i].value);
        }
        s.text = n.textContent;
        target.appendChild(s);
      } else {
        target.appendChild(n);
      }
    });
  }

  function meta(name, content) {
    if (!content) return;
    if (document.querySelector('meta[name="' + name + '"][data-cv-injected]')) return;
    var m = document.createElement('meta');
    m.setAttribute('name', name);
    m.setAttribute('content', content);
    m.setAttribute('data-cv-injected', '1');
    document.head.appendChild(m);
  }

  function loadScript(src, attrs) {
    if (document.querySelector('script[src="' + src + '"]')) return;
    var s = document.createElement('script');
    s.src = src;
    s.async = true;
    if (attrs) Object.keys(attrs).forEach(function (k) { s.setAttribute(k, attrs[k]); });
    document.head.appendChild(s);
  }

  function applyHead(cfg) {
    // Branding -> theme color + brand text
    var color = val(cfg, 'site.primaryColor');
    if (color) {
      var tc = document.querySelector('meta[name="theme-color"]');
      if (tc) tc.setAttribute('content', color);
      try { document.documentElement.style.setProperty('--brand', color); } catch (e) {}
    }
    var name = val(cfg, 'site.name');
    if (name) {
      document.querySelectorAll('[data-brand]').forEach(function (n) {
        // keep any <small> child (e.g. "2895+ tools")
        var small = n.querySelector('small');
        n.textContent = name;
        if (small) n.appendChild(small);
      });
    }

    // Site verification metas
    meta('google-site-verification', val(cfg, 'integrations.googleSiteVerification'));
    meta('msvalidate.01', val(cfg, 'integrations.bingSiteVerification'));

    // Custom head code
    injectHtml(val(cfg, 'integrations.headCode'), document.head, 'headCode');

    // Google Tag Manager
    var gtm = val(cfg, 'integrations.gtmId');
    if (gtm && !injectedFlags.gtm) {
      injectedFlags.gtm = true;
      (function (w, d, s, l, i) {
        w[l] = w[l] || []; w[l].push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
        var f = d.getElementsByTagName(s)[0], j = d.createElement(s), dl = l != 'dataLayer' ? '&l=' + l : '';
        j.async = true; j.src = 'https://www.googletagmanager.com/gtm.js?id=' + i + dl;
        f.parentNode.insertBefore(j, f);
      })(window, document, 'script', 'dataLayer', gtm);
    }

    // Google Analytics 4
    var ga4 = val(cfg, 'integrations.ga4Id');
    if (ga4 && !injectedFlags.ga4) {
      injectedFlags.ga4 = true;
      loadScript('https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(ga4));
      window.dataLayer = window.dataLayer || [];
      window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
      window.gtag('js', new Date());
      window.gtag('config', ga4);
    }

    // Google AdSense loader
    var ads = val(cfg, 'integrations.adsenseClient');
    if (ads && !injectedFlags.adsense) {
      injectedFlags.adsense = true;
      loadScript('https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + encodeURIComponent(ads),
        { crossorigin: 'anonymous' });
    }
  }

  function applyBody(cfg) {
    if (!document.body) return;
    // GTM noscript (body-start) if GTM set
    var gtm = val(cfg, 'integrations.gtmId');
    if (gtm && !injectedFlags.gtmNoscript) {
      injectedFlags.gtmNoscript = true;
      var ns = document.createElement('noscript');
      ns.innerHTML = '<iframe src="https://www.googletagmanager.com/ns.html?id=' + gtm +
        '" height="0" width="0" style="display:none;visibility:hidden"></iframe>';
      document.body.insertBefore(ns, document.body.firstChild);
    }
    injectHtml(val(cfg, 'integrations.bodyStartCode'), document.body, 'bodyStart');
    // body-end code appended at the end
    injectHtml(val(cfg, 'integrations.bodyEndCode'), document.body, 'bodyEnd');
  }

  function apply(cfg) {
    if (!cfg) return;
    try { applyHead(cfg); } catch (e) {}
    if (document.body) { try { applyBody(cfg); } catch (e) {} }
    else document.addEventListener('DOMContentLoaded', function () { try { applyBody(cfg); } catch (e) {} });
  }

  // 1) Apply local config immediately (head code + verification works even offline).
  var local = window.CALCVERSE_SITE || {};
  apply(local);

  // 2) If backend configured, fetch live settings and merge (backend wins for non-empty values).
  var api = window.CALCVERSE_API_BASE || (function () {
    try { return localStorage.getItem('calcverse:apiBase') || ''; } catch (e) { return ''; }
  })();
  if (api) {
    var url = api.replace(/\/$/, '') + '/settings/site';
    fetch(url, { credentials: 'omit' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (json) {
        var data = json && (json.data || json);
        if (!data || typeof data !== 'object') return;
        var merged = Object.assign({}, local);
        Object.keys(data).forEach(function (k) {
          var v = data[k];
          if (v !== '' && v != null) merged[k] = v;
        });
        try { window.CALCVERSE_SITE = merged; } catch (e) {}
        apply(merged);
      })
      .catch(function () {});
  }
})();
