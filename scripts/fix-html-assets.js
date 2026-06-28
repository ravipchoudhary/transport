const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const files = fs.readdirSync(root).filter((f) => f.endsWith('.html'));
let updated = 0;
const replacements = [
  [/href="index\.css"/g, 'href="/index.css"'],
  [/href="dashboard\.css"/g, 'href="/dashboard.css"'],
  [/href="booking\.css"/g, 'href="/booking.css"'],
  [/href="fleet\.css"/g, 'href="/fleet.css"'],
  [/href="tools\.css"/g, 'href="/tools.css"'],
  [/href="([^\/]assets\/[^"]*)"/g, 'href="/$1"'],
  [/src="([^\/]assets\/[^"]*)"/g, 'src="/$1"'],
  [/src="dashboard\.js"/g, 'src="/dashboard.js"'],
  [/src="booking\.js"/g, 'src="/booking.js"'],
  [/src="tools\.js"/g, 'src="/tools.js"'],
  [/src="index\.js"/g, 'src="/index.js"'],
  [/href="login\.html"/g, 'href="/login.html"'],
  [/href="register\.html"/g, 'href="/register.html"'],
  [/href="(booking|fleet|services|tools)\.html"/g, 'href="/$1.html"']
];

files.forEach((file) => {
  const filePath = path.join(root, file);
  let txt = fs.readFileSync(filePath, 'utf8');
  const original = txt;
  if (!txt.includes('<base href="/">')) {
    txt = txt.replace(/(<\/title>)/i, '$1\n  <base href="/">');
  }
  replacements.forEach(([regex, replacement]) => {
    txt = txt.replace(regex, replacement);
  });
  if (txt !== original) {
    fs.writeFileSync(filePath, txt, 'utf8');
    updated += 1;
  }
});
console.log(`Updated ${updated} HTML files`);
