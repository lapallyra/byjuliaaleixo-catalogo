const fs = require('fs');
const path = require('path');

function getRecentFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const stat = fs.statSync(path.join(dir, file));
    if (stat.isDirectory()) {
      getRecentFiles(path.join(dir, file), fileList);
    } else {
      fileList.push({ file: path.join(dir, file), mtime: stat.mtime });
    }
  }
  return fileList;
}

const recent = getRecentFiles('./src')
  .sort((a, b) => b.mtime - a.mtime)
  .slice(0, 10);

console.log(recent.map(f => `${f.file} - ${f.mtime}`).join('\n'));
