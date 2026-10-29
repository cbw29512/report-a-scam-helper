const TYPES=[["text","A text message"],["phone","A phone call or robocall"],["email","An email"],["shop","Online shopping (I paid and got nothing, or got a fake)"],["romance","Romance or dating"],["invest","Investment or cryptocurrency"],["giftscam","They asked me to pay with gift cards"],["tech","Tech support (pop-up or call about my computer)"],["gov","Someone pretending to be the government (Social Security, Internal Revenue Service, police)"],["bankimp","Someone pretending to be my bank"],["idtheft","Identity theft (someone used my information)"],["job","A job or work-from-home offer"],["other","Something else"]];
const PAYS=[["gift","Gift card"],["wire","Wire transfer (Western Union, MoneyGram, bank wire)"],["crypto","Cryptocurrency or a cryptocurrency machine"],["credit","Credit card"],["debit","Debit card"],["bank","Bank transfer"],["app","Zelle, Venmo, Cash App, or PayPal"],["cash","Cash"],["none","I did not pay"]];
const WHOS=[["amazon","Amazon or another store"],["bankco","My bank or card company"],["ssa","Social Security Administration"],["irs","Internal Revenue Service or Treasury"],["medicare","Medicare"],["govt","Another government agency (or not sure)"],["police","The police or a court"],["family","A family member or friend"],["techco","A tech company (Microsoft, Apple, Google)"],["delivery","A delivery company (Postal Service, UPS, FedEx)"],["love","Someone I met online"],["employer","An employer or recruiter"],["unknown","Not sure or someone else"]];
const LOST=[["yes","Yes, I lost money"],["no","No, I did not lose money"]];
const AMTS=[["Under $100","Under $100"],["$100 to $499","$100 to $499"],["$500 to $999","$500 to $999"],["$1,000 to $4,999","$1,000 to $4,999"],["$5,000 to $24,999","$5,000 to $24,999"],["$25,000 or more","$25,000 or more"],["Not sure","Not sure"]];
const GAVE=[["ssn","My Social Security number"],["login","A password or account login"],["remote","Access to my computer or phone"],["bank","My bank or card information"],["none","I did not share information"]];
const WHEN=[["today","Today"],["yesterday","Yesterday"],["week","This week"],["earlier","Earlier (pick a date)"],["unsure","Not sure"]];
const S={type:[],who:[],pay:[],lost:[],amt:[],gave:[],d1:[],d2:[]};
const ONE={who:1,lost:1,amt:1,d1:1,d2:1};
const $=id=>document.getElementById(id);
function chips(el,key,arr,small){$(el).innerHTML=arr.map(([v,t])=>`<button type="button" class="chip${small?" small":""}" ${ONE[key]?"data-one":""} data-k="${key}" data-v="${v}" aria-pressed="${S[key].includes(v)}">${t}</button>`).join("");}
chips("types","type",TYPES);chips("whos","who",WHOS);chips("pays","pay",PAYS);chips("lost","lost",LOST,1);chips("amts","amt",AMTS,1);chips("gave","gave",GAVE);chips("d1c","d1",WHEN,1);chips("d2c","d2",WHEN,1);
function refresh(){document.querySelectorAll(".chip").forEach(c=>c.setAttribute("aria-pressed",S[c.dataset.k].includes(c.dataset.v)));
 $("amtbox").classList.toggle("hide",S.lost[0]!="yes");$("d1box").classList.toggle("hide",S.d1[0]!="earlier");$("d2box").classList.toggle("hide",S.d2[0]!="earlier");}
