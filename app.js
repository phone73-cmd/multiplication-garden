const app=document.querySelector('#app');
const names=["그림 보고 덧셈식·곱셈식 완성하기", "곱셈식의 차이", "계산 방법 빈칸", "맞는 설명 고르기", "숫자판에서 찾기", "조건에 맞는 수", "같은 곱 연결하기", "생활 속 곱셈", "그림 보고 곱셈식 만들기", "문장 읽고 식과 답 쓰기", "0과 1의 곱", "곱셈식 빈칸 찾기", "곱셈표 채우기", "곱의 크기 비교", "몇 배인지 알아보기", "잘못된 계산 고치기", "계산 방법 설명하기", "곱셈 이야기 만들기", "가능한 식 모두 고르기"];
const typeOrder=[0,8,1,2,3,4,5,6,7,9,10,11,12,13,14,18,15,16,17];
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const rand=(a,b)=>a+Math.floor(Math.random()*(b-a+1));const shuffle=a=>a.map(x=>({x,r:Math.random()})).sort((a,b)=>a.r-b.r).map(o=>o.x);
let qs=[],answers=[],pos=0,reviewMode=false,history=[],screen='login',authenticated=false,scoreSavedForRun=false,manualChecks={},runId='';
try{authenticated=sessionStorage.getItem('garden-authenticated')==='yes';}catch{}
try{const saved=JSON.parse(localStorage.getItem('garden-history')||'[]');if(Array.isArray(saved))history=saved.filter(h=>h&&Number.isFinite(h.score));}catch{}
function home(){if(!authenticated)return login();screen='home';setStudyScreen(screen);app.innerHTML=`<div class="hero"><div><span class="eyebrow">오늘도 한 뼘 자라는 수학</span><h1>생각하는 곱셈,<br>자신감이 활짝!</h1><p>그림부터 설명까지 19가지 유형을 연습해요.<br>틀려도 괜찮아요. 다시 풀며 함께 배워요.</p></div><div class="garden" aria-hidden="true"><div class="flower">🌷🌼🌷</div><small>보고 · 생각하고 · 풀어 봐요</small></div></div><section class="panel"><div class="topline"><h2>나만의 단원평가</h2><span class="muted">시간 제한 없음</span></div><div class="settings"><label>연습할 단<select id="dan"><option value="all">2~9단 골고루</option>${Array.from({length:8},(_,i)=>`<option>${i+2}</option>`).join('')}</select></label><label>문제 수<select id="count"><option>10</option><option>20</option><option>30</option></select></label><label>문제 유형<select id="type"><option value="mix">19가지 골고루</option>${typeOrder.map((t,i)=>`<option value="${t}">${i+1}. ${names[t]}</option>`).join('')}</select></label><button id="start">평가 시작하기 →</button></div><p class="muted">생활 속 곱셈은 20가지 소재의 그림 문제예요. 생활 속 곱셈·20문제를 고르면 모든 소재를 한 번씩 풀어요. 20·30문제에서는 19가지 유형을 모두 연습해요. 10문제에서는 기본·응용·설명 문제를 골고루 풀어요. ‘조건에 맞는 수’와 ‘같은 곱 연결하기’에는 다른 단도 함께 나올 수 있어요. 설명 문제는 함께 확인한 뒤 기록돼요.</p></section><div class="stats"><div class="stat"><span class="muted">완료한 평가</span><strong>${history.length}회</strong></div><div class="stat"><span class="muted">최고 점수</span><strong>${history.length?Math.max(...history.map(h=>h.score)):0}점</strong></div><div class="stat"><span class="muted">최근 평가</span><strong>${history.length?history.at(-1).score+'점':'첫 도전'}</strong></div></div><p class="muted">기본·응용·설명 문제를 함께 연습해요. 골고루 구성의 설명 문제는 10문제에 1개, 20·30문제에 2개예요. 설명은 결과 화면에서 보호자와 확인해요. 학습 기록은 지금 사용하는 브라우저에 저장돼요.</p>`;document.querySelector('#start').onclick=start}
const field=(label,value)=>({label,value});
const lifeScenes=[
['달팽이','🐌','cm','움직인'],['토끼','🐇','m','뛰어간'],['자동차','🚗','m','이동한'],['개구리','🐸','cm','뛰어간'],['메뚜기','🦗','cm','뛰어간'],['거북이','🐢','cm','걸어간'],['강아지','🐕','m','걸어간'],['고양이','🐈','m','걸어간'],['다람쥐','🐿️','m','뛰어간'],['말','🐎','m','달려간'],['캥거루','🦘','m','뛰어간'],['병아리','🐥','cm','걸어간'],['오리','🦆','m','걸어간'],['펭귄','🐧','m','걸어간'],['로봇','🤖','cm','이동한'],['장난감 자동차','🏎️','cm','이동한'],['기차','🚂','m','이동한'],['버스','🚌','m','이동한'],['자전거','🚲','m','이동한'],['공','⚽','cm','굴러간']
];
function movementPicture(a,b,scene,hideStep=false){const w=b*84+48,y=114;const segments=Array.from({length:b},(_,i)=>{const x=24+i*84;return `<g class="movement-segment"><path d="M ${x} ${y} Q ${x+42} 18 ${x+84} ${y}" fill="none" stroke="#7ca7ab" stroke-width="2.5" stroke-dasharray="4 4"/><text x="${x+42}" y="49" text-anchor="middle" font-size="19" fill="var(--ink)">${hideStep?"?":a}${scene[2]}</text></g>`}).join('');return `<div class="movement-scroll" tabindex="0" role="img" aria-label="${scene[0]}의 이동 그림. 한 구간 ${hideStep?"알맞은 거리":a+scene[2]}. 출발부터 도착까지 그려진 같은 길이의 구간을 세어 보세요."><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} 187" style="min-width:${Math.max(280,b*60+36)}px" aria-hidden="true"><rect x="24" y="${y}" width="${b*84}" height="15" rx="3" fill="#b7c594"/>${segments}${Array.from({length:b+1},(_,i)=>`<path d="M ${24+i*84} 108 v21" stroke="#7c956b" stroke-width="2"/>`).join('')}<text x="24" y="160" text-anchor="middle" font-size="28">${scene[1]}</text><text x="${w-24}" y="160" text-anchor="middle" font-size="28">${scene[1]}</text><text x="24" y="182" text-anchor="middle" font-size="12" fill="var(--muted)">출발</text><text x="${w-24}" y="182" text-anchor="middle" font-size="12" fill="var(--muted)">도착</text></svg></div><p class="muted" style="text-align:center">그림의 구간을 세어 보세요. 길면 좌우로 밀어서 끝까지 보세요.</p>`}
const pictureItems=[['꽃','🌷'],['사탕','🍬'],['사과','🍎'],['공','⚽'],['연필','✏️'],['장난감 자동차','🚗'],['딸기','🍓'],['별','⭐'],['귤','🍊'],['곰 인형','🧸']];
function groupPicture(a,b,item){return `<div class="count-groups" role="img" aria-label="${item[0]} ${a}개씩 ${b}묶음">${Array.from({length:b},()=>`<div class="count-group">${Array(a).fill(`<span class="count-item" aria-hidden="true">${item[1]}</span>`).join('')}</div>`).join('')}</div>`}
function arrayPicture(a,b,item){return `<div class="array-picture" role="img" aria-label="${item[0]} 배열 그림, 한 줄에 ${b}개씩 ${a}줄"><div class="count-array" style="grid-template-columns:repeat(${b},minmax(0,1fr))">${Array.from({length:a*b},()=>`<span class="array-item" aria-hidden="true">${item[1]}</span>`).join('')}</div></div>`}
const wordScenes=[
{unit:'명',text:(a,b)=>`공원에 ${a}명이 앉을 수 있는 긴 의자가 ${b}개 있습니다. 모두 몇 명이 앉을 수 있는지 곱셈식을 이용하여 구해 보세요.`},
{unit:'개',text:(a,b)=>`사탕이 한 봉지에 ${a}개씩 들어 있습니다. ${b}봉지에 들어 있는 사탕은 모두 몇 개인지 곱셈식을 이용하여 구해 보세요.`},
{unit:'자루',text:(a,b)=>`상자 하나에 연필이 ${a}자루씩 있습니다. 상자가 ${b}개라면 연필은 모두 몇 자루인지 곱셈식을 이용하여 구해 보세요.`},
{unit:'개',text:(a,b)=>`접시에 사과를 ${a}개씩 담았습니다. 접시가 ${b}개라면 사과는 모두 몇 개인지 곱셈식을 이용하여 구해 보세요.`},
{unit:'송이',text:(a,b)=>`화분 하나에 꽃이 ${a}송이씩 피었습니다. 화분 ${b}개에 핀 꽃은 모두 몇 송이인지 곱셈식을 이용하여 구해 보세요.`},
{unit:'권',text:(a,b)=>`책꽂이 한 칸에 책이 ${a}권씩 있습니다. ${b}칸에 있는 책은 모두 몇 권인지 곱셈식을 이용하여 구해 보세요.`},
{unit:'명',text:(a,b)=>`한 모둠에 학생이 ${a}명씩 있습니다. ${b}모둠의 학생은 모두 몇 명인지 곱셈식을 이용하여 구해 보세요.`},
{unit:'개',text:(a,b)=>`장난감 자동차가 한 상자에 ${a}개씩 있습니다. ${b}상자의 장난감은 모두 몇 개인지 곱셈식을 이용하여 구해 보세요.`}
];

