const fs=require('fs'),vm=require('vm'),assert=require('assert');
const source=fs.readFileSync(__dirname+'/../appearance.js','utf8');
function fixture(saved,fail=false){
 const storage=new Map(saved?[['garden-appearance',JSON.stringify(saved)]]:[]),tokens={},root={dataset:{},style:{setProperty:(k,v)=>tokens[k]=v}},scheme={setAttribute(k,v){this[k]=v;}},note={hidden:true},notice={},openButton={};
 const media={matches:true,addEventListener(name,fn){this.change=fn;}};
 const button=(value,key,pressed)=>({dataset:{[key]:value},attrs:{'aria-pressed':pressed},setAttribute(k,v){this.attrs[k]=v;}});
 const box={themes:[],palettes:[],set innerHTML(s){this.markup=s;this.themes=[...s.matchAll(/data-theme-choice="([^"]+)" aria-pressed="([^"]+)"/g)].map(m=>button(m[1],'themeChoice',m[2]));this.palettes=[...s.matchAll(/data-palette="([^"]+)" aria-pressed="([^"]+)"/g)].map(m=>button(m[1],'palette',m[2]));},querySelectorAll(s){return s.includes('data-theme-choice')?this.themes:this.palettes;},showModal(){this.open=true;}};
 const body={style:{}};const doc={body,documentElement:root,querySelector:s=>s==='#appearance-dialog'?box:s==='#appearance-button'?openButton:s==='#samsung-theme-note'?note:s==='#appearance-notice'?notice:s==='meta[name="color-scheme"]'?scheme:{setAttribute(){}},querySelectorAll:s=>box.querySelectorAll(s)};
 const ctx=vm.createContext({window:{matchMedia:()=>media},document:doc,navigator:{userAgent:'SamsungBrowser/29.0'},localStorage:{getItem:k=>storage.get(k)??null,setItem(k,v){if(fail)throw Error('quota');storage.set(k,v);}}});
 vm.runInContext('let authenticated=true;'+source,ctx);openButton.onclick();
 return {api:ctx.window.GardenAppearance,box,storage,media,root,body,tokens,note,scheme,notice};
}
const f=fixture();
const choose=t=>f.box.themes.find(b=>b.dataset.themeChoice===t).onclick();
const selected=()=>f.box.themes.filter(b=>b.attrs['aria-pressed']==='true').map(b=>b.dataset.themeChoice);
assert.equal(f.box.themes.length,3);assert(!f.box.markup.includes('type="radio"'));assert.deepEqual(selected(),['system']);
choose('light');assert.deepEqual(selected(),['light']);assert.equal(f.api.get().theme,'light');assert.equal(f.root.dataset.theme,'light');assert.equal(f.root.style.colorScheme,'light dark');assert.equal(f.body.style.colorScheme,'only light');assert.equal(f.scheme.content,'light dark');assert.equal(f.tokens['--card'],'#ffffff');assert.equal(f.note.hidden,false);
f.media.matches=false;f.media.change();f.media.matches=true;f.media.change();assert.equal(f.root.dataset.theme,'light');assert.deepEqual(selected(),['light']);
f.box.palettes.find(b=>b.dataset.palette==='sky').onclick();assert.equal(f.api.get().theme,'light');assert.equal(f.api.get().palette,'sky');assert.deepEqual(selected(),['light']);
choose('dark');assert.deepEqual(selected(),['dark']);assert.equal(f.body.style.colorScheme,'only dark');assert.equal(f.root.dataset.theme,'dark');assert.equal(f.note.hidden,true);f.media.matches=false;f.media.change();assert.equal(f.root.dataset.theme,'dark');
choose('system');assert.equal(f.root.dataset.theme,'light');f.media.matches=true;f.media.change();assert.equal(f.root.dataset.theme,'dark');assert.deepEqual(selected(),['system']);
const restored=fixture(JSON.parse(f.storage.get('garden-appearance')));assert.equal(restored.api.get().theme,'system');assert.equal(restored.api.get().palette,'sky');
const denied=fixture({theme:'dark',palette:'mint'},true);denied.box.themes.find(b=>b.dataset.themeChoice==='light').onclick();assert.equal(denied.api.get().theme,'dark');assert.equal(denied.box.themes.filter(b=>b.attrs['aria-pressed']==='true')[0].dataset.themeChoice,'dark');assert(denied.notice.textContent.includes('저장하지 못'));
console.log('Appearance UI: exclusive clicks, forced light/dark independent of device, system tracking, palette preservation, persistence and failed save passed. Samsung rendering requires device verification.');
