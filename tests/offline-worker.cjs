const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict'),{webcrypto}=require('node:crypto');
const root=path.join(__dirname,'..'),source=fs.readFileSync(path.join(root,'sw.js'),'utf8'),scope='https://example.test/multiplication-garden/';
function fixture(options={}){
 const events={},bundles=options.bundles||new Map(),messages=[],deleted=[];let network='ok',calls=0,skip=0,tabs=1;
 const bucket=name=>{if(!bundles.has(name))bundles.set(name,new Map());const data=bundles.get(name);return {async put(key,response){if(network==='quota')throw Object.assign(Error('full'),{name:'QuotaExceededError'});data.set(String(key),response.clone());},async match(key){return data.get(String(key))?.clone();}};};
 const client={url:scope,postMessage:data=>messages.push(data)};
 const context=vm.createContext({URL,Map,Set,Response,Uint8Array,AbortController,setTimeout,clearTimeout,crypto:webcrypto,
 self:{registration:{scope},clients:{claim:async()=>{},matchAll:async()=>Array.from({length:tabs},()=>client)},skipWaiting:async()=>{skip++;},addEventListener:(k,f)=>events[k]=f},
 caches:{open:async n=>bucket(n),keys:async()=>[...bundles.keys()],delete:async n=>{deleted.push(n);return bundles.delete(n);}},
 fetch:async url=>{calls++;if(network==='offline')throw Error('offline');if(network==='404')return new Response('missing',{status:404});const file=new URL(url).pathname.slice('/multiplication-garden/'.length);const bytes=options.changed?.get('./'+file)||fs.readFileSync(path.join(root,file));return new Response(network==='corrupt'?'bad':bytes);}});
 vm.runInContext(options.source||source,context);
 const run=async(type,event={})=>{let work;events[type]({...event,waitUntil:p=>work=p});await work;};
 return {context,bundles,messages,deleted,run,setNetwork:n=>network=n,setTabs:n=>tabs=n,get calls(){return calls;},get skipped(){return skip;},async fetch(file){let response;events.fetch({request:{method:'GET',url:scope+file},respondWith:p=>response=p});return response?await response:null;},async message(type,version='2.0.2'){await run('message',{data:{type,version},source:client});}};
}
(async()=>{
 const app=fixture();app.bundles.set('other-app',new Map());app.bundles.set('learning-garden-v1.7.0',new Map());app.bundles.set('learning-garden-v1.8.36',new Map());
 await app.run('install');assert.equal(app.skipped,0);assert.equal(app.messages.at(-1).type,'GARDEN_READY');
 await app.run('activate');assert.equal(app.deleted.length,0);
 const bundle=[...app.bundles.keys()].find(n=>n.includes('v2.0.2'));
 const before=app.calls;app.setNetwork('offline');const html=await app.fetch('');assert.equal(html.status,200);assert((await html.text()).includes('v2.0.2'));
 assert.equal((await app.fetch('app.js?v=2.0.2')).status,200);assert.equal(app.calls,before);
 await app.message('GARDEN_STATUS');assert.equal(app.messages.at(-1).type,'GARDEN_READY');
 app.bundles.get(bundle).delete(scope+'app.js');await app.message('GARDEN_STATUS');assert.equal(app.messages.at(-1).type,'GARDEN_INCOMPLETE');assert.equal((await app.fetch('app.js')).status,503);
 app.setNetwork('404');assert.equal((await app.fetch('app.js')).status,503);assert.equal(app.bundles.get(bundle).has(scope+'app.js'),false);
 app.setNetwork('corrupt');assert.equal((await app.fetch('app.js')).status,503);
 app.setNetwork('ok');await app.message('GARDEN_REPAIR');assert.equal(app.messages.at(-1).type,'GARDEN_READY');
 app.setTabs(2);await app.message('GARDEN_APPLY');assert.equal(app.skipped,0);assert.equal(app.messages.at(-1).type,'GARDEN_BLOCKED');
 app.setTabs(1);await app.message('GARDEN_APPLY');assert.equal(app.skipped,1);assert.equal(app.messages.at(-1).type,'GARDEN_APPLY_ACCEPTED');assert(app.messages.at(-1).bundle);
 await app.message('GARDEN_HEALTHY');assert.deepEqual(app.deleted,['learning-garden-v1.7.0']);assert(app.bundles.has('learning-garden-v1.8.36'));assert(app.bundles.has('other-app'));
 // A completed candidate can replace the worker only after explicit apply.
 const release=JSON.parse(source.match(/const RELEASE=([\s\S]+?);\n/)[1]),changed=new Map();
 release.version='2.0.3';release.id='0123456789abcdef';
 const item=release.files.find(f=>f.path==='./index.html');
 const newer=Buffer.from(fs.readFileSync(path.join(root,'index.html'),'utf8').replaceAll('2.0.2','2.0.3'));changed.set('./index.html',newer);
 item.sha256=require('node:crypto').createHash('sha256').update(newer).digest('hex');item.bytes=newer.length;
 const candidateSource=source.replace(/const RELEASE=[\s\S]+?;\n/,'const RELEASE='+JSON.stringify(release)+';\n');
 const candidate=fixture({source:candidateSource,changed,bundles:app.bundles});await candidate.run('install');assert.equal(candidate.skipped,0);
 assert((await (await app.fetch('')).text()).includes('v2.0.2'));
 await candidate.message('GARDEN_APPLY','2.0.3');assert.equal(candidate.skipped,1);await candidate.run('activate');
 assert((await (await candidate.fetch('')).text()).includes('v2.0.3'));
 candidate.bundles.set('learning-garden-v9.0.0-ffffffffffffffff',new Map());
 await candidate.message('GARDEN_HEALTHY','2.0.3');assert(candidate.bundles.has(bundle));assert(!candidate.bundles.has('learning-garden-v9.0.0-ffffffffffffffff'));
 // Requests outside this app's manifest are left alone.
 assert.equal(await app.fetch('../other/index.html'),null);
 for(const reason of ['404','corrupt','offline','quota']){const failed=fixture();failed.bundles.set('learning-garden-v1.8.36',new Map([['saved','old']]));failed.setNetwork(reason);await assert.rejects(failed.run('install'));assert.equal(failed.skipped,0);assert.equal(failed.bundles.get('learning-garden-v1.8.36').get('saved'),'old');}
 console.log('PASS: offline shell, versioned files, hash/HTTP failures, incomplete readiness, repair, quota, old bundle retention, multiple tabs, explicit activation and scope isolation.');
})().catch(e=>{console.error(e);process.exitCode=1;});
