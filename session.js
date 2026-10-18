/* Same-tab reload recovery. Temporary practice state is separate from permanent records. */
window.GardenSession=(()=>{
  const key='garden-screen-v1';let saving=false,restoring=false,pending=null,pausedAdvance=false;
  const num=(n,a,b)=>Number.isFinite(n)&&n>=a&&n<=b;
  const integer=(n,a,b)=>Number.isInteger(n)&&num(n,a,b);
  const list=(a,max)=>Array.isArray(a)&&a.length<=max;
  function clear(){try{sessionStorage.removeItem(key);}catch{}}
  function timesSnapshot(){
    const g=TimesGarden,out={};
    for(const name of ['mode','dans','count','timeLimit','phase','queue','records','index','tries','done','retry','saved','saveError','id','b','revealed','highlight','learnFruit','helpFruit','runTimeLimit','feedbackHint'])if(g[name]!==undefined)out[name]=g[name];
    out.remainingMs=g.clockPaused?g.remainingMs:Math.max(0,g.clockDeadline-Date.now());
    if(g.phase==='quiz'){out.input=document.querySelector('#times-answer')?.value||'';out.feedback=document.querySelector('#times-feedback')?.textContent||'';}
    return out;
  }
  function save(){
    if(saving||restoring||typeof authenticated==='undefined'||!authenticated)return;
    saving=true;
    try{
      const state={v:1,screen,y:Math.max(0,window.scrollY||0)};
      if(screen==='times')state.times=timesSnapshot();
      if(screen==='home')state.prefs=Object.fromEntries(['dan','count','type'].map(id=>[id,document.querySelector('#'+id)?.value]));
      if(screen==='quiz'||screen==='result'){
        const drafts=answers.map(x=>x.slice());if(screen==='quiz')drafts[pos]=readAnswer();
        state.math={qs,answers:drafts,pos,reviewMode,manualChecks,runId,scoreSavedForRun};
      }
      if(screen==='dictation')state.dictation=dictationController?.snapshot();
      if(screen==='hub')state.appearance=!!document.querySelector('#appearance-dialog')?.open;
      sessionStorage.setItem(key,JSON.stringify(state));
    }catch{}finally{saving=false;}
  }
  function validMath(m){
    if(!m||!list(m.qs,30)||!m.qs.length||!list(m.answers,30)||m.answers.length!==m.qs.length||!integer(m.pos,0,m.qs.length-1)||typeof m.runId!=='string'||m.runId.length>100||typeof m.reviewMode!=='boolean'||typeof m.scoreSavedForRun!=='boolean'||!m.manualChecks||Object.values(m.manualChecks).some(x=>typeof x!=='boolean'))return false;
    if(m.answers.some(row=>!list(row,81)||row.some(x=>typeof x!=='string'||x.length>1000)))return false;
    // Only app-generated math markup is retained. Reject active/external content in temporary state.
    function safe(value,name=''){
      if(typeof value==='string'){
        if(value.length>40000)return false;
        if(name==='visual')return !/<\/?(?:script|iframe|object|embed|foreignObject|style|link|base|form|input|button|textarea)\b|\bon\w+\s*=|(?:javascript|data):|url\s*\(/i.test(value)&&![...value.matchAll(/(?:src|href)\s*=\s*["']([^"']*)/g)].some(m=>!/^assets\/icons\/[a-z0-9-]+\.webp$/.test(m[1]));
        return !/<\/?[a-z!]|\bon\w+\s*=/i.test(value);
      }
      if(Array.isArray(value))return value.every(v=>safe(v));
      if(value&&typeof value==='object')return Object.entries(value).every(([k,v])=>!['__proto__','constructor','prototype'].includes(k)&&safe(v,k));
      return value===null||['boolean','number'].includes(typeof value);
    }
    return m.qs.every(q=>q&&integer(q.t,0,18)&&integer(q.a,2,9)&&integer(q.b,2,9)&&/^q\d+$/.test(q.id)&&['fields','multi','single','grid','match'].includes(q.kind)&&safe(q));
  }
  function restoreTimes(g){
    const pair=q=>q&&integer(q.a,2,9)&&integer(q.b,1,9);
    if(!g||!['learn','ordered','mixed','weak'].includes(g.mode)||!list(g.dans,8)||g.dans.some(x=>!integer(x,2,9))||![10,20,30].includes(g.count)||![0,5,10].includes(g.timeLimit)||!['home','learn','quiz','result'].includes(g.phase)||!list(g.queue,30)||g.queue.some(q=>!pair(q))||!list(g.records,30)||g.records.some(q=>!pair(q)||typeof q.first!=='boolean'||typeof q.second!=='boolean'||q.first&&q.second)||!integer(g.index,0,g.queue.length)||!integer(g.tries,0,2)||!['done','retry','saved','saveError'].every(k=>typeof g[k]==='boolean'))throw Error('구구단 상태');
    if(g.phase==='learn'&&(!g.dans.length||!integer(g.b,1,9)||!integer(g.highlight,0,g.b)||typeof g.revealed!=='boolean'))throw Error('익히기 상태');
    if(['quiz','result'].includes(g.phase)&&(!g.queue.length||![0,5,10].includes(g.runTimeLimit)||!num(g.remainingMs,0,g.runTimeLimit*1000)||typeof g.id!=='string'||g.id.length>100))throw Error('연습 상태');
    if(g.phase==='quiz'&&(g.index>=g.queue.length||g.records.length!==g.index+(g.done?1:0)))throw Error('진행 상태');
    if(g.phase==='result'&&g.records.length!==g.queue.length)throw Error('결과 상태');
    const savedPhase=g.phase;
    const allowed=['mode','dans','count','timeLimit','queue','records','index','tries','done','retry','saved','saveError','id','b','revealed','highlight','runTimeLimit','feedbackHint'];
    for(const name of allowed)if(g[name]!==undefined)TimesGarden[name]=g[name];
    for(const name of ['learnFruit','helpFruit'])TimesGarden[name]=window.GardenPictures?.pools.fruits.find(x=>x[2]===g[name]?.[2]);
    TimesGarden.remainingMs=g.remainingMs||0;TimesGarden.clockPaused=true;TimesGarden.clockTimer=null;TimesGarden.nextTimer=null;
    screen='times';setStudyScreen(screen);TimesGarden.phase=savedPhase;
    if(savedPhase==='home')TimesGarden.home();
    else if(savedPhase==='learn')TimesGarden.learn();
    else if(savedPhase==='result')TimesGarden.finish();
    else{
      TimesGarden.quiz();document.querySelector('#times-answer').value=String(g.input||'').replace(/\D/g,'').slice(0,2);
      const feedback=document.querySelector('#times-feedback');if(g.feedbackHint||g.done)feedback.textContent=String(g.feedback||'').slice(0,200);
      if(g.done){
        const last=g.records.at(-1),correct=last.first||last.second,q=g.queue[g.index];
        document.querySelector('#times-answer').disabled=true;document.querySelector('#times-check').hidden=true;document.querySelectorAll('[data-key]').forEach(el=>el.disabled=true);
        const next=document.querySelector('#times-continue');next.hidden=false;next.textContent=correct?'맞았어요! 다음 문제로 이동해요…':g.index===g.queue.length-1?'결과 보기':'다음 문제 →';
        if(!correct)document.querySelector('#times-help').innerHTML=`${TimesGarden.picture(q.a,q.b)}<p>${q.a}개씩 ${q.b}묶음은 ${q.a*q.b}개예요.</p><p class="times-sum">${Array(q.b).fill(q.a).join(' + ')} = ${q.a*q.b}</p>`;
        if(correct)TimesGarden.scheduleAdvance();
      }
    }
  }
  function restore(){
    if(!authenticated)return false;
    let state;try{const raw=sessionStorage.getItem(key);if(!raw||raw.length>2000000)return false;state=JSON.parse(raw);}catch{clear();return false;}
    if(!state||state.v!==1||!['hub','home','quiz','result','times','dictation'].includes(state.screen)){clear();return false;}
    const route=state.screen==='times'?'times-'+state.times?.phase:state.screen==='dictation'?'dictation-'+state.dictation?.name:({home:'math-home',quiz:'math-quiz',result:'math-result'})[state.screen]||(state.appearance?'appearance':'hub');
    restoring=true;
    try{
      const renderSaved=()=>{
        if(state.screen==='times')restoreTimes(state.times);
        else if(state.screen==='dictation'){openDictation();if(!dictationController?.restore)throw Error('받아쓰기 복원');dictationController.restore(state.dictation);}
        else if(state.screen==='quiz'||state.screen==='result'){
          const m=state.math;if(!validMath(m))throw Error('평가 상태');
          qs=m.qs;answers=m.answers;pos=m.pos;reviewMode=m.reviewMode;manualChecks=m.manualChecks;runId=m.runId;scoreSavedForRun=m.scoreSavedForRun;
          if(state.screen==='quiz')render();else result();
        }else if(state.screen==='home'){
          home();for(const [id,value]of Object.entries(state.prefs||{}))if(['dan','count','type'].includes(id)&&/^(?:all|mix|[0-9]|1[0-9]|20|30)$/.test(value))document.querySelector('#'+id).value=value;
        }else{hub();if(state.appearance)window.GardenAppearance?.open();}
      };
      if(window.GardenNav?.restore){if(!window.GardenNav.restore(route,renderSaved))throw Error('화면 경로');}else renderSaved();
      setTimeout(()=>window.scrollTo(0,num(state.y,0,1000000)?state.y:0),0);return true;
    }catch{
      TimesGarden.pauseClock();stopDictation();clear();return false;
    }finally{restoring=false;}
  }
  function queueSave(){if(pending)clearTimeout(pending);pending=setTimeout(()=>{pending=null;save();},100);}
  window.addEventListener?.('beforeunload',save);
  window.addEventListener?.('pagehide',()=>{save();if(typeof TimesGarden!=='undefined'){TimesGarden.pauseClock();pausedAdvance=!!TimesGarden.nextTimer;if(pausedAdvance){clearTimeout(TimesGarden.nextTimer);TimesGarden.nextTimer=null;}}});
  window.addEventListener?.('pageshow',event=>{if(event.persisted&&screen==='times'){TimesGarden.resumeClock();if(pausedAdvance&&TimesGarden.done)TimesGarden.scheduleAdvance();pausedAdvance=false;}});
  for(const event of ['input','change','click'])window.addEventListener?.(event,queueSave,true);
  return {save,restore,clear};
})();
