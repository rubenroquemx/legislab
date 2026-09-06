const fs = require('fs');
const path = require('path');
const target = process.argv[2];
let buf = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', c => buf += c);
process.stdin.on('end', () => {
  const p = path.resolve(target);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, Buffer.from(buf.trim(), 'base64').toString('utf8'), 'utf8');
  console.log('Written:', target);
});
