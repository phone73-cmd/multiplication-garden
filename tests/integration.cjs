const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const root=path.join(__dirname,'..'),html=fs.readFileSync(path.join(root,'dictation/index.html'),'utf8');
const moduleSource=fs.readFileSync(path.join(root,'dictation/dictation.js'),'utf8');new vm.Script(moduleSource);
class Element{
 constructor(){this.hidden=false;this.children=[];this.style={setProperty(){}};this.dataset={};this.value='';this.firstChild={textContent:''};this.nextElementSibling={textContent:''};this.classList={toggle(){},add(){},remove(){}};this.listeners={};this.attrs={};}
 set innerHTML(value){this.children=Array.from({length:(value.match(/<span/g)||[]).length},()=>new Element());}
 setAttribute(k,v){this.attrs[k]=v;}getAttribute(k){return this.attrs[k]??null;}removeAttribute(k){delete this.attrs[k];}
 append(...nodes){this.children.push(...nodes);}appendChild(n){this.children.push(n);}replaceChildren(...nodes){this.children=nodes;}
 querySelector(){return new Element();}addEventListener(name,fn){this.listeners[name]=fn;}removeEventListener(){}focus(){}scrollIntoView(){}getContext(){return {setTransform(){}};}
}
function dictationContext(allow,options={}){
 const elements=new Map(),data=new Map(),redirects=[];
 const get=id=>{if(!elements.has(id))elements.set(id,new Element());return elements.get(id);};
 const view=new Element();view.getElementById=get;view.querySelectorAll=()=>[];
 const document={documentElement:new Element(),getElementById:get,querySelectorAll:()=>[],createElement:()=>new Element(),addEventListener(){},removeEventListener(){},body:new Element()};
 const window={setTimeout:()=>0,clearTimeout(){},matchMedia:()=>({matches:false,addEventListener(){}}),scrollTo(){},addEventListener(){},scrollY:0};
 Object.assign(window,options.window);
 const context=vm.createContext({window,document,location:{origin:'https://example.test',replace:url=>redirects.push(url)},navigator:{userAgent:'test'},localStorage:{getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)},MutationObserver:class{observe(){}},setTimeout:()=>0,clearTimeout(){},cancelAnimationFrame(){},requestAnimationFrame(){return 0;},innerWidth:390,innerHeight:844,getComputedStyle:()=>({getPropertyValue:()=>''}),console,...options.globals});
 const source=moduleSource.replace('return {\n  hasDraft,','return {\n  __test:{DATA,SET,start,check,next,parseBackup,saveEditor,renderEditor,diff,getState:()=>S},\n  hasDraft,');
 vm.runInContext(source,context);
 const host=new Element();host.attachShadow=()=>view;
 const controller=window.GardenDictation.mount(host);
 window.dictationHasDraft=controller.hasDraft;
 const api=controller.__test;api.refreshApp=controller.refresh;

 return {context,elements,data,redirects,window,api,controller,view};
}
(async()=>{
 assert(html.includes('url=../'));assert(!moduleSource.includes('<iframe'));
 assert(!moduleSource.includes('id=\"ver\"'));
 const fixture=dictationContext(true),{api,elements,data}=fixture;assert.equal(api.DATA.length,10);assert.equal(api.DATA.reduce((n,d)=>n+d.items.length,0),100);
 let sentences=0;for(const grade of api.DATA)for(const sentence of grade.items){assert(api.diff(sentence,sentence,true).ok);assert(!api.diff(sentence,sentence+'가',true).ok);assert(api.diff(sentence,sentence.replace(/\s/g,''),false).ok);sentences++;}
 assert(!api.diff('함께 먹고 싶어.','함께  먹고 싶어.',true).ok);
 // Complete ten real controller questions and verify the original record keys.
 api.start(1);for(let i=0;i<10;i++){elements.get('answer').value=api.DATA[0].items[i];api.check();api.next();}
 assert.equal(JSON.parse(data.get('dictation-best'))['1'],10);assert.equal(JSON.parse(data.get('dictation-stats'))['1'].runs,1);assert.equal(JSON.parse(data.get('dictation-wrong'))['1'],undefined);
 api.renderEditor(1);elements.set('ed0',elements.get('edList').children[0].children[1]);assert.equal(elements.get('edList').children[0].children[1].maxLength,100);
 assert(api.parseBackup(JSON.stringify({app:'dictation-note',version:1,items:{1:api.DATA[0].items}})));
 const long=api.DATA[0].items.slice();long[0]='가'.repeat(101);assert.equal(api.parseBackup(JSON.stringify({app:'dictation-note',version:1,items:{1:long}})),null);
 // Drafts survive both the child's refresh and parent-triggered refresh policy.
 elements.get('settings').hidden=false;elements.get('home').hidden=true;elements.get('quiz').hidden=true;elements.get('ed0').value='작성 중인 문장';await api.refreshApp();assert.equal(elements.get('ed0').value,'작성 중인 문장');
 assert(!moduleSource.includes('serviceWorker.register'));assert(!moduleSource.includes('caches.delete'));assert.equal(fixture.window.dictationHasDraft(),true);
 // Scoped worker must leave another GitHub Pages app's cache and requests alone.
 const events={},deleted=[];let fetchCalls=0;
 const scope='https://example.test/multiplication-garden/';
 const worker=vm.createContext({URL,Set,Response,self:{registration:{scope},clients:{claim(){}},skipWaiting(){},addEventListener:(name,fn)=>events[name]=fn},caches:{keys:async()=>['learning-garden-v1.5.0','learning-garden-v1.8.9','dictation-note-v1.1.4','other-app'],delete:async key=>deleted.push(key),open:async()=>({match:async()=>new Response('cached'),put:async()=>{}})},fetch:async()=>{fetchCalls++;throw Error('offline');}});
 const workerSource=fs.readFileSync(path.join(root,'sw.js'),'utf8');assert(workerSource.includes("'./times.js'"));assert(workerSource.includes('learning-garden-v1.8.9'));vm.runInContext(workerSource,worker);let activation;events.activate({waitUntil:p=>activation=p});await activation;assert.deepEqual(deleted,['learning-garden-v1.5.0']);
 let fallback;events.fetch({request:{method:'GET',url:scope+'dictation/dictation.js?v=1.8.9'},respondWith:p=>fallback=p});assert.equal(await(await fallback).text(),'cached');
 events.fetch({request:{method:'GET',url:'https://example.test/other-app/index.html'},respondWith(){throw Error('intercepted another app');}});assert.equal(fetchCalls,1);
 // Import validation plus rollback on a failed second storage write.
 const values=new Map([['garden-history','[{"score":70,"date":"old"}]'],['dictation-best','{"1":6}']]);let fail=true;
 const shared=vm.createContext({window:{},document:{querySelector:()=>({})},localStorage:{getItem:k=>values.get(k)??null,setItem:(k,v)=>{if(k==='dictation-best'&&fail){fail=false;throw Error('quota');}values.set(k,v);},removeItem:k=>values.delete(k)}});
 vm.runInContext(fs.readFileSync(path.join(root,'study.js'),'utf8')+'\nlet history=[];',shared);
 shared.backup={app:'liah-learning-garden',format:1,data:{'garden-history':[{score:90,date:'new'}],'dictation-best':{'1':10}}};
 assert.throws(()=>vm.runInContext('applyStudyBackup(validStudyBackup(JSON.stringify(backup)))',shared));assert.equal(JSON.parse(values.get('garden-history'))[0].score,70);assert.equal(JSON.parse(values.get('dictation-best'))['1'],6);
 vm.runInContext('applyStudyBackup(validStudyBackup(JSON.stringify(backup)))',shared);assert.equal(JSON.parse(values.get('garden-history'))[0].score,90);assert.equal(JSON.parse(values.get('dictation-best'))['1'],10);
 fixture.controller.destroy();
 console.log(JSON.stringify({sentences,dictation:'admission, full 10-question controller, scoring, original storage, backup validation, editor limit and draft preservation passed',worker:'other app caches and paths preserved; offline fallback passed',backup:'validation and failed-write rollback passed',result:'passed'}));
})().catch(e=>{console.error(e);process.exit(1)});
// Common appearance migrates legacy choices once, persists, and follows system changes.
function appearanceFixture(legacy,current){
 const values=new Map();if(legacy)values.set('dictation-settings',JSON.stringify(legacy));if(current)values.set('garden-appearance',JSON.stringify(current));
 const tokens={},root=new Element(),schemeMeta={content:'only light',setAttribute(key,value){if(key==='content')this.content=value;}};root.style.setProperty=(key,value)=>tokens[key]=value;
 const media={matches:false,addEventListener:(name,fn)=>media.changed=fn};
 const ctx=vm.createContext({window:{matchMedia:()=>media},document:{documentElement:root,querySelector:selector=>selector==='meta[name="color-scheme"]'?schemeMeta:new Element()},localStorage:{getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)}});
 vm.runInContext(fs.readFileSync(path.join(__dirname,'../appearance.js'),'utf8'),ctx);
 return {api:ctx.window.GardenAppearance,values,tokens,root,media,schemeMeta};
}
const appearance=appearanceFixture({theme:'dark',palette:'lavender'});
assert.equal(appearance.api.get().theme,'dark');assert.equal(appearance.api.get().palette,'lavender');assert.equal(appearance.root.dataset.theme,'dark');assert.equal(appearance.root.style.colorScheme,'light dark');assert.equal(appearance.schemeMeta.content,'light dark');
assert.equal(JSON.parse(appearance.values.get('garden-appearance')).palette,'lavender');
for(const theme of ['light','dark','system'])for(const palette of ['pink','sky','mint','lavender','peach','lemon']){
 assert(appearance.api.choose({theme,palette}));assert(appearance.tokens['--bg']);assert(appearance.tokens['--accent']);assert(appearance.tokens['--ink']);
 assert.equal(JSON.parse(appearance.values.get('garden-appearance')).palette,palette);
}
appearance.media.matches=true;appearance.media.changed();assert.equal(appearance.root.dataset.theme,'dark');
appearance.media.matches=false;appearance.media.changed();assert.equal(appearance.root.dataset.theme,'light');assert.equal(appearance.root.style.colorScheme,'light dark');assert.equal(appearance.schemeMeta.content,'light dark');
const retained=appearanceFixture({theme:'dark',palette:'pink'},{theme:'light',palette:'mint'});assert.equal(retained.api.get().palette,'mint');assert.equal(retained.root.style.colorScheme,'light dark');
assert.equal(retained.api.choose({theme:'bad',palette:'bad'}),false);
const nativeTemplate=JSON.parse(moduleSource.match(/view\.innerHTML=(.*);\n/)[1]);
assert(!nativeTemplate.includes('id="ver"'));assert(!nativeTemplate.includes('화면설정'));assert(nativeTemplate.includes('aria-label="받아쓰기 홈"'));assert(nativeTemplate.includes('>🏠</span></button>'));assert(!nativeTemplate.includes('← 받아쓰기 홈'));
assert(!nativeTemplate.includes('iframe'));assert(!nativeTemplate.includes('overflow-y:'));assert(!nativeTemplate.includes('height:calc(100dvh'));
console.log('v1.6.1: shared 3 brightness / 6 palettes, legacy migration, persistence, system changes, native single document, grade navigation and one version passed');
