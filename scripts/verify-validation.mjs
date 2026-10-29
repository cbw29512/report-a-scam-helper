import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

// Run the actual app.js in a minimal DOM test double. No npm packages or network.
const source=readFileSync(new URL('../app.js',import.meta.url),'utf8');
const nodes=new Map(), clickListeners={};
const fakeNode=id=>{
 if(nodes.has(id))return nodes.get(id);
 const classes=new Set(id==='step-1'?['step','on']:id.startsWith('step-')?['step']:id==='result'?['step']:[]);
 const node={
  id,value:'',textContent:'',innerHTML:'',hidden:id.startsWith('error-'),attributes:new Map(),listeners:{},focusCount:0,scrollCount:0,
  dataset:id.startsWith('step-')?{s:id.slice(5)}:{},
  classList:{
   add:x=>classes.add(x),remove:x=>classes.delete(x),
   contains:x=>classes.has(x),
   toggle:(x,force)=>{
    if(force===undefined)force=!classes.has(x);
    if(force)classes.add(x);else classes.delete(x);
    return force;
   }
  },
  focus(){this.focusCount++;},scrollIntoView(){this.scrollCount++;},
  addEventListener(event,callback){this.listeners[event]=callback;},
  setAttribute(name,value){this.attributes.set(name,value);},getAttribute(name){return this.attributes.get(name);},
  querySelectorAll(){return [];}
 };
 nodes.set(id,node);return node;
};
const steps=[1,2,3,4].map(n=>fakeNode('step-'+n)).concat(fakeNode('result'));
const document={
 getElementById:fakeNode,
 querySelectorAll(selector){if(selector==='.step')return steps;if(selector==='.chip')return [];return [];},
 querySelector(selector){
  if(selector==='.step.on')return steps.find(n=>n.classList.contains('on'))||null;
  if(selector.startsWith('.step[data-s='))return {focus(){},tabIndex:0};
  return null;
 },
 addEventListener(event,callback){clickListeners[event]=callback;},
 createElement:fakeNode,
 body:{appendChild(){}}
};
const context=vm.createContext({document,window:{scrollTo(){},print(){}},location:{reload(){}},navigator:{},console,setTimeout,clearTimeout,URL,Blob});
vm.runInContext(source,context,{filename:'app.js'});
const invoke=script=>vm.runInContext(script,context);
const active=()=>steps.find(x=>x.classList.contains('on'))?.id;
const err=n=>fakeNode('error-'+n);
const clickChip=(k,v)=>{
 const chip={dataset:{k,v}};
 clickListeners.click({target:{id:'',closest:selector=>selector==='.chip'?chip:null}});
};
const clickMake=()=>clickListeners.click({target:{id:'make',closest:()=>null}});

// No one may reach step 2, or generate a report, when nothing was answered.
assert.equal(invoke('S.lost.length'),0,'Money loss must not be prefilled');
invoke('go(2)');
assert.equal(active(),'step-1');
assert.equal(err(1).hidden,false);
assert.match(err(1).textContent,/Choose at least one/);
assert.equal(fakeNode('types').classList.contains('needs-answer'),true,'Missing scam type highlighted');
assert.equal(fakeNode('types').getAttribute('aria-invalid'),'true','Invalid accessible state set');
assert.ok(fakeNode('types').focusCount>0,'Missing field receives focus');
assert.ok(fakeNode('types').scrollCount>0,'Missing field scrolled into view');
clickMake();
assert.equal(active(),'step-1');
assert.equal(fakeNode('result').innerHTML,'');
assert.equal(fakeNode('after-results').hidden,true);

// Real choice event clears error. Step 2 cannot be skipped.
clickChip('type','text');
assert.equal(err(1).hidden,true);
assert.equal(fakeNode('types').classList.contains('needs-answer'),false,'Highlight clears after selecting a type');
assert.equal(fakeNode('types').getAttribute('aria-invalid'),'false');
invoke('go(2)');
assert.equal(active(),'step-2');
invoke('go(3)');
assert.equal(active(),'step-2');
assert.match(err(2).textContent,/did not pay/);
assert.equal(fakeNode('pays').classList.contains('needs-answer'),true);
assert.ok(fakeNode('pays').focusCount>0);

// Explicit no-payment selection counts; money-loss answer does not default.
clickChip('pay','none');
assert.equal(fakeNode('pays').classList.contains('needs-answer'),false,'No payment is a valid answer');
invoke('go(3)');
assert.equal(active(),'step-3');
invoke('go(4)');
assert.equal(active(),'step-3');
assert.match(err(3).textContent,/Yes or No/);
assert.equal(fakeNode('lost').classList.contains('needs-answer'),true);
clickChip('lost','no');
assert.equal(fakeNode('lost').classList.contains('needs-answer'),false);
invoke('go(4)');
assert.equal(active(),'step-4');

