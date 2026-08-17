/* 50 additional offline calculators built on a data-driven engine. */
(function () {
  'use strict';
  var C = window.CS, el = C.el;
  var R = C.Calc.register;

  function num(n, d) { return isFinite(n) ? C.fmtNum(n, d == null ? 2 : d) : '\u2014'; }
  function money(n) { return isFinite(n) ? C.fmtMoney(n) : '\u2014'; }
  function opt(v, l) { return { value: v, label: l }; }

  /* ---------- generic engine ---------- */
  function simple(def) {
    return function () {
      var wrap = el('div', { class: 'simplecalc' });
      var grid = el('div', { class: 'cs-grid' });
      var inputs = {};
      def.inputs.forEach(function (f) {
        var node;
        if (f.t === 'sel') node = C.selectInput(f.opts, { value: f.v, onchange: run });
        else if (f.t === 'date' || f.t === 'time' || f.t === 'text') {
          node = el('input', { type: f.t, value: f.v != null ? f.v : '' });
          node.addEventListener('input', run); node.addEventListener('change', run);
        } else node = C.numInput({ value: f.v, step: f.step, oninput: run });
        inputs[f.k] = node;
        grid.appendChild(C.field(f.label, node, f.hint));
      });
      var res = el('div', { class: 'result-area' });
      wrap.appendChild(grid); wrap.appendChild(res);
      function readv() {
        var o = {};
        def.inputs.forEach(function (f) {
          var n = inputs[f.k];
          o[f.k] = (f.t === 'sel' || f.t === 'date' || f.t === 'time' || f.t === 'text') ? n.value : parseFloat(n.value);
        });
        return o;
      }
      function run() {
        var out; try { out = def.calc(readv()); } catch (e) { out = [['Error', 'Check your inputs']]; }
        res.innerHTML = '';
        if (!out || !out.length) return;
        var row = el('div', { class: 'kpi-row' });
        out.forEach(function (p) { row.appendChild(C.kpi(p[0], p[1], { class: p[2] || '' })); });
        res.appendChild(row);
        if (def.note) res.appendChild(el('p', { class: 'calc-note' }, typeof def.note === 'function' ? def.note(readv()) : def.note));
      }
      setTimeout(run, 0);
      return wrap;
    };
  }

  function add(id, name, category, icon, description, def) {
    R({ id: id, name: name, category: category, icon: icon, description: description, render: simple(def) });
  }

  /* ---------- unit converter factory ---------- */
  function conv(units, dec) {
    return {
      inputs: [
        { k: 'amt', label: 'Value', v: 1, step: 'any' },
        { k: 'from', label: 'From', t: 'sel', v: units[0].k, opts: units.map(function (u) { return opt(u.k, u.label); }) },
        { k: 'to', label: 'To', t: 'sel', v: units[1].k, opts: units.map(function (u) { return opt(u.k, u.label); }) }
      ],
      calc: function (v) {
        var f = units.filter(function (u) { return u.k === v.from; })[0];
        var t = units.filter(function (u) { return u.k === v.to; })[0];
        var base = v.amt * f.f, r = base / t.f;
        return [['Result', num(r, dec == null ? 4 : dec) + ' ' + t.k], [v.amt + ' ' + f.k + ' =', num(r, dec == null ? 4 : dec) + ' ' + t.k]];
      }
    };
  }
  function U(k, label, f) { return { k: k, label: label, f: f }; }

  /* =================== MATH (10) =================== */
  add('area', 'Area Calculator', 'Math', '\u25FB', 'Area of rectangle, square, triangle, circle, parallelogram, trapezoid.', {
    inputs: [
      { k: 's', label: 'Shape', t: 'sel', v: 'rectangle', opts: ['rectangle', 'square', 'triangle', 'circle', 'parallelogram', 'trapezoid'].map(function (x) { return opt(x, x[0].toUpperCase() + x.slice(1)); }) },
      { k: 'a', label: 'Length / base / radius (a)', v: 10, step: 'any' },
      { k: 'b', label: 'Width / height / side b', v: 5, step: 'any' },
      { k: 'c', label: 'Height (trapezoid only)', v: 4, step: 'any' }
    ],
    calc: function (v) {
      var A, P;
      switch (v.s) {
        case 'square': A = v.a * v.a; P = 4 * v.a; break;
        case 'triangle': A = 0.5 * v.a * v.b; break;
        case 'circle': A = Math.PI * v.a * v.a; P = 2 * Math.PI * v.a; break;
        case 'parallelogram': A = v.a * v.b; break;
        case 'trapezoid': A = (v.a + v.b) / 2 * v.c; break;
        default: A = v.a * v.b; P = 2 * (v.a + v.b);
      }
      var out = [['Area', num(A)]];
      if (P) out.push([v.s === 'circle' ? 'Circumference' : 'Perimeter', num(P)]);
      return out;
    }
  });
  add('volume', 'Volume Calculator', 'Math', '\uD83D\uDCE6', 'Volume of cube, box, sphere, cylinder and cone.', {
    inputs: [
      { k: 's', label: 'Shape', t: 'sel', v: 'box', opts: ['cube', 'box', 'sphere', 'cylinder', 'cone'].map(function (x) { return opt(x, x[0].toUpperCase() + x.slice(1)); }) },
      { k: 'a', label: 'Side / length / radius (a)', v: 10, step: 'any' },
      { k: 'b', label: 'Width / height (b)', v: 5, step: 'any' },
      { k: 'c', label: 'Depth (box only)', v: 4, step: 'any' }
    ],
    calc: function (v) {
      var V;
      switch (v.s) {
        case 'cube': V = Math.pow(v.a, 3); break;
        case 'sphere': V = 4 / 3 * Math.PI * Math.pow(v.a, 3); break;
        case 'cylinder': V = Math.PI * v.a * v.a * v.b; break;
        case 'cone': V = 1 / 3 * Math.PI * v.a * v.a * v.b; break;
        default: V = v.a * v.b * v.c;
      }
      return [['Volume', num(V)]];
    }
  });
  add('circle', 'Circle Calculator', 'Math', '\u25EF', 'Area, circumference and diameter from radius.', {
    inputs: [{ k: 'r', label: 'Radius', v: 7, step: 'any' }],
    calc: function (v) { return [['Area', num(Math.PI * v.r * v.r)], ['Circumference', num(2 * Math.PI * v.r)], ['Diameter', num(2 * v.r)]]; }
  });
  add('triangle', 'Triangle Calculator', 'Math', '\u25B3', 'Area from base & height and perimeter from sides.', {
    inputs: [
      { k: 'base', label: 'Base', v: 6, step: 'any' }, { k: 'h', label: 'Height', v: 4, step: 'any' },
      { k: 'a', label: 'Side a', v: 5, step: 'any' }, { k: 'b', label: 'Side b', v: 5, step: 'any' }, { k: 'c', label: 'Side c', v: 6, step: 'any' }
    ],
    calc: function (v) { return [['Area', num(0.5 * v.base * v.h)], ['Perimeter', num(v.a + v.b + v.c)]]; }
  });
  add('pythagorean', 'Pythagorean Theorem Calculator', 'Math', '\uD83D\uDCD0', 'Find the hypotenuse from two legs.', {
    inputs: [{ k: 'a', label: 'Side a', v: 3, step: 'any' }, { k: 'b', label: 'Side b', v: 4, step: 'any' }],
    calc: function (v) { var c = Math.sqrt(v.a * v.a + v.b * v.b); return [['Hypotenuse (c)', num(c)], ['Area', num(0.5 * v.a * v.b)]]; }
  });
  add('quadratic', 'Quadratic Equation Solver', 'Math', '\uD835\uDC65\u00B2', 'Solve ax\u00B2 + bx + c = 0.', {
    inputs: [{ k: 'a', label: 'a', v: 1, step: 'any' }, { k: 'b', label: 'b', v: -3, step: 'any' }, { k: 'c', label: 'c', v: 2, step: 'any' }],
    calc: function (v) {
      var d = v.b * v.b - 4 * v.a * v.c;
      if (d < 0) return [['Discriminant', num(d)], ['Roots', 'No real roots']];
      var x1 = (-v.b + Math.sqrt(d)) / (2 * v.a), x2 = (-v.b - Math.sqrt(d)) / (2 * v.a);
      return [['x\u2081', num(x1, 4)], ['x\u2082', num(x2, 4)], ['Discriminant', num(d)]];
    }
  });
  add('gcd-lcm', 'GCD & LCM Calculator', 'Math', '\uD83D\uDD22', 'Greatest common divisor and least common multiple.', {
    inputs: [{ k: 'a', label: 'Number A', v: 12, step: '1' }, { k: 'b', label: 'Number B', v: 18, step: '1' }],
    calc: function (v) { var a = Math.abs(v.a), b = Math.abs(v.b); function g(x, y) { return y ? g(y, x % y) : x; } var gg = g(a, b); return [['GCD', num(gg, 0)], ['LCM', num(a * b / gg, 0)]]; }
  });
  add('exponent', 'Exponent Calculator', 'Math', '\u207F', 'Raise a base to any power.', {
    inputs: [{ k: 'b', label: 'Base', v: 2, step: 'any' }, { k: 'p', label: 'Exponent', v: 10, step: 'any' }],
    calc: function (v) { return [['Result', num(Math.pow(v.b, v.p), 6)]]; }
  });
  add('root', 'Root Calculator', 'Math', '\u221A', 'Square, cube and nth roots.', {
    inputs: [{ k: 'n', label: 'Number', v: 81, step: 'any' }, { k: 'd', label: 'Root degree', v: 2, step: 'any' }],
    calc: function (v) { return [['\u221A (square)', num(Math.sqrt(v.n), 6)], ['\u221B (cube)', num(Math.cbrt(v.n), 6)], [v.d + 'th root', num(Math.pow(v.n, 1 / v.d), 6)]]; }
  });
  add('ratio', 'Ratio Calculator', 'Math', '\u2236', 'Simplify ratios and solve proportions A:B = C:D.', {
    inputs: [{ k: 'a', label: 'A', v: 4, step: 'any' }, { k: 'b', label: 'B', v: 8, step: 'any' }, { k: 'c', label: 'C (for proportion)', v: 10, step: 'any' }],
    calc: function (v) { function g(x, y) { return y ? g(y, x % y) : x; } var gg = g(v.a, v.b) || 1; return [['Simplified', num(v.a / gg, 0) + ' : ' + num(v.b / gg, 0)], ['Decimal', num(v.a / v.b, 4)], ['D (A:B=C:D)', num(v.c * v.b / v.a, 4)]]; }
  });

  /* =================== CONVERSIONS (10) =================== */
  add('length-converter', 'Length Converter', 'Conversions', '\uD83D\uDCCF', 'Convert mm, cm, m, km, inch, foot, yard, mile.', conv([U('mm', 'Millimeter', 0.001), U('cm', 'Centimeter', 0.01), U('m', 'Meter', 1), U('km', 'Kilometer', 1000), U('in', 'Inch', 0.0254), U('ft', 'Foot', 0.3048), U('yd', 'Yard', 0.9144), U('mi', 'Mile', 1609.344)]));
  add('weight-converter', 'Weight Converter', 'Conversions', '\u2696\uFE0F', 'Convert mg, g, kg, tonne, oz, lb, stone.', conv([U('mg', 'Milligram', 0.001), U('g', 'Gram', 1), U('kg', 'Kilogram', 1000), U('t', 'Tonne', 1e6), U('oz', 'Ounce', 28.3495), U('lb', 'Pound', 453.592), U('st', 'Stone', 6350.29)]));
  add('temperature-converter', 'Temperature Converter', 'Conversions', '\uD83C\uDF21\uFE0F', 'Convert Celsius, Fahrenheit and Kelvin.', {
    inputs: [
      { k: 'amt', label: 'Value', v: 25, step: 'any' },
      { k: 'from', label: 'From', t: 'sel', v: 'C', opts: [opt('C', 'Celsius'), opt('F', 'Fahrenheit'), opt('K', 'Kelvin')] },
      { k: 'to', label: 'To', t: 'sel', v: 'F', opts: [opt('C', 'Celsius'), opt('F', 'Fahrenheit'), opt('K', 'Kelvin')] }
    ],
    calc: function (v) {
      var c = v.from === 'C' ? v.amt : v.from === 'F' ? (v.amt - 32) * 5 / 9 : v.amt - 273.15;
      var r = v.to === 'C' ? c : v.to === 'F' ? c * 9 / 5 + 32 : c + 273.15;
      return [['Result', num(r, 2) + ' \u00B0' + (v.to === 'K' ? 'K' : v.to)]];
    }
  });
  add('speed-converter', 'Speed Converter', 'Conversions', '\uD83C\uDFCE\uFE0F', 'Convert m/s, km/h, mph, knot, ft/s.', conv([U('mps', 'm/s', 1), U('kmh', 'km/h', 0.277778), U('mph', 'mph', 0.44704), U('kn', 'Knot', 0.514444), U('fps', 'ft/s', 0.3048)]));
  add('area-converter', 'Area Converter', 'Conversions', '\uD83D\uDFE9', 'Convert m\u00B2, cm\u00B2, km\u00B2, ft\u00B2, yd\u00B2, acre, hectare.', conv([U('m2', 'm\u00B2', 1), U('cm2', 'cm\u00B2', 0.0001), U('km2', 'km\u00B2', 1e6), U('ft2', 'ft\u00B2', 0.092903), U('yd2', 'yd\u00B2', 0.836127), U('ac', 'Acre', 4046.86), U('ha', 'Hectare', 10000)]));
  add('volume-converter', 'Volume Converter', 'Conversions', '\uD83E\uDD64', 'Convert ml, L, m\u00B3, gallon, cup, pint, fl oz.', conv([U('ml', 'Milliliter', 0.001), U('l', 'Liter', 1), U('m3', 'm\u00B3', 1000), U('galus', 'Gallon (US)', 3.78541), U('galuk', 'Gallon (UK)', 4.54609), U('cup', 'Cup', 0.236588), U('pt', 'Pint', 0.473176), U('floz', 'Fluid oz', 0.0295735)]));
  add('data-converter', 'Data Storage Converter', 'Conversions', '\uD83D\uDCBE', 'Convert bit, byte, KB, MB, GB, TB.', conv([U('bit', 'Bit', 0.125), U('B', 'Byte', 1), U('KB', 'Kilobyte', 1024), U('MB', 'Megabyte', 1048576), U('GB', 'Gigabyte', 1073741824), U('TB', 'Terabyte', 1099511627776)], 6));
  add('energy-converter', 'Energy Converter', 'Conversions', '\u26A1', 'Convert joule, kJ, calorie, kcal, Wh, kWh.', conv([U('J', 'Joule', 1), U('kJ', 'Kilojoule', 1000), U('cal', 'Calorie', 4.184), U('kcal', 'Kilocalorie', 4184), U('Wh', 'Watt-hour', 3600), U('kWh', 'Kilowatt-hour', 3600000)]));
  add('pressure-converter', 'Pressure Converter', 'Conversions', '\uD83C\uDF2A\uFE0F', 'Convert Pa, kPa, bar, psi, atm, mmHg.', conv([U('Pa', 'Pascal', 1), U('kPa', 'Kilopascal', 1000), U('bar', 'Bar', 100000), U('psi', 'psi', 6894.76), U('atm', 'Atmosphere', 101325), U('mmHg', 'mmHg', 133.322)]));
  add('power-converter', 'Power Converter', 'Conversions', '\uD83D\uDD0C', 'Convert watt, kW, MW, horsepower.', conv([U('W', 'Watt', 1), U('kW', 'Kilowatt', 1000), U('MW', 'Megawatt', 1e6), U('hp', 'Horsepower', 745.7)]));

  /* =================== SCIENCE (5) =================== */
  add('ohms-law', "Ohm's Law Calculator", 'Science', '\uD83D\uDD0B', 'Voltage, current, resistance and power.', {
    inputs: [{ k: 'v', label: 'Voltage V (volts)', v: 12, step: 'any' }, { k: 'i', label: 'Current I (amps)', v: 2, step: 'any' }, { k: 'r', label: 'Resistance R (ohms, optional)', v: '', step: 'any' }],
    calc: function (x) {
      var v = x.v, i = x.i, r = x.r;
      if (!isFinite(r) && isFinite(v) && isFinite(i)) r = v / i;
      else if (!isFinite(v) && isFinite(i) && isFinite(r)) v = i * r;
      else if (!isFinite(i) && isFinite(v) && isFinite(r)) i = v / r;
      return [['Voltage', num(v) + ' V'], ['Current', num(i) + ' A'], ['Resistance', num(r) + ' \u03A9'], ['Power', num(v * i) + ' W']];
    }
  });
  add('force', 'Force Calculator', 'Science', '\uD83D\uDCA5', 'Newton\u2019s second law: F = m \u00D7 a.', {
    inputs: [{ k: 'm', label: 'Mass (kg)', v: 10, step: 'any' }, { k: 'a', label: 'Acceleration (m/s\u00B2)', v: 9.8, step: 'any' }],
    calc: function (v) { return [['Force', num(v.m * v.a) + ' N']]; }
  });
  add('density', 'Density Calculator', 'Science', '\uD83E\uDDCA', 'Density = mass / volume.', {
    inputs: [{ k: 'm', label: 'Mass (kg)', v: 100, step: 'any' }, { k: 'v', label: 'Volume (m\u00B3)', v: 0.1, step: 'any' }],
    calc: function (v) { return [['Density', num(v.m / v.v) + ' kg/m\u00B3']]; }
  });
  add('speed-distance-time', 'Speed, Distance & Time Calculator', 'Science', '\uD83D\uDEA6', 'Solve for speed, distance or time.', {
    inputs: [{ k: 'd', label: 'Distance (km, optional)', v: 100, step: 'any' }, { k: 't', label: 'Time (hours, optional)', v: 2, step: 'any' }, { k: 's', label: 'Speed (km/h, optional)', v: '', step: 'any' }],
    calc: function (x) {
      var d = x.d, t = x.t, s = x.s;
      if (!isFinite(s) && isFinite(d) && isFinite(t)) s = d / t;
      else if (!isFinite(d) && isFinite(s) && isFinite(t)) d = s * t;
      else if (!isFinite(t) && isFinite(d) && isFinite(s)) t = d / s;
      return [['Speed', num(s) + ' km/h'], ['Distance', num(d) + ' km'], ['Time', num(t) + ' h']];
    }
  });
  add('kinetic-energy', 'Kinetic Energy Calculator', 'Science', '\uD83C\uDFBE', 'KE = \u00BD m v\u00B2.', {
    inputs: [{ k: 'm', label: 'Mass (kg)', v: 5, step: 'any' }, { k: 'v', label: 'Velocity (m/s)', v: 10, step: 'any' }],
    calc: function (v) { return [['Kinetic Energy', num(0.5 * v.m * v.v * v.v) + ' J']]; }
  });

  /* =================== FINANCIAL (9) =================== */
  add('fd', 'Fixed Deposit (FD) Calculator', 'Financial', '\uD83C\uDFE6', 'Maturity value of a fixed deposit.', {
    inputs: [{ k: 'p', label: 'Principal', v: 100000, step: 'any' }, { k: 'r', label: 'Interest rate (% p.a.)', v: 7, step: 'any' }, { k: 'y', label: 'Years', v: 5, step: 'any' }, { k: 'n', label: 'Compounding', t: 'sel', v: '4', opts: [opt('1', 'Yearly'), opt('2', 'Half-yearly'), opt('4', 'Quarterly'), opt('12', 'Monthly')] }],
    calc: function (v) { var n = parseFloat(v.n); var A = v.p * Math.pow(1 + v.r / 100 / n, n * v.y); return [['Maturity', money(A)], ['Interest', money(A - v.p)], ['Invested', money(v.p)]]; }
  });
  add('rd', 'Recurring Deposit (RD) Calculator', 'Financial', '\uD83D\uDDD3\uFE0F', 'Maturity value of a recurring deposit.', {
    inputs: [{ k: 'p', label: 'Monthly deposit', v: 5000, step: 'any' }, { k: 'r', label: 'Interest rate (% p.a.)', v: 7, step: 'any' }, { k: 'm', label: 'Months', v: 24, step: '1' }],
    calc: function (v) { var i = v.r / 100 / 12; var A = i ? v.p * (Math.pow(1 + i, v.m) - 1) / i * (1 + i) : v.p * v.m; var inv = v.p * v.m; return [['Maturity', money(A)], ['Interest', money(A - inv)], ['Invested', money(inv)]]; }
  });
  add('ppf', 'PPF Calculator', 'Financial', '\uD83C\uDF31', 'Public Provident Fund maturity (annual deposits).', {
    inputs: [{ k: 'p', label: 'Yearly deposit', v: 150000, step: 'any' }, { k: 'r', label: 'Interest rate (%)', v: 7.1, step: 'any' }, { k: 'y', label: 'Years', v: 15, step: '1' }],
    calc: function (v) { var i = v.r / 100, bal = 0; for (var k = 0; k < v.y; k++) { bal = (bal + v.p) * (1 + i); } return [['Maturity', money(bal)], ['Invested', money(v.p * v.y)], ['Interest', money(bal - v.p * v.y)]]; }
  });
  add('mortgage', 'Mortgage Calculator', 'Financial', '\uD83C\uDFE0', 'Monthly mortgage payment and total interest.', {
    inputs: [{ k: 'p', label: 'Loan amount', v: 5000000, step: 'any' }, { k: 'r', label: 'Interest rate (% p.a.)', v: 8.5, step: 'any' }, { k: 'y', label: 'Years', v: 20, step: 'any' }],
    calc: function (v) { var i = v.r / 100 / 12, n = v.y * 12; var emi = i ? v.p * i * Math.pow(1 + i, n) / (Math.pow(1 + i, n) - 1) : v.p / n; return [['Monthly payment', money(emi)], ['Total interest', money(emi * n - v.p)], ['Total paid', money(emi * n)]]; }
  });
  add('retirement', 'Retirement Calculator', 'Financial', '\uD83C\uDFD6\uFE0F', 'Corpus needed for retirement.', {
    inputs: [{ k: 'age', label: 'Current age', v: 30, step: '1' }, { k: 'ret', label: 'Retirement age', v: 60, step: '1' }, { k: 'exp', label: 'Monthly expense today', v: 40000, step: 'any' }, { k: 'inf', label: 'Inflation (%)', v: 6, step: 'any' }],
    calc: function (v) { var yrs = Math.max(0, v.ret - v.age); var fut = v.exp * Math.pow(1 + v.inf / 100, yrs); var corpus = fut * 12 * 25; return [['Monthly expense at retirement', money(fut)], ['Corpus needed', money(corpus)], ['Years to retire', num(yrs, 0)]]; }
  });
  add('savings-goal', 'Savings Goal Calculator', 'Financial', '\uD83C\uDFAF', 'Monthly saving needed to reach a goal.', {
    inputs: [{ k: 'goal', label: 'Goal amount', v: 1000000, step: 'any' }, { k: 'y', label: 'Years', v: 5, step: 'any' }, { k: 'r', label: 'Expected return (%)', v: 10, step: 'any' }],
    calc: function (v) { var i = v.r / 100 / 12, n = v.y * 12; var p = i ? v.goal * i / (Math.pow(1 + i, n) - 1) : v.goal / n; return [['Monthly saving', money(p)], ['Total invested', money(p * n)], ['Growth', money(v.goal - p * n)]]; }
  });
  add('tip', 'Tip Calculator', 'Financial', '\uD83D\uDCB5', 'Tip amount, total and split per person.', {
    inputs: [{ k: 'bill', label: 'Bill amount', v: 1200, step: 'any' }, { k: 'tip', label: 'Tip (%)', v: 10, step: 'any' }, { k: 'people', label: 'Split between', v: 2, step: '1' }],
    calc: function (v) { var tip = v.bill * v.tip / 100, total = v.bill + tip; return [['Tip', money(tip)], ['Total', money(total)], ['Per person', money(total / (v.people || 1))]]; }
  });
  add('sales-tax', 'Sales Tax Calculator', 'Financial', '\uD83E\uDDFE', 'Add or remove sales tax / VAT.', {
    inputs: [{ k: 'amt', label: 'Amount', v: 1000, step: 'any' }, { k: 'rate', label: 'Tax rate (%)', v: 8, step: 'any' }, { k: 'mode', label: 'Mode', t: 'sel', v: 'add', opts: [opt('add', 'Add tax'), opt('remove', 'Remove tax')] }],
    calc: function (v) { if (v.mode === 'remove') { var base = v.amt * 100 / (100 + v.rate); return [['Base amount', money(base)], ['Tax', money(v.amt - base)], ['Total', money(v.amt)]]; } var tax = v.amt * v.rate / 100; return [['Tax', money(tax)], ['Total', money(v.amt + tax)], ['Base', money(v.amt)]]; }
  });
  add('net-worth', 'Net Worth Calculator', 'Financial', '\uD83D\uDCB0', 'Total assets minus liabilities.', {
    inputs: [{ k: 'cash', label: 'Cash & savings', v: 200000, step: 'any' }, { k: 'inv', label: 'Investments', v: 500000, step: 'any' }, { k: 'prop', label: 'Property & assets', v: 3000000, step: 'any' }, { k: 'loan', label: 'Loans', v: 1500000, step: 'any' }, { k: 'cc', label: 'Credit card & other debt', v: 50000, step: 'any' }],
    calc: function (v) { var assets = v.cash + v.inv + v.prop; var liab = v.loan + v.cc; return [['Total assets', money(assets)], ['Total liabilities', money(liab)], ['Net worth', money(assets - liab)]]; }
  });

  /* =================== HEALTH (8) =================== */
  add('body-fat', 'Body Fat Calculator', 'Health', '\uD83D\uDCCF', 'US Navy body fat percentage estimate.', {
    inputs: [{ k: 'g', label: 'Gender', t: 'sel', v: 'male', opts: [opt('male', 'Male'), opt('female', 'Female')] }, { k: 'h', label: 'Height (cm)', v: 175, step: 'any' }, { k: 'waist', label: 'Waist (cm)', v: 85, step: 'any' }, { k: 'neck', label: 'Neck (cm)', v: 38, step: 'any' }, { k: 'hip', label: 'Hip (cm, female)', v: 95, step: 'any' }],
    calc: function (v) { var bf; if (v.g === 'male') bf = 495 / (1.0324 - 0.19077 * Math.log10(v.waist - v.neck) + 0.15456 * Math.log10(v.h)) - 450; else bf = 495 / (1.29579 - 0.35004 * Math.log10(v.waist + v.hip - v.neck) + 0.22100 * Math.log10(v.h)) - 450; return [['Body fat', num(bf, 1) + ' %'], ['Category', bf < 14 ? 'Athlete/Fit' : bf < 25 ? 'Average' : 'High']]; }
  });
  add('ideal-weight', 'Ideal Weight Calculator', 'Health', '\u2696\uFE0F', 'Ideal body weight from height (Devine/Robinson).', {
    inputs: [{ k: 'g', label: 'Gender', t: 'sel', v: 'male', opts: [opt('male', 'Male'), opt('female', 'Female')] }, { k: 'h', label: 'Height (cm)', v: 175, step: 'any' }],
    calc: function (v) { var inOver5ft = (v.h - 152.4) / 2.54; var dev = (v.g === 'male' ? 50 : 45.5) + 2.3 * inOver5ft; var rob = (v.g === 'male' ? 52 : 49) + 1.7 * inOver5ft; return [['Devine', num(dev, 1) + ' kg'], ['Robinson', num(rob, 1) + ' kg'], ['Healthy range', num(dev * 0.9, 0) + '\u2013' + num(dev * 1.1, 0) + ' kg']]; }
  });
  add('water-intake', 'Water Intake Calculator', 'Health', '\uD83D\uDCA7', 'Daily water requirement.', {
    inputs: [{ k: 'w', label: 'Weight (kg)', v: 70, step: 'any' }, { k: 'act', label: 'Activity', t: 'sel', v: 'mod', opts: [opt('low', 'Sedentary'), opt('mod', 'Moderate'), opt('high', 'Active')] }],
    calc: function (v) { var base = v.w * 0.033; var add = v.act === 'high' ? 0.7 : v.act === 'mod' ? 0.35 : 0; var t = base + add; return [['Per day', num(t, 2) + ' L'], ['Glasses (250ml)', num(t * 1000 / 250, 0)]]; }
  });
  add('protein-intake', 'Protein Intake Calculator', 'Health', '\uD83C\uDF57', 'Daily protein target.', {
    inputs: [{ k: 'w', label: 'Weight (kg)', v: 70, step: 'any' }, { k: 'goal', label: 'Goal', t: 'sel', v: 'maintain', opts: [opt('sed', 'Sedentary (0.8 g/kg)'), opt('maintain', 'Active (1.4 g/kg)'), opt('build', 'Build muscle (2.0 g/kg)')] }],
    calc: function (v) { var f = v.goal === 'sed' ? 0.8 : v.goal === 'build' ? 2.0 : 1.4; return [['Daily protein', num(v.w * f, 0) + ' g'], ['Per meal (4)', num(v.w * f / 4, 0) + ' g']]; }
  });
  add('heart-rate', 'Target Heart Rate Calculator', 'Health', '\u2764\uFE0F', 'Max and target heart-rate zones.', {
    inputs: [{ k: 'age', label: 'Age', v: 30, step: '1' }, { k: 'rest', label: 'Resting HR (bpm)', v: 70, step: '1' }],
    calc: function (v) { var max = 220 - v.age; function z(p) { return Math.round((max - v.rest) * p + v.rest); } return [['Max HR', num(max, 0) + ' bpm'], ['Fat-burn (60-70%)', z(0.6) + '\u2013' + z(0.7)], ['Cardio (70-85%)', z(0.7) + '\u2013' + z(0.85)]]; }
  });
  add('running-pace', 'Running Pace Calculator', 'Health', '\uD83C\uDFC3', 'Pace and speed from distance & time.', {
    inputs: [{ k: 'dist', label: 'Distance (km)', v: 5, step: 'any' }, { k: 'min', label: 'Time \u2013 minutes', v: 30, step: 'any' }, { k: 'sec', label: 'Time \u2013 seconds', v: 0, step: 'any' }],
    calc: function (v) { var tot = v.min * 60 + v.sec; var pace = tot / v.dist; var pm = Math.floor(pace / 60), ps = Math.round(pace % 60); return [['Pace', pm + ':' + (ps < 10 ? '0' : '') + ps + ' /km'], ['Speed', num(v.dist / (tot / 3600), 2) + ' km/h']]; }
  });
  add('one-rep-max', 'One Rep Max Calculator', 'Health', '\uD83C\uDFCB\uFE0F', 'Estimate your 1RM (Epley formula).', {
    inputs: [{ k: 'w', label: 'Weight lifted', v: 60, step: 'any' }, { k: 'reps', label: 'Reps', v: 5, step: '1' }],
    calc: function (v) { var orm = v.w * (1 + v.reps / 30); return [['1 Rep Max', num(orm, 1)], ['95%', num(orm * 0.95, 1)], ['80%', num(orm * 0.8, 1)]]; }
  });
  add('due-date', 'Pregnancy Due Date Calculator', 'Health', '\uD83D\uDC76', 'Estimated due date from last period.', {
    inputs: [{ k: 'lmp', label: 'First day of last period', t: 'date', v: '' }],
    calc: function (v) { if (!v.lmp) return [['Due date', 'Enter a date']]; var d = new Date(v.lmp); var due = new Date(d.getTime() + 280 * 864e5); var week = Math.floor((Date.now() - d.getTime()) / 864e5 / 7); return [['Estimated due date', due.toDateString()], ['Current week', (week >= 0 && week <= 42 ? week + ' weeks' : '\u2014')]]; }
  });

  /* =================== DATE & TIME (4) =================== */
  add('countdown', 'Countdown Calculator', 'Date & Time', '\u23F3', 'Days, hours and minutes until a date.', {
    inputs: [{ k: 'target', label: 'Target date', t: 'date', v: '' }],
    calc: function (v) { if (!v.target) return [['Countdown', 'Pick a date']]; var ms = new Date(v.target).getTime() - Date.now(); var past = ms < 0; ms = Math.abs(ms); var d = Math.floor(ms / 864e5), h = Math.floor(ms / 36e5) % 24; return [[past ? 'Days since' : 'Days left', num(d, 0)], ['Hours', num(h, 0)], ['Weeks', num(d / 7, 1)]]; }
  });
  add('workdays', 'Working Days Calculator', 'Date & Time', '\uD83D\uDCC5', 'Business days between two dates.', {
    inputs: [{ k: 's', label: 'Start date', t: 'date', v: '' }, { k: 'e', label: 'End date', t: 'date', v: '' }],
    calc: function (v) { if (!v.s || !v.e) return [['Working days', 'Pick both dates']]; var s = new Date(v.s), e = new Date(v.e); if (e < s) { var t = s; s = e; e = t; } var work = 0, we = 0, cur = new Date(s); while (cur <= e) { var d = cur.getDay(); if (d === 0 || d === 6) we++; else work++; cur = new Date(cur.getTime() + 864e5); } return [['Working days', num(work, 0)], ['Weekend days', num(we, 0)], ['Total days', num(work + we, 0)]]; }
  });
  add('sleep', 'Sleep Calculator', 'Date & Time', '\uD83D\uDE34', 'Best bedtimes based on 90-minute cycles.', {
    inputs: [{ k: 'wake', label: 'Wake-up time', t: 'time', v: '06:30' }],
    calc: function (v) { if (!v.wake) return [['Bedtime', 'Enter wake time']]; var p = v.wake.split(':'); var wake = new Date(); wake.setHours(+p[0], +p[1], 0, 0); function bt(cycles) { var t = new Date(wake.getTime() - (cycles * 90 + 15) * 60000); var hh = t.getHours(), mm = t.getMinutes(); var ap = hh >= 12 ? 'PM' : 'AM'; hh = hh % 12 || 12; return hh + ':' + (mm < 10 ? '0' : '') + mm + ' ' + ap; } return [['6 cycles (9h)', bt(6)], ['5 cycles (7.5h)', bt(5)], ['4 cycles (6h)', bt(4)]]; }
  });
  add('leap-year', 'Leap Year Checker', 'Date & Time', '\uD83D\uDDD3\uFE0F', 'Check whether a year is a leap year.', {
    inputs: [{ k: 'y', label: 'Year', v: 2024, step: '1' }],
    calc: function (v) { var y = Math.round(v.y); var leap = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0; var next = y; while (!(((next % 4 === 0 && next % 100 !== 0) || next % 400 === 0))) next++; return [[y + ' is', leap ? 'A leap year \u2713' : 'Not a leap year'], ['Days in year', leap ? '366' : '365'], ['Next leap year', String(leap ? (function () { var n = y + 1; while (!(((n % 4 === 0 && n % 100 !== 0) || n % 400 === 0))) n++; return n; })() : next)]]; }
  });

  /* =================== EVERYDAY (4) =================== */
  add('gpa', 'GPA Calculator', 'Everyday', '\uD83C\uDF93', 'Weighted GPA from up to 5 courses.', {
    inputs: [
      { k: 'g1', label: 'Course 1 grade point', v: 9, step: 'any' }, { k: 'c1', label: 'Course 1 credits', v: 4, step: 'any' },
      { k: 'g2', label: 'Course 2 grade point', v: 8, step: 'any' }, { k: 'c2', label: 'Course 2 credits', v: 3, step: 'any' },
      { k: 'g3', label: 'Course 3 grade point', v: 7, step: 'any' }, { k: 'c3', label: 'Course 3 credits', v: 3, step: 'any' },
      { k: 'g4', label: 'Course 4 grade point', v: 0, step: 'any' }, { k: 'c4', label: 'Course 4 credits', v: 0, step: 'any' },
      { k: 'g5', label: 'Course 5 grade point', v: 0, step: 'any' }, { k: 'c5', label: 'Course 5 credits', v: 0, step: 'any' }
    ],
    calc: function (v) { var pts = 0, cr = 0; for (var i = 1; i <= 5; i++) { var g = v['g' + i], c = v['c' + i]; if (isFinite(g) && isFinite(c) && c > 0) { pts += g * c; cr += c; } } return [['GPA', num(cr ? pts / cr : 0, 2)], ['Total credits', num(cr, 0)]]; }
  });
  add('grade', 'Grade Percentage Calculator', 'Everyday', '\uD83D\uDCDD', 'Percentage and letter grade from marks.', {
    inputs: [{ k: 'got', label: 'Marks obtained', v: 425, step: 'any' }, { k: 'total', label: 'Total marks', v: 500, step: 'any' }],
    calc: function (v) { var p = v.got / v.total * 100; var g = p >= 90 ? 'A+' : p >= 80 ? 'A' : p >= 70 ? 'B' : p >= 60 ? 'C' : p >= 40 ? 'D' : 'F'; return [['Percentage', num(p, 2) + ' %'], ['Grade', g]]; }
  });
  add('fuel-cost', 'Trip Fuel Cost Calculator', 'Everyday', '\u26FD', 'Fuel needed and cost for a trip.', {
    inputs: [{ k: 'dist', label: 'Distance (km)', v: 300, step: 'any' }, { k: 'mil', label: 'Mileage (km/L)', v: 18, step: 'any' }, { k: 'price', label: 'Fuel price / L', v: 100, step: 'any' }],
    calc: function (v) { var fuel = v.dist / v.mil; return [['Fuel needed', num(fuel, 2) + ' L'], ['Total cost', money(fuel * v.price)], ['Cost per km', money(v.price / v.mil)]]; }
  });
  add('electricity-bill', 'Electricity Bill Calculator', 'Everyday', '\uD83D\uDCA1', 'Estimate your electricity bill.', {
    inputs: [{ k: 'units', label: 'Units consumed (kWh)', v: 300, step: 'any' }, { k: 'rate', label: 'Rate per unit', v: 8, step: 'any' }, { k: 'fixed', label: 'Fixed charge', v: 100, step: 'any' }],
    calc: function (v) { var energy = v.units * v.rate; return [['Energy charge', money(energy)], ['Fixed charge', money(v.fixed)], ['Total bill', money(energy + v.fixed)]]; }
  });

})();
