/* 배움정원 v1.8.22: choose a new flower only on successful admission. */
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
  function read(){try{const saved=JSON.parse(localStorage.getItem(storageKey));return valid(saved)?{current:saved.current}:null;}catch{return null;}}
  let state=read();
  function save(){try{localStorage.setItem(storageKey,JSON.stringify(state));}catch{}}
  function enter(){const choices=items.filter(item=>item.key!==state?.current);state={current:choices[Math.floor(Math.random()*choices.length)].key};save();return current();}
  function current(){if(!state)enter();return items.find(item=>item.key===state.current);}
  function markup(){const flower=current();return '<figure class="welcome-flower"><img src="'+flower.src+'" alt="'+flower.name+' 꽃" width="512" height="512" decoding="async"><figcaption>'+flower.name+'</figcaption></figure>';}
  return {items,valid,enter,current,markup,get:()=>state?{...state}:null,reload(){state=read();}};
})();
