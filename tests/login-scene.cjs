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
assert.equal(parseFloat(at(12,30).top),12);assert.equal(parseFloat(at(0,30).top),12);assert.equal(parseFloat(at(6).top),64);assert.equal(parseFloat(at(19).top),64);
for(const hours of [[6,7,8,9,10,11,12,13,14,15,16,17,18],[19,20,21,22,23,0,1,2,3,4,5]]){
 let previous=-1;for(const h of hours){const p=at(h);assert(p.progress>previous);assert(p.progress>=0&&p.progress<=1);assert(parseFloat(p.top)>=12&&parseFloat(p.top)<=64);previous=p.progress;}
}
const coords={};host.querySelector=()=>({style:{setProperty:(name,value)=>coords[name]=value}});hour=10;api.markup();api.bind(root);const before=coords['--orbit-left'];hour=11;visibility.get('visibilitychange')();assert.notEqual(coords['--orbit-left'],before);assert.equal(coords['--orbit-left'],at(11).left);assert.equal(jobs.size,1);assert([...jobs.values()].every(job=>job.delay>0&&job.delay<=10000));api.stop();assert.equal(jobs.size,0);
console.log('Sun/moon orbit: 06/19 switch, left-to-right progress, noon/midnight apex, early-morning wrap, live coordinates and bounded single update timer passed.');
