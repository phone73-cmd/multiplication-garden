const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
let hour=10,id=0,random=.2;const jobs=new Map(),visibility=new Map();
class Clock extends Date{constructor(){super(2026,9,19,hour,0,0);}static now(){return new Clock().getTime();}}
const context=vm.createContext({Date:Clock,Math:Object.assign(Object.create(Math),{random:()=>random}),window:{},document:{hidden:false,addEventListener:(name,fn)=>visibility.set(name,fn),removeEventListener:name=>visibility.delete(name)},setTimeout:(fn,delay)=>{const n=++id;jobs.set(n,{fn,delay});return n;},clearTimeout:n=>jobs.delete(n)});
vm.runInContext(fs.readFileSync(__dirname+'/../login-scene.js','utf8'),context);const api=context.window.GardenScene;
for(const [h,p]of [[0,'night'],[5,'night'],[6,'day'],[15,'day'],[16,'dusk'],[18,'dusk'],[19,'night'],[23,'night']])assert.equal(api.period({getHours:()=>h}),p);
const makeNode=()=>({attrs:{},innerHTML:'',setAttribute(k,v){this.attrs[k]=v;},querySelectorAll:()=>[]});
const sky=makeNode(),host=makeNode(),root={querySelector:s=>s==='.login-sky'?sky:s==='#login-scene'?host:null};
let html=api.markup();assert.equal((html.match(/class="scene-grasshopper"/g)||[]).length,2);assert(html.includes('dragonfly-flying.webp'));assert(html.includes('butterfly-flying.webp'));assert(html.includes('sun.webp'));assert(!html.includes('moth.webp'));
api.bind(root);assert.equal(sky.attrs['data-period'],'day');assert.equal(jobs.size,1);const daytime=host.innerHTML;
for(const match of daytime.matchAll(/src="([^"]+)"/g))assert(fs.existsSync(path.join(__dirname,'..',match[1])));
hour=16;visibility.get('visibilitychange')();assert.equal(sky.attrs['data-period'],'dusk');assert(host.innerHTML.includes('sun.webp'));assert.equal(jobs.size,1);
hour=19;visibility.get('visibilitychange')();assert.equal(sky.attrs['data-period'],'night');assert(host.innerHTML.includes('moon.webp'));assert(host.innerHTML.includes('moth.webp'));assert(host.innerHTML.includes('firefly.webp'));assert(host.innerHTML.includes('scene-stars'));assert(!host.innerHTML.includes('butterfly-flying.webp'));assert.equal((host.innerHTML.match(/class="scene-grasshopper"/g)||[]).length,2);
const night=host.innerHTML;visibility.get('visibilitychange')();assert.equal(host.innerHTML,night);api.stop();assert.equal(jobs.size,0);assert.equal(visibility.size,0);
random=.8;hour=6;html=api.markup();assert.equal((html.match(/class="scene-grasshopper"/g)||[]).length,3);api.bind(root);api.bind(root);assert.equal(jobs.size,1);api.stop();
const sw=fs.readFileSync(__dirname+'/../sw.js','utf8');for(const name of ['sun','moon','dragonfly-flying','butterfly-flying','moth','firefly']){const rel='assets/login-scene/'+name+'.webp';assert(sw.includes('./'+rel));const b=fs.readFileSync(path.join(__dirname,'..',rel));assert.equal(b.toString('ascii',0,4),'RIFF');assert.equal(b.readUInt32LE(4)+8,b.length);}
console.log('Login scene: local 06/16/19 boundaries, day/night assets, 2/3 grasshoppers, stable placement, 10-second/visibility updates, single timer cleanup and offline images passed.');

