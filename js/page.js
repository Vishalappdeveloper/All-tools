/* Per-page controller for Calculator.net-style SEO pages.
   Reads window.__CALC_ID, mounts the calculator, wires header + 15-feature toolbar. */
(function () {
  'use strict';
  var C = window.CS, SEO = window.SEO;
  var el = C.el, qs = C.qs;

  /* ---------- Header / theme / search setup (must never block the calculator) ---------- */
  try {
  /* ---------- Theme ---------- */
  C.Theme.init();
  var tBtn = qs('#themeToggle');
  if (tBtn) tBtn.addEventListener('click', function () { C.Theme.toggle(); });

  /* ---------- Currency selector ---------- */
  var curSel = qs('#curSelect');
  if (curSel) {
    Object.keys(C.CURRENCIES).forEach(function (code) {
      var o = el('option', { value: code }, code + ' (' + C.CURRENCIES[code].symbol + ')');
      if (code === C.curCode()) o.selected = true;
      curSel.appendChild(o);
    });
    curSel.addEventListener('change', function () {
      C.Store.set('currency', curSel.value);
      C.toast(curSel.value + ' selected');
      remount();
    });
  }

  /* ---------- Header search ---------- */
  var sInput = qs('#searchInput'), sBox = qs('#searchResults');
  function runSearch() {
    if (!sInput || !sBox) return;
    var q = sInput.value.trim().toLowerCase();
    sBox.innerHTML = '';
    if (!q) { sBox.style.display = 'none'; return; }
    var hits = SEO.ORDER.filter(function (id) {
      var t = SEO.TOOLS[id];
      return t.name.toLowerCase().indexOf(q) >= 0 || (t.keywords || '').toLowerCase().indexOf(q) >= 0 || t.cat.toLowerCase().indexOf(q) >= 0;
    }).slice(0, 8);
    if (!hits.length) { sBox.innerHTML = '<a>No calculators found</a>'; sBox.style.display = 'block'; return; }
    hits.forEach(function (id) {
      var t = SEO.TOOLS[id];
      var a = el('a', { href: t.slug + '.html' }, t.icon + '  ' + t.name);
      sBox.appendChild(a);
    });
    sBox.style.display = 'block';
  }
  if (sInput) {
    sInput.addEventListener('input', runSearch);
    sInput.addEventListener('focus', runSearch);
    document.addEventListener('click', function (e) {
      if (sBox && !sBox.contains(e.target) && e.target !== sInput) sBox.style.display = 'none';
    });
  }

  } catch (ePageInit) { try { console.error('[page:init]', ePageInit); } catch (e2) {} }

  /* ---------- Mount calculator ---------- */
  var calcId = window.__CALC_ID;
  var mount = qs('#calcMount');
  function remount() {
    if (!mount || !calcId) return;
    var def = C.Calc.get(calcId);
    if (!def) { mount.innerHTML = '<p>Calculator unavailable.</p>'; return; }
    mount.innerHTML = '';
    try { mount.appendChild(def.render(mount)); }
    catch (e) { mount.innerHTML = '<p>Something went wrong loading this calculator.</p>'; }
  }
  remount();

  /* ---------- Result scraping for copy / CSV ---------- */
  function gatherResults() {
    var rows = [];
    C.qsa('.kpi', mount).forEach(function (k) {
      var v = k.querySelector('.kpi-value'), l = k.querySelector('.kpi-label');
      if (v && l) rows.push([l.textContent.trim(), v.textContent.trim()]);
    });
    if (!rows.length) {
      C.qsa('.result-row, .res-line', mount).forEach(function (r) {
        rows.push([r.textContent.trim()]);
      });
    }
    return rows;
  }
  function resultText() {
    var rows = gatherResults();
    if (!rows.length) return document.title;
    return rows.map(function (r) { return r.join(': '); }).join('\n');
  }

  /* ---------- Embed / share modal ---------- */
  function modal(title, value) {
    var m = qs('#csModal');
    if (!m) {
      m = el('div', { id: 'csModal', class: 'cs-modal' });
      m.innerHTML = '<div class="box"><h3></h3><textarea readonly></textarea><div class="row"><button class="close">Close</button><button class="primary copy">Copy</button></div></div>';
      document.body.appendChild(m);
      m.querySelector('.close').addEventListener('click', function () { m.classList.remove('open'); });
      m.querySelector('.copy').addEventListener('click', function () { C.copyText(m.querySelector('textarea').value); });
      m.addEventListener('click', function (e) { if (e.target === m) m.classList.remove('open'); });
    }
    m.querySelector('h3').textContent = title;
    var ta = m.querySelector('textarea'); ta.value = value;
    m.classList.add('open'); ta.select();
  }

  /* ---------- 15-feature toolbar ---------- */
  var BTNS = [
    { t: '\uD83D\uDDA8\uFE0F Print', fn: function () { window.print(); } },
    { t: '\uD83D\uDCC4 PDF', fn: function () { C.toast('Choose \u201CSave as PDF\u201D in the print dialog'); setTimeout(function () { window.print(); }, 400); } },
    { t: '\uD83D\uDCCA Excel/CSV', fn: function () {
        var rows = gatherResults();
        if (!rows.length) { C.toast('Enter values first'); return; }
        C.downloadCSV((calcId || 'calculator') + '-result.csv', [['Field', 'Value']].concat(rows));
      } },
    { t: '{ } JSON', fn: function () {
        var rows = gatherResults();
        if (!rows.length) { C.toast('Enter values first'); return; }
        var obj = {}; rows.forEach(function (r) { obj[r[0]] = r[1] === undefined ? r[0] : r[1]; });
        dl((calcId || 'calculator') + '-result.json', 'application/json', JSON.stringify({ calculator: calcId, url: location.href, results: obj }, null, 2));
      } },
    { t: '\u003C\u003E XML', fn: function () {
        var rows = gatherResults();
        if (!rows.length) { C.toast('Enter values first'); return; }
        var xml = '<?xml version="1.0" encoding="UTF-8"?>\n<result calculator="' + (calcId || '') + '">\n' + rows.map(function (r) { return '  <item label="' + String(r[0]).replace(/"/g, '&quot;') + '">' + String(r[1] === undefined ? '' : r[1]).replace(/&/g, '&amp;').replace(/</g, '&lt;') + '</item>'; }).join('\n') + '\n</result>\n';
        dl((calcId || 'calculator') + '-result.xml', 'application/xml', xml);
      } },
    { t: '\uD83D\uDCCB Copy', fn: function () { C.copyText(resultText()); } },
    { t: '\uD83D\uDD17 Share', fn: function () { C.copyText(location.href); C.toast('Link copied'); } },
    { t: '\u003C\u002F\u003E Embed', fn: function () {
        var src = location.origin + location.pathname + '?embed=1';
        modal('Embed this calculator', '<iframe src="' + src + '" width="100%" height="640" style="border:1px solid #ddd;border-radius:6px" loading="lazy"></iframe>');
      } },
    { t: '\uD83D\uDCBE Save', fn: function () {
        var saved = C.Store.get('saved:' + calcId, []);
        saved.unshift({ when: Date.now(), result: resultText() });
        C.Store.set('saved:' + calcId, saved.slice(0, 20));
        C.toast('Calculation saved');
      } },
    { t: '\uD83D\uDD52 History', fn: function () {
        var saved = C.Store.get('saved:' + calcId, []);
        modal('Saved calculations (' + saved.length + ')', saved.length ? saved.map(function (s) { return new Date(s.when).toLocaleString() + '\n' + s.result; }).join('\n\n') : 'No saved calculations yet. Use Save to store one.');
      } },
    { t: '\u267B\uFE0F Reset', fn: function () { remount(); C.toast('Reset'); } }
  ];
  function dl(name, mime, content) {
    try { var b = new Blob([content], { type: mime }); var u = URL.createObjectURL(b); var a = el('a', { href: u, download: name }); document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(u); a.remove(); }, 100); C.toast('Downloaded ' + name); }
    catch (e) { C.toast('Export failed'); }
  }
  var bar = qs('#featBar');
  if (bar) {
    BTNS.forEach(function (b) {
      var btn = el('button', { type: 'button' }, b.t);
      btn.addEventListener('click', b.fn);
      bar.appendChild(btn);
    });
  }


  /* ---------- Universal result chart ---------- */
  (function () {
    var box = qs('#resultChart'); if (!box || !mount) return;
    function hasDigit(s){ for (var i=0;i<s.length;i++){ var c=s.charCodeAt(i); if(c>=48&&c<=57) return true; } return false; }
    function num(s){ s=String(s); var out='',seen=false,dot=false,sign=''; for(var i=0;i<s.length;i++){ var ch=s.charAt(i); if((ch==='-'||ch==='+')&&out===''&&!seen){ sign = ch==='-'?'-':''; } else if(ch>='0'&&ch<='9'){ out+=ch; seen=true; } else if(ch==='.'&&!dot&&seen){ out+='.'; dot=true; } else if(seen){ break; } } if(!seen) return null; var v=parseFloat(sign+out); return isFinite(v)?v:null; }
    function draw(){
      var rows = gatherResults(); var pts=[];
      rows.forEach(function(r){ if(r.length>=2 && hasDigit(String(r[1]))){ var v=num(r[1]); if(v!==null && isFinite(v)) pts.push({ l:r[0], v:v }); } });
      if(pts.length<1){ box.style.display='none'; box.innerHTML=''; return; }
      pts = pts.slice(0,10);
      box.style.display='';
      var W = box.clientWidth || 600, H = 220, pad = 34;
      box.innerHTML = '<div class="rc-h">Result visualization</div><canvas></canvas>';
      var cnv = box.querySelector('canvas'); cnv.width = W; cnv.height = H;
      var ctx = cnv.getContext('2d'); if(!ctx) return;
      var css = getComputedStyle(document.documentElement);
      var c1 = (css.getPropertyValue('--brand1')||'').trim() || '#6366f1';
      var tcol = (css.getPropertyValue('--text')||'').trim() || '#0f172a';
      var max=0; pts.forEach(function(p){ if(Math.abs(p.v)>max) max=Math.abs(p.v); });
      var top = max>0?max:1; var bw=(W-pad*2)/pts.length; var base=H-22;
      ctx.clearRect(0,0,W,H);
      ctx.strokeStyle='rgba(148,163,184,.3)'; ctx.beginPath(); ctx.moveTo(pad,base); ctx.lineTo(W-6,base); ctx.stroke();
      pts.forEach(function(p,i){
        var h=Math.max(3,(Math.abs(p.v)/(top||1))*(H-60));
        var x=pad+i*bw+6, y=base-h, w=Math.max(10,bw-16);
        var g=ctx.createLinearGradient(0,y,0,base); g.addColorStop(0,c1); g.addColorStop(1,'rgba(99,102,241,.30)');
        ctx.fillStyle=g; ctx.fillRect(x,y,w,h);
        ctx.fillStyle=tcol; ctx.font='600 11px Inter,system-ui,sans-serif'; ctx.textAlign='center';
        var val=Math.round(p.v*100)/100; ctx.fillText(String(val), x+w/2, y-5);
        ctx.fillStyle='#94a3b8'; ctx.font='10px Inter,system-ui,sans-serif';
        var lbl=String(p.l||'').slice(0,14); ctx.fillText(lbl, x+w/2, base+14);
      });
    }
    mount.addEventListener('input', function(){ setTimeout(draw,40); });
    mount.addEventListener('change', function(){ setTimeout(draw,40); });
    mount.addEventListener('click', function(){ setTimeout(draw,80); });
    window.addEventListener('resize', function(){ setTimeout(draw,120); });
    setTimeout(draw,250);
  })();



  /* ---------- Phase 2: Universal advanced tool experience ---------- */
  (function(){
    try{
      if(!calcId || !mount || document.getElementById('phase2ToolPanel')) return;
      var info = (SEO && SEO.TOOLS && SEO.TOOLS[calcId]) || {};
      function e(tag, cls, html){ var x=document.createElement(tag); if(cls)x.className=cls; if(html!=null)x.innerHTML=html; return x; }
      function safe(x){ return String(x==null?'':x).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]}); }
      var css=e('style',null,`.p2-wrap{margin:18px 0 26px;display:grid;gap:16px}.p2-panel{border:1px solid var(--border,#e5e7eb);background:var(--card,#fff);border-radius:18px;padding:16px;box-shadow:0 6px 18px rgba(15,23,42,.05)}.p2-head{display:flex;gap:12px;align-items:flex-start;justify-content:space-between;margin-bottom:12px}.p2-head h2{margin:0;font-size:1.25rem}.p2-badge{font-size:.78rem;padding:5px 9px;border-radius:999px;background:#fff7ed;color:#9a3412;font-weight:800}.p2-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:10px}.p2-opt{border:1px solid var(--border,#e5e7eb);border-radius:14px;padding:12px;background:rgba(248,250,252,.65)}.p2-opt label{display:block;font-weight:800;font-size:.84rem;margin-bottom:7px}.p2-opt input,.p2-opt select{width:100%;padding:10px;border:1px solid var(--border,#e5e7eb);border-radius:10px;background:#fff}.p2-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.p2-actions button{border:1px solid var(--border,#e5e7eb);background:#fff;border-radius:11px;padding:9px 11px;font-weight:800;cursor:pointer}.p2-actions button.primary{background:#f59e0b;border-color:#f59e0b;color:#171717}.p2-tabs{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px}.p2-tabs button{border:1px solid var(--border,#e5e7eb);background:#fff;border-radius:999px;padding:8px 12px;font-weight:800;cursor:pointer}.p2-tabs button.on{background:#111827;color:#fff}.p2-tabbody{color:var(--muted,#64748b);line-height:1.65}.p2-tabbody ul,.p2-tabbody ol{margin-top:8px}.p2-related{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px}.p2-related a{border:1px solid var(--border,#e5e7eb);border-radius:13px;padding:11px;text-decoration:none;background:#fff}.p2-note{font-size:.9rem;color:var(--muted,#64748b)}@media(max-width:640px){.p2-head{display:block}.p2-actions button{flex:1 1 auto}}`);document.head.appendChild(css);
      var panel=e('section','p2-wrap'); panel.id='phase2ToolPanel';
      var adv=e('div','p2-panel');
      adv.innerHTML='<div class="p2-head"><div><h2>Advanced options</h2><div class="p2-note">Use these universal controls for precision, export, sharing and result formatting.</div></div><span class="p2-badge">Phase 2</span></div><div class="p2-grid"><div class="p2-opt"><label>Decimal precision</label><select id="p2Precision"><option value="0">0 decimals</option><option value="2" selected>2 decimals</option><option value="4">4 decimals</option><option value="6">6 decimals</option></select></div><div class="p2-opt"><label>Rounding mode</label><select id="p2Round"><option>Standard</option><option>Floor</option><option>Ceil</option><option>Scientific</option></select></div><div class="p2-opt"><label>Result label</label><input id="p2Label" placeholder="Optional note for saved result"></div><div class="p2-opt"><label>Theme for this tool</label><select id="p2Theme"><option value="auto">Auto</option><option value="light">Light</option><option value="dark">Dark</option></select></div></div><div class="p2-actions"><button class="primary" id="p2Recalc">Calculate / refresh</button><button id="p2CopyPage">Copy page link</button><button id="p2CopyResult">Copy result</button><button id="p2DownloadTxt">Download TXT</button><button id="p2SavePreset">Save preset</button><button id="p2LoadPreset">Load preset</button></div>';
      mount.parentNode.insertBefore(panel, mount.nextSibling); panel.appendChild(adv);
      var guide=e('div','p2-panel');
      var formula=info.formula || ('Use the values entered above. The result is calculated instantly in your browser using the standard '+(info.name||document.title)+' method.');
      var examples=info.examples||['Enter sample values, click calculate, then compare the result with the formula explanation.','Change precision and rounding options to see how the final answer is displayed.'];
      var faqs=info.faqs||[{q:'Is this tool free?',a:'Yes, this allfreecalculators.in tool is free to use.'},{q:'Can I save or export results?',a:'Yes, use the toolbar and advanced options to copy, save, print or download results.'}];
      guide.innerHTML='<div class="p2-tabs"><button class="on" data-tab="how">How to use</button><button data-tab="formula">Formula</button><button data-tab="examples">Examples</button><button data-tab="faq">FAQ</button><button data-tab="mistakes">Common mistakes</button></div><div class="p2-tabbody" id="p2TabBody"></div>';
      panel.appendChild(guide);
      var bodies={how:'<ol><li>Enter the required values in the calculator above.</li><li>Choose advanced options such as precision, rounding or display mode.</li><li>Review the instant result, formula, examples and related tools.</li><li>Use copy, print, CSV, JSON, embed or save actions when needed.</li></ol>',formula:'<p><b>Formula / method:</b></p><p>'+safe(formula)+'</p>',examples:'<ul>'+examples.map(function(x){return '<li>'+safe(typeof x==='string'?x:JSON.stringify(x))+'</li>';}).join('')+'</ul>',faq:'<div>'+faqs.map(function(f){return '<details><summary>'+safe(f.q||'Question')+'</summary><p>'+safe(f.a||'Answer')+'</p></details>';}).join('')+'</div>',mistakes:'<ul><li>Check units before comparing results.</li><li>Do not mix monthly and yearly rates unless the tool asks for it.</li><li>Use enough decimal precision for finance, science and converter tools.</li><li>For medical, financial or legal decisions, verify important results independently.</li></ul>'};
      function show(t){ var body=document.getElementById('p2TabBody'); if(body) body.innerHTML=bodies[t]||bodies.how; Array.prototype.forEach.call(guide.querySelectorAll('.p2-tabs button'),function(b){b.className=b.getAttribute('data-tab')===t?'on':''}); }
      guide.addEventListener('click',function(ev){ if(ev.target && ev.target.getAttribute('data-tab')) show(ev.target.getAttribute('data-tab')); }); show('how');
      /* Phase 3: category-specific advanced options */
      var cat=String(info.cat||info.category||'').toLowerCase(), nm=String(info.name||document.title||'').toLowerCase();
      function catType(){
        if(/finance|loan|emi|sip|tax|gst|interest|salary|mortgage|investment/.test(cat+' '+nm)) return 'finance';
        if(/health|bmi|calorie|weight|body|medical|fitness/.test(cat+' '+nm)) return 'health';
        if(/converter|conversion|unit|currency|length|area|volume|temperature|weight|mass|speed|time/.test(cat+' '+nm)) return 'converter';
        if(/developer|web|json|html|css|url|base64|text|slug|password|generator/.test(cat+' '+nm)) return 'developer';
        if(/image|pdf|file/.test(cat+' '+nm)) return 'file';
        if(/math|geometry|statistics|algebra|percentage/.test(cat+' '+nm)) return 'math';
        return 'general';
      }
      var type=catType();
      var spec=e('div','p2-panel'); spec.id='phase3CategoryOptions';
      var specHtml={
        finance:'<div class="p2-head"><div><h2>Finance options</h2><div class="p2-note">For EMI, tax, SIP, loan, salary and investment calculators.</div></div><span class="p2-badge">Finance</span></div><div class="p2-grid"><div class="p2-opt"><label>Currency</label><select id="p3Currency"><option>INR ₹</option><option>USD $</option><option>EUR €</option><option>GBP £</option><option>AED د.إ</option></select></div><div class="p2-opt"><label>Period type</label><select id="p3Period"><option>Monthly</option><option>Yearly</option><option>Daily</option></select></div><div class="p2-opt"><label>Include fees/taxes</label><select id="p3Fees"><option>No</option><option>Yes</option></select></div><div class="p2-opt"><label>Show breakdown</label><select id="p3Break"><option>Summary</option><option>Detailed table</option><option>Chart + table</option></select></div></div>',
        health:'<div class="p2-head"><div><h2>Health options</h2><div class="p2-note">For BMI, calories, fitness and wellness calculators.</div></div><span class="p2-badge">Health</span></div><div class="p2-grid"><div class="p2-opt"><label>Unit system</label><select id="p3Units"><option>Metric</option><option>Imperial</option></select></div><div class="p2-opt"><label>Profile mode</label><select id="p3Profile"><option>General</option><option>Adult</option><option>Child/teen</option><option>Athlete</option></select></div><div class="p2-opt"><label>Show guidance</label><select id="p3Guidance"><option>Basic</option><option>Detailed</option></select></div><div class="p2-opt"><label>Disclaimer level</label><select id="p3Disc"><option>Standard</option><option>Medical caution</option></select></div></div>',
        converter:'<div class="p2-head"><div><h2>Converter options</h2><div class="p2-note">For unit, currency and measurement converters.</div></div><span class="p2-badge">Converter</span></div><div class="p2-grid"><div class="p2-opt"><label>Direction</label><select id="p3Direction"><option>Normal</option><option>Swap from/to</option></select></div><div class="p2-opt"><label>Notation</label><select id="p3Notation"><option>Standard</option><option>Scientific</option><option>Engineering</option></select></div><div class="p2-opt"><label>Conversion table</label><select id="p3Table"><option>Show common values</option><option>Hide table</option></select></div><div class="p2-opt"><label>Copy format</label><select id="p3Copy"><option>Value only</option><option>Value + unit</option><option>Formula + result</option></select></div></div>',
        developer:'<div class="p2-head"><div><h2>Developer/text options</h2><div class="p2-note">For JSON, Base64, URL, text, code and generator tools.</div></div><span class="p2-badge">Developer</span></div><div class="p2-grid"><div class="p2-opt"><label>Output format</label><select id="p3Out"><option>Pretty</option><option>Minified</option><option>Raw</option></select></div><div class="p2-opt"><label>Encoding</label><select id="p3Enc"><option>UTF-8</option><option>ASCII</option></select></div><div class="p2-opt"><label>Line endings</label><select id="p3Line"><option>Auto</option><option>LF</option><option>CRLF</option></select></div><div class="p2-opt"><label>Validation</label><select id="p3Val"><option>Strict</option><option>Lenient</option></select></div></div>',
        file:'<div class="p2-head"><div><h2>File options</h2><div class="p2-note">For image/PDF/file tools. Processing remains browser-side where possible.</div></div><span class="p2-badge">File</span></div><div class="p2-grid"><div class="p2-opt"><label>Quality</label><select id="p3Quality"><option>Balanced</option><option>High</option><option>Small file</option></select></div><div class="p2-opt"><label>Output type</label><select id="p3FileType"><option>Auto</option><option>PNG</option><option>JPG</option><option>PDF</option><option>WEBP</option></select></div><div class="p2-opt"><label>Privacy mode</label><select id="p3Privacy"><option>Local browser</option></select></div><div class="p2-opt"><label>Batch mode</label><select id="p3Batch"><option>Single</option><option>Multiple files</option></select></div></div>',
        math:'<div class="p2-head"><div><h2>Math options</h2><div class="p2-note">For math, statistics, geometry and percentage tools.</div></div><span class="p2-badge">Math</span></div><div class="p2-grid"><div class="p2-opt"><label>Answer format</label><select id="p3Ans"><option>Decimal</option><option>Fraction</option><option>Mixed</option></select></div><div class="p2-opt"><label>Show steps</label><select id="p3Steps"><option>Yes</option><option>No</option></select></div><div class="p2-opt"><label>Notation</label><select id="p3MathNotation"><option>Standard</option><option>Scientific</option></select></div><div class="p2-opt"><label>Practice mode</label><select id="p3Practice"><option>Off</option><option>On</option></select></div></div>',
        general:'<div class="p2-head"><div><h2>Smart options</h2><div class="p2-note">Universal category-aware controls for this tool.</div></div><span class="p2-badge">Smart</span></div><div class="p2-grid"><div class="p2-opt"><label>Mode</label><select id="p3Mode"><option>Simple</option><option>Advanced</option></select></div><div class="p2-opt"><label>Explanation</label><select id="p3Explain"><option>Short</option><option>Detailed</option></select></div><div class="p2-opt"><label>Related suggestions</label><select id="p3Suggest"><option>Show</option><option>Hide</option></select></div><div class="p2-opt"><label>Result format</label><select id="p3Format"><option>Standard</option><option>Compact</option></select></div></div>'
      };
      spec.innerHTML=specHtml[type]||specHtml.general;
      panel.appendChild(spec);
      var p3Act=e('div','p2-actions'); p3Act.innerHTML='<button class="primary" id="p3Apply">Apply category options</button><button id="p3Save">Save category preset</button><button id="p3Reset">Reset category options</button>';
      spec.appendChild(p3Act);
      function p3Values(){var o={type:type}; Array.prototype.forEach.call(spec.querySelectorAll('select,input'),function(x){o[x.id||x.name]=x.value}); return o;}
      function p3Load(){var o=C.Store.get('catpreset:'+calcId,null); if(!o)return false; Array.prototype.forEach.call(spec.querySelectorAll('select,input'),function(x){if(o[x.id]!=null)x.value=o[x.id]}); return true;}
      var ap=document.getElementById('p3Apply'), sv=document.getElementById('p3Save'), rs=document.getElementById('p3Reset');
      if(ap)ap.onclick=function(){C.Store.set('catopts:'+calcId,p3Values()); remount(); C.toast('Category options applied');};
      if(sv)sv.onclick=function(){C.Store.set('catpreset:'+calcId,p3Values()); C.toast('Category preset saved');};
      if(rs)rs.onclick=function(){C.Store.set('catpreset:'+calcId,null); remount(); C.toast('Category options reset');};
      p3Load();
      var rel=e('div','p2-panel');
      var ids=(SEO.ORDER||[]).filter(function(id){return id!==calcId && SEO.TOOLS[id] && SEO.TOOLS[id].cat===(info.cat||'')}).slice(0,8);
      rel.innerHTML='<div class="p2-head"><div><h2>Related tools</h2><div class="p2-note">Continue with similar calculators and converters.</div></div></div><div class="p2-related">'+ids.map(function(id){var t=SEO.TOOLS[id];return '<a href="'+safe(t.slug)+'.html">'+safe((t.icon||'🔧')+' '+t.name)+'</a>';}).join('')+'</div>';
      panel.appendChild(rel);
      function getResult(){ try{return resultText();}catch(e){return document.title+'\n'+location.href;} }
      var $=function(id){return document.getElementById(id)};
      if($('p2Recalc')) $('p2Recalc').onclick=function(){remount(); if(C&&C.toast)C.toast('Refreshed with advanced options');};
      if($('p2CopyPage')) $('p2CopyPage').onclick=function(){C.copyText(location.href);};
      if($('p2CopyResult')) $('p2CopyResult').onclick=function(){C.copyText(getResult());};
      if($('p2DownloadTxt')) $('p2DownloadTxt').onclick=function(){dl((calcId||'tool')+'-result.txt','text/plain',getResult());};
      if($('p2SavePreset')) $('p2SavePreset').onclick=function(){C.Store.set('preset:'+calcId,{precision:$('p2Precision').value,round:$('p2Round').value,label:$('p2Label').value,theme:$('p2Theme').value,when:Date.now()});C.toast('Preset saved');};
      if($('p2LoadPreset')) $('p2LoadPreset').onclick=function(){var x=C.Store.get('preset:'+calcId,null); if(!x)return C.toast('No preset saved'); $('p2Precision').value=x.precision||'2'; $('p2Round').value=x.round||'Standard'; $('p2Label').value=x.label||''; $('p2Theme').value=x.theme||'auto'; C.toast('Preset loaded');};
    }catch(e){try{console.warn('phase2 panel failed',e)}catch(_){}}
  })();


  /* ---------- Embed mode ---------- */
  try {
    if (/[?&]embed=1/.test(location.search)) document.body.classList.add('embed');
  } catch (e) {}
})();
