// Reads the newest figma_execute tool-result file and writes the decoded image to a given dest.
// Usage: node tmp_extract.js <destPath> [expectedHash]
const fs = require('fs');
const path = require('path');
const dir = 'C:/Users/Seri/.claude/projects/c--Users-Seri-Desktop-nesilcoffee/e51b40a9-c9e9-401d-9186-966f3aae5615/tool-results';
const dest = process.argv[2];
const expectedHash = process.argv[3];
if (!dest) { console.error('dest required'); process.exit(1); }
const entries = fs.readdirSync(dir).map(f => {
  const p = path.join(dir, f);
  const st = fs.statSync(p);
  return { f, p, m: st.mtimeMs };
}).sort((a,b) => b.m - a.m);
if (!entries.length) { console.error('no result file'); process.exit(1); }
// Try the newest, then next-newest as fallback.
let picked = null;
let result = null;
for (const e of entries.slice(0, 6)) {
  try {
    const raw = fs.readFileSync(e.p, 'utf8');
    let j;
    try { j = JSON.parse(raw); } catch (_) { continue; }
    // Case A: array-of-content-blocks (toolu_*.json) — parse inner text
    if (Array.isArray(j)) {
      const textBlock = j.find(x => x && x.type === 'text' && typeof x.text === 'string');
      if (!textBlock) continue;
      try {
        const inner = JSON.parse(textBlock.text);
        if (inner && inner.result && inner.result.b64) {
          picked = e; result = inner.result; break;
        }
      } catch (_) { continue; }
    } else if (j && j.result && j.result.b64) {
      picked = e; result = j.result; break;
    } else if (j && j.b64) {
      picked = e; result = j; break;
    }
  } catch (_) { continue; }
}
if (!result) { console.error('could not locate b64 result in recent files'); process.exit(3); }
if (result.error) { console.error('figma error:', result.error); process.exit(2); }
if (expectedHash && result.hash !== expectedHash) {
  console.error('HASH MISMATCH: expected', expectedHash, 'got', result.hash, 'from', picked.f);
  process.exit(4);
}
const buf = Buffer.from(result.b64, 'base64');
fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.writeFileSync(dest, buf);
console.log(JSON.stringify({ hash: result.hash, sig: result.sig, byteLen: result.byteLen, wrote: buf.length, dest, src: picked.f }));
