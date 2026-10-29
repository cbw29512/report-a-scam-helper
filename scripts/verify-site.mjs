import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const js = readFileSync(new URL('../app.js', import.meta.url), 'utf8');
const headers = readFileSync(new URL('../_headers', import.meta.url), 'utf8');

execFileSync(process.execPath, ['--check', new URL('../app.js', import.meta.url).pathname]);
assert.equal((html.match(/<section class="step(?: on)?" data-s="\d"/g) || []).length, 4);
const firstStep = html.indexOf('<section class="step on" data-s="1"');
const firstStepEnd = html.indexOf('</section>', firstStep);
const welcome = html.indexOf('class="welcome"');
assert.ok(welcome > firstStep && welcome < firstStepEnd, 'Purpose statement appears on initial step only');
assert.ok(welcome < html.indexOf('Step 1 of 4'), 'Explain the tool before the visitor starts');
assert.match(html, /Think you’ve been scammed\? Start here\./);
assert.match(html, /links to official reporting websites/);
assert.match(html, /this site does not submit them for you/);
assert.equal((html.match(/class="welcome"/g) || []).length, 1, 'No repeat introduction during other steps');

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
for (let n=1;n<=4;n++) assert.match(html,new RegExp('id="error-'+n+'"[^>]*role="alert"'), 'Accessible error for step '+n);
assert.match(js,/lost:\[\]/,'Money loss must not silently default to No');
assert.match(js,/\["unsure","Not sure"\]/,'Unknown date is an explicit choice');
assert.match(js,/function stepError\(n\)/);
assert.match(js,/function showValidation\(n\)/);
assert.match(html,/\.chips\.needs-answer,input\.needs-answer/,'Missing-answer outline styles exist');
assert.match(js,/function missingFields\(n\)/,'Unanswered fields are located explicitly');
assert.match(js,/function highlightMissing\(n\)/,'Unanswered fields are highlighted');
assert.match(js,/field\.classList\.toggle\("needs-answer",invalid\)/);
assert.match(js,/field\.scrollIntoView\?\./,'Focus brings missing answer into view');
for(const [question,error] of [['id="types"','id="error-1"'],['id="pays"','id="error-2"'],['id="lost"','id="error-3"'],['id="h4s"','id="error-4"']]){
 const q=html.indexOf(question),e=html.indexOf(error);
 assert.ok(q>=0&&e>q&&e-q<500,'Error appears next to '+question);
}

assert.match(js,/function go\(n\)/);
assert.match(js,/if\(stepError\(step\)\)\{showStep\(step\);showValidation\(step\);return;\}/,'Both Next and report generation must block missing answers');

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
const privacy = html.indexOf('aria-label="Privacy notice"');
const mainEnd = html.indexOf('</main>');
assert.ok(privacy > donate && privacy < mainEnd, 'Privacy notice must be at the bottom of the page, after the form and optional resources');
assert.equal((html.match(/Private by design\./g) || []).length, 1, 'Privacy disclosure must appear only once');
assert.ok(html.indexOf('Private by design.') > html.indexOf('<section id="result"'), 'Privacy should not interrupt the form');
assert.ok(html.indexOf('Tip $1') < 0 && html.indexOf('Tip $2') < 0 && html.indexOf('Tip $5') < 0);
assert.match(headers, /Content-Security-Policy/);
assert.match(headers, /form-action 'none'/);
assert.doesNotMatch(html, /name="robots" content="noindex"/,'Public homepage should not silently opt out of search');
assert.doesNotMatch(headers, /X-Robots-Tag:\s*noindex/,'Production headers should not block indexing');
assert.match(html, /rel="canonical" href="https:\/\/report-a-scam-helper\.netlify\.app\//);
assert.match(html, /Anonymous visit counts are collected using GoatCounter/,'Privacy statement must disclose analytics');
assert.match(js, /if\(S\.who\.includes\("ssa"\)\)/,'SSA reports only for SSA impersonation');
assert.match(js, /if\(S\.who\.includes\("irs"\)\)/,'IRS reports only for IRS impersonation');
assert.match(js, /const exposed=g\.some\(value=>value!=="none"\)/);
assert.match(js, /Information I gave them:.*Not specified/,'Unknown disclosure cannot be called none');
assert.match(js, /function validAmount\(value\)/);
assert.match(js, /function futureDate\(value\)/);

console.log('PASS: 4-step form, results-only extras, official links, sharing, privacy, and no duplicate tip choices');