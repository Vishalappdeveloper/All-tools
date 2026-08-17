/* allfreecalculators.in - unified client-side tool engine */
(function(){
"use strict";
function el(t,a,h){var e=document.createElement(t);if(a)for(var k in a)e.setAttribute(k,a[k]);if(h!=null)e.innerHTML=h;return e;}
function $(s,r){return (r||document).querySelector(s);}
function dl(name,blob){var u=URL.createObjectURL(blob);var a=document.createElement('a');a.href=u;a.download=name;a.click();setTimeout(function(){URL.revokeObjectURL(u);},1500);}
function copy(t){try{navigator.clipboard.writeText(t);}catch(e){}}
function bytes(n){if(n<1024)return n+' B';if(n<1048576)return (n/1024).toFixed(1)+' KB';return (n/1048576).toFixed(2)+' MB';}

/* ---------- TEXT TRANSFORMS (input->output) ---------- */
var T={
'upper':function(s){return s.toUpperCase();},
'lower':function(s){return s.toLowerCase();},
'title':function(s){return s.replace(/\w\S*/g,function(w){return w.charAt(0).toUpperCase()+w.slice(1).toLowerCase();});},
'sentence':function(s){return s.toLowerCase().replace(/(^\s*\w|[.!?]\s+\w)/g,function(c){return c.toUpperCase();});},
'capitalize':function(s){return s.replace(/(^|\s)\w/g,function(c){return c.toUpperCase();});},
'camel':function(s){return s.toLowerCase().replace(/[^a-z0-9]+(.)/g,function(_,c){return c.toUpperCase();});},
'pascal':function(s){var c=T.camel(s);return c.charAt(0).toUpperCase()+c.slice(1);},
'snake':function(s){return s.trim().replace(/[^a-zA-Z0-9]+/g,'_').replace(/([a-z])([A-Z])/g,'$1_$2').toLowerCase().replace(/^_|_$/g,'');},
'kebab':function(s){return s.trim().replace(/[^a-zA-Z0-9]+/g,'-').replace(/([a-z])([A-Z])/g,'$1-$2').toLowerCase().replace(/^-|-$/g,'');},
'constant':function(s){return T.snake(s).toUpperCase();},
'alternating':function(s){var o='',u=false;for(var i=0;i<s.length;i++){var c=s[i];if(/[a-z]/i.test(c)){o+=u?c.toUpperCase():c.toLowerCase();u=!u;}else o+=c;}return o;},
'inverse':function(s){var o='';for(var i=0;i<s.length;i++){var c=s[i];o+=c===c.toUpperCase()?c.toLowerCase():c.toUpperCase();}return o;},
'reverse':function(s){return s.split('').reverse().join('');},
'reverse-words':function(s){return s.split(/\s+/).reverse().join(' ');},
'reverse-lines':function(s){return s.split(/\r?\n/).reverse().join('\n');},
'sort-asc':function(s){return s.split(/\r?\n/).sort(function(a,b){return a.localeCompare(b);}).join('\n');},
'sort-desc':function(s){return s.split(/\r?\n/).sort(function(a,b){return b.localeCompare(a);}).join('\n');},
'dedupe-lines':function(s){var seen={},o=[];s.split(/\r?\n/).forEach(function(l){if(!seen[l]){seen[l]=1;o.push(l);}});return o.join('\n');},
'remove-empty':function(s){return s.split(/\r?\n/).filter(function(l){return l.trim()!=='';}).join('\n');},
'trim-lines':function(s){return s.split(/\r?\n/).map(function(l){return l.trim();}).join('\n');},
'remove-spaces':function(s){return s.replace(/\s+/g,'');},
'remove-extra-spaces':function(s){return s.replace(/[ \t]+/g,' ').replace(/ *\n */g,'\n').trim();},
'remove-linebreaks':function(s){return s.replace(/\r?\n+/g,' ').replace(/\s+/g,' ').trim();},
'slugify':function(s){return s.toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');},
'rot13':function(s){return s.replace(/[a-z]/gi,function(c){return String.fromCharCode((c<='Z'?90:122)>=(c=c.charCodeAt(0)+13)?c:c-26);});},
'text-binary':function(s){return s.split('').map(function(c){return c.charCodeAt(0).toString(2).padStart(8,'0');}).join(' ');},
'binary-text':function(s){return s.trim().split(/\s+/).map(function(b){return String.fromCharCode(parseInt(b,2));}).join('');},
'text-hex':function(s){return s.split('').map(function(c){return c.charCodeAt(0).toString(16).padStart(2,'0');}).join(' ');},
'hex-text':function(s){return s.trim().split(/\s+/).map(function(h){return String.fromCharCode(parseInt(h,16));}).join('');},
'text-morse':function(s){var M={'a':'.-','b':'-...','c':'-.-.','d':'-..','e':'.','f':'..-.','g':'--.','h':'....','i':'..','j':'.---','k':'-.-','l':'.-..','m':'--','n':'-.','o':'---','p':'.--.','q':'--.-','r':'.-.','s':'...','t':'-','u':'..-','v':'...-','w':'.--','x':'-..-','y':'-.--','z':'--..','0':'-----','1':'.----','2':'..---','3':'...--','4':'....-','5':'.....','6':'-....','7':'--...','8':'---..','9':'----.',' ':'/'};return s.toLowerCase().split('').map(function(c){return M[c]||'';}).join(' ').trim();},
'base64-encode':function(s){return btoa(unescape(encodeURIComponent(s)));},
'base64-decode':function(s){try{return decodeURIComponent(escape(atob(s.trim())));}catch(e){return 'Invalid Base64 input';}},
'url-encode':function(s){return encodeURIComponent(s);},
'url-decode':function(s){try{return decodeURIComponent(s);}catch(e){return 'Invalid input';}},
'html-encode':function(s){return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');},
'html-decode':function(s){var d=el('textarea');d.innerHTML=s;return d.value;},
'strip-tags':function(s){return s.replace(/<[^>]*>/g,'');},
'json-format':function(s){try{return JSON.stringify(JSON.parse(s),null,2);}catch(e){return 'Invalid JSON: '+e.message;}},
'json-minify':function(s){try{return JSON.stringify(JSON.parse(s));}catch(e){return 'Invalid JSON: '+e.message;}},
'json-validate':function(s){try{JSON.parse(s);return 'Valid JSON \u2713';}catch(e){return 'Invalid JSON: '+e.message;}},
'csv-json':function(s){var lines=s.trim().split(/\r?\n/);if(!lines.length)return '[]';var h=lines[0].split(',');var out=lines.slice(1).map(function(l){var c=l.split(','),o={};h.forEach(function(k,i){o[k.trim()]=(c[i]||'').trim();});return o;});return JSON.stringify(out,null,2);},
'json-csv':function(s){try{var a=JSON.parse(s);if(!Array.isArray(a))a=[a];var keys=Object.keys(a[0]||{});var rows=[keys.join(',')];a.forEach(function(o){rows.push(keys.map(function(k){return o[k];}).join(','));});return rows.join('\n');}catch(e){return 'Invalid JSON';}}
};
// number base
function baseConv(s,from,to){return s.trim().split(/\s+/).map(function(x){var n=parseInt(x,from);return isNaN(n)?'?':n.toString(to);}).join(' ');}
T['bin-dec']=function(s){return baseConv(s,2,10);};T['dec-bin']=function(s){return baseConv(s,10,2);};
T['dec-hex']=function(s){return baseConv(s,10,16);};T['hex-dec']=function(s){return baseConv(s,16,10);};
T['dec-oct']=function(s){return baseConv(s,10,8);};T['oct-dec']=function(s){return baseConv(s,8,10);};
T['bin-hex']=function(s){return baseConv(s,2,16);};T['hex-bin']=function(s){return baseConv(s,16,2);};


/* --- extended transforms (batch 2) --- */
T['extract-emails']=function(s){return (s.match(/[\w.+-]+@[\w-]+\.[\w.-]+/g)||[]).join('\n');};
T['extract-urls']=function(s){return (s.match(/https?:\/\/[^\s]+/g)||[]).join('\n');};
T['extract-numbers']=function(s){return (s.match(/-?\d+\.?\d*/g)||[]).join('\n');};
T['add-line-numbers']=function(s){return s.split(/\r?\n/).map(function(l,i){return (i+1)+'. '+l;}).join('\n');};
T['remove-line-numbers']=function(s){return s.split(/\r?\n/).map(function(l){return l.replace(/^\s*\d+[.):\-]?\s*/,'');}).join('\n');};
T['remove-punctuation']=function(s){return s.replace(/[^\w\s]|_/g,'');};
T['remove-numbers']=function(s){return s.replace(/[0-9]/g,'');};
T['remove-letters']=function(s){return s.replace(/[a-zA-Z]/g,'');};
T['nl2br']=function(s){return s.replace(/\r?\n/g,'<br>\n');};
T['br2nl']=function(s){return s.replace(/<br\s*\/?>/gi,'\n');};
T['space-underscore']=function(s){return s.replace(/ /g,'_');};
T['underscore-space']=function(s){return s.replace(/_/g,' ');};
T['space-dash']=function(s){return s.replace(/ /g,'-');};
T['dedupe-words']=function(s){var seen={};return s.split(/\s+/).filter(function(w){var k=w.toLowerCase();if(seen[k])return false;seen[k]=1;return true;}).join(' ');};
T['reverse-each-word']=function(s){return s.replace(/\S+/g,function(w){return w.split('').reverse().join('');});};
T['unicode-escape']=function(s){var o='';for(var i=0;i<s.length;i++){var h=s.charCodeAt(i);o+=h>127?'\\u'+h.toString(16).padStart(4,'0'):s[i];}return o;};
T['unicode-unescape']=function(s){return s.replace(/\\u([0-9a-fA-F]{4})/g,function(_,h){return String.fromCharCode(parseInt(h,16));});};
T['json-escape']=function(s){return JSON.stringify(s).slice(1,-1);};
T['json-unescape']=function(s){try{return JSON.parse('"'+s.replace(/\r?\n/g,'\\n').replace(/"/g,'\\"')+'"');}catch(e){return 'Invalid input';}};
T['nato']=function(s){var N={a:'Alfa',b:'Bravo',c:'Charlie',d:'Delta',e:'Echo',f:'Foxtrot',g:'Golf',h:'Hotel',i:'India',j:'Juliett',k:'Kilo',l:'Lima',m:'Mike',n:'November',o:'Oscar',p:'Papa',q:'Quebec',r:'Romeo',s:'Sierra',t:'Tango',u:'Uniform',v:'Victor',w:'Whiskey',x:'Xray',y:'Yankee',z:'Zulu'};return s.toLowerCase().split('').map(function(c){return N[c]?N[c]:c;}).join(' ');};
T['caesar-encode']=function(s){return s.replace(/[a-z]/gi,function(c){var b=c<='Z'?65:97;return String.fromCharCode((c.charCodeAt(0)-b+3)%26+b);});};
T['caesar-decode']=function(s){return s.replace(/[a-z]/gi,function(c){var b=c<='Z'?65:97;return String.fromCharCode((c.charCodeAt(0)-b+23)%26+b);});};
T['morse-decode']=function(s){var M={'a':'.-','b':'-...','c':'-.-.','d':'-..','e':'.','f':'..-.','g':'--.','h':'....','i':'..','j':'.---','k':'-.-','l':'.-..','m':'--','n':'-.','o':'---','p':'.--.','q':'--.-','r':'.-.','s':'...','t':'-','u':'..-','v':'...-','w':'.--','x':'-..-','y':'-.--','z':'--..','0':'-----','1':'.----','2':'..---','3':'...--','4':'....-','5':'.....','6':'-....','7':'--...','8':'---..','9':'----.'};var R={};for(var k in M)R[M[k]]=k;return s.trim().split(/\s+/).map(function(m){return m==='/'?' ':(R[m]||'');}).join('');};
T['base32-encode']=function(s){var A='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';var b=new TextEncoder().encode(s);var bits=0,val=0,out='';for(var i=0;i<b.length;i++){val=(val<<8)|b[i];bits+=8;while(bits>=5){out+=A[(val>>>(bits-5))&31];bits-=5;}}if(bits>0)out+=A[(val<<(5-bits))&31];while(out.length%8)out+='=';return out;};
T['base32-decode']=function(s){var A='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';s=s.toUpperCase().replace(/=+$/,'');var bits=0,val=0,out=[];for(var i=0;i<s.length;i++){var idx=A.indexOf(s[i]);if(idx<0)continue;val=(val<<5)|idx;bits+=5;if(bits>=8){out.push((val>>>(bits-8))&255);bits-=8;}}try{return new TextDecoder().decode(new Uint8Array(out));}catch(e){return 'Invalid Base32';}};
T['css-minify']=function(s){return s.replace(/\/\*[\s\S]*?\*\//g,'').replace(/\s*([{}:;,])\s*/g,'$1').replace(/;}/g,'}').replace(/\s+/g,' ').trim();};
T['md-to-html']=function(s){return s.replace(/^### (.*)$/gm,'<h3>$1</h3>').replace(/^## (.*)$/gm,'<h2>$1</h2>').replace(/^# (.*)$/gm,'<h1>$1</h1>').replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>').replace(/\*(.+?)\*/g,'<em>$1</em>').replace(/\[(.+?)\]\((.+?)\)/g,'<a href="$2">$1</a>').replace(/`(.+?)`/g,'<code>$1</code>');};

/* ---------- BUILDERS ---------- */
function textTool(app,type,opts){
  var box=el('div',{'class':'tool-box'});
  box.appendChild(el('label',null,opts.inLabel||'Input'));
  var ta=el('textarea',{placeholder:opts.ph||'Type or paste your text here...'});box.appendChild(ta);
  var out=el('div',{'class':'out'});
  var outLabel=el('label',null,opts.outLabel||'Result');out.appendChild(outLabel);
  var res=el('textarea',{readonly:'readonly',placeholder:'Result appears here...'});out.appendChild(res);
  var act=el('div',{'class':'actions'});
  var run=el('button',{'class':'btn'},'\u26A1 Convert');
  var cp=el('button',{'class':'btn ghost'},'\uD83D\uDCCB Copy');
  var cl=el('button',{'class':'btn ghost'},'\uD83D\uDDD1 Clear');
  act.appendChild(run);act.appendChild(cp);act.appendChild(cl);
  box.appendChild(act);box.appendChild(out);
  app.appendChild(box);
  var fn=T[type]||function(s){return s;};
  function go(){res.value=fn(ta.value);}
  run.onclick=go;ta.addEventListener('input',go);
  cp.onclick=function(){copy(res.value);cp.textContent='\u2713 Copied';setTimeout(function(){cp.innerHTML='\uD83D\uDCCB Copy';},1500);};
  cl.onclick=function(){ta.value='';res.value='';};
}
function countTool(app){
  var box=el('div',{'class':'tool-box'});
  box.appendChild(el('label',null,'Enter or paste your text'));
  var ta=el('textarea',{placeholder:'Type or paste text to analyze...'});box.appendChild(ta);
  var sr=el('div',{'class':'stat-row'});
  ['Words','Characters','Chars (no space)','Sentences','Paragraphs','Reading time'].forEach(function(l){
    var s=el('div',{'class':'stat'});s.appendChild(el('b',null,'0'));s.appendChild(el('span',null,l));sr.appendChild(s);});
  box.appendChild(sr);app.appendChild(box);
  var bs=sr.querySelectorAll('b');
  ta.addEventListener('input',function(){var v=ta.value;var w=(v.match(/\S+/g)||[]).length;bs[0].textContent=w;bs[1].textContent=v.length;bs[2].textContent=v.replace(/\s/g,'').length;bs[3].textContent=(v.match(/[.!?]+/g)||[]).length;bs[4].textContent=(v.split(/\n{2,}/).filter(function(x){return x.trim();})).length;bs[5].textContent=Math.max(1,Math.ceil(w/200))+' min';});
}
function hashTool(app,opts){
  var algo=opts.algo||'SHA-256';
  var box=el('div',{'class':'tool-box'});
  box.appendChild(el('label',null,'Text to hash ('+algo+')'));
  var ta=el('textarea',{placeholder:'Enter text...'});box.appendChild(ta);
  var out=el('div',{'class':'out'});out.appendChild(el('label',null,algo+' hash'));var res=el('textarea',{readonly:'readonly'});out.appendChild(res);
  var act=el('div',{'class':'actions'});var run=el('button',{'class':'btn'},'\uD83D\uDD10 Generate Hash');var cp=el('button',{'class':'btn ghost'},'\uD83D\uDCCB Copy');act.appendChild(run);act.appendChild(cp);
  box.appendChild(act);box.appendChild(out);app.appendChild(box);
  run.onclick=function(){var enc=new TextEncoder().encode(ta.value);crypto.subtle.digest(algo,enc).then(function(buf){res.value=Array.from(new Uint8Array(buf)).map(function(b){return b.toString(16).padStart(2,'0');}).join('');});};
  ta.addEventListener('input',function(){if(ta.value)run.onclick();else res.value='';});
  cp.onclick=function(){copy(res.value);};
}
function genTool(app,type,opts){
  var box=el('div',{'class':'tool-box'});
  var out=el('div',{'class':'out'});out.appendChild(el('label',null,'Generated output'));var res=el('textarea',{readonly:'readonly'});out.appendChild(res);
  var ctrl=el('div',{'class':'row'});
  var count=el('input',{type:'number',value:opts.count||1,min:'1',max:'1000',style:'max-width:120px'});
  var lenIn=el('input',{type:'number',value:opts.len||16,min:'1',max:'256',style:'max-width:120px'});
  if(type==='password'||type==='random-string'||type==='token'||type==='pin'){ctrl.appendChild(el('span',null,'Length:'));ctrl.appendChild(lenIn);} 
  ctrl.appendChild(el('span',null,'Quantity:'));ctrl.appendChild(count);
  box.appendChild(ctrl);
  var act=el('div',{'class':'actions'});var run=el('button',{'class':'btn'},'\u2728 Generate');var cp=el('button',{'class':'btn ghost'},'\uD83D\uDCCB Copy');act.appendChild(run);act.appendChild(cp);box.appendChild(act);box.appendChild(out);app.appendChild(box);
  function uuid(){return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,function(c){var r=crypto.getRandomValues(new Uint8Array(1))[0]%16;var v=c==='x'?r:(r&0x3|0x8);return v.toString(16);});}
  function rand(chars,n){var o='';var arr=crypto.getRandomValues(new Uint8Array(n));for(var i=0;i<n;i++)o+=chars[arr[i]%chars.length];return o;}
  function one(){var L=parseInt(lenIn.value)||16;if(type==='uuid'||type==='guid')return uuid();if(type==='pin')return rand('0123456789',L);if(type==='password')return rand('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*',L);if(type==='token'||type==='random-string')return rand('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',L);if(type==='random-number')return String(Math.floor(Math.random()*1e9));if(type==='lorem')return 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.';return rand('abcdef0123456789',L);}
  run.onclick=function(){var n=parseInt(count.value)||1;var a=[];for(var i=0;i<n;i++)a.push(one());res.value=a.join('\n');};
  cp.onclick=function(){copy(res.value);};run.onclick();
}
function colorTool(app){
  var box=el('div',{'class':'tool-box'});box.appendChild(el('label',null,'Pick or enter a color'));
  var inp=el('input',{type:'text',value:'#4f46e5',placeholder:'#4f46e5 or rgb(79,70,229)'});box.appendChild(inp);
  var sw=el('div',{style:'height:70px;border-radius:12px;margin-top:12px;border:1px solid var(--line)'});box.appendChild(sw);
  var out=el('div',{'class':'out'});var res=el('textarea',{readonly:'readonly'});out.appendChild(res);box.appendChild(out);app.appendChild(box);
  function upd(){var v=inp.value.trim();var r,g,b;var m=v.match(/^#?([0-9a-f]{6})$/i);if(m){var h=m[1];r=parseInt(h.substr(0,2),16);g=parseInt(h.substr(2,2),16);b=parseInt(h.substr(4,2),16);}else{var rm=v.match(/(\d+)[, ]+(\d+)[, ]+(\d+)/);if(rm){r=+rm[1];g=+rm[2];b=+rm[3];}else return;}var hex='#'+[r,g,b].map(function(x){return x.toString(16).padStart(2,'0');}).join('');sw.style.background=hex;var max=Math.max(r,g,b)/255,min=Math.min(r,g,b)/255,l=(max+min)/2,d=max-min,hh=0,ss=0;if(d){ss=l>.5?d/(2-max-min):d/(max+min);}var hsl='hsl('+Math.round(hh)+','+Math.round(ss*100)+'%,'+Math.round(l*100)+'%)';res.value='HEX: '+hex+'\nRGB: rgb('+r+', '+g+', '+b+')\nHSL: '+hsl;}
  inp.addEventListener('input',upd);upd();
}
function timestampTool(app){
  var box=el('div',{'class':'tool-box'});box.appendChild(el('label',null,'Unix timestamp or date'));
  var inp=el('input',{type:'text',placeholder:'e.g. 1700000000 or 2026-01-01'});box.appendChild(inp);
  var out=el('div',{'class':'out'});var res=el('textarea',{readonly:'readonly'});out.appendChild(res);box.appendChild(out);
  var act=el('div',{'class':'actions'});var now=el('button',{'class':'btn'},'\u23F1 Now');act.appendChild(now);box.appendChild(act);app.appendChild(box);
  function upd(){var v=inp.value.trim();var d;if(/^\d{9,13}$/.test(v)){d=new Date(parseInt(v)*(v.length>10?1:1000));}else{d=new Date(v);}if(isNaN(d)){res.value='Invalid input';return;}res.value='Unix (s): '+Math.floor(d.getTime()/1000)+'\nUnix (ms): '+d.getTime()+'\nISO: '+d.toISOString()+'\nLocal: '+d.toString()+'\nUTC: '+d.toUTCString();}
  inp.addEventListener('input',upd);now.onclick=function(){inp.value=Math.floor(Date.now()/1000);upd();};
}
function fileB64Tool(app){
  var box=el('div',{'class':'tool-box'});var drop=el('div',{'class':'drop'},'\uD83D\uDCC1 Click to choose a file or drag & drop');var fi=el('input',{type:'file',style:'display:none'});box.appendChild(drop);box.appendChild(fi);
  var out=el('div',{'class':'out'});out.appendChild(el('label',null,'Base64 output'));var res=el('textarea',{readonly:'readonly'});out.appendChild(res);var act=el('div',{'class':'actions'});var cp=el('button',{'class':'btn ghost'},'\uD83D\uDCCB Copy');act.appendChild(cp);box.appendChild(act);box.appendChild(out);app.appendChild(box);
  drop.onclick=function(){fi.click();};fi.onchange=function(){var f=fi.files[0];if(!f)return;var r=new FileReader();r.onload=function(){res.value=r.result;drop.textContent='\u2713 '+f.name+' ('+bytes(f.size)+')';};r.readAsDataURL(f);};cp.onclick=function(){copy(res.value);};
}
function imageTool(app,opts){
  var box=el('div',{'class':'tool-box'});var drop=el('div',{'class':'drop'},'\uD83D\uDDBC\uFE0F Click to choose an image');var fi=el('input',{type:'file',accept:'image/*',style:'display:none'});box.appendChild(drop);box.appendChild(fi);
  var ctrl=el('div',{'class':'row'});var wq=el('input',{type:'number',placeholder:'Width px',style:'max-width:130px'});ctrl.appendChild(el('span',null,'Max width:'));ctrl.appendChild(wq);box.appendChild(ctrl);
  var msg=el('div',{'class':'msg'});box.appendChild(msg);var act=el('div',{'class':'actions'});var run=el('button',{'class':'btn'},'\u2699\uFE0F Process & Download');act.appendChild(run);box.appendChild(act);app.appendChild(box);
  var img=new Image();var loaded=false;drop.onclick=function(){fi.click();};
  fi.onchange=function(){var f=fi.files[0];if(!f)return;var r=new FileReader();r.onload=function(){img.onload=function(){loaded=true;drop.textContent='\u2713 '+f.name+' ('+img.width+'x'+img.height+')';};img.src=r.result;};r.readAsDataURL(f);};
  run.onclick=function(){if(!loaded){msg.className='msg err';msg.textContent='Please choose an image first.';return;}var mw=parseInt(wq.value)||img.width;var scale=Math.min(1,mw/img.width);var c=el('canvas');c.width=img.width*scale;c.height=img.height*scale;c.getContext('2d').drawImage(img,0,0,c.width,c.height);var fmt=opts.format||'image/png';var ext=fmt.split('/')[1];c.toBlob(function(b){dl('converted.'+ext,b);msg.className='msg ok';msg.textContent='\u2713 Downloaded ('+bytes(b.size)+')';},fmt,opts.quality||0.9);};
}
function zipCreateTool(app){
  var box=el('div',{'class':'tool-box'});var drop=el('div',{'class':'drop'},'\uD83D\uDCC1 Click to add files (you can add multiple)');var fi=el('input',{type:'file',multiple:'multiple',style:'display:none'});box.appendChild(drop);box.appendChild(fi);
  var list=el('div',{'class':'files'});box.appendChild(list);var msg=el('div',{'class':'msg'});box.appendChild(msg);
  var act=el('div',{'class':'actions'});var run=el('button',{'class':'btn'},'\uD83D\uDDDC\uFE0F Create & Download ZIP');act.appendChild(run);box.appendChild(act);app.appendChild(box);
  var files=[];drop.onclick=function(){fi.click();};
  fi.onchange=function(){for(var i=0;i<fi.files.length;i++)files.push(fi.files[i]);render();};
  function render(){list.innerHTML='';files.forEach(function(f,i){var row=el('div',{'class':'file'});row.appendChild(el('span',null,f.name+' \u2022 '+bytes(f.size)));var x=el('a',{href:'#'},'\u2715');x.onclick=function(e){e.preventDefault();files.splice(i,1);render();};row.appendChild(x);list.appendChild(row);});}
  run.onclick=function(){if(!files.length){msg.className='msg err';msg.textContent='Add at least one file.';return;}if(typeof JSZip==='undefined'){msg.className='msg err';msg.textContent='ZIP library loading, please retry in a moment.';return;}var zip=new JSZip();var pend=files.length;files.forEach(function(f){var r=new FileReader();r.onload=function(){zip.file(f.name,r.result);if(--pend===0){zip.generateAsync({type:'blob'}).then(function(b){dl('archive.zip',b);msg.className='msg ok';msg.textContent='\u2713 ZIP created ('+bytes(b.size)+')';});}};r.readAsArrayBuffer(f);});};
}
function zipExtractTool(app){
  var box=el('div',{'class':'tool-box'});var drop=el('div',{'class':'drop'},'\uD83D\uDCE6 Click to choose a .zip file');var fi=el('input',{type:'file',accept:'.zip',style:'display:none'});box.appendChild(drop);box.appendChild(fi);
  var list=el('div',{'class':'files'});box.appendChild(list);var msg=el('div',{'class':'msg'});box.appendChild(msg);app.appendChild(box);
  drop.onclick=function(){fi.click();};
  fi.onchange=function(){var f=fi.files[0];if(!f)return;if(typeof JSZip==='undefined'){msg.className='msg err';msg.textContent='ZIP library loading, retry shortly.';return;}JSZip.loadAsync(f).then(function(zip){list.innerHTML='';var names=Object.keys(zip.files);msg.className='msg ok';msg.textContent='\u2713 '+names.length+' item(s) found in '+f.name;names.forEach(function(n){var ent=zip.files[n];if(ent.dir)return;var row=el('div',{'class':'file'});row.appendChild(el('span',null,n));var d=el('a',{href:'#'},'\u2B07\uFE0F Download');d.onclick=function(e){e.preventDefault();ent.async('blob').then(function(b){dl(n.split('/').pop(),b);});};row.appendChild(d);list.appendChild(row);});}).catch(function(){msg.className='msg err';msg.textContent='Could not read ZIP file.';});};
}


/* --- extended builders (batch 2) --- */
function findReplaceTool(app,opts){
  var box=el('div',{'class':'tool-box'});box.appendChild(el('label',null,'Your text'));
  var ta=el('textarea',{placeholder:'Paste text here...'});box.appendChild(ta);
  var row=el('div',{'class':'row'});var f=el('input',{type:'text',placeholder:'Find'});var r=el('input',{type:'text',placeholder:'Replace with'});row.appendChild(f);row.appendChild(r);box.appendChild(row);
  var row2=el('div',{'class':'row'});var cbW=el('label',{'class':'chk'});var ci=el('input',{type:'checkbox'});cbW.appendChild(ci);cbW.appendChild(el('span',null,' Regex'));var cbC=el('label',{'class':'chk'});var cc=el('input',{type:'checkbox'});cbC.appendChild(cc);cbC.appendChild(el('span',null,' Case sensitive'));row2.appendChild(cbW);row2.appendChild(cbC);box.appendChild(row2);
  var out=el('div',{'class':'out'});out.appendChild(el('label',null,'Result'));var res=el('textarea',{readonly:'readonly'});out.appendChild(res);var act=el('div',{'class':'actions'});var run=el('button',{'class':'btn'},'Replace');var cp=el('button',{'class':'btn ghost'},'Copy');act.appendChild(run);act.appendChild(cp);box.appendChild(act);box.appendChild(out);app.appendChild(box);
  run.onclick=function(){var flags='g'+(cc.checked?'':'i');try{var pat=ci.checked?f.value:f.value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');res.value=ta.value.replace(new RegExp(pat,flags),r.value);}catch(e){res.value='Error: '+e.message;}};cp.onclick=function(){copy(res.value);};
}
function regexTool(app){
  var box=el('div',{'class':'tool-box'});var row=el('div',{'class':'row'});var p=el('input',{type:'text',placeholder:'Pattern e.g. \\d+'});var fl=el('input',{type:'text',value:'g',placeholder:'flags',style:'max-width:100px'});row.appendChild(p);row.appendChild(fl);box.appendChild(row);
  box.appendChild(el('label',null,'Test string'));var ta=el('textarea',{placeholder:'Text to test against...'});box.appendChild(ta);var out=el('div',{'class':'out'});out.appendChild(el('label',null,'Matches'));var res=el('textarea',{readonly:'readonly'});out.appendChild(res);box.appendChild(out);app.appendChild(box);
  function go(){try{var re=new RegExp(p.value,fl.value.indexOf('g')<0?fl.value+'g':fl.value);var m,arr=[];while((m=re.exec(ta.value))!==null){arr.push(m[0]);if(m.index===re.lastIndex)re.lastIndex++;}res.value=arr.length?arr.join('\n')+'\n\n('+arr.length+' matches)':'No matches';}catch(e){res.value='Invalid regex: '+e.message;}}
  p.addEventListener('input',go);fl.addEventListener('input',go);ta.addEventListener('input',go);
}
function repeatTool(app){
  var box=el('div',{'class':'tool-box'});box.appendChild(el('label',null,'Text to repeat'));var ta=el('textarea',{placeholder:'Enter text...'});box.appendChild(ta);
  var row=el('div',{'class':'row'});var n=el('input',{type:'number',value:'5',min:'1',max:'10000',style:'max-width:120px'});var sep=el('input',{type:'text',placeholder:'Separator (optional)'});row.appendChild(el('span',null,'Times:'));row.appendChild(n);row.appendChild(sep);box.appendChild(row);
  var out=el('div',{'class':'out'});var res=el('textarea',{readonly:'readonly'});out.appendChild(res);var act=el('div',{'class':'actions'});var run=el('button',{'class':'btn'},'Repeat');var cp=el('button',{'class':'btn ghost'},'Copy');act.appendChild(run);act.appendChild(cp);box.appendChild(act);box.appendChild(out);app.appendChild(box);
  run.onclick=function(){var c=parseInt(n.value)||1;var a=[];for(var i=0;i<c;i++)a.push(ta.value);res.value=a.join(sep.value||'');};cp.onclick=function(){copy(res.value);};
}
function countOccTool(app){
  var box=el('div',{'class':'tool-box'});box.appendChild(el('label',null,'Your text'));var ta=el('textarea',{placeholder:'Paste text...'});box.appendChild(ta);var row=el('div',{'class':'row'});var s=el('input',{type:'text',placeholder:'Word or phrase to count'});row.appendChild(s);box.appendChild(row);
  var out=el('div',{'class':'out'});var res=el('textarea',{readonly:'readonly'});out.appendChild(res);box.appendChild(out);app.appendChild(box);
  function go(){if(!s.value){res.value='';return;}var pat=s.value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');var m=ta.value.match(new RegExp(pat,'gi'));res.value='Found '+(m?m.length:0)+' occurrence(s) of "'+s.value+'"';}
  ta.addEventListener('input',go);s.addEventListener('input',go);
}
function diffTool(app){
  var box=el('div',{'class':'tool-box'});var row=el('div',{'class':'row2'});var a=el('textarea',{placeholder:'Original text...'});var b=el('textarea',{placeholder:'Changed text...'});row.appendChild(a);row.appendChild(b);box.appendChild(row);
  var out=el('div',{'class':'out'});out.appendChild(el('label',null,'Line differences'));var res=el('textarea',{readonly:'readonly'});out.appendChild(res);var act=el('div',{'class':'actions'});var run=el('button',{'class':'btn'},'Compare');act.appendChild(run);box.appendChild(act);box.appendChild(out);app.appendChild(box);
  run.onclick=function(){var la=a.value.split(/\r?\n/),lb=b.value.split(/\r?\n/),o=[],nn=Math.max(la.length,lb.length);for(var i=0;i<nn;i++){if(la[i]===lb[i])o.push('  '+(la[i]||''));else{if(la[i]!==undefined)o.push('- '+la[i]);if(lb[i]!==undefined)o.push('+ '+lb[i]);}}res.value=o.join('\n');};
}

/* ---------- INIT ---------- */
function init(){
  var app=document.getElementById('toolApp');if(!app)return;
  var type=app.getAttribute('data-tool')||'upper';
  var opts={};try{opts=JSON.parse(app.getAttribute('data-opts')||'{}');}catch(e){}
  if(type==='find-replace')return findReplaceTool(app,opts);
  if(type==='regex-test')return regexTool(app);
  if(type==='text-repeat')return repeatTool(app);
  if(type==='count-occurrences')return countOccTool(app);
  if(type==='text-diff')return diffTool(app);
  if(type==='count')return countTool(app);
  if(type==='hash')return hashTool(app,opts);
  if(type==='color')return colorTool(app);
  if(type==='timestamp')return timestampTool(app);
  if(type==='file-base64')return fileB64Tool(app);
  if(type==='image')return imageTool(app,opts);
  if(type==='zip-create')return zipCreateTool(app);
  if(type==='zip-extract')return zipExtractTool(app);
  if(['password','pin','uuid','guid','token','random-string','random-number','lorem'].indexOf(type)>-1)return genTool(app,type,opts);
  return textTool(app,type,opts);
}
// dark toggle (shared)
function dark(){var dk=document.getElementById('dk');if(!dk)return;if(localStorage.getItem('afc-dark')==='1'){document.body.classList.add('dark');dk.textContent='\u2600\uFE0F';}dk.onclick=function(){var d=document.body.classList.toggle('dark');localStorage.setItem('afc-dark',d?'1':'0');dk.textContent=d?'\u2600\uFE0F':'\uD83C\uDF19';};}
if(document.readyState!=='loading')init(),dark();else document.addEventListener('DOMContentLoaded',function(){init();dark();});
})();
