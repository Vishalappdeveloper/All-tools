/* aft-utils.js — real client-side engine for utility/generator/text/image/data tools.
   Each page has <div id="aft-app" data-kind="KIND" data-opt="..."></div>. All processing is local. */
(function(){
'use strict';
function $(s,r){return (r||document).querySelector(s);}
function ce(t,a,h){var e=document.createElement(t);if(a)for(var k in a)e.setAttribute(k,a[k]);if(h!=null)e.innerHTML=h;return e;}
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c];});}
function dl(name,blob){var u=URL.createObjectURL(blob),a=ce('a');a.href=u;a.download=name;a.click();setTimeout(function(){URL.revokeObjectURL(u);},1500);}
function copy(t){navigator.clipboard&&navigator.clipboard.writeText(t);}
function load(src){return new Promise(function(res,rej){if(document.querySelector('script[src="'+src+'"]'))return res();var s=ce('script');s.src=src;s.onload=res;s.onerror=rej;document.head.appendChild(s);});}
var B='button style="background:var(--brand,#F6931F);color:#fff;border:0;border-radius:9px;padding:10px 16px;font-weight:600;cursor:pointer;margin:4px 4px 4px 0"';
var TA='width:100%;min-height:150px;padding:12px;border:1px solid var(--border,#ddd);border-radius:10px;font:14px/1.5 monospace;box-sizing:border-box';
var IN='width:100%;padding:11px;border:1px solid var(--border,#ddd);border-radius:10px;box-sizing:border-box;margin:4px 0';
function wrap(app,html){app.innerHTML='<div style="max-width:820px;margin:0 auto">'+html+'</div>';}
function out(app){return $('.aft-out',app);}

