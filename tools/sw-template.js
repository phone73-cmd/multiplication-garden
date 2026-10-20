// Cache Storage contains immutable application bundles, never learning data.
const PREFIX='learning-garden-',CACHE_NAME=PREFIX+'v'+RELEASE.version+'-'+RELEASE.id;
const scope=self.registration.scope;
const markerURL=new URL('./.offline-bundle-ready',scope).href;
const entries=new Map(RELEASE.files.map(file=>[new URL(file.path,scope).href,file]));
const home=new URL('./index.html',scope).href;
const report=async data=>{for(const client of await self.clients.matchAll({type:'window',includeUncontrolled:true}))if(client.url.startsWith(scope))client.postMessage({...data,version:RELEASE.version,bundle:RELEASE.id});};
const digest=async bytes=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');
async function valid(response,file){return !!response&&response.ok&&(await digest(await response.clone().arrayBuffer()))===file.sha256;}
async function download(url,file){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);
  try{
    const response=await fetch(url,{cache:'no-store',credentials:'same-origin',signal:controller.signal});
    if(!await valid(response,file))throw Error('파일 검증 실패: '+file.path);
    return response;
  }finally{clearTimeout(timer);}
}
async function prepare(repair=false){
  const cache=await caches.open(CACHE_NAME);let done=0;
  await report({type:'GARDEN_PROGRESS',done,total:entries.size});
  // Bounded concurrency keeps memory and connections small on phones.
  const queue=[...entries];
  await Promise.all(Array.from({length:3},async()=>{
    while(queue.length){const [url,file]=queue.shift();
      if(!repair||!await valid(await cache.match(url),file))await cache.put(url,await download(url,file));
      done++;await report({type:'GARDEN_PROGRESS',done,total:entries.size});
    }
  }));
  await cache.put(markerURL,new Response(JSON.stringify({version:RELEASE.version,id:RELEASE.id,complete:true}),{headers:{'Content-Type':'application/json'}}));
  await report({type:'GARDEN_READY',done,total:entries.size});
}
async function status(){
  const cache=await caches.open(CACHE_NAME);let done=0;
  for(const [url,file]of entries)if(await valid(await cache.match(url),file))done++;
  return {type:done===entries.size?'GARDEN_READY':'GARDEN_INCOMPLETE',done,total:entries.size,version:RELEASE.version,bundle:RELEASE.id};
}
self.addEventListener('install',event=>{
  event.waitUntil(prepare().catch(async error=>{
    await report({type:'GARDEN_ERROR',message:error.name==='QuotaExceededError'?'저장 공간이 부족해요. 기존 학습 데이터는 유지돼요.':'파일을 준비하지 못했어요. 인터넷 연결 후 다시 받아 주세요.'});
    // Failed candidates never activate or touch any previous bundle.
    throw error;
  }));
});
self.addEventListener('activate',event=>{
  // Keep previous bundles until the new page confirms it has started correctly.
  event.waitUntil(self.clients.claim());
});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);url.search='';url.hash='';
  if(url.href===scope)url.href=home;
  const file=entries.get(url.href);if(!file)return;
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE_NAME),saved=await cache.match(url.href);
    if(saved)return saved; // Never replace a release file with a different deployed version.
    try{
      const response=await download(url.href,file);
      try{await cache.put(url.href,response.clone());}catch{await report({type:'GARDEN_INCOMPLETE',done:0,total:entries.size});}
      return response;
    }catch{
      await report({type:'GARDEN_INCOMPLETE',done:0,total:entries.size});
      return new Response('오프라인 준비가 필요해요. 인터넷 연결 후 앱 아래에서 다시 받아 주세요.',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}});
    }
  })());
});
let repairing=null;
self.addEventListener('message',event=>{
  if(!event.source?.url?.startsWith(scope))return;
  const reply=data=>event.source.postMessage({...data,version:RELEASE.version,bundle:RELEASE.id,requestId:event.data?.requestId});
  const action=async()=>{
    if(event.data?.type==='GARDEN_STATUS')reply(await status());
    if(event.data?.type==='GARDEN_REPAIR'){
      if(!repairing)repairing=prepare(true).finally(()=>repairing=null);
      try{await repairing;}catch{reply({type:'GARDEN_ERROR',message:'다시 받지 못했어요. 연결과 저장 공간을 확인해 주세요.'});}
    }
    if(event.data?.type==='GARDEN_APPLY'){
      const tabs=(await self.clients.matchAll({type:'window',includeUncontrolled:true})).filter(c=>c.url.startsWith(scope));
      if(tabs.length>1){reply({type:'GARDEN_BLOCKED',message:'다른 배움정원 창을 닫은 뒤 적용해 주세요.'});return;}
      const current=await status();
      if(current.type!=='GARDEN_READY'){reply(current);return;}
      reply({type:'GARDEN_APPLY_ACCEPTED'});
      await self.skipWaiting();
    }
    if(event.data?.type==='GARDEN_HEALTHY'&&event.data.version===RELEASE.version){
      if(self.registration.installing||self.registration.waiting)return;
      const tabs=(await self.clients.matchAll({type:'window',includeUncontrolled:true})).filter(c=>c.url.startsWith(scope));
      if(tabs.length>1)return;
      const old=(await caches.keys()).filter(k=>k.startsWith(PREFIX)&&k!==CACHE_NAME);
      const complete=[];
      for(const name of old){
        const cache=await caches.open(name),marker=await cache.match(markerURL);
        if(marker&&await marker.json().then(m=>m.complete===true).catch(()=>false)||/^learning-garden-v\d+\.\d+\.\d+$/.test(name))complete.push(name);
      }
      // A failed staging bundle must never replace the last known complete version.
      const previous=complete.at(-1);
      for(const name of old)if(name!==previous)await caches.delete(name);
    }
  };
  event.waitUntil(action().catch(()=>reply({type:'GARDEN_ERROR',message:'저장된 파일을 확인하지 못했어요. 연결 후 다시 시도해 주세요.'})));
});
