const fs = require('fs');

const content = fs.readFileSync('src/components/Admin/ProductsTab.tsx', 'utf8');
const lines = content.split('\n');

const startIdx = lines.findIndex(l => l.includes('export const ProductsTab: React.FC<ProductsTabProps> ='));
const endIdx = lines.findIndex(l => l.includes('interface ProductFormModalProps {'));

if (startIdx !== -1 && endIdx !== -1) {
  console.log("Found boundaries: ", startIdx, endIdx);
} else {
  console.log("Boundaries not found.", startIdx, endIdx);
}
