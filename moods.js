/* 배움정원 v1.8.9: a remembered mood, resolved by the visible draw before admission. */
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
    greeting:'오늘도 만나서 반가워!',
    'eye-smile':'그 웃음, 참 예뻐!',
    excited:'신나는 마음으로 시작해 볼까?',
    surprised:'천천히 해도 괜찮아!',
    thinking:'곰곰이 생각하는 너, 멋져!',
    sad:'속상했구나. 잠깐 쉬어도 괜찮아.',
    determined:'하나씩 해보자. 넌 할 수 있어!',
    sleepy:'졸리면 잠깐 쉬어 가자!'
  };
  let activeDraw=null;
  const key='garden-mood',keys=items.map(x=>x.key);
  const valid=value=>value&&typeof value==='object'&&!Array.isArray(value)&&[...keys,'random'].includes(value.choice)&&keys.includes(value.current);
  const initial=()=>({choice:'greeting',current:'greeting'});
  function read(){try{const value=JSON.parse(localStorage.getItem(key));return valid(value)?{choice:value.choice,current:value.current}:initial();}catch{return initial();}}
  let state=read();
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
      const cancel=()=>{stopped=true;cleanup();if(status)status.textContent=state.choice==='random'?'오늘은 '+current().label+'!':'';};
      const finish=()=>{
        if(stopped)return;
        cleanup();state.choice='random';state.current=winner.key;save();update();
        buttons.find(b=>b.dataset.mood===winner.key)?.classList.add('is-picked');
        if(status)status.textContent='오늘은 '+winner.label+'!';
      };
      activeDraw={cancel};clearHighlights();busy(true);
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
    return '<figure class="welcome-mood"><img id="welcome-mood-image" src="'+item.src+'" data-poster="'+item.poster+'" width="448" height="576" alt="'+item.label+' 표정의 지안이 캐릭터" decoding="async"><figcaption>'+encouragement[item.key]+'</figcaption></figure>';
  }
  function bindWelcome(root){
    const img=root.querySelector('#welcome-mood-image');if(!img)return;
    const media=window.matchMedia?.('(prefers-reduced-motion: reduce)');
    const update=()=>{img.src=media?.matches?img.dataset.poster:current().src;};
    update();
    img.onerror=()=>{img.onerror=null;img.src=img.dataset.poster;};
  }
  return {items,valid,choose,enter,current,picker,bind,markup,bindWelcome,cancelDraw,drawing:()=>!!activeDraw,get:()=>({...state}),reload(){state=read();}};
})();
