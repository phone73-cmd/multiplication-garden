const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const root=path.join(__dirname,'..'),html=fs.readFileSync(path.join(root,'dictation/index.html'),'utf8');
const scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]);scripts.forEach(script=>new vm.Script(script));
class Element{
 constructor(){this.hidden=false;this.children=[];this.style={setProperty(){}};this.dataset={};this.value='';this.firstChild={textContent:''};this.nextElementSibling={textContent:''};this.classList={toggle(){},add(){},remove(){}};this.listeners={};this.attrs={};}
 set innerHTML(value){this.children=Array.from({length:(value.match(/<span/g)||[]).length},()=>new Element());}
 setAttribute(k,v){this.attrs[k]=v;}getAttribute(k){return this.attrs[k]??null;}removeAttribute(k){delete this.attrs[k];}
 append(...nodes){this.children.push(...nodes);}appendChild(n){this.children.push(n);}replaceChildren(...nodes){this.children=nodes;}
 querySelector(){return new Element();}addEventListener(name,fn){this.listeners[name]=fn;}removeEventListener(){}focus(){}scrollIntoView(){}getContext(){return {setTransform(){}};}
}
function dictationContext(allow){
 const elements=new Map(),data=new Map(),redirects=[];
 const get=id=>{if(!elements.has(id))elements.set(id,new Element());return elements.get(id);};
 const parent={gardenAccess:()=>allow};
 const document={documentElement:new Element(),getElementById:get,querySelectorAll:()=>[],createElement:()=>new Element(),addEventListener(){},removeEventListener(){},body:new Element()};
 const window={parent,matchMedia:()=>({matches:false,addEventListener(){}}),scrollTo(){},addEventListener(){},scrollY:0};
 const context=vm.createContext({window,document,location:{origin:'https://example.test',replace:url=>redirects.push(url)},navigator:{userAgent:'test'},localStorage:{getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)},MutationObserver:class{observe(){}},setTimeout:()=>0,clearTimeout(){},cancelAnimationFrame(){},requestAnimationFrame(){return 0;},innerWidth:390,innerHeight:844,getComputedStyle:()=>({getPropertyValue:()=>''}),console});
 const apiExport="window.__dictationTest={DATA,SET,start,check,next,parseBackup,saveEditor,renderEditor,refreshApp,diff,getState:()=>S};\n";
 const script=scripts[1].replace("} else { location.replace('../?subject=dictation'); }",apiExport+"} else { location.replace('../?subject=dictation'); }");
 scripts.slice(0,1).forEach(s=>vm.runInContext(s,context));vm.runInContext(script,context);
 return {context,elements,data,redirects,window,api:window.__dictationTest};
}
(async()=>{
 const locked=dictationContext(false);assert.equal(locked.api,undefined);assert.equal(locked.redirects[0],'../?subject=dictation');
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
 assert(!html.includes('serviceWorker.register'));assert(!html.includes('caches.delete'));assert.equal(fixture.window.dictationHasDraft(),true);
 // Scoped worker must leave another GitHub Pages app's cache and requests alone.
 const events={},deleted=[];let fetchCalls=0;
 const scope='https://example.test/multiplication-garden/';
 const worker=vm.createContext({URL,Set,Response,self:{registration:{scope},clients:{claim(){}},skipWaiting(){},addEventListener:(name,fn)=>events[name]=fn},caches:{keys:async()=>['learning-garden-v1.5.0','learning-garden-v1.6.0','dictation-note-v1.1.4','other-app'],delete:async key=>deleted.push(key),open:async()=>({match:async()=>new Response('cached'),put:async()=>{}})},fetch:async()=>{fetchCalls++;throw Error('offline');}});
 vm.runInContext(fs.readFileSync(path.join(root,'sw.js'),'utf8'),worker);let activation;events.activate({waitUntil:p=>activation=p});await activation;assert.deepEqual(deleted,['learning-garden-v1.5.0']);
 let fallback;events.fetch({request:{method:'GET',url:scope+'dictation/index.html?v=1.6.0'},respondWith:p=>fallback=p});assert.equal(await(await fallback).text(),'cached');
 events.fetch({request:{method:'GET',url:'https://example.test/other-app/index.html'},respondWith(){throw Error('intercepted another app');}});assert.equal(fetchCalls,1);
 // Import validation plus rollback on a failed second storage write.
 const values=new Map([['garden-history','[{"score":70,"date":"old"}]'],['dictation-best','{"1":6}']]);let fail=true;
 const shared=vm.createContext({document:{querySelector:()=>({})},localStorage:{getItem:k=>values.get(k)??null,setItem:(k,v)=>{if(k==='dictation-best'&&fail){fail=false;throw Error('quota');}values.set(k,v);},removeItem:k=>values.delete(k)}});
 vm.runInContext(fs.readFileSync(path.join(root,'study.js'),'utf8')+'\nlet history=[];',shared);
 shared.backup={app:'liah-learning-garden',format:1,data:{'garden-history':[{score:90,date:'new'}],'dictation-best':{'1':10}}};
 assert.throws(()=>vm.runInContext('applyStudyBackup(validStudyBackup(JSON.stringify(backup)))',shared));assert.equal(JSON.parse(values.get('garden-history'))[0].score,70);assert.equal(JSON.parse(values.get('dictation-best'))['1'],6);
 vm.runInContext('applyStudyBackup(validStudyBackup(JSON.stringify(backup)))',shared);assert.equal(JSON.parse(values.get('garden-history'))[0].score,90);assert.equal(JSON.parse(values.get('dictation-best'))['1'],10);
 console.log(JSON.stringify({sentences,dictation:'admission, full 10-question controller, scoring, original storage, backup validation, editor limit and draft preservation passed',worker:'other app caches and paths preserved; offline fallback passed',backup:'validation and failed-write rollback passed',result:'passed'}));
})().catch(e=>{console.error(e);process.exit(1)});
