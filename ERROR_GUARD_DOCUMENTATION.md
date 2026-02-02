# Error Guard Documentation

## Overview
This document describes the defensive error handling system implemented to prevent third-party scripts from crashing the application.

## Problem Statement
The application was experiencing crashes due to:
1. Third-party analytics/onboarding scripts (Chameleon, Messo) failing to load
2. Missing assets (chmln.js, messo.min.js returning 404)
3. Failing API calls to `/api/deploy/*` and `/api/project/integrations/supabase/*`
4. Runtime errors in third-party code preventing app initialization

## Solution Implemented

### 1. Error Guard Script (`js/error-guard.js`)
A defensive error handler that:
- Catches and logs third-party errors without blocking the app
- Prevents third-party script failures from white-screening the page
- Provides safe wrappers for loading external scripts
- Intercepts global errors and unhandled promise rejections

### 2. Key Features

#### Global Error Handlers
```javascript
window.addEventListener('error', ...)
window.addEventListener('unhandledrejection', ...)
```
These catch errors from third-party scripts and log them as warnings instead of crashing.

#### Safe Script Loader
```javascript
window.safeLoadScript(src, options)
```
Dynamically loads scripts with proper error handling:
- Returns a promise that never rejects
- Logs failures without blocking execution
- Supports async/defer attributes

#### Third-Party Detection
Automatically identifies errors from known third-party sources:
- Chameleon (chmln)
- Messo
- Analytics services
- API calls to hosting environment endpoints

### 3. Files Modified

All application pages now include the error guard:
- `dashboard.html`
- `companies.html`
- `claims.html`
- `claim-details.html`
- `loss-assessment.html`
- `construction-agreement.html`
- `receipt-generator.html`
- `certificate-completion.html`

Each file includes:
```html
<script src="js/error-guard.js"></script>
```

## How It Works

1. **Error Guard loads first** - Before any other JavaScript
2. **Sets up global handlers** - Intercepts errors before they crash the page
3. **Identifies third-party errors** - Checks error source/stack trace
4. **Logs safely** - Third-party errors logged as warnings, not thrown
5. **App continues** - Application initialization proceeds normally

## Configuration

### Enabling/Disabling Third-Party Scripts

To safely load optional third-party scripts (if needed in the future):

```javascript
// In your app initialization code
if (import.meta.env.VITE_ENABLE_ANALYTICS === 'true') {
  safeLoadScript('https://cdn.example.com/analytics.js')
    .then(result => {
      if (result.success) {
        // Initialize analytics
        safeInitThirdParty('analytics', () => {
          window.analytics.init();
        });
      }
    });
}
```

### Environment Variables

Add to `.env` file to control third-party integrations:
```
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_CHAMELEON=false
VITE_ENABLE_TRACKING=false
```

## Testing

### Verification Checklist
- [ ] Homepage loads without errors
- [ ] Dashboard loads and functions correctly
- [ ] Console shows no blocking JavaScript errors
- [ ] Third-party script failures are logged as warnings only
- [ ] All application features work without third-party dependencies

### Testing Third-Party Failures
The error guard should handle:
1. 404 responses from script URLs
2. Runtime errors in third-party code
3. Missing global objects (window.chmln, etc.)
4. Failed API calls to non-existent endpoints

## Monitoring

Check browser console for:
- `[Error Guard]: Initialized` - Confirms guard is active
- `[Third-Party Error]:` - Third-party errors being caught
- `[Script Failed]:` - Scripts that failed to load
- `[Script Loaded]:` - Scripts that loaded successfully

## Best Practices

1. **Never block on third-party code** - Always use async/defer
2. **Always check object existence** - Before calling third-party APIs
3. **Use safeLoadScript** - For all external scripts
4. **Use safeInitThirdParty** - For initialization code
5. **Test without third-party** - App should work without any external dependencies

## Maintenance

When adding new third-party integrations:
1. Add to the `thirdPartyIndicators` array in `error-guard.js`
2. Load via `safeLoadScript()` helper
3. Initialize via `safeInitThirdParty()` helper
4. Test with network disabled to ensure graceful degradation
5. Document in this file

## Troubleshooting

### App still not loading?
1. Check console for non-third-party errors
2. Verify error-guard.js is loading first
3. Check network tab for blocking resources
4. Ensure Supabase credentials are configured

### Third-party features not working?
1. Check if script is actually needed
2. Verify script URL is correct
3. Check console for loading status
4. Ensure initialization code runs after script loads

## Notes

- The error guard does NOT suppress React/Vue/framework errors
- Application errors should still be visible and debuggable
- Only third-party errors are caught and logged
- The guard is defensive - it prevents crashes, not fixes bugs
