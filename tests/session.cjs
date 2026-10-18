const fs=require('fs'),assert=require('assert'),vm=require('vm');
let setup=fs.readFileSync(__dirname+'/timer.cjs','utf8').split('const f=fixture()')[0];
setup=setup.replace("'navigation.js','app.js'","'navigation.js','session.js','app.js'");
setup=setup.replace('const animations=[],timers=', 'const events={},animations=[],timers=').replace('window:{scrollTo(){},matchMedia:', 'window:{addEventListener:(name,fn)=>events[name]=fn,scrollTo(){},matchMedia:').replace('return {ctx,run,get,dialog,storage,timers,advance,animations,','return {ctx,run,get,dialog,storage,timers,advance,animations,events,');
const make=new Function('require','__dirname',setup+'\nreturn fixture;')(require,__dirname);
const session=new Map();
function fixture(previous){
 const f=make();if(previous)for(const [k,v]of previous.storage)f.storage.set(k,v);
 f.ctx.sessionStorage={getItem:k=>session.get(k)??null,setItem:(k,v)=>session.set(k,v),removeItem:k=>session.delete(k)};
 f.api=f.ctx.window.GardenSession;return f;
}
let f=fixture(),g=f.garden;g.mode='mixed';g.timeLimit=10;g.start([{a:7,b:8},{a:3,b:4}]);f.advance(2300);f.get('#times-answer').value='5';f.api.save();
let raw=JSON.parse(session.get('garden-screen-v1'));assert.equal(raw.times.remainingMs,7700);assert.equal(raw.times.input,'5');
let re=fixture(f);assert(re.api.restore());assert.equal(re.run('screen'),'times');assert.equal(re.garden.index,0);assert.equal(re.garden.remainingMs,7700);assert.equal(re.get('#times-answer').value,'5');assert.equal(re.get('#times-feedback').textContent,'남은 시간 8초');re.advance(7700);assert.equal(re.get('#times-feedback').textContent,'천천히 생각해도 괜찮아요!!');assert(!re.garden.done);
// Completed answers restore without recording another attempt, and auto advance resumes once.
f.get('#times-answer').value='56';g.submit();f.api.save();re=fixture(f);const before=f.storage.get('garden-times-facts');assert(re.api.restore());assert(re.garden.done);assert(re.get('#times-answer').disabled);assert.equal(re.storage.get('garden-times-facts'),before);re.advance(800);assert.equal(re.garden.index,1);assert.equal(re.get('#times-feedback').textContent,'남은 시간 10초');
re.get('#times-answer').value='12';re.garden.submit();re.advance(800);re.api.save();let results=fixture(re);assert(results.api.restore());assert.equal(results.garden.phase,'result');assert.equal(JSON.parse(results.storage.get('garden-times-history')).length,1);
// Pictures and table position are stable across reload.
f=fixture();g=f.garden;g.mode='learn';g.dans=[9];g.home();f.get('#times-start').onclick();g.b=7;g.highlight=3;g.revealed=true;g.learn();const fruit=g.learnFruit[2];f.api.save();re=fixture(f);assert(re.api.restore());assert.equal(re.garden.b,7);assert.equal(re.garden.highlight,3);assert(re.garden.revealed);assert.equal(re.garden.learnFruit[2],fruit);
// Home preferences and empty weak practice retain the current view.
g.mode='weak';g.home();assert(!f.markup().includes('선택한 단에 모아둔'));assert(f.markup().indexOf('id="times-start"')<f.markup().indexOf('혼자 연속 세 번'));f.api.save();re=fixture(f);assert(re.api.restore());assert.equal(re.garden.mode,'weak');assert.equal(re.garden.phase,'home');
f.run('home()');for(const [id,v]of Object.entries({dan:'8',count:'30',type:'3'}))f.get('#'+id).value=v;f.api.save();re=fixture(f);assert(re.api.restore());assert.equal(re.run('screen'),'home');assert.equal(re.get('#dan').value,'8');assert.equal(re.get('#count').value,'30');assert.equal(re.get('#type').value,'3');
// Exact generated questions, current blank values and written drafts survive.
f=fixture();f.run("qs=buildAssessment('9',30,'0');answers=qs.map(()=>[]);pos=4;reviewMode=false;manualChecks={};runId='reload-math';render()");
f.ctx.document.querySelectorAll=s=>s==='.entry'?[{dataset:{answerIndex:'0'},value:'27'},{dataset:{answerIndex:'1'},value:'27'}]:[];
f.api.save();const visual=f.run('qs[4].visual');re=fixture(f);assert(re.api.restore());assert.equal(re.run('pos'),4);assert.equal(re.run('answers[4][0]'),'27');assert.equal(re.run('qs[4].visual'),visual);
f.run("qs=buildAssessment('3',10,'16');answers=qs.map(()=>[]);pos=0;render()");f.ctx.document.querySelectorAll=s=>s==='.entry'?[{dataset:{answerIndex:'0'},value:'12'}]:[];f.get('#explanation').value='3개씩 네 묶음이에요.';f.api.save();re=fixture(f);assert(re.api.restore());assert.equal(re.run('answers[0].at(-1)'),'3개씩 네 묶음이에요.');
// Result restoration is idempotent with the existing run identity.
f.run("qs=buildAssessment('3',10,'0');answers=qs.map(q=>expected(q));manualChecks={};pos=0;runId='saved-math';result()");f.api.save();re=fixture(f);assert(re.api.restore());assert.equal(re.run('screen'),'result');assert.equal(re.run('history.length'),1);
// A malformed snapshot falls back, and logout cannot revive another session's draft.
session.set('garden-screen-v1','broken');assert.equal(re.api.restore(),false);assert(!session.has('garden-screen-v1'));
session.set('garden-screen-v1',JSON.stringify({v:1,screen:'quiz',math:{}}));assert.equal(re.api.restore(),false);
f.api.save();re.run('logoutGarden()');assert(!session.has('garden-screen-v1'));re.run('startGarden()');assert.equal(re.run('screen'),'login');
console.log('Reload: same-tab input/timer/expiry, completed attempts and score idempotency, picture identity, home options, 30-question assessment, writing drafts, invalid data and logout passed.');
// Exercise native dictation snapshot/restore across independent mounted controllers.
const nativeSetup=fs.readFileSync(__dirname+'/integration.cjs','utf8').split('(async()=>{')[0],makeDictation=new Function('require','__dirname',nativeSetup+'\nreturn dictationContext;')(require,__dirname);
let d=makeDictation(true);d.api.SET.shuffle=false;d.api.start(1);d.elements.get('answer').value='쓰던 답';let saved=JSON.parse(JSON.stringify(d.controller.snapshot())),dr=makeDictation(true);dr.controller.restore(saved);assert.equal(dr.elements.get('answer').value,'쓰던 답');assert.equal(dr.api.getState().idx,0);
d.api.check();saved=JSON.parse(JSON.stringify(d.controller.snapshot()));dr=makeDictation(true);dr.controller.restore(saved);assert(dr.api.getState().checked);assert.equal(dr.api.getState().results.length,1);assert(dr.elements.get('answer').disabled);
for(let i=0;i<10;i++){if(i){d.elements.get('answer').value=d.api.DATA[0].items[i];d.api.check();}d.api.next();}
saved=JSON.parse(JSON.stringify(d.controller.snapshot()));dr=makeDictation(true);for(const [k,v]of d.data)dr.data.set(k,v);const stats=dr.data.get('dictation-stats');dr.controller.restore(saved);assert.equal(dr.data.get('dictation-stats'),stats);assert.equal(dr.elements.get('done').hidden,false);
d.controller.navigate('settings');d.elements.get('edList').children.forEach((row,i)=>d.elements.set('ed'+i,row.children[1]));d.elements.get('ed0').value='저장 전 문장';saved=JSON.parse(JSON.stringify(d.controller.snapshot()));
dr=makeDictation(true);const original=dr.controller.restore;
// The real browser resolves the newly created inputs by id; mirror that behavior in this fixture.
// Integration's element map returns stable existing elements; editor drafts restore to those ids.
original(saved);assert.equal(dr.elements.get('ed0').value,'저장 전 문장');
console.log('Dictation reload: typed answer, checked feedback, results without duplicate history and unsaved editor text passed.');

const lifecycle=fixture();lifecycle.garden.timeLimit=5;lifecycle.garden.start([{a:2,b:3}]);lifecycle.advance(1200);lifecycle.get('#times-answer').value='6';lifecycle.events.beforeunload();assert.equal(JSON.parse(session.get('garden-screen-v1')).times.remainingMs,3800);
lifecycle.events.pagehide();assert.equal(lifecycle.timers.size,0);lifecycle.advance(20000);lifecycle.events.pageshow({persisted:true});assert.equal(lifecycle.get('#times-feedback').textContent,'남은 시간 4초');
const boot=fixture(lifecycle);boot.run('startGarden()');assert.equal(boot.run('screen'),'times');assert.equal(boot.get('#times-answer').value,'6');assert.equal(boot.garden.remainingMs,3800);
console.log('Lifecycle: actual unload/pagehide events capture latest input/time, back-forward cache pause/resume and app boot restoration passed.');
