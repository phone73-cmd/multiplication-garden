const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const setup=fs.readFileSync(__dirname+'/moods.cjs','utf8').split('const f=make();')[0];
const make=new Function('require','__dirname',setup+'\nreturn make;')(require,__dirname);
const data=new Map(),f=make(data),api=f.ctx.window.GardenFlowers,run=s=>vm.runInContext(s,f.ctx);
assert.equal(api.items.length,16);assert.equal(api.get(),null);
for(const item of api.items){const bytes=fs.readFileSync(path.join(__dirname,'..',item.src));assert(bytes.length>12,item.name+' image is empty');assert.equal(bytes.toString('ascii',0,4),'RIFF',item.name+' RIFF header');assert.equal(bytes.toString('ascii',8,12),'WEBP',item.name+' WebP header');assert.equal(bytes.readUInt32LE(4)+8,bytes.length,item.name+' image is truncated');}
run('login()');f.get('#garden-code').value='0000';f.get('#login-form').onsubmit({preventDefault(){}});assert.equal(api.get(),null);
f.get('#garden-code').value='0619';f.get('#login-form').onsubmit({preventDefault(){}});const first=api.current();assert(f.app.innerHTML.includes('<figcaption>'+first.name+'</figcaption>'));assert(fs.existsSync(path.join(__dirname,'..',first.src)));
run('refreshCurrentScreen();hub()');assert.equal(api.current().key,first.key);
const reboot=make(data);assert.equal(reboot.ctx.window.GardenFlowers.current().key,first.key);
run('logoutGarden()');f.get('#garden-code').value='0000';f.get('#login-form').onsubmit({preventDefault(){}});assert.equal(api.current().key,first.key);f.get('#garden-code').value='0619';f.get('#login-form').onsubmit({preventDefault(){}});assert.notEqual(api.current().key,first.key);
const seen=new Set();for(let i=0;i<500;i++){f.ctx.Math.random=()=>((i*37)%500)/500;const old=api.current().key,item=api.enter();assert.notEqual(item.key,old);seen.add(item.key);}assert.equal(seen.size,16);
const backup={app:'liah-learning-garden',format:1,data:{'garden-welcome-flower':{current:'rose'}}};f.ctx.backupText=JSON.stringify(backup);run('applyStudyBackup(validStudyBackup(backupText));hub()');assert.equal(api.current().name,'장미');
for(const value of [{current:'bad'},[],null]){f.ctx.backupText=JSON.stringify({...backup,data:{'garden-welcome-flower':value}});assert.throws(()=>run('validStudyBackup(backupText)'));}
const sw=fs.readFileSync(__dirname+'/../sw.js','utf8');assert(sw.includes('"./flowers.js"'));for(const item of api.items)assert(sw.includes(JSON.stringify('./'+item.src)));
const unavailable=new Map();unavailable.set=()=>{throw Error('full');};const restricted=make(unavailable).ctx.window.GardenFlowers;const initial=restricted.enter();assert.notEqual(restricted.enter().key,initial.key);
console.log('Flowers: 16 names/assets, successful-login-only draw, previous excluded, stable hub/refresh/reload, all flowers reachable, backup validation/restore, storage failure and offline assets passed.');

const admission=new Set();for(let i=0;i<100;i++){
 f.ctx.Math.random=()=>((i*37)%100)/100;
 const copy=api.loginMarkup(),icons=[...copy.matchAll(/class="login-entry-flower" src="([^"]+)"/g)].map(m=>m[1]);
 assert.equal(icons.length,2);assert.notEqual(icons[0],icons[1]);assert.equal(api.loginMarkup(),copy);icons.forEach(src=>admission.add(src));
 api.enter();
}
assert(admission.size>2);console.log('Admission flowers: two distinct existing images, stable during login, randomized between visits, unchanged admission label passed.');
