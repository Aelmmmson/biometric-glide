const fs = require('fs');
const lines = fs.readFileSync('src/pages/StandaloneSetup.tsx', 'utf8').split('\n');
let depth = 0;
const results = [];
for (let i = 0; i < lines.length; i++) {
  const l = lines[i];
  const opens = (l.match(/<div[\s>]/g) || []).length - (l.match(/<div[^>]*\/>/g) || []).length;
  const closes = (l.match(/<\/div>/g) || []).length;
  if (opens || closes) {
    depth += opens - closes;
    results.push({ line: i + 1, depth, opens, closes, text: l.trim().substring(0, 90) });
  }
}
// Show last 40 entries
results.slice(-40).forEach(r => {
  console.log('L' + r.line + ' d=' + r.depth + ' +' + r.opens + '/-' + r.closes + ': ' + r.text);
});
console.log('\nFinal depth:', depth);
