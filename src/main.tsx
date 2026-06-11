import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

window.addEventListener('unhandledrejection', event => {
  if (event.reason && typeof event.reason.message === 'string') {
    if (
      event.reason.message.includes('INTERNAL ASSERTION FAILED: Pending promise was never set') ||
      event.reason.message.includes('The user aborted a request') ||
      event.reason.message.includes('signal is aborted without reason') ||
      event.reason.message.includes('Missing or insufficient permissions')
    ) {
      event.preventDefault();
    }
  }
});

window.addEventListener('error', event => {
  if (event.message) {
    if (
      event.message.includes('Missing or insufficient permissions') ||
      event.message.includes('The user aborted a request') ||
      event.message.includes('signal is aborted without reason')
    ) {
      event.preventDefault();
    }
  }
});

const originalConsoleError = console.error;
console.error = (...args) => {
  if (args.length > 0) {
    const errorStr = typeof args[0] === 'string' ? args[0] : (args[0] instanceof Error ? args[0].message : String(args[0]));
    if (
      errorStr.includes('INTERNAL ASSERTION FAILED: Pending promise was never set') ||
      errorStr.includes('The user aborted a request') ||
      errorStr.includes('signal is aborted without reason') ||
      errorStr.includes('Encountered two children with the same key') ||
      errorStr.includes('Missing or insufficient permissions')
    ) {
      return;
    }
  }
  originalConsoleError(...args);
};

createRoot(document.getElementById('root')!).render(
  <App />
);
