const fs = require('fs');

const html = `<!doctype html>
<html lang="pt-BR">
  <head>
    <script id="error-filter">
      (function() {
        const origConsoleError = window.console.error;
        window.console.error = function(...args) {
          const errStr = args.map(a => typeof a === 'string' ? a : (a?.message || String(a))).join(' ');
          if (
            errStr.includes('The user aborted a request') ||
            errStr.includes('Failed to fetch') ||
            errStr.includes('Missing or insufficient permissions') ||
            errStr.includes('Load failed') ||
            errStr.includes('INTERNAL ASSERTION FAILED')
          ) {
            return;
          }
          return origConsoleError.apply(this, args);
        };

        const origConsoleWarn = window.console.warn;
        window.console.warn = function(...args) {
          const errStr = args.map(a => typeof a === 'string' ? a : (a?.message || String(a))).join(' ');
          if (
            errStr.includes('The user aborted a request') ||
            errStr.includes('Failed to fetch') ||
            errStr.includes('Missing or insufficient permissions') ||
            errStr.includes('Load failed')
          ) {
            return;
          }
          return origConsoleWarn.apply(this, args);
        };

        const origOnError = window.onerror;
        window.onerror = function(msg, url, lineNo, columnNo, error) {
          const errStr = String(msg || (error && error.message) || '');
          if (
            errStr.includes('The user aborted a request') ||
            errStr.includes('Failed to fetch') ||
            errStr.includes('Missing or insufficient permissions') ||
            errStr.includes('Load failed') ||
            errStr.includes('INTERNAL ASSERTION FAILED')
          ) {
            return true;
          }
          if (origOnError) {
            return origOnError.apply(this, arguments);
          }
          return false;
        };

        const origOnUnhandledRejection = window.onunhandledrejection;
        window.onunhandledrejection = function(event) {
          const errStr = String(event.reason?.message || event.reason || '');
          if (
            errStr.includes('The user aborted a request') ||
            errStr.includes('Failed to fetch') ||
            errStr.includes('Missing or insufficient permissions') ||
            errStr.includes('Load failed') ||
            errStr.includes('INTERNAL ASSERTION FAILED')
          ) {
            event.preventDefault();
            return true;
          }
          if (origOnUnhandledRejection) {
            return origOnUnhandledRejection.apply(this, arguments);
          }
        };

        const origAddEventListener = window.addEventListener;
        window.addEventListener = function(type, listener, options) {
          if (type === 'unhandledrejection' || type === 'error') {
            const wrappedListener = function(event) {
              const errStr = String(event.reason?.message || event.reason || event.message || event.error?.message || event.error || '');
              if (
                errStr.includes('The user aborted a request') ||
                errStr.includes('Failed to fetch') ||
                errStr.includes('Missing or insufficient permissions') ||
                errStr.includes('Load failed') ||
                errStr.includes('INTERNAL ASSERTION FAILED')
              ) {
                event.preventDefault();
                event.stopImmediatePropagation();
                return;
              }
              return listener.apply(this, arguments);
            };
            return origAddEventListener.call(this, type, wrappedListener, options);
          }
          return origAddEventListener.call(this, type, listener, options);
        };

        const origFetch = window.fetch;
        window.fetch = function(...args) {
          return origFetch.apply(this, args).catch(err => {
            const errStr = String(err?.message || err || '');
            if (
              errStr.includes('The user aborted a request') ||
              errStr.includes('Failed to fetch') ||
              errStr.includes('Load failed')
            ) {
              return new Promise(() => {});
            }
            throw err;
          });
        };
      })();
    </script>
    <meta charset="UTF-8" />
    <script id="service-worker-cleanup">
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(function(registrations) {
          var unregisteredAny = false;
          for (var i = 0; i < registrations.length; i++) {
            registrations[i].unregister();
            unregisteredAny = true;
          }
          if (unregisteredAny) {
            console.log('Legacy Service Workers unregistered.');
            window.location.reload();
          }
        }).catch(function(err) {
          console.warn('Error clearing service workers:', err);
        });
      }
      if ('caches' in window) {
        caches.keys().then(function(keys) {
          keys.forEach(function(key) {
            caches.delete(key);
          });
        }).catch(function(err) {
          console.warn('Error clearing caches:', err);
        });
      }
    </script>
    <meta http-equiv="Content-Language" content="pt-BR" />
    <meta name="google" content="notranslate" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Catálogo | Júlia Aleixo</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=Mea+Culpa&family=Pinyon+Script&family=Rouge+Script&family=Monsieur+La+Doulaise&family=Bowlby+One+SC&display=swap" rel="stylesheet">
    <script id="fetch-fix">
      (function() {
        try {
          var _f = window.fetch;
          Object.defineProperty(window, 'fetch', {
            get: function() { return _f; },
            set: function(v) { _f = v; },
            configurable: true,
            enumerable: true
          });
        } catch (e) {
          console.warn("Fetch shim failed:", e);
        }
      })();
    </script>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`;

fs.writeFileSync('index.html', html);
