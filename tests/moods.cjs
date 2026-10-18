const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const root=path.join(__dirname,'..'),data=new Map(),session=new Map();let randomCalls=0;
function make(saved=data){
 const nodes=new Map(),get=id=>{if(!nodes.has(id))nodes.set(id,{value:'',hidden:false,dataset:{},attrs:{},focus(){},setAttribute(k,v){this.attrs[k]=v;}});return nodes.get(id);};
 let markup='',buttons=[],welcome=null,reduced=false,now=0,nextTimer=0;const jobs=new Map();
 const timeout=(fn,delay)=>{const id=++nextTimer;jobs.set(id,{fn,at:now+delay});return id;};
 const clear=id=>jobs.delete(id);
 const tick=ms=>{const end=now+ms;for(;;){const due=[...jobs].filter(([,j])=>j.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];if(!due)break;now=due[1].at;jobs.delete(due[0]);due[1].fn();}now=end;};
 const app={querySelectorAll:()=>buttons,querySelector:selector=>selector==='#welcome-mood-image'?welcome:get(selector)};
 Object.defineProperty(app,'innerHTML',{get:()=>markup,set(value){
  markup=value;buttons=[...value.matchAll(/data-mood="([^"]+)"/g)].map(m=>({dataset:{mood:m[1]},attrs:{},classList:{values:new Set(),add(k){this.values.add(k);},remove(k){this.values.delete(k);}},setAttribute(k,v){this.attrs[k]=v;}}));
  const m=value.match(/id="welcome-mood-image" src="([^"]+)" data-poster="([^"]+)"/);
  welcome=m?{src:m[1],dataset:{poster:m[2]}}:null;
 }});
 const math=Object.create(Math);math.random=()=>{randomCalls++;return .76;};
 const ctx=vm.createContext({console,Date,Math:math,Set,Map,Array,JSON,Number,String,RegExp,
 navigator:{},localStorage:{getItem:k=>saved.get(k)??null,setItem:(k,v)=>saved.set(k,v),removeItem:k=>saved.delete(k)},
 sessionStorage:{getItem:k=>session.get(k)??null,setItem:(k,v)=>session.set(k,v),removeItem:k=>session.delete(k)},
 document:{body:{dataset:{}},querySelector:s=>s==='#app'?app:get(s),querySelectorAll:()=>[]},
 window:{scrollY:0,scrollTo(){},matchMedia:()=>({matches:reduced}),GardenDictation:{mount:()=>({destroy(){},refresh(){},hasDraft:()=>false})}},confirm:()=>true,setTimeout:timeout,clearTimeout:clear});
 for(const file of ['moods.js','flowers.js','study.js','questions.js','app.js']){
  let source=fs.readFileSync(root+'/'+file,'utf8');if(file==='app.js')source=source.replace('installPullToRefresh();startGarden();','');vm.runInContext(source,ctx);
 }
 return {ctx,api:ctx.window.GardenMood,app,get,buttons:()=>buttons,welcome:()=>welcome,setReduced:v=>reduced=v,tick,pending:()=>jobs.size};
}
const f=make();const mood=f.api;
assert.equal(mood.items.length,8);assert.equal(mood.get().choice,'greeting');
vm.runInContext('login()',f.ctx);assert.equal(f.buttons().length,9);assert.equal((f.app.innerHTML.match(/type="button" class="mood-choice"/g)||[]).length,9);
f.buttons().find(b=>b.dataset.mood==='greeting').onclick();assert.equal(f.buttons().filter(b=>b.attrs['aria-pressed']==='true').length,1);
f.get('#garden-code').value='0619';f.buttons().find(b=>b.dataset.mood==='random').onclick();
assert.equal(f.get('#garden-code').value,'0619');assert(mood.drawing());assert(f.buttons().every(b=>b.disabled));assert.equal(f.get('#garden-enter').disabled,true);
assert.equal(f.buttons().filter(b=>b.classList.values.has('is-drawing')).length,1);
assert.equal(randomCalls,1);assert(f.buttons().every(b=>b.attrs['aria-pressed']==='false'));
f.buttons().find(b=>b.dataset.mood==='random').onclick();assert.equal(randomCalls,1);
f.get('#login-form').onsubmit({preventDefault(){}});assert.equal(vm.runInContext('authenticated',f.ctx),false);
for(let elapsed=0;elapsed<1800;elapsed+=50){f.tick(50);assert(mood.drawing());assert(f.buttons().every(b=>b.attrs['aria-pressed']==='false'));assert.equal(f.buttons().filter(b=>b.classList.values.has('is-drawing')).length,1);}
f.tick(99);assert(mood.drawing());f.tick(1);
assert(!mood.drawing());assert.equal(mood.current().key,'determined');assert.equal(f.get('#mood-draw-status').textContent,'오늘은 다짐!');
assert.equal(f.buttons().filter(b=>b.attrs['aria-pressed']==='true').length,1);assert.equal(f.buttons().find(b=>b.attrs['aria-pressed']==='true').dataset.mood,'determined');
assert(f.buttons().every(b=>!b.disabled));assert.equal(f.get('#garden-enter').disabled,false);
f.get('#garden-code').value='0000';f.get('#login-form').onsubmit({preventDefault(){}});
assert.equal(randomCalls,1);assert.equal(vm.runInContext('authenticated',f.ctx),false);
f.get('#garden-code').value='0619';f.get('#login-form').onsubmit({preventDefault(){}});
const afterAdmission=randomCalls;assert.equal(afterAdmission,15);assert.equal(mood.current().key,'determined');assert.equal(vm.runInContext('screen',f.ctx),'hub');
assert.equal(f.welcome().src,'assets/moods/determined.webp');assert(!f.app.innerHTML.includes('class="study-sprouts"'));
const hubCaption=f.app.innerHTML.match(/<figcaption>(.*?)<\/figcaption>/)[1];assert(hubCaption.length>0);
vm.runInContext('refreshCurrentScreen();hub()',f.ctx);assert.equal(randomCalls,afterAdmission);assert(f.app.innerHTML.includes('<figcaption>'+hubCaption+'</figcaption>'));assert.equal(mood.current().key,'determined');
const reboot=make();assert.equal(reboot.api.get().choice,'random');assert.equal(reboot.api.current().key,'determined');
vm.runInContext('hub()',reboot.ctx);assert.equal(reboot.welcome().src,'assets/moods/determined.webp');assert.equal(randomCalls,afterAdmission+4);
// Refreshing the login view cancels the old draw without writing a pending winner.
vm.runInContext('authenticated=false;login()',f.ctx);const before=mood.get();
f.buttons().find(b=>b.dataset.mood==='random').onclick();assert(mood.drawing());f.tick(300);
vm.runInContext('login()',f.ctx);assert(!mood.drawing());assert.equal(f.pending(),0);f.tick(3000);assert.equal(mood.get().current,before.current);
// Reduced motion resolves immediately and does not schedule cycling.
f.setReduced(true);f.buttons().find(b=>b.dataset.mood==='random').onclick();assert(!mood.drawing());assert.equal(f.pending(),0);assert.equal(f.get('#mood-draw-status').textContent,'오늘은 다짐!');f.setReduced(false);
const captions=new Set();
for(const item of mood.items){assert(mood.choose(item.key));assert.equal(mood.enter().key,item.key);assert(mood.markup().includes(item.src));assert(fs.existsSync(root+'/'+item.src));assert(fs.existsSync(root+'/'+item.poster));captions.add(mood.markup().match(/<figcaption>(.*?)<\/figcaption>/)[1]);}assert.equal(captions.size,8);
assert.equal(mood.choose('bad'),false);
f.setReduced(true);vm.runInContext('authenticated=true;hub()',f.ctx);assert(f.welcome().src.endsWith('-still.webp'));
f.setReduced(false);vm.runInContext('hub()',f.ctx);assert(!f.welcome().src.endsWith('-still.webp'));f.welcome().onerror();assert(f.welcome().src.endsWith('-still.webp'));
const backup={app:'liah-learning-garden',format:1,data:{'garden-mood':{choice:'random',current:'thinking'}}};
f.ctx.backupText=JSON.stringify(backup);vm.runInContext('applyStudyBackup(validStudyBackup(backupText));hub()',f.ctx);assert.equal(mood.current().key,'thinking');assert.equal(mood.get().choice,'random');
f.ctx.backupText=JSON.stringify({...backup,data:{'garden-mood':{choice:'random',current:'bad'}}});assert.throws(()=>vm.runInContext('validStudyBackup(backupText)',f.ctx));
assert.equal(make(new Map([['garden-mood','invalid json']])).api.current().key,'greeting');
const sw=fs.readFileSync(root+'/sw.js','utf8');for(const item of mood.items)for(const key of ['src','poster'])assert(sw.includes('"./'+item[key]+'"'));
console.log('Mood picker: 8 choices + random, PIN preserved, invalid PIN does not resolve random, completed draw retained through login, hub/refresh persistence, no duplicate drawing, cancellation, static previews, reduced motion, eight encouragement captions, fallback, backup validation/restore and offline assets passed.');

