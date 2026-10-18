const fs=require('fs'),vm=require('vm'),assert=require('assert');
function fixture(saved=null,blocked=false,nativeAnimation=false,reducedMotion=false){
 let now=0,nextId=0;const animations=[],timers=new Map(),storage=new Map(saved===null?[]:[['garden-times-seconds',saved]]),nodes=new Map();
 class Clock extends Date{constructor(...args){super(...(args.length?args:[now]));}static now(){return now;}}
 const get=s=>{if(!nodes.has(s))nodes.set(s,{value:'',textContent:'',innerHTML:'',hidden:false,disabled:false,style:{},setAttribute(){},focus(){},isConnected:true});const node=nodes.get(s);if(nativeAnimation&&s==='#times-countdown-stroke')node.animate=(frames,options)=>{const animation={frames,options,canceled:false,cancel(){this.canceled=true;}};animations.push(animation);return animation;};return node;};
 const dialog={open:false,setAttribute(){},querySelector:get,showModal(){this.open=true;},close(){this.open=false;this.onclose?.();}};
 const ctx=vm.createContext({console,Date:Clock,Math,Set,Map,Array,JSON,Number,String,RegExp,navigator:{},localStorage:{getItem:k=>{if(blocked)throw Error('blocked');return storage.get(k)??null;},setItem:(k,v)=>{if(blocked)throw Error('blocked');storage.set(k,v);},removeItem:k=>storage.delete(k)},sessionStorage:{getItem:()=>null},document:{body:{dataset:{},appendChild(){}},activeElement:get('#draft'),querySelector:s=>get(s),querySelectorAll:()=>[],createElement:()=>dialog},window:{scrollTo(){},matchMedia:()=>({matches:reducedMotion})},confirm:()=>true,setTimeout(fn,delay){const id=++nextId;timers.set(id,{fn,at:now+delay});return id;},clearTimeout:id=>timers.delete(id)});
 for(const file of ['pictures.js','times.js','study.js','questions.js','navigation.js','app.js'])vm.runInContext(fs.readFileSync(__dirname+'/../'+file,'utf8').replace('installPullToRefresh();startGarden();',''),ctx);
 const run=s=>vm.runInContext(s,ctx);run("authenticated=true;screen='times'");
 const advance=ms=>{const end=now+ms;while(true){const entries=[...timers.entries()].filter(([,v])=>v.at<=end).sort((a,b)=>a[1].at-b[1].at);if(!entries.length)break;const [id,t]=entries[0];timers.delete(id);now=t.at;t.fn();}now=end;};
 return {ctx,run,get,dialog,storage,timers,advance,animations,garden:run('TimesGarden'),markup:()=>get('#app').innerHTML};
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

// The answer frame follows the same remaining time and stops on the same boundaries.
const ring=fixture(),rg=ring.garden;rg.timeLimit=5;rg.start([{a:3,b:4},{a:2,b:3}]);
assert(ring.markup().includes('class="times-answer-frame"'));assert(!ring.markup().includes('pathLength='));assert(!ring.markup().includes('non-scaling-stroke'));assert(!ring.get('#times-answer-timer').hidden);
assert.equal(+ring.get('#times-countdown-stroke').style.strokeDashoffset,0);ring.advance(2000);assert(Math.abs(+ring.get('#times-countdown-stroke').style.strokeDashoffset-40)<.001);assert.equal(ring.get('#times-feedback').textContent,'남은 시간 3초');
ring.advance(3000);assert(ring.get('#times-answer-timer').hidden);assert.equal(ring.get('#times-feedback').textContent,'천천히 생각해도 괜찮아요!!');assert(!rg.done);
ring.get('#times-answer').value='12';rg.submit();ring.advance(800);assert(!ring.get('#times-answer-timer').hidden);assert.equal(+ring.get('#times-countdown-stroke').style.strokeDashoffset,0);
ring.get('#times-answer').value='6';rg.submit();assert(ring.get('#times-answer-timer').hidden);ring.advance(800);rg.timeLimit=0;rg.start([{a:3,b:3}]);assert(ring.get('#times-answer-timer').hidden);
const smooth=fixture(null,false,true),sg=smooth.garden;sg.timeLimit=10;sg.start([{a:7,b:8}]);assert.equal(smooth.animations.length,1);assert.equal(smooth.animations[0].options.duration,10000);assert.equal(smooth.animations[0].options.easing,'linear');smooth.advance(2100);sg.pauseClock();assert(smooth.animations[0].canceled);assert(Math.abs(+smooth.get('#times-countdown-stroke').style.strokeDashoffset-21)<.001);smooth.advance(40000);sg.resumeClock();assert.equal(smooth.animations[1].options.duration,7900);assert(Math.abs(+smooth.animations[1].frames[0].strokeDashoffset-21)<.001);smooth.advance(7900);assert(smooth.animations[1].canceled);assert(smooth.get('#times-answer-timer').hidden);
const reduced=fixture(null,false,true,true);reduced.garden.timeLimit=5;reduced.garden.start([{a:2,b:2}]);assert.equal(reduced.animations.length,0);reduced.advance(5000);assert(reduced.get('#times-answer-timer').hidden);
console.log('Answer frame: stable input wrapper, matching numerical countdown/progress, expiry/reset/answer/untimed visibility, smooth native animation pause/resume and reduced-motion fallback passed.');

// Actual pixel perimeter is the dash length, at every input size. Even the first 250ms advances the line.
for(const [width,height,length] of [[56,36,164],[90,60,280],[120,80,380]]){
 const sized=fixture(null,false,true),gg=sized.garden,stroke=sized.get('#times-countdown-stroke'),attrs={};
 sized.get('#times-answer-timer').getBoundingClientRect=()=>({width,height});
 stroke.ownerSVGElement={setAttribute:(k,v)=>attrs[k]=v};stroke.setAttribute=(k,v)=>attrs[k]=v;stroke.getTotalLength=()=>length;
 gg.timeLimit=10;gg.start([{a:7,b:8}]);assert.equal(gg.clockPathLength,length);assert.equal(stroke.style.strokeDasharray,length+' '+length);assert.equal(attrs.viewBox,'0 0 '+width+' '+height);assert.equal(+sized.animations[0].frames[1].strokeDashoffset,length);assert.equal(sized.animations[0].options.duration,10000);
 sized.advance(250);gg.pauseClock();assert(Math.abs(+stroke.style.strokeDashoffset-length*.025)<.00001);
 sized.advance(1000);gg.resumeClock();assert.equal(sized.animations[1].options.duration,9750);assert(Math.abs(+sized.animations[1].frames[0].strokeDashoffset-length*.025)<.00001);
}
console.log('Actual perimeter: 3 input sizes, pixel viewBox/path measurement, matched dash/offset, progress after 250ms and unchanged remaining time on resume passed.');

const resize=fixture(null,false,true),rr=resize.garden;let resized,disconnected=0,width=60,length=180;
resize.ctx.ResizeObserver=class{constructor(fn){resized=fn;}observe(){}disconnect(){disconnected++;}};
resize.get('#times-answer-timer').getBoundingClientRect=()=>({width,height:40});const rp=resize.get('#times-countdown-stroke');rp.ownerSVGElement={setAttribute(){}};rp.getTotalLength=()=>length;rr.timeLimit=10;rr.start([{a:2,b:3}]);resize.advance(1000);width=90;length=240;resized();assert.equal(rr.remainingMs,9000);assert.equal(rr.clockPathLength,240);assert.equal(resize.animations.at(-1).options.duration,9000);assert(Math.abs(+resize.animations.at(-1).frames[0].strokeDashoffset-24)<.00001);rr.home();assert(disconnected>0);
console.log('Resize: remeasurement preserves deadline, proportion and animation duration; leaving disconnects observer passed.');
