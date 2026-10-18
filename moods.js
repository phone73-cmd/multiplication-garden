/* 배움정원 v1.8.15: a remembered mood, resolved by the visible draw before admission. */
window.GardenMood=(()=>{
  const items=[
  {
    "key": "greeting",
    "label": "인사",
    "src": "assets/moods/greeting.webp",
    "poster": "assets/moods/greeting-still.webp"
  },
  {
    "key": "eye-smile",
    "label": "눈웃음",
    "src": "assets/moods/eye-smile.webp",
    "poster": "assets/moods/eye-smile-still.webp"
  },
  {
    "key": "excited",
    "label": "신남",
    "src": "assets/moods/excited.webp",
    "poster": "assets/moods/excited-still.webp"
  },
  {
    "key": "surprised",
    "label": "놀람",
    "src": "assets/moods/surprised.webp",
    "poster": "assets/moods/surprised-still.webp"
  },
  {
    "key": "thinking",
    "label": "생각 중",
    "src": "assets/moods/thinking.webp",
    "poster": "assets/moods/thinking-still.webp"
  },
  {
    "key": "sad",
    "label": "속상함",
    "src": "assets/moods/sad.webp",
    "poster": "assets/moods/sad-still.webp"
  },
  {
    "key": "determined",
    "label": "다짐",
    "src": "assets/moods/determined.webp",
    "poster": "assets/moods/determined-still.webp"
  },
  {
    "key": "sleepy",
    "label": "졸림",
    "src": "assets/moods/sleepy.webp",
    "poster": "assets/moods/sleepy-still.webp"
  }
];
  const encouragement={
  "greeting": [
    "지안아, 반가워!",
    "오늘도 만나서 좋아!",
    "어서 와, 기다렸어!",
    "우리 같이 시작할까?",
    "오늘은 어떤 하루였어?",
    "만나니 마음이 따뜻해!",
    "반가운 인사를 나눠요!",
    "오늘도 함께해 보자!",
    "네가 와서 정원이 환해!",
    "오늘 이야기도 들려줘!"
  ],
  "eye-smile": [
    "웃는 모습이 참 예뻐!",
    "나도 따라 웃게 돼!",
    "미소가 활짝 피었네!",
    "기분 좋은 웃음이야!",
    "눈웃음이 반짝반짝!",
    "웃으니 마음도 포근해!",
    "행복한 마음을 나눠 줘!",
    "살짝 웃어도 좋아!",
    "네 미소가 참 반가워!",
    "함께 웃으니 더 좋아!"
  ],
  "excited": [
    "신나게 시작해 볼까?",
    "두근두근, 기대돼!",
    "즐거운 마음이 느껴져!",
    "오늘은 뭘 해볼까?",
    "나도 덩달아 신이 나!",
    "신나는 일 있었어?",
    "웃음꽃이 활짝 피었네!",
    "그 즐거움을 함께 나누자!",
    "콩닥콩닥, 출발해 보자!",
    "오늘도 재미를 찾아보자!"
  ],
  "surprised": [
    "깜짝 놀랐구나!",
    "무슨 일이 있었어?",
    "천천히 말해도 좋아.",
    "숨을 크게 쉬어 볼까?",
    "잠깐 멈춰도 괜찮아.",
    "네 이야기를 들어줄게.",
    "새로운 걸 발견했니?",
    "놀라운 일이었나 봐!",
    "두근대는 마음을 토닥토닥.",
    "궁금하면 같이 살펴보자!"
  ],
  "thinking": [
    "천천히 생각해 봐.",
    "곰곰이 생각하는 너, 멋져!",
    "어떤 생각을 하고 있어?",
    "서두르지 않아도 괜찮아.",
    "함께 생각해 볼까?",
    "궁금한 건 물어봐!",
    "다른 방법도 있을까?",
    "네 생각이 궁금해!",
    "하나씩 살펴보자.",
    "아하! 하는 순간이 올 거야."
  ],
  "sad": [
    "속상해도 괜찮아.",
    "네 마음을 들어줄게.",
    "잠깐 쉬어도 좋아.",
    "울고 싶으면 울어도 돼.",
    "말하고 싶을 때 들려줘.",
    "네 곁에 있어 줄게.",
    "마음을 토닥토닥.",
    "꼭 안아 주고 싶어.",
    "속상해도 넌 소중해.",
    "조용히 쉬어 가도 좋아."
  ],
  "determined": [
    "한 번 더 해보자!",
    "작은 도전부터 시작해!",
    "네 속도로 가면 돼.",
    "틀려도 다시 해보자!",
    "도전하는 너를 응원해!",
    "하나씩 해보면 돼!",
    "어려우면 도움을 청해 봐.",
    "작은 노력도 소중해.",
    "다시 해보려는 마음, 멋져!",
    "우리 함께 해보자!"
  ],
  "sleepy": [
    "잠깐 쉬어도 좋아.",
    "졸리면 쉬어 가자.",
    "기지개 쭉 펴 볼까?",
    "눈을 잠깐 쉬게 해 줘.",
    "오늘도 많이 애썼어.",
    "몸이 쉬고 싶은가 봐.",
    "쉬었다가 다시 만나자.",
    "천천히 해도 괜찮아.",
    "졸린 눈을 토닥토닥.",
    "푹 쉬고 힘을 채우자!"
  ]
};
  let activeDraw=null;
  const key='garden-mood',keys=items.map(x=>x.key);
  const validMessages=value=>value&&typeof value==='object'&&!Array.isArray(value)&&Object.entries(value).every(([mood,bag])=>keys.includes(mood)&&bag&&Number.isInteger(bag.last)&&bag.last>=0&&bag.last<10&&Array.isArray(bag.remaining)&&bag.remaining.length<=9&&new Set(bag.remaining).size===bag.remaining.length&&bag.remaining.every(i=>Number.isInteger(i)&&i>=0&&i<10&&i!==bag.last));
  const valid=value=>value&&typeof value==='object'&&!Array.isArray(value)&&[...keys,'random'].includes(value.choice)&&keys.includes(value.current)&&(value.messages===undefined||validMessages(value.messages));
  const initial=()=>({choice:'greeting',current:'greeting'});
  function read(){try{const value=JSON.parse(localStorage.getItem(key));return valid(value)?{choice:value.choice,current:value.current,messages:value.messages||{}}:initial();}catch{return initial();}}
  let state=read(),activeCaption=null;
  function leaveWelcome(){activeCaption=null;}
  function caption(){
    const mood=current().key;
    if(activeCaption?.mood===mood)return activeCaption.text;
    const bags=state.messages||(state.messages={}),previous=bags[mood],last=previous?.last;
    let remaining=previous?.remaining.slice()||[];
    if(!remaining.length){
      remaining=encouragement[mood].map((_,i)=>i);
      for(let i=remaining.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[remaining[i],remaining[j]]=[remaining[j],remaining[i]];}
      if(remaining.at(-1)===last)[remaining[0],remaining[remaining.length-1]]=[remaining.at(-1),remaining[0]];
    }
    const index=remaining.pop();bags[mood]={remaining,last:index};save();
    activeCaption={mood,text:encouragement[mood][index]};return activeCaption.text;
  }
  function save(){try{localStorage.setItem(key,JSON.stringify(state));}catch{}}
  function choose(choice){
    if(![...keys,'random'].includes(choice))return false;
    state.choice=choice;if(choice!=='random')state.current=choice;save();return true;
  }
  function enter(){save();return current();}
  function current(){return items.find(x=>x.key===state.current)||items[0];}
  function picker(){
    const options=[...items,{key:'random',label:'랜덤',poster:'assets/icons/dice.webp'}];
    return '<fieldset class="mood-picker"><legend>오늘 지안이 기분은?</legend><div class="mood-grid">'+options.map(item=>'<button type="button" class="mood-choice" data-mood="'+item.key+'" aria-pressed="'+(item.key===state.current)+'"'+(item.key==='random'?' aria-label="랜덤으로 기분 뽑기"':'')+'><img src="'+item.poster+'" alt="" width="40" height="52" decoding="async"><span>'+item.label+'</span></button>').join('')+'</div><p id="mood-draw-status" class="mood-draw-status" role="status" aria-live="polite">'+(state.choice==='random'?'오늘은 '+current().label+'!':'')+'</p></fieldset>';
  }
  function cancelDraw(){activeDraw?.cancel();}
  function bind(root){
    cancelDraw();
    const buttons=[...root.querySelectorAll('[data-mood]')],status=root.querySelector('#mood-draw-status'),submit=root.querySelector('#garden-enter'),grid=root.querySelector('.mood-grid');
    const update=()=>buttons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mood===state.current)));
    const busy=value=>{buttons.forEach(b=>b.disabled=value);if(submit)submit.disabled=value;grid?.setAttribute('aria-busy',String(value));};
    const clearHighlights=()=>buttons.forEach(b=>{b.classList.remove('is-drawing');b.classList.remove('is-picked');});
    function draw(){
      if(activeDraw)return;
      const winnerIndex=Math.floor(Math.random()*items.length),winner=items[winnerIndex];
      let timer=null,stopped=false;
      const cleanup=()=>{if(timer!==null)clearTimeout(timer);clearHighlights();busy(false);activeDraw=null;};
      const cancel=()=>{stopped=true;cleanup();update();if(status)status.textContent=state.choice==='random'?'오늘은 '+current().label+'!':'';};
      const finish=()=>{
        if(stopped)return;
        cleanup();state.choice='random';state.current=winner.key;save();update();
        buttons.find(b=>b.dataset.mood===winner.key)?.classList.add('is-picked');
        if(status)status.textContent='오늘은 '+winner.label+'!';
      };
      activeDraw={cancel};clearHighlights();buttons.forEach(b=>b.setAttribute('aria-pressed','false'));busy(true);
      if(status)status.textContent='두근두근, 어떤 기분일까?';
      if(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches){finish();return;}
      const delays=[60,70,80,90,100,110,130,160,200,240,300,360];
      let step=0;
      const tick=()=>{
        if(stopped)return;
        if(root.isConnected===false){cancel();return;}
        clearHighlights();
        const item=items[(winnerIndex-(delays.length-1)+step+items.length*2)%items.length];
        buttons.find(b=>b.dataset.mood===item.key)?.classList.add('is-drawing');
        timer=setTimeout(()=>{if(++step===delays.length)finish();else tick();},delays[step]);
      };
      tick();
    }
    for(const button of buttons)button.onclick=()=>{
      if(activeDraw)return;
      if(button.dataset.mood==='random'){draw();return;}
      clearHighlights();choose(button.dataset.mood);update();
      if(status)status.textContent='';
    };
  }
  function markup(){
    const item=current();
    return '<figure class="welcome-mood"><img id="welcome-mood-image" src="'+item.src+'" data-poster="'+item.poster+'" width="448" height="576" alt="'+item.label+' 표정의 지안이 캐릭터" decoding="async"><figcaption>'+caption()+'</figcaption></figure>';
  }
  function bindWelcome(root){
    const img=root.querySelector('#welcome-mood-image');if(!img)return;
    const media=window.matchMedia?.('(prefers-reduced-motion: reduce)');
    const update=()=>{img.src=media?.matches?img.dataset.poster:current().src;};
    update();
    img.onerror=()=>{img.onerror=null;img.src=img.dataset.poster;};
  }
  return {items,valid,choose,enter,current,picker,bind,markup,bindWelcome,leaveWelcome,cancelDraw,drawing:()=>!!activeDraw,get:()=>JSON.parse(JSON.stringify(state)),reload(){state=read();leaveWelcome();}};
})();
