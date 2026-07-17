const fs = require('fs');
const content = fs.readFileSync('src/components/Admin/ClientsTab.tsx', 'utf-8');

const regexState = /const \[quickFilter, setQuickFilter\][\s\S]*?;/;
const matchState = content.match(regexState);
if (matchState) {
  const replacementState = matchState[0] + '\n  const [selectedTagFilter, setSelectedTagFilter] = useState<string | null>(null);';
  fs.writeFileSync('src/components/Admin/ClientsTab.tsx', content.replace(regexState, replacementState));
}

const content2 = fs.readFileSync('src/components/Admin/ClientsTab.tsx', 'utf-8');
const regexFilter = /if \(quickFilter === "Aniversariantes"\) {/;
const matchFilter = content2.match(regexFilter);
if (matchFilter) {
  const replacementFilter = `if (selectedTagFilter && !c.tags?.some(t => t.name === selectedTagFilter && t.active)) return false;\n\n        if (quickFilter === "Aniversariantes") {`;
  fs.writeFileSync('src/components/Admin/ClientsTab.tsx', content2.replace(regexFilter, replacementFilter));
}
