/* allfreecalculators.in smart search - autocomplete for hero box + A-Z filter. Uses window.NUMORA_TOOLS */
(function () {
  function data() { return window.NUMORA_TOOLS || []; }
  function norm(s) { return (s || '').toLowerCase(); }

  function match(q, limit) {
    q = norm(q.trim());
    var out = [];
    if (!q) return out;
    var d = data();
    for (var i = 0; i < d.length && out.length < limit; i++) {
      if (norm(d[i].n).indexOf(q) > -1) out.push(d[i]);
    }
    return out;
  }

  // public helper used by hero button
  window.NumoraSearch = function () {
    var input = document.getElementById('heroSearch');
    if (!input || !input.value) return;
    var res = match(input.value, 1);
    if (res.length) window.location.href = res[0].u;
  };

  function attachAutocomplete(input) {
    var wrap = input.parentNode;
    if (wrap && getComputedStyle(wrap).position === 'static') wrap.style.position = 'relative';
    var box = document.createElement('div');
    box.className = 'ac-box';
    box.style.display = 'none';
    wrap.appendChild(box);
    function render() {
      var res = match(input.value, 8);
      box.innerHTML = '';
      if (!res.length) { box.style.display = 'none'; return; }
      res.forEach(function (r) {
        var a = document.createElement('a');
        a.className = 'ac-item';
        a.href = r.u;
        a.textContent = r.n;
        box.appendChild(a);
      });
      box.style.display = 'block';
    }
    input.addEventListener('input', render);
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        var first = box.querySelector('.ac-item');
        if (first) { e.preventDefault(); window.location.href = first.getAttribute('href'); }
      }
    });
    document.addEventListener('click', function (e) {
      if (e.target !== input && !box.contains(e.target)) box.style.display = 'none';
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    var hero = document.getElementById('heroSearch');
    if (hero) attachAutocomplete(hero);
    var filt = document.getElementById('azFilter');
    if (filt) {
      filt.addEventListener('input', function () {
        var q = norm(filt.value.trim());
        var items = document.querySelectorAll('#azList a');
        var shownByGroup = {};
        items.forEach(function (a) {
          var ok = a.textContent.toLowerCase().indexOf(q) > -1;
          a.style.display = ok ? '' : 'none';
          var g = a.getAttribute('data-group');
          if (ok) shownByGroup[g] = true;
        });
        document.querySelectorAll('#azList .az-group').forEach(function (grp) {
          var g = grp.getAttribute('data-group');
          grp.style.display = (!q || shownByGroup[g]) ? '' : 'none';
        });
      });
    }
  });
})();
