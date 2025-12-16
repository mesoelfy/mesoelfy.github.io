const fs = require('fs');
const path = require('path');

// Target the entire src directory
const TARGET_DIR = path.join(__dirname, '../src');

function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);
  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function(file) {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else {
      if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js')) {
        arrayOfFiles.push(fullPath);
      }
    }
  });

  return arrayOfFiles;
}

const files = getAllFiles(TARGET_DIR);
let fixedCount = 0;

console.log(`Scanning ${files.length} files...`);

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // 1. ENGINE -> CORE
  // Matches: from '@/engine/...' or from "@/engine/..."
  content = content.replace(/from (['"])@\/engine\//g, "from $1@/core/");
  content = content.replace(/import\((['"])@\/engine\//g, "import($1@/core/");

  // 2. SYS -> GAME
  // Matches: from '@/sys/...' or from "@/sys/..."
  content = content.replace(/from (['"])@\/sys\//g, "from $1@/game/");
  content = content.replace(/import\((['"])@\/sys\//g, "import($1@/game/");

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    fixedCount++;
    console.log(`Fixed imports in: ${path.basename(file)}`);
  }
});

console.log(`\n// REPAIR COMPLETE. ${fixedCount} files patched.`);
