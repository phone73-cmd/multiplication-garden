const fs=require('fs'),vm=require('vm'),assert=require('assert');
function fixture(saved=null,blocked=false){
 let now=0,nextId=0;const timers=new Map(),storage=new Map(saved===null?[]:[['garden-times-seconds',saved]]),nodes=new Map();
 class Clock extends Date{constructor(...args){super(...(args.length?args:[now]));}static now(){return now;}}
 const get=s=>{if(!nodes.has(s))nodes.set(s,{value:'',textContent:'',innerHTML:'',hidden:false,disabled:false,setAttribute(){},focus(){},isConnected:true});return nodes.get(s);};
 const dialog={open:false,setAttribute(){},querySelector:get,showModal(){this.open=true;},close(){this.open=false;this.onclose?.();}};
 const ctx=vm.createContext({console,Date:Clock,Math,Set,Map,Array,JSON,Number,String,RegExp,navigator:{},localStorage:{getItem:k=>{if(blocked)throw Error('blocked');return storage.get(k)??null;},setItem:(k,v)=>{if(blocked)throw Error('blocked');storage.set(k,v);},removeItem:k=>storage.delete(k)},sessionStorage:{getItem:()=>null},document:{body:{dataset:{},appendChild(){}},activeElement:get('#draft'),querySelector:s=>get(s),querySelectorAll:()=>[],createElement:()=>dialog},window:{scrollTo(){}},confirm:()=>true,setTimeout(fn,delay){const id=++nextId;timers.set(id,{fn,at:now+delay});return id;},clearTimeout:id=>timers.delete(id)});
 for(const file of ['pictures.js','times.js','study.js','questions.js','navigation.js','app.js'])vm.runInContext(fs.readFileSync(__dirname+'/../'+file,'utf8').replace('installPullToRefresh();authenticated?hub():login();',''),ctx);
 const run=s=>vm.runInContext(s,ctx);run("authenticated=true;screen='times'");
 const advance=ms=>{const end=now+ms;while(true){const entries=[...timers.entries()].filter(([,v])=>v.at<=end).sort((a,b)=>a[1].at-b[1].at);if(!entries.length)break;const [id,t]=entries[0];timers.delete(id);now=t.at;t.fn();}now=end;};
 return {ctx,run,get,dialog,storage,timers,advance,garden:run('TimesGarden'),markup:()=>get('#app').innerHTML};
}
const f=fixture(),g=f.garden;assert.equal(g.timeLimit,0);
g.mode='learn';g.home();assert(!f.markup().includes('id="times-seconds"'));assert(f.markup().includes('틀린문제 풀기'));
for(const mode of ['mixed','weak','ordered']){g.mode=mode;g.home();assert(f.markup().indexOf('id="times-count"')<f.markup().indexOf('id="times-seconds"'));for(const value of [0,10,5])assert(f.markup().includes(`value="${value}"`));if(mode==='ordered')assert(f.markup().includes('disabled><option>9</option>'));}
f.get('#times-seconds').value='5';f.get('#times-seconds').onchange();assert.equal(g.timeLimit,5);assert.equal(f.storage.get('garden-times-seconds'),'5');assert.equal(fixture('5').garden.timeLimit,5);assert.equal(fixture('999').garden.timeLimit,0);assert.equal(fixture(null,true).garden.timeLimit,0);
g.start([{a:7,b:8},{a:6,b:7}]);assert.equal(f.get('#times-feedback').textContent,'남은 시간 5초');f.advance(2100);assert.equal(f.get('#times-feedback').textContent,'남은 시간 3초');
f.get('#times-answer').value='5';f.get('#times-form').onsubmit({preventDefault(){}});assert.equal(g.tries,1);assert(!g.done);assert.equal(f.get('#times-feedback').textContent,'한 번 더 생각해 볼까요?');
f.get('#times-answer').value='5';f.get('#times-answer').oninput();assert(f.get('#times-feedback').textContent.includes('3초'));
f.get('#times-home').onclick();assert(f.dialog.open);const remaining=g.remainingMs;assert.equal(f.timers.size,0);f.advance(40000);assert.equal(g.remainingMs,remaining);f.get('#garden-stay').onclick();assert(!f.dialog.open);assert(f.get('#times-feedback').textContent.includes('3초'));f.advance(remaining);assert.equal(f.get('#times-feedback').textContent,'천천히 생각해도 괜찮아요!!');assert.equal(g.records.length,0);assert(!g.done);assert(!f.get('#times-answer').disabled);assert.equal(f.timers.size,0);
f.get('#times-answer').value='56';g.submit();assert(g.done);assert.equal(g.records[0].second,true);assert.equal(f.timers.size,1);f.advance(800);assert.equal(g.index,1);assert.equal(f.get('#times-feedback').textContent,'남은 시간 5초');
f.advance(1000);f.get('#times-answer').value='42';g.submit();assert.equal(f.timers.size,1);assert(f.get('#times-feedback').textContent.includes('맞았어요!'));f.advance(800);assert.equal(g.phase,'result');assert.equal(f.timers.size,0);
g.timeLimit=10;g.start([{a:2,b:2}]);f.advance(1000);g.quiz();assert.equal(f.get('#times-feedback').textContent,'남은 시간 9초');f.advance(9000);assert.equal(f.get('#times-feedback').textContent,'천천히 생각해도 괜찮아요!!');assert.equal(g.tries,0);f.get('#times-answer').value='4';g.submit();assert(g.records[0].first);f.advance(800);
g.timeLimit=5;g.start([{a:3,b:4}]);f.get('#times-answer').value='11';g.submit();f.get('#times-answer').value='10';g.submit();assert(g.done);assert.equal(f.timers.size,0);f.advance(10000);assert(f.get('#times-feedback').textContent.includes('12입니다.'));
g.timeLimit=5;g.start([{a:3,b:4}]);f.advance(1000);f.get('#times-home').onclick();f.get('#garden-leave').onclick();assert.equal(g.phase,'home');assert.equal(f.timers.size,0);
g.timeLimit=0;g.start([{a:2,b:3}]);assert.equal(f.get('#times-feedback').textContent,'천천히 생각해도 괜찮아요!!');assert.equal(f.timers.size,0);f.advance(20000);assert.equal(g.tries,0);
// Settings use the existing backup contract and are restored without requiring reload.
assert.equal(f.run(`validStudyBackup(JSON.stringify({app:'liah-learning-garden',format:1,data:{'garden-times-seconds':10}}))['garden-times-seconds']`),10);
assert.throws(()=>f.run(`validStudyBackup(JSON.stringify({app:'liah-learning-garden',format:1,data:{'garden-times-seconds':1}}))`));
f.run(`applyStudyBackup({'garden-times-seconds':10})`);assert.equal(g.timeLimit,10);
console.log('Timer: layout/modes/persistence, 5/10 seconds, exact !! copy, expiry without forced error, late answer/mastery, unchanged 800ms advance, feedback, rerender, leave pause/resume/exit, backup and blocked storage passed.');
