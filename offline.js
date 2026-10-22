/* v2.0.3 — compact combined status, persistent guide, recoverable service-worker activation. */
window.GardenOffline=(()=>{
  const version='2.0.3',base=new URL('./',document.baseURI),workerURL=new URL('sw.js',base).href;
  let registration=null,ready=false,progress='',problem='',unsupported=false,lastCheck=0,checking=false;
  let activeVersion='',activeBundle='',candidateVersion='',candidateBundle='',apply=null,reloading=false,applyFailed=false,applySequence=0;
  const watched=new WeakSet(),el=id=>document.getElementById(id),sw=navigator.serviceWorker;
  const waiting=()=>registration?.waiting?.state==='installed'?registration.waiting:null;
  const newer=(a,b)=>/^\d+\.\d+\.\d+$/.test(a)&&a.split('.').reduce((n,v)=>n*1000+Number(v),0)>b.split('.').reduce((n,v)=>n*1000+Number(v),0);
  const needsReload=()=>newer(activeVersion,version);
  function paint(){
    const online=navigator.onLine!==false,canUpdate=!!waiting()||needsReload(),saving=window.GardenStorage?.pending>0;
    const availability=ready?'오프라인 사용가능':unsupported||problem?'오프라인 사용불가':progress||'오프라인 준비 확인 중';
    const summary=(online?'온라인':'오프라인')+' · '+availability;
    el('offline-status').textContent=summary;
    if(el('offline-live').textContent!==summary)el('offline-live').textContent=summary;
    el('offline-help').setAttribute('data-online',String(online));
    el('offline-help').setAttribute('data-ready',String(ready));
    el('offline-help').setAttribute('data-preparing',String(!ready&&!problem&&!unsupported));
    el('offline-help').title=summary;
    const attention=canUpdate||!!problem||saving;
    el('offline-attention').hidden=!attention;
    el('offline-help').setAttribute('aria-label',summary+' · '+(attention?'사용 안내 · 새 버전 또는 확인할 내용 있음':'사용 안내'));
    el('offline-notice').textContent=problem;
    el('offline-progress').textContent=apply?'새 버전 적용 중…':progress;
    el('offline-retry').hidden=ready&&!problem;
    el('offline-retry').disabled=!!apply||unsupported;
    el('offline-update').hidden=!canUpdate&&!apply&&!applyFailed;
    el('offline-update').disabled=!!apply;
    el('offline-update').textContent=apply?'적용 중…':applyFailed?'다시 시도':needsReload()?'새 버전으로 열기':'새 버전 적용';
    el('app').inert=!!apply;
    const nav=document.querySelector('.common-nav');if(nav)nav.inert=!!apply;
    el('storage-notice').textContent=window.GardenStorage?.message||'';
    el('storage-retry').hidden=!saving;
  }
  function panel(open,focus=false){
    el('offline-panel').hidden=!open;el('offline-help').setAttribute('aria-expanded',String(open));
    if(focus)(open?el('offline-close'):el('offline-help')).focus();
  }
  function send(type,worker=sw?.controller||registration?.active,requestId){
    if(!worker||worker.state==='redundant')return false;
    try{worker.postMessage({type,version,requestId});return true;}
    catch{return false;}
  }
  function safe(){return ['login','hub'].includes(document.body.dataset.screen)&&!window.GardenStorage?.pending&&!document.querySelector('dialog[open]');}
  function stopApply(message=''){
    if(apply){clearTimeout(apply.timeout);clearInterval(apply.poll);}
    apply=null;problem=message;applyFailed=!!message;paint();
  }
  function reload(){
    if(reloading)return;reloading=true;
    if(apply?.version){activeVersion=apply.version;activeBundle=apply.bundle;}
    window.GardenSession?.save();stopApply();
    // Release input locks before navigation; a standalone shell may ignore a reload.
    setTimeout(()=>{reloading=false;problem='화면이 바뀌지 않으면 앱을 완전히 닫았다 다시 열어 주세요.';applyFailed=true;paint();},5000);
    try{location.reload();}catch{reloading=false;stopApply('화면을 다시 열지 못했어요. 다시 시도해 주세요.');}
  }
  async function refreshRegistration(){
    try{const fresh=await sw?.getRegistration?.(base.href);if(fresh)registration=fresh;}catch{}
    watch(registration?.installing);watch(registration?.waiting);watch(registration?.active);
  }
  async function inspectApply(){
    if(!apply)return;
    await refreshRegistration();if(!apply)return;
    const controller=sw?.controller;
    // Verify actual takeover before reload; merely receiving an ACK is insufficient.
    if(controller===apply.target&&controller?.state==='activated'){reload();return;}
    send('GARDEN_STATUS',controller,apply.id);
  }
  async function check(force=false){
    if(checking||navigator.onLine===false||unsupported)return;
    if(!force&&Date.now()-lastCheck<60000)return;
    lastCheck=Date.now();checking=true;
    try{if(!registration)await start();else await registration.update();await refreshRegistration();}
    catch{if(!ready)problem='준비하지 못했어요. 연결 후 다시 받아 주세요.';}
    finally{checking=false;paint();}
  }
  function watch(worker){
    if(!worker||watched.has(worker))return;watched.add(worker);
    worker.addEventListener('statechange',()=>{
      if(worker.state==='installed'){progress='새 버전 준비됨';send('GARDEN_STATUS',worker);}
      if(worker.state==='activated'){
        if(!waiting())progress='';
        if(apply)inspectApply();else send('GARDEN_STATUS');
      }
      if(worker.state==='redundant'){
        if(apply?.target===worker)stopApply('업데이트 상태가 바뀌었어요. 다시 시도해 주세요.');
        else if(worker===registration?.installing){problem='새 파일을 준비하지 못했어요. 기존 버전으로 계속 사용할 수 있어요.';}
      }
      paint();
    });
  }
  async function start(){
    if(!sw||!window.isSecureContext){
      unsupported=true;progress='오프라인 사용불가';problem='이 환경은 오프라인 재실행을 지원하지 않아요. HTTPS 브라우저에서 준비해 주세요.';paint();return;
    }
    registration=await sw.register(workerURL,{scope:base.href,updateViaCache:'none'});
    registration.addEventListener('updatefound',()=>{watch(registration.installing);paint();});
    await refreshRegistration();send('GARDEN_STATUS');if(waiting())send('GARDEN_STATUS',waiting());paint();
  }
  sw?.addEventListener('message',event=>{
    if(event.source?.scriptURL!==workerURL||event.source.state==='redundant')return;
    const data=event.data||{},isActive=event.source===sw.controller||(!sw.controller&&event.source===registration?.active);
    const candidate=!isActive&&(event.source===registration?.installing||event.source===waiting());
    if(!isActive&&!candidate&&event.source!==apply?.target)return;
    if(data.type==='GARDEN_PROGRESS')progress=(candidate?'새 버전 다운로드 중 · ':'오프라인 준비 중 · ')+data.done+'/'+data.total;
    if(data.type==='GARDEN_READY'){
      if(isActive){
        ready=true;activeVersion=data.version||'';activeBundle=data.bundle||'';if(!applyFailed)problem='';
        if(!waiting())progress='';
        if(document.body.dataset.screen)send('GARDEN_HEALTHY');
        if(apply&&data.requestId===apply.id&&data.version===apply.version&&data.bundle===apply.bundle){reload();return;}
      }else if(candidate){candidateVersion=data.version||'';candidateBundle=data.bundle||'';progress='새 버전 준비됨';}
    }
    if(data.type==='GARDEN_APPLY_ACCEPTED'&&apply&&data.requestId===apply.id){
      apply.version=data.version;apply.bundle=data.bundle;inspectApply();
    }
    if(data.type==='GARDEN_INCOMPLETE'){
      if(isActive){ready=false;progress='오프라인 준비 미완료';}
      if(apply)stopApply('업데이트 파일이 일부 없어요. 파일을 다시 받아 주세요.');
      else if(candidate)problem='새 버전 파일이 일부 없어요. 다시 받아 주세요.';
    }
    if(data.type==='GARDEN_ERROR'||data.type==='GARDEN_BLOCKED'){
      // Ignore late errors from a previous apply request.
      if(data.requestId&&data.requestId!==apply?.id)return;
      stopApply(data.message||'적용하지 못했어요. 다시 시도해 주세요.');
    }
    paint();
  });
  sw?.addEventListener('controllerchange',()=>{
    if(apply)inspectApply();else{progress='';send('GARDEN_STATUS');paint();}
  });
  el('offline-update').onclick=async()=>{
    if(apply)return;
    if(!safe()){problem='학습·편집을 마치고 배움정원 홈에서 적용해 주세요.';paint();return;}
    await refreshRegistration();
    if(!safe()){problem='학습·편집을 마친 뒤 적용해 주세요.';paint();return;}
    if(needsReload()){reload();return;}
    const target=waiting();
    if(!target){
      applyFailed=false;problem='';progress='업데이트 상태를 다시 확인했어요.';send('GARDEN_STATUS');await check(true);paint();return;
    }
    window.GardenSession?.save();
    apply={target,id:'apply-'+Date.now().toString(36)+'-'+(++applySequence),version:candidateVersion,bundle:candidateBundle,timeout:null,poll:null};
    problem='';applyFailed=false;
    apply.timeout=setTimeout(()=>{if(apply)stopApply('적용 응답이 늦어지고 있어요. 다른 배움정원 창을 닫고 다시 시도해 주세요.');},15000);
    apply.poll=setInterval(inspectApply,1000);watch(target);
    if(!send('GARDEN_APPLY',target,apply.id))stopApply('적용 요청을 보내지 못했어요. 다시 시도해 주세요.');
    paint();
  };
  el('offline-retry').onclick=async()=>{problem='';send('GARDEN_REPAIR',waiting()||sw?.controller||registration?.active);await check(true);paint();};
  el('storage-retry').onclick=()=>{window.GardenStorage?.retry();paint();};
  el('offline-help').onclick=()=>panel(el('offline-panel').hidden);
  el('offline-close').onclick=()=>panel(false,true);
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!el('offline-panel').hidden){event.preventDefault();panel(false,true);}});
  document.addEventListener('pointerdown',event=>{if(!el('offline-panel').hidden&&!el('offline-panel').contains(event.target)&&!el('offline-toolbar').contains(event.target))panel(false);});
  el('offline-storage').onclick=async()=>{
    try{const kept=await navigator.storage?.persist?.(),size=await navigator.storage?.estimate?.();el('offline-storage-info').textContent=(kept?'저장소 보호가 허용됐어요.':'저장소 보호 여부는 브라우저가 결정해요.')+(size?.usage?' 사용량 약 '+Math.ceil(size.usage/1048576)+'MB.':'')+' 중요한 기록은 파일로 백업해 주세요.';}
    catch{el('offline-storage-info').textContent='저장 공간을 확인하지 못했어요. 중요한 기록은 파일로 백업해 주세요.';}
  };
  const resume=async()=>{await refreshRegistration();if(apply)inspectApply();else{send('GARDEN_STATUS');if(waiting())send('GARDEN_STATUS',waiting());}paint();check();};
  window.addEventListener('garden-storage',paint);
  window.addEventListener('online',()=>{resume();if(!ready)send('GARDEN_REPAIR');});window.addEventListener('offline',paint);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)resume();});window.addEventListener('pageshow',resume);
  setInterval(()=>{if(!document.hidden)check();},300000);
  window.addEventListener('beforeunload',event=>{if(window.GardenStorage?.pending){event.preventDefault();event.returnValue='';}});
  paint();start().catch(()=>{problem='오프라인 준비를 시작하지 못했어요. 연결 후 다시 받아 주세요.';paint();});
  return {check,safe,get ready(){return ready;}};
})();
