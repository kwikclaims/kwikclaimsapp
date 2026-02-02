// SIMPLIFIED RENDER ENFORCER - Less aggressive, more targeted
(function() {
  'use strict';

  console.log('%c✅ RENDER ENFORCER ACTIVE', 'background:#0f0;color:#000;padding:5px;font-weight:bold');

  // Ensure page is always visible
  const show = () => {
    if (document.documentElement) document.documentElement.style.cssText = 'display:block!important;visibility:visible!important;opacity:1!important;';
    if (document.body) document.body.style.cssText = 'display:block!important;visibility:visible!important;opacity:1!important;';
  };

  // Run immediately and on load
  show();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', show);
  }
  window.addEventListener('load', show);

  // Keep enforcing
  setInterval(show, 500);

  console.log('%c✅ Page visibility enforced', 'color:#0f0');
})();
