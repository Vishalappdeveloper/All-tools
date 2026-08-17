/* tools-mega.js \u2013 2500+ additional working tools (converters + text/generator/color/web/image/pdf families).
   Browser + Node compatible. Registers into CS.Calc and auto-generates SEO into SEO.TOOLS/ORDER/CATS. */
(function (root) {
  'use strict';
  var isNode = (typeof module !== 'undefined' && module.exports);
  var SEO = isNode ? require('./seo-data.js') : root.SEO;
  if (isNode) { require('./seo-data-extra.js'); require('./tools-300.js'); }
  var CS = root.CS || {};

  /* ---------------- helpers ---------------- */
  function cfmt(n) {
    if (n == null || typeof n === 'string') return n == null ? '\u2014' : n;
    if (!isFinite(n)) return '\u2014';
    var a = Math.abs(n);
    if (a !== 0 && (a >= 1e15 || a < 1e-6)) return n.toExponential(6).replace(/\.?0+e/, 'e');
    var s = (Math.round(n * 1e6) / 1e6).toString();
    return s;
  }
  function commafy(s) {
    var p = String(s).split('.'); p[0] = p[0].replace(/\B(?=(\d{3})+(?!\d))/g, ','); return p.join('.');
  }
  function num(v) { var x = parseFloat(v); return isFinite(x) ? x : 0; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]; }); }
  function title(s) { return String(s).replace(/(^|[\s-])([a-z])/g, function (m, a, b) { return a + b.toUpperCase(); }); }

  /* ---------------- generic calc engine (browser + smoke compatible) ---------------- */
  function mk(def) {
    return function () {
      var wrap = CS.el('div', { class: 'calc-wrap' });
      var inputs = {};
      (def.inputs || []).forEach(function (f) {
        var node;
        if (f.t === 'sel') node = CS.selectInput(f.opts || [], { value: f.v });
        else if (f.t === 'text' || f.t === 'date' || f.t === 'time' || f.t === 'color') node = CS.el('input', { type: f.t === 'text' ? 'text' : f.t, value: f.v != null ? f.v : '' });
        else if (f.t === 'area') node = CS.el('textarea', { value: f.v != null ? f.v : '' });
        else node = CS.numInput({ value: f.v != null ? f.v : 0, step: f.step });
        inputs[f.k] = node;
        if (node.addEventListener) { node.addEventListener('input', schedule); node.addEventListener('change', schedule); }
        wrap.appendChild(CS.field ? CS.field(f.label, node, f.hint) : node);
      });
      var res = CS.el('div', { class: 'calc-res' });
      wrap.appendChild(res);
      function readv() {
        var v = {};
        (def.inputs || []).forEach(function (f) {
          var n = inputs[f.k];
          v[f.k] = (f.t === 'text' || f.t === 'sel' || f.t === 'date' || f.t === 'time' || f.t === 'area' || f.t === 'color') ? n.value : parseFloat(n.value);
        });
        return v;
      }
      function run() {
        var v = readv(), out;
        try { out = def.calc(v); } catch (e) { out = [['Error', e.message]]; }
        res.innerHTML = '';
        (out || []).forEach(function (r) { res.appendChild(CS.kpi ? CS.kpi(r[0], r[1], r[2]) : CS.el('div')); });
        if (def.note) { var nt = CS.el('div', { class: 'calc-note' }); nt.innerHTML = def.note; res.appendChild(nt); }
      }
      var timer;
      function schedule() { setTimeout(run, 0); }
      schedule();
      return wrap;
    };
  }

  /* ---------------- collection ---------------- */
  var MEGA = [];
  function push(o) { MEGA.push(o); }

  /* ================= UNIT CONVERTERS (pairwise) ================= */
  /* factor = number of base units in one of this unit. */
  var CONV = {
    'Length Converters': { icon: '\uD83D\uDCCF', base: 'meter', units: {
      kilometers: 1000, meters: 1, decimeters: 0.1, centimeters: 0.01, millimeters: 0.001,
      micrometers: 1e-6, nanometers: 1e-9, miles: 1609.344, yards: 0.9144, feet: 0.3048,
      inches: 0.0254, 'nautical-miles': 1852, furlongs: 201.168, fathoms: 1.8288,
      'light-years': 9.4607304725808e15, 'astronomical-units': 1.495978707e11 } },
    'Weight & Mass Converters': { icon: '\u2696\uFE0F', base: 'gram', units: {
      tonnes: 1e6, kilograms: 1000, grams: 1, milligrams: 0.001, micrograms: 1e-6,
      pounds: 453.59237, ounces: 28.349523125, stones: 6350.29318, carats: 0.2,
      grains: 0.06479891, 'short-tons': 907184.74, 'long-tons': 1016046.9088,
      quintals: 100000, slugs: 14593.903 } },
    'Volume Converters': { icon: '\uD83E\uDDCA', base: 'liter', units: {
      liters: 1, milliliters: 0.001, 'cubic-meters': 1000, 'cubic-centimeters': 0.001,
      'cubic-feet': 28.316846592, 'cubic-inches': 0.016387064, 'us-gallons': 3.785411784,
      'uk-gallons': 4.54609, 'us-quarts': 0.946352946, 'us-pints': 0.473176473,
      'us-cups': 0.2365882365, 'us-fluid-ounces': 0.0295735295625, 'us-tablespoons': 0.01478676478,
      'us-teaspoons': 0.00492892159, 'oil-barrels': 158.987294928, 'cubic-yards': 764.554857984 } },
    'Area Converters': { icon: '\uD83D\uDCD0', base: 'square-meter', units: {
      'square-kilometers': 1e6, 'square-meters': 1, 'square-centimeters': 1e-4, 'square-millimeters': 1e-6,
      hectares: 10000, acres: 4046.8564224, 'square-miles': 2589988.110336, 'square-yards': 0.83612736,
      'square-feet': 0.09290304, 'square-inches': 0.00064516, ares: 100, roods: 1011.7141056 } },
    'Speed Converters': { icon: '\uD83C\uDFC3', base: 'meter-per-second', units: {
      'meters-per-second': 1, 'kilometers-per-hour': 0.277777778, 'miles-per-hour': 0.44704,
      knots: 0.514444444, 'feet-per-second': 0.3048, mach: 343, 'kilometers-per-second': 1000,
      'miles-per-second': 1609.344, 'centimeters-per-second': 0.01 } },
    'Time Converters': { icon: '\u23F1\uFE0F', base: 'second', units: {
      nanoseconds: 1e-9, microseconds: 1e-6, milliseconds: 0.001, seconds: 1, minutes: 60,
      hours: 3600, days: 86400, weeks: 604800, months: 2629800, years: 31557600,
      decades: 315576000, centuries: 3155760000 } },
    'Digital Storage Converters': { icon: '\uD83D\uDCBE', base: 'byte', units: {
      bits: 0.125, bytes: 1, kilobytes: 1000, kibibytes: 1024, megabytes: 1e6, mebibytes: 1048576,
      gigabytes: 1e9, gibibytes: 1073741824, terabytes: 1e12, tebibytes: 1.099511627776e12,
      petabytes: 1e15, pebibytes: 1.125899906842624e15 } },
    'Data Transfer Converters': { icon: '\uD83D\uDCE1', base: 'bit-per-second', units: {
      'bits-per-second': 1, 'kilobits-per-second': 1000, 'megabits-per-second': 1e6,
      'gigabits-per-second': 1e9, 'terabits-per-second': 1e12, 'bytes-per-second': 8,
      'kilobytes-per-second': 8000, 'megabytes-per-second': 8e6, 'gigabytes-per-second': 8e9,
      'terabytes-per-second': 8e12 } },
    'Pressure Converters': { icon: '\uD83C\uDF21\uFE0F', base: 'pascal', units: {
      pascals: 1, kilopascals: 1000, megapascals: 1e6, bars: 100000, millibars: 100,
      atmospheres: 101325, psi: 6894.757293, torr: 133.322368, mmhg: 133.322387415, inhg: 3386.389 } },
    'Energy Converters': { icon: '\u26A1', base: 'joule', units: {
      joules: 1, kilojoules: 1000, megajoules: 1e6, calories: 4.184, kilocalories: 4184,
      'watt-hours': 3600, 'kilowatt-hours': 3.6e6, electronvolts: 1.602176634e-19,
      btu: 1055.05585, 'foot-pounds': 1.355817948, therms: 105505585.3 } },
    'Power Converters': { icon: '\uD83D\uDD0B', base: 'watt', units: {
      watts: 1, kilowatts: 1000, megawatts: 1e6, gigawatts: 1e9, milliwatts: 0.001,
      'mechanical-horsepower': 745.699872, 'metric-horsepower': 735.49875,
      'btu-per-hour': 0.29307107, 'foot-pounds-per-second': 1.355817948, 'calories-per-second': 4.184 } },
    'Angle Converters': { icon: '\uD83D\uDCD0', base: 'degree', units: {
      degrees: 1, radians: 57.2957795131, gradians: 0.9, arcminutes: 0.0166666667,
      arcseconds: 0.000277777778, milliradians: 0.0572957795, turns: 360, quadrants: 90 } },
    'Frequency Converters': { icon: '\uD83D\uDCFB', base: 'hertz', units: {
      hertz: 1, kilohertz: 1000, megahertz: 1e6, gigahertz: 1e9, terahertz: 1e12, rpm: 0.0166666667 } },
    'Force Converters': { icon: '\uD83D\uDCA5', base: 'newton', units: {
      newtons: 1, kilonewtons: 1000, dynes: 1e-5, 'pound-force': 4.44822162,
      'kilogram-force': 9.80665, 'ounce-force': 0.278013851, poundals: 0.138254954 } },
    'Typography Converters': { icon: '\uD83D\uDD24', base: 'point', units: {
      points: 1, picas: 12, pixels: 0.75, inches: 72, millimeters: 2.83464567,
      centimeters: 28.3464567, ems: 12, twips: 0.05 } },
    'Cooking Converters': { icon: '\uD83C\uDF73', base: 'milliliter', units: {
      milliliters: 1, liters: 1000, teaspoons: 4.92892159, tablespoons: 14.7867648,
      'fluid-ounces': 29.5735296, cups: 236.588237, pints: 473.176473, quarts: 946.352946,
      gallons: 3785.411784, deciliters: 100 } },
    'Acceleration Converters': { icon: '\uD83D\uDE80', base: 'meter-per-second-squared', units: {
      'meters-per-second-squared': 1, 'feet-per-second-squared': 0.3048, 'standard-gravity': 9.80665,
      gal: 0.01, 'kilometers-per-hour-per-second': 0.277777778, 'miles-per-hour-per-second': 0.44704 } },
    'Density Converters': { icon: '\uD83E\uDDCA', base: 'kilogram-per-cubic-meter', units: {
      'kilograms-per-cubic-meter': 1, 'grams-per-cubic-centimeter': 1000, 'grams-per-milliliter': 1000,
      'kilograms-per-liter': 1000, 'grams-per-liter': 1, 'pounds-per-cubic-foot': 16.0184634,
      'pounds-per-cubic-inch': 27679.9047, 'ounces-per-cubic-inch': 1729.994 } },
    'Flow Rate Converters': { icon: '\uD83D\uDEB0', base: 'cubic-meter-per-second', units: {
      'cubic-meters-per-second': 1, 'cubic-meters-per-hour': 0.000277778, 'liters-per-second': 0.001,
      'liters-per-minute': 1.66667e-5, 'liters-per-hour': 2.77778e-7, 'us-gallons-per-minute': 6.30902e-5,
      'cubic-feet-per-second': 0.0283168466, 'cubic-feet-per-minute': 0.000471947 } },
    'Torque Converters': { icon: '\uD83D\uDD27', base: 'newton-meter', units: {
      'newton-meters': 1, 'kilonewton-meters': 1000, 'pound-force-feet': 1.355817948,
      'pound-force-inches': 0.112984829, 'kilogram-force-meters': 9.80665, 'ounce-force-inches': 0.00706155 } },
    'Illuminance Converters': { icon: '\uD83D\uDCA1', base: 'lux', units: {
      lux: 1, 'foot-candles': 10.7639104, phot: 10000, nox: 0.001 } }
  };

  function convDef(fromK, toK, fa, tb) {
    var fromN = title(fromK.replace(/-/g, ' ')), toN = title(toK.replace(/-/g, ' '));
    return mk({
      inputs: [{ k: 'x', label: 'Value in ' + fromN, v: 1 }],
      calc: function (v) {
        var x = isFinite(v.x) ? v.x : 0;
        var base = x * fa, out = base / tb;
        return [
          [fromN, commafy(cfmt(x))],
          [toN, commafy(cfmt(out))],
          ['Formula', '1 ' + fromN + ' = ' + cfmt(fa / tb) + ' ' + toN]
        ];
      }
    });
  }

  Object.keys(CONV).forEach(function (cat) {
    var c = CONV[cat], us = c.units, keys = Object.keys(us);
    keys.forEach(function (fromK) {
      keys.forEach(function (toK) {
        if (fromK === toK) return;
        var fromN = title(fromK.replace(/-/g, ' ')), toN = title(toK.replace(/-/g, ' '));
        var id = fromK + '-to-' + toK;
        push({
          id: id, slug: id, conv: true, cat: cat, icon: c.icon,
          name: fromN + ' to ' + toN,
          kw: [fromK, toK, fromN.toLowerCase(), toN.toLowerCase(), 'convert ' + fromN + ' to ' + toN, c.base + ' converter'].join(', '),
          blurb: 'Convert ' + fromN + ' to ' + toN + ' instantly with this free online converter. Enter a value to get an accurate ' + fromN + ' \u2192 ' + toN + ' result with the exact formula and ratio.',
          def: convDef(fromK, toK, us[fromK], us[toK]),
          faqs: [
            { q: 'How do I convert ' + fromN + ' to ' + toN + '?', a: 'Multiply the value in ' + fromN + ' by ' + cfmt(us[fromK] / us[toK]) + ' to get ' + toN + '. This tool does it instantly as you type.' },
            { q: 'How many ' + toN + ' are in one ' + fromN + '?', a: '1 ' + fromN + ' = ' + cfmt(us[fromK] / us[toK]) + ' ' + toN + '.' },
            { q: 'Is this ' + fromN + ' to ' + toN + ' converter free?', a: 'Yes. It is 100% free, works offline in your browser, and requires no sign-up.' }
          ]
        });
      });
    });
  });

  /* Temperature (offset formulas) */
  var TEMP = { celsius: 'Celsius', fahrenheit: 'Fahrenheit', kelvin: 'Kelvin', rankine: 'Rankine', reaumur: 'Reaumur' };
  function toC(u, x) { return u === 'celsius' ? x : u === 'fahrenheit' ? (x - 32) * 5 / 9 : u === 'kelvin' ? x - 273.15 : u === 'rankine' ? (x - 491.67) * 5 / 9 : x * 5 / 4; }
  function fromC(u, c) { return u === 'celsius' ? c : u === 'fahrenheit' ? c * 9 / 5 + 32 : u === 'kelvin' ? c + 273.15 : u === 'rankine' ? c * 9 / 5 + 491.67 : c * 4 / 5; }
  Object.keys(TEMP).forEach(function (fk) {
    Object.keys(TEMP).forEach(function (tk) {
      if (fk === tk) return;
      var fn = TEMP[fk], tn = TEMP[tk], id = fk + '-to-' + tk;
      push({
        id: id, slug: id, conv: true, cat: 'Temperature Converters', icon: '\uD83C\uDF21\uFE0F',
        name: fn + ' to ' + tn,
        kw: [fk, tk, 'convert ' + fn + ' to ' + tn, 'temperature converter'].join(', '),
        blurb: 'Convert ' + fn + ' to ' + tn + ' temperature instantly. Free online ' + fn + ' \u2192 ' + tn + ' converter with the exact conversion formula.',
        def: mk({ inputs: [{ k: 'x', label: 'Temperature in ' + fn, v: fk === 'kelvin' ? 300 : 25 }], calc: function (v) { var x = isFinite(v.x) ? v.x : 0; var out = fromC(tk, toC(fk, x)); return [[fn, commafy(cfmt(x)) + '\u00B0'], [tn, commafy(cfmt(out)) + '\u00B0']]; } }),
        faqs: [{ q: 'How to convert ' + fn + ' to ' + tn + '?', a: 'Enter the ' + fn + ' value above and the tool instantly shows the ' + tn + ' equivalent using the standard temperature formula.' }, { q: 'Is the conversion accurate?', a: 'Yes, it uses the exact scientific temperature conversion formulas.' }]
      });
    });
  });

  /* Fuel economy (via km/L) */
  var FUEL = { 'km-per-liter': 'Kilometers per Liter', 'liters-per-100km': 'Liters per 100km', 'us-mpg': 'US MPG', 'uk-mpg': 'UK MPG', 'miles-per-liter': 'Miles per Liter' };
  function fuelToKmL(u, x) { return u === 'km-per-liter' ? x : u === 'liters-per-100km' ? (x ? 100 / x : 0) : u === 'us-mpg' ? x * 0.425143707 : u === 'uk-mpg' ? x * 0.354006042 : x * 1.609344; }
  function fuelFromKmL(u, k) { return u === 'km-per-liter' ? k : u === 'liters-per-100km' ? (k ? 100 / k : 0) : u === 'us-mpg' ? k / 0.425143707 : u === 'uk-mpg' ? k / 0.354006042 : k / 1.609344; }
  Object.keys(FUEL).forEach(function (fk) {
    Object.keys(FUEL).forEach(function (tk) {
      if (fk === tk) return;
      var fn = FUEL[fk], tn = FUEL[tk], id = fk + '-to-' + tk;
      push({
        id: id, slug: id, conv: true, cat: 'Fuel Economy Converters', icon: '\u26FD',
        name: fn + ' to ' + tn,
        kw: [fk, tk, 'fuel economy converter', 'mileage converter'].join(', '),
        blurb: 'Convert ' + fn + ' to ' + tn + ' fuel economy instantly. Free online fuel efficiency converter for mileage and consumption.',
        def: mk({ inputs: [{ k: 'x', label: fn, v: 15 }], calc: function (v) { var x = isFinite(v.x) ? v.x : 0; var out = fuelFromKmL(tk, fuelToKmL(fk, x)); return [[fn, commafy(cfmt(x))], [tn, commafy(cfmt(out))]]; } }),
        faqs: [{ q: 'How to convert ' + fn + ' to ' + tn + '?', a: 'Enter your ' + fn + ' value and the tool instantly converts it to ' + tn + '.' }]
      });
    });
  });

  /* Currency (offline static rates, editable in Admin Panel) */
  var CUR = { usd: ['US Dollar', 1], eur: ['Euro', 1.08], gbp: ['British Pound', 1.27], inr: ['Indian Rupee', 0.012], jpy: ['Japanese Yen', 0.0064], aud: ['Australian Dollar', 0.66], cad: ['Canadian Dollar', 0.73], chf: ['Swiss Franc', 1.12], cny: ['Chinese Yuan', 0.14], sgd: ['Singapore Dollar', 0.74], aed: ['UAE Dirham', 0.27], hkd: ['Hong Kong Dollar', 0.128], nzd: ['New Zealand Dollar', 0.61], zar: ['South African Rand', 0.053], brl: ['Brazilian Real', 0.20], rub: ['Russian Ruble', 0.011], krw: ['South Korean Won', 0.00075], mxn: ['Mexican Peso', 0.058], sek: ['Swedish Krona', 0.095], 'try': ['Turkish Lira', 0.031] };
  Object.keys(CUR).forEach(function (fk) {
    Object.keys(CUR).forEach(function (tk) {
      if (fk === tk) return;
      var fn = CUR[fk][0], tn = CUR[tk][0], fr = CUR[fk][1], tr = CUR[tk][1], id = fk + '-to-' + tk;
      push({
        id: id, slug: id, conv: true, cat: 'Currency Converters', icon: '\uD83D\uDCB1',
        name: fn + ' to ' + tn + ' (' + fk.toUpperCase() + ' to ' + tk.toUpperCase() + ')',
        kw: [fk, tk, fk + ' to ' + tk, fn + ' to ' + tn, 'currency converter'].join(', '),
        blurb: 'Convert ' + fn + ' (' + fk.toUpperCase() + ') to ' + tn + ' (' + tk.toUpperCase() + ') with this free offline currency converter. Rates are editable from the Admin Panel; replace with a live feed for production.',
        def: mk({ inputs: [{ k: 'x', label: 'Amount in ' + fk.toUpperCase(), v: 100 }], calc: function (v) { var x = isFinite(v.x) ? v.x : 0; var rate = fr / tr; return [[fk.toUpperCase(), commafy(cfmt(x))], [tk.toUpperCase(), commafy(cfmt(x * rate))], ['Rate', '1 ' + fk.toUpperCase() + ' = ' + cfmt(rate) + ' ' + tk.toUpperCase()]]; } }),
        note: 'Rates are indicative offline values and can be updated in the Admin Panel \u2192 Settings.',
        faqs: [{ q: 'Are these exchange rates live?', a: 'No \u2013 this tool works fully offline using stored indicative rates. You can edit the rates in the Admin Panel, or connect a live exchange-rate API for production use.' }, { q: 'How much is X ' + fk.toUpperCase() + ' in ' + tk.toUpperCase() + '?', a: 'Type the amount above to instantly see the converted ' + tk.toUpperCase() + ' value.' }]
      });
    });
  });

  root.__MEGA = MEGA; // exposed so later chunks can push more before the build loop
  root.__megaHelpers = { mk: mk, push: push, cfmt: cfmt, commafy: commafy, num: num, esc: esc, title: title };
  if (isNode) module.exports = SEO;
})(typeof window !== 'undefined' ? window : globalThis);