// Both timeline answers are required, but users can choose Not sure.
clickMake();
assert.equal(active(),'step-4');
assert.match(err(4).textContent,/scam started/);
assert.equal(fakeNode('d1c').classList.contains('needs-answer'),true);
assert.equal(fakeNode('d2c').classList.contains('needs-answer'),true,'Highlight both unanswered date groups');
clickChip('d1','earlier');
assert.equal(fakeNode('d1c').classList.contains('needs-answer'),false);
assert.equal(fakeNode('d1').classList.contains('needs-answer'),true,'Highlight missing earlier-date input');
assert.equal(fakeNode('d2c').classList.contains('needs-answer'),true);
clickMake();
assert.match(err(4).textContent,/Pick a start date/);
fakeNode('d1').value='2026-10-01';
fakeNode('d1').listeners.change();
assert.equal(fakeNode('d1').classList.contains('needs-answer'),false,'Date input highlight clears on change');
clickChip('d2','earlier');
clickMake();
assert.match(err(4).textContent,/last contact/);
assert.equal(fakeNode('d2').classList.contains('needs-answer'),true,'The missing last-contact date is highlighted');
fakeNode('d2').value='2026-10-02';
fakeNode('d2').listeners.change();
assert.equal(fakeNode('d2').classList.contains('needs-answer'),false);
clickMake();
assert.equal(active(),'result');
assert.equal(fakeNode('after-results').hidden,false);
assert.match(fakeNode('result').innerHTML,/SCAM REPORT SUMMARY/);
assert.match(fakeNode('result').innerHTML,/A text message/);
assert.match(fakeNode('result').innerHTML,/No money lost/);

// Results cannot be regenerated if a required answer is later missing.
invoke('S.d1=[]');
clickMake();
assert.equal(active(),'step-4');
assert.equal(fakeNode('after-results').hidden,true);
assert.match(err(4).textContent,/scam started/);
assert.equal(fakeNode('d1c').classList.contains('needs-answer'),true);
clickChip('d1','unsure');
clickChip('d2','unsure');
clickMake();
assert.equal(active(),'result');
assert.equal(fakeNode('after-results').hidden,false);

// Going back to edit must hide the final action prompts again.
invoke('go(4)');
assert.equal(active(),'step-4');
assert.equal(fakeNode('after-results').hidden,true);

// Accuracy regression matrix: each report must reflect the answers actually chosen.
const prepare=(type='text',who=[],gave=[],lost='no',pay='none')=>{
  invoke('S.type='+JSON.stringify([type])+'; S.who='+JSON.stringify(who)+'; S.gave='+JSON.stringify(gave)+'; S.lost='+JSON.stringify([lost])+'; S.pay='+JSON.stringify([pay])+'; S.d1=["unsure"]; S.d2=["unsure"]; S.amt=[]');
  fakeNode('amt').value='';fakeNode('d1').value='';fakeNode('d2').value='';
};
const report=()=>{clickMake();assert.equal(active(),'result');return fakeNode('result').innerHTML;};
prepare('gov',['govt']);
let output=report();
assert.doesNotMatch(output,/Report Social Security impersonation to SSA/,'Generic government scam must not refer to SSA');
assert.doesNotMatch(output,/Report an IRS or Treasury impersonation to TIGTA/,'Generic scam must not refer to TIGTA');
assert.match(output,/Information I gave them: Not specified/,'Skipped data sharing is unknown, not None');
prepare('gov',['ssa']);
output=report();
assert.match(output,/Report Social Security impersonation to SSA/);
assert.doesNotMatch(output,/Report an IRS or Treasury impersonation to TIGTA/);
prepare('gov',['irs']);
output=report();
assert.match(output,/Report an IRS or Treasury impersonation to TIGTA/);
assert.doesNotMatch(output,/Report Social Security impersonation to SSA/);
prepare('tech',[],[]);
output=report();
assert.doesNotMatch(output,/Change the password of the exposed account/,'Tech scams alone do not establish credential exposure');
prepare('text',[],['none']);
output=report();
assert.match(output,/Information I gave them: I did not share information/,'Explicit no sharing is recorded');
assert.doesNotMatch(output,/Consider a free credit freeze/);
prepare('shop',[],[],'yes','gift');
output=report();
assert.doesNotMatch(output,/Consider a free credit freeze/,'Gift-card losses alone do not require a credit freeze');
assert.doesNotMatch(output,/Report online or cyber-enabled crime to the FBI’s IC3/,'Do not assert online scam when input is not cyber-enabled');
prepare('other',[],['ssn']);
output=report();
assert.match(output,/Consider a free credit freeze/,'SSN exposure warrants credit freeze information');
prepare('tech',[],['remote']);
output=report();
assert.match(output,/run a malware scan/,'Remote access needs device-specific advice');
prepare('other',[],[],'yes','none');
fakeNode('amt').value='1..2';
clickMake();
assert.equal(active(),'step-3','Invalid currency must not generate a report');
assert.match(err(3).textContent,/valid dollar amount/);
fakeNode('amt').value='$1,500.25';
fakeNode('amt').listeners.input();
assert.equal(fakeNode('amt').classList.contains('needs-answer'),false);
output=report();
assert.match(output,/\$1,500\.25/);
assert.doesNotMatch(output,/\$NaN/);
prepare();
invoke('S.d1=["earlier"]');
fakeNode('d1').value='2050-01-01';
clickMake();
assert.equal(active(),'step-4');
assert.match(err(4).textContent,/future/);
prepare();
invoke('S.d1=["earlier"];S.d2=["earlier"]');
fakeNode('d1').value='2026-09-03';
fakeNode('d2').value='2026-09-02';
clickMake();
assert.equal(active(),'step-4');
assert.match(err(4).textContent,/before the scam started/);
console.log('PASS: agency routing, optional disclosures, conditional recovery, currency/date integrity');

console.log('PASS: empty Next/report blocked; required steps validated; dates; Not sure; complete results; edit flow');
