const fs = require('fs');
const path = require('path');

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

const root = process.cwd();
const src = path.join(root, 'assets');
const dest = path.join(root, 'public', 'assets');

try {
  copyRecursive(src, dest);
  console.log(`Copied assets from ${src} → ${dest}`);
} catch (err) {
  console.error('Failed to copy assets:', err);
  process.exit(1);
}
