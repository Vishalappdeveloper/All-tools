/* allfreecalculators.in - header auth widget.
   SECURITY: this now asks the server (session cookie via api/me.php) who is
   logged in, instead of trusting client-side localStorage/Firebase tokens
   that a user could forge in devtools. */
(function () {
  function apply(user) {
    var outs = document.querySelectorAll('.afc-a-out');
    var dash = document.querySelectorAll('.afc-a-dash');
    var i;
    for (i = 0; i < dash.length; i++) dash[i].style.display = user ? '' : 'none';
    for (i = 0; i < outs.length; i++) outs[i].style.display = user ? 'none' : '';
    if (user) {
      for (i = 0; i < dash.length; i++) {
        var name = (user.name || user.email || 'Account');
        name = String(name).split('@')[0];
        dash[i].textContent = '\uD83D\uDC64 ' + name;
        dash[i].setAttribute('title', 'Open your dashboard');
      }
    }
  }
  function init() {
    fetch('/api/auth/me', { credentials: 'same-origin' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) { apply(data && data.ok ? data.user : null); })
      .catch(function () { apply(null); });
  }
  if (document.readyState !== 'loading') init();
  else document.addEventListener('DOMContentLoaded', init);
})();
