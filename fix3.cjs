const fs = require('fs');
let content = fs.readFileSync('src/components/CheckoutModal.tsx', 'utf8');
content = content.replace(/\{formData\.isEmergency && \(\s*<div className="flex justify-between items-center text-\[10px\] text-amber-600 font-bold uppercase tracking-wider">\s*<span>Taxa de Emergência \(.+\):\<\/span>\s*/, '');
fs.writeFileSync('src/components/CheckoutModal.tsx', content);
