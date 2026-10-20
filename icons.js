/* 배움정원 v2.0.0: shared transparent illustrations, without changing question data. */
window.GardenIcons=(()=>{
  const catalog=[
  {
    "name": "rainbow",
    "emoji": "🌈",
    "label": "무지개",
    "src": "assets/icons/rainbow.webp"
  },
  {
    "name": "sunflower",
    "emoji": "🌻",
    "label": "해바라기",
    "src": "assets/icons/sunflower.webp"
  },
  {
    "name": "book",
    "emoji": "📖",
    "label": "공책",
    "src": "assets/icons/book.webp"
  },
  {
    "name": "numbers",
    "emoji": "🔢",
    "label": "숫자 블록",
    "src": "assets/icons/numbers.webp"
  },
  {
    "name": "dice",
    "emoji": "🎲",
    "label": "주사위",
    "src": "assets/icons/dice.webp"
  },
  {
    "name": "home",
    "emoji": "🏠",
    "label": "홈",
    "src": "assets/icons/home.webp"
  },
  {
    "name": "settings",
    "emoji": "⚙️",
    "label": "설정",
    "src": "assets/icons/settings.webp"
  },
  {
    "name": "logout",
    "emoji": "🚪",
    "label": "로그아웃",
    "src": "assets/icons/logout.webp"
  },
  {
    "name": "tulip",
    "emoji": "🌷",
    "label": "튤립",
    "src": "assets/icons/tulip.webp"
  },
  {
    "name": "daisy",
    "emoji": "🌼",
    "label": "꽃",
    "src": "assets/icons/daisy.webp"
  },
  {
    "name": "herb",
    "emoji": "🌿",
    "label": "잎",
    "src": "assets/icons/herb.webp"
  },
  {
    "name": "sprout",
    "emoji": "🌱",
    "label": "새싹",
    "src": "assets/icons/sprout.webp"
  },
  {
    "name": "sun",
    "emoji": "☀",
    "label": "해",
    "src": "assets/icons/sun.webp"
  },
  {
    "name": "butterfly",
    "emoji": "🦋",
    "label": "나비",
    "src": "assets/icons/butterfly.webp"
  },
  {
    "name": "snail",
    "emoji": "🐌",
    "label": "달팽이",
    "src": "assets/icons/snail.webp"
  },
  {
    "name": "rabbit",
    "emoji": "🐇",
    "label": "토끼",
    "src": "assets/icons/rabbit.webp"
  },
  {
    "name": "frog",
    "emoji": "🐸",
    "label": "개구리",
    "src": "assets/icons/frog.webp"
  },
  {
    "name": "grasshopper",
    "emoji": "🦗",
    "label": "메뚜기",
    "src": "assets/icons/grasshopper.webp"
  },
  {
    "name": "turtle",
    "emoji": "🐢",
    "label": "거북이",
    "src": "assets/icons/turtle.webp"
  },
  {
    "name": "dog",
    "emoji": "🐕",
    "label": "강아지",
    "src": "assets/icons/dog.webp"
  },
  {
    "name": "cat",
    "emoji": "🐈",
    "label": "고양이",
    "src": "assets/icons/cat.webp"
  },
  {
    "name": "squirrel",
    "emoji": "🐿️",
    "label": "다람쥐",
    "src": "assets/icons/squirrel.webp"
  },
  {
    "name": "horse",
    "emoji": "🐎",
    "label": "말",
    "src": "assets/icons/horse.webp"
  },
  {
    "name": "kangaroo",
    "emoji": "🦘",
    "label": "캥거루",
    "src": "assets/icons/kangaroo.webp"
  },
  {
    "name": "chick",
    "emoji": "🐥",
    "label": "병아리",
    "src": "assets/icons/chick.webp"
  },
  {
    "name": "duck",
    "emoji": "🦆",
    "label": "오리",
    "src": "assets/icons/duck.webp"
  },
  {
    "name": "penguin",
    "emoji": "🐧",
    "label": "펭귄",
    "src": "assets/icons/penguin.webp"
  },
  {
    "name": "robot",
    "emoji": "🤖",
    "label": "로봇",
    "src": "assets/icons/robot.webp"
  },
  {
    "name": "car",
    "emoji": "🚗",
    "label": "자동차",
    "src": "assets/icons/car.webp"
  },
  {
    "name": "race-car",
    "emoji": "🏎️",
    "label": "장난감 자동차",
    "src": "assets/icons/race-car.webp"
  },
  {
    "name": "train",
    "emoji": "🚂",
    "label": "기차",
    "src": "assets/icons/train.webp"
  },
  {
    "name": "bus",
    "emoji": "🚌",
    "label": "버스",
    "src": "assets/icons/bus.webp"
  },
  {
    "name": "bicycle",
    "emoji": "🚲",
    "label": "자전거",
    "src": "assets/icons/bicycle.webp"
  },
  {
    "name": "soccer-ball",
    "emoji": "⚽",
    "label": "공",
    "src": "assets/icons/soccer-ball.webp"
  },
  {
    "name": "candy",
    "emoji": "🍬",
    "label": "사탕",
    "src": "assets/icons/candy.webp"
  },
  {
    "name": "apple",
    "emoji": "🍎",
    "label": "사과",
    "src": "assets/icons/apple.webp"
  },
  {
    "name": "pencil",
    "emoji": "✏️",
    "label": "연필",
    "src": "assets/icons/pencil.webp"
  },
  {
    "name": "strawberry",
    "emoji": "🍓",
    "label": "딸기",
    "src": "assets/icons/strawberry.webp"
  },
  {
    "name": "star",
    "emoji": "⭐",
    "label": "별",
    "src": "assets/icons/star.webp"
  },
  {
    "name": "orange",
    "emoji": "🍊",
    "label": "귤",
    "src": "assets/icons/orange.webp"
  },
  {
    "name": "teddy-bear",
    "emoji": "🧸",
    "label": "곰 인형",
    "src": "assets/icons/teddy-bear.webp"
  },
  {
    "name": "red-counter",
    "emoji": "🔴",
    "label": "빨간 구슬",
    "src": "assets/icons/red-counter.webp"
  },
  {
    "name": "blue-counter",
    "emoji": "🔵",
    "label": "파란 구슬",
    "src": "assets/icons/blue-counter.webp"
  }
];
  const lookup=new Map(catalog.map(item=>[item.emoji.replace(/\uFE0F/g,''),item]));
  const token=/\p{Extended_Pictographic}\uFE0F?/gu;
  const style='.garden-icon{display:inline-block;width:1em;height:1em;object-fit:contain;vertical-align:-.13em;flex-shrink:0;pointer-events:none}.pill.icon .garden-icon{width:30px;height:30px}';
  const watched=new WeakMap();
  function parts(text){
    const result=[];let start=0;
    for(const match of text.matchAll(token)){
      const icon=lookup.get(match[0].replace(/\uFE0F/g,''));if(!icon)continue;
      if(match.index>start)result.push(text.slice(start,match.index));
      result.push(icon);start=match.index+match[0].length;
    }
    if(start<text.length)result.push(text.slice(start));
    return result;
  }
  function eligible(node){
    return node.parentElement&&!node.parentElement.closest('script,style,textarea,input,option,title,svg,math,[contenteditable],.garden-icon-fallback,[data-keep-emoji]');
  }
  function replaceText(node){
    if(!eligible(node))return;
    const chunks=parts(node.nodeValue||'');if(!chunks.some(x=>typeof x==='object'))return;
    const fragment=document.createDocumentFragment();
    for(const chunk of chunks){
      if(typeof chunk==='string'){fragment.appendChild(document.createTextNode(chunk));continue;}
      const img=document.createElement('img');img.className='garden-icon';img.src=chunk.src;img.alt=chunk.label;
      img.draggable=false;img.decoding='async';img.width=192;img.height=192;
      img.onerror=()=>{
        const fallback=document.createElement('span');fallback.className='garden-icon-fallback';
        fallback.textContent=chunk.emoji;img.replaceWith(fallback);
      };
      fragment.appendChild(img);
    }
    node.replaceWith(fragment);
  }
  function apply(node){
    if(node.nodeType===3){replaceText(node);return;}
    const walker=document.createTreeWalker(node,4),text=[];
    while(walker.nextNode())text.push(walker.currentNode);
    text.forEach(replaceText);
  }
  function watch(root){
    if(watched.has(root))return watched.get(root);
    const css=document.createElement('style');css.textContent=style;
    (root===document.body?document.head:root).appendChild(css);
    apply(root);
    const observer=new MutationObserver(records=>{
      for(const record of records){
        if(record.type==='characterData')apply(record.target);
        else for(const node of record.addedNodes)if(node.isConnected)apply(node);
      }
    });
    observer.observe(root,{subtree:true,childList:true,characterData:true});
    const stop=()=>{observer.disconnect();watched.delete(root);};
    watched.set(root,stop);return stop;
  }
  const api={catalog,parts,watch};
  if(document.body)watch(document.body);
  return api;
})();
