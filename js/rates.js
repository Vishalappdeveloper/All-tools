/* ============================================================
   allfreecalculators.in - live currency + crypto rates (with offline fallback)
   Tries free public endpoints; falls back to a bundled table so
   it always works, even offline. Exposes window.CalcVerseRates.
   ============================================================ */
(function () {
  'use strict';
  var PFX = 'calcverse:';
  var R = window.CalcVerseRates = { fiat: null, crypto: null };
  // Static fallback (approx, USD base) so conversions always work offline.
  var FALLBACK = { base: 'USD', t: 0, rates: { USD: 1, INR: 83.2, EUR: 0.92, GBP: 0.79, JPY: 156.8, AUD: 1.51, CAD: 1.36, CNY: 7.24, AED: 3.67, SGD: 1.35, CHF: 0.90, ZAR: 18.5, BRL: 5.1, RUB: 89, SAR: 3.75 } };
  var CRYPTO_FB = { bitcoin: 67000, ethereum: 3500, tether: 1, binancecoin: 600, solana: 165, ripple: 0.52, cardano: 0.45, dogecoin: 0.16 };

  function getJSON(url) { return fetch(url, { cache: 'no-store' }).then(function (r) { if (!r.ok) throw new Error('http'); return r.json(); }); }
  function cache(k, v) { try { localStorage.setItem(PFX + k, JSON.stringify(v)); } catch (e) {} }
  function cached(k) { try { return JSON.parse(localStorage.getItem(PFX + k)); } catch (e) { return null; } }

  R.loadFiat = function (base) {
    base = base || 'USD';
    return getJSON('https://open.er-api.com/v6/latest/' + base).then(function (d) {
      if (d && d.rates) { R.fiat = { base: base, rates: d.rates, t: Date.now() }; cache('fiat', R.fiat); return R.fiat; }
      throw new Error('bad');
    }).catch(function () { R.fiat = cached('fiat') || FALLBACK; return R.fiat; });
  };
  R.loadCrypto = function () {
    return getJSON('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,tether,binancecoin,solana,ripple,cardano,dogecoin&vs_currencies=usd').then(function (d) {
      var o = {}; for (var k in d) o[k] = d[k].usd; R.crypto = { d: o, t: Date.now() }; cache('crypto', R.crypto); return R.crypto;
    }).catch(function () { R.crypto = cached('crypto') || { d: CRYPTO_FB, t: 0 }; return R.crypto; });
  };
  R.convert = function (amount, from, to) {
    var f = R.fiat || FALLBACK; var rf = f.rates[from], rt = f.rates[to];
    if (!rf || !rt) return null; return amount / rf * rt;
  };

  function ticker() {
    var el = document.querySelector('[data-rate-ticker]'); if (!el) return;
    Promise.all([R.loadFiat('USD'), R.loadCrypto()]).then(function () {
      var f = R.fiat.rates, c = R.crypto.d, live = R.fiat.t ? 'LIVE' : 'cached';
      var bits = [];
      if (f.INR) bits.push('USD/INR ' + f.INR.toFixed(2));
      if (f.EUR) bits.push('USD/EUR ' + f.EUR.toFixed(3));
      if (f.GBP) bits.push('USD/GBP ' + f.GBP.toFixed(3));
      if (c.bitcoin) bits.push('BTC $' + Math.round(c.bitcoin).toLocaleString());
      if (c.ethereum) bits.push('ETH $' + Math.round(c.ethereum).toLocaleString());
      el.innerHTML = '<span class="rt-dot"></span><b>' + live + '</b> \u00B7 ' + bits.join(' \u00B7 ');
      el.style.display = '';
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ticker); else ticker();
})();
