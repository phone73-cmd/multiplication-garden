/* 지안이의 배움정원 v1.8.4: only this app's assets and cache names. */
const CACHE_NAME='learning-garden-v1.8.4';
const ASSETS=['./','./index.html','./app.js','./study.js','./times.js','./navigation.js','./appearance.js','./questions.js','./manifest.webmanifest','./dictation/index.html','./dictation/dictation.js','./icon-192.png','./icon-512.png','./icon.svg','./apple-touch-icon.png'];
const assetURLs=new Set(ASSETS.map(path=>new URL(path,self.registration.scope).href));
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('learning-garden-')&&key!==CACHE_NAME).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);url.search='';url.hash='';
  if(!assetURLs.has(url.href))return;
  event.respondWith((async()=>{
    try{
      const response=await fetch(event.request,{cache:'no-cache'});
      if(response.ok){const cache=await caches.open(CACHE_NAME);await cache.put(url.href,response.clone());}
      return response;
    }catch{
      const cache=await caches.open(CACHE_NAME),response=await cache.match(url.href);
      return response||new Response('오프라인 준비를 위해 인터넷에 연결한 뒤 다시 열어 주세요.',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}});
    }
  })());
});