// ---------- TEXT TOOLS ----------
function textTool(app,fn,label,opt){
  wrap(app,'<textarea class="aft-in" style="'+TA+'" placeholder="Type or paste text here..."></textarea>'+
    '<div style="margin:8px 0"><'+B+' class="go">'+esc(label||'Convert')+'</button><'+B+' class="cp">Copy result</button><'+B+' class="cl">Clear</button></div>'+
    '<div class="aft-stats" style="font-size:13px;color:var(--muted,#888);margin-bottom:8px"></div>'+
    '<textarea class="aft-out" style="'+TA+'" placeholder="Result..."></textarea>');
  var i=$('.aft-in',app),o=$('.aft-out',app);
  function stat(){var t=i.value;var w=(t.trim().match(/\S+/g)||[]).length;$('.aft-stats',app).textContent='Words: '+w+' | Characters: '+t.length+' | Lines: '+(t?t.split(/\n/).length:0);}
  i.addEventListener('input',stat);stat();
  $('.go',app).onclick=function(){o.value=fn(i.value,opt);};
  $('.cp',app).onclick=function(){copy(o.value);};
  $('.cl',app).onclick=function(){i.value='';o.value='';stat();};
}
var ROMAN=[[1000,'M'],[900,'CM'],[500,'D'],[400,'CD'],[100,'C'],[90,'XC'],[50,'L'],[40,'XL'],[10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']];
function toRoman(n){n=parseInt(n,10)||0;var r='';ROMAN.forEach(function(p){while(n>=p[0]){r+=p[1];n-=p[0];}});return r||'0';}
var ONES=['','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen'];
var TENS=['','','twenty','thirty','forty','fifty','sixty','seventy','eighty','ninety'];
function numWords(n){n=parseInt(n,10);if(isNaN(n))return '';if(n===0)return 'zero';if(n<0)return 'minus '+numWords(-n);function u(x){if(x<20)return ONES[x];if(x<100)return TENS[Math.floor(x/10)]+(x%10?'-'+ONES[x%10]:'');if(x<1000)return ONES[Math.floor(x/100)]+' hundred'+(x%100?' '+u(x%100):'');return '';}var parts=[],units=['',' thousand',' million',' billion'],idx=0;while(n>0&&idx<units.length){var chunk=n%1000;if(chunk)parts.unshift(u(chunk)+units[idx]);n=Math.floor(n/1000);idx++;}return parts.join(' ').trim();}
var MORSE={A:'.-',B:'-...',C:'-.-.',D:'-..',E:'.',F:'..-.',G:'--.',H:'....',I:'..',J:'.---',K:'-.-',L:'.-..',M:'--',N:'-.',O:'---',P:'.--.',Q:'--.-',R:'.-.',S:'...',T:'-',U:'..-',V:'...-',W:'.--',X:'-..-',Y:'-.--',Z:'--..','0':'-----','1':'.----','2':'..---','3':'...--','4':'....-','5':'.....','6':'-....','7':'--...','8':'---..','9':'----.'};
var RMORSE={};Object.keys(MORSE).forEach(function(k){RMORSE[MORSE[k]]=k;});
function mdToHtml(t){return t.replace(/^### (.*)$/gm,'<h3>$1</h3>').replace(/^## (.*)$/gm,'<h2>$1</h2>').replace(/^# (.*)$/gm,'<h1>$1</h1>').replace(/\*\*(.+?)\*\*/g,'<b>$1</b>').replace(/\*(.+?)\*/g,'<i>$1</i>').replace(/`(.+?)`/g,'<code>$1</code>').replace(/\[(.+?)\]\((.+?)\)/g,'<a href="$2">$1</a>').replace(/\n{2,}/g,'</p><p>').replace(/\n/g,'<br>');}
var TEXTFN={
  upper:function(t){return t.toUpperCase();},lower:function(t){return t.toLowerCase();},
  title:function(t){return t.replace(/\w\S*/g,function(w){return w[0].toUpperCase()+w.slice(1).toLowerCase();});},
  sentence:function(t){return t.toLowerCase().replace(/(^\s*\w|[.!?]\s*\w)/g,function(c){return c.toUpperCase();});},
  reverse:function(t){return t.split('').reverse().join('');},
  reversewords:function(t){return t.split(/\s+/).reverse().join(' ');},
  removedupes:function(t){var s={},r=[];t.split(/\n/).forEach(function(l){if(!s[l]){s[l]=1;r.push(l);}});return r.join('\n');},
  removespaces:function(t){return t.replace(/\s+/g,' ').trim();},
  slugify:function(t){return t.toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');},
  base64enc:function(t){try{return btoa(unescape(encodeURIComponent(t)));}catch(e){return 'Error';}},
  base64dec:function(t){try{return decodeURIComponent(escape(atob(t.trim())));}catch(e){return 'Invalid Base64';}},
  urlenc:function(t){return encodeURIComponent(t);},urldec:function(t){try{return decodeURIComponent(t);}catch(e){return 'Invalid';}},
  binenc:function(t){return t.split('').map(function(c){return c.charCodeAt(0).toString(2).padStart(8,'0');}).join(' ');},
  bindec:function(t){return t.trim().split(/\s+/).map(function(b){return String.fromCharCode(parseInt(b,2));}).join('');},
  morseenc:function(t){return t.toUpperCase().split('').map(function(c){return c===' '?'/':(MORSE[c]||'');}).join(' ').trim();},
  morsedec:function(t){return t.trim().split(' ').map(function(c){return c==='/'?' ':(RMORSE[c]||'');}).join('');},
  numwords:function(t){return t.split(/\s+/).map(function(n){return numWords(n);}).filter(Boolean).join(', ');},
  roman:function(t){return t.split(/\s+/).map(toRoman).join(' ');},
  markdown:function(t){return '<p>'+mdToHtml(t)+'</p>';},
  sortlines:function(t){return t.split(/\n/).sort().join('\n');},
  countable:function(t){return t;}
};

// ---------- GENERATORS ----------
function genPassword(app){
  wrap(app,'<label>Length: <span class="lv">16</span></label><input class="len" type="range" min="4" max="64" value="16" style="width:100%">'+
    '<div style="margin:8px 0"><label><input type="checkbox" class="up" checked> A-Z</label> <label><input type="checkbox" class="lo" checked> a-z</label> <label><input type="checkbox" class="nu" checked> 0-9</label> <label><input type="checkbox" class="sy" checked> !@#$</label></div>'+
    '<'+B+' class="go">Generate</button><'+B+' class="cp">Copy</button><input class="aft-out" style="'+IN+'" readonly>');
  var el=$('.len',app);el.oninput=function(){$('.lv',app).textContent=el.value;};
  function gen(){var s='';if($('.up',app).checked)s+='ABCDEFGHJKLMNPQRSTUVWXYZ';if($('.lo',app).checked)s+='abcdefghijkmnpqrstuvwxyz';if($('.nu',app).checked)s+='23456789';if($('.sy',app).checked)s+='!@#$%^&*()-_=+';if(!s)s='abc';var a=new Uint32Array(+el.value),r='';crypto.getRandomValues(a);for(var i=0;i<a.length;i++)r+=s[a[i]%s.length];$('.aft-out',app).value=r;}
  $('.go',app).onclick=gen;$('.cp',app).onclick=function(){copy($('.aft-out',app).value);};gen();
}
function genUuid(app){wrap(app,'<'+B+' class="go">Generate UUID</button><'+B+' class="cp">Copy</button><textarea class="aft-out" style="'+TA+';min-height:100px" readonly></textarea><div style="margin-top:6px"><label>How many: <input class="n" type="number" value="1" min="1" max="100" style="width:80px"></label></div>');
  function g(){var n=+$('.n',app).value||1,r=[];for(var i=0;i<n;i++)r.push(crypto.randomUUID());$('.aft-out',app).value=r.join('\n');}$('.go',app).onclick=g;$('.cp',app).onclick=function(){copy($('.aft-out',app).value);};g();}
function genRandom(app){wrap(app,'<label>Min <input class="mn" type="number" value="1" style="'+IN+'"></label><label>Max <input class="mx" type="number" value="100" style="'+IN+'"></label><label>Count <input class="ct" type="number" value="1" min="1" max="1000" style="'+IN+'"></label><'+B+' class="go">Generate</button><textarea class="aft-out" style="'+TA+'" readonly></textarea>');
  $('.go',app).onclick=function(){var mn=+$('.mn',app).value,mx=+$('.mx',app).value,ct=+$('.ct',app).value||1,r=[];for(var i=0;i<ct;i++)r.push(Math.floor(Math.random()*(mx-mn+1))+mn);$('.aft-out',app).value=r.join(', ');};}
function genDice(app,sides){sides=sides||6;wrap(app,'<div class="res" style="font-size:80px;text-align:center;margin:20px">\u2684</div><'+B+' class="go">Roll d'+sides+'</button>');$('.go',app).onclick=function(){$('.res',app).textContent=Math.floor(Math.random()*sides)+1;};}
function genCoin(app){wrap(app,'<div class="res" style="font-size:60px;text-align:center;margin:20px">\U0001fa99</div><'+B+' class="go">Flip Coin</button>');$('.go',app).onclick=function(){$('.res',app).textContent=Math.random()<0.5?'HEADS':'TAILS';};}
function genLipsum(app){wrap(app,'<label>Paragraphs <input class="n" type="number" value="3" min="1" max="50" style="'+IN+'"></label><'+B+' class="go">Generate</button><'+B+' class="cp">Copy</button><textarea class="aft-out" style="'+TA+'" readonly></textarea>');
  var L='Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.';
  $('.go',app).onclick=function(){var n=+$('.n',app).value||1,r=[];for(var i=0;i<n;i++)r.push(L);$('.aft-out',app).value=r.join('\n\n');};$('.cp',app).onclick=function(){copy($('.aft-out',app).value);};$('.go',app).onclick();}
function genColor(app){wrap(app,'<input type="color" class="pk" value="#F6931F" style="width:100px;height:60px;border:0"><div class="info" style="margin:12px 0;font:15px monospace"></div>');
  var pk=$('.pk',app);function upd(){var h=pk.value,r=parseInt(h.substr(1,2),16),g=parseInt(h.substr(3,2),16),b=parseInt(h.substr(5,2),16);$('.info',app).innerHTML='HEX: '+h+'<br>RGB: rgb('+r+', '+g+', '+b+')<br>HSL: '+rgbToHsl(r,g,b);}pk.oninput=upd;upd();}
function rgbToHsl(r,g,b){r/=255;g/=255;b/=255;var mx=Math.max(r,g,b),mn=Math.min(r,g,b),h,s,l=(mx+mn)/2;if(mx===mn){h=s=0;}else{var d=mx-mn;s=l>0.5?d/(2-mx-mn):d/(mx+mn);h=mx===r?(g-b)/d+(g<b?6:0):mx===g?(b-r)/d+2:(r-g)/d+4;h/=6;}return 'hsl('+Math.round(h*360)+', '+Math.round(s*100)+'%, '+Math.round(l*100)+'%)';}
function genQR(app){wrap(app,'<input class="t" style="'+IN+'" placeholder="Enter text or URL" value="https://allfreecalculators.in"><'+B+' class="go">Generate QR</button><'+B+' class="dl">Download PNG</button><div class="qr" style="margin:16px 0"></div>');
  load('https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js').then(function(){function g(){$('.qr',app).innerHTML='';new QRCode($('.qr',app),{text:$('.t',app).value||' ',width:240,height:240});}$('.go',app).onclick=g;$('.dl',app).onclick=function(){var c=$('.qr canvas',app)||$('.qr img',app);if(c&&c.tagName==='CANVAS')c.toBlob(function(b){dl('qr.png',b);});};g();});}
function genBarcode(app){wrap(app,'<input class="t" style="'+IN+'" placeholder="Enter value" value="123456789012"><'+B+' class="go">Generate</button><svg class="bc"></svg>');
  load('https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js').then(function(){function g(){try{JsBarcode($('.bc',app),$('.t',app).value||'0');}catch(e){}}$('.go',app).onclick=g;g();});}
function genMeta(app){wrap(app,'<input class="tt" style="'+IN+'" placeholder="Page title"><textarea class="ds" style="'+TA+';min-height:70px" placeholder="Meta description"></textarea><input class="kw" style="'+IN+'" placeholder="keywords, comma, separated"><'+B+' class="go">Generate tags</button><'+B+' class="cp">Copy</button><textarea class="aft-out" style="'+TA+'" readonly></textarea>');
  $('.go',app).onclick=function(){var t=$('.tt',app).value,d=$('.ds',app).value,k=$('.kw',app).value;$('.aft-out',app).value='<title>'+t+'</title>\n<meta name="description" content="'+d+'">\n<meta name="keywords" content="'+k+'">\n<meta property="og:title" content="'+t+'">\n<meta property="og:description" content="'+d+'">\n<meta name="twitter:card" content="summary_large_image">';};$('.cp',app).onclick=function(){copy($('.aft-out',app).value);};}

// ---------- DATA TOOLS ----------
function dataTool(app,mode){
  wrap(app,'<textarea class="aft-in" style="'+TA+'" placeholder="Paste data here..."></textarea><div style="margin:8px 0"><'+B+' class="go">Convert</button><'+B+' class="cp">Copy</button></div><textarea class="aft-out" style="'+TA+'" readonly></textarea>');
  $('.go',app).onclick=function(){var t=$('.aft-in',app).value,r='';try{
    if(mode==='jsonformat')r=JSON.stringify(JSON.parse(t),null,2);
    else if(mode==='jsonmin')r=JSON.stringify(JSON.parse(t));
    else if(mode==='csv2json'){var rows=t.trim().split(/\n/).map(function(l){return l.split(',');});var head=rows.shift();r=JSON.stringify(rows.map(function(row){var o={};head.forEach(function(h,i){o[h.trim()]=(row[i]||'').trim();});return o;}),null,2);}
    else if(mode==='json2csv'){var arr=JSON.parse(t);var keys=Object.keys(arr[0]);r=keys.join(',')+'\n'+arr.map(function(o){return keys.map(function(k){return o[k];}).join(',');}).join('\n');}
  }catch(e){r='Error: '+e.message;}$('.aft-out',app).value=r;};$('.cp',app).onclick=function(){copy($('.aft-out',app).value);};}
function hashTool(app,algo){wrap(app,'<textarea class="aft-in" style="'+TA+';min-height:90px" placeholder="Text to hash"></textarea><'+B+' class="go">Generate '+algo+'</button><'+B+' class="cp">Copy</button><input class="aft-out" style="'+IN+'" readonly>');
  $('.go',app).onclick=function(){var enc=new TextEncoder().encode($('.aft-in',app).value);crypto.subtle.digest(algo,enc).then(function(buf){$('.aft-out',app).value=Array.from(new Uint8Array(buf)).map(function(b){return b.toString(16).padStart(2,'0');}).join('');});};$('.cp',app).onclick=function(){copy($('.aft-out',app).value);};}

// ---------- IMAGE TOOLS ----------
function imageTool(app,mode){
  wrap(app,'<input type="file" class="f" accept="image/*" style="'+IN+'">'+
    (mode==='resize'?'<label>Width <input class="w" type="number" style="'+IN+'"></label><label>Height <input class="h" type="number" style="'+IN+'"></label>':'')+
    (mode==='compress'||mode==='webp'?'<label>Quality: <span class="qv">80</span>%<input class="q" type="range" min="10" max="100" value="80" style="width:100%"></label>':'')+
    '<'+B+' class="go">Process & Download</button><div class="pv" style="margin-top:12px"></div>');
  var img=new Image(),loaded=false;
  $('.f',app).onchange=function(e){var fr=new FileReader();fr.onload=function(){img.onload=function(){loaded=true;if($('.w',app)){$('.w',app).value=img.width;$('.h',app).value=img.height;}$('.pv',app).innerHTML='<img src="'+img.src+'" style="max-width:100%;max-height:300px;border-radius:8px">';};img.src=fr.result;};fr.readAsDataURL(e.target.files[0]);};
  var q=$('.q',app);if(q)q.oninput=function(){$('.qv',app).textContent=q.value;};
  $('.go',app).onclick=function(){if(!loaded)return alert('Please choose an image first');var w=img.width,h=img.height;if(mode==='resize'){w=+$('.w',app).value||w;h=+$('.h',app).value||h;}var cv=ce('canvas');cv.width=w;cv.height=h;var cx=cv.getContext('2d');if(mode==='grayscale'){cx.drawImage(img,0,0,w,h);var d=cx.getImageData(0,0,w,h);for(var i=0;i<d.data.length;i+=4){var g=0.3*d.data[i]+0.59*d.data[i+1]+0.11*d.data[i+2];d.data[i]=d.data[i+1]=d.data[i+2]=g;}cx.putImageData(d,0,0);}else if(mode==='rotate'){cv.width=h;cv.height=w;cx.translate(h/2,w/2);cx.rotate(Math.PI/2);cx.drawImage(img,-w/2,-h/2);}else if(mode==='flip'){cx.translate(w,0);cx.scale(-1,1);cx.drawImage(img,0,0,w,h);}else{cx.drawImage(img,0,0,w,h);}var type=mode==='webp'?'image/webp':'image/png',ext=mode==='webp'?'webp':(mode==='compress'?'jpg':'png');if(mode==='compress')type='image/jpeg';var qual=q?(+q.value/100):0.92;cv.toBlob(function(b){dl('aft-'+mode+'.'+ext,b);},type,qual);};}

// ---------- DOC TOOLS (invoice / resume) ----------
function invoiceTool(app){
  wrap(app,'<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><input class="from" style="'+IN+'" placeholder="Your business name"><input class="to" style="'+IN+'" placeholder="Client name"><input class="inv" style="'+IN+'" placeholder="Invoice #"><input class="date" type="date" style="'+IN+'"></div>'+
    '<textarea class="items" style="'+TA+';min-height:120px" placeholder="One item per line: Description | Qty | Price">Web design | 1 | 500\nHosting | 12 | 10</textarea>'+
    '<'+B+' class="go">Preview & Print / Save PDF</button><div class="pv"></div>');
  $('.go',app).onclick=function(){var items=$('.items',app).value.split(/\n/).filter(Boolean).map(function(l){var p=l.split('|');return{d:(p[0]||'').trim(),q:+(p[1]||1),pr:+(p[2]||0)};});var tot=0;var rows=items.map(function(it){var a=it.q*it.pr;tot+=a;return '<tr><td>'+esc(it.d)+'</td><td style="text-align:right">'+it.q+'</td><td style="text-align:right">'+it.pr.toFixed(2)+'</td><td style="text-align:right">'+a.toFixed(2)+'</td></tr>';}).join('');var html='<div style="padding:24px;border:1px solid #ddd;border-radius:10px;background:#fff;color:#111"><h2 style="margin:0">INVOICE</h2><p>From: <b>'+esc($('.from',app).value)+'</b><br>To: '+esc($('.to',app).value)+'<br>Invoice #: '+esc($('.inv',app).value)+' &nbsp; Date: '+esc($('.date',app).value)+'</p><table style="width:100%;border-collapse:collapse" border="1" cellpadding="6"><tr><th align="left">Description</th><th>Qty</th><th>Price</th><th>Amount</th></tr>'+rows+'<tr><td colspan="3" align="right"><b>Total</b></td><td align="right"><b>'+tot.toFixed(2)+'</b></td></tr></table></div>';$('.pv',app).innerHTML=html+'<'+B+' class="pr">Print / Save as PDF</button>';$('.pr',app).onclick=function(){var w=window.open('');w.document.write('<html><body onload="print()">'+html+'</body></html>');w.document.close();};};}
function resumeTool(app){
  wrap(app,'<input class="nm" style="'+IN+'" placeholder="Full name"><input class="ti" style="'+IN+'" placeholder="Job title"><input class="ct" style="'+IN+'" placeholder="Email \u00b7 Phone \u00b7 Location"><textarea class="sm" style="'+TA+';min-height:60px" placeholder="Professional summary"></textarea><textarea class="ex" style="'+TA+'" placeholder="Experience (one per line)"></textarea><textarea class="sk" style="'+TA+';min-height:60px" placeholder="Skills, comma separated"></textarea><'+B+' class="go">Preview & Save PDF</button><div class="pv"></div>');
  $('.go',app).onclick=function(){function li(t){return t.split(/\n/).filter(Boolean).map(function(l){return '<li>'+esc(l)+'</li>';}).join('');}var html='<div style="padding:28px;border:1px solid #ddd;border-radius:10px;background:#fff;color:#111;font-family:Georgia,serif"><h1 style="margin:0">'+esc($('.nm',app).value)+'</h1><p style="margin:2px 0;color:#555">'+esc($('.ti',app).value)+' \u00b7 '+esc($('.ct',app).value)+'</p><hr><h3>Summary</h3><p>'+esc($('.sm',app).value)+'</p><h3>Experience</h3><ul>'+li($('.ex',app).value)+'</ul><h3>Skills</h3><p>'+esc($('.sk',app).value)+'</p></div>';$('.pv',app).innerHTML=html+'<'+B+' class="pr">Print / Save as PDF</button>';$('.pr',app).onclick=function(){var w=window.open('');w.document.write('<html><body onload="print()">'+html+'</body></html>');w.document.close();};};}

// ---------- DISPATCH ----------
var KINDS={
  password:genPassword,uuid:genUuid,random:genRandom,dice:function(a){genDice(a,6);},d20:function(a){genDice(a,20);},coin:genCoin,lipsum:genLipsum,color:genColor,qr:genQR,barcode:genBarcode,meta:genMeta,
  jsonformat:function(a){dataTool(a,'jsonformat');},jsonmin:function(a){dataTool(a,'jsonmin');},csv2json:function(a){dataTool(a,'csv2json');},json2csv:function(a){dataTool(a,'json2csv');},
  sha256:function(a){hashTool(a,'SHA-256');},sha1:function(a){hashTool(a,'SHA-1');},sha512:function(a){hashTool(a,'SHA-512');},
  imgresize:function(a){imageTool(a,'resize');},imgcompress:function(a){imageTool(a,'compress');},imgwebp:function(a){imageTool(a,'webp');},imggray:function(a){imageTool(a,'grayscale');},imgrotate:function(a){imageTool(a,'rotate');},imgflip:function(a){imageTool(a,'flip');},
  invoice:invoiceTool,resume:resumeTool
};
Object.keys(TEXTFN).forEach(function(k){KINDS['text_'+k]=function(a){textTool(a,TEXTFN[k],a.getAttribute('data-label')||'Convert');};});

function init(){var app=document.getElementById('aft-app');if(!app)return;var kind=app.getAttribute('data-kind');var fn=KINDS[kind];if(fn){try{fn(app);}catch(e){app.innerHTML='<p>Tool failed to load: '+esc(e.message)+'</p>';}}else{app.innerHTML='<p>Coming soon.</p>';}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
