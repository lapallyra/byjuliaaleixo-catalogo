const fs = require('fs');
const content = fs.readFileSync('src/components/Admin/ClientsTab.tsx', 'utf-8');
const lines = content.split('\n');

// Find start and end of birthdayCustomers
const bcStart = lines.findIndex(l => l.includes('const birthdayCustomers = useMemo(() => {'));
let bcEnd = bcStart;
while (!lines[bcEnd].includes('}, [customers]);')) {
  bcEnd++;
}

// Find start and end of customerMetricsMap
const cmStart = lines.findIndex(l => l.includes('const customerMetricsMap = useMemo(() => {'));
let cmEnd = cmStart;
while (!lines[cmEnd].includes('}, [customers, sales]);')) {
  cmEnd++;
}

// Ensure they are sequentially contiguous or independent
const blocksToMove = [];
for (let i = bcStart; i <= cmEnd; i++) {
  blocksToMove.push(lines[i]);
}

const remainingLines = [];
for (let i = 0; i < lines.length; i++) {
  if (i >= bcStart && i <= cmEnd) continue;
  remainingLines.push(lines[i]);
}

const preprocessedStart = remainingLines.findIndex(l => l.includes('const preprocessedCustomers = useMemo(() => {'));

remainingLines.splice(preprocessedStart, 0, ...blocksToMove);

fs.writeFileSync('src/components/Admin/ClientsTab.tsx', remainingLines.join('\n'));
