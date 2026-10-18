/* 지안이의 배움정원 v1.8.11: only this app's assets and cache names. */
const CACHE_NAME='learning-garden-v1.8.11';
const ASSETS=['./','./index.html','./icons.js','./app.js','./moods.js','./study.js','./times.js','./navigation.js','./appearance.js','./questions.js','./manifest.webmanifest','./dictation/index.html','./dictation/dictation.js','./icon-192.png','./icon-512.png','./icon.svg','./apple-touch-icon.png'];
ASSETS.push("./assets/icons/rainbow.webp","./assets/icons/sunflower.webp","./assets/icons/book.webp","./assets/icons/numbers.webp","./assets/icons/dice.webp","./assets/icons/home.webp","./assets/icons/settings.webp","./assets/icons/logout.webp","./assets/icons/tulip.webp","./assets/icons/daisy.webp","./assets/icons/herb.webp","./assets/icons/sprout.webp","./assets/icons/sun.webp","./assets/icons/butterfly.webp","./assets/icons/snail.webp","./assets/icons/rabbit.webp","./assets/icons/frog.webp","./assets/icons/grasshopper.webp","./assets/icons/turtle.webp","./assets/icons/dog.webp","./assets/icons/cat.webp","./assets/icons/squirrel.webp","./assets/icons/horse.webp","./assets/icons/kangaroo.webp","./assets/icons/chick.webp","./assets/icons/duck.webp","./assets/icons/penguin.webp","./assets/icons/robot.webp","./assets/icons/car.webp","./assets/icons/race-car.webp","./assets/icons/train.webp","./assets/icons/bus.webp","./assets/icons/bicycle.webp","./assets/icons/soccer-ball.webp","./assets/icons/candy.webp","./assets/icons/apple.webp","./assets/icons/pencil.webp","./assets/icons/strawberry.webp","./assets/icons/star.webp","./assets/icons/orange.webp","./assets/icons/teddy-bear.webp","./assets/icons/red-counter.webp","./assets/icons/blue-counter.webp");
ASSETS.push("./assets/moods/greeting.webp","./assets/moods/greeting-still.webp","./assets/moods/eye-smile.webp","./assets/moods/eye-smile-still.webp","./assets/moods/excited.webp","./assets/moods/excited-still.webp","./assets/moods/surprised.webp","./assets/moods/surprised-still.webp","./assets/moods/thinking.webp","./assets/moods/thinking-still.webp","./assets/moods/sad.webp","./assets/moods/sad-still.webp","./assets/moods/determined.webp","./assets/moods/determined-still.webp","./assets/moods/sleepy.webp","./assets/moods/sleepy-still.webp");
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
