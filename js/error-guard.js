/**
 * Defensive Error Guard
 * Prevents third-party scripts from crashing the application
 * Logs errors without blocking the main app functionality
 */

(function() {
  'use strict';

  const isThirdPartyError = (error) => {
    if (!error) return false;

    const errorString = error.toString ? error.toString().toLowerCase() : '';
    const stackString = error.stack ? error.stack.toLowerCase() : '';
    const combinedString = errorString + ' ' + stackString;

    const thirdPartyIndicators = [
      'chmln',
      'chameleon',
      'messo',
      '/api/deploy',
      '/api/project/integrations',
      'analytics',
      'tracking',
      'tag-manager',
      'gtm'
    ];

    return thirdPartyIndicators.some(indicator =>
      combinedString.includes(indicator)
    );
  };

  const logSafeError = (type, error, extra = {}) => {
    if (isThirdPartyError(error)) {
      console.warn(`[Third-Party ${type}]:`, error.message || error, extra);
      return true;
    }
    return false;
  };

  window.addEventListener('error', function(event) {
    if (logSafeError('Error', event.error || event.message, {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    })) {
      event.preventDefault();
      event.stopPropagation();
      return true;
    }
  }, true);

  window.addEventListener('unhandledrejection', function(event) {
    if (logSafeError('Promise Rejection', event.reason, {
      promise: event.promise
    })) {
      event.preventDefault();
      event.stopPropagation();
      return true;
    }
  }, true);

  const safeLoadScript = (src, options = {}) => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = src;
      script.async = options.async !== false;
      script.defer = options.defer || false;

      script.onload = () => {
        console.log(`[Script Loaded]: ${src}`);
        resolve({ success: true, src });
      };

      script.onerror = (error) => {
        console.warn(`[Script Failed]: ${src}`, error);
        resolve({ success: false, src, error });
      };

      const target = options.target || document.head || document.body;
      if (target) {
        target.appendChild(script);
      } else {
        console.warn(`[Script Skipped]: No valid target for ${src}`);
        resolve({ success: false, src, error: 'No target element' });
      }
    });
  };

  const safeInitThirdParty = (name, initFn) => {
    try {
      if (typeof initFn === 'function') {
        initFn();
      }
    } catch (error) {
      console.warn(`[Third-Party Init Failed]: ${name}`, error);
    }
  };

  window.safeLoadScript = safeLoadScript;
  window.safeInitThirdParty = safeInitThirdParty;

  if (typeof window.chmln !== 'undefined') {
    const originalChmln = window.chmln;
    window.chmln = new Proxy(originalChmln, {
      get(target, prop) {
        try {
          return target[prop];
        } catch (error) {
          console.warn('[Chameleon Error]:', error);
          return undefined;
        }
      },
      apply(target, thisArg, args) {
        try {
          return target.apply(thisArg, args);
        } catch (error) {
          console.warn('[Chameleon Call Error]:', error);
          return undefined;
        }
      }
    });
  }

  console.log('[Error Guard]: Initialized - Third-party errors will be caught and logged');
})();
