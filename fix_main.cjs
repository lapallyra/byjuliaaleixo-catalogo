const fs = require('fs');
let code = fs.readFileSync('src/main.tsx', 'utf-8');

code = code.replace(/window\.addEventListener\('unhandledrejection', event => \{[\s\S]*?\}\);/, `window.addEventListener('unhandledrejection', event => {
  const errorStr = String(event.reason?.message || event.reason || '');
  if (
    errorStr.includes('INTERNAL ASSERTION FAILED: Pending promise was never set') ||
    errorStr.includes('The user aborted a request') ||
    errorStr.includes('signal is aborted without reason') ||
    errorStr.includes('Missing or insufficient permissions') ||
    errorStr.includes('Failed to fetch') ||
    errorStr.includes('Load failed')
  ) {
    event.preventDefault();
  }
});`);

code = code.replace(/window\.addEventListener\('error', event => \{[\s\S]*?\}\);/, `window.addEventListener('error', event => {
  const errorStr = String(event.message || event.error?.message || event.error || '');
  if (
    errorStr.includes('Missing or insufficient permissions') ||
    errorStr.includes('The user aborted a request') ||
    errorStr.includes('signal is aborted without reason') ||
    errorStr.includes('Failed to fetch') ||
    errorStr.includes('Load failed') ||
    errorStr.includes('INTERNAL ASSERTION FAILED: Pending promise was never set')
  ) {
    event.preventDefault();
  }
});`);

code = code.replace(/const errorStr = args\.map\(arg => typeof arg === 'string' \? arg : \(arg instanceof Error \? arg\.message : String\(arg\)\)\)\.join\(' '\);/, `const errorStr = args.map(arg => {
      if (typeof arg === 'string') return arg;
      if (arg && typeof arg.message === 'string') return arg.message;
      return String(arg);
    }).join(' ');`);

fs.writeFileSync('src/main.tsx', code);