document.addEventListener("click",e=>{const c=e.target.closest(".chip");if(c){const k=c.dataset.k,v=c.dataset.v,a=S[k];
 if(ONE[k])S[k]=(a[0]==v&&k!="lost")?[]:[v];
 else{const i=a.indexOf(v);if(i>=0)a.splice(i,1);else{a.push(v);if(k==="pay"||k==="gave"){if(v==="none")S[k]=["none"];else S[k]=S[k].filter(x=>x!=="none");}}}
 refresh();clearResolvedErrors();return;}
 const g=e.target.closest("[data-go]");if(g){go(+g.dataset.go);return;}
 const cp=e.target.closest("[data-copy]");if(cp){copyIt(cp.dataset.copy);return;}
 if(e.target.id=="make")build();
});
refresh();
function validAmount(value){
 const raw=value.trim();
 return !raw||/^(?:\$\s*)?(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d{1,2})?$/.test(raw);
}
function futureDate(value){
 if(!value)return false;
 const now=new Date();
 const today=[now.getFullYear(),String(now.getMonth()+1).padStart(2,"0"),String(now.getDate()).padStart(2,"0")].join("-");
 return value>today;
}
function stepError(n){
 if(n===1&&!S.type.length)return "Choose at least one answer under What happened before continuing.";
 if(n===2&&!S.pay.length)return "Choose how you paid, or select I did not pay.";
 if(n===3){
  if(!S.lost.length)return "Choose Yes or No to tell us whether you lost money.";
  if(S.lost[0]==="yes"&&!validAmount($("amt").value))return "Enter a valid dollar amount (for example 1500.50) or leave it blank.";
 }
 if(n===4){
  if(!S.d1.length)return "Choose when the scam started. You can select Not sure.";
  if(S.d1[0]==="earlier"&&!$("d1").value)return "Pick a start date, or choose Not sure.";
  if(S.d1[0]==="earlier"&&futureDate($("d1").value))return "The start date cannot be in the future.";
  if(!S.d2.length)return "Choose when the last contact or payment happened. You can select Not sure.";
  if(S.d2[0]==="earlier"&&!$("d2").value)return "Pick the date of last contact, or choose Not sure.";
  if(S.d2[0]==="earlier"&&futureDate($("d2").value))return "The last-contact date cannot be in the future.";
  if(S.d1[0]==="earlier"&&S.d2[0]==="earlier"&&$("d1").value>$("d2").value)return "The last-contact date cannot be before the scam started.";
 }
 return "";
}
// Identify every unanswered required field, not just the first validation message.
function missingFields(n){
 if(n===1)return S.type.length?[]:["types"];
 if(n===2)return S.pay.length?[]:["pays"];
 if(n===3){
  if(!S.lost.length)return ["lost"];
  if(S.lost[0]==="yes"&&!validAmount($("amt").value))return ["amt"];
  return [];
 }
 if(n===4){
  const missing=[];
  if(!S.d1.length)missing.push("d1c");
  else if(S.d1[0]==="earlier"&&(!$("d1").value||futureDate($("d1").value)))missing.push("d1");
  if(!S.d2.length)missing.push("d2c");
  else if(S.d2[0]==="earlier"&&(!$("d2").value||futureDate($("d2").value)))missing.push("d2");
  else if(S.d1[0]==="earlier"&&S.d2[0]==="earlier"&&$("d1").value>$("d2").value)missing.push("d2");
  return missing;
 }
 return [];
}
function highlightMissing(n){
 const missing=missingFields(n);
 const candidates=n===1?["types"]:n===2?["pays"]:n===3?["lost","amt"]:n===4?["d1c","d1","d2c","d2"]:[];
 candidates.forEach(id=>{
  const field=$(id),invalid=missing.includes(id);
  field.classList.toggle("needs-answer",invalid);
  field.setAttribute("aria-invalid",String(invalid));
 });
 return missing;
}
function showValidation(n){
 const message=stepError(n),error=$("error-"+n);
 error.textContent=message;error.hidden=!message;
 const missing=highlightMissing(n);
 if(message&&missing.length){
  const field=$(missing[0]);
  // Focus the unanswered question, not a distant error message or Next button.
  field.setAttribute("tabindex","-1");
  field.focus();
  field.scrollIntoView?.({block:"center"});
 }
 return !message;
}
function clearResolvedErrors(){
 for(let n=1;n<=4;n++){
  const error=$("error-"+n);
  if(!error.hidden){
   const message=stepError(n);
   error.textContent=message;error.hidden=!message;
   highlightMissing(n);
  }
 }
}
["d1","d2"].forEach(id=>$(id).addEventListener("change",clearResolvedErrors));
$("amt").addEventListener("input",clearResolvedErrors);
function showStep(n){
 $("after-results").hidden=true;$("legal-notice").hidden=true;
 document.querySelectorAll(".step").forEach(s=>s.classList.toggle("on",s.dataset.s==n));
 const h=document.querySelector(`.step[data-s="${n}"] h2`);
 if(h){h.tabIndex=-1;h.focus();}
 window.scrollTo(0,0);
}
function go(n){
 const active=document.querySelector(".step.on");
 const from=active?.dataset.s?Number(active.dataset.s):5;
 if(n>from){for(let step=from;step<n;step++){
  if(stepError(step)){showStep(step);showValidation(step);return;}
 }}
 showStep(n);
}
const lab=(a,v)=>a.filter(x=>v.includes(x[0])).map(x=>x[1]);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const L=(u,t)=>`<a href="${u}" target="_blank" rel="noopener">${t}</a>`;
const FTC="https://reportfraud.ftc.gov/",SCAMMED="https://consumer.ftc.gov/articles/what-do-if-you-were-scammed";
let summary="";
function whenTxt(k,inp){const v=S[k][0],d=new Date();const f=x=>x.toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"});
 if(v=="today")return f(d);if(v=="yesterday"){d.setDate(d.getDate()-1);return f(d);}if(v=="week")return "Within the past week";
 if(v=="earlier"){const x=$(inp).value;return x?f(new Date(x+"T12:00:00")):"Earlier (date not sure)";}return "Not sure";}