// Each mood has ten distinct phrases per cycle; bags persist across reload and backup.
const phraseFixture=make(new Map());const captionsFor=api=>api.markup().match(/<figcaption>(.*?)<\/figcaption>/)[1];
for(const item of phraseFixture.api.items){
 const api=phraseFixture.api;api.choose(item.key);api.leaveWelcome();let previous;
 for(let cycle=0;cycle<3;cycle++){
  const seen=new Set();
  for(let i=0;i<10;i++){
   const text=captionsFor(api);assert(text&&text!==previous,'no adjacent repeats: '+item.key);assert(!seen.has(text),'ten unique per cycle');seen.add(text);previous=text;
   assert.equal(captionsFor(api),text,'stable markup while on hub');
   api.reload();assert(api.valid(api.get())); // reload keeps unused phrase indexes
  }
  assert.equal(seen.size,10);
 }
}
const savedMood=phraseFixture.api.get();phraseFixture.ctx.backupText=JSON.stringify({app:'liah-learning-garden',format:1,data:{'garden-mood':savedMood}});
vm.runInContext('applyStudyBackup(validStudyBackup(backupText))',phraseFixture.ctx);assert.deepEqual(phraseFixture.api.get(),savedMood);
for(const messages of [[],{bad:{last:0,remaining:[1]}},{greeting:{last:0,remaining:[0]}},{greeting:{last:0,remaining:[1,1]}},{greeting:{last:10,remaining:[]}}]){
 const value={choice:'greeting',current:'greeting',messages};assert(!phraseFixture.api.valid(value));
 phraseFixture.ctx.backupText=JSON.stringify({app:'liah-learning-garden',format:1,data:{'garden-mood':value}});assert.throws(()=>vm.runInContext('validStudyBackup(backupText)',phraseFixture.ctx));
}
vm.runInContext("authenticated=true;hub()",phraseFixture.ctx);const beforeRefresh=captionsFor(phraseFixture.api);vm.runInContext('refreshCurrentScreen()',phraseFixture.ctx);assert.equal(captionsFor(phraseFixture.api),beforeRefresh);
vm.runInContext("setStudyScreen('home');hub()",phraseFixture.ctx);assert.notEqual(captionsFor(phraseFixture.api),beforeRefresh);
console.log('80 encouragements: ten unique phrases per mood for three cycles, no boundary repeats, persisted bags, backup roundtrip/invalid rejection, stable hub refresh and fresh home entry passed.');