wordScenes.push(
{unit:'개',text:(a,b)=>`쿠키가 한 접시에 ${a}개씩 있습니다. 접시 ${b}개에 있는 쿠키는 모두 몇 개인가요?`},
{unit:'개',text:(a,b)=>`풍선을 한 줄에 ${a}개씩 묶었습니다. ${b}줄에 있는 풍선은 모두 몇 개인가요?`},
{unit:'장',text:(a,b)=>`스티커를 하루에 ${a}장씩 모았습니다. ${b}일 동안 모은 스티커는 모두 몇 장인가요?`},
{unit:'개',text:(a,b)=>`달걀이 한 상자에 ${a}개씩 있습니다. ${b}상자에 있는 달걀은 모두 몇 개인가요?`},
{unit:'개',text:(a,b)=>`블록을 한 탑에 ${a}개씩 쌓았습니다. 같은 탑 ${b}개에 쓴 블록은 모두 몇 개인가요?`},
{unit:'마리',text:(a,b)=>`물고기가 수조 하나에 ${a}마리씩 있습니다. 수조 ${b}개에 있는 물고기는 모두 몇 마리인가요?`},
{unit:'개',text:(a,b)=>`오렌지가 바구니 하나에 ${a}개씩 있습니다. 바구니 ${b}개에 있는 오렌지는 모두 몇 개인가요?`},
{unit:'개',text:(a,b)=>`공이 보관함 하나에 ${a}개씩 있습니다. 보관함 ${b}개에 있는 공은 모두 몇 개인가요?`},
{unit:'명',text:(a,b)=>`놀이기구 한 칸에 ${a}명씩 탔습니다. ${b}칸에 모두 몇 명이 탔나요?`},
{unit:'개',text:(a,b)=>`주스를 한 쟁반에 ${a}개씩 놓았습니다. 쟁반 ${b}개에 있는 주스는 모두 몇 개인가요?`},
{unit:'장',text:(a,b)=>`색종이가 한 묶음에 ${a}장씩 있습니다. ${b}묶음에 있는 색종이는 모두 몇 장인가요?`},
{unit:'개',text:(a,b)=>`장난감 기차가 한 세트에 ${a}개씩 있습니다. ${b}세트의 장난감 기차는 모두 몇 개인가요?`}
);
function makeQuestion(t,dan='all',sceneIndex=null,preset={}){return GardenQuestions.make(t,dan,sceneIndex,preset);}
function expected(q){const values=q.fields.length?q.fields.map(f=>String(f.value)):q.expected;return q.writing?[...values,q.writing.sample]:values;}
function correct(q,ans){
  if(!Array.isArray(ans))return false;
  const values=q.writing?ans.slice(0,q.fields.length):ans;
  const ex=q.fields.length?q.fields.map(f=>String(f.value)):q.expected;
  if(q.t===8||q.t===9){
    const valid=values.length===ex.length&&values.every(v=>/^\d+$/.test(v));
    const order=+values[0]===q.a&&+values[1]===q.b;
    const swap=!q.ordered&&+values[0]===q.b&&+values[1]===q.a;
    return valid&&(order||swap)&&values.slice(2).every(v=>+v===q.a*q.b);
  }
  if(q.kind==='grid'||q.kind==='multi'||q.kind==='single')return values.length===ex.length&&[...values].sort().join(',')===[...ex].sort().join(',');
  return values.length===ex.length&&ex.every((v,i)=>/^\d+$/.test(String(values[i]))&&+values[i]===+v);
}
// Sino-Korean number reading; an expression follows its last spoken number.
function finalSound(value){
  const text=String(value).trim(),digit=text.match(/(\d)$/);
  if(digit){const n=Number(digit[1]);return n===1||n===7||n===8?'rieul':[0,3,6].includes(n)?'closed':'open';}
  const code=text.charCodeAt(text.length-1)-0xac00;
  if(code>=0&&code<=11171){const final=code%28;return final===8?'rieul':final?'closed':'open';}
  return 'open';
}
function josa(value,pair){const sound=finalSound(value),closed=sound!=='open';return ({'은/는':closed?'은':'는','을/를':closed?'을':'를','이/가':closed?'이':'가','와/과':closed?'과':'와','으로/로':closed&&sound!=='rieul'?'으로':'로'})[pair];}
function subjectJosa(n){return josa(n,'은/는');}
function login(){
  screen='login';setStudyScreen(screen);
  app.innerHTML=`<section class="login-garden" aria-labelledby="login-title"><div class="login-sky" aria-hidden="true"><span class="garden-sun"><span>☀</span></span><span class="garden-cloud cloud-one"></span><span class="garden-cloud cloud-two"></span><span class="garden-butterfly"><span>🦋</span></span><div class="garden-hill"></div><div class="login-blooms">${['#f2aabc','#f7d881','#bfafe3','#f1b2c5','#f8d77b','#bcb4e4','#f1a6bc'].map((color,i)=>`<div class="bloom" style="--petal:${color};--height:${[106,135,99,151,116,139,102][i]}px;--tilt:${[-12,8,-7,5,-5,11,-8][i]}deg"><span class="bloom-stem"></span><span class="bloom-leaf"></span><span class="bloom-head">${'<i></i>'.repeat(5)}<b></b></span></div>`).join('')}</div></div><div class="login-content"><span class="login-kicker">작은 생각이 활짝 피어나는 곳</span><h1 id="login-title">지안이의<br><span>배움정원</span></h1><p>오늘도 함께 배움의 꽃을 피워 볼까요?</p><form id="login-form" autocomplete="off">${window.GardenMood?.picker()||''}<label for="garden-code">정원 입장 번호<input id="garden-code" name="garden-entry-code" type="text" inputmode="numeric" pattern="[0-9]{4}" maxlength="4" autocomplete="one-time-code" data-lpignore="true" data-1p-ignore="true" placeholder="네 자리 입장 번호" required aria-describedby="login-notice"></label><p id="login-notice" role="alert" aria-live="polite"></p><button type="submit" id="garden-enter">정원에 들어가기 <span aria-hidden="true">🌷</span></button></form></div></section>`;
  window.GardenMood?.bind(app);
  document.querySelector('#login-form').onsubmit=e=>{
    e.preventDefault();if(window.GardenMood?.drawing())return;const input=document.querySelector('#garden-code');
    if(input.value!=='0619'){document.querySelector('#login-notice').textContent='비밀번호를 다시 확인해 주세요.';input.value='';input.focus();return;}
    window.GardenMood?.enter();
    authenticated=true;try{sessionStorage.setItem('garden-authenticated','yes');}catch{}input.value='';hub();window.scrollTo(0,0);
  };
}

