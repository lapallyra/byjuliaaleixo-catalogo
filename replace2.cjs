const fs = require('fs');

const files = [
  'src/components/Admin/ActivityLogTab.tsx',
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
    content = content.replace(/#C6A664/g, '#1C1C1E');
    content = content.replace(/#E8DCC8/g, '#E5E5EA');
    content = content.replace(/bg-pink-50/g, 'bg-[#F5F5F7]');
    content = content.replace(/border-pink-100/g, 'border-[#E5E5EA]');
    content = content.replace(/text-pink-700/g, 'text-[#1C1C1E]');
    
    // Change some typography
    content = content.replace(/font-black/g, 'font-medium');
    content = content.replace(/font-extrabold/g, 'font-semibold');
    content = content.replace(/rounded-3xl/g, 'rounded-2xl');
    content = content.replace(/uppercase tracking-widest/g, 'tracking-normal');
    
    fs.writeFileSync(file, content);
  }
});
