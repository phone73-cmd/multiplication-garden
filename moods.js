/* 배움정원 v1.8.7: a remembered mood, resolved once per successful admission. */
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
  function enter(){
    state.current=state.choice==='random'?items[Math.floor(Math.random()*items.length)].key:state.choice;
    save();return current();
  }
  function current(){return items.find(x=>x.key===state.current)||items[0];}
  function picker(){
    const options=[...items,{key:'random',label:'랜덤',poster:'assets/icons/dice.webp'}];
    return '<fieldset class="mood-picker"><legend>오늘 지안이 기분은?</legend><div class="mood-grid">'+options.map(item=>'<button type="button" class="mood-choice" data-mood="'+item.key+'" aria-pressed="'+(state.choice===item.key)+'"><img src="'+item.poster+'" alt="" width="40" height="52" decoding="async"><span>'+item.label+'</span></button>').join('')+'</div></fieldset>';
  }
  function bind(root){
    const buttons=[...root.querySelectorAll('[data-mood]')];
    for(const button of buttons)button.onclick=()=>{
      choose(button.dataset.mood);
      buttons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mood===state.choice)));
    };
  }
  function markup(){
    const item=current();
    return '<div class="welcome-mood"><img id="welcome-mood-image" src="'+item.src+'" data-poster="'+item.poster+'" width="448" height="576" alt="'+item.label+' 표정의 지안이 캐릭터" decoding="async"></div>';
  }
  function bindWelcome(root){
    const img=root.querySelector('#welcome-mood-image');if(!img)return;
    const media=window.matchMedia?.('(prefers-reduced-motion: reduce)');
    const update=()=>{img.src=media?.matches?img.dataset.poster:current().src;};
    update();
    img.onerror=()=>{img.onerror=null;img.src=img.dataset.poster;};
  }
  return {items,valid,choose,enter,current,picker,bind,markup,bindWelcome,get:()=>({...state}),reload(){state=read();}};
})();
