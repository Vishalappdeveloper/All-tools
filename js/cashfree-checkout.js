/* allfreecalculators.in - Cashfree hosted checkout (UPI, cards, netbanking, wallets).
   Usage: CFCPay.buy('pro-monthly', {name, email, phone}) */
(function () {
  'use strict';
  var SDK = 'https://sdk.cashfree.com/js/v3/cashfree.js';
  function loadSdk() {
    return new Promise(function (resolve, reject) {
      if (window.Cashfree) return resolve();
      var s = document.createElement('script'); s.src = SDK; s.onload = resolve; s.onerror = function () { reject(new Error('Failed to load Cashfree SDK')); };
      document.head.appendChild(s);
    });
  }
  function getConfig() { return fetch('/api/pay/config').then(function (r) { return r.json(); }); }
  function createOrder(planId, customer) {
    return fetch('/api/pay/create-order', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ planId: planId, customer: customer }) }).then(function (r) { return r.json(); });
  }
  function buy(planId, customer) {
    customer = customer || {};
    if (!customer.email || !customer.phone) { alert('Please enter your email and phone to continue.'); return; }
    return createOrder(planId, customer).then(function (o) {
      if (o.error || !o.payment_session_id) { alert('Payment error: ' + (o.error || 'could not start checkout')); throw new Error(o.error || 'no session'); }
      return loadSdk().then(function () {
        var cashfree = window.Cashfree({ mode: (o.mode === 'production') ? 'production' : 'sandbox' });
        return cashfree.checkout({ paymentSessionId: o.payment_session_id, redirectTarget: '_self' });
      });
    });
  }
  window.CFCPay = { buy: buy, config: getConfig };
})();
