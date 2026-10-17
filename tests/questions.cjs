const fs=require('fs'),vm=require('vm'),assert=require('assert');
const noop=()=>{};
const context=vm.createContext({console,Date,Math,Set,Map,Array,JSON,Number,String,RegExp,localStorage:{getItem:()=>null,setItem:noop},document:{querySelector:()=>({}),querySelectorAll:()=>[]},window:{scrollY:0,scrollTo:noop},confirm:()=>true,setTimeout:noop});
vm.runInContext(fs.readFileSync(__dirname+'/../questions.js','utf8'),context);
vm.runInContext(fs.readFileSync(__dirname+'/../app.js','utf8').replace('installPullToRefresh();home();',''),context);
const api=vm.runInContext('({makeQuestion,expected,correct,buildAssessment,typePlan,controls,describe,answerState,tableMarkup,render,result,readAnswer,refreshCurrentScreen,names,lifeScenes,wordScenes,GardenQuestions})',context);
const testCompare=(n,op,v)=>op==='<'?n<v:op==='<='?n<=v:op==='>'?n>v:n>=v;
let checked=0,conditions=0;const counts=new Set(),relations=new Set(),targets=new Set(),zeroCases=new Set();
for(const dan of ['all','2','3','4','5','6','7','8','9'])for(let t=0;t<19;t++)for(let i=0;i<100;i++){
 const q=api.makeQuestion(t,dan,null,{variant:i%(t===10?4:3)}),a=q.a,b=q.b,ans=api.expected(q);
 checked++;assert(api.correct(q,ans),`expected rejected t${t}`);
 assert(!api.correct(q,[]),`empty accepted t${t}`);
 if(q.kind==='fields'){const bad=[...ans];bad[0]=String(+bad[0]+100);assert(!api.correct(q,bad),`wrong number accepted t${t}`);}
 if(t===0||t===8){assert.equal((q.visual.match(/class="count-item"/g)||[]).length,a*b);assert.equal((q.visual.match(/class="count-group"/g)||[]).length,b);}
 if(t===8&&a!==b){const swapped=[String(b),String(a),String(a*b)];assert.equal(api.correct(q,swapped),!q.ordered);}
 if(t===9)assert(api.correct(q,[String(b),String(a),String(a*b),String(a*b)]));
 if(t===1){assert.equal(q.fields[0].value,a*q.small);assert.equal(q.fields[1].value,b-q.small);assert.equal(q.fields[2].value,a*b-a*q.small);}
 if(t===2){assert.equal(a*q.prev+q.fields[2].value,a*b);assert.equal(q.fields[2].value,q.fields[4].value);}
 if(t===3){const trueN=q.options.filter(o=>o.value===a*b).length;assert(trueN>=1&&trueN<=3);assert.equal(q.options.length,4);counts.add(trueN);assert(!q.options.some(o=>/× 10/.test(o.text)));}
 if(t===4){assert.equal(q.nums.length,30);assert.equal(new Set(q.nums).size,30);assert(q.nums.every((v,i)=>!i||q.nums[i-1]<v));for(let k=1;k<=9;k++)assert(q.nums.includes(a*k));}
 if(t===5){
  const c=q.condition.c,ks=q.condition.clauses,ns=Array.from({length:81},(_,j)=>j+1),pass=n=>ks.every(k=>testCompare(n,k.op,k.bound.value));
  const other=n=>c?n%c===0&&n<=c*9:n%2===q.condition.parity;
  const hits=ns.filter(n=>n%a===0&&n<=a*9&&other(n)&&pass(n));assert.equal(hits.length,1);assert.equal(hits[0],q.fields[0].value);
  assert(ns.filter(n=>n%a===0&&n<=a*9&&pass(n)).length>1);assert(ns.filter(n=>other(n)&&pass(n)).length>1);
  ks.forEach(k=>relations.add(k.op));targets.add(hits[0]);conditions++;
 }
 if(t===6){assert.equal(new Set(q.pairs.map(p=>p.value)).size,3);assert(q.pairs.filter(p=>p.mode==='combination').length>=2);for(const p of q.pairs){assert.equal(p.leftFactors[0]*p.leftFactors[1],p.rightFactors[0]*p.rightFactors[1]);if(p.mode==='combination')assert.notEqual([...p.leftFactors].sort().join(','),[...p.rightFactors].sort().join(','));}}
 if(t===7){assert.equal((q.visual.match(/class="movement-segment"/g)||[]).length,b);if(q.moveMode===2)assert.equal((q.visual.match(/>\?(?:cm|m)<\/text>/g)||[]).length,b);}
 if(t===10){const z=q.zeroOne;zeroCases.add([z.left===0?'0':z.left===1?'1':'n',z.right===0?'0':z.right===1?'1':'n'].join('*'));assert.equal(q.fields[0].value,z.left*z.right);}
 if(t===11){const possible=[];for(let n=0;n<=9;n++)if(q.missingSide===0?n*b===a*b:a*n===a*b)possible.push(n);assert.equal(possible.length,1);assert.equal(possible[0],q.fields[0].value);}
 if(t===12){assert.equal(q.table.rows.length,4);assert.equal(q.table.cols.length,4);assert.equal(q.table.blanks.length,3);assert.equal(new Set(q.table.blanks.map(p=>p.ri+','+p.ci)).size,3);q.table.blanks.forEach((p,j)=>assert.equal(q.fields[j].value,q.table.rows[p.ri]*q.table.cols[p.ci]));}
 if(t===13){const c=q.compare,left=c.a*c.b,right=c.x*c.y;assert.equal(q.options[+q.expected[0]].text,left<right?'<':left>right?'>':'=');}
 if(t===15)assert.notEqual(+q.wrongEquation.split('=').at(-1).trim(),a*b);
 if(t===18){const actual=q.options.filter(o=>o.ok).map(o=>o.factors.join('*')).sort();const oracle=[];for(let x=1;x<=9;x++)for(let y=1;y<=9;y++)if(x*y===a*b)oracle.push(x+'*'+y);assert.equal(actual.join(','),oracle.sort().join(','));}
 assert(!q.hint.includes('을/를'));assert(!/[\u3040-\u30ff]/.test(q.hint));
}
for(const dan of ['all','2','5','7','9'])for(const n of [10,20,30]){
 const qs=api.buildAssessment(dan,n,'mix');assert.equal(qs.length,n);if(n>=20)assert.equal(new Set(qs.map(q=>q.t)).size,19);
 const written=qs.filter(q=>q.writing).length;assert.equal(written,n===10?2:n===20?4:6);
 for(const q of qs){assert(api.correct(q,api.expected(q)));context.qs=[q];context.answers=[api.expected(q)];context.pos=0;const markup=api.controls(q);assert(!markup.includes('undefined'));assert(!api.describe(q,api.expected(q)).includes('undefined'));}
}
for(const dan of ['all','2','7'])for(let t=0;t<19;t++){
 const qs=api.buildAssessment(dan,30,String(t));assert.equal(qs.length,30);
 if(t===7)assert.equal(new Set(qs.slice(0,20).map(q=>q.sceneIndex)).size,20);
 if(dan!=='all'){const count={};for(const q of qs.slice(0,8))count[q.b]=(count[q.b]||0)+1;assert.equal(Object.keys(count).length,8);}
}
assert.equal(api.wordScenes.length,20);assert.equal(api.lifeScenes.length,20);assert.deepEqual([...counts].sort(),[1,2,3]);assert.equal(relations.size,4);assert.equal(zeroCases.size,4);
let conditionBankChecks=0;
for(let a=2;a<=9;a++)for(const spec of api.GardenQuestions.conditionBank(a)){
 const predicates=[n=>n%a===0&&n<=a*9,n=>spec.c?n%spec.c===0&&n<=spec.c*9:n%2===spec.parity,...spec.clauses.map(k=>n=>testCompare(n,k.op,k.bound.value))];
 const universe=Array.from({length:81},(_,i)=>i+1),hits=universe.filter(n=>predicates.every(fn=>fn(n)));
 assert.equal(hits.length,1);assert.equal(hits[0],spec.target);
 for(let i=0;i<predicates.length;i++)assert(universe.filter(n=>predicates.every((fn,j)=>i===j||fn(n))).length>1);
 conditionBankChecks++;
}
vm.runInContext(`history=[{score:80,date:'old'}];runId='test-run';reviewMode=false;saveRun(90);saveRun(100);if(history.length!==2||history[0].score!==80||history[1].score!==100)throw Error('history');reviewMode=true;saveRun(10);if(history.length!==2)throw Error('retry history');`,context);
const writing=api.makeQuestion(16,'3');writing.id='written';const ans=api.expected(writing);assert.equal(api.answerState(writing,ans),'pending');vm.runInContext("manualChecks.written=true",context);assert.equal(api.answerState(writing,ans),'good');vm.runInContext("manualChecks.written=false",context);assert.equal(api.answerState(writing,ans),'wrong');
// Exercise real form and review handlers, including table DOM order and deferred scoring.
const nodes=new Map();let entries=[],reviewButtons=[];
context.document.querySelector=s=>{if(!nodes.has(s))nodes.set(s,{});return nodes.get(s);};
context.document.querySelectorAll=s=>s==='.entry'?entries:s==='.rubric-button'?reviewButtons:[];
const tq=api.makeQuestion(12,'7');tq.id='table';const wq=api.makeQuestion(16,'3',null,{a:3,b:5});wq.id='essay';
context.fixture=[tq,wq];vm.runInContext("qs=fixture;answers=[[],[]];pos=0;manualChecks={};history=[{score:80,date:'old'}];reviewMode=false;runId='smoke';",context);
entries=[2,0,1].map(i=>({dataset:{answerIndex:String(i)},value:String(tq.fields[i].value)}));api.render();
assert.equal(api.readAnswer().join(','),api.expected(tq).join(','));nodes.get('#form').onsubmit({preventDefault:noop});assert.equal(vm.runInContext('pos',context),1);
entries=[{dataset:{answerIndex:'0'},value:'15'}];nodes.get('#explanation')??nodes.set('#explanation',{});nodes.get('#explanation').value='<img src=x onerror=alert(1)> 12에 3을 더해요.';
reviewButtons=[{dataset:{review:'essay',value:'yes'}},{dataset:{review:'essay',value:'no'}}];nodes.get('#form').onsubmit({preventDefault:noop});
assert.equal(vm.runInContext('screen',context),'result');assert.equal(vm.runInContext('history.length',context),1);assert(vm.runInContext('app.innerHTML',context).includes('&lt;img src=x onerror=alert(1)&gt;'));
reviewButtons[0].onclick();assert.equal(vm.runInContext('history.length',context),2);assert.equal(vm.runInContext('history[1].score',context),100);api.refreshCurrentScreen();assert.equal(vm.runInContext('history.length',context),2);
console.log(JSON.stringify({checked,conditions,conditionBankChecks,correctChoiceCounts:[...counts].sort(),comparisonOperators:[...relations],conditionTargetCount:targets.size,zeroCases:[...zeroCases],history:'preserved; idempotent; retry excluded',mixed:'10/20/30 balanced; 20/30 cover all 19',controller:'table order, submit, pending rubric, score persistence, escaping, refresh passed',result:'passed'}));
