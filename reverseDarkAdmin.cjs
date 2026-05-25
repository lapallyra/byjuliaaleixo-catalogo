const fs = require('fs');
const path = require('path');

function replaceFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let newContent = content
    .replace(/bg-\[\#140b0e\]/g, 'bg-white')
    .replace(/bg-\[\#0b0507\]/g, 'bg-[#FAF9F6]')
    .replace(/border-rose-900\/30/g, 'border-[#F0E6D2]')
    .replace(/text-rose-100/g, 'text-[#4A4444]')
    .replace(/text-rose-300/g, 'text-[#A09898]')
    .replace(/text-rose-400/g, 'text-[#D1CACA]')
    .replace(/text-\[\#C5A059\]/g, 'text-[#D48C8C]')
    .replace(/border-\[\#C5A059\]/g, 'border-[#D48C8C]')
    .replace(/bg-\[\#C5A059\]/g, 'bg-[#D48C8C]')
    .replace(/bg-\[\#1f0e16\]/g, 'bg-slate-50')
    .replace(/bg-\[\#2b141e\]/g, 'bg-slate-100')
    .replace(/bg-\[\#3e1b29\]/g, 'bg-slate-200')
    .replace(/border-rose-900\/50/g, 'border-slate-200')
    .replace(/text-rose-50/g, 'text-slate-900') 
    .replace(/rgba\(0,0,0,/g, 'rgba(240,230,210,')
    .replace(/bg-amber-950\/30/g, 'bg-amber-50')
    .replace(/bg-emerald-950\/30/g, 'bg-emerald-50')
    .replace(/border-\[\#3e1b29\]/g, 'border-rose-100');

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
