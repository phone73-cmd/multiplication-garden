const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const root=path.join(__dirname,'..'),data=new Map(),session=new Map();let randomCalls=0;
function make(saved=data){
 const nodes=new Map(),get=id=>{if(!nodes.has(id))nodes.set(id,{value:'',hidden:false,dataset:{},attrs:{},focus(){},setAttribute(k,v){this.attrs[k]=v;}});return nodes.get(id);};
 let markup='',buttons=[],welcome=null,reduced=false;
 const app={querySelectorAll:()=>buttons,querySelector:selector=>selector==='#welcome-mood-image'?welcome:null};
 Object.defineProperty(app,'innerHTML',{get:()=>markup,set(value){
  markup=value;buttons=[...value.matchAll(/data-mood="([^"]+)"/g)].map(m=>({dataset:{mood:m[1]},attrs:{},setAttribute(k,v){this.attrs[k]=v;}}));
  const m=value.match(/id="welcome-mood-image" src="([^"]+)" data-poster="([^"]+)"/);
  welcome=m?{src:m[1],dataset:{poster:m[2]}}:null;
 }});
 const math=Object.create(Math);math.random=()=>{randomCalls++;return .76;};
 const ctx=vm.createContext({console,Date,Math:math,Set,Map,Array,JSON,Number,String,RegExp,
 navigator:{},localStorage:{getItem:k=>saved.get(k)??null,setItem:(k,v)=>saved.set(k,v),removeItem:k=>saved.delete(k)},
 sessionStorage:{getItem:k=>session.get(k)??null,setItem:(k,v)=>session.set(k,v),removeItem:k=>session.delete(k)},
 document:{body:{dataset:{}},querySelector:s=>s==='#app'?app:get(s),querySelectorAll:()=>[]},
 window:{scrollY:0,scrollTo(){},matchMedia:()=>({matches:reduced}),GardenDictation:{mount:()=>({destroy(){},refresh(){},hasDraft:()=>false})}},confirm:()=>true,setTimeout(){}});
 for(const file of ['moods.js','study.js','questions.js','app.js']){
  let source=fs.readFileSync(root+'/'+file,'utf8');if(file==='app.js')source=source.replace('installPullToRefresh();authenticated?hub():login();','');vm.runInContext(source,ctx);
 }
 return {ctx,api:ctx.window.GardenMood,app,get,buttons:()=>buttons,welcome:()=>welcome,setReduced:v=>reduced=v};
}
const f=make();const mood=f.api;
assert.equal(mood.items.length,8);assert.equal(mood.get().choice,'greeting');
vm.runInContext('login()',f.ctx);assert.equal(f.buttons().length,9);assert.equal((f.app.innerHTML.match(/type="button" class="mood-choice"/g)||[]).length,9);
f.get('#garden-code').value='0619';f.buttons().find(b=>b.dataset.mood==='random').onclick();
assert.equal(f.get('#garden-code').value,'0619');assert.equal(f.buttons().filter(b=>b.attrs['aria-pressed']==='true').length,1);
f.get('#garden-code').value='0000';f.get('#login-form').onsubmit({preventDefault(){}});
assert.equal(randomCalls,0);assert.equal(vm.runInContext('authenticated',f.ctx),false);
f.get('#garden-code').value='0619';f.get('#login-form').onsubmit({preventDefault(){}});
assert.equal(randomCalls,1);assert.equal(mood.current().key,'determined');assert.equal(vm.runInContext('screen',f.ctx),'hub');
assert.equal(f.welcome().src,'assets/moods/determined.webp');assert(!f.app.innerHTML.includes('class="study-sprouts"'));
vm.runInContext('refreshCurrentScreen();hub()',f.ctx);assert.equal(randomCalls,1);assert.equal(mood.current().key,'determined');
const reboot=make();assert.equal(reboot.api.get().choice,'random');assert.equal(reboot.api.current().key,'determined');
vm.runInContext('hub()',reboot.ctx);assert.equal(reboot.welcome().src,'assets/moods/determined.webp');assert.equal(randomCalls,1);
for(const item of mood.items){assert(mood.choose(item.key));assert.equal(mood.enter().key,item.key);assert(mood.markup().includes(item.src));assert(fs.existsSync(root+'/'+item.src));assert(fs.existsSync(root+'/'+item.poster));}
assert.equal(mood.choose('bad'),false);
f.setReduced(true);vm.runInContext('hub()',f.ctx);assert(f.welcome().src.endsWith('-still.webp'));
f.setReduced(false);vm.runInContext('hub()',f.ctx);assert(!f.welcome().src.endsWith('-still.webp'));f.welcome().onerror();assert(f.welcome().src.endsWith('-still.webp'));
const backup={app:'liah-learning-garden',format:1,data:{'garden-mood':{choice:'random',current:'thinking'}}};
f.ctx.backupText=JSON.stringify(backup);vm.runInContext('applyStudyBackup(validStudyBackup(backupText));hub()',f.ctx);assert.equal(mood.current().key,'thinking');assert.equal(mood.get().choice,'random');
f.ctx.backupText=JSON.stringify({...backup,data:{'garden-mood':{choice:'random',current:'bad'}}});assert.throws(()=>vm.runInContext('validStudyBackup(backupText)',f.ctx));
assert.equal(make(new Map([['garden-mood','invalid json']])).api.current().key,'greeting');
const sw=fs.readFileSync(root+'/sw.js','utf8');for(const item of mood.items)for(const key of ['src','poster'])assert(sw.includes('"./'+item[key]+'"'));
console.log('Mood picker: 8 choices + random, PIN preserved, invalid PIN does not resolve random, one resolution per login, hub/refresh persistence, static previews, reduced motion, fallback, backup validation/restore and offline assets passed.');
