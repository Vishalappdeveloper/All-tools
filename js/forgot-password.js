/* allfreecalculators.in forgot password page - email reset / email OTP only */
(function () {
  'use strict';
  function qs(s) { return document.querySelector(s); }
  function qsa(s) { return Array.prototype.slice.call(document.querySelectorAll(s)); }
  function msg(text, type) { var m = qs('#fpMsg'); if (m) { m.className = 'auth-msg ' + (type || 'ok'); m.textContent = text; } }
  function fbReady(cb, tries) {
    tries = tries || 0;
    var FB = window.CalcVerseFirebase;
    if (FB && FB.ready && FB.api) return cb(FB);
    if (tries > 80) return cb(FB || null);
    setTimeout(function () { fbReady(cb, tries + 1); }, 150);
  }
  document.addEventListener('DOMContentLoaded', function () {
    qsa('.fp-tab').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-fp-tab');
        qsa('.fp-tab').forEach(function (b) { b.classList.toggle('active', b === btn); });
        qsa('.fp-panel').forEach(function (p) { p.classList.toggle('active', p.id === 'fpPanel-' + id); });
        msg('', '');
      });
    });
    var resetForm = qs('#fpResetLinkForm');
    if (resetForm) resetForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = (qs('#fpEmail').value || '').trim();
      msg('Sending reset link…', 'ok');
      fbReady(function (FB) {
        if (!FB || !FB.configured || !FB.api || !FB.api.sendPasswordReset) { msg('Firebase is not configured yet. Add Firebase config and enable Email/Password auth.', 'err'); return; }
        FB.api.sendPasswordReset(email).then(function () { msg('Password reset link sent. Please check your email inbox/spam folder.', 'ok'); }).catch(function (er) { msg((er && er.message) || 'Could not send reset email.', 'err'); });
      });
    });
    var emailOtpForm = qs('#fpEmailOtpForm');
    if (emailOtpForm) emailOtpForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = (qs('#fpOtpEmail').value || '').trim();
      var code = String(Math.floor(100000 + Math.random() * 900000));
      sessionStorage.setItem('calcverse:fpEmailOtp', JSON.stringify({ email: email, code: code, exp: Date.now() + 10 * 60 * 1000 }));
      var verify = qs('#fpEmailOtpVerifyForm'); if (verify) verify.classList.remove('fp-hidden');
      msg('Demo email OTP generated: ' + code + ' (valid for 10 minutes). For production, send this code using Cloud Functions/Email API.', 'ok');
    });
    var emailOtpVerify = qs('#fpEmailOtpVerifyForm');
    if (emailOtpVerify) emailOtpVerify.addEventListener('submit', function (e) {
      e.preventDefault();
      var raw = sessionStorage.getItem('calcverse:fpEmailOtp');
      var data = raw ? JSON.parse(raw) : null;
      var code = (qs('#fpEmailOtpCode').value || '').trim();
      if (!data || Date.now() > data.exp) { msg('OTP expired. Please generate a new OTP.', 'err'); return; }
      if (code !== data.code) { msg('Invalid OTP. Please try again.', 'err'); return; }
      msg('Email OTP verified. Now use Reset link tab to securely set a new password.', 'ok');
    });
  });
})();
