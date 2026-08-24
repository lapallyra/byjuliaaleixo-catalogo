import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { automationEngine } from './services/automationEngine';

// Initialize the Smart Automation Engine
automationEngine.init();

// Benign error suppression
const suppressBenign = (e: any) => {
  const errStr = String(e?.message || e?.reason?.message || e?.reason || e || '');
  const suppress = [
    'The user aborted a request',
    'Failed to fetch',
    'Load failed',
    'signal is aborted without reason',
    'AbortError',
    'domexception'
  ].some(s => errStr.includes(s));
  if (suppress && e.preventDefault) e.preventDefault();
  return suppress;
};

window.addEventListener('unhandledrejection', suppressBenign);
window.addEventListener('error', suppressBenign);

createRoot(document.getElementById('root')!).render(
  <App />
);
