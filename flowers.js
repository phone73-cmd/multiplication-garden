/* 배움정원 v2.0.1: choose a new flower only on successful admission. */
window.GardenFlowers=(()=>{
  const items=[
  {
    "key": "daisy",
    "name": "데이지",
    "src": "assets/flowers/daisy.webp"
  },
  {
    "key": "cosmos",
    "name": "코스모스",
    "src": "assets/flowers/cosmos.webp"
  },
  {
    "key": "cherry-blossom",
    "name": "벚꽃",
    "src": "assets/flowers/cherry-blossom.webp"
  },
  {
    "key": "plum-blossom",
    "name": "매화",
    "src": "assets/flowers/plum-blossom.webp"
  },
  {
    "key": "rose",
    "name": "장미",
    "src": "assets/flowers/rose.webp"
  },
  {
    "key": "peony",
    "name": "작약",
    "src": "assets/flowers/peony.webp"
  },
  {
    "key": "carnation",
    "name": "카네이션",
    "src": "assets/flowers/carnation.webp"
  },
  {
    "key": "hydrangea",
    "name": "수국",
    "src": "assets/flowers/hydrangea.webp"
  },
  {
    "key": "tulip",
    "name": "튤립",
    "src": "assets/flowers/tulip.webp"
  },
  {
    "key": "sunflower",
    "name": "해바라기",
    "src": "assets/flowers/sunflower.webp"
  },
  {
    "key": "daffodil",
    "name": "수선화",
    "src": "assets/flowers/daffodil.webp"
  },
  {
    "key": "morning-glory",
    "name": "나팔꽃",
    "src": "assets/flowers/morning-glory.webp"
  },
  {
    "key": "violet",
    "name": "제비꽃",
    "src": "assets/flowers/violet.webp"
  },
  {
    "key": "pansy",
    "name": "팬지",
    "src": "assets/flowers/pansy.webp"
  },
  {
    "key": "lily-of-the-valley",
    "name": "은방울꽃",
    "src": "assets/flowers/lily-of-the-valley.webp"
  },
  {
    "key": "forget-me-not",
    "name": "물망초",
    "src": "assets/flowers/forget-me-not.webp"
  }
];
  const storageKey='garden-welcome-flower';
  const valid=value=>!!value&&typeof value==='object'&&!Array.isArray(value)&&items.some(item=>item.key===value.current);
  function read(){try{const saved=JSON.parse((globalThis.window?.GardenStorage?.get||localStorage.getItem.bind(localStorage))(storageKey));return valid(saved)?{current:saved.current}:null;}catch{return null;}}
  let state=read(),loginPair=null;
  function save(){try{(globalThis.window?.GardenStorage?.set||localStorage.setItem.bind(localStorage))(storageKey,JSON.stringify(state));}catch{}}
  function enter(){loginPair=null;const choices=items.filter(item=>item.key!==state?.current);state={current:choices[Math.floor(Math.random()*choices.length)].key};save();return current();}
  function current(){if(!state)enter();return items.find(item=>item.key===state.current);}
  function markup(){const flower=current();return '<figure class="welcome-flower"><img src="'+flower.src+'" alt="'+flower.name+' 꽃" width="512" height="512" decoding="async"><figcaption>'+flower.name+'</figcaption></figure>';}
  function loginMarkup(){
    if(!loginPair){const first=items[Math.floor(Math.random()*items.length)],others=items.filter(item=>item.key!==first.key);loginPair=[first,others[Math.floor(Math.random()*others.length)]];}
    const icon=flower=>`<img class="login-entry-flower" src="${flower.src}" alt="" aria-hidden="true" width="26" height="26" decoding="async" draggable="false">`;
    return `${icon(loginPair[0])}<span>정원에 들어가기</span>${icon(loginPair[1])}`;
  }
  return {items,valid,loginMarkup,enter,current,markup,get:()=>state?{...state}:null,reload(){state=read();}};
})();
