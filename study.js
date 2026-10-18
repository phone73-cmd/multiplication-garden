/* 지안이의 배움정원 v1.8.12 — shared entrance and separate learning modules. */
let dictationController=null;
function gardenAccess(){return authenticated&&screen==='dictation';}
function setStudyScreen(name){
  if(document.body)document.body.dataset.screen=name;
  if(name!=='hub'){hubExpressions=null;window.GardenMood?.leaveWelcome();}
  const appearance=document.querySelector('#appearance-button');if(appearance)appearance.hidden=name!=='hub';
  const logout=document.querySelector('#logout-button');if(logout)logout.hidden=name!=='hub';
  const button=document.querySelector('#study-home');if(button)button.hidden=name==='login'||name==='hub';
  const route={login:'login',hub:'hub',home:'math-home',quiz:'math-quiz',result:'math-result'}[name];if(route)window.GardenNav?.sync(route);
}
function readStudyValue(key,fallback){try{return JSON.parse(localStorage.getItem(key))??fallback;}catch{return fallback;}}
function stopDictation(){if(dictationController){dictationController.destroy();dictationController=null;}}
function returnToHub(){
  if(!authenticated)return login();
  if(screen==='times'&&TimesGarden.active()&&!confirm('배움정원 홈으로 갈까요? 풀고 있는 연습은 저장되지 않아요.'))return;
  if(screen==='times'&&TimesGarden.nextTimer){clearTimeout(TimesGarden.nextTimer);TimesGarden.nextTimer=null;}
  if(screen==='quiz'&&!confirm('배움정원 홈으로 갈까요? 풀고 있는 답은 저장되지 않아요.'))return;
  if(screen==='result'&&qs.some((q,i)=>answerState(q,answers[i])==='pending')&&!confirm('아직 확인하지 않은 설명이 있어요. 배움정원 홈으로 갈까요?'))return;
  if(screen==='dictation'){
    if(dictationController?.hasDraft()&&!confirm('배움정원 홈으로 갈까요? 작성 중인 답과 저장하지 않은 문장은 사라져요.'))return;
    stopDictation();
  }
  hub();window.scrollTo(0,0);
}
function logoutGarden(){
  authenticated=false;
  try{sessionStorage.removeItem('garden-authenticated');}catch{try{sessionStorage.setItem('garden-authenticated','no');}catch{}}
  stopDictation();
  qs=[];answers=[];manualChecks={};pos=0;
  login();window.scrollTo(0,0);
}
// Each subject uses its own completed learning records. Old math summaries have no dan data.
let hubExpressions=null;
function validDanStats(value){
  return !!value&&typeof value==='object'&&!Array.isArray(value)&&Object.entries(value).every(([dan,r])=>/^[2-9]$/.test(dan)&&r&&Number.isSafeInteger(r.attempts)&&r.attempts>0&&Number.isSafeInteger(r.wrong)&&r.wrong>=0&&r.wrong<=r.attempts);
}
function hubDanTotals(subject){
  const totals={};
  const add=(a,r)=>{if(!totals[a])totals[a]={attempts:0,wrong:0};totals[a].attempts+=r.attempts;totals[a].wrong+=r.wrong;};
  if(subject==='times'){
    const facts=readStudyValue('garden-times-facts',{});
    if(facts&&typeof facts==='object')for(const [key,r]of Object.entries(facts))if(/^[2-9]x[1-9]$/.test(key)&&r&&Number.isSafeInteger(r.attempts)&&r.attempts>0&&Number.isSafeInteger(r.wrong)&&r.wrong>=0&&r.wrong<=r.attempts)add(Number(key[0]),r);
  }else for(const record of history)if(validDanStats(record.danStats))for(const [dan,r]of Object.entries(record.danStats))add(Number(dan),r);
  return totals;
}
function chooseHubExpression(totals,exclude){
  const recorded=Object.entries(totals).filter(([,r])=>r.attempts>0);
  const highest=recorded.length?Math.max(...recorded.map(([,r])=>r.wrong/r.attempts)):null;
  const dans=recorded.length?recorded.filter(([,r])=>Math.abs(r.wrong/r.attempts-highest)<1e-12).map(([d])=>Number(d)):[2,3,4,5,6,7,8,9];
  const dan=dans[Math.floor(Math.random()*dans.length)];
  const multipliers=Array.from({length:9},(_,i)=>i+1).filter(b=>!exclude||!(dan===exclude.a&&b===exclude.b||dan===exclude.b&&b===exclude.a));
  return {a:dan,b:multipliers[Math.floor(Math.random()*multipliers.length)]};
}
function getHubExpressions(){
  if(!hubExpressions){const times=chooseHubExpression(hubDanTotals('times'));hubExpressions={times,math:chooseHubExpression(hubDanTotals('math'),times)};}
  return hubExpressions;
}
function hub(){
  if(!authenticated)return login();
  stopDictation();screen='hub';setStudyScreen(screen);
  const stats=readStudyValue('dictation-stats',{}),rows=stats&&typeof stats==='object'?Object.values(stats):[];
  const expressions=getHubExpressions();
  const runs=rows.reduce((sum,r)=>sum+(Number.isFinite(r?.runs)?r.runs:0),0);
  app.innerHTML=`<section class="study-welcome has-mood"><div class="welcome-copy"><div class="welcome-heading"><span class="eyebrow">지안이의 하루 한 뼘</span><h1>오늘은 어떤 꽃을<br>피워 볼까요?</h1></div><p>숫자를 생각하고, 바른 글을 써 봐요.</p></div>${window.GardenMood?.markup()||'<div class="study-sprouts" aria-hidden="true">🌷 🌼 🌿</div>'}</section><div class="subject-grid"><button id="open-times" class="subject-card" type="button"><span class="subject-illustration" aria-hidden="true">🌻<span>${expressions.times.a} × ${expressions.times.b}</span></span><span class="subject-label">구구단</span><strong>구구단 연습</strong><span class="subject-description">그림으로 익히고, 차근차근 풀어요.</span><span class="subject-record">익히기 · 차례대로 · 섞어서 <span aria-hidden="true">↗</span></span></button><button id="open-math" class="subject-card math-card" type="button"><span class="subject-illustration" aria-hidden="true">🌷<span>${expressions.math.a} × ${expressions.math.b}</span></span><span class="subject-label">수학</span><strong>곱셈정원</strong><span class="subject-description">그림과 숫자로 곱셈을 배워요.</span><span class="subject-record">완료한 평가 ${history.length}회 <span aria-hidden="true">↗</span></span></button><button id="open-dictation" class="subject-card dictation-card" type="button"><span class="subject-illustration" aria-hidden="true">📖<span>가 나 다</span></span><span class="subject-label">국어</span><strong>받아쓰기 공책</strong><span class="subject-description">듣고 쓰고, 바른 글을 익혀요.</span><span class="subject-record">완료한 연습 ${runs}회 <span aria-hidden="true">↗</span></span></button></div><details class="panel study-backup"><summary>학습 데이터 백업</summary><p class="muted">수학·구구단 기록과 받아쓰기 문장·설정·기록을 파일로 보관해요. 가져오면 파일에 들어 있는 항목이 바뀝니다.</p><div class="actions"><button id="export-study" class="ghost" type="button">전체 내보내기</button><button id="import-study" class="ghost" type="button">전체 가져오기</button></div><input id="study-backup-file" type="file" accept=".json,application/json" hidden><p id="backup-notice" class="muted" role="status"></p></details>`;
  window.GardenMood?.bindWelcome(app);
  document.querySelector('#open-math').onclick=()=>{home();window.scrollTo(0,0);};
  document.querySelector('#open-times').onclick=()=>TimesGarden.open();
  document.querySelector('#open-dictation').onclick=openDictation;
  document.querySelector('#export-study').onclick=exportStudy;
  document.querySelector('#import-study').onclick=()=>document.querySelector('#study-backup-file').click();
  document.querySelector('#study-backup-file').onchange=importStudyFile;
}
function openDictation(){
  if(!authenticated)return login();
  screen='dictation';setStudyScreen(screen);
  stopDictation();
  app.innerHTML='<section id="dictation-native" aria-label="받아쓰기 공책"></section>';
  dictationController=window.GardenDictation.mount(document.querySelector('#dictation-native'));
  window.scrollTo(0,0);
}
function reviewCard(q,i,state){
  const label=state==='good'?'✓ 정답':state==='pending'?'설명 확인하기':'다시 생각해요';
  return `<div class="review" id="review-${q.id}"><strong class="${state==='good'?'good':state==='pending'?'pending':'wrong'}">${label} · ${i+1}번 ${names[q.t]}</strong><p>${esc(q.text)}</p>${q.visual}${q.table?tableMarkup(q,q.fields.map((_,j)=>esc(answers[i]?.[j]??'?'))):''}<div class="summary-answer">내 답: ${esc(describe(q,answers[i]))}<br><b>${q.writing?'답과 설명의 예':'정답 예'}: ${esc(describe(q,expected(q)))}</b></div>${q.options?`<p>${q.options.map((o,j)=>`${choiceSymbol(j)} ${esc(o.text)}`).join('<br>')}</p>`:''}<p>${esc(q.hint)}</p>${q.writing?`<div class="rubric"><strong>설명을 함께 확인해요</strong><ul>${q.writing.rubric.map(s=>`<li>${esc(s)}</li>`).join('')}<li>예시와 다른 말이나 식이어도 뜻이 맞으면 좋아요.</li></ul><div class="actions"><button type="button" class="ghost rubric-button" data-review="${q.id}" data-value="yes" aria-pressed="${manualChecks[q.id]===true}">뜻이 맞아요</button><button type="button" class="ghost rubric-button" data-review="${q.id}" data-value="no" aria-pressed="${manualChecks[q.id]===false}">다시 생각해요</button></div></div>`:''}</div>`;
}
function reviewGroups(states){
  const group=predicate=>qs.map((q,i)=>({q,i,state:states[i]})).filter(predicate);
  const pending=group(x=>x.state==='pending'),wrong=group(x=>x.state==='wrong'),written=group(x=>x.state==='good'&&x.q.writing),good=group(x=>x.state==='good'&&!x.q.writing);
  const cards=list=>list.map(x=>reviewCard(x.q,x.i,x.state)).join('');
  return `${pending.length||written.length?`<section class="panel review-writing"><h2>서술형 확인하기 · ${pending.length}개 남았어요</h2>${cards(pending)}${written.length?`<details><summary>확인한 서술형 ${written.length}문제</summary>${cards(written)}</details>`:''}</section>`:''}${wrong.length?`<section class="panel review-wrong"><h2>틀린 문제 다시 보기 · ${wrong.length}문제</h2>${cards(wrong)}</section>`:''}${good.length?`<details class="panel review-correct"><summary>맞힌 문제 ${good.length}개 보기</summary>${cards(good)}</details>`:''}`;
}
const studyBackupKeys=['garden-mood','garden-times-facts','garden-times-history','garden-appearance','garden-history','dictation-settings','dictation-items','dictation-best','dictation-wrong','dictation-stats'];
function validStudyBackup(text){
  const obj=JSON.parse(text);
  if(!obj||obj.app!=='liah-learning-garden'||obj.format!==1||!obj.data||typeof obj.data!=='object'||Array.isArray(obj.data))throw Error('배움정원에서 내보낸 파일을 골라 주세요.');
  const data={};
  for(const [key,value]of Object.entries(obj.data)){
    if(!studyBackupKeys.includes(key))throw Error('알 수 없는 저장 항목이 있어요.');
    if(key==='garden-times-facts'){
      if(!TimesEngine.validFacts(value))throw Error('구구단 오답 기록을 확인해 주세요.');
    }else if(key==='garden-times-history'){
      if(!TimesEngine.validHistory(value))throw Error('구구단 기록을 확인해 주세요.');
    }else if(key==='garden-appearance'){
      if(!value||!['system','light','dark'].includes(value.theme)||!['pink','sky','mint','lavender','peach','lemon'].includes(value.palette))throw Error('화면 설정이 올바르지 않아요.');
    }else if(key==='garden-mood'){
      const moodKeys=['greeting','eye-smile','excited','surprised','thinking','sad','determined','sleepy'];
      if(!value||typeof value!=='object'||Array.isArray(value)||![...moodKeys,'random'].includes(value.choice)||!moodKeys.includes(value.current)||(value.messages!==undefined&&(!value.messages||typeof value.messages!=='object'||Array.isArray(value.messages)||Object.entries(value.messages).some(([mood,bag])=>!moodKeys.includes(mood)||!bag||!Number.isInteger(bag.last)||bag.last<0||bag.last>9||!Array.isArray(bag.remaining)||bag.remaining.length>9||new Set(bag.remaining).size!==bag.remaining.length||bag.remaining.some(i=>!Number.isInteger(i)||i<0||i>9||i===bag.last)))))throw Error('기분 선택을 확인해 주세요.');
    }else if(key==='garden-history'){
      if(!Array.isArray(value)||value.some(h=>!h||!Number.isFinite(h.score)||h.score<0||h.score>100||typeof h.date!=='string'||(h.id!==undefined&&typeof h.id!=='string')||(h.danStats!==undefined&&!validDanStats(h.danStats))))throw Error('수학 기록을 확인해 주세요.');
    }else{
      if(!value||typeof value!=='object'||Array.isArray(value))throw Error('받아쓰기 데이터를 확인해 주세요.');
      if(key==='dictation-settings'){
        if(!['hear','see'].includes(value.mode)||typeof value.strict!=='boolean'||typeof value.shuffle!=='boolean'||!['system','light','dark'].includes(value.theme)||!['pink','sky','mint','lavender','peach','lemon'].includes(value.palette)||typeof value.sfx!=='boolean'||typeof value.voice!=='string')throw Error('받아쓰기 설정이 올바르지 않아요.');
      }else for(const [g,v]of Object.entries(value)){
        if(!/^(?:[1-9]|10)$/.test(g))throw Error('급수는 1~10급이어야 해요.');
        if(key==='dictation-items'&&(!Array.isArray(v)||v.length!==10||v.some(t=>typeof t!=='string'||!t.trim()||t.length>100)))throw Error('문장 형식이 올바르지 않아요.');
        if(key==='dictation-best'&&(!Number.isInteger(v)||v<0||v>10))throw Error('최고 점수가 올바르지 않아요.');
        if(key==='dictation-wrong'&&(!Array.isArray(v)||v.some(n=>!Number.isInteger(n)||n<0||n>9)))throw Error('오답 번호가 올바르지 않아요.');
        if(key==='dictation-stats'&&(!v||!Number.isInteger(v.runs)||v.runs<0||![v.last,v.best].every(n=>n===null||(Number.isInteger(n)&&n>=0&&n<=10))||!v.miss||typeof v.miss!=='object'||Array.isArray(v.miss)||Object.entries(v.miss).some(([i,c])=>!/^\d$/.test(i)||!Number.isInteger(c)||c<0)))throw Error('급수별 기록이 올바르지 않아요.');
      }
    }
    data[key]=value;
  }
  if(!Object.keys(data).length)throw Error('가져올 학습 데이터가 없어요.');
  return data;
}
async function exportStudy(){
  const notice=document.querySelector('#backup-notice');
  let text;
  try{
    const data={};for(const key of studyBackupKeys){const raw=localStorage.getItem(key);if(raw!==null)data[key]=JSON.parse(raw);}
    if(!Object.keys(data).length){notice.textContent='아직 저장된 학습 데이터가 없어요.';return;}
    text=JSON.stringify({app:'liah-learning-garden',format:1,version:'1.8.12',data},null,2);
  }catch(e){notice.textContent=`저장된 학습 데이터를 읽지 못했어요. (${e.name||'읽기 오류'})`;return;}
  const filename='learning-garden-v1.8.12-backup.json';
  const ios=/iPad|iPhone|iPod/.test(navigator.userAgent||'')||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  // File sharing is optional: lack of support or a denied share must not block export.
  if(ios&&typeof File==='function'&&typeof navigator.share==='function'&&typeof navigator.canShare==='function'){
    try{
      const file=new File([text],filename,{type:'application/json'});
      if(navigator.canShare({files:[file]})){
        await navigator.share({files:[file],title:'배움정원 학습 백업'});
        notice.textContent='공유창으로 내보냈어요. 파일에 저장을 선택했다면 파일 앱에서 확인해 주세요.';return;
      }
    }catch(e){if(e.name==='AbortError'){notice.textContent='내보내기를 취소했어요.';return;}}
  }
  try{
    const blob=new Blob([text],{type:'application/json;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),60000);
    notice.textContent='백업 파일 다운로드를 요청했어요. 다운로드 목록에서 확인해 주세요.';
  }catch(e){notice.textContent=`파일 저장을 요청하지 못했어요. Safari나 Chrome에서 다시 시도해 주세요. (${e.name||'저장 오류'})`;}
}

function applyStudyBackup(data){
  const before={};for(const key of Object.keys(data))before[key]=localStorage.getItem(key);
  try{for(const [key,value]of Object.entries(data))localStorage.setItem(key,JSON.stringify(value));}
  catch(e){for(const [key,value]of Object.entries(before)){try{if(value===null)localStorage.removeItem(key);else localStorage.setItem(key,value);}catch{}}throw e;}
  if(data['garden-history'])history=data['garden-history'];
  hubExpressions=null;
  window.GardenAppearance?.reload();window.GardenMood?.reload();
}
async function importStudyFile(event){
  const file=event.target.files[0];event.target.value='';if(!file)return;
  let message='';
  try{
    if(file.size>5*1024*1024)throw Error('5MB 이하의 백업 파일을 골라 주세요.');
    const data=validStudyBackup(await file.text());
    if(!confirm('파일에 들어 있는 학습 데이터로 바꿀까요? 현재 데이터를 먼저 내보내 두는 것이 좋아요.'))return;
    applyStudyBackup(data);hub();message='학습 데이터를 가져왔어요.';
  }catch(e){message=e.message||'파일을 가져오지 못했어요.';}
  document.querySelector('#backup-notice').textContent=message;
}
document.querySelector('#study-home').onclick=returnToHub;

const logoutButton=document.querySelector('#logout-button');if(logoutButton)logoutButton.onclick=logoutGarden;
