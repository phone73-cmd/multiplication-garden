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
 for(const file of ['moods.js','study.js','questions.js','app.js']){
  let source=fs.readFileSync(root+'/'+file,'utf8');if(file==='app.js')source=source.replace('installPullToRefresh();authenticated?hub():login();','');vm.runInContext(source,ctx);
 }
 return {ctx,api:ctx.window.GardenMood,app,get,buttons:()=>buttons,welcome:()=>welcome,setReduced:v=>reduced=v,tick,pending:()=>jobs.size};
}
const f=make();const mood=f.api;
assert.equal(mood.items.length,8);assert.equal(mood.get().choice,'greeting');
vm.runInContext('login()',f.ctx);assert.equal(f.buttons().length,9);assert.equal((f.app.innerHTML.match(/type="button" class="mood-choice"/g)||[]).length,9);
f.get('#garden-code').value='0619';f.buttons().find(b=>b.dataset.mood==='random').onclick();
assert.equal(f.get('#garden-code').value,'0619');assert(mood.drawing());assert(f.buttons().every(b=>b.disabled));assert.equal(f.get('#garden-enter').disabled,true);
assert.equal(f.buttons().filter(b=>b.classList.values.has('is-drawing')).length,1);
assert.equal(randomCalls,1);
f.buttons().find(b=>b.dataset.mood==='random').onclick();assert.equal(randomCalls,1);
f.get('#login-form').onsubmit({preventDefault(){}});assert.equal(vm.runInContext('authenticated',f.ctx),false);
f.tick(1899);assert(mood.drawing());f.tick(1);
assert(!mood.drawing());assert.equal(mood.current().key,'determined');assert.equal(f.get('#mood-draw-status').textContent,'오늘은 다짐!');
assert.equal(f.buttons().filter(b=>b.attrs['aria-pressed']==='true').length,1);assert.equal(f.buttons().find(b=>b.attrs['aria-pressed']==='true').dataset.mood,'determined');
assert(f.buttons().every(b=>!b.disabled));assert.equal(f.get('#garden-enter').disabled,false);
f.get('#garden-code').value='0000';f.get('#login-form').onsubmit({preventDefault(){}});
assert.equal(randomCalls,1);assert.equal(vm.runInContext('authenticated',f.ctx),false);
f.get('#garden-code').value='0619';f.get('#login-form').onsubmit({preventDefault(){}});
const afterAdmission=randomCalls;assert.equal(afterAdmission,5);assert.equal(mood.current().key,'determined');assert.equal(vm.runInContext('screen',f.ctx),'hub');
assert.equal(f.welcome().src,'assets/moods/determined.webp');assert(!f.app.innerHTML.includes('class="study-sprouts"'));
assert(f.app.innerHTML.includes('하나씩 해보자. 넌 할 수 있어!'));
vm.runInContext('refreshCurrentScreen();hub()',f.ctx);assert.equal(randomCalls,afterAdmission);assert.equal(mood.current().key,'determined');
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
