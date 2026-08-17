/* Math calculators */
(function () {
  'use strict';
  var C = window.CS;
  var el = C.el, field = C.field, numInput = C.numInput, selectInput = C.selectInput;
  function debounce(fn) { var t; return function () { clearTimeout(t); t = setTimeout(fn, 100); }; }

  /* ---------- Safe expression evaluator (shunting-yard) ---------- */
  function evaluate(expr) {
    expr = String(expr).replace(/\u00D7/g, '*').replace(/\u00F7/g, '/').replace(/\u2212/g, '-').replace(/,/g, '');
    var tokens = tokenize(expr);
    var rpn = toRPN(tokens);
    return evalRPN(rpn);
  }
  function tokenize(s) {
    var out = [], i = 0, num = '';
    var fns = ['sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'sqrt', 'cbrt', 'ln', 'log', 'exp', 'abs', 'fact'];
    function flush() { if (num !== '') { out.push({ t: 'num', v: parseFloat(num) }); num = ''; } }
    while (i < s.length) {
      var ch = s[i];
      if (/\s/.test(ch)) { i++; continue; }
      if (/[0-9.]/.test(ch)) { num += ch; i++; continue; }
      // function names / constants
      var matched = false;
      for (var f = 0; f < fns.length; f++) { if (s.substr(i, fns[f].length).toLowerCase() === fns[f]) { flush(); out.push({ t: 'fn', v: fns[f] }); i += fns[f].length; matched = true; break; } }
      if (matched) continue;
      if (s.substr(i, 2).toLowerCase() === 'pi') { flush(); out.push({ t: 'num', v: Math.PI }); i += 2; continue; }
      if (ch.toLowerCase() === 'e' && !/[0-9]/.test(s[i + 1] || '')) { flush(); out.push({ t: 'num', v: Math.E }); i++; continue; }
      if ('+-*/^%'.indexOf(ch) > -1) {
        flush();
        // unary minus
        if (ch === '-' && (out.length === 0 || (out[out.length - 1].t === 'op') || out[out.length - 1].v === '(')) { out.push({ t: 'num', v: 0 }); }
        out.push({ t: 'op', v: ch }); i++; continue;
      }
      if (ch === '(') { flush(); out.push({ t: 'par', v: '(' }); i++; continue; }
      if (ch === ')') { flush(); out.push({ t: 'par', v: ')' }); i++; continue; }
      i++; // skip unknown
    }
    flush();
    return out;
  }
  var PREC = { '+': 1, '-': 1, '*': 2, '/': 2, '%': 2, '^': 3 };
  function toRPN(tokens) {
    var out = [], stack = [];
    tokens.forEach(function (tk) {
      if (tk.t === 'num') out.push(tk);
      else if (tk.t === 'fn') stack.push(tk);
      else if (tk.t === 'op') {
        while (stack.length) {
          var top = stack[stack.length - 1];
          if (top.t === 'fn' || (top.t === 'op' && (PREC[top.v] > PREC[tk.v] || (PREC[top.v] === PREC[tk.v] && tk.v !== '^')))) out.push(stack.pop());
          else break;
        }
        stack.push(tk);
      } else if (tk.v === '(') stack.push(tk);
      else if (tk.v === ')') { while (stack.length && stack[stack.length - 1].v !== '(') out.push(stack.pop()); stack.pop(); if (stack.length && stack[stack.length - 1].t === 'fn') out.push(stack.pop()); }
    });
    while (stack.length) out.push(stack.pop());
    return out;
  }
  function factorial(n) { if (n < 0 || n !== Math.floor(n)) return NaN; var r = 1; for (var i = 2; i <= n; i++) r *= i; return r; }
  function evalRPN(rpn) {
    var st = [], degree = window._sciDeg !== false;
    var toRad = function (x) { return degree ? x * Math.PI / 180 : x; };
    var fromRad = function (x) { return degree ? x * 180 / Math.PI : x; };
    rpn.forEach(function (tk) {
      if (tk.t === 'num') st.push(tk.v);
      else if (tk.t === 'op') {
        var b = st.pop(), a = st.pop();
        switch (tk.v) { case '+': st.push(a + b); break; case '-': st.push(a - b); break; case '*': st.push(a * b); break; case '/': st.push(a / b); break; case '^': st.push(Math.pow(a, b)); break; case '%': st.push(a % b); break; }
      } else if (tk.t === 'fn') {
        var x = st.pop(), r;
        switch (tk.v) {
          case 'sin': r = Math.sin(toRad(x)); break; case 'cos': r = Math.cos(toRad(x)); break; case 'tan': r = Math.tan(toRad(x)); break;
          case 'asin': r = fromRad(Math.asin(x)); break; case 'acos': r = fromRad(Math.acos(x)); break; case 'atan': r = fromRad(Math.atan(x)); break;
          case 'sqrt': r = Math.sqrt(x); break; case 'cbrt': r = Math.cbrt(x); break; case 'ln': r = Math.log(x); break; case 'log': r = Math.log10(x); break;
          case 'exp': r = Math.exp(x); break; case 'abs': r = Math.abs(x); break; case 'fact': r = factorial(x); break;
        }
        st.push(r);
      }
    });
    return st.pop();
  }

  /* ===================== Basic Calculator ===================== */
  C.Calc.register({
    id: 'basic', name: 'Basic Calculator', category: 'Math', icon: '\u{1F9EE}',
    description: 'Standard calculator with memory & history',
    render: function (root) {
      var expr = '', mem = 0;
      var exprEl = el('div', { class: 'expr' }, '');
      var outEl = el('div', { class: 'out' }, '0');
      var historyBox = el('div', { class: 'steps' });
      var memBadge = el('span', { class: 'badge blue', style: { display: 'none' } }, 'M');

      function refresh() { exprEl.textContent = expr || ''; }
      function setOut(v) { outEl.textContent = v; }
      function press(t) {
        if (t === 'C') { expr = ''; setOut('0'); refresh(); return; }
        if (t === 'bk') { expr = expr.slice(0, -1); refresh(); return; }
        if (t === '=') { compute(); return; }
        expr += t; refresh();
      }
      function compute() {
        if (!expr) return;
        try {
          var r = evaluate(expr);
          if (!isFinite(r)) throw 0;
          var formatted = C.fmtNum(r, 6);
          setOut(formatted);
          historyBox.insertBefore(el('div', { class: 'step', onClick: function () { expr = String(r); refresh(); } }, expr + ' = ' + formatted), historyBox.firstChild);
          C.saveHistory('basic', expr + ' = ' + formatted, '');
          expr = String(r); refresh();
        } catch (e) { setOut('Error'); }
      }
      function memOp(op) {
        var cur = parseFloat(outEl.textContent.replace(/,/g, '')) || 0;
        if (op === 'M+') mem += cur; else if (op === 'M-') mem -= cur; else if (op === 'MR') { expr += String(mem); refresh(); } else if (op === 'MC') mem = 0;
        memBadge.style.display = mem !== 0 ? 'inline-block' : 'none';
      }
      var keys = [
        ['MC', 'fn'], ['MR', 'fn'], ['M+', 'fn'], ['M-', 'fn'],
        ['C', 'danger'], ['(', 'op'], [')', 'op'], ['\u00F7', 'op'],
        ['7'], ['8'], ['9'], ['\u00D7', 'op'],
        ['4'], ['5'], ['6'], ['-', 'op'],
        ['1'], ['2'], ['3'], ['+', 'op'],
        ['0'], ['.'], ['bk', 'op'], ['=', 'eq']
      ];
      var pad = el('div', { class: 'keypad basic' });
      keys.forEach(function (k) {
        var label = k[0] === 'bk' ? '\u232B' : k[0];
        var b = el('div', { class: 'key ' + (k[1] || '') }, label);
        b.addEventListener('click', function () {
          if (['M+', 'M-', 'MR', 'MC'].indexOf(k[0]) > -1) memOp(k[0]);
          else press(k[0]);
        });
        pad.appendChild(b);
      });
      // keyboard support
      function onKey(e) {
        var k = e.key;
        if (/[0-9.+\-*/()%^]/.test(k)) { press(k); e.preventDefault(); }
        else if (k === 'Enter' || k === '=') { compute(); e.preventDefault(); }
        else if (k === 'Backspace') { press('bk'); e.preventDefault(); }
        else if (k === 'Escape') { press('C'); }
      }
      document.addEventListener('keydown', onKey);
      // store cleanup
      var display = el('div', { class: 'calc-display' }, [el('div', { style: { display: 'flex', justifyContent: 'space-between' } }, [memBadge, el('span')]), exprEl, outEl]);
      var leftCard = C.card('', [display, pad, el('div', { class: 'btn-row' }, [
        el('button', { class: 'btn btn-sm', onClick: function () { C.copyText(outEl.textContent); } }, '\u{1F4CB} Copy'),
        el('button', { class: 'btn btn-sm', onClick: C.printReport }, '\u{1F5A8} Print'),
        el('button', { class: 'btn btn-sm', onClick: voiceInput }, '\u{1F3A4} Voice')
      ])]);
      function voiceInput() {
        var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SR) { C.toast('Voice not supported in this browser'); return; }
        var rec = new SR(); rec.lang = 'en-US';
        rec.onresult = function (ev) {
          var said = ev.results[0][0].transcript.toLowerCase();
          said = said.replace(/plus/g, '+').replace(/minus/g, '-').replace(/(times|into|multiplied by)/g, '*').replace(/(divided by|over)/g, '/').replace(/[^0-9+\-*/.()]/g, '');
          expr += said; refresh(); compute();
        };
        rec.onerror = function () { C.toast('Voice error'); };
        C.toast('Listening\u2026'); rec.start();
      }
      var rightCard = C.card('History', historyBox, { action: el('button', { class: 'btn btn-sm', onClick: function () { historyBox.innerHTML = ''; } }, 'Clear') });
      return el('div', { class: 'calc-grid' }, [leftCard, rightCard]);
    }
  });

  /* ===================== Scientific Calculator ===================== */
  C.Calc.register({
    id: 'scientific', name: 'Scientific Calculator', category: 'Math', icon: '\u{1F52C}',
    description: 'Trig, log, powers + graph plotter & equation solver',
    render: function (root) {
      var expr = '';
      var exprEl = el('div', { class: 'expr' });
      var outEl = el('div', { class: 'out' }, '0');
      window._sciDeg = true;
      function refresh() { exprEl.textContent = expr; }
      function press(t) { expr += t; refresh(); }
      function compute() { try { var r = evaluate(expr); if (!isFinite(r)) throw 0; outEl.textContent = C.fmtNum(r, 8); C.saveHistory('scientific', expr + ' = ' + r, ''); expr = String(r); refresh(); } catch (e) { outEl.textContent = 'Error'; } }
      var degBtn;
      var fnRows = [
        [['sin', 'sin('], ['cos', 'cos('], ['tan', 'tan('], ['Deg', 'deg'], ['x^y', '^']],
        [['asin', 'asin('], ['acos', 'acos('], ['atan', 'atan('], ['\u03C0', 'pi'], ['e', 'e']],
        [['ln', 'ln('], ['log', 'log('], ['\u221A', 'sqrt('], ['x\u00B3\u221A', 'cbrt('], ['x!', 'fact(']],
        [['(', '('], [')', ')'], ['1/x', '^(0-1)'], ['%', '%'], ['e^x', 'exp(']]
      ];
      var fnPad = el('div', { class: 'keypad sci' });
      fnRows.forEach(function (rw) { rw.forEach(function (k) { var b = el('div', { class: 'key fn' }, k[0]); b.addEventListener('click', function () { if (k[1] === 'deg') { window._sciDeg = !window._sciDeg; degBtn.textContent = window._sciDeg ? 'Deg' : 'Rad'; } else press(k[1]); }); if (k[1] === 'deg') degBtn = b; fnPad.appendChild(b); }); });
      var numRows = [['7', '8', '9', '\u00F7', 'C'], ['4', '5', '6', '\u00D7', 'bk'], ['1', '2', '3', '-', '='], ['0', '.', '00', '+', '=']];
      var numPad = el('div', { class: 'keypad sci' });
      [['7', '8', '9', '/', 'C'], ['4', '5', '6', '*', '\u232B'], ['1', '2', '3', '-', '='], ['0', '.', 'pi', '+', '=']].forEach(function (rw, ri) {
        rw.forEach(function (k, ci) {
          var cls = 'key'; if ('+-*/'.indexOf(k) > -1) cls += ' op'; if (k === 'C') cls += ' danger'; if (k === '=') cls += ' eq';
          var b = el('div', { class: cls }, k);
          b.addEventListener('click', function () { if (k === 'C') { expr = ''; outEl.textContent = '0'; refresh(); } else if (k === '\u232B') { expr = expr.slice(0, -1); refresh(); } else if (k === '=') compute(); else press(k); });
          numPad.appendChild(b);
        });
      });
      var display = el('div', { class: 'calc-display' }, [exprEl, outEl]);
      var calcCard = C.card('', [display, fnPad, el('div', { style: { height: '8px' } }), numPad]);

      // Graph plotter
      var gfExpr = el('input', { class: 'inp', value: 'sin(x)' });
      var gCanvas = el('canvas', { 'data-h': 260 });
      function plot() {
        var p = gCanvas.getContext ? gCanvas : null; if (!p) return;
        var fn = gfExpr.value;
        var ratio = window.devicePixelRatio || 1; var rect = gCanvas.getBoundingClientRect(); var w = rect.width || 360, h = 260;
        gCanvas.width = w * ratio; gCanvas.height = h * ratio; gCanvas.style.height = h + 'px';
        var ctx = gCanvas.getContext('2d'); ctx.setTransform(ratio, 0, 0, ratio, 0, 0); ctx.clearRect(0, 0, w, h);
        var cs = getComputedStyle(document.documentElement);
        var grid = cs.getPropertyValue('--border'), txt = cs.getPropertyValue('--muted'), line = cs.getPropertyValue('--primary');
        var xmin = -10, xmax = 10, ymin = -5, ymax = 5;
        function X(x) { return (x - xmin) / (xmax - xmin) * w; }
        function Y(y) { return h - (y - ymin) / (ymax - ymin) * h; }
        ctx.strokeStyle = grid; ctx.lineWidth = 1;
        for (var gx = xmin; gx <= xmax; gx++) { ctx.beginPath(); ctx.moveTo(X(gx), 0); ctx.lineTo(X(gx), h); ctx.stroke(); }
        for (var gy = ymin; gy <= ymax; gy++) { ctx.beginPath(); ctx.moveTo(0, Y(gy)); ctx.lineTo(w, Y(gy)); ctx.stroke(); }
        ctx.strokeStyle = txt; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(0, Y(0)); ctx.lineTo(w, Y(0)); ctx.moveTo(X(0), 0); ctx.lineTo(X(0), h); ctx.stroke();
        ctx.strokeStyle = line; ctx.lineWidth = 2.4; ctx.beginPath(); var started = false;
        for (var px = 0; px <= w; px++) {
          var xv = xmin + (px / w) * (xmax - xmin); var yv;
          try { yv = evaluate(fn.replace(/x/g, '(' + xv + ')')); } catch (e) { yv = NaN; }
          if (!isFinite(yv)) { started = false; continue; }
          var py = Y(yv); if (py < -1000 || py > h + 1000) { started = false; continue; }
          if (!started) { ctx.moveTo(px, py); started = true; } else ctx.lineTo(px, py);
        }
        ctx.stroke();
      }
      gfExpr.addEventListener('input', debounce(plot));
      var graphCard = C.card('Graph Plotter  (use x, e.g. sin(x), x^2-3)', [el('div', { class: 'chart-wrap' }, gCanvas), el('div', { class: 'field', style: { marginTop: '10px' } }, [el('span', { class: 'field-label' }, 'f(x) ='), gfExpr])]);

      // Equation solver (quadratic + linear)
      var ea = numInput({ value: 1 }), eb = numInput({ value: -3 }), ec = numInput({ value: 2 });
      var eqOut = el('div', { class: 'note' });
      function solveEq() {
        var a = parseFloat(ea.value) || 0, b = parseFloat(eb.value) || 0, c = parseFloat(ec.value) || 0;
        if (a === 0) { if (b === 0) { eqOut.textContent = 'Not an equation.'; return; } eqOut.textContent = 'Linear root: x = ' + C.fmtNum(-c / b, 4); return; }
        var d = b * b - 4 * a * c;
        if (d > 0) { var r1 = (-b + Math.sqrt(d)) / (2 * a), r2 = (-b - Math.sqrt(d)) / (2 * a); eqOut.textContent = 'Two real roots: x\u2081 = ' + C.fmtNum(r1, 4) + ', x\u2082 = ' + C.fmtNum(r2, 4); }
        else if (d === 0) { eqOut.textContent = 'One real root: x = ' + C.fmtNum(-b / (2 * a), 4); }
        else { var re = (-b / (2 * a)).toFixed(3), im = (Math.sqrt(-d) / (2 * a)).toFixed(3); eqOut.textContent = 'Complex roots: ' + re + ' \u00B1 ' + im + 'i'; }
      }
      [ea, eb, ec].forEach(function (n) { n.addEventListener('input', debounce(solveEq)); });
      var solverCard = C.card('Equation Solver  (ax\u00B2 + bx + c = 0)', [el('div', { class: 'row-3' }, [field('a', ea), field('b', eb), field('c', ec)]), eqOut]);

      setTimeout(function () { plot(); solveEq(); }, 30);
      return el('div', { class: 'calc-grid' }, [calcCard, el('div', null, [graphCard, solverCard])]);
    }
  });

  /* ===================== Percentage Calculator ===================== */
  C.Calc.register({
    id: 'percentage', name: 'Percentage Calculator', category: 'Math', icon: '\u0025',
    description: 'X% of Y, increase/decrease, difference, reverse',
    render: function (root) {
      var out = C.resultBox();
      var modes = [
        { id: 'xofy', label: 'X% of Y' }, { id: 'inc', label: 'Increase' }, { id: 'dec', label: 'Decrease' },
        { id: 'diff', label: 'Difference' }, { id: 'rev', label: 'Reverse' }, { id: 'whatpct', label: 'X is what % of Y' }
      ];
      var a = numInput({ value: 20 }), b = numInput({ value: 250 });
      var labelA = el('span', { class: 'field-label' }, 'X (%)'), labelB = el('span', { class: 'field-label' }, 'Y');
      var mode = 'xofy';
      function calc() {
        var x = parseFloat(a.value) || 0, y = parseFloat(b.value) || 0, res, formula, steps;
        switch (mode) {
          case 'xofy': res = x / 100 * y; formula = x + '% of ' + y; steps = '(' + x + ' \u00F7 100) \u00D7 ' + y + ' = ' + C.fmtNum(res, 4); break;
          case 'inc': res = y * (1 + x / 100); formula = y + ' increased by ' + x + '%'; steps = y + ' + (' + x + '% \u00D7 ' + y + ') = ' + C.fmtNum(res, 4); break;
          case 'dec': res = y * (1 - x / 100); formula = y + ' decreased by ' + x + '%'; steps = y + ' \u2212 (' + x + '% \u00D7 ' + y + ') = ' + C.fmtNum(res, 4); break;
          case 'diff': res = (Math.abs(x - y) / ((x + y) / 2)) * 100; formula = '% difference between ' + x + ' and ' + y; steps = '|' + x + '\u2212' + y + '| \u00F7 avg \u00D7 100 = ' + C.fmtNum(res, 4) + '%'; break;
          case 'rev': res = x / (1 + y / 100); formula = x + ' is the value after a ' + y + '% increase; original ='; steps = x + ' \u00F7 (1 + ' + y + '%) = ' + C.fmtNum(res, 4); break;
          case 'whatpct': res = y !== 0 ? (x / y) * 100 : 0; formula = x + ' is what % of ' + y; steps = '(' + x + ' \u00F7 ' + y + ') \u00D7 100 = ' + C.fmtNum(res, 4) + '%'; break;
        }
        out.innerHTML = '';
        out.appendChild(el('div', { class: 'big-result' }, C.fmtNum(res, 4) + (mode === 'diff' || mode === 'whatpct' ? '%' : '')));
        out.appendChild(el('div', { class: 'card', style: { marginTop: '14px' } }, el('div', { class: 'card-body steps' }, [el('div', { class: 'step' }, el('b', null, formula)), el('div', { class: 'step' }, steps)])));
      }
      function setLabels() {
        var map = { xofy: ['X (%)', 'Y'], inc: ['Increase (%)', 'Value'], dec: ['Decrease (%)', 'Value'], diff: ['Value A', 'Value B'], rev: ['Final Value', 'Increase (%)'], whatpct: ['X', 'Y'] };
        labelA.textContent = map[mode][0]; labelB.textContent = map[mode][1];
      }
      var tabBar = C.tabs(modes, function (id) { mode = id; setLabels(); calc(); });
      [a, b].forEach(function (n) { n.addEventListener('input', debounce(calc)); });
      setLabels(); setTimeout(calc, 0);
      return el('div', null, [tabBar, el('div', { class: 'calc-grid' }, [C.card('Inputs', [el('label', { class: 'field' }, [labelA, a]), el('label', { class: 'field' }, [labelB, b])]), out])]);
    }
  });

  /* ===================== Fraction Calculator ===================== */
  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = b; b = a % b; a = t; } return a || 1; }
  C.Calc.register({
    id: 'fraction', name: 'Fraction Calculator', category: 'Math', icon: '\u00BD',
    description: 'Add, subtract, multiply, divide fractions',
    render: function (root) {
      var out = C.resultBox();
      var n1 = numInput({ value: 1 }), d1 = numInput({ value: 2 }), n2 = numInput({ value: 3 }), d2 = numInput({ value: 4 });
      var op = selectInput([{ value: '+', label: '+' }, { value: '-', label: '\u2212' }, { value: '*', label: '\u00D7' }, { value: '/', label: '\u00F7' }], { value: '+' });
      function calc() {
        var a = parseFloat(n1.value) || 0, b = parseFloat(d1.value) || 1, c = parseFloat(n2.value) || 0, d = parseFloat(d2.value) || 1;
        var rn, rd; var o = op.value;
        if (o === '+') { rn = a * d + c * b; rd = b * d; } else if (o === '-') { rn = a * d - c * b; rd = b * d; } else if (o === '*') { rn = a * c; rd = b * d; } else { rn = a * d; rd = b * c; }
        var g = gcd(rn, rd); var sn = rn / g, sd = rd / g; if (sd < 0) { sd = -sd; sn = -sn; }
        var whole = Math.trunc(sn / sd), rem = Math.abs(sn % sd);
        out.innerHTML = '';
        out.appendChild(el('div', { class: 'big-result' }, sn + ' / ' + sd));
        out.appendChild(el('div', { class: 'card', style: { marginTop: '14px' } }, el('div', { class: 'card-body steps' }, [
          el('div', { class: 'step' }, 'Decimal: ' + C.fmtNum(sn / sd, 6)),
          el('div', { class: 'step' }, 'Mixed number: ' + (whole !== 0 ? whole + ' ' + rem + '/' + sd : sn + '/' + sd)),
          el('div', { class: 'step muted' }, 'Simplified from ' + rn + '/' + rd)
        ])));
      }
      [n1, d1, n2, d2, op].forEach(function (n) { n.addEventListener('input', debounce(calc)); n.addEventListener('change', debounce(calc)); });
      setTimeout(calc, 0);
      var frac = function (n, d) { return el('div', { style: { textAlign: 'center' } }, [n, el('div', { style: { borderTop: '2px solid var(--text)', margin: '6px 0' } }), d]); };
      return el('div', { class: 'calc-grid' }, [C.card('Fractions', [el('div', { style: { display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '12px', alignItems: 'center' } }, [frac(n1, d1), el('div', { style: { paddingTop: '20px' } }, op), frac(n2, d2)])]), out]);
    }
  });

  /* ===================== Average Calculator ===================== */
  C.Calc.register({
    id: 'average', name: 'Average Calculator', category: 'Math', icon: '\u{1F4D0}',
    description: 'Mean, median, mode, range & std deviation',
    render: function (root) {
      var out = C.resultBox();
      var ta = el('textarea', { class: 'inp', rows: 4, placeholder: 'e.g. 12, 18, 7, 25, 18, 9' });
      ta.value = '12, 18, 7, 25, 18, 9';
      function calc() {
        var nums = ta.value.split(/[\s,]+/).map(parseFloat).filter(function (x) { return isFinite(x); });
        if (!nums.length) { out.innerHTML = ''; out.appendChild(el('div', { class: 'note' }, 'Enter some numbers.')); return; }
        var n = nums.length; var sum = nums.reduce(function (a, b) { return a + b; }, 0); var mean = sum / n;
        var sorted = nums.slice().sort(function (a, b) { return a - b; });
        var median = n % 2 ? sorted[(n - 1) / 2] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
        var freq = {}, mode = [], maxF = 0;
        nums.forEach(function (x) { freq[x] = (freq[x] || 0) + 1; if (freq[x] > maxF) maxF = freq[x]; });
        Object.keys(freq).forEach(function (k) { if (freq[k] === maxF && maxF > 1) mode.push(k); });
        var variance = nums.reduce(function (a, b) { return a + (b - mean) * (b - mean); }, 0) / n;
        var std = Math.sqrt(variance);
        out.innerHTML = '';
        out.appendChild(el('div', { class: 'kpi-grid' }, [
          C.kpi('Mean', C.fmtNum(mean, 3), { class: 'primary' }), C.kpi('Median', C.fmtNum(median, 3)),
          C.kpi('Mode', mode.length ? mode.join(', ') : 'None'), C.kpi('Count', n),
          C.kpi('Sum', C.fmtNum(sum, 2)), C.kpi('Min', C.fmtNum(sorted[0], 2)),
          C.kpi('Max', C.fmtNum(sorted[n - 1], 2)), C.kpi('Std Dev', C.fmtNum(std, 3))
        ]));
      }
      ta.addEventListener('input', debounce(calc));
      setTimeout(calc, 0);
      return el('div', { class: 'calc-grid' }, [C.card('Numbers', [field('Enter numbers (comma or space separated)', ta)]), out]);
    }
  });
})();