const cancelFixture=make(new Map());vm.runInContext('login()',cancelFixture.ctx);
cancelFixture.buttons().find(b=>b.dataset.mood==='sad').onclick();
cancelFixture.buttons().find(b=>b.dataset.mood==='random').onclick();cancelFixture.tick(300);
assert(cancelFixture.buttons().every(b=>b.attrs['aria-pressed']==='false'));
cancelFixture.api.cancelDraw();assert.equal(cancelFixture.api.current().key,'sad');
assert.equal(cancelFixture.buttons().filter(b=>b.attrs['aria-pressed']==='true').length,1);
assert.equal(cancelFixture.buttons().find(b=>b.attrs['aria-pressed']==='true').dataset.mood,'sad');
assert.equal(cancelFixture.pending(),0);assert(cancelFixture.buttons().every(b=>!b.disabled&&!b.classList.values.has('is-drawing')));
console.log('Random mood draw: prior selection hidden during every animation tick, exactly one moving highlight, winner-only final selection, cancellation restores previous mood and clears timers passed.');

const encouragementSource=fs.readFileSync(root+'/moods.js','utf8');
const encouragements=JSON.parse(encouragementSource.match(/const encouragement=(\{[\s\S]*?\});/)[1]);
assert.equal(Object.keys(encouragements).length,8);
for(const phrases of Object.values(encouragements)){assert.equal(phrases.length,10);assert.equal(new Set(phrases).size,10);for(const text of phrases)assert([...text].length<=14,text);}
console.log('Encouragement copy: all 80 phrases are 14 characters or fewer including spaces and punctuation.');