function differenceSentence(q,v){return `${q.a} × ${q.small} = ${v[0]}입니다. ${q.a} × ${q.b}${subjectJosa(q.b)} ${q.a} × ${q.small}보다 ${q.a}씩 ${v[1]}묶음이 더 많으므로 ${v[2]}만큼 더 큽니다.`;}
function methodMarkup(q,v){return `<div class="method-block"><h3>방법 ①</h3><div>${q.a} × ${q.b}${subjectJosa(q.b)} ${q.a}씩 ${v[0]}번 더해서 계산할 수 있어.</div><div class="method-equation">${q.a} × ${q.b} = ${Array(q.b).fill(q.a).join(' + ')} = ${v[1]}</div></div><div class="method-block"><h3>방법 ②</h3><div>${q.a} × ${q.prev}의 값에 ${v[2]}만큼 더하는 방법도 있어.</div><div class="method-step"><div class="method-equations"><div>${q.a} × ${q.prev} = ${q.a*q.prev}</div><div>${q.a} × ${q.b} = ${v[3]}</div></div><div class="method-arrow"><svg viewBox="0 0 54 108" aria-hidden="true"><path d="M 5 9 C 61 9 61 93 7 93 M 17 82 L 5 93 L 19 101" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/></svg><span class="arrow-plus">+ ${v[4]}</span></div></div></div>`;}
function tableMarkup(q,values){return `<div class="table-scroll"><table class="multiplication-table"><caption>왼쪽 수 × 위쪽 수</caption><thead><tr><th scope="col">×</th>${q.table.cols.map(n=>`<th scope="col">${n}</th>`).join('')}</tr></thead><tbody>${q.table.rows.map((r,ri)=>`<tr><th scope="row">${r}</th>${q.table.cols.map((c,ci)=>{const i=q.table.blanks.findIndex(p=>p.ri===ri&&p.ci===ci);return `<td>${i<0?r*c:values[i]}</td>`;}).join('')}</tr>`).join('')}</tbody></table></div>`;}
function inputsFor(q,ans){return q.fields.map((f,i)=>`<input class="entry sentence-entry" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="3" autocomplete="off" value="${esc(ans[i]??'')}" aria-label="${esc(f.label)}" data-answer-index="${i}">`);}
function controls(q){
  const ans=answers[pos]||[],v=inputsFor(q,ans);
  if(q.t===8||q.t===9)return `<div class="make-equation">${q.t===9?'<span class="equation-tag">식:</span>':''}${v[0]} × ${v[1]} = ${v[2]}</div>${q.t===9?`<div class="make-equation"><span class="equation-tag">답:</span>${v[3]} ${q.unit}</div>`:''}`;
  if(q.t===7)return `<div class="life-equation">${q.moveMode===0?`${q.a} × ${v[0]} = ${v[1]}`:q.moveMode===1?`${q.a} × ${v[0]} = ${q.a*q.b}`:`${v[0]} × ${q.b} = ${q.a*q.b}`} (${q.unit})</div>`;
  if(q.t===2)return `<div class="methods">${methodMarkup(q,v)}</div>`;
  if(q.t===0)return `<div class="picture-equations"><div>${Array(q.b).fill(q.a).join(' + ')} = ${v[0]}</div><div>${q.a} × ${q.b} = ${v[1]}</div></div>`;
  if(q.t===1)return `<div class="sentence-fields">${differenceSentence(q,v)}</div>`;
  if(q.t===10)return `<div class="make-equation">${q.zeroOne.left} × ${q.zeroOne.right} = ${v[0]}</div>`;
  if(q.t===11)return `<div class="make-equation">${q.missingSide===0?v[0]:q.a} × ${q.missingSide===1?v[0]:q.b} = ${q.a*q.b}</div>`;
  if(q.t===12)return tableMarkup(q,v);
  if(q.kind==='multi'||q.kind==='single')return `<div class="choices explanation-choices">${q.options.map((o,i)=>`<label><input class="choice" type="${q.kind==='single'?'radio':'checkbox'}" name="choice" value="${i}" ${ans.includes(String(i))?'checked':''}><span>${q.kind==='single'?'':choiceSymbol(i)+' '}${esc(o.text)}</span></label>`).join('')}</div>`;
  if(q.kind==='grid')return `<p style="text-align:center" class="muted">숫자를 다시 누르면 선택을 취소해요.</p><div class="number-grid">${q.nums.map(n=>`<button type="button" class="cell" data-value="${n}" aria-pressed="${ans.includes(String(n))}">${n}</button>`).join('')}</div>`;
  if(q.kind==='match')return `<div class="matching">${q.pairs.map((p,i)=>`<label><span class="match-left">${p.left}</span><svg class="match-arrow" viewBox="0 0 90 40" aria-hidden="true"><path d="M8 20 C 27 5 45 35 76 20 M 63 9 L 78 20 L 63 31" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg><select class="entry" data-answer-index="${i}" aria-label="${p.left}${josa(p.left,'와/과')} 같은 곱"><option value="">짝 선택</option>${q.right.map((r,j)=>`<option value="${j}" ${ans[i]===String(j)?'selected':''}>${r}</option>`).join('')}</select></label>`).join('')}</div>`;
  return `<div class="fields">${q.fields.map((f,i)=>`<label>${esc(f.label)}${v[i]}</label>`).join('')}</div>`;
}
function choiceSymbol(i){return ['㉠','㉡','㉢','㉣','㉤','㉥','㉦','㉧','㉨','㉩','㉪','㉫'][i]||String(i+1);}
function writingControl(q){return `<label class="writing-label" for="explanation">${q.t===17?'나의 이야기':'나의 설명'}<textarea id="explanation" class="writing-entry" rows="3" maxlength="800" placeholder="생각한 방법을 짧게 써 보세요.">${esc((answers[pos]||[])[q.fields.length]??'')}</textarea></label>`;}
function readAnswer(){
  const q=qs[pos];
  if(q.kind==='multi'||q.kind==='single')return Array.from(document.querySelectorAll('.choice:checked'),e=>e.value);
  if(q.kind==='grid')return Array.from(document.querySelectorAll('.cell[aria-pressed="true"]'),e=>e.dataset.value);
  const ans=Array.from(document.querySelectorAll('.entry')).sort((x,y)=>+x.dataset.answerIndex-+y.dataset.answerIndex).map(e=>e.value.trim());
  if(q.writing)ans.push(document.querySelector('#explanation').value.trim());return ans;
}
function typePlan(n){
  const basic=[0,8,1,2,4,10,11,12,13,14,15],applied=[3,5,6,7,9,18],written=[16,17];
  const counts=n===10?[6,3,1]:n===20?[12,6,2]:[19,9,2];
  const take=(pool,k)=>{const out=[];while(out.length<k)out.push(...shuffle(pool).slice(0,k-out.length));return out;};
  return shuffle([...take(basic,counts[0]),...take(applied,counts[1]),...take(written,counts[2])]);
}
function questionKey(q){const numbers=q.t===10?q.zeroOne:q.t===5?q.condition:q.t===6?q.pairs:q.t===12?q.table:[q.a,q.b,q.small,q.prev,q.moveMode,q.missingSide];return JSON.stringify([q.t,numbers,q.text,q.visual,q.fields,q.options,q.ordered]);}
function buildAssessment(dan,n,t){
  const types=t==='mix'?typePlan(n):Array(n).fill(+t),seen=new Set(),lifeOrder=shuffle(lifeScenes.map((_,i)=>i)),decks=new Map(),variants=new Map();let lifeCount=0;
  const drawPair=type=>{let deck=decks.get(type);if(!deck||!deck.length){const aa=shuffle([2,3,4,5,6,7,8,9]),bb=shuffle([2,3,4,5,6,7,8,9]);deck=bb.map((b,i)=>({a:dan==='all'?aa[i]:+dan,b}));decks.set(type,deck);}return deck.shift();};
  return types.map((type,i)=>{
    const scene=type===7?lifeOrder[lifeCount++%lifeOrder.length]:null;
    const count=variants.get(type)||0;variants.set(type,count+1);
    // Keep each eight-question cycle balanced; retry only the presentation of that pair.
    const pair=drawPair(type);let q,best;
    for(let tries=0;tries<40;tries++){
      q=makeQuestion(type,dan,scene,{...pair,variant:(count+tries)%(type===10?4:3)});best=q;
      if(!seen.has(questionKey(q)))break;
    }
    seen.add(questionKey(best));best.id=`q${i}`;return best;
  });
}
function start(){
  if(!authenticated)return login();
  const dan=document.querySelector('#dan').value,n=+document.querySelector('#count').value,t=document.querySelector('#type').value;
  qs=buildAssessment(dan,n,t);answers=qs.map(()=>[]);pos=0;reviewMode=false;manualChecks={};runId=`${Date.now()}-${Math.random().toString(36).slice(2)}`;scoreSavedForRun=false;render();window.scrollTo(0,0);
}
function render(){
  if(!authenticated)return login();
  screen='quiz';setStudyScreen(screen);const q=qs[pos];
  app.innerHTML=`<div class="topline"><span class="eyebrow">${reviewMode?'오답 다시 풀기':'곱셈 단원평가'}</span><button id="exit" class="ghost">처음으로</button></div><section class="panel"><div class="topline"><strong>${pos+1} / ${qs.length} 문제</strong><span class="muted">${names[q.t]}</span></div><div class="track"><div style="width:${(pos+1)/qs.length*100}%"></div></div><div class="question">${esc(q.text)}</div>${q.scopeNote?`<p class="scope-note">${esc(q.scopeNote)}</p>`:''}${q.visual}<form id="form">${controls(q)}${q.writing?writingControl(q):''}<div id="notice" role="alert"></div><div class="actions">${pos?'<button type="button" class="ghost" id="prev">← 이전 문제</button>':''}<button type="submit">${pos===qs.length-1?'채점하기 ✓':'다음 문제 →'}</button></div></form></section><p class="muted" style="text-align:center">${q.writing?'설명은 결과 화면에서 함께 읽고 확인해요.':'빈칸과 선택을 모두 맞히면 정답이에요.'}</p>`;
  document.querySelector('#exit').onclick=()=>{if(confirm('처음으로 돌아갈까요? 풀고 있는 답은 저장되지 않아요.'))home();};
  document.querySelectorAll('.cell').forEach(e=>e.onclick=()=>e.setAttribute('aria-pressed',e.getAttribute('aria-pressed')!=='true'));
  if(pos)document.querySelector('#prev').onclick=()=>{answers[pos]=readAnswer();pos--;render();window.scrollTo(0,0);};
  document.querySelector('#form').onsubmit=e=>{
    e.preventDefault();const ans=readAnswer(),numeric=q.writing?ans.slice(0,q.fields.length):ans;
    if(!ans.length||((q.kind==='fields'||q.kind==='match')&&numeric.some(v=>!/^\d{1,3}$/.test(v)))||(q.writing&&!ans[q.fields.length])){
      document.querySelector('#notice').textContent=q.writing?'빈칸과 나의 설명을 모두 채워 주세요.':['multi','single','grid'].includes(q.kind)?'맞다고 생각하는 항목을 골라 주세요.':'모든 빈칸을 채워 주세요.';return;
    }
    answers[pos]=ans;if(pos<qs.length-1){pos++;render();window.scrollTo(0,0);}else result();
  };
}
function describe(q,ans){
  if(!Array.isArray(ans))ans=[];
  if(q.t===8||q.t===9)return `${q.t===9?'식: ':''}[${ans[0]??'미입력'}] × [${ans[1]??'미입력'}] = [${ans[2]??'미입력'}]${q.t===9?` / 답: [${ans[3]??'미입력'}] ${q.unit}`:''}`;
  if(q.t===7)return q.moveMode===0?`${q.a} × [${ans[0]??'미입력'}] = [${ans[1]??'미입력'}] (${q.unit})`:q.moveMode===1?`${q.a} × [${ans[0]??'미입력'}] = ${q.a*q.b} (${q.unit})`:`[${ans[0]??'미입력'}] × ${q.b} = ${q.a*q.b} (${q.unit})`;
  if(q.t===2)return `방법 ①: ${q.a}씩 [${ans[0]??'미입력'}]번 더하기 / 덧셈의 합 [${ans[1]??'미입력'}]\n방법 ②: ${q.a} × ${q.prev}의 값에 [${ans[2]??'미입력'}] 더하기 / 곱 [${ans[3]??'미입력'}] / 화살표 옆 + [${ans[4]??'미입력'}]`;
  if(q.t===0)return `${Array(q.b).fill(q.a).join(' + ')} = [${ans[0]??'미입력'}] / ${q.a} × ${q.b} = [${ans[1]??'미입력'}]`;
  if(q.t===1)return differenceSentence(q,ans.map(v=>`[${v}]`));
  if(q.t===10)return `${q.zeroOne.left} × ${q.zeroOne.right} = [${ans[0]??'미입력'}]`;
  if(q.t===11)return `${q.missingSide===0?'['+(ans[0]??'미입력')+']':q.a} × ${q.missingSide===1?'['+(ans[0]??'미입력')+']':q.b} = ${q.a*q.b}`;
  if(q.kind==='multi'||q.kind==='single')return ans.map(i=>q.options[+i]?`${q.kind==='single'?'':choiceSymbol(+i)+' '}${q.options[+i].text}`:'미선택').join(', ');
  if(q.kind==='grid')return ans.join(', ');
  if(q.kind==='match')return q.pairs.map((p,i)=>`${p.left} ↔ ${ans[i]!==''&&q.right[+ans[i]]?q.right[+ans[i]]:'미선택'}`).join(' / ');
  return q.fields.map((f,i)=>`${f.label}: ${ans[i]??'미입력'}`).join(' / ')+(q.writing?`\n설명: ${ans[q.fields.length]??'미입력'}`:'');
}
function answerState(q,ans){if(q.writing&&manualChecks[q.id]===undefined)return 'pending';if(!correct(q,ans))return 'wrong';return q.writing&&manualChecks[q.id]===false?'wrong':'good';}
function saveRun(score){
  if(reviewMode)return;
  const danStats={};
  qs.forEach((q,i)=>{if(!Number.isInteger(q.a)||q.a<2||q.a>9||q.t===6)return;const r=danStats[q.a]||(danStats[q.a]={attempts:0,wrong:0});r.attempts++;if(answerState(q,answers[i])!=='good')r.wrong++;});
  const existing=history.findIndex(h=>h.id===runId),record={id:runId,score,date:existing>=0?history[existing].date:new Date().toISOString(),danStats};
  if(existing>=0)history[existing]=record;else history.push(record);
  scoreSavedForRun=true;try{localStorage.setItem('garden-history',JSON.stringify(history));}catch{}
}
function result(){
  if(!authenticated)return login();
  screen='result';setStudyScreen(screen);const states=qs.map((q,i)=>answerState(q,answers[i])),pending=states.filter(x=>x==='pending').length,good=states.filter(x=>x==='good').length,wrong=qs.filter((q,i)=>states[i]==='wrong'),score=Math.round(good/qs.length*100);
  if(!pending)saveRun(score);
  app.innerHTML=`<section class="panel" style="text-align:center"><span class="eyebrow">${reviewMode?'오답 연습 확인':'오늘의 정원이 자랐어요'}</span><h1>${pending?'설명을 함께 확인해요 🌿':score===100?'모두 맞혔어요! 🌼':'끝까지 해냈어요! 🌱'}</h1><div class="score">${pending?'—':score}${pending?'':'<span style="font-size:24px">점</span>'}</div><p>${pending?`설명 ${pending}문항을 확인하면 점수가 완성돼요.<br>아래 기준을 보며 보호자와 함께 읽어 보세요.`:`${qs.length}문제 중 ${good}문제를 맞혔어요.`}</p><div class="actions">${wrong.length&&!pending?'<button id="retry">틀린 문제 다시 풀기</button>':''}<button id="home" class="ghost">새 평가 만들기</button></div></section>${reviewGroups(states)}`;
  document.querySelector('#home').onclick=()=>{if(pending&&!confirm('아직 확인하지 않은 설명이 있어요. 새 평가를 만들까요?'))return;home();};
  if(wrong.length&&!pending)document.querySelector('#retry').onclick=()=>{qs=wrong;answers=qs.map(()=>[]);manualChecks={};pos=0;reviewMode=true;render();window.scrollTo(0,0);};
  document.querySelectorAll('.rubric-button').forEach(button=>button.onclick=()=>{const y=window.scrollY;manualChecks[button.dataset.review]=button.dataset.value==='yes';result();window.scrollTo(0,y);});
}
function refreshCurrentScreen(){
  const y=window.scrollY;
  if(!authenticated){login();window.scrollTo(0,y);return;}
  if(screen==='hub'){hub();window.scrollTo(0,y);return;}
  if(screen==='dictation'){dictationController?.refresh();return;}
  if(screen==='times')return; // Keep current input, picture and practice progress.
  if(screen==='quiz'&&qs.length){answers[pos]=readAnswer();render();}
  else if(screen==='result')result();
  else{const prefs={dan:document.querySelector('#dan')?.value,count:document.querySelector('#count')?.value,type:document.querySelector('#type')?.value};home();for(const [id,value] of Object.entries(prefs))if(value!==undefined)document.querySelector(`#${id}`).value=value;}
  window.scrollTo(0,y);
}

