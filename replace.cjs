const fs = require('fs');

const files = [
  'src/components/Admin/DashboardTab.tsx',
  'src/components/Admin/AuditoriaTab.tsx',
  'src/components/Admin/OrdersTab.tsx',
  'src/components/Admin/ProductsTab.tsx',
  'src/components/Admin/InventoryTab.tsx',
  'src/components/Admin/FinanceTab.tsx',
  'src/components/Admin/ReportsTab.tsx',
  'src/components/Admin/ClientsTab.tsx',
  'src/components/Admin/SettingsTab.tsx',
  'src/components/Admin/KitsTab.tsx',
  'src/components/Admin/CommemorativeDatesTab.tsx',
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Replace warm colors with Quiet Luxury palette
    content = content.replace(/#F0E6D2/g, '#E5E5EA');
    content = content.replace(/#FAF9F6/g, '#F5F5F7');
    content = content.replace(/#D88D85/g, '#1C1C1E'); 
    content = content.replace(/#A09088/g, '#8E8E93'); 
    content = content.replace(/#4A3A34/g, '#1C1C1E'); 
    content = content.replace(/#A09898/g, '#8E8E93'); 
    content = content.replace(/#7A6A62/g, '#8E8E93'); 
    content = content.replace(/#FFFDFB/g, '#FFFFFF'); 
    content = content.replace(/#5F524C/g, '#8E8E93'); 
    content = content.replace(/#2D221F/g, '#1C1C1E');
    content = content.replace(/#4A4444/g, '#1C1C1E');
    content = content.replace(/#D1CACA/g, '#D1D1D6');
    content = content.replace(/bg-pink-50/g, 'bg-[#F5F5F7]');
    content = content.replace(/border-pink-100/g, 'border-[#E5E5EA]');
    content = content.replace(/text-pink-700/g, 'text-[#1C1C1E]');
    content = content.replace(/from-pink-400 via-rose-300 to-\[#1C1C1E\]/g, 'from-[#1C1C1E] via-[#555] to-[#1C1C1E]');
    
    // Change some typography
    content = content.replace(/font-black/g, 'font-medium');
    content = content.replace(/font-extrabold/g, 'font-semibold');
    content = content.replace(/rounded-3xl/g, 'rounded-2xl');
    content = content.replace(/rounded-\[2rem\]/g, 'rounded-2xl');
    content = content.replace(/rounded-\[3rem\]/g, 'rounded-2xl');
    content = content.replace(/rounded-\[2\.5rem\]/g, 'rounded-2xl');
    content = content.replace(/uppercase tracking-\[0\.2em\]/g, 'tracking-tight');
    content = content.replace(/uppercase tracking-widest/g, 'tracking-normal');
    
    fs.writeFileSync(file, content);
  }
});
