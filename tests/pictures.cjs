const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const root=path.join(__dirname,'..'),handlers={},nodes=new Map();
const get=s=>{if(!nodes.has(s))nodes.set(s,{value:'',innerHTML:'',classList:{toggle(){}},setAttribute(){}});return nodes.get(s);};
const ctx=vm.createContext({console,navigator:{},Math,Date,Set,Map,JSON,Number,String,RegExp,localStorage:{getItem:()=>null,setItem(){}},sessionStorage:{getItem:()=>null},document:{querySelector:get,querySelectorAll:()=>[],addEventListener:(n,fn)=>handlers[n]=fn,body:{dataset:{}}},window:{scrollTo(){}},setTimeout(){},clearTimeout(){},confirm:()=>true});
for(const file of ['pictures.js','times.js','study.js','questions.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),ctx);
vm.runInContext(fs.readFileSync(path.join(root,'app.js'),'utf8').replace('installPullToRefresh();startGarden();',''),ctx);
const api=vm.runInContext('({pictures:window.GardenPictures,times:TimesGarden,buildAssessment,makeQuestion,lifeScenes,expected,correct,movementPicture})',ctx);
const {pictures,times}=api,sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');
assert.equal(pictures.pools.fruits.length,11);assert.equal(pictures.pools.groups.length,28);assert.equal(pictures.pools.dense.length,14);
for(const pool of Object.values(pictures.pools))for(const item of pool){assert(fs.existsSync(path.join(root,item[2])));assert(sw.includes('./'+item[2]));}
let previous=null;for(let i=0;i<1000;i++){const next=pictures.choose('fruits',previous);assert(!previous||next[2]!==previous[2]);previous=next;}
vm.runInContext('authenticated=true',ctx);
times.mode='learn';times.dans=[9];times.home();get('#times-start').onclick();const first=times.learnFruit;
for(let b=1;b<=9;b++){
 times.b=b;times.learn();times.revealed=!times.revealed;times.learn();assert.strictEqual(times.learnFruit,first);
 const markup=vm.runInContext('app.innerHTML',ctx);assert.equal((markup.match(/class="picture-asset"/g)||[]).length,9*b);assert.equal(new Set([...markup.matchAll(/class="picture-asset" src="([^"]+)"/g)].map(m=>m[1])).size,1);assert(markup.includes(first[2]));assert(!markup.includes('<i></i>'));
}
times.home();get('#times-start').onclick();assert.notEqual(times.learnFruit[2],first[2]);
for(const t of [0,3,8])for(let round=0;round<20;round++){
 const qs=api.buildAssessment('all',30,String(t));let last=null;
 for(const q of qs){assert(!last||last[2]!==q.pictureItem[2]);last=q.pictureItem;assert(api.correct(q,api.expected(q)));const sources=[...q.visual.matchAll(/class="picture-asset" src="([^"]+)"/g)].map(m=>m[1]);assert.equal(sources.length,q.a*q.b);assert.equal(new Set(sources).size,1);assert.equal(sources[0],q.pictureItem[2]);assert(q.visual.includes(q.pictureItem[0]));}
}
for(let i=0;i<20;i++){
 const q=api.makeQuestion(7,'9',i,{a:9,b:9});assert.equal((q.visual.match(/class="movement-segment"/g)||[]).length,9);assert.equal((q.visual.match(/class="picture-mover"/g)||[]).length,2);for(const match of q.visual.matchAll(/href="([^"]+)"/g))assert(fs.existsSync(path.join(root,match[1])));
}
// On network/decode failure, one emoji replaces one asset; counts remain unchanged.
const fallback={hidden:true},img={classList:{contains:c=>c==='picture-asset'},nextElementSibling:fallback};handlers.error({target:img});assert(img.hidden);assert(!fallback.hidden);
const attrs={},svg={classList:{contains:c=>c==='picture-mover'},setAttribute:(k,v)=>attrs[k]=v,nextElementSibling:{setAttribute:(k,v)=>attrs['fallback-'+k]=v}};handlers.error({target:svg});assert.equal(attrs.visibility,'hidden');assert.equal(attrs['fallback-visibility'],'visible');
assert.equal(pictures.object(['빨간 구슬','🔴']),'🔴');
console.log('Pictures: 11 fruits, 28 grouped / 14 array objects; 9-table session stability/restart; 1,800 generated picture questions; 20 exact movement scenes; offline assets and image fallbacks passed.');
