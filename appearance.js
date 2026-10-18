/* 배움정원 v1.8.16 — explicit theme choices and Samsung supported schemes. */
window.GardenAppearance=(()=>{
const palettes=[
  { id: "pink", name: "벚꽃 분홍",
    L: { bg: "#fff6f9", card: "#ffffff", line: "#f1cfdb", accent: "#f7a8c0", ink: "#b0305f", soft: "#fde6ee", on: "#3a1626" },
    D: { bg: "#18171c", card: "#222127", line: "#38363f", accent: "#b4506f", ink: "#f2a9c0", soft: "#35232b", on: "#ffffff" } },
  { id: "sky", name: "하늘 파랑",
    L: { bg: "#f3f9ff", card: "#ffffff", line: "#c9dff2", accent: "#9ccbf2", ink: "#1f6aa8", soft: "#e3f1fd", on: "#10253a" },
    D: { bg: "#18171c", card: "#222127", line: "#38363f", accent: "#3a76aa", ink: "#9cc8ee", soft: "#1f2f3d", on: "#ffffff" } },
  { id: "mint", name: "민트 초록",
    L: { bg: "#f2fbf7", card: "#ffffff", line: "#c4e6d8", accent: "#93dcc0", ink: "#1c7a5c", soft: "#def6ec", on: "#0f2a1f" },
    D: { bg: "#18171c", card: "#222127", line: "#38363f", accent: "#2a8061", ink: "#8fdcc0", soft: "#1d332b", on: "#ffffff" } },
  { id: "lavender", name: "라벤더 보라",
    L: { bg: "#f7f4ff", card: "#ffffff", line: "#dad0f2", accent: "#c4b2f0", ink: "#6a49b8", soft: "#ece6fc", on: "#21163f" },
    D: { bg: "#18171c", card: "#222127", line: "#38363f", accent: "#7a5cc4", ink: "#c4b4f2", soft: "#2c2640", on: "#ffffff" } },
  { id: "peach", name: "복숭아 주황",
    L: { bg: "#fff7f2", card: "#ffffff", line: "#f2d8c8", accent: "#ffc0a0", ink: "#b5532a", soft: "#ffe9dc", on: "#3a1b0c" },
    D: { bg: "#18171c", card: "#222127", line: "#38363f", accent: "#b05835", ink: "#ffc3a3", soft: "#3a2a22", on: "#ffffff" } },
  { id: "lemon", name: "레몬 노랑",
    L: { bg: "#fffcf0", card: "#ffffff", line: "#eee0a8", accent: "#f6e08a", ink: "#8a6a00", soft: "#fff6cc", on: "#332a00" },
    D: { bg: "#18171c", card: "#222127", line: "#38363f", accent: "#8f7410", ink: "#f0dc86", soft: "#38321a", on: "#ffffff" } }
];

  const key='garden-appearance',root=document.documentElement;
  const media=window.matchMedia?.('(prefers-color-scheme: dark)');
  let state;
  function valid(value){return !!value&&['system','light','dark'].includes(value.theme)&&palettes.some(p=>p.id===value.palette);}
  function read(){
    try{const current=JSON.parse(localStorage.getItem(key));if(valid(current))return {theme:current.theme,palette:current.palette};}catch{}
    try{const legacy=JSON.parse(localStorage.getItem('dictation-settings'));if(valid(legacy))return {theme:legacy.theme,palette:legacy.palette};}catch{}
    return {theme:'system',palette:'mint'};
  }
  function apply(){
    const dark=state.theme==='dark'||state.theme==='system'&&!!media?.matches;
    const p=palettes.find(p=>p.id===state.palette),v=dark?p.D:p.L;
    const tokens={'--bg':v.bg,'--card':v.card,'--ink':dark?'#ece9f2':'#273e34','--muted':dark?'#b2b5ae':'#65766b','--line':v.line,'--accent':v.accent,'--accent-ink':v.ink,'--accent-soft':v.soft,'--on-accent':v.on,'--ok':dark?'#84d4a7':'#28794b','--ok-soft':dark?'#20382b':'#e5f4e9','--bad':dark?'#f0a1ab':'#a14935','--bad-soft':dark?'#39272b':'#fbf0e7','--hl':dark?'#4a4220':'#fff0bb'};
    for(const [key,value]of Object.entries(tokens))root.style.setProperty(key,value);
    root.dataset.theme=dark?'dark':'light';root.style.colorScheme='light dark';root.style.backgroundColor=v.bg;
    if(document.body)document.body.style.colorScheme=dark?'only dark':'only light';
    document.querySelector('meta[name="color-scheme"]')?.setAttribute('content','light dark');
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content',v.bg);
  }
  function choose(next){
    if(!valid(next))return false;
    try{localStorage.setItem(key,JSON.stringify(next));}catch{return false;}
    state={...next};apply();syncControls();return true;
  }
  function open(){
    if(typeof authenticated==='undefined'||!authenticated)return;
    const box=document.querySelector('#appearance-dialog');
    box.innerHTML=`<form method="dialog"><div class="topline"><h2>화면 설정</h2><button class="ghost" value="close" aria-label="화면 설정 닫기">닫기</button></div><fieldset><legend>밝기</legend><div class="appearance-options" role="group" aria-label="밝기 선택">${[['system','기기 설정'],['light','라이트'],['dark','다크']].map(([value,label])=>`<button type="button" class="appearance-theme" data-theme-choice="${value}" aria-pressed="${state.theme===value}">${label}</button>`).join('')}</div></fieldset><fieldset><legend>색상</legend><div class="appearance-swatches">${palettes.map(p=>`<button type="button" data-palette="${p.id}" aria-pressed="${p.id===state.palette}"><i style="background:${p.L.accent}"></i>${p.name}</button>`).join('')}</div></fieldset><p id="samsung-theme-note" class="muted" hidden>삼성 인터넷에서 라이트 화면이 계속 어두우면 브라우저의 웹페이지 다크 모드를 꺼 주세요.</p><p id="appearance-notice" role="status">선택하면 모든 학습 화면에 바로 적용돼요.</p></form>`;
    box.querySelectorAll('[data-theme-choice]').forEach(button=>button.onclick=()=>update({theme:button.dataset.themeChoice}));
    box.querySelectorAll('[data-palette]').forEach(button=>button.onclick=()=>update({palette:button.dataset.palette}));
    syncControls();box.onclose=()=>window.GardenNav?.sync('hub');box.showModal();window.GardenNav?.sync('appearance');
  }
  function syncControls(){
    document.querySelectorAll?.('#appearance-dialog [data-theme-choice]')?.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.themeChoice===state.theme)));
    document.querySelectorAll?.('#appearance-dialog [data-palette]')?.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.palette===state.palette)));
    const note=document.querySelector('#samsung-theme-note');
    if(note)note.hidden=!(typeof navigator!=='undefined'&&/SamsungBrowser/i.test(navigator.userAgent||'')&&state.theme==='light');
  }
  function update(patch){
    const notice=document.querySelector('#appearance-notice');
    if(!choose({...state,...patch})){notice.textContent='설정을 저장하지 못했어요. 다시 시도해 주세요.';return;}
    notice.textContent='모든 학습 화면에 적용했어요.';
  }
  state=read();apply();
  // Store a migrated legacy preference once, without changing subject settings.
  try{if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify(state));}catch{}
  media?.addEventListener?.('change',()=>{if(state.theme==='system')apply();});
  document.querySelector('#appearance-button').onclick=open;
  return {get:()=>({...state}),choose,reload(){state=read();apply();},open};
})();
