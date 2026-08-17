/* allfreecalculators.in - shared functional tools engine
 * Each tool page sets window.__AFT = {kind, title, config} then loads this file.
 * All engines are self-contained (offline) except PDF which lazy-loads pdf-lib.
 */
(function(){
  "use strict";
  var A = window.__AFT || {};
  var K = A.kind, C = A.config || {};
  function $(id){return document.getElementById(id);}
  function el(tag, attrs, html){var e=document.createElement(tag); if(attrs){for(var k in attrs){e.setAttribute(k,attrs[k]);}} if(html!=null)e.innerHTML=html; return e;}
  function mount(){return $("aft-app")||document.body;}
  function esc(s){return String(s==null?"":s).replace(/[&<>\"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c];});}
  function dl(name, blob){var u=URL.createObjectURL(blob);var a=document.createElement('a');a.href=u;a.download=name;document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(u);a.remove();},1500);}
  function loadScript(src){return new Promise(function(res,rej){var s=document.createElement('script');s.src=src;s.onload=res;s.onerror=rej;document.head.appendChild(s);});}

  var engines = {};

  /* ---------- UNIT CONVERTER ---------- */
  engines.unit = function(host){
    var units = C.units||[]; var affine = C.affine;
    var wrap = el('div',{'class':'aft-box'});
    var opts = units.map(function(u,i){return '<option value="'+i+'">'+esc(u.name)+'</option>';}).join('');
    wrap.innerHTML =
      '<div class="aft-row"><input id="aft-in" class="aft-inp" type="number" value="1" step="any"><select id="aft-from" class="aft-sel">'+opts+'</select></div>'+
      '<div class="aft-eq">=</div>'+
      '<div class="aft-row"><input id="aft-out" class="aft-inp" type="number" readonly><select id="aft-to" class="aft-sel">'+opts+'</select></div>'+
      '<div class="aft-actions"><button id="aft-swap" class="aft-btn ghost">\u21c5 Swap</button><button id="aft-copy" class="aft-btn">Copy result</button></div>'+
      '<div id="aft-all" class="aft-grid"></div>';
    host.appendChild(wrap);
    if(units.length>1) $('aft-to').selectedIndex=1;
    function conv(v,from,to){ if(affine){ var b=(v-units[from].off)/units[from].factor*units[to].factor+units[to].off; return b;} var base=v*units[from].factor; return base/units[to].factor; }
    function render(){
      var v=parseFloat($('aft-in').value); if(isNaN(v))v=0;
      var f=+$('aft-from').value, t=+$('aft-to').value;
      var r=conv(v,f,t); $('aft-out').value=Math.round(r*1e8)/1e8;
      var g=''; for(var i=0;i<units.length;i++){ g+='<div class="aft-cell"><b>'+esc(units[i].name)+'</b><span>'+(Math.round(conv(v,f,i)*1e6)/1e6)+'</span></div>'; }
      $('aft-all').innerHTML=g;
    }
    wrap.addEventListener('input',render); wrap.addEventListener('change',render);
    $('aft-swap').onclick=function(){var a=$('aft-from').value;$('aft-from').value=$('aft-to').value;$('aft-to').value=a;render();};
    $('aft-copy').onclick=function(){navigator.clipboard&&navigator.clipboard.writeText($('aft-out').value);this.textContent='Copied!';var b=this;setTimeout(function(){b.textContent='Copy result';},1200);};
    render();
  };

  /* ---------- TEXT / FORMAT CONVERTER ---------- */
  engines.textconv = function(host){
    var mode=C.mode;
    var wrap=el('div',{'class':'aft-box'});
    wrap.innerHTML='<textarea id="aft-in" class="aft-ta" placeholder="Enter text..."></textarea>'+
      '<div class="aft-actions"><button id="aft-run" class="aft-btn">Convert</button><button id="aft-rev" class="aft-btn ghost">Reverse mode</button><button id="aft-copy" class="aft-btn ghost">Copy</button><button id="aft-clr" class="aft-btn ghost">Clear</button></div>'+
      '<textarea id="aft-out" class="aft-ta" readonly placeholder="Result..."></textarea>';
    host.appendChild(wrap);
    var reversed=false;
    var M={
      base64:{f:function(s){return btoa(unescape(encodeURIComponent(s)));},r:function(s){return decodeURIComponent(escape(atob(s.trim())));}},
      url:{f:function(s){return encodeURIComponent(s);},r:function(s){return decodeURIComponent(s);}},
      html:{f:function(s){return esc(s);},r:function(s){var d=document.createElement('div');d.innerHTML=s;return d.textContent;}},
      binary:{f:function(s){return s.split('').map(function(c){return c.charCodeAt(0).toString(2).padStart(8,'0');}).join(' ');},r:function(s){return s.trim().split(/\s+/).map(function(b){return String.fromCharCode(parseInt(b,2));}).join('');}},
      hex:{f:function(s){return s.split('').map(function(c){return c.charCodeAt(0).toString(16).padStart(2,'0');}).join(' ');},r:function(s){return s.trim().split(/\s+/).map(function(b){return String.fromCharCode(parseInt(b,16));}).join('');}},
      morse:{f:function(s){var m={a:'.-',b:'-...',c:'-.-.',d:'-..',e:'.',f:'..-.',g:'--.',h:'....',i:'..',j:'.---',k:'-.-',l:'.-..',m:'--',n:'-.',o:'---',p:'.--.',q:'--.-',r:'.-.',s:'...',t:'-',u:'..-',v:'...-',w:'.--',x:'-..-',y:'-.--',z:'--..','0':'-----','1':'.----','2':'..---','3':'...--','4':'....-','5':'.....','6':'-....','7':'--...','8':'---..','9':'----.'};return s.toLowerCase().split('').map(function(c){return c===' '?'/':(m[c]||'');}).join(' ').trim();},r:function(s){var m={'.-':'a','-...':'b','-.-.':'c','-..':'d','.':'e','..-.':'f','--.':'g','....':'h','..':'i','.---':'j','-.-':'k','.-..':'l','--':'m','-.':'n','---':'o','.--.':'p','--.-':'q','.-.':'r','...':'s','-':'t','..-':'u','...-':'v','.--':'w','-..-':'x','-.--':'y','--..':'z','-----':'0','.----':'1','..---':'2','...--':'3','....-':'4','.....':'5','-....':'6','--...':'7','---..':'8','----.':'9'};return s.trim().split(' ').map(function(t){return t==='/'?' ':(m[t]||'');}).join('');}},
      rot13:{f:function(s){return s.replace(/[a-z]/gi,function(c){var b=c<='Z'?65:97;return String.fromCharCode((c.charCodeAt(0)-b+13)%26+b);});},r:function(s){return this.f(s);}},
      reverse:{f:function(s){return s.split('').reverse().join('');},r:function(s){return this.f(s);}},
      slug:{f:function(s){return s.toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');},r:function(s){return s.replace(/-/g,' ');}},
      upper:{f:function(s){return s.toUpperCase();},r:function(s){return s.toLowerCase();}},
      title:{f:function(s){return s.replace(/\w\S*/g,function(t){return t.charAt(0).toUpperCase()+t.slice(1).toLowerCase();});},r:function(s){return s.toLowerCase();}},
      camel:{f:function(s){return s.toLowerCase().replace(/[^a-z0-9]+(.)/g,function(_,c){return c.toUpperCase();});},r:function(s){return s.replace(/([A-Z])/g,' $1').toLowerCase().trim();}}
    };
    function run(){var s=$('aft-in').value;var m=M[mode]||M.base64;try{$('aft-out').value=reversed?m.r(s):m.f(s);}catch(e){$('aft-out').value='Error: '+e.message;}}
    $('aft-run').onclick=run; wrap.addEventListener('input',run);
    $('aft-rev').onclick=function(){reversed=!reversed;this.classList.toggle('active',reversed);this.textContent=reversed?'Reverse: ON':'Reverse mode';run();};
    $('aft-copy').onclick=function(){navigator.clipboard&&navigator.clipboard.writeText($('aft-out').value);};
    $('aft-clr').onclick=function(){$('aft-in').value='';run();};
  };

  /* ---------- MINIFIER / COMPRESSOR (code/text) ---------- */
  engines.minify=function(host){
    var mode=C.mode;
    var wrap=el('div',{'class':'aft-box'});
    wrap.innerHTML='<textarea id="aft-in" class="aft-ta" placeholder="Paste '+esc(mode.toUpperCase())+' here..."></textarea>'+
      '<div class="aft-actions"><button id="aft-run" class="aft-btn">Minify</button><button id="aft-copy" class="aft-btn ghost">Copy</button><button id="aft-dl" class="aft-btn ghost">Download</button><span id="aft-stat" class="aft-stat"></span></div>'+
      '<textarea id="aft-out" class="aft-ta" readonly></textarea>';
    host.appendChild(wrap);
    function mini(s){
      if(mode==='json'){return JSON.stringify(JSON.parse(s));}
      if(mode==='css'){return s.replace(/\/\*[\s\S]*?\*\//g,'').replace(/\s*([{}:;,>])\s*/g,'$1').replace(/;}/g,'}').replace(/\s+/g,' ').trim();}
      if(mode==='html'){return s.replace(/<!--(?!\[)[\s\S]*?-->/g,'').replace(/>\s+</g,'><').replace(/\s{2,}/g,' ').trim();}
      if(mode==='js'){return s.replace(/\/\*[\s\S]*?\*\//g,'').replace(/(^|[^:])\/\/[^\n]*/g,'$1').replace(/\n\s*/g,'\n').replace(/[ \t]{2,}/g,' ').replace(/\s*([=+\-*/{}();,:<>])\s*/g,'$1').trim();}
      return s.replace(/[ \t]+/g,' ').replace(/\n{2,}/g,'\n').replace(/^\s+|\s+$/gm,'').trim();
    }
    function run(){var s=$('aft-in').value;try{var o=mini(s);$('aft-out').value=o;var a=s.length,b=o.length;$('aft-stat').textContent=a?('Saved '+(a-b)+' bytes ('+(a?Math.round((1-b/a)*100):0)+'%)'):'';}catch(e){$('aft-out').value='Error: '+e.message;$('aft-stat').textContent='';}}
    $('aft-run').onclick=run; wrap.addEventListener('input',run);
    $('aft-copy').onclick=function(){navigator.clipboard&&navigator.clipboard.writeText($('aft-out').value);};
    $('aft-dl').onclick=function(){dl('minified.'+ (mode==='whitespace'?'txt':mode), new Blob([$('aft-out').value],{type:'text/plain'}));};
  };

  /* ---------- IMAGE COMPRESSOR / CONVERTER ---------- */
  engines.imgcompress=function(host){
    var fmt=C.format||'image/jpeg';
    var wrap=el('div',{'class':'aft-box'});
    wrap.innerHTML='<input id="aft-file" type="file" accept="image/*" class="aft-file" multiple>'+
      '<label class="aft-lab">Quality: <input id="aft-q" type="range" min="10" max="100" value="75"><span id="aft-qv">75%</span></label>'+
      (C.resize?'<label class="aft-lab">Max width (px): <input id="aft-w" class="aft-inp" type="number" value="1920"></label>':'')+
      '<div id="aft-list" class="aft-list"></div>';
    host.appendChild(wrap);
    $('aft-q').oninput=function(){$('aft-qv').textContent=this.value+'%';};
    $('aft-file').onchange=function(e){
      var files=[].slice.call(e.target.files); $('aft-list').innerHTML='';
      files.forEach(function(file){
        var img=new Image();var url=URL.createObjectURL(file);
        img.onload=function(){
          var cw=img.width,ch=img.height;var mw=C.resize?parseInt($('aft-w').value||0):0;
          if(mw&&cw>mw){ch=Math.round(ch*mw/cw);cw=mw;}
          var cv=document.createElement('canvas');cv.width=cw;cv.height=ch;cv.getContext('2d').drawImage(img,0,0,cw,ch);
          cv.toBlob(function(blob){
            var row=el('div',{'class':'aft-cell'});
            row.innerHTML='<b>'+esc(file.name)+'</b><span>'+(file.size/1024|0)+' KB \u2192 '+(blob.size/1024|0)+' KB</span>';
            var b=el('button',{'class':'aft-btn'},'Download');
            b.onclick=function(){var ext=fmt.split('/')[1].replace('jpeg','jpg');dl(file.name.replace(/\.[^.]+$/,'')+'-min.'+ext,blob);};
            row.appendChild(b);$('aft-list').appendChild(row);URL.revokeObjectURL(url);
          },fmt,parseInt($('aft-q').value)/100);
        };img.src=url;
      });
    };
  };

  /* ---------- JSON / CODE FORMATTER (EDITOR) ---------- */
  engines.jsonfmt=function(host){
    var wrap=el('div',{'class':'aft-box'});
    wrap.innerHTML='<textarea id="aft-in" class="aft-ta" placeholder="Paste JSON..."></textarea>'+
      '<div class="aft-actions"><button id="aft-b" class="aft-btn">Beautify</button><button id="aft-m" class="aft-btn ghost">Minify</button><button id="aft-v" class="aft-btn ghost">Validate</button><button id="aft-copy" class="aft-btn ghost">Copy</button><span id="aft-stat" class="aft-stat"></span></div>'+
      '<textarea id="aft-out" class="aft-ta"></textarea>';
    host.appendChild(wrap);
    function parse(){return JSON.parse($('aft-in').value);}
    $('aft-b').onclick=function(){try{$('aft-out').value=JSON.stringify(parse(),null,2);$('aft-stat').textContent='Valid \u2713';$('aft-stat').className='aft-stat ok';}catch(e){$('aft-stat').textContent=e.message;$('aft-stat').className='aft-stat err';}};
    $('aft-m').onclick=function(){try{$('aft-out').value=JSON.stringify(parse());$('aft-stat').textContent='Valid \u2713';$('aft-stat').className='aft-stat ok';}catch(e){$('aft-stat').textContent=e.message;$('aft-stat').className='aft-stat err';}};
    $('aft-v').onclick=function(){try{parse();$('aft-stat').textContent='Valid JSON \u2713';$('aft-stat').className='aft-stat ok';}catch(e){$('aft-stat').textContent='Invalid: '+e.message;$('aft-stat').className='aft-stat err';}};
    $('aft-copy').onclick=function(){navigator.clipboard&&navigator.clipboard.writeText($('aft-out').value);};
  };

  /* ---------- MARKDOWN / HTML LIVE EDITOR ---------- */
  engines.markdown=function(host){
    var isHtml=C.mode==='html';
    var wrap=el('div',{'class':'aft-box'});
    wrap.innerHTML='<div class="aft-split"><textarea id="aft-in" class="aft-ta" placeholder="Type '+(isHtml?'HTML':'Markdown')+'..."></textarea><div id="aft-prev" class="aft-prev"></div></div>'+
      '<div class="aft-actions"><button id="aft-copy" class="aft-btn ghost">Copy '+(isHtml?'HTML':'Markdown')+'</button><button id="aft-dl" class="aft-btn ghost">Download</button></div>';
    host.appendChild(wrap);
    function md(s){return s
      .replace(/^### (.*)$/gm,'<h3>$1</h3>').replace(/^## (.*)$/gm,'<h2>$1</h2>').replace(/^# (.*)$/gm,'<h1>$1</h1>')
      .replace(/\*\*([^*]+)\*\*/g,'<b>$1</b>').replace(/\*([^*]+)\*/g,'<i>$1</i>').replace(/`([^`]+)`/g,'<code>$1</code>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g,'<a href="$2">$1</a>')
      .replace(/^\s*[-*] (.*)$/gm,'<li>$1</li>').replace(/(<li>[\s\S]*?<\/li>)/g,'<ul>$1</ul>')
      .replace(/\n{2,}/g,'</p><p>');}
    function run(){var s=$('aft-in').value;$('aft-prev').innerHTML=isHtml?s:('<p>'+md(s)+'</p>');}
    $('aft-in').addEventListener('input',run);
    $('aft-copy').onclick=function(){navigator.clipboard&&navigator.clipboard.writeText($('aft-in').value);};
    $('aft-dl').onclick=function(){dl(isHtml?'document.html':'document.md',new Blob([$('aft-in').value],{type:'text/plain'}));};
    run();
  };

  /* ---------- DIFF CHECKER ---------- */
  engines.diff=function(host){
    var wrap=el('div',{'class':'aft-box'});
    wrap.innerHTML='<div class="aft-split"><textarea id="aft-a" class="aft-ta" placeholder="Original"></textarea><textarea id="aft-b" class="aft-ta" placeholder="Changed"></textarea></div>'+
      '<div class="aft-actions"><button id="aft-run" class="aft-btn">Compare</button></div><div id="aft-out" class="aft-prev"></div>';
    host.appendChild(wrap);
    $('aft-run').onclick=function(){
      var a=$('aft-a').value.split('\n'),b=$('aft-b').value.split('\n');var out='';var n=Math.max(a.length,b.length);
      for(var i=0;i<n;i++){var x=a[i]||'',y=b[i]||'';if(x===y){out+='<div class="aft-eqln">  '+esc(x)+'</div>';}else{if(x)out+='<div class="aft-del">- '+esc(x)+'</div>';if(y)out+='<div class="aft-add">+ '+esc(y)+'</div>';}}
      $('aft-out').innerHTML=out;
    };
  };

  /* ---------- REGEX TESTER ---------- */
  engines.regex=function(host){
    var wrap=el('div',{'class':'aft-box'});
    wrap.innerHTML='<div class="aft-row"><input id="aft-pat" class="aft-inp" placeholder="pattern" style="flex:1"><input id="aft-flg" class="aft-inp" placeholder="flags (g,i,m)" value="g" style="max-width:120px"></div>'+
      '<textarea id="aft-in" class="aft-ta" placeholder="Test string..."></textarea>'+
      '<div id="aft-out" class="aft-prev"></div><div id="aft-stat" class="aft-stat"></div>';
    host.appendChild(wrap);
    function run(){var p=$('aft-pat').value,f=$('aft-flg').value,s=$('aft-in').value;if(!p){$('aft-out').innerHTML='';return;}try{var re=new RegExp(p,f);var m=s.match(re);$('aft-out').innerHTML=esc(s).replace(new RegExp(p,f.indexOf('g')<0?f+'g':f),function(x){return '<mark>'+esc(x)+'</mark>';});$('aft-stat').textContent=(m?m.length:0)+' match(es)';$('aft-stat').className='aft-stat ok';}catch(e){$('aft-stat').textContent=e.message;$('aft-stat').className='aft-stat err';}}
    wrap.addEventListener('input',run);
  };

  /* ---------- WORD / TEXT COUNTER ---------- */
  engines.wordcount=function(host){
    var wrap=el('div',{'class':'aft-box'});
    wrap.innerHTML='<textarea id="aft-in" class="aft-ta" placeholder="Type or paste text..."></textarea><div id="aft-out" class="aft-grid"></div>';
    host.appendChild(wrap);
    function run(){var s=$('aft-in').value;var words=(s.match(/\S+/g)||[]).length;var chars=s.length;var sent=(s.match(/[.!?]+/g)||[]).length;var para=(s.split(/\n{2,}/).filter(function(x){return x.trim();})).length;var read=Math.max(1,Math.ceil(words/200));
      $('aft-out').innerHTML='<div class="aft-cell"><b>Words</b><span>'+words+'</span></div><div class="aft-cell"><b>Characters</b><span>'+chars+'</span></div><div class="aft-cell"><b>Sentences</b><span>'+sent+'</span></div><div class="aft-cell"><b>Paragraphs</b><span>'+para+'</span></div><div class="aft-cell"><b>Reading time</b><span>'+read+' min</span></div>';}
    $('aft-in').addEventListener('input',run);run();
  };

  /* ---------- GENERATORS ---------- */
  engines.gen=function(host){
    var mode=C.mode;var wrap=el('div',{'class':'aft-box'});
    if(mode==='password'){wrap.innerHTML='<label class="aft-lab">Length: <input id="aft-len" type="number" class="aft-inp" value="16" min="4" max="128"></label><label class="aft-lab"><input id="aft-sym" type="checkbox" checked> Symbols</label><label class="aft-lab"><input id="aft-num" type="checkbox" checked> Numbers</label><div class="aft-actions"><button id="aft-run" class="aft-btn">Generate</button><button id="aft-copy" class="aft-btn ghost">Copy</button></div><input id="aft-out" class="aft-inp" readonly style="width:100%;font-size:18px">';host.appendChild(wrap);
      $('aft-run').onclick=function(){var L=+$('aft-len').value;var c='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';if($('aft-num').checked)c+='0123456789';if($('aft-sym').checked)c+='!@#$%^&*()_+-=[]{}';var a=crypto.getRandomValues(new Uint32Array(L));var o='';for(var i=0;i<L;i++)o+=c[a[i]%c.length];$('aft-out').value=o;};$('aft-copy').onclick=function(){navigator.clipboard&&navigator.clipboard.writeText($('aft-out').value);};$('aft-run').click();}
    else if(mode==='uuid'){wrap.innerHTML='<label class="aft-lab">Count: <input id="aft-n" type="number" class="aft-inp" value="5" min="1" max="100"></label><div class="aft-actions"><button id="aft-run" class="aft-btn">Generate</button><button id="aft-copy" class="aft-btn ghost">Copy</button></div><textarea id="aft-out" class="aft-ta" readonly></textarea>';host.appendChild(wrap);
      $('aft-run').onclick=function(){var n=+$('aft-n').value,o=[];for(var i=0;i<n;i++)o.push(crypto.randomUUID());$('aft-out').value=o.join('\n');};$('aft-copy').onclick=function(){navigator.clipboard&&navigator.clipboard.writeText($('aft-out').value);};$('aft-run').click();}
    else if(mode==='lorem'){wrap.innerHTML='<label class="aft-lab">Paragraphs: <input id="aft-n" type="number" class="aft-inp" value="3" min="1" max="50"></label><div class="aft-actions"><button id="aft-run" class="aft-btn">Generate</button><button id="aft-copy" class="aft-btn ghost">Copy</button></div><textarea id="aft-out" class="aft-ta" readonly></textarea>';host.appendChild(wrap);
      var W='lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat'.split(' ');
      $('aft-run').onclick=function(){var n=+$('aft-n').value,o=[];for(var i=0;i<n;i++){var s=[];for(var j=0;j<40+Math.random()*30;j++)s.push(W[Math.floor(Math.random()*W.length)]);var t=s.join(' ');o.push(t.charAt(0).toUpperCase()+t.slice(1)+'.');}$('aft-out').value=o.join('\n\n');};$('aft-copy').onclick=function(){navigator.clipboard&&navigator.clipboard.writeText($('aft-out').value);};$('aft-run').click();}
    else if(mode==='hash'){wrap.innerHTML='<textarea id="aft-in" class="aft-ta" placeholder="Text to hash..."></textarea><div class="aft-actions"><select id="aft-alg" class="aft-sel"><option>SHA-256</option><option>SHA-1</option><option>SHA-384</option><option>SHA-512</option></select><button id="aft-run" class="aft-btn">Hash</button><button id="aft-copy" class="aft-btn ghost">Copy</button></div><textarea id="aft-out" class="aft-ta" readonly></textarea>';host.appendChild(wrap);
      $('aft-run').onclick=function(){var s=$('aft-in').value,alg=$('aft-alg').value;crypto.subtle.digest(alg,new TextEncoder().encode(s)).then(function(buf){$('aft-out').value=[].map.call(new Uint8Array(buf),function(b){return b.toString(16).padStart(2,'0');}).join('');});};$('aft-copy').onclick=function(){navigator.clipboard&&navigator.clipboard.writeText($('aft-out').value);};}
  };

  /* ---------- PDF TOOLS (lazy pdf-lib) ---------- */
  engines.pdf=function(host){
    var mode=C.mode;var wrap=el('div',{'class':'aft-box'});
    var accept=mode==='img2pdf'?'image/*':'application/pdf';
    wrap.innerHTML='<input id="aft-file" type="file" accept="'+accept+'" class="aft-file" multiple>'+
      (mode==='rotate'?'<label class="aft-lab">Angle: <select id="aft-ang" class="aft-sel"><option>90</option><option>180</option><option>270</option></select></label>':'')+
      (mode==='split'?'<label class="aft-lab">Pages (e.g. 1-3,5): <input id="aft-rng" class="aft-inp" placeholder="1-3,5"></label>':'')+
      '<div class="aft-actions"><button id="aft-run" class="aft-btn">Process</button><span id="aft-stat" class="aft-stat"></span></div>';
    host.appendChild(wrap);
    var LIB='https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js';
    function ensure(){return window.PDFLib?Promise.resolve():loadScript(LIB);}
    $('aft-run').onclick=function(){
      var files=[].slice.call($('aft-file').files);if(!files.length){$('aft-stat').textContent='Select file(s) first';return;}
      $('aft-stat').textContent='Processing...';
      ensure().then(function(){return Promise.all(files.map(function(f){return f.arrayBuffer();}));}).then(function(bufs){
        var P=window.PDFLib;var PDFDocument=P.PDFDocument,degrees=P.degrees;
        if(mode==='merge'){return PDFDocument.create().then(function(out){var chain=Promise.resolve();bufs.forEach(function(b){chain=chain.then(function(){return PDFDocument.load(b);}).then(function(src){return out.copyPages(src,src.getPageIndices());}).then(function(pgs){pgs.forEach(function(p){out.addPage(p);});});});return chain.then(function(){return out.save();});});}
        if(mode==='rotate'){var ang=+($('aft-ang').value);return PDFDocument.load(bufs[0]).then(function(doc){doc.getPages().forEach(function(p){p.setRotation(degrees((p.getRotation().angle+ang)%360));});return doc.save();});}
        if(mode==='split'){var rng=$('aft-rng').value;return PDFDocument.load(bufs[0]).then(function(src){var idx=[];rng.split(',').forEach(function(part){part=part.trim();if(part.indexOf('-')>0){var ab=part.split('-');for(var i=+ab[0];i<=+ab[1];i++)idx.push(i-1);}else if(part)idx.push(+part-1);});return PDFDocument.create().then(function(out){return out.copyPages(src,idx).then(function(pgs){pgs.forEach(function(p){out.addPage(p);});return out.save();});});});}
        if(mode==='img2pdf'){return PDFDocument.create().then(function(out){var chain=Promise.resolve();files.forEach(function(f,i){chain=chain.then(function(){return bufs[i];}).then(function(b){return /png/i.test(f.type)?out.embedPng(b):out.embedJpg(b);}).then(function(img){var pg=out.addPage([img.width,img.height]);pg.drawImage(img,{x:0,y:0,width:img.width,height:img.height});});});return chain.then(function(){return out.save();});});}
      }).then(function(bytes){if(!bytes)return;dl(mode+'-result.pdf',new Blob([bytes],{type:'application/pdf'}));$('aft-stat').textContent='Done \u2713 downloaded';}).catch(function(e){$('aft-stat').textContent='Error: '+e.message;});
    };
  };

  function init(){var host=mount();var fn=engines[K];if(fn){try{fn(host);}catch(e){host.innerHTML='<div class="aft-stat err">Tool error: '+esc(e.message)+'</div>';}}}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
