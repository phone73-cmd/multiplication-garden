const fs=require('fs'),vm=require('vm'),assert=require('assert');
const nodes=new Map(),data=new Map(),timers=new Map();let timerId=0;const get=s=>{if(!nodes.has(s))nodes.set(s,{value:'',hidden:false,disabled:false,textContent:'',innerHTML:'',classList:{toggle(){}},setAttribute(){}});return nodes.get(s);};
const ctx=vm.createContext({console,Math,Date,localStorage:{getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)},document:{querySelector:get,querySelectorAll:()=>[],body:{dataset:{}}},window:{scrollTo(){}},setTimeout:fn=>{timers.set(++timerId,fn);return timerId;},clearTimeout:id=>timers.delete(id),confirm:()=>true});
vm.runInContext(fs.readFileSync(__dirname+'/../times.js','utf8')+'\nlet screen="times",authenticated=true;const app={innerHTML:""};function stopDictation(){};function login(){};',ctx);
vm.runInContext(fs.readFileSync(__dirname+'/../study.js','utf8'),ctx);
const {engine,garden}=vm.runInContext('({engine:TimesEngine,garden:TimesGarden})',ctx);
let cases=0;
for(let mask=1;mask<256;mask++)for(const count of [10,20,30])for(let rep=0;rep<5;rep++){
 const dans=[2,3,4,5,6,7,8,9].filter((_,i)=>mask&(1<<i)),q=engine.makeQueue(dans,count);assert.equal(q.length,count);
 const totals=dans.map(a=>q.filter(x=>x.a===a).length);assert(Math.max(...totals)-Math.min(...totals)<=1);
 q.forEach((x,i)=>{assert(dans.includes(x.a)&&x.b>=1&&x.b<=9);if(i)assert(x.a!==q[i-1].a||x.b!==q[i-1].b);});
 for(const a of dans){const items=q.filter(x=>x.a===a);for(let i=0;i<items.length;i+=9)assert.equal(new Set(items.slice(i,i+9).map(x=>x.b)).size,items.slice(i,i+9).length);}
 cases++;
}
for(let a=2;a<=9;a++){
 assert.equal(engine.makeQueue([a],10,true).map(q=>q.b).join(','),'1,2,3,4,5,6,7,8,9');
 for(let b=1;b<=9;b++){const html=garden.picture(a,b);assert.equal((html.match(/class="times-group /g)||[]).length,b);assert.equal((html.match(a>=8?/<i><\/i>/g:/<span>🍎<\/span>/g)||[]).length,a*b);assert(engine.check({a,b},String(a*b)));assert(!engine.check({a,b},''));}
}
garden.start([{a:3,b:4},{a:5,b:6},{a:8,b:9}]);
const answer=get('#times-answer');answer.value='';garden.submit();assert.equal(garden.tries,0);
answer.value='12';garden.submit();garden.submit();assert.equal(garden.records.length,1);
get('#times-continue').onclick();answer.value='20';garden.submit();assert(!garden.done);answer.value='30';garden.submit();assert(garden.records[1].second);
get('#times-continue').onclick();answer.value='60';garden.submit();answer.value='61';garden.submit();assert(get('#times-help').innerHTML.includes('72'));
get('#times-continue').onclick();assert.equal(garden.phase,'result');garden.finish();let hist=JSON.parse(data.get('garden-times-history'));assert.equal(hist.length,1);assert.equal(hist[0].first,1);assert.equal(hist[0].second,1);assert.equal(garden.wrong.length,2);
const restored=vm.runInContext('validStudyBackup(JSON.stringify({app:"liah-learning-garden",format:1,data:{"garden-times-history":JSON.parse(localStorage.getItem("garden-times-history"))}}))',ctx);assert.equal(restored['garden-times-history'][0].total,3);
assert(!engine.validHistory([{id:'x',date:'x',total:3,first:3,second:1}]));
get('#times-retry').onclick();for(let i=0;i<2;i++){answer.value=String(garden.queue[i].a*garden.queue[i].b);garden.submit();get('#times-continue').onclick();}assert.equal(JSON.parse(data.get('garden-times-history')).length,1);
// A correct answer announces the result, then advances after the configured 800 ms.
garden.start([{a:2,b:3}]);answer.value='6';garden.submit();assert.equal(garden.done,true);assert(get('#times-continue').textContent.includes('맞았어요!'));assert.equal(timers.size,1);timers.values().next().value();timers.clear();assert.equal(garden.phase,'result');
console.log(JSON.stringify({cases,pictures:72,controller:'empty input, first/second attempts, duplicate submit, picture feedback, results, retry and backup roundtrip passed'}));

// Cumulative fact records keep first-attempt errors, graduate after recent solo successes,
// prioritize the least secure facts, and travel with the existing backup format.
let facts={};facts=engine.recordFact(facts,{a:7,b:8},false);facts=engine.recordFact(facts,{a:6,b:9},false);
assert(engine.validFacts(facts));assert.equal(engine.weakQueue(facts,[7],30).length,1);assert.equal(engine.weakQueue(facts,[2],10).length,0);
for(let i=0;i<3;i++)facts=engine.recordFact(facts,{a:7,b:8},true);
assert.equal(engine.weakQueue(facts,[7],10).length,0);
facts=engine.recordFact(facts,{a:7,b:8},false);assert.equal(engine.weakQueue(facts,[7],10).length,1);
assert.equal(facts['7x8'].attempts,5);assert.equal(facts['7x8'].wrong,2);assert.equal(facts['7x8'].streak,0);
const selected=engine.weakQueue(facts,[6,7],30);assert.equal(new Set(selected.map(q=>q.a+'x'+q.b)).size,selected.length);
assert(!engine.validFacts({'9x10':facts['7x8']}));assert(!engine.validFacts({'7x8':{...facts['7x8'],wrong:10}}));
ctx.factBackup={app:'liah-learning-garden',format:1,data:{'garden-times-facts':facts}};
assert.equal(vm.runInContext('validStudyBackup(JSON.stringify(factBackup))["garden-times-facts"]["7x8"].wrong',ctx),2);
console.log('Cumulative mistakes: attempts, mastery, returning errors, dan filter, unique queues and backup passed.');