function build(){
 // Guard the result generator as well as every Next button: no direct bypass.
 for(let step=1;step<=4;step++){
  if(stepError(step)){showStep(step);showValidation(step);return;}
 }
 const t=S.type,p=S.pay.filter(x=>x!="none"),g=S.gave,lost=S.lost[0]=="yes";
 const val=id=>$(id).value.trim();
 const items=[],urgent=[];
 const T=(h,b,url,ag)=>items.push({h,b,url,ag});
 if(p.includes("credit"))T("Call your credit card company now","Use the phone number on the back of your card. Say you were scammed and ask them to reverse the charge and send a new card.");
 if(p.includes("debit")||p.includes("bank")||g.includes("bank"))T("Call your bank or credit union now","Use the phone number on the back of your card or on your bank's official app. Ask them to stop or reverse the payment and secure your account.");
 if(p.includes("app"))T("Report it inside the payment app (and to your bank for Zelle)","Ask them to reverse the payment. For Zelle, call your bank. The Federal Trade Commission explains each app here: "+L(SCAMMED,"What to do if you were scammed")+".");
 if(p.includes("wire"))T("Call the wire transfer company or your bank now","Tell them a scammer tricked you and ask for a refund. Steps: "+L(SCAMMED,"Federal Trade Commission guide")+".");
 if(p.includes("gift")||t.includes("giftscam"))T("If you gave a scammer gift-card numbers, contact the issuer","Use the issuer's official number, retain the card and receipt, and ask whether funds can be recovered. The Federal Trade Commission maintains "+L("https://consumer.ftc.gov/avoiding-reporting-gift-card-scams","a list of gift-card issuer contacts")+".");
 if(p.includes("crypto"))T("Contact the cryptocurrency exchange or machine operator","Use the official support page and ask whether your fraudulent transfer can be stopped or recovered. Crypto transactions are often irreversible. Preserve wallet addresses and transaction IDs.");
 if(p.includes("cash"))T("If you mailed cash, call the United States Postal Inspection Service","Steps and the official number are on the "+L(SCAMMED,"Federal Trade Commission page")+". For FedEx or UPS, contact them as soon as possible.");
 if(t.includes("idtheft")||g.includes("ssn"))T("Report identity theft at IdentityTheft.gov","Get a free recovery plan and an official report.","https://www.identitytheft.gov/","IdentityTheft.gov");
 T("Report it to the Federal Trade Commission","Use the official FTC form, supplying the details it requests. Your prepared summary may help, but you must submit the report yourself.",FTC,"Federal Trade Commission");
 const online=t.some(x=>["email","shop","romance","invest","tech","job","text"].includes(x))||p.includes("crypto");
 if(online)T("Report online or cyber-enabled crime to the FBI’s IC3","The FBI accepts cybercrime and internet-enabled fraud complaints. Use the official IC3 form and include relevant evidence.","https://www.ic3.gov/","FBI IC3");
 if(t.includes("text"))T("Forward the scam text to 7726","Copy the text message and send it to 7726 (it spells SPAM). This is free and helps your phone company block it. Then delete it. "+L("https://consumer.ftc.gov/articles/how-recognize-and-report-spam-text-messages","Federal Trade Commission instructions")+".");
 if(t.includes("phone")){T("Report the robocall or unwanted call to the Federal Communications Commission","Paste your report into the complaint.","https://consumercomplaints.fcc.gov/hc/en-us","Federal Communications Commission");T("Report unwanted sales calls at DoNotCall.gov","Optional, if it was a sales call.","https://www.donotcall.gov/","Do Not Call Registry");}
 if(S.who.includes("ssa"))T("Report Social Security impersonation to SSA's Inspector General","Use the official SSA OIG reporting page for a Social Security-related scam.","https://oig.ssa.gov/","SSA Inspector General");
 if(S.who.includes("irs"))T("Report an IRS or Treasury impersonation to TIGTA","Choose the IRS impersonation or tax scam category on the official TIGTA page.","https://www.tigta.gov/reportcrime-misconduct","Treasury Inspector General");
 T("Report it to your state attorney general","Pick your state from the official list, then use its complaint form.","https://www.usa.gov/state-attorney-general","State Attorney General");
 if(lost||t.includes("idtheft"))T("File a report with your local police","Call their non-emergency number or visit the station. Bring a printed copy of your report. Ask for a report number. Banks and insurers often ask for it.");
 const exposed=g.some(value=>value!=="none");
 if(lost||exposed||t.includes("idtheft")){
  if(lost)urgent.push("Contact your bank, card issuer, payment provider, or gift card issuer promptly if you sent money. Ask if the transaction can be stopped or reversed; a refund is not guaranteed.");
  urgent.push("Stop communicating with the scammer. Do not send additional payments, including so-called recovery or refund fees.");
  if(g.includes("login"))urgent.push("Change the password of the exposed account and any account reusing it. Turn on multi-factor authentication.");
  if(g.includes("remote"))urgent.push("If the scammer accessed your device, disconnect their access, update your security software, run a malware scan, and change affected passwords.");
  if(g.includes("ssn")||t.includes("idtheft")){
   urgent.push(`Consider a free credit freeze at ${L("https://www.equifax.com/personal/credit-report-services/credit-freeze/","Equifax")}, ${L("https://www.experian.com/freeze/center.html","Experian")}, and ${L("https://www.transunion.com/credit-freeze","TransUnion")}. Credit freezes help prevent new fraudulent accounts; they do not reverse payments.`);
   urgent.push(`Review your free credit reports at ${L("https://www.annualcreditreport.com/","AnnualCreditReport.com")}.`);
  }
 }

 const rawAmount=val("amt");
 const ex=rawAmount?Number(rawAmount.replace(/[\$,\s]/g,"")):null;
 const money=lost?(ex!==null&&Number.isFinite(ex)?"$"+ex.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2}):(S.amt[0]||"Yes, amount not sure")):"No money lost";
 const ids=[["Phone",val("sphone")],["Email",val("semail")],["Website or username",val("sweb")]].filter(x=>x[1]);
 summary=["SCAM REPORT SUMMARY",
 "What happened: "+(lab(TYPES,t).join("; ")||"Not specified"),
 "Who they claimed to be: "+(lab(WHOS,S.who).join("; ")||"Not specified"),
 "When it started: "+whenTxt("d1","d1"),
 "Last contact or payment: "+whenTxt("d2","d2"),
 "Money lost: "+money,
 "How I paid: "+(lab(PAYS,S.pay).join("; ")||"Not specified"),
 "Information I gave them: "+(g.length?lab(GAVE,g).join("; "):"Not specified"),
 "Scammer contact details:",...(ids.length?ids.map(i=>"  - "+i[0]+": "+i[1]):["  - None recorded"]),
 "What happened, in my words:",(val("story")||"(add a few sentences about what happened, in order)")].join("\n");
 const r=$("result");
 r.innerHTML=(urgent.length?`<div class="card urgent"><h2>What to do right now</h2><ol>${urgent.map(u=>`<li>${u}</li>`).join("")}</ol></div>`:"")+
 `<div class="card"><h2>Your report checklist, in order</h2><p>Each red button opens an official reporting website in a new tab and tries to copy your report. If copying is blocked, use the Copy report button below. Complete the questions on each official website yourself and mark a task done after submitting.</p>`+
 items.map((it,i)=>`<div class="task" id="task${i}"><h3>${i+1}. ${it.h}</h3><p>${it.b}</p>${it.url?`<a class="btn big" data-copy="${i}" href="${it.url}" target="_blank" rel="noopener">Copy my report and open the ${it.ag} form</a>`:""}<label class="done-box"><input type="checkbox" data-done="${i}"> Mark as done</label></div>`).join("")+`</div>`+
 `<div class="card"><h2>Your report</h2><p>This is what the buttons copy. You can also copy, download, or print it here.</p><pre id="sum">${esc(summary)}</pre>
 <div class="noprint"><button class="btn" type="button" data-copy="x">Copy report</button><button class="btn alt" type="button" id="dlbtn">Download as text file</button><button class="btn alt" type="button" id="prbtn">Print</button>
 <div class="nav"><button class="btn alt" type="button" data-go="4">Back to edit</button><button class="btn alt" type="button" id="resetbtn">Start over (clears everything)</button></div></div></div>`;
 $("dlbtn").onclick=dl;$("prbtn").onclick=()=>window.print();$("resetbtn").onclick=()=>location.reload();
 r.querySelectorAll("[data-done]").forEach(c=>c.onchange=()=>$("task"+c.dataset.done).classList.toggle("done",c.checked));
 document.querySelectorAll(".step").forEach(s=>s.classList.remove("on"));r.classList.add("on");$("after-results").hidden=false;$("legal-notice").hidden=false;r.focus();window.scrollTo(0,0);
}
let tt;function toast(m){const t=$("toast");t.textContent=m;t.classList.add("on");clearTimeout(tt);tt=setTimeout(()=>t.classList.remove("on"),4500);}
function legacyCopy(){const ta=document.createElement("textarea");ta.value=summary;ta.setAttribute("readonly","");ta.style.position="fixed";ta.style.top="-1000px";document.body.appendChild(ta);ta.select();let ok=false;try{ok=document.execCommand("copy");}catch(e){}ta.remove();return ok;}
function copyIt(which){const ok=legacyCopy();const msg=which=="x"?"Copied! Now paste it into the report form.":"Copied! Paste it into the form.";
 if(navigator.clipboard&&window.isSecureContext)navigator.clipboard.writeText(summary).then(()=>toast(msg),()=>toast(ok?msg:"Could not copy automatically. Press and hold your report below to copy it."));
 else toast(ok?msg:"Could not copy automatically. Press and hold your report below to copy it.");}
function dl(){const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([summary],{type:"text/plain"}));a.download="scam-report-summary.txt";a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);}
const SHARE_URL="https://report-a-scam-helper.netlify.app";
$("sharebtn").onclick=()=>{if(navigator.share)navigator.share({title:"Report a Scam Helper",text:"A free, private helper that shows exactly where to report a scam and writes the report for you.",url:SHARE_URL}).catch(()=>{});
 else{const ok=(()=>{const s=summary;summary=SHARE_URL;const r=legacyCopy();summary=s;return r;})();toast(ok?"Link copied! Paste it in a text or email to share.":"Share this address: "+SHARE_URL);}};
