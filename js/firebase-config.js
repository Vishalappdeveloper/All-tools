/* ============================================================
   allfreecalculators.in - Firebase configuration (DISABLED)
   ------------------------------------------------------------
   SECURITY FIX: this project's authentication now runs entirely
   through the PHP/MySQL session-based backend (see
   INFINITYFREE_DEPLOYMENT/includes/auth.php and api/login.php,
   api/signup.php, api/me.php). The original live Firebase API
   key that was previously committed here has been removed and
   FIREBASE_CONFIG is intentionally set to null so js/firebase.js
   (if still loaded on any page) falls back to its offline/no-op
   mode instead of contacting a real Firebase project.

   Do not restore a live apiKey/projectId here. If a page still
   references window.FIREBASE_CONFIG, it should be migrated to
   call /api/me.php, /api/login.php, /api/signup.php instead.
   ============================================================ */
window.FIREBASE_CONFIG = null;
window.CALCVERSE_ADMIN_EMAILS = [];
