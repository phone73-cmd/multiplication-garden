const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const code=fs.readFileSync(__dirname+'/../offline.js','utf8'),html=fs.readFileSync(__dirname+'/../index.html','utf8');
function fixture(supported=true){
 const elements=new Map(),events={},sent=[],timeouts=new Map(),intervals=new Map();let seq=0;
 const nodes=id=>{if(!elements.has(id))elements.set(id,{textContent:'',hidden:id==='offline-panel',disabled:false,inert:false,attrs:{},setAttribute(k,v){this.attrs[k]=v;},contains(node){return node===this;},focus(){this.focused=true;}});return elements.get(id);};
 const worker=(state)=>({state,scriptURL:'https://example.test/multiplication-garden/sw.js',postMessage(data){sent.push({worker:this,...data});},addEventListener(type,fn){this[type]=fn;}});
 const active=worker('activated'),candidate=worker('installed');
 const registration={active,waiting:null,addEventListener:(type,fn)=>events['registration:'+type]=fn,update:async()=>{events.checked=(events.checked||0)+1;}};
 const serviceWorker={controller:active,register:async()=>registration,getRegistration:async()=>registration,addEventListener:(type,fn)=>events[type]=fn};
 const storage={pending:0,message:'',retry(){this.pending=0;this.message='';}},window={isSecureContext:true,GardenStorage:storage,addEventListener:(type,fn)=>events[type]=fn,GardenSession:{save(){}}};
 const document={baseURI:'https://example.test/multiplication-garden/',hidden:false,body:{dataset:{screen:'hub'}},getElementById:nodes,querySelector:selector=>selector==='.common-nav'?nodes('nav'):null,addEventListener:(type,fn)=>events[type]=fn};
 const navigator={onLine:true,storage:{persist:async()=>false,estimate:async()=>({usage:1024})}};if(supported)navigator.serviceWorker=serviceWorker;
 let reloads=0;vm.runInNewContext(code,{window,document,navigator,URL,Date,WeakSet,setTimeout(fn,ms){timeouts.set(++seq,{fn,ms});return seq;},clearTimeout:id=>timeouts.delete(id),setInterval(fn,ms){intervals.set(++seq,{fn,ms});return seq;},clearInterval:id=>intervals.delete(id),location:{reload(){reloads++;}}});
 const message=async(data,source=active)=>{events.message({data:{version:source===active?'2.0.1':'2.0.2',bundle:source===active?'current':'next',...data},source});await flush();};
 const offer=async()=>{registration.waiting=candidate;await message({type:'GARDEN_READY'},candidate);};
 return {window,document,navigator,registration,candidate,active,serviceWorker,nodes,events,sent,timeouts,intervals,message,offer,get reloads(){return reloads;}};
}
async function flush(){for(let i=0;i<8;i++)await Promise.resolve();}
(async()=>{
 const f=fixture();await flush();assert(f.sent.some(m=>m.type==='GARDEN_STATUS'));
 await f.message({type:'GARDEN_READY'});assert(f.window.GardenOffline.ready);assert(f.nodes('offline-status').textContent.includes('사용가능'));assert(f.nodes('offline-attention').hidden);
 f.nodes('offline-help').onclick();assert(!f.nodes('offline-panel').hidden);f.nodes('offline-close').onclick();assert(f.nodes('offline-panel').hidden);assert(f.nodes('offline-help').focused);
 f.navigator.onLine=false;f.events.offline();assert(!f.nodes('network-slash').hidden);assert(!f.nodes('badge-ready').hidden);assert(!f.nodes('app').inert);
 await f.offer();assert(!f.nodes('offline-attention').hidden);assert(!f.nodes('offline-update').hidden);
 f.document.body.dataset.screen='quiz';await f.nodes('offline-update').onclick();assert(!f.sent.some(m=>m.type==='GARDEN_APPLY'));
 f.document.body.dataset.screen='hub';f.window.GardenStorage.pending=1;await f.nodes('offline-update').onclick();assert(!f.sent.some(m=>m.type==='GARDEN_APPLY'));
 f.window.GardenStorage.pending=0;await f.nodes('offline-update').onclick();assert(f.nodes('app').inert);assert(!f.nodes('offline-help').disabled);assert.equal(f.nodes('offline-update').textContent,'적용 중…');
 let request=f.sent.findLast(m=>m.type==='GARDEN_APPLY');await f.message({type:'GARDEN_BLOCKED',message:'다른 창',requestId:request.requestId},f.candidate);assert(!f.nodes('app').inert);assert(!f.nodes('offline-update').disabled);assert.equal(f.nodes('offline-update').textContent,'다시 시도');
 await f.nodes('offline-update').onclick();request=f.sent.findLast(m=>m.type==='GARDEN_APPLY');assert(f.nodes('app').inert);
 // No controllerchange, no ACK, no statechange: bounded timeout restores controls.
 [...f.timeouts.values()].find(t=>t.ms===15000).fn();assert(!f.nodes('app').inert);assert(!f.nodes('offline-update').disabled);assert(f.nodes('offline-notice').textContent.includes('늦어지고'));await f.message({type:'GARDEN_READY'});assert(f.nodes('offline-notice').textContent.includes('늦어지고'));
 await f.nodes('offline-update').onclick();const next=f.sent.findLast(m=>m.type==='GARDEN_APPLY');assert.notEqual(next.requestId,request.requestId);
 await f.message({type:'GARDEN_ERROR',message:'late',requestId:request.requestId},f.candidate);assert(f.nodes('app').inert);
 // iOS-style missed controllerchange: polling sees verified actual takeover and reloads once.
 f.candidate.state='activated';f.registration.waiting=null;f.registration.active=f.candidate;f.serviceWorker.controller=f.candidate;
 await [...f.intervals.values()].find(t=>t.ms===1000).fn();await flush();assert.equal(f.reloads,1);assert(!f.nodes('offline-help').hidden);assert(!f.nodes('app').inert);[...f.timeouts.values()].find(t=>t.ms===5000).fn();assert(f.nodes('offline-notice').textContent.includes('화면이 바뀌지'));
 const g=fixture();await flush();g.events.controllerchange();await flush();assert.equal(g.reloads,0);
 // Stale installed handle must disappear when it is no longer actually waiting.
 await g.offer();g.candidate.state='activated';g.registration.waiting=null;g.events.pageshow();await flush();await g.message({type:'GARDEN_READY'});assert(g.nodes('offline-update').hidden);assert(g.nodes('offline-attention').hidden);
 g.nodes('offline-help').onclick();assert(!g.nodes('offline-panel').hidden);assert(g.nodes('offline-help').attrs['aria-expanded']==='true');
 g.events.keydown({key:'Escape',preventDefault(){}});assert(g.nodes('offline-panel').hidden);
 await g.message({type:'GARDEN_INCOMPLETE'});assert(!g.window.GardenOffline.ready);assert(!g.nodes('offline-retry').hidden);
 g.navigator.onLine=true;g.events.online();await flush();assert(g.sent.some(m=>m.type==='GARDEN_REPAIR'));
 await g.nodes('offline-storage').onclick();assert(g.nodes('offline-storage-info').textContent.includes('백업'));
 // A takeover by another window never reloads an in-progress lesson automatically.
 g.document.body.dataset.screen='quiz';await g.message({type:'GARDEN_READY',version:'2.0.2'});assert.equal(g.reloads,0);assert(!g.nodes('offline-update').hidden);
 g.document.body.dataset.screen='hub';await g.nodes('offline-update').onclick();assert.equal(g.reloads,1);
 const h=fixture(false);await flush();assert(h.nodes('offline-status').textContent.includes('사용불가'));assert(!h.nodes('app').inert);
 // Actual structural rules, not just fixture nodes.
 assert.equal((html.match(/class="status-icon"/g)||[]).length,3);assert(html.includes('grid-template-columns:minmax(0,1fr) 132px'));assert(html.includes('width:44px;height:44px'));assert(html.includes('position:absolute;z-index:1200'));
 assert(html.indexOf('id="network-state"')<html.indexOf('id="availability-state"'));assert(html.indexOf('id="availability-state"')<html.indexOf('id="offline-help"'));assert(html.indexOf('id="offline-help"')<html.indexOf('id="offline-panel"'));
 console.log('PASS: 3 fixed slots, paired layers, guide with/without dot, close/Escape, stale waiting removal, pending lesson protection, apply ACK/timeout/retry, missed-event recovery and no unsolicited reload.');
})().catch(e=>{console.error(e);process.exitCode=1;});
