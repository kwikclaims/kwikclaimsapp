/**
 * Aggressive Error Guard & Script Blocker
 * Prevents Bolt.new preview wrapper and third-party scripts from crashing the application
 * Blocks known problematic scripts and endpoints
 */

(function() {
  'use strict';

  // Blocked URLs - return immediately without attempting to load
  const BLOCKED_PATTERNS = [
    '/~/messo/',
    'messo.min.js',
    '/api/deploy',
    '/api/project/integrations',
    'bolt.new/~/messo',
    'bolt.new/api/deploy',
    'chameleon',
    'chmln.js'
  ];

  const isBlockedUrl = (url) => {
    if (!url) return false;
    const urlString = url.toString().toLowerCase();
    return BLOCKED_PATTERNS.some(pattern => urlString.includes(pattern.toLowerCase()));
  };

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
      'gtm',
      'bolt.new',
      'chat.client',
      'performance-'
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

  // AGGRESSIVE: Intercept fetch to block problematic endpoints
  const originalFetch = window.fetch;
  window.fetch = function(url, ...args) {
    if (isBlockedUrl(url)) {
      console.warn('[Blocked Fetch]:', url);
      return Promise.resolve(new Response(null, {
        status: 200,
        statusText: 'Blocked by Error Guard',
        headers: { 'Content-Type': 'application/json' }
      }));
    }
    return originalFetch.apply(this, [url, ...args]).catch(error => {
      if (isThirdPartyError(error) || isBlockedUrl(url)) {
        console.warn('[Fetch Failed (Ignored)]:', url, error.message);
        return new Response(null, { status: 200 });
      }
      throw error;
    });
  };

  // AGGRESSIVE: Intercept XMLHttpRequest to block problematic endpoints
  const OriginalXHR = window.XMLHttpRequest;
  window.XMLHttpRequest = function() {
    const xhr = new OriginalXHR();
    const originalOpen = xhr.open;

    xhr.open = function(method, url, ...rest) {
      if (isBlockedUrl(url)) {
        console.warn('[Blocked XHR]:', url);
        // Override send to do nothing
        xhr.send = function() {
          setTimeout(() => {
            Object.defineProperty(xhr, 'status', { value: 200, writable: false });
            Object.defineProperty(xhr, 'readyState', { value: 4, writable: false });
            Object.defineProperty(xhr, 'responseText', { value: '{}', writable: false });
            if (xhr.onload) xhr.onload();
            if (xhr.onreadystatechange) xhr.onreadystatechange();
          }, 0);
        };
        return;
      }
      return originalOpen.apply(this, [method, url, ...rest]);
    };

    return xhr;
  };

  // AGGRESSIVE: Block dynamic script injection for known bad scripts
  const originalCreateElement = document.createElement;
  document.createElement = function(tagName, ...args) {
    const element = originalCreateElement.apply(this, [tagName, ...args]);

    if (tagName.toLowerCase() === 'script') {
      const originalSetAttribute = element.setAttribute;
      element.setAttribute = function(name, value) {
        if (name === 'src' && isBlockedUrl(value)) {
          console.warn('[Blocked Script]:', value);
          // Don't set the src, effectively blocking the script
          return;
        }
        return originalSetAttribute.apply(this, [name, value]);
      };

      // Also intercept direct src property assignment
      let srcValue = '';
      Object.defineProperty(element, 'src', {
        get() { return srcValue; },
        set(value) {
          if (isBlockedUrl(value)) {
            console.warn('[Blocked Script]:', value);
            return;
          }
          srcValue = value;
          originalSetAttribute.call(element, 'src', value);
        }
      });
    }

    return element;
  };

  // Proxy chmln if it exists
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

  // Stub out common analytics objects to prevent "undefined" errors
  window.chmln = window.chmln || { identify: () => {}, track: () => {}, show: () => {} };
  window.analytics = window.analytics || { track: () => {}, identify: () => {}, page: () => {} };

  console.log('[Aggressive Error Guard]: Initialized - Bolt preview scripts blocked, third-party errors caught');
})();
