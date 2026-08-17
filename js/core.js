/* ============================================================
   CalcSuite Core — shared utilities, UI helpers, charts, router
   No external dependencies. Works fully offline.
   ============================================================ */
(function (global) {
  'use strict';

  /* ---------- DOM helpers ---------- */
  function el(tag, props, children) {
    var node = document.createElement(tag);
    if (props) {
      Object.keys(props).forEach(function (k) {
        if (k === 'class') node.className = props[k];
        else if (k === 'html') node.innerHTML = props[k];
        else if (k === 'text') node.textContent = props[k];
        else if (k === 'style' && typeof props[k] === 'object') {
          Object.assign(node.style, props[k]);
        } else if (k.indexOf('on') === 0 && typeof props[k] === 'function') {
          node.addEventListener(k.slice(2).toLowerCase(), props[k]);
        } else if (props[k] === true) {
          node.setAttribute(k, '');
        } else if (props[k] !== false && props[k] != null) {
          node.setAttribute(k, props[k]);
        }
      });
    }
    if (children != null) append(node, children);
    return node;
  }
  function append(node, children) {
    if (Array.isArray(children)) {
      children.forEach(function (c) { append(node, c); });
    } else if (children instanceof Node) {
      node.appendChild(children);
    } else if (children != null) {
      node.appendChild(document.createTextNode(String(children)));
    }
  }
  function qs(sel, root) { return (root || document).querySelector(sel); }
  function qsa(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  /* ---------- Number / currency formatting ---------- */
  var CURRENCIES = {
    INR: { symbol: '\u20B9', locale: 'en-IN' },
    USD: { symbol: '$', locale: 'en-US' },
    EUR: { symbol: '\u20AC', locale: 'de-DE' },
    GBP: { symbol: '\u00A3', locale: 'en-GB' },
    JPY: { symbol: '\u00A5', locale: 'ja-JP' },
    AUD: { symbol: 'A$', locale: 'en-AU' },
    CAD: { symbol: 'C$', locale: 'en-CA' }
  };
  function curCode() { return Store.get('currency', 'INR'); }
  function curSymbol() { return (CURRENCIES[curCode()] || CURRENCIES.INR).symbol; }
  function fmtMoney(v, opts) {
    opts = opts || {};
    var code = opts.code || curCode();
    var c = CURRENCIES[code] || CURRENCIES.INR;
    if (!isFinite(v)) v = 0;
    var s = new Intl.NumberFormat(c.locale, {
      maximumFractionDigits: opts.decimals != null ? opts.decimals : 2,
      minimumFractionDigits: opts.decimals != null ? opts.decimals : 0
    }).format(v);
    return c.symbol + s;
  }
  function fmtNum(v, decimals) {
    if (!isFinite(v)) v = 0;
    return new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: decimals != null ? decimals : 2,
      minimumFractionDigits: 0
    }).format(v);
  }
  function compact(v) {
    var sym = curSymbol();
    var abs = Math.abs(v);
    if (abs >= 1e7) return sym + (v / 1e7).toFixed(2) + ' Cr';
    if (abs >= 1e5) return sym + (v / 1e5).toFixed(2) + ' L';
    if (abs >= 1e3) return sym + (v / 1e3).toFixed(1) + 'K';
    return sym + fmtNum(v, 0);
  }

  /* ---------- localStorage wrapper ---------- */
  var Store = {
    get: function (key, def) {
      try {
        var v = localStorage.getItem('calcsuite:' + key);
        return v == null ? def : JSON.parse(v);
      } catch (e) { return def; }
    },
    set: function (key, val) {
      try { localStorage.setItem('calcsuite:' + key, JSON.stringify(val)); } catch (e) {}
    },
    remove: function (key) {
      try { localStorage.removeItem('calcsuite:' + key); } catch (e) {}
    }
  };

  /* ---------- Theme ---------- */
  var Theme = {
    init: function () {
      var saved = Store.get('theme', null);
      if (!saved) saved = (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
      Theme.apply(saved);
    },
    apply: function (mode) {
      document.documentElement.setAttribute('data-theme', mode);
      Store.set('theme', mode);
      var btn = qs('#themeToggle');
      if (btn) btn.textContent = mode === 'dark' ? '\u2600\uFE0F' : '\u{1F319}';
    },
    toggle: function () {
      var cur = document.documentElement.getAttribute('data-theme');
      Theme.apply(cur === 'dark' ? 'light' : 'dark');
      // redraw charts after theme change
      setTimeout(function () { Charts.redrawAll(); }, 30);
    }
  };

  /* ---------- Toast ---------- */
  function toast(msg) {
    var t = qs('#toast');
    if (!t) { t = el('div', { id: 'toast', class: 'toast' }); document.body.appendChild(t); }
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(t._timer);
    t._timer = setTimeout(function () { t.classList.remove('show'); }, 2200);
  }

  /* ---------- UI building blocks ---------- */
  function card(title, body, opts) {
    opts = opts || {};
    var head = title ? el('div', { class: 'card-head' }, [
      el('h3', null, title),
      opts.action || null
    ]) : null;
    return el('div', { class: 'card ' + (opts.class || '') }, [head, el('div', { class: 'card-body' }, body)]);
  }

  function field(label, inputNode, hint) {
    return el('label', { class: 'field' }, [
      el('span', { class: 'field-label' }, label),
      inputNode,
      hint ? el('span', { class: 'field-hint' }, hint) : null
    ]);
  }

  function numInput(opts) {
    opts = opts || {};
    var inp = el('input', {
      type: 'number', value: opts.value != null ? opts.value : '',
      step: opts.step || 'any', min: opts.min, max: opts.max,
      placeholder: opts.placeholder || '', id: opts.id || undefined
    });
    if (opts.oninput) inp.addEventListener('input', opts.oninput);
    return inp;
  }

  function selectInput(options, opts) {
    opts = opts || {};
    var sel = el('select', { id: opts.id || undefined });
    options.forEach(function (o) {
      var val = typeof o === 'object' ? o.value : o;
      var lbl = typeof o === 'object' ? o.label : o;
      var op = el('option', { value: val }, lbl);
      if (val == opts.value) op.selected = true;
      sel.appendChild(op);
    });
    if (opts.onchange) sel.addEventListener('change', opts.onchange);
    return sel;
  }

  function kpi(label, value, opts) {
    opts = opts || {};
    return el('div', { class: 'kpi ' + (opts.class || '') }, [
      el('div', { class: 'kpi-value', id: opts.id || undefined }, value),
      el('div', { class: 'kpi-label' }, label)
    ]);
  }

  function slider(opts) {
    var wrap = el('div', { class: 'slider-wrap' });
    var inp = el('input', { type: 'range', min: opts.min, max: opts.max, step: opts.step || 1, value: opts.value });
    inp.addEventListener('input', function () { if (opts.oninput) opts.oninput(parseFloat(inp.value)); });
    wrap.appendChild(inp);
    return wrap;
  }

  function tabs(items, onSelect) {
    var bar = el('div', { class: 'tabs' });
    var btns = [];
    items.forEach(function (it, i) {
      var b = el('button', { class: 'tab' + (i === 0 ? ' active' : '') }, it.label);
      b.addEventListener('click', function () {
        btns.forEach(function (x) { x.classList.remove('active'); });
        b.classList.add('active');
        onSelect(it.id, i);
      });
      btns.push(b); bar.appendChild(b);
    });
    return bar;
  }

  /* ---------- CSV / clipboard / print ---------- */
  function downloadCSV(filename, rows) {
    var csv = rows.map(function (r) {
      return r.map(function (c) {
        var s = String(c == null ? '' : c);
        if (/[",\n]/.test(s)) s = '"' + s.replace(/"/g, '""') + '"';
        return s;
      }).join(',');
    }).join('\n');
    var blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
    var url = URL.createObjectURL(blob);
    var a = el('a', { href: url, download: filename });
    document.body.appendChild(a); a.click();
    setTimeout(function () { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
    toast('Exported ' + filename);
  }
  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { toast('Copied'); }, function () { fallbackCopy(text); });
    } else { fallbackCopy(text); }
  }
  function fallbackCopy(text) {
    var ta = el('textarea', { style: { position: 'fixed', opacity: '0' } });
    ta.value = text; document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); toast('Copied'); } catch (e) {}
    document.body.removeChild(ta);
  }
  function printReport() { window.print(); }

  /* ---------- History ---------- */
  function saveHistory(calcId, label, detail) {
    var h = Store.get('history', []);
    h.unshift({ id: calcId, label: label, detail: detail, t: Date.now() });
    if (h.length > 100) h = h.slice(0, 100);
    Store.set('history', h);
  }

  /* ============================================================
     Charts — minimal canvas chart library (pie, line, bar, gauge)
     ============================================================ */
  var PALETTE = ['#4f7cff', '#22c55e', '#f59e0b', '#ef4444', '#a855f7', '#06b6d4', '#ec4899', '#84cc16'];
  var _registry = [];

  function cssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || '#888';
  }
  function prep(canvas) {
    var ratio = window.devicePixelRatio || 1;
    var rect = canvas.getBoundingClientRect();
    var w = rect.width || canvas.clientWidth || parseInt(canvas.getAttribute('width')) || 320;
    var h = parseInt(canvas.getAttribute('data-h')) || 240;
    canvas.width = w * ratio; canvas.height = h * ratio;
    canvas.style.height = h + 'px';
    var ctx = canvas.getContext('2d');
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, w, h);
    return { ctx: ctx, w: w, h: h };
  }
  function register(canvas, drawFn) {
    canvas._draw = drawFn;
    if (_registry.indexOf(canvas) === -1) _registry.push(canvas);
    drawFn();
  }

  var Charts = {
    palette: PALETTE,
    redrawAll: function () {
      _registry = _registry.filter(function (c) { return document.body.contains(c); });
      _registry.forEach(function (c) { if (c._draw) c._draw(); });
    },
    clear: function () { _registry = _registry.filter(function (c) { return document.body.contains(c); }); },

    pie: function (canvas, data, opts) {
      opts = opts || {};
      register(canvas, function () {
        var p = prep(canvas), ctx = p.ctx;
        var total = data.reduce(function (s, d) { return s + Math.max(0, d.value); }, 0) || 1;
        var cx = p.h / 2 + 6, cy = p.h / 2, r = p.h / 2 - 12;
        var inner = opts.donut ? r * 0.58 : 0;
        var start = -Math.PI / 2;
        data.forEach(function (d, i) {
          var ang = (Math.max(0, d.value) / total) * Math.PI * 2;
          ctx.beginPath(); ctx.moveTo(cx, cy);
          ctx.arc(cx, cy, r, start, start + ang);
          ctx.closePath();
          ctx.fillStyle = d.color || PALETTE[i % PALETTE.length];
          ctx.fill();
          start += ang;
        });
        if (inner) {
          ctx.beginPath(); ctx.arc(cx, cy, inner, 0, Math.PI * 2);
          ctx.fillStyle = cssVar('--surface'); ctx.fill();
        }
        // legend
        var lx = cx + r + 24, ly = cy - (data.length * 22) / 2 + 8;
        ctx.textBaseline = 'middle'; ctx.font = '13px system-ui, sans-serif';
        data.forEach(function (d, i) {
          var y = ly + i * 22;
          ctx.fillStyle = d.color || PALETTE[i % PALETTE.length];
          ctx.fillRect(lx, y - 6, 12, 12);
          ctx.fillStyle = cssVar('--text');
          var pct = ((Math.max(0, d.value) / total) * 100).toFixed(1);
          ctx.fillText(d.label + '  ' + pct + '%', lx + 20, y);
        });
      });
    },

    _axes: function (ctx, w, h, pad, maxV, labels, opts) {
      var grid = cssVar('--border'), txt = cssVar('--muted');
      ctx.strokeStyle = grid; ctx.lineWidth = 1; ctx.font = '11px system-ui, sans-serif';
      ctx.fillStyle = txt; ctx.textBaseline = 'middle';
      var steps = 4;
      for (var i = 0; i <= steps; i++) {
        var y = pad.t + (h - pad.t - pad.b) * (i / steps);
        ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(w - pad.r, y); ctx.stroke();
        var val = maxV * (1 - i / steps);
        ctx.textAlign = 'right';
        ctx.fillText(opts && opts.fmtY ? opts.fmtY(val) : fmtNum(val, 0), pad.l - 6, y);
      }
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      var n = labels.length;
      var every = Math.ceil(n / 8);
      labels.forEach(function (lb, i) {
        if (i % every !== 0 && i !== n - 1) return;
        var x = pad.l + (w - pad.l - pad.r) * (n === 1 ? 0.5 : i / (n - 1));
        ctx.fillText(lb, x, h - pad.b + 6);
      });
    },

    line: function (canvas, cfg) {
      register(canvas, function () {
        var p = prep(canvas), ctx = p.ctx, w = p.w, h = p.h;
        var pad = { l: 52, r: 16, t: 14, b: 26 };
        var all = [];
        cfg.datasets.forEach(function (d) { all = all.concat(d.data); });
        var maxV = Math.max.apply(null, all.concat([1]));
        maxV = niceMax(maxV);
        Charts._axes(ctx, w, h, pad, maxV, cfg.labels, cfg);
        var n = cfg.labels.length;
        cfg.datasets.forEach(function (ds, di) {
          var color = ds.color || PALETTE[di % PALETTE.length];
          ctx.beginPath();
          ds.data.forEach(function (v, i) {
            var x = pad.l + (w - pad.l - pad.r) * (n === 1 ? 0.5 : i / (n - 1));
            var y = pad.t + (h - pad.t - pad.b) * (1 - v / maxV);
            if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
          });
          ctx.strokeStyle = color; ctx.lineWidth = 2.4; ctx.lineJoin = 'round'; ctx.stroke();
          if (ds.fill) {
            ctx.lineTo(pad.l + (w - pad.l - pad.r), h - pad.b);
            ctx.lineTo(pad.l, h - pad.b); ctx.closePath();
            ctx.globalAlpha = 0.12; ctx.fillStyle = color; ctx.fill(); ctx.globalAlpha = 1;
          }
        });
      });
    },

    bar: function (canvas, cfg) {
      register(canvas, function () {
        var p = prep(canvas), ctx = p.ctx, w = p.w, h = p.h;
        var pad = { l: 52, r: 16, t: 14, b: 26 };
        var ds = cfg.datasets;
        var all = [];
        ds.forEach(function (d) { all = all.concat(d.data); });
        var maxV = niceMax(Math.max.apply(null, all.concat([1])));
        Charts._axes(ctx, w, h, pad, maxV, cfg.labels, cfg);
        var n = cfg.labels.length;
        var groupW = (w - pad.l - pad.r) / n;
        var barW = Math.min(groupW * 0.7 / ds.length, 40);
        cfg.labels.forEach(function (lb, i) {
          ds.forEach(function (d, di) {
            var v = d.data[i] || 0;
            var x = pad.l + groupW * i + groupW / 2 - (ds.length * barW) / 2 + di * barW;
            var bh = (h - pad.t - pad.b) * (v / maxV);
            ctx.fillStyle = d.color || PALETTE[di % PALETTE.length];
            ctx.fillRect(x, h - pad.b - bh, barW - 2, bh);
          });
        });
      });
    },

    stackedBar: function (canvas, cfg) {
      register(canvas, function () {
        var p = prep(canvas), ctx = p.ctx, w = p.w, h = p.h;
        var pad = { l: 52, r: 16, t: 14, b: 26 };
        var n = cfg.labels.length;
        var totals = [];
        for (var i = 0; i < n; i++) {
          var t = 0; cfg.datasets.forEach(function (d) { t += d.data[i] || 0; }); totals.push(t);
        }
        var maxV = niceMax(Math.max.apply(null, totals.concat([1])));
        Charts._axes(ctx, w, h, pad, maxV, cfg.labels, cfg);
        var groupW = (w - pad.l - pad.r) / n;
        var barW = Math.min(groupW * 0.6, 46);
        cfg.labels.forEach(function (lb, i) {
          var base = h - pad.b;
          cfg.datasets.forEach(function (d, di) {
            var v = d.data[i] || 0;
            var bh = (h - pad.t - pad.b) * (v / maxV);
            var x = pad.l + groupW * i + groupW / 2 - barW / 2;
            ctx.fillStyle = d.color || PALETTE[di % PALETTE.length];
            ctx.fillRect(x, base - bh, barW, bh);
            base -= bh;
          });
        });
      });
    },

    gauge: function (canvas, value, opts) {
      opts = opts || {};
      register(canvas, function () {
        var p = prep(canvas), ctx = p.ctx, w = p.w, h = p.h;
        var cx = w / 2, cy = h * 0.82, r = Math.min(w / 2 - 16, h * 0.7);
        var min = opts.min || 0, max = opts.max || 100;
        var segs = opts.segments || [{ to: max, color: PALETTE[0] }];
        var a0 = Math.PI, a1 = 2 * Math.PI;
        ctx.lineWidth = 16; ctx.lineCap = 'butt';
        var prev = min;
        segs.forEach(function (s) {
          var sa = a0 + (a1 - a0) * ((prev - min) / (max - min));
          var ea = a0 + (a1 - a0) * ((s.to - min) / (max - min));
          ctx.beginPath(); ctx.strokeStyle = s.color; ctx.arc(cx, cy, r, sa, ea); ctx.stroke();
          prev = s.to;
        });
        var val = Math.max(min, Math.min(max, value));
        var na = a0 + (a1 - a0) * ((val - min) / (max - min));
        ctx.beginPath(); ctx.strokeStyle = cssVar('--text'); ctx.lineWidth = 3;
        ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(na) * (r - 4), cy + Math.sin(na) * (r - 4)); ctx.stroke();
        ctx.beginPath(); ctx.arc(cx, cy, 6, 0, Math.PI * 2); ctx.fillStyle = cssVar('--text'); ctx.fill();
        ctx.fillStyle = cssVar('--text'); ctx.textAlign = 'center'; ctx.font = 'bold 22px system-ui, sans-serif';
        ctx.fillText(opts.label != null ? opts.label : fmtNum(value, 1), cx, cy - 18);
        if (opts.sub) { ctx.font = '12px system-ui, sans-serif'; ctx.fillStyle = cssVar('--muted'); ctx.fillText(opts.sub, cx, cy + 4); }
      });
    },

    progress: function (canvas, pct, opts) {
      opts = opts || {};
      register(canvas, function () {
        var p = prep(canvas), ctx = p.ctx, w = p.w, h = p.h;
        var bh = 22, y = h / 2 - bh / 2;
        ctx.fillStyle = cssVar('--border');
        roundRect(ctx, 0, y, w, bh, 11); ctx.fill();
        var fillW = Math.max(0, Math.min(1, pct / 100)) * w;
        ctx.fillStyle = opts.color || PALETTE[1];
        roundRect(ctx, 0, y, fillW, bh, 11); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.font = 'bold 12px system-ui, sans-serif';
        ctx.fillText(pct.toFixed(1) + '%', Math.max(28, fillW - 22), y + bh / 2);
      });
    }
  };

  function roundRect(ctx, x, y, w, h, r) {
    r = Math.min(r, h / 2, w / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  function niceMax(v) {
    if (v <= 0) return 1;
    var mag = Math.pow(10, Math.floor(Math.log10(v)));
    var n = v / mag;
    var step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
    return step * mag;
  }

  window.addEventListener('resize', function () {
    clearTimeout(window._chartResize);
    window._chartResize = setTimeout(function () { Charts.redrawAll(); }, 150);
  });

  /* ============================================================
     Calc registry + router
     ============================================================ */
  var registry = [];
  var byId = {};
  var Calc = {
    register: function (def) { registry.push(def); byId[def.id] = def; },
    all: function () { return registry; },
    get: function (id) { return byId[id]; },
    categories: function () {
      var order = ['Financial', 'Math', 'Health', 'Date & Time'];
      var map = {};
      registry.forEach(function (c) { (map[c.category] = map[c.category] || []).push(c); });
      return order.filter(function (o) { return map[o]; }).map(function (o) { return { name: o, items: map[o] }; });
    }
  };

  /* ---------- Result panel helper ---------- */
  function resultBox(id) { return el('div', { class: 'result-area', id: id || undefined }); }

  global.CS = {
    el: el, qs: qs, qsa: qsa, append: append,
    fmtMoney: fmtMoney, fmtNum: fmtNum, compact: compact,
    curCode: curCode, curSymbol: curSymbol, CURRENCIES: CURRENCIES,
    Store: Store, Theme: Theme, toast: toast,
    card: card, field: field, numInput: numInput, selectInput: selectInput,
    kpi: kpi, slider: slider, tabs: tabs, resultBox: resultBox,
    downloadCSV: downloadCSV, copyText: copyText, printReport: printReport,
    saveHistory: saveHistory,
    Charts: Charts, Calc: Calc
  };
})(window);