function installPullToRefresh(){const indicator=document.createElement('div'),fill=document.createElement('div');indicator.setAttribute('aria-hidden','true');Object.assign(indicator.style,{position:'fixed',zIndex:'1000',top:'max(10px, env(safe-area-inset-top))',left:'50%',width:'96px',height:'7px',transform:'translate(-50%,-180%)',opacity:'0',borderRadius:'999px',background:'var(--accent-soft)',boxShadow:'0 2px 10px #355b4318',overflow:'hidden',transition:'transform .22s ease, opacity .22s ease',pointerEvents:'none'});Object.assign(fill.style,{display:'block',width:'0%',height:'100%',borderRadius:'inherit',background:'linear-gradient(90deg,var(--accent-soft),var(--accent))',transition:'width .18s ease-out'});indicator.appendChild(fill);document.body.appendChild(indicator);let startY=null,distance=0;const hide=()=>{indicator.style.transform='translate(-50%,-180%)';indicator.style.opacity='0'};window.addEventListener('touchstart',e=>{if(e.touches.length!==1||window.scrollY>0){startY=null;return}startY=e.touches[0].clientY;distance=0;fill.style.width='0%'},{passive:true});window.addEventListener('touchmove',e=>{if(startY===null||e.touches.length!==1)return;if(window.scrollY>0){startY=null;hide();return}const delta=e.touches[0].clientY-startY;if(delta<=0)return;if(e.cancelable)e.preventDefault();distance=Math.min(88,delta*.55);fill.style.width=`${Math.round(distance/88*100)}%`;indicator.style.transform=`translate(-50%,${Math.min(42,distance/2)}px)`;indicator.style.opacity='1'},{passive:false});window.addEventListener('touchend',()=>{if(startY===null)return;const shouldRefresh=distance>=58;startY=null;distance=0;if(!shouldRefresh){hide();return}fill.style.width='100%';refreshCurrentScreen();indicator.style.transform='translate(-50%,18px)';indicator.style.opacity='1';setTimeout(()=>{hide();setTimeout(()=>fill.style.width='0%',240)},520)});window.addEventListener('touchcancel',()=>{startY=null;distance=0;hide()})}

installPullToRefresh();authenticated?hub():login();
if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});
