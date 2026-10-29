import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const js = readFileSync(new URL('../app.js', import.meta.url), 'utf8');
const headers = readFileSync(new URL('../_headers', import.meta.url), 'utf8');

execFileSync(process.execPath, ['--check', new URL('../app.js', import.meta.url).pathname]);
assert.equal((html.match(/<section class="step(?: on)?" data-s="\d"/g) || []).length, 4);
for (const id of ['types','whos','pays','lost','amts','gave','d1c','d2c','make','result','sum','sharebtn','after-results','legal-notice']) {
  assert.match(html + js, new RegExp('(id="' + id + '"|id=' + id + '|\\$\\("' + id + '"\\))'), id);
}
assert.match(html, /<div id="after-results"[^>]*hidden>/);
assert.match(html, /<footer id="legal-notice"[^>]*hidden>/);
assert.match(js, /\$\("after-results"\)\.hidden=false/);
assert.match(js, /\$\("after-results"\)\.hidden=true/);
assert.match(js, /\$\("legal-notice"\)\.hidden=false/);
assert.match(js, /\$\("legal-notice"\)\.hidden=true/);
assert.match(js, /function build\(\)/);
assert.match(js, /const FTC="https:\/\/reportfraud\.ftc\.gov\//);
assert.match(js, /function dl\(\)/);
assert.match(js, /function copyIt\(/);
assert.equal((html.match(/https:\/\/buymeacoffee\.com\/divclass016/g) || []).length, 2);
assert.match(html, /class="toolbar-support noprint" href="https:\/\/buymeacoffee\.com/);
const after = html.indexOf('id="after-results"');
const share = html.indexOf('<h2>Share this helper');
const learn = html.indexOf('<h2>Learn to spot scams');
const donate = html.indexOf('<h2>Help keep this free (optional)');
assert.ok(after > html.indexOf('<section id="result"'));
assert.ok(share > after && learn > share && donate > learn);
assert.ok(html.indexOf('Tip $1') < 0 && html.indexOf('Tip $2') < 0 && html.indexOf('Tip $5') < 0);
assert.match(headers, /Content-Security-Policy/);
assert.match(headers, /form-action 'none'/);
console.log('PASS: 4-step form, results-only extras, official links, sharing, privacy, and no duplicate tip choices');