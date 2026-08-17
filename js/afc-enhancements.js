/* allfreecalculators.in - sitewide enhancements: cookie consent, back-to-top, newsletter widget, announcement banner. Loaded alongside afc-auth.js. */
(function () {
  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  function initCookieConsent() {
    try {
      if (localStorage.getItem('afc_cookie_consent')) return;
    } catch (e) {}
    var bar = document.createElement('div');
    bar.setAttribute('id', 'afc-cookie-consent');
    bar.style.cssText = 'position:fixed;left:0;right:0;bottom:0;z-index:9999;background:#0f172a;color:#fff;padding:14px 18px;display:flex;flex-wrap:wrap;gap:12px;align-items:center;justify-content:center;font:14px -apple-system,Segoe UI,Roboto,Arial,sans-serif;box-shadow:0 -4px 20px rgba(0,0,0,.2)';
    bar.innerHTML = '<span>We use cookies to improve your experience. See our <a href="/cookie-policy/" style="color:#a5b4fc">Cookie Policy</a>.</span><button id="afc-cookie-accept" style="background:#4f46e5;color:#fff;border:0;padding:8px 16px;border-radius:8px;font-weight:700;cursor:pointer">Accept</button>';
    document.body.appendChild(bar);
    document.getElementById('afc-cookie-accept').addEventListener('click', function () {
      try { localStorage.setItem('afc_cookie_consent', '1'); } catch (e) {}
      bar.remove();
    });
  }

  function initBackToTop() {
    var btn = document.createElement('button');
    btn.setAttribute('id', 'afc-back-to-top');
    btn.setAttribute('aria-label', 'Back to top');
    btn.textContent = 'Top';
    btn.style.cssText = 'position:fixed;right:20px;bottom:20px;z-index:9998;display:none;background:linear-gradient(90deg,#4f46e5,#7c3aed);color:#fff;border:0;width:44px;height:44px;border-radius:50%;font-weight:700;font-size:11px;cursor:pointer;box-shadow:0 6px 20px rgba(79,70,229,.35)';
    document.body.appendChild(btn);
    window.addEventListener('scroll', function () {
      btn.style.display = window.scrollY > 400 ? 'block' : 'none';
    });
    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  function initAnnouncementBanner() {
    fetch('/api/announcements/active', { credentials: 'same-origin' })
      .then(function (r) { return r.ok ? r.json() : { items: [] }; })
      .then(function (data) {
        var items = (data && data.items) || [];
        if (!items.length) return;
        var a = items[0];
        var dismissedKey = 'afc_announcement_dismissed_' + a.id;
        try { if (localStorage.getItem(dismissedKey)) return; } catch (e) {}
        var bar = document.createElement('div');
        bar.style.cssText = 'background:#4f46e5;color:#fff;text-align:center;padding:10px 16px;font:14px -apple-system,Segoe UI,Roboto,Arial,sans-serif;position:relative';
        bar.innerHTML = '<strong>' + (a.title || '') + '</strong> ' + (a.body || '') + ' <span style="cursor:pointer;position:absolute;right:16px;top:8px" id="afc-ann-close">\u2715</span>';
        document.body.insertBefore(bar, document.body.firstChild);
        var close = document.getElementById('afc-ann-close');
        if (close) close.addEventListener('click', function () {
          try { localStorage.setItem(dismissedKey, '1'); } catch (e) {}
          bar.remove();
        });
      })
      .catch(function () {});
  }

  function initNewsletterWidgets() {
    var forms = document.querySelectorAll('.afc-newsletter-form');
    for (var i = 0; i < forms.length; i++) {
      (function (form) {
        form.addEventListener('submit', function (e) {
          e.preventDefault();
          var input = form.querySelector('input[type=email]');
          var msg = form.querySelector('.afc-newsletter-msg');
          if (!input || !input.value) return;
          fetch('/api/newsletter/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: input.value, source: location.pathname })
          }).then(function (r) { return r.json(); }).then(function (d) {
            if (msg) msg.textContent = d.ok ? 'Subscribed! Thank you.' : (d.error || 'Something went wrong.');
            if (d.ok) input.value = '';
          }).catch(function () { if (msg) msg.textContent = 'Network error. Try again.'; });
        });
      })(forms[i]);
    }
  }

  ready(function () {
    initCookieConsent();
    initBackToTop();
    initAnnouncementBanner();
    initNewsletterWidgets();
  });
})();
