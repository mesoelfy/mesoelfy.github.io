const fs = require('fs');
const path = require('path');

const TARGET_DIR = path.join(__dirname, '../src');

function getAllFiles(dirPath, arrayOfFiles) {
  files = fs.readdirSync(dirPath);
  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function(file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
    } else {
      if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js')) {
        arrayOfFiles.push(path.join(dirPath, "/", file));
      }
    }
  });

  return arrayOfFiles;
}

const files = getAllFiles(TARGET_DIR);
let changedCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // 1. Replace @/engine with @/core
  content = content.replace(/from ['"]@\/engine\//g, "from '@/core/");
  content = content.replace(/import\(['"]@\/engine\//g, "import('@/core/");

  // 2. Replace @/sys with @/game
  content = content.replace(/from ['"]@\/sys\//g, "from '@/game/");
  content = content.replace(/import\(['"]@\/sys\//g, "import('@/game/");

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    changedCount++;
    console.log(`Updated: ${path.basename(file)}`);
  }
});

console.log(`\n// REFACTOR COMPLETE. ${changedCount} files updated.`);
