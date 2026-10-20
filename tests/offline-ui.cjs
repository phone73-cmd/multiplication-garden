const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const code=fs.readFileSync(__dirname+'/../offline.js','utf8');
function fixture(supported=true){
 const elements=new Map(),events={},sent=[],nodes=id=>{if(!elements.has(id))elements.set(id,{textContent:'',hidden:false,disabled:false,inert:false});return elements.get(id);};
 const active={scriptURL:'https://example.test/multiplication-garden/sw.js',postMessage:data=>sent.push(data)},waiting={...active};
 const registration={active,waiting:null,addEventListener:(type,fn)=>events['registration:'+type]=fn,update:async()=>{events.checked=(events.checked||0)+1;}};
 const serviceWorker={controller:active,register:async()=>registration,addEventListener:(type,fn)=>events[type]=fn};
 const storage={pending:0,message:'',retry(){this.pending=0;this.message='';}},window={isSecureContext:true,GardenStorage:storage,addEventListener:(type,fn)=>events[type]=fn,GardenSession:{save(){}}};
 const document={baseURI:'https://example.test/multiplication-garden/',hidden:false,body:{dataset:{screen:'hub'}},getElementById:nodes,querySelector:selector=>selector==='header'?nodes('header'):null,addEventListener:(type,fn)=>events[type]=fn};
 const navigator={onLine:true,storage:{persist:async()=>false,estimate:async()=>({usage:1024})}};if(supported)navigator.serviceWorker=serviceWorker;
 let reloads=0;vm.runInNewContext(code,{window,document,navigator,URL,Date,setInterval(){},location:{reload(){reloads++;}}});
 const message=async(data,source=active)=>{await Promise.resolve();events.message({data,source});};
 return {window,document,navigator,registration,waiting,active,nodes,events,sent,message,get reloads(){return reloads;}};
}
(async()=>{
 const f=fixture();await new Promise(r=>setImmediate(r));assert(f.sent.some(m=>m.type==='GARDEN_STATUS'));
 await f.message({type:'GARDEN_READY'});assert(f.window.GardenOffline.ready);assert(f.nodes('offline-status').textContent.includes('준비 완료'));
 f.navigator.onLine=false;f.events.offline();assert(f.nodes('offline-status').textContent.includes('오프라인'));assert.equal(f.nodes('app').inert,false);
 f.registration.waiting=f.waiting;await f.message({type:'GARDEN_READY'},f.waiting);assert.equal(f.nodes('offline-update').hidden,false);
 f.document.body.dataset.screen='quiz';f.nodes('offline-update').onclick();assert(!f.sent.some(m=>m.type==='GARDEN_APPLY'));assert(f.nodes('offline-notice').textContent.includes('학습'));
 f.document.body.dataset.screen='hub';f.window.GardenStorage.pending=1;f.nodes('offline-update').onclick();assert(!f.sent.some(m=>m.type==='GARDEN_APPLY'));
 f.window.GardenStorage.pending=0;f.nodes('offline-update').onclick();assert(f.sent.some(m=>m.type==='GARDEN_APPLY'));assert(f.nodes('app').inert);
 await f.message({type:'GARDEN_BLOCKED',message:'다른 창'},f.waiting);assert.equal(f.nodes('app').inert,false);assert.equal(f.nodes('offline-update').disabled,false);
 f.nodes('offline-update').onclick();f.events.controllerchange();assert.equal(f.reloads,1);
 const g=fixture();await new Promise(r=>setImmediate(r));g.events.controllerchange();assert.equal(g.reloads,0);
 await g.message({type:'GARDEN_INCOMPLETE'});assert.equal(g.window.GardenOffline.ready,false);assert.equal(g.nodes('offline-retry').hidden,false);
 g.navigator.onLine=true;g.events.online();await new Promise(r=>setImmediate(r));assert(g.sent.some(m=>m.type==='GARDEN_REPAIR'));
 await g.nodes('offline-storage').onclick();assert(g.nodes('offline-storage-info').textContent.includes('バック')===false);assert(g.nodes('offline-storage-info').textContent.includes('백업'));
 const h=fixture(false);assert(h.nodes('offline-status').textContent.includes('지원하지'));assert.equal(h.nodes('app').inert,false);
 console.log('PASS: first control without reload, ready/offline UI, reconnect repair, blocked update during learning/pending saves/multiple tabs, explicit reload and unsupported environment fallback.');
})().catch(e=>{console.error(e);process.exitCode=1;});
