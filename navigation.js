/* 배움정원 v1.8.26: browser Back follows subject -> garden hierarchy. */
window.GardenNav=(()=>{
  const browser=window.history,historyEnabled=!!(browser?.pushState&&window.addEventListener);
  const routes={
    login:0,hub:0,appearance:1,'math-home':1,'math-quiz':2,'math-result':2,
    'times-home':1,'times-learn':2,'times-quiz':2,'times-result':2,
    'dictation-home':1,'dictation-quiz':2,'dictation-done':2,'dictation-settings':2
  };
  const marker='learning-garden-navigation-v1';
  let current=null,pending=null,handling=false,leaveBox=null,leaveTarget=null,pausedAdvance=false,pausedClock=false,pausedDictation=false,returnFocus=null;
  const entry=route=>({garden:marker,route,depth:routes[route]});
  const valid=s=>s?.garden===marker&&Object.hasOwn(routes,s.route)&&s.depth===routes[s.route];
  const replace=route=>{current=entry(route);browser.replaceState(current,'');};
  function sync(route){
    if(!Object.hasOwn(routes,route))return;
    if(!historyEnabled){current=entry(route);return;}
    if(handling){replace(route);return;}
    if(pending){pending.queued=route;return;}
    if(!current){
      const old=browser.state;
      if(valid(old)&&old.depth>0){current=entry(route);pending={route};browser.go(-old.depth);return;}
      replace(route);return;
    }
    if(route===current.route)return;
    const target=entry(route);
    if(target.depth<current.depth){
      const distance=current.depth-target.depth;current=target;pending={route};browser.go(-distance);return;
    }
    if(target.depth===current.depth){replace(route);return;}
    if(current.depth===0&&target.depth===2){
      const parent=route.split('-')[0]+'-home';current=entry(parent);browser.pushState(current,'');
    }
    current=target;browser.pushState(current,'');
  }
  function leaveMessage(target){
    if(typeof authenticated==='undefined'||!authenticated)return '';
    if(screen==='quiz'&&target!=='math-quiz')return '문제를 그만 풀고 돌아갈까요? 지금 쓰는 답은 저장되지 않아요.';
    if(screen==='result'&&target!=='math-result'&&qs.some((q,i)=>answerState(q,answers[i])==='pending'))return '아직 확인하지 않은 설명이 있어요. 이전 화면으로 갈까요?';
    if(screen==='times'&&TimesGarden.active()&&target!=='times-quiz')return '연습을 그만하고 돌아갈까요? 지금 쓰는 답은 저장되지 않아요.';
    if(screen==='dictation'&&target!==current.route&&dictationController?.hasDraft())return '받아쓰기에서 나갈까요? 지금 쓰는 답과 저장하지 않은 문장은 사라져요.';
    return '';
  }
  function showLeave(message,target){
    if(leaveTarget!==null)return;
    if(!leaveBox){
      leaveBox=document.createElement('dialog');leaveBox.id='garden-leave-dialog';
      leaveBox.setAttribute('aria-labelledby','garden-leave-title');
      leaveBox.setAttribute('aria-describedby','garden-leave-message');
      leaveBox.innerHTML='<h2 id="garden-leave-title">잠깐만요 🌿</h2><p id="garden-leave-message"></p><div class="actions"><button type="button" class="ghost" id="garden-stay">계속 풀기</button><button type="button" id="garden-leave">나가기</button></div>';
      document.body.appendChild(leaveBox);
      leaveBox.querySelector('#garden-stay').onclick=()=>closeLeave(false);
      leaveBox.querySelector('#garden-leave').onclick=()=>closeLeave(true);
      leaveBox.oncancel=event=>{event.preventDefault();closeLeave(false);};
      leaveBox.onclose=()=>{if(leaveTarget!==null)closeLeave(false);};
    }
    leaveTarget=target;returnFocus=document.activeElement;
    pausedDictation=screen==='dictation'&&!!dictationController?.pauseSpeech?.();
    pausedClock=screen==='times'&&!!TimesGarden.pauseClock?.();
    pausedAdvance=screen==='times'&&!!TimesGarden.nextTimer;
    if(pausedAdvance){clearTimeout(TimesGarden.nextTimer);TimesGarden.nextTimer=null;}
    leaveBox.querySelector('#garden-leave-message').textContent=message;
    leaveBox.showModal();leaveBox.querySelector('#garden-stay').focus();
  }
  function closeLeave(exit){
    if(leaveTarget===null)return;
    const target=leaveTarget,resume=pausedAdvance,resumeClock=pausedClock,resumeDictation=pausedDictation;leaveTarget=null;pausedAdvance=false;pausedClock=false;pausedDictation=false;
    leaveBox.close();
    if(exit){renderRoute(target);window.scrollTo(0,0);}
    else{
      if(resume&&screen==='times'&&TimesGarden.active()&&TimesGarden.done)TimesGarden.scheduleAdvance();
      if(resumeClock&&screen==='times')TimesGarden.resumeClock?.();
      if(resumeDictation&&screen==='dictation')dictationController?.resumeSpeech?.();
      if(returnFocus?.isConnected)returnFocus.focus();
    }
  }
  function renderRoute(route){
    if(!authenticated){login();return;}
    if(screen==='times')TimesGarden.pauseClock?.();
    if(screen==='times'&&TimesGarden.nextTimer){clearTimeout(TimesGarden.nextTimer);TimesGarden.nextTimer=null;}
    const dialog=document.querySelector('#appearance-dialog');if(route!=='appearance'&&dialog?.open)dialog.close();
    if(route==='appearance'){window.GardenAppearance.open();return;}
    if(route==='hub'||route==='login'){stopDictation();hub();return;}
    if(route==='math-home'){stopDictation();home();return;}
    if(route==='math-quiz'||route==='math-result'){
      stopDictation();if(!qs.length){home();return;}
      if(route==='math-quiz')render();else result();return;
    }
    if(route.startsWith('times-')){
      stopDictation();screen='times';setStudyScreen(screen);
      if(route==='times-learn'&&TimesGarden.b){TimesGarden.learn();return;}
      if(route==='times-quiz'&&TimesGarden.queue.length&&TimesGarden.index<TimesGarden.queue.length){TimesGarden.phase='quiz';TimesGarden.quiz();return;}
      if(route==='times-result'&&TimesGarden.records.length===TimesGarden.queue.length&&TimesGarden.records.length){TimesGarden.finish();return;}
      TimesGarden.home();return;
    }
    if(route.startsWith('dictation-')){
      if(screen!=='dictation'||!dictationController)openDictation();
      const name=route.slice('dictation-'.length);
      if(!dictationController?.navigate?.(name))dictationController?.goHome();
    }
  }
  window.addEventListener?.('popstate',event=>{
    if(pending){const {route,queued}=pending;pending=null;replace(route);if(queued&&queued!==route)sync(queued);return;}
    if(!valid(event.state))return;
    const old=current,next=event.state;
    if(!old){replace(next.route);return;}
    const message=leaveMessage(next.route);
    if(message){
      // Restore the active app entry before waiting for an explicit in-app choice.
      current=next;sync(old.route);showLeave(message,next.route);return;
    }
    current=next;handling=true;
    try{renderRoute(next.route);window.scrollTo(0,0);}finally{handling=false;}
  });
  function request(route){
    if(!Object.hasOwn(routes,route))return false;
    if(route===current?.route)return true;
    const message=leaveMessage(route);
    if(message)showLeave(message,route);else renderRoute(route);
    return true;
  }
  return {sync,request};
})();
