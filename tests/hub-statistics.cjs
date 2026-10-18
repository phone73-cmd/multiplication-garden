const fs=require('fs'),vm=require('vm'),assert=require('assert');
const storage=new Map(),node={},app={innerHTML:''};let random=0,calls=0;
const math=Object.create(Math);math.random=()=>{calls++;return random;};
const context=vm.createContext({console,Date,Math:math,Set,Map,Array,JSON,Number,String,RegExp,navigator:{},localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v)},sessionStorage:{getItem:()=>null},document:{body:{dataset:{}},querySelector:s=>s==='#app'?app:node,querySelectorAll:()=>[]},window:{scrollTo(){}},setTimeout(){}});
for(const file of ['study.js','questions.js','app.js'])vm.runInContext(fs.readFileSync(__dirname+'/../'+file,'utf8').replace('installPullToRefresh();authenticated?hub():login();',''),context);
const run=s=>vm.runInContext(s,context),read=s=>JSON.parse(JSON.stringify(run(s)));
storage.set('garden-times-facts',JSON.stringify({'3x1':{attempts:100,wrong:10},'7x4':{attempts:2,wrong:2},'7x5':{attempts:8,wrong:0}}));
run("history=[{score:30,date:'old'}, {score:70,date:'new',danStats:{4:{attempts:10,wrong:6},7:{attempts:100,wrong:1}}}]");
assert.equal(read("chooseHubExpression(hubDanTotals('times'))").a,7);assert.equal(read("chooseHubExpression(hubDanTotals('math'))").a,4);
// Weighted rates across facts, rather than an average of fact percentages.
assert.equal(read("hubDanTotals('times')")[7].attempts,10);
for(let i=0;i<1000;i++){
 random=i/1000;
 const a=read('chooseHubExpression({})');assert(a.a>=2&&a.a<=9&&a.b>=1&&a.b<=9);
 const b=read('chooseHubExpression({},'+JSON.stringify(a)+')');assert(!(a.a===b.a&&a.b===b.b));assert(!(a.a===b.b&&a.b===b.a));
 const forced=read('chooseHubExpression({7:{attempts:10,wrong:9}},{a:4,b:7})');assert.equal(forced.a,7);assert.notEqual(forced.b,4);
}
run('authenticated=true;hub()');const first=app.innerHTML,at=calls;run('hub();refreshCurrentScreen()');assert.equal(app.innerHTML,first);assert.equal(calls,at);
run("setStudyScreen('home');hub()");assert(calls>at);
// Save, regrade, retry: each completed assessment contributes once, matching excluded.
run("qs=[makeQuestion(0,'3'),makeQuestion(0,'7'),makeQuestion(6,'2')];qs.forEach((q,i)=>q.id='q'+i);answers=qs.map(expected);answers[1]=['0','0'];manualChecks={};runId='new-assessment';reviewMode=false;saveRun(67)");
assert.deepEqual(read('history.at(-1).danStats'),{3:{attempts:1,wrong:0},7:{attempts:1,wrong:1}});
run('answers[1]=expected(qs[1]);saveRun(100)');assert.equal(run('history.length'),3);assert.equal(run('history.at(-1).danStats[7].wrong'),0);
run('reviewMode=true;saveRun(0)');assert.equal(run('history.length'),3);
const backup=()=>JSON.stringify({app:'liah-learning-garden',format:1,data:{'garden-history':read('history')}});
context.backup=backup();assert.equal(run('validStudyBackup(backup)["garden-history"].length'),3);
for(const bad of [{3:{attempts:1,wrong:2}},{1:{attempts:1,wrong:0}},{3:{attempts:0,wrong:0}},[]]){
 context.backup=JSON.stringify({app:'liah-learning-garden',format:1,data:{'garden-history':[{date:'x',score:10,danStats:bad}]}});assert.throws(()=>run('validStudyBackup(backup)'));
}
console.log('Hub statistics: independent weighted dan rates, legacy fallback, 1000 random/no-swapped-duplicate samples, stable refresh, entry refresh, math save/regrade/retry and backup validation passed.');