const at=(h,m=0)=>api.orbit({getHours:()=>h,getMinutes:()=>m,getSeconds:()=>0});
assert.equal(at(6).kind,'sun');assert.equal(at(6).progress,0);assert.equal(at(12,30).progress,.5);assert.equal(at(19).kind,'moon');assert.equal(at(19).progress,0);assert.equal(at(0,30).progress,.5);assert(at(5,59).progress>.99);assert(at(18,59).progress>.99);
assert.equal(parseFloat(at(12,30).top),10);assert.equal(parseFloat(at(0,30).top),10);assert.equal(parseFloat(at(6).top),38);assert.equal(parseFloat(at(19).top),38);
for(const hours of [[6,7,8,9,10,11,12,13,14,15,16,17,18],[19,20,21,22,23,0,1,2,3,4,5]]){
 let previous=-1;for(const h of hours){const p=at(h);assert(p.progress>previous);assert(p.progress>=0&&p.progress<=1);assert(parseFloat(p.top)>=10&&parseFloat(p.top)<=38);previous=p.progress;}
}
const coords={};host.querySelector=()=>({style:{setProperty:(name,value)=>coords[name]=value}});hour=10;api.markup();api.bind(root);const before=coords['--orbit-left'];hour=11;visibility.get('visibilitychange')();assert.notEqual(coords['--orbit-left'],before);assert.equal(coords['--orbit-left'],at(11).left);assert.equal(jobs.size,1);assert([...jobs.values()].every(job=>job.delay>0&&job.delay<=10000));api.stop();assert.equal(jobs.size,0);
console.log('Sun/moon orbit: 06/19 switch, left-to-right progress, noon/midnight apex, early-morning wrap, live coordinates and bounded single update timer passed.');
// Wide daytime routes use the garden width and keep the whole 48px icon inside the sky.
hour=10;const flight=api.markup(),lanes=[...flight.matchAll(/class="scene-flight-lane" style="([^"]+)"/g)].map(m=>Object.fromEntries(m[1].split(';').map(v=>v.split(':'))));
assert.equal(lanes.length,2);assert.notEqual(lanes[0]['--duration'],lanes[1]['--duration']);assert.notEqual(lanes[0]['--flight-y'],lanes[1]['--flight-y']);assert.equal((flight.match(/scene-traveler-reverse/g)||[]).length,1);
for(const lane of lanes){const start=parseFloat(lane['--lane-left'])/100,distance=parseFloat(lane['--distance'])/100;assert(distance>=.4&&distance<=.6);for(const width of [220,280,320,360,460])for(const progress of [0,.1,.5,.9,1]){const left=width*(start+distance*progress);assert(left>=0);assert(left+48<=width);}}
api.bind(root);const stable=host.innerHTML;hour=11;visibility.get('visibilitychange')();assert.equal(host.innerHTML,stable);hour=16;visibility.get('visibilitychange')();assert(host.innerHTML.includes('scene-flight-lane'));hour=19;visibility.get('visibilitychange')();assert(!host.innerHTML.includes('scene-flight-lane'));assert(host.innerHTML.includes('moth.webp'));api.stop();assert.equal(jobs.size,0);
console.log('Daytime flights: 44/58% garden-width travel, separate height/speed/reverse start, 5 viewport widths stay within bounds, clock updates do not restart flights and night route unchanged passed.');

// Decorative clouds stay above the celestial layer; the expanded sky separates flowers and sun/moon.
hour=10;const withClouds=api.markup();assert.equal((withClouds.match(/class="scene-cloud scene-cloud-/g)||[]).length,2);assert.equal((withClouds.match(/src="assets\/login-scene\/cloud.webp"/g)||[]).length,2);
const htmlSource=fs.readFileSync(__dirname+'/../index.html','utf8'),appSource=fs.readFileSync(__dirname+'/../app.js','utf8');
assert(appSource.includes('<h1 id="login-title" lang="en">Jian’s Learning Garden</h1>'));assert(!appSource.includes('garden-cloud cloud-one'));assert(htmlSource.includes('.login-sky{height:305px}'));assert(htmlSource.includes('.login-sky{height:280px}'));assert(htmlSource.includes('.scene-celestial{z-index:1}'));assert(htmlSource.includes('z-index:2;opacity:.9'));assert(htmlSource.includes('white-space:nowrap;margin:12px 0'));
for(let h=0;h<24;h++)for(let m=0;m<60;m++)assert(parseFloat(at(h,m).top)+65<280-8-151-4);
const cloud=fs.readFileSync(__dirname+'/../assets/login-scene/cloud.webp');assert.equal(cloud.toString('ascii',0,4),'RIFF');assert.equal(cloud.readUInt32LE(4)+8,cloud.length);assert(sw.includes('./assets/login-scene/cloud.webp'));
console.log('Expanded sky: single-line English title, 70px sky growth, 2 existing clouds in front, all-minute celestial bounds clear of flower heads and offline cloud asset passed.');
