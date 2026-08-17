/* ============================================================
 * allfreecalculators.in - editable site config (frontend).
 * Yahan apni website ki settings set karein. Agar aapka backend
 * chal raha hai to admin panel ki settings yahan se override ho
 * jayengi (site-config.js automatically backend se fetch karta hai).
 *
 * BACKEND CONNECT KARNE KE LIYE:
 *   apiBase = 'https://your-domain.com/api/v1'  <-- apna URL daalein
 *   (ya khaali chhod dein to sirf neeche wali values use hongi)
 * ============================================================ */
// NOTE: Leave empty to avoid CORS/console errors for static hosting.
// If you run your own backend, set this to your API base, e.g. 'https://api.example.com/api/v1'
window.CALCVERSE_API_BASE = '';


window.CALCVERSE_SITE = {
  // Cashfree Pro upgrade link (optional). Paste your Cashfree Payment Link here
  // for a guaranteed public "Upgrade to Pro" button (no backend needed).
  proPaymentLink: '',

  // Branding
  'site.name': 'allfreecalculators.in',
  'site.tagline': 'Free Online Tools & Calculators',
  'site.primaryColor': '#6366f1',

  // Google / search-engine connect (sirf content value daalein, poora tag nahi)
  'integrations.googleSiteVerification': '', // Google Search Console verification code
  'integrations.bingSiteVerification': '',
  'integrations.ga4Id': 'G-N1LF9FNPEP',        // e.g. 'G-XXXXXXXXXX'
  'integrations.gtmId': '',        // e.g. 'GTM-XXXXXXX'
  'integrations.adsenseClient': '',// e.g. 'ca-pub-xxxxxxxxxxxxxxxx'

  // Custom code injection (poora HTML yahan paste kar sakte hain)
  'integrations.headCode': '',      // <head> ke andar inject hoga
  'integrations.bodyStartCode': '', // <body> ke turant baad inject hoga
  'integrations.bodyEndCode': '',   // </body> se pehle inject hoga

  // Ads
  'ads.enabled': false,
};
