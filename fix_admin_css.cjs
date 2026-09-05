const fs = require('fs');
let css = fs.readFileSync('src/index.css', 'utf8');

// Replace the CSS variables and base dark theme styles
const newVars = `:root:has(.admin-wrapper) {
  --admin-bg-primary: #0F172A; /* Slate 900 */
  --admin-glass-bg: rgba(30, 41, 59, 0.65); /* Slate 800 */
  --admin-glass-border: rgba(255, 255, 255, 0.1);
  --admin-glass-blur: blur(24px);
  --admin-text-primary: #F8FAFC; 
  --admin-text-light: #F8FAFC;
}

.admin-wrapper {
  background-color: var(--admin-bg-primary) !important;
  color: var(--admin-text-primary) !important;
  background-image: 
    radial-gradient(circle at 15% 50%, rgba(236, 72, 153, 0.15), transparent 35%),
    radial-gradient(circle at 85% 20%, rgba(56, 189, 248, 0.15), transparent 35%) !important;
  font-family: "Poppins", sans-serif !important;
  min-height: 100dvh;
}`;

css = css.replace(/:root:has\(\.admin-wrapper\) \{[\s\S]*?min-height: 100dvh;\s*\}/, newVars);

// Fix text-shadow in typography
css = css.replace(/text-shadow: 0 1px 2px rgba\(255,255,255,0\.3\) !important;/g, 'text-shadow: none !important;');

// Fix slate-700 and slate-500 colors
css = css.replace(/color: #4A423C !important;/g, 'color: #E2E8F0 !important;');
css = css.replace(/color: #635952 !important;/g, 'color: #94A3B8 !important;');

// Fix box-shadow in cards
css = css.replace(/inset 0 1px 2px rgba\(255, 255, 255, 0\.7\),\s*inset 0 -1px 2px rgba\(255, 255, 255, 0\.1\) !important;/g, 'inset 0 1px 1px rgba(255, 255, 255, 0.1) !important;');
css = css.replace(/box-shadow:\s*0 16px 40px -8px rgba\(0, 0, 0, 0\.1\),/g, 'box-shadow:\n    0 16px 40px -8px rgba(0, 0, 0, 0.3),');

// Fix buttons
css = css.replace(/\.admin-wrapper button \{[\s\S]*?\}\s*\.admin-wrapper button span/, `.admin-wrapper button {
  background-color: rgba(255, 255, 255, 0.05) !important;
  backdrop-filter: blur(12px) !important;
  -webkit-backdrop-filter: blur(12px) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  border-radius: 16px !important;
  color: var(--admin-text-primary) !important;
  font-weight: 500 !important;
  text-shadow: none !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2) !important;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1) !important;
}

.admin-wrapper button span,`);

css = css.replace(/\.admin-wrapper button:hover:not\(:disabled\) \{[\s\S]*?\}\s*\.admin-wrapper button:active/, `.admin-wrapper button:hover:not(:disabled) {
  background-color: rgba(255, 255, 255, 0.1) !important;
  transform: translateY(-1px) !important;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3) !important;
}

.admin-wrapper button:active`);

css = css.replace(/\.admin-wrapper table thead tr th \{[\s\S]*?\}/, `.admin-wrapper table thead tr th {
  background-color: rgba(255, 255, 255, 0.03) !important;
  color: #94A3B8 !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
  backdrop-filter: blur(8px) !important;
}`);

css = css.replace(/\.admin-wrapper table tbody tr td \{[\s\S]*?\}/, `.admin-wrapper table tbody tr td {
  border-bottom: 1px solid rgba(255, 255, 255, 0.02) !important;
  color: var(--admin-text-primary) !important;
}`);

css = css.replace(/\.admin-wrapper table tbody tr:hover \{[\s\S]*?\}/, `.admin-wrapper table tbody tr:hover {
  background-color: rgba(255, 255, 255, 0.02) !important;
}`);

css = css.replace(/\.admin-wrapper input,\s*\.admin-wrapper textarea,\s*\.admin-wrapper select,\s*\.admin-wrapper \[role="combobox"\] \{[\s\S]*?\}/, `.admin-wrapper input,
.admin-wrapper textarea,
.admin-wrapper select,
.admin-wrapper [role="combobox"] {
  background-color: rgba(0, 0, 0, 0.2) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  color: var(--admin-text-primary) !important;
  border-radius: 12px !important;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2) !important;
  backdrop-filter: blur(12px) !important;
  transition: all 0.2s ease !important;
}`);

css = css.replace(/\.admin-wrapper input:focus,\s*\.admin-wrapper textarea:focus,\s*\.admin-wrapper select:focus \{[\s\S]*?\}/, `.admin-wrapper input:focus,
.admin-wrapper textarea:focus,
.admin-wrapper select:focus {
  background-color: rgba(0, 0, 0, 0.3) !important;
  border-color: rgba(236, 72, 153, 0.5) !important;
  box-shadow: 
    inset 0 2px 4px rgba(0, 0, 0, 0.2),
    0 0 0 3px rgba(236, 72, 153, 0.15) !important;
  outline: none !important;
}`);

fs.writeFileSync('src/index.css', css);
console.log('Fixed CSS dark theme!');
