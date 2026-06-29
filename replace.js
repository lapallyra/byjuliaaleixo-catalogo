const fs = require('fs');

const files = [
  'src/components/Admin/DashboardTab.tsx',
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // Replace warm colors with Quiet Luxury palette
  content = content.replace(/#F0E6D2/g, '#E5E5EA');
  content = content.replace(/#FAF9F6/g, '#F5F5F7');
  content = content.replace(/#D88D85/g, '#1C1C1E'); // Primary icon color -> black
  content = content.replace(/#A09088/g, '#8E8E93'); // Subtitle color
  content = content.replace(/#4A3A34/g, '#1C1C1E'); // Title color
  content = content.replace(/#A09898/g, '#8E8E93'); // Light text
  content = content.replace(/#7A6A62/g, '#8E8E93'); // Light text
  content = content.replace(/#FFFDFB/g, '#FFFFFF'); 
  content = content.replace(/#5F524C/g, '#8E8E93'); 
  content = content.replace(/#2D221F/g, '#1C1C1E'); 
  content = content.replace(/bg-pink-50/g, 'bg-[#F5F5F7]');
  content = content.replace(/border-pink-100/g, 'border-[#E5E5EA]');
  content = content.replace(/text-pink-700/g, 'text-[#1C1C1E]');
  content = content.replace(/from-pink-400 via-rose-300 to-\[#1C1C1E\]/g, 'from-[#1C1C1E] via-[#555] to-[#1C1C1E]');
  content = content.replace(/text-\[10px\] font-black uppercase/g, 'text-xs font-medium');
  content = content.replace(/text-\[9px\]/g, 'text-[10px]');
  content = content.replace(/text-\[11px\] font-black/g, 'text-sm font-semibold');
  content = content.replace(/text-\[8px\] font-black/g, 'text-[10px] font-medium');
  content = content.replace(/text-2xl font-black text-slate-800 tracking-tighter/g, 'text-2xl font-semibold text-[#1C1C1E] tracking-tight');

  fs.writeFileSync(file, content);
});
