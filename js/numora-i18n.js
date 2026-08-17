/* allfreecalculators.in bilingual (EN/HI) toggle - lightweight, no dependencies */
(function () {
  var KEY = 'numora:lang';
  function apply(lang) {
    document.documentElement.setAttribute('data-lang', lang);
    var btns = document.querySelectorAll('.lang-toggle [data-setlang]');
    for (var i = 0; i < btns.length; i++) {
      btns[i].classList.toggle('active', btns[i].getAttribute('data-setlang') === lang);
    }
  }
  var saved = 'en';
  try { saved = localStorage.getItem(KEY) || 'en'; } catch (e) {}
  apply(saved === 'hi' ? 'hi' : 'en');
  document.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('.lang-toggle [data-setlang]') : null;
    if (!b) return;
    var lang = b.getAttribute('data-setlang');
    try { localStorage.setItem(KEY, lang); } catch (e) {}
    apply(lang);
  });
})();
