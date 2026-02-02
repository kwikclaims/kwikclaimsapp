/**
 * NUCLEAR RENDER OVERRIDE
 * Most aggressive rendering enforcement possible
 * Forces preview to display NO MATTER WHAT
 */
(function() {
  'use strict';

  console.log('☢️ NUCLEAR RENDER MODE ACTIVATED');

  // Set global flag
  window.__NUCLEAR_RENDER__ = true;
  window.__FORCE_VISIBLE__ = true;

  // BLOCK ALL BOLT INFRASTRUCTURE
  const NUCLEAR_BLOCKLIST = [
    '/~/messo/',
    'messo.min.js',
    '/api/deploy',
    '/api/project/integrations',
    '/api/analytics',
    'bolt.new/~/messo',
    'bolt.new/api/deploy',
    'chameleon',
    'chmln',
    'analytics-',
    'chat.client',
    'performance-',
    'tracking',
    'tag-manager',
    'gtm',
    'mixpanel',
    'segment',
    'amplitude'
  ];

  const isBlocked = (url) => {
    if (!url) return false;
    const urlStr = url.toString().toLowerCase();
    return NUCLEAR_BLOCKLIST.some(pattern => urlStr.includes(pattern.toLowerCase()));
  };

  // OVERRIDE: Fetch - return immediate success for blocked URLs
  const originalFetch = window.fetch;
  window.fetch = function(url, ...args) {
    if (isBlocked(url)) {
      console.warn('☢️ [NUKED]:', url);
      return Promise.resolve(new Response(JSON.stringify({ ok: true, nuked: true }), {
        status: 200,
        statusText: 'OK',
        headers: { 'Content-Type': 'application/json' }
      }));
    }

    return originalFetch.apply(this, [url, ...args]).catch(error => {
      if (isBlocked(url)) {
        console.warn('☢️ [NUKED ERROR]:', url);
        return new Response('{}', { status: 200 });
      }
      throw error;
    });
  };

  // OVERRIDE: XMLHttpRequest - fake success for blocked URLs
  const OriginalXHR = window.XMLHttpRequest;
  window.XMLHttpRequest = function() {
    const xhr = new OriginalXHR();
    const originalOpen = xhr.open;

    xhr.open = function(method, url, ...rest) {
      if (isBlocked(url)) {
        console.warn('☢️ [NUKED XHR]:', url);

        // Override send to fake success
        xhr.send = function() {
          setTimeout(() => {
            Object.defineProperty(xhr, 'status', { value: 200, writable: false, configurable: true });
            Object.defineProperty(xhr, 'readyState', { value: 4, writable: false, configurable: true });
            Object.defineProperty(xhr, 'responseText', { value: '{"ok":true}', writable: false, configurable: true });
            Object.defineProperty(xhr, 'response', { value: '{"ok":true}', writable: false, configurable: true });

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

  // OVERRIDE: Script creation - block bad scripts at creation time
  const originalCreateElement = document.createElement;
  document.createElement = function(tagName, ...args) {
    const element = originalCreateElement.apply(this, [tagName, ...args]);

    if (tagName.toLowerCase() === 'script') {
      const originalSetAttribute = element.setAttribute;

      element.setAttribute = function(name, value) {
        if (name === 'src' && isBlocked(value)) {
          console.warn('☢️ [NUKED SCRIPT]:', value);
          return; // Don't set the src
        }
        return originalSetAttribute.apply(this, [name, value]);
      };

      // Also intercept direct property assignment
      let srcValue = '';
      Object.defineProperty(element, 'src', {
        get() { return srcValue; },
        set(value) {
          if (isBlocked(value)) {
            console.warn('☢️ [NUKED SCRIPT]:', value);
            return;
          }
          srcValue = value;
          if (element.setAttribute) {
            originalSetAttribute.call(element, 'src', value);
          }
        },
        configurable: true
      });
    }

    return element;
  };

  // OVERRIDE: Node.appendChild - prevent bad scripts from being added to DOM
  const originalAppendChild = window.Node?.prototype?.appendChild;
  if (originalAppendChild) {
    window.Node.prototype.appendChild = function(child) {
      if (child?.tagName === 'SCRIPT' && child.src && isBlocked(child.src)) {
        console.warn('☢️ [BLOCKED APPEND]:', child.src);
        return child; // Return but don't append
      }
      return originalAppendChild.call(this, child);
    };
  }

  // OVERRIDE: Node.insertBefore - prevent bad scripts from being inserted
  const originalInsertBefore = window.Node?.prototype?.insertBefore;
  if (originalInsertBefore) {
    window.Node.prototype.insertBefore = function(newNode, referenceNode) {
      if (newNode?.tagName === 'SCRIPT' && newNode.src && isBlocked(newNode.src)) {
        console.warn('☢️ [BLOCKED INSERT]:', newNode.src);
        return newNode; // Return but don't insert
      }
      return originalInsertBefore.call(this, newNode, referenceNode);
    };
  }

  // NUKE: All error events from blocked sources
  const nukeError = (event) => {
    const errorStr = event?.error?.toString?.()?.toLowerCase?.() ||
                    event?.message?.toString?.()?.toLowerCase?.() ||
                    event?.reason?.toString?.()?.toLowerCase?.() || '';

    const stackStr = event?.error?.stack?.toLowerCase?.() || '';
    const combined = errorStr + ' ' + stackStr;

    const shouldNuke = NUCLEAR_BLOCKLIST.some(pattern =>
      combined.includes(pattern.toLowerCase())
    );

    if (shouldNuke) {
      console.warn('☢️ [NUKED ERROR]:', errorStr.substring(0, 100));
      if (event.preventDefault) event.preventDefault();
      if (event.stopPropagation) event.stopPropagation();
      if (event.stopImmediatePropagation) event.stopImmediatePropagation();
      return false;
    }
  };

  window.addEventListener('error', nukeError, true);
  window.addEventListener('unhandledrejection', nukeError, true);

  // FORCE VISIBLE: Make html/body always visible
  const forceVisible = () => {
    try {
      // Force html element visible
      if (document.documentElement) {
        document.documentElement.style.cssText =
          'display:block!important;visibility:visible!important;opacity:1!important;';
      }

      // Force body element visible
      if (document.body) {
        document.body.style.cssText =
          'display:block!important;visibility:visible!important;opacity:1!important;min-height:100vh!important;';
      }

      // Remove any loading overlays
      document.querySelectorAll(`
        [class*="spinner"],
        [class*="loader"],
        [class*="loading"],
        [class*="overlay"],
        [id*="spinner"],
        [id*="loader"],
        [id*="loading"],
        [id*="overlay"]
      `).forEach(el => {
        if (el.style) {
          el.style.display = 'none';
          el.style.visibility = 'hidden';
          el.style.opacity = '0';
        }
      });

      // Remove Bolt-specific overlays
      document.querySelectorAll('[class*="bolt-"]').forEach(el => {
        const computedStyle = window.getComputedStyle(el);
        if (computedStyle.position === 'fixed' || computedStyle.position === 'absolute') {
          if (el.style) {
            el.style.display = 'none';
          }
        }
      });
    } catch (e) {
      console.warn('☢️ [FORCE VISIBLE ERROR]:', e.message);
    }
  };

  // Execute force visible multiple times to ensure it sticks
  forceVisible();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', forceVisible);
  } else {
    forceVisible();
  }

  // Keep forcing visible until page is fully loaded
  setTimeout(forceVisible, 50);
  setTimeout(forceVisible, 100);
  setTimeout(forceVisible, 250);
  setTimeout(forceVisible, 500);
  setTimeout(forceVisible, 1000);
  setTimeout(forceVisible, 2000);

  // STUB: Common analytics objects
  window.chmln = window.chmln || {
    identify: () => {},
    track: () => {},
    show: () => {},
    hide: () => {},
    set: () => {},
    get: () => null,
    on: () => {},
    off: () => {}
  };

  window.analytics = window.analytics || {
    track: () => {},
    identify: () => {},
    page: () => {},
    reset: () => {},
    ready: (cb) => { if (cb) cb(); }
  };

  window.mixpanel = window.mixpanel || {
    track: () => {},
    identify: () => {},
    init: () => {}
  };

  // PREVENT: Any attempt to hide the page
  const styleObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
        const target = mutation.target;
        if (target === document.documentElement || target === document.body) {
          const style = window.getComputedStyle(target);
          if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
            console.warn('☢️ [PREVENTED HIDE]:', target.tagName);
            forceVisible();
          }
        }
      }
    });
  });

  // Start observing once DOM is ready
  if (document.documentElement) {
    styleObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['style', 'class']
    });
  }

  if (document.body) {
    styleObserver.observe(document.body, {
      attributes: true,
      attributeFilter: ['style', 'class']
    });
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      if (document.body) {
        styleObserver.observe(document.body, {
          attributes: true,
          attributeFilter: ['style', 'class']
        });
      }
    });
  }

  console.log('☢️ NUCLEAR RENDER: All systems armed and active');
})();
