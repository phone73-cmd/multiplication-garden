/* 구구단 연습 v1.8.15: picture learning and untimed practice. */
const TimesEngine={
  shuffle(items){const a=items.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;},
  makeQueue(dans,count,ordered=false){
    if(!dans.length||dans.some(d=>!Number.isInteger(d)||d<2||d>9))throw Error('단을 골라 주세요.');
    if(ordered)return Array.from({length:9},(_,i)=>({a:dans[0],b:i+1}));
    if(![10,20,30].includes(count))throw Error('문제 수를 확인해 주세요.');
    const bags={},out=[];let cycle=[];
    while(out.length<count){
      if(!cycle.length){cycle=this.shuffle(dans);if(out.length&&cycle.length>1&&cycle[0]===out.at(-1).a)[cycle[0],cycle[1]]=[cycle[1],cycle[0]];}
      const a=cycle.shift();
      if(!bags[a]?.length){bags[a]=this.shuffle([1,2,3,4,5,6,7,8,9]);if(out.at(-1)?.a===a&&bags[a][0]===out.at(-1).b)[bags[a][0],bags[a][1]]=[bags[a][1],bags[a][0]];}
      out.push({a,b:bags[a].shift()});
    }return out;
  },
  validFacts(value){return !!value&&typeof value==='object'&&!Array.isArray(value)&&Object.entries(value).every(([key,r])=>/^[2-9]x[1-9]$/.test(key)&&r&&Number.isSafeInteger(r.attempts)&&r.attempts>=1&&Number.isSafeInteger(r.wrong)&&r.wrong>=0&&r.wrong<=r.attempts&&Number.isSafeInteger(r.streak)&&r.streak>=0&&r.streak<=r.attempts&&r.streak<=r.attempts-r.wrong&&typeof r.last==='string'&&Number.isFinite(Date.parse(r.last)));},
  readFacts(){const raw=localStorage.getItem('garden-times-facts'),value=raw===null?{}:JSON.parse(raw);if(!this.validFacts(value))throw Error('구구단 오답 기록을 읽지 못했어요.');return value;},
  weakFacts(facts,dans){return Object.entries(facts).filter(([key,r])=>dans.includes(Number(key.split('x')[0]))&&r.wrong>0&&r.streak<3).map(([key,r])=>{const [a,b]=key.split('x').map(Number);return {a,b,priority:4*r.wrong/r.attempts+1/(r.streak+1)+Math.min(r.wrong,10)/10};});},
  weakQueue(facts,dans,count){return this.shuffle(this.weakFacts(facts,dans)).sort((a,b)=>b.priority-a.priority).slice(0,count).map(({a,b})=>({a,b}));},
  recordFact(facts,q,first){const key=q.a+'x'+q.b,prev=facts[key]||{attempts:0,wrong:0,streak:0};return {...facts,[key]:{attempts:prev.attempts+1,wrong:prev.wrong+(first?0:1),streak:first?prev.streak+1:0,last:new Date().toISOString()}};},
  check(q,value){return /^\d{1,2}$/.test(value)&&Number(value)===q.a*q.b;},
  validHistory(value){return Array.isArray(value)&&value.every(r=>r&&typeof r.id==='string'&&typeof r.date==='string'&&Number.isInteger(r.total)&&r.total>=1&&r.total<=30&&Number.isInteger(r.first)&&r.first>=0&&r.first<=r.total&&Number.isInteger(r.second)&&r.second>=0&&r.first+r.second<=r.total);}
};
const TimesGarden={
  mode:'learn',dans:[2],count:10,phase:'home',queue:[],records:[],index:0,tries:0,done:false,retry:false,saved:false,saveError:false,
  active(){return screen==='times'&&this.phase==='quiz';},
  open(){if(!authenticated)return login();stopDictation();screen='times';setStudyScreen(screen);this.phase='home';this.home();window.scrollTo(0,0);},
  home(){
    if(this.nextTimer){clearTimeout(this.nextTimer);this.nextTimer=null;}this.phase='home';window.GardenNav?.sync('times-home');
    const single=['learn','ordered'].includes(this.mode);if(single)this.dans=this.dans.slice(0,1);
    let weakCount=0,factError=false;const weakDans=new Set();try{const weak=TimesEngine.weakFacts(TimesEngine.readFacts(),[2,3,4,5,6,7,8,9]);weak.forEach(q=>weakDans.add(q.a));weakCount=weak.filter(q=>this.dans.includes(q.a)).length;}catch{factError=true;}
    app.innerHTML=`<section class="panel times"><span class="eyebrow">조금씩 익히는 구구단</span><h1>🌻 구구단 연습</h1><p>그림으로 익히고, 내 속도로 풀어 봐요.</p><fieldset><legend>어떻게 연습할까요?</legend><div class="times-options times-mode-options">${[['learn','🌷','곱셈 익히기'],['ordered','🔢','순서대로 풀기'],['mixed','🎲','섞어서 풀기'],['weak','🌱','틀린 문제']].map(([v,icon,t])=>`<button type="button" class="times-mode-card" data-mode="${v}" aria-pressed="${this.mode===v}"><span aria-hidden="true">${icon}</span><small>${t}</small></button>`).join('')}</div></fieldset><fieldset><legend>${single?'한 단을 골라 주세요.':'연습할 단을 모두 골라 주세요.'}</legend><div class="times-options">${[2,3,4,5,6,7,8,9].map(d=>`<button type="button" class="ghost${weakDans.has(d)?' has-mistakes':''}" data-dan="${d}" aria-pressed="${this.dans.includes(d)}" aria-label="${d}단${weakDans.has(d)?', 복습할 틀린 문제 있음':''}">${d}단${weakDans.has(d)?'<span class="dan-mistake-dot" aria-hidden="true"></span>':''}</button>`).join('')}</div></fieldset>${!single?`<div class="times-count-row"><label for="times-count">문제 수<select id="times-count">${[10,20,30].map(n=>`<option ${n===this.count?'selected':''}>${n}</option>`).join('')}</select></label><button type="button" id="times-all" class="ghost">전체 선택</button><button type="button" id="times-none" class="ghost">전체 해제</button></div>`:this.mode==='ordered'?'<p>한 단 끝까지 · 9문제 (×1부터 ×9까지)</p>':'<p>묶음을 누르면 1묶음부터 차례로 강조돼요.</p>'}${this.mode==='weak'?`<p class="muted">${factError?'오답 기록을 읽지 못했어요. 백업 파일이나 저장 상태를 확인해 주세요.':weakCount?'선택한 단의 틀린 식 '+weakCount+'개 중 최대 '+this.count+'문제를 풀어요.':'선택한 단에 모아둔 틀린 문제가 없어요. 새로 푼 문제부터 모아요.'}</p><p class="muted">혼자 연속 세 번 맞히면 틀린 문제에서 빠져요.</p>`:''}<button id="times-start" ${!this.dans.length||this.mode==='weak'&&(!weakCount||factError)?'disabled':''}>${this.mode==='learn'?'그림 보러 가기':this.mode==='weak'?'틀린 문제 풀기':'연습 시작하기'}</button></section>`;
    document.querySelectorAll('[data-mode]').forEach(el=>el.onclick=()=>{this.mode=el.dataset.mode;this.home();});
    document.querySelectorAll('[data-dan]').forEach(el=>el.onclick=()=>{const d=Number(el.dataset.dan);this.dans=single?[d]:this.dans.includes(d)?this.dans.filter(x=>x!==d):[...this.dans,d];this.home();});
    const all=document.querySelector('#times-all');if(all)all.onclick=()=>{this.dans=[2,3,4,5,6,7,8,9];this.home();};
    const none=document.querySelector('#times-none');if(none)none.onclick=()=>{this.dans=[];this.home();};
    const count=document.querySelector('#times-count');if(count)count.onchange=()=>{this.count=Number(count.value);if(this.mode==='weak')this.home();};
    document.querySelector('#times-start').onclick=()=>{
      if(!this.dans.length)return;
      if(this.mode==='learn'){this.b=1;this.revealed=false;this.highlight=0;this.learn();}
      else if(this.mode==='weak'){try{const queue=TimesEngine.weakQueue(TimesEngine.readFacts(),this.dans,this.count);if(queue.length)this.start(queue);}catch{this.home();}}
      else this.start(TimesEngine.makeQueue(this.dans,this.count,this.mode==='ordered'));
    };
  },
  picture(a,b,interactive=false,highlight=0){
    return `<div class="times-picture ${a>=8?'times-dots':''}" role="group" aria-label="${a}개씩 ${b}묶음">${Array.from({length:b},(_,i)=>`<${interactive?'button':'div'} ${interactive?`type="button" data-group="${i+1}" aria-pressed="${i<highlight}"`:''} class="times-group ${i<highlight?'lit':''}" aria-label="${i+1}번째 묶음, ${a}개"><span class="times-objects" style="--objects:${a}" aria-hidden="true">${Array.from({length:a},()=>a>=8?'<i></i>':'<span>🍎</span>').join('')}</span><small>${i+1}묶음</small></${interactive?'button':'div'}>`).join('')}</div>`;
  },
  bindHome(){document.querySelector('#times-home').onclick=()=>{if(this.active()&&!confirm('구구단 홈으로 갈까요? 풀고 있는 연습은 저장되지 않아요.'))return;this.home();};},
  learn(){
    this.phase='learn';window.GardenNav?.sync('times-learn');const a=this.dans[0],b=this.b;
    app.innerHTML=`<section class="panel times"><button id="times-home" class="ghost">← 구구단 홈</button><h2>${a}단 · 곱셈 익히기</h2><p>${a}개씩 ${b}묶음이에요.</p>${this.picture(a,b,true,this.highlight)}<p id="times-group-total" role="status">${this.highlight?`${a}개씩 ${this.highlight}묶음은 ${a*this.highlight}개예요.`:'묶음을 눌러 함께 세어 보세요.'}</p><p class="times-sum">${Array(b).fill(a).join(' + ')} = <button type="button" class="times-question" data-reveal aria-label="덧셈식 정답 ${this.revealed?'가리기':'보기'}">${this.revealed?a*b:'?'}</button></p><div class="times-equation">${a} × ${b} = <button type="button" class="times-question" data-reveal aria-label="곱셈식 정답 ${this.revealed?'가리기':'보기'}">${this.revealed?a*b:'?'}</button></div><div class="actions"><button id="times-prev" class="ghost" ${b===1?'disabled':''}>← 이전 식</button><button id="times-next" ${b===9?'disabled':''}>다음 식 →</button></div><p class="muted">${b} / 9</p></section>`;
    this.bindHome();document.querySelectorAll('[data-reveal]').forEach(button=>button.onclick=()=>{this.revealed=!this.revealed;this.learn();});
    document.querySelectorAll('[data-group]').forEach(el=>el.onclick=()=>{this.highlight=Number(el.dataset.group);document.querySelectorAll('[data-group]').forEach(g=>{const lit=Number(g.dataset.group)<=this.highlight;g.classList.toggle('lit',lit);g.setAttribute('aria-pressed',String(lit));});document.querySelector('#times-group-total').textContent=`${a}개씩 ${this.highlight}묶음은 ${a*this.highlight}개예요.`;});
    const move=delta=>{this.b+=delta;this.revealed=false;this.highlight=0;this.learn();};
    document.querySelector('#times-prev').onclick=()=>{if(this.b>1)move(-1);};document.querySelector('#times-next').onclick=()=>{if(this.b<9)move(1);};
  },
  start(queue,retry=false){this.queue=queue.map(q=>({...q}));this.records=[];this.index=0;this.retry=retry;this.saved=false;this.saveError=false;this.id=Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);this.beginQuestion();},
  beginQuestion(){if(this.nextTimer){clearTimeout(this.nextTimer);this.nextTimer=null;}this.tries=0;this.done=false;this.phase='quiz';this.quiz();},
  quiz(){
    window.GardenNav?.sync('times-quiz');const q=this.queue[this.index];
    app.innerHTML=`<section class="panel times"><button id="times-home" class="ghost">← 구구단 홈</button><p class="eyebrow">${this.retry?'다시 연습':'구구단 연습'} · ${this.index+1} / ${this.queue.length}</p><h2>곱을 구해 보세요.</h2><form id="times-form"><label class="times-equation" for="times-answer">${q.a} × ${q.b} = <input id="times-answer" class="entry" type="text" inputmode="numeric" autocomplete="off" maxlength="2" aria-label="곱의 값"></label><p id="times-feedback" role="status" aria-live="polite">천천히 생각해도 괜찮아요.</p><div class="times-keypad">${[1,2,3,4,5,6,7,8,9,'지우기',0,'⌫'].map(k=>`<button type="button" class="ghost" data-key="${k}" aria-label="${k==='⌫'?'한 자리 지우기':k}">${k}</button>`).join('')}</div><button id="times-check" type="submit">확인</button></form><div id="times-help"></div><button id="times-continue" hidden>다음 문제 →</button></section>`;
    this.bindHome();const input=document.querySelector('#times-answer');
    input.oninput=()=>{input.value=input.value.replace(/\D/g,'').slice(0,2);};
    document.querySelectorAll('[data-key]').forEach(el=>el.onclick=()=>{if(this.done)return;const k=el.dataset.key;input.value=k==='지우기'?'':k==='⌫'?input.value.slice(0,-1):(input.value+k).slice(0,2);});
    document.querySelector('#times-form').onsubmit=e=>{e.preventDefault();this.submit();};
    document.querySelector('#times-continue').onclick=()=>this.advance();
  },
  submit(){
    if(this.done)return;const input=document.querySelector('#times-answer'),feedback=document.querySelector('#times-feedback'),q=this.queue[this.index];
    if(!/^\d{1,2}$/.test(input.value)){feedback.textContent='답을 써 주세요.';return;}
    const correct=TimesEngine.check(q,input.value);this.tries++;
    if(!correct&&this.tries===1){feedback.textContent='한 번 더 생각해 볼까요?';input.value='';return;}
    this.done=true;this.records.push({...q,first:correct&&this.tries===1,second:correct&&this.tries===2});
    try{localStorage.setItem('garden-times-facts',JSON.stringify(TimesEngine.recordFact(TimesEngine.readFacts(),q,correct&&this.tries===1)));}catch{this.saveError=true;}
    feedback.textContent=correct?(this.tries===1?'맞았어요! 🌼':'다시 풀어 맞혔어요! 🌱'):`${q.a} × ${q.b} = ${q.a*q.b}입니다. 그림으로 확인해요.`;
    input.disabled=true;document.querySelector('#times-check').hidden=true;document.querySelectorAll('[data-key]').forEach(el=>el.disabled=true);
    if(!correct)document.querySelector('#times-help').innerHTML=`${this.picture(q.a,q.b)}<p>${q.a}개씩 ${q.b}묶음은 ${q.a*q.b}개예요.</p><p class="times-sum">${Array(q.b).fill(q.a).join(' + ')} = ${q.a*q.b}</p>`;
    const next=document.querySelector('#times-continue');next.hidden=false;next.textContent=correct?'맞았어요! 다음 문제로 이동해요…':this.index===this.queue.length-1?'결과 보기':'다음 문제 →';
    if(correct)this.scheduleAdvance();
  },
  advance(){if(!this.done)return;if(this.nextTimer){clearTimeout(this.nextTimer);this.nextTimer=null;}if(++this.index<this.queue.length)this.beginQuestion();else this.finish();},
  scheduleAdvance(){if(this.nextTimer)clearTimeout(this.nextTimer);this.nextTimer=setTimeout(()=>{this.nextTimer=null;if(this.phase==='quiz'&&this.done)this.advance();},800);},
  finish(){
    this.phase='result';window.GardenNav?.sync('times-result');const first=this.records.filter(r=>r.first).length,second=this.records.filter(r=>r.second).length;
    if(!this.saved&&!this.retry){this.saved=true;try{const old=readStudyValue('garden-times-history',[]);if(!TimesEngine.validHistory(old))throw Error('기록 형식');localStorage.setItem('garden-times-history',JSON.stringify([...old,{id:this.id,date:new Date().toISOString(),total:this.queue.length,first,second}]));}catch{this.saveError=true;}}
    this.wrong=this.records.filter(r=>!r.first);
    app.innerHTML=`<section class="panel times"><span class="eyebrow">${this.retry?'다시 연습 완료':'오늘도 한 걸음 성장했어요'}</span><h1>끝까지 해냈어요! 🌻</h1><p>처음에 맞힌 문제 <strong>${first}개</strong><br>다시 풀어 맞힌 문제 <strong>${second}개</strong><br>정답을 함께 확인한 문제 <strong>${this.queue.length-first-second}개</strong></p>${this.saveError?'<p role="alert">기록을 저장하지 못했어요. 현재 결과는 아래에서 확인할 수 있어요.</p>':''}<div class="actions">${this.wrong.length?'<button id="times-retry">틀린 문제 다시 풀기</button>':''}<button id="times-home" class="ghost">구구단 홈</button></div>${this.wrong.length?`<h2>다시 살펴볼 식</h2><p class="muted">처음에 틀렸던 문제를 모았어요.</p>${this.wrong.map(q=>`<p>${q.a} × ${q.b} = ${q.a*q.b}</p>`).join('')}`:'<p>모두 처음에 맞혔어요! 🌼</p>'}</section>`;
    this.bindHome();const retry=document.querySelector('#times-retry');if(retry)retry.onclick=()=>this.start(this.wrong,true);
  }
};
