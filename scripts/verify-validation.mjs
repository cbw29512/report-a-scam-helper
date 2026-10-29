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
console.log('PASS: empty Next/report blocked; required steps validated; dates; Not sure; complete results; edit flow');
