const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
let hour=10,id=0,random=.2;const jobs=new Map(),visibility=new Map();
class Clock extends Date{constructor(){super(2026,9,19,hour,0,0);}static now(){return new Clock().getTime();}}
const context=vm.createContext({Date:Clock,Math:Object.assign(Object.create(Math),{random:()=>random}),window:{},document:{hidden:false,addEventListener:(name,fn)=>visibility.set(name,fn),removeEventListener:name=>visibility.delete(name)},setTimeout:(fn,delay)=>{const n=++id;jobs.set(n,{fn,delay});return n;},clearTimeout:n=>jobs.delete(n)});
vm.runInContext(fs.readFileSync(__dirname+'/../login-scene.js','utf8'),context);const api=context.window.GardenScene;
for(const [h,p]of [[0,'night'],[5,'night'],[6,'day'],[15,'day'],[16,'dusk'],[18,'dusk'],[19,'night'],[23,'night']])assert.equal(api.period({getHours:()=>h}),p);
const makeNode=()=>({attrs:{},innerHTML:'',setAttribute(k,v){this.attrs[k]=v;},querySelectorAll:()=>[]});
const sky=makeNode(),host=makeNode(),root={querySelector:s=>s==='.login-sky'?sky:s==='#login-scene'?host:null};
let html=api.markup();assert.equal((html.match(/class="scene-grasshopper"/g)||[]).length,1);assert(html.includes('dragonfly-flying.webp'));assert(html.includes('butterfly-flying.webp'));assert(html.includes('sun.webp'));assert(!html.includes('moth.webp'));
api.bind(root);assert.equal(sky.attrs['data-period'],'day');assert.equal(jobs.size,1);const daytime=host.innerHTML;
for(const match of daytime.matchAll(/src="([^"]+)"/g))assert(fs.existsSync(path.join(__dirname,'..',match[1])));
hour=16;visibility.get('visibilitychange')();assert.equal(sky.attrs['data-period'],'dusk');assert(host.innerHTML.includes('sun.webp'));assert.equal(jobs.size,1);
hour=19;visibility.get('visibilitychange')();assert.equal(sky.attrs['data-period'],'night');assert(host.innerHTML.includes('moon.webp'));assert(host.innerHTML.includes('moth.webp'));assert(host.innerHTML.includes('firefly.webp'));assert(host.innerHTML.includes('scene-stars'));assert(!host.innerHTML.includes('butterfly-flying.webp'));assert.equal((host.innerHTML.match(/class="scene-grasshopper"/g)||[]).length,1);
const night=host.innerHTML;visibility.get('visibilitychange')();assert.equal(host.innerHTML,night);api.stop();assert.equal(jobs.size,0);assert.equal(visibility.size,0);
random=.8;hour=6;html=api.markup();assert.equal((html.match(/class="scene-grasshopper"/g)||[]).length,2);api.bind(root);api.bind(root);assert.equal(jobs.size,1);api.stop();
const sw=fs.readFileSync(__dirname+'/../sw.js','utf8');for(const name of ['sun','moon','dragonfly-flying','butterfly-flying','moth','firefly']){const rel='assets/login-scene/'+name+'.webp';assert(sw.includes('./'+rel));const b=fs.readFileSync(path.join(__dirname,'..',rel));assert.equal(b.toString('ascii',0,4),'RIFF');assert.equal(b.readUInt32LE(4)+8,b.length);}
console.log('Login scene: local 06/16/19 boundaries, day/night assets, 1/2 grasshoppers, stable placement, minute/visibility updates, single timer cleanup and offline images passed.');
