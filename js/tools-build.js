/* tools-build.js \u2013 registers every tool in root.__MEGA into CS.Calc and SEO
   (TOOLS, ORDER, CATS). Loads after all tool family files. */
(function (root) {
  'use strict';
  var isNode = (typeof module !== 'undefined' && module.exports);
  if (isNode) require('./tools-interactive.js'); // pulls in mega -> families -> web -> interactive
  var SEO = isNode ? require('./seo-data.js') : root.SEO;
  if (isNode) { require('./seo-data-extra.js'); }
  var MEGA = root.__MEGA || [];
  var CS = root.CS;

  function catSlug(name) { return String(name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''); }
  function isConvCat(cat) { return /Converter/i.test(cat); }

  var CAT_DESC = {
    'Web & Developer Tools': 'Encoders, formatters, converters and utilities for developers.',
    'SEO Tools': 'Meta, keyword and on-page SEO helper tools.',
    'Image Tools': 'Resize, convert, compress and edit images in your browser.',
    'PDF Tools': 'Create and convert PDFs locally \u2013 your files never leave your device.',
    'Text Tools': 'Counters, converters and transformers for text.',
    'Generators': 'Generate passwords, UUIDs, codes and random data.',
    'Color Tools': 'Convert and explore color formats (HEX, RGB, HSL).'
  };
  MEGA.forEach(function (t) {
    if (!SEO.CATS[t.cat]) SEO.CATS[t.cat] = { slug: catSlug(t.cat), desc: CAT_DESC[t.cat] || (t.cat + ' tools and converters.') };
  });

  var byCat = {};
  MEGA.forEach(function (t) { (byCat[t.cat] = byCat[t.cat] || []).push(t.id); });
  function relatedFor(cat, id) {
    var list = byCat[cat] || [], out = [];
    for (var i = 0; i < list.length && out.length < 4; i++) { if (list[i] !== id) out.push(list[i]); }
    return out;
  }
  function defaultFaqs(t) {
    var conv = isConvCat(t.cat);
    return [
      { q: 'Is ' + t.name + ' free to use?', a: 'Yes \u2013 every tool on CalcSuite is 100% free, with no sign-up required.' },
      { q: 'Does it work on mobile and offline?', a: 'Yes. The site is fully mobile-responsive and works offline once loaded (PWA).' },
      { q: conv ? 'Are the conversions accurate?' : 'How accurate are the results?', a: conv ? 'Conversions use standard internationally-accepted factors for precise results.' : 'Results are computed instantly in your browser using the correct formulas.' }
    ];
  }

  var registered = 0, added = 0;
  MEGA.forEach(function (t) {
    if (CS && CS.Calc && typeof CS.Calc.register === 'function' && typeof t.def === 'function') {
      CS.Calc.register({ id: t.id, name: t.name, category: t.cat, icon: t.icon, description: t.blurb, render: t.def, interactive: !!t.interactive });
      registered++;
    }
    if (!SEO.TOOLS[t.id]) {
      var conv = isConvCat(t.cat);
      var core = (t.options && t.options.length) ? t.options : [];
      SEO.TOOLS[t.id] = {
        slug: t.slug || t.id,
        cat: t.cat,
        icon: t.icon,
        name: t.name,
        title: t.name + ' \u2013 Free Online ' + (conv ? 'Converter' : 'Tool'),
        desc: t.blurb,
        keywords: t.kw || (t.name.toLowerCase()),
        intro: t.blurb,
        options: SEO.buildOptions(core),
        faqs: (t.faqs && t.faqs.length) ? t.faqs : defaultFaqs(t),
        related: relatedFor(t.cat, t.id),
        interactive: !!t.interactive
      };
      if (SEO.ORDER.indexOf(t.id) === -1) { SEO.ORDER.push(t.id); added++; }
    }
  });

  if (isNode) { console.error('[tools-build] registered=' + registered + ' seoAdded=' + added + ' totalOrder=' + SEO.ORDER.length); module.exports = SEO; }
})(typeof window !== 'undefined' ? window : globalThis);
