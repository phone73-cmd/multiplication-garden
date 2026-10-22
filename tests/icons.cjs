const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const root=path.join(__dirname,'..');
class Node{
 constructor(type,tag='',value=''){this.nodeType=type;this.tagName=tag.toUpperCase();this.nodeValue=value;this.childNodes=[];this.parentNode=null;this.className='';}
 get parentElement(){return this.parentNode?.nodeType===1?this.parentNode:null;}
 get isConnected(){return this===body||this===head||!!this.parentNode?.isConnected;}
 appendChild(n){if(n.nodeType===11){for(const child of [...n.childNodes])this.appendChild(child);return n;}n.parentNode=this;this.childNodes.push(n);return n;}
 replaceWith(n){const p=this.parentNode,i=p.childNodes.indexOf(this);const nodes=n.nodeType===11?[...n.childNodes]:[n];p.childNodes.splice(i,1,...nodes);nodes.forEach(x=>x.parentNode=p);this.parentNode=null;}
 closest(){for(let n=this;n;n=n.parentElement)if(['SCRIPT','STYLE','TEXTAREA','INPUT','OPTION','TITLE','SVG','MATH'].includes(n.tagName)||n.className==='garden-icon-fallback'||n.editable)return n;return null;}
 set textContent(t){this.childNodes=[];if(t)this.appendChild(new Node(3,'',t));}
 get textContent(){return this.nodeType===3?this.nodeValue:this.childNodes.map(x=>x.textContent).join('');}
}
const body=new Node(1,'body'),head=new Node(1,'head'),observers=[];
const document={body,head,createElement:t=>new Node(1,t),createTextNode:t=>new Node(3,'',t),createDocumentFragment:()=>new Node(11),
 createTreeWalker(root){const nodes=[];function visit(n){for(const c of n.childNodes){if(c.nodeType===3)nodes.push(c);visit(c);}}visit(root);let i=0;return {nextNode(){this.currentNode=nodes[i++];return !!this.currentNode;}};}};
class Observer{constructor(fn){this.fn=fn;observers.push(this);}observe(root){this.root=root;}disconnect(){this.stopped=true;}}
const window={};vm.runInNewContext(fs.readFileSync(root+'/icons.js','utf8'),{window,document,MutationObserver:Observer,Map,WeakMap});
const api=window.GardenIcons;assert.equal(api.catalog.length,43);
for(const item of api.catalog){assert(fs.existsSync(root+'/'+item.src));assert.equal(api.parts(item.emoji)[0].name,item.name);}
assert.equal(api.parts('🐿')[0].name,'squirrel');
const p=body.appendChild(new Node(1,'p'));p.textContent='사과 🍎🍎🍎 = 3';
observers[0].fn([{type:'childList',addedNodes:[p]}]);
assert.equal(p.childNodes.filter(n=>n.tagName==='IMG').length,3);
assert.equal(p.childNodes.filter(n=>n.nodeType===3).map(n=>n.nodeValue).join(''),'사과  = 3');
for(const tag of ['textarea','option','script','svg']){
 const el=body.appendChild(new Node(1,tag));el.textContent='🍎';observers[0].fn([{type:'childList',addedNodes:[el]}]);assert.equal(el.textContent,'🍎');assert.equal(el.childNodes[0].nodeType,3);
}
const img=p.childNodes.find(n=>n.tagName==='IMG');img.onerror();const fallback=p.childNodes.find(n=>n.className==='garden-icon-fallback');
observers[0].fn([{type:'childList',addedNodes:[fallback]}]);assert.equal(fallback.textContent,'🍎');assert.equal(fallback.childNodes[0].nodeType,3);
const shadow=new Node(11);const button=shadow.appendChild(new Node(1,'button'));button.textContent='🏠';
const stop=api.watch(shadow);assert.equal(button.childNodes[0].tagName,'IMG');assert.equal(button.childNodes[0].alt,'홈');stop();assert(observers[1].stopped);
const sw=fs.readFileSync(root+'/sw.js','utf8');
for(const item of api.catalog)assert(sw.includes("'./"+item.src+"'")||sw.includes('"./'+item.src+'"'));
const installManifest=JSON.parse(fs.readFileSync(root+'/manifest.webmanifest','utf8'));
for(const [file,size] of [['apple-touch-icon.png',180],['icon-192.png',192],['icon-512.png',512],['icon-maskable-512.png',512]]){
 const png=fs.readFileSync(root+'/'+file);assert.equal(png.subarray(1,4).toString(),'PNG');assert.equal(png.readUInt32BE(16),size);assert.equal(png.readUInt32BE(20),size);assert.equal(png[25],2);assert(sw.includes('./'+file));
}
assert(installManifest.icons.some(i=>i.purpose==='maskable'&&i.src.includes('icon-maskable-512.png')));
assert.equal(installManifest.icons.filter(i=>i.purpose==='any').length,2);
const installHtml=fs.readFileSync(root+'/index.html','utf8');assert(installHtml.includes('apple-touch-icon.png?v=2.0.2'));assert(installHtml.includes('manifest.webmanifest?v=2.0.2'));
console.log('43 icons: complete asset mapping, variation selectors, unchanged picture count/text, input/option/SVG preservation, image fallback, shadow root cleanup and offline inclusion passed.');
