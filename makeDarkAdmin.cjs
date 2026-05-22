const fs = require('fs');
const path = require('path');

function replaceFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let newContent = content
    .replace(/bg-white/g, 'bg-[#140b0e]')
    .replace(/bg-\[\#FDFBF9\]/g, 'bg-[#0b0507]')
    .replace(/bg-\[\#FAF9F6\]/g, 'bg-[#0b0507]')
    .replace(/border-\[\#F0E6D2\]/g, 'border-rose-900\/30')
    .replace(/text-\[\#4A4444\]/g, 'text-rose-100')
    .replace(/text-\[\#A09898\]/g, 'text-rose-300')
    .replace(/text-\[\#D1CACA\]/g, 'text-rose-400')
    .replace(/text-\[\#D48C8C\]/g, 'text-[#C5A059]') /* Swap some pink to gold if preferred, or keep */
    .replace(/border-\[\#D48C8C\]/g, 'border-[#C5A059]')
    .replace(/bg-\[\#D48C8C\]/g, 'bg-[#C5A059]')
    .replace(/bg-slate-50\b/g, 'bg-[#1f0e16]')
    .replace(/bg-slate-100\b/g, 'bg-[#2b141e]')
    .replace(/bg-slate-200\b/g, 'bg-[#3e1b29]')
    .replace(/bg-gray-50\b/g, 'bg-[#1f0e16]')
    .replace(/bg-gray-100\b/g, 'bg-[#2b141e]')
    .replace(/bg-gray-200\b/g, 'bg-[#3e1b29]')
    .replace(/border-slate-100\b/g, 'border-rose-900\/30')
    .replace(/border-slate-200\b/g, 'border-rose-900\/50')
    .replace(/border-gray-100\b/g, 'border-rose-900\/30')
    .replace(/border-gray-200\b/g, 'border-rose-900\/50')
    .replace(/text-slate-900\b/g, 'text-rose-50')
    .replace(/text-black\b/g, 'text-rose-50')
    .replace(/rgba\(240,230,210,/g, 'rgba(0,0,0,')
    .replace(/bg-rose-50\b/g, 'bg-[#1f0e16]')
    .replace(/bg-rose-100\b/g, 'bg-[#2b141e]')
    .replace(/border-rose-100\b/g, 'border-[#3e1b29]')
    .replace(/bg-amber-50\b/g, 'bg-amber-950\/30')
    .replace(/bg-emerald-50\b/g, 'bg-emerald-950\/30')
    .replace(/text-slate-400\b/g, 'text-rose-300')
    .replace(/text-gray-400\b/g, 'text-rose-300')
    .replace(/text-gray-300\b/g, 'text-rose-400');
  
  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent);
    console.log('Updated ' + filePath);
  }
}

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      replaceFile(fullPath);
    }
  }
}

processDir('src/components/Admin');
replaceFile('src/components/AdminDashboard.tsx');

console.log("Done");
