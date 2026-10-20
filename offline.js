/* v2.0.0 — file readiness and connectivity are independent from learning. */
window.GardenOffline=(()=>{
  const version='2.0.0',base=new URL('./',document.baseURI);
  let registration=null,ready=false,progress='',problem='',waiting=null,applying=false,lastCheck=0,checking=false;
  const el=id=>document.getElementById(id);
  function paint(){
    const online=navigator.onLine!==false;
    el('offline-status').textContent=(online?'온라인':'오프라인')+' · '+(ready?'오프라인 사용 준비 완료'+(progress?' · '+progress:''):progress||'오프라인 준비 확인 중');
    el('offline-notice').textContent=problem||'';
    el('offline-retry').hidden=ready&&!problem;
    el('offline-update').hidden=!waiting;
    el('offline-update').disabled=applying;
    el('app').inert=applying;
    const nav=document.querySelector('header');if(nav)nav.inert=applying;
    el('offline-update').textContent='새 버전 적용';
    el('storage-notice').textContent=globalThis.window?.GardenStorage?.message||'';
    el('storage-retry').hidden=!globalThis.window?.GardenStorage?.pending;
  }
  function send(type,worker=registration?.active){worker?.postMessage({type,version});}
  function safe(){return ['login','hub'].includes(document.body.dataset.screen)&&!globalThis.window?.GardenStorage?.pending&&!document.querySelector('dialog[open]');}
  async function check(force=false){
    if(checking||navigator.onLine===false)return;
    if(!force&&Date.now()-lastCheck<60000)return;
    lastCheck=Date.now();checking=true;
    try{if(!registration)await start();else await registration.update();}
    catch{if(!ready)problem='준비하지 못했어요. 연결 후 다시 받아 주세요.';}
    finally{checking=false;paint();}
  }
  function watch(worker){
    if(!worker)return;
    worker.addEventListener('statechange',()=>{
      if(worker.state==='installed'&&registration.waiting){waiting=registration.waiting;progress='새 버전 준비됨';paint();}
      if(worker.state==='activated'){send('GARDEN_STATUS');}
      if(worker.state==='redundant'){problem='새 파일을 준비하지 못했어요. 기존 버전으로 계속 사용할 수 있어요.';paint();}
    });
  }
  async function start(){
    if(!('serviceWorker'in navigator)||!window.isSecureContext){
      progress='이 환경은 오프라인 재실행을 지원하지 않아요';problem='학습과 기기 저장은 사용할 수 있어요. HTTPS 브라우저에서 오프라인 준비를 해 주세요.';paint();return;
    }
    registration=await navigator.serviceWorker.register(new URL('sw.js',base),{scope:base.href,updateViaCache:'none'});
    registration.addEventListener('updatefound',()=>watch(registration.installing));watch(registration.installing);
    waiting=registration.waiting;send('GARDEN_STATUS');
    if(!registration.active&&!registration.installing&&!waiting)problem='오프라인 파일이 준비되지 않았어요.';
    paint();
  }
  navigator.serviceWorker?.addEventListener('message',event=>{
    if(!event.source?.scriptURL||new URL(event.source.scriptURL).href!==new URL('sw.js',base).href)return;
    const data=event.data||{},candidate=event.source===registration?.installing||event.source===registration?.waiting;
    if(data.type==='GARDEN_PROGRESS'){if(candidate&&navigator.serviceWorker.controller)progress='새 버전 다운로드 중 · '+data.done+'/'+data.total;else progress='오프라인 준비 중 · '+data.done+'/'+data.total;}
    if(data.type==='GARDEN_READY'){
      if(!candidate){ready=true;progress='';problem='';if(document.body.dataset.screen)send('GARDEN_HEALTHY');}
      else{progress='새 버전 준비됨';waiting=registration?.waiting;}
    }
    if(data.type==='GARDEN_INCOMPLETE'){
      applying=false;
      if(!candidate){ready=false;progress='오프라인 준비 미완료';}
      else problem='새 버전 파일이 일부 없어요. 다시 받아 주세요.';
    }
    if(data.type==='GARDEN_ERROR'||data.type==='GARDEN_BLOCKED'){problem=data.message;applying=false;}
    paint();
  });
  navigator.serviceWorker?.addEventListener('controllerchange',()=>{
    if(applying){location.reload();return;}
    // Initial control acquisition must not reload or interrupt current answers.
    send('GARDEN_STATUS');
  });
  el('offline-update').onclick=()=>{
    if(!safe()){problem='학습·편집을 마치고 배움정원 홈에서 적용해 주세요.';paint();return;}
    if(!waiting)return;
    window.GardenSession?.save();applying=true;problem='';send('GARDEN_APPLY',waiting);paint();
  };
  el('offline-retry').onclick=async()=>{problem='';send('GARDEN_REPAIR',waiting||registration?.active);await check(true);paint();};
  el('storage-retry').onclick=()=>{globalThis.window?.GardenStorage?.retry();paint();};
  el('offline-storage').onclick=async()=>{
    try{
      const kept=await navigator.storage?.persist?.();
      const size=await navigator.storage?.estimate?.();
      el('offline-storage-info').textContent=(kept?'저장소 보호가 허용됐어요.':'저장소 보호 여부는 브라우저가 결정해요.')+(size?.usage?' 사용량 약 '+Math.ceil(size.usage/1048576)+'MB.':'')+' 중요한 기록은 파일로 백업해 주세요.';
    }catch{el('offline-storage-info').textContent='저장 공간을 확인하지 못했어요. 중요한 기록은 파일로 백업해 주세요.';}
  };
  window.addEventListener('garden-storage',paint);
  window.addEventListener('online',()=>{paint();send('GARDEN_STATUS');if(!ready)send('GARDEN_REPAIR');check();});
  window.addEventListener('offline',paint);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden){paint();send('GARDEN_STATUS');check();}});
  setInterval(()=>{if(!document.hidden)check();},300000);
  window.addEventListener('beforeunload',event=>{if(globalThis.window?.GardenStorage?.pending){event.preventDefault();event.returnValue='';}});
  paint();start().catch(()=>{problem='오프라인 준비를 시작하지 못했어요. 연결 후 다시 받아 주세요.';paint();});
  return {check,safe,get ready(){return ready;}};
})();
