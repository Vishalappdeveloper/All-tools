/* aft-integrations.js — injects analytics/verification/ads/pixel from admin 'integrations' settings,
   and renders a star rating/review widget (AggregateRating backed by /api/aft/reviews). Fully defensive. */
(function(){
  'use strict';
  function get(key){return fetch('/api/aft/settings/'+key,{credentials:'same-origin'}).then(function(r){return r.ok?r.json():null;}).then(function(d){return d&&d.value?d.value:null;}).catch(function(){return null;});}
  function addScript(src,attrs){var s=document.createElement('script');s.src=src;s.async=true;if(attrs)Object.keys(attrs).forEach(function(k){s.setAttribute(k,attrs[k]);});document.head.appendChild(s);return s;}
  function truthy(v){return v===true||v==='true'||v===1||v==='1'||v==='on';}

  function applyIntegrations(g){
    if(!g)return;
    // Google Analytics 4
    if(g.ga_id){addScript('https://www.googletagmanager.com/gtag/js?id='+encodeURIComponent(g.ga_id));window.dataLayer=window.dataLayer||[];window.gtag=function(){dataLayer.push(arguments);};gtag('js',new Date());gtag('config',g.ga_id);}
    // Search Console + Bing verification meta
    if(g.gsc_verify){var m=document.createElement('meta');m.name='google-site-verification';m.content=g.gsc_verify;document.head.appendChild(m);}
    if(g.bing_verify){var b=document.createElement('meta');b.name='msvalidate.01';b.content=g.bing_verify;document.head.appendChild(b);}
    // AdSense auto-ads
    if(g.adsense_pub){var a=addScript('https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client='+encodeURIComponent(g.adsense_pub));a.setAttribute('crossorigin','anonymous');
      if(truthy(g.adsense_auto)){(window.adsbygoogle=window.adsbygoogle||[]).push({google_ad_client:g.adsense_pub,enable_page_level_ads:true});}
      document.querySelectorAll('.aft-ad').forEach(function(slot){if(slot.dataset.done)return;slot.dataset.done='1';slot.innerHTML='<ins class="adsbygoogle" style="display:block" data-ad-client="'+g.adsense_pub+'" data-ad-slot="'+(g.adsense_slot||'')+'" data-ad-format="auto" data-full-width-responsive="true"></ins>';try{(window.adsbygoogle=window.adsbygoogle||[]).push({});}catch(e){}});}
    // Facebook Pixel
    if(g.fb_pixel){!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments);};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s);}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init',g.fb_pixel);fbq('track','PageView');}
    // Arbitrary affiliate / custom head script
    if(g.custom_head){var dv=document.createElement('div');dv.innerHTML=g.custom_head;Array.prototype.slice.call(dv.querySelectorAll('script')).forEach(function(os){var ns=document.createElement('script');if(os.src)ns.src=os.src;else ns.textContent=os.textContent;document.head.appendChild(ns);});}
  }

  // ---- Review / rating widget ----
  function slug(){var m=location.pathname.match(/\/tools\/([^\/]+)\//);return m?m[1]:null;}
  function stars(v){var s='';for(var i=1;i<=5;i++)s+='<span data-v="'+i+'" style="cursor:pointer;font-size:26px;color:'+(i<=Math.round(v)?'#f59e0b':'#cbd5e1')+'">\u2605</span>';return s;}
  function mountReviews(){
    var s=slug();if(!s)return;
    var host=document.querySelector('.aft-faq2')||document.querySelector('footer');if(!host)return;
    var box=document.createElement('section');box.className='aft-reviews';box.style.cssText='max-width:820px;margin:24px auto;padding:16px 20px;border:1px solid var(--border,#eee);border-radius:12px';
    box.innerHTML='<h2 style="font-size:20px;margin:0 0 6px">Rate this tool</h2><div class="aft-stars">'+stars(0)+'</div><div class="aft-ravg" style="font-size:14px;color:var(--muted,#888);margin-top:6px">Loading ratings\u2026</div><div class="aft-rmsg" style="font-size:13px;color:var(--ok,#16a34a);margin-top:6px"></div>';
    host.parentNode.insertBefore(box,host);
    function render(avg,count){box.querySelector('.aft-stars').innerHTML=stars(avg);box.querySelector('.aft-ravg').textContent=count?('\u2b50 '+avg.toFixed(1)+' / 5 from '+count+' ratings'):'Be the first to rate!';}
    fetch('/api/aft/reviews/'+s,{credentials:'same-origin'}).then(function(r){return r.ok?r.json():null;}).then(function(d){if(d&&d.avg!=null)render(d.avg,d.count);else render(4.7,0);}).catch(function(){render(4.7,0);});
    box.querySelector('.aft-stars').addEventListener('click',function(e){var t=e.target.closest('[data-v]');if(!t)return;var v=+t.getAttribute('data-v');if(localStorage.getItem('aft_rated_'+s)){box.querySelector('.aft-rmsg').textContent='You already rated this tool. Thanks!';return;}localStorage.setItem('aft_rated_'+s,v);box.querySelector('.aft-stars').innerHTML=stars(v);fetch('/api/aft/reviews/'+s,{method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',body:JSON.stringify({rating:v})}).then(function(r){return r.json();}).then(function(d){if(d&&d.avg!=null)render(d.avg,d.count);box.querySelector('.aft-rmsg').textContent='Thanks for rating!';}).catch(function(){box.querySelector('.aft-rmsg').textContent='Thanks for rating!';});});
  }

  function run(){get('integrations').then(applyIntegrations);try{mountReviews();}catch(e){}}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run);else run();
})();
