const fs = require('fs');
const content = fs.readFileSync('src/components/Admin/NotesSection.tsx', 'utf-8');
const patched = content.replace(
  "{type === 'internal' ? 'Observações Internas' : 'Notas Comerciais'}",
  "{type === 'internal' ? 'Observações Internas Operacionais' : 'Notas Comerciais (Interações, Preferências, Oportunidades)'}"
);
fs.writeFileSync('src/components/Admin/NotesSection.tsx', patched);
