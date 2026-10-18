const fs=require('fs'),vm=require('vm'),assert=require('assert');
const storage=new Map(),nodes=new Map(),getNode=s=>{if(!nodes.has(s))nodes.set(s,{attrs:{},setAttribute(k,v){this.attrs[k]=v;}});return nodes.get(s);},app={innerHTML:''};let random=0,calls=0;
const math=Object.create(Math);math.random=()=>{calls++;return random;};
const context=vm.createContext({console,Date,Math:math,Set,Map,Array,JSON,Number,String,RegExp,navigator:{},localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v)},sessionStorage:{getItem:()=>null},document:{body:{dataset:{}},querySelector:s=>s==='#app'?app:getNode(s),querySelectorAll:()=>[]},window:{scrollTo(){}},setTimeout(){}});
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

run('reviewMode=false;authenticated=true;setStudyScreen("home");hub()');
for(const subject of ['times','math']){
 const equation=read('getHubExpressions().'+subject),button=getNode('#hub-equation-'+subject);
 button.onclick();assert.equal(button.textContent,String(equation.a*equation.b));assert.equal(button.attrs['aria-pressed'],'true');assert.equal(run('screen'),'hub');
 run('refreshCurrentScreen()');assert(app.innerHTML.includes('aria-pressed="true"'));assert.equal(run('screen'),'hub');
 getNode('#hub-equation-'+subject).onclick();assert.equal(getNode('#hub-equation-'+subject).textContent,`${equation.a} × ${equation.b}`);
}
getNode('#hub-equation-times').onclick();run('setStudyScreen("home");hub()');assert.equal(run('!!getHubExpressions().timesRevealed'),false);
for(const [score,stage]of [[0,1],[59,1],[60,2],[79,2],[80,3],[99,3],[100,4]]){context.record=[{score}];assert.equal(run('gardenBloomStage(record)'),stage);}
assert.equal(run('gardenBloomStage([])'),0);assert.equal(run('gardenBloomStage([{score:20,bloomPeak:100}])'),4);
run('reviewMode=false;saveRun(100);saveRun(20)');assert.equal(run('history.at(-1).score'),20);assert.equal(run('history.at(-1).bloomPeak'),100);assert.equal(run('gardenBloomStage()'),4);
context.backup=backup();assert(run('validStudyBackup(backup)["garden-history"].at(-1).bloomPeak')===100);
for(const peak of [-1,101,'100']){context.backup=JSON.stringify({app:'liah-learning-garden',format:1,data:{'garden-history':[{score:20,date:'x',bloomPeak:peak}]}});assert.throws(()=>run('validStudyBackup(backup)'));}
run('history=[]');assert(run('gardenBloomMarkup()').includes('stage-0'));run('history=[{score:100}]');assert(run('gardenBloomMarkup()').includes('bloom-sparkles'));
// Validate rendered markup with a parser outside the UI runtime when running QA.
if(process.env.HUB_MARKUP_FILE)fs.writeFileSync(process.env.HUB_MARKUP_FILE,app.innerHTML);
console.log('Hub answer buttons: answer-only toggle without navigation, stable refresh/reset on re-entry; bloom boundaries, retained peak after regrade and backup validation passed.');
