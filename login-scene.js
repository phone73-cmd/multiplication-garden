/* Local-time decoration for the login flower garden. Uses only existing illustrated assets. */
window.GardenScene=(()=>{
  const prefix='assets/login-scene/';let timer=null,layout=null,active=null,removeVisibility=null;
  const period=(date=new Date())=>{const h=date.getHours();return h>=6&&h<16?'day':h>=16&&h<19?'dusk':'night';};
  function orbit(date=new Date()){
    const minute=date.getHours()*60+date.getMinutes()+date.getSeconds()/60;
    const day=minute>=360&&minute<1140;
    const progress=day?(minute-360)/780:((minute<360?minute+1440:minute)-1140)/660;
    return {kind:day?'sun':'moon',progress,left:`calc(${progress*100}% + ${42-84*progress}px)`,top:`${12+52*(1-Math.sin(Math.PI*progress))}px`};
  }
  function pick(){return {grass:Math.random()<.5?2:3,left:18+Math.floor(Math.random()*12),right:58+Math.floor(Math.random()*12),height:40+Math.floor(Math.random()*22)};}
  function image(key,cls=''){return `<img src="${prefix+key}.webp" class="${cls}" width="64" height="64" alt="" draggable="false" decoding="async">`;}
  function flyerMarkup(key,i,p){
    if(p==='night')return `<span class="scene-flyer ${key==='firefly'?'scene-firefly':''}" style="--x:${i?layout.right:layout.left}%;--y:${layout.height+(i?35:0)}px;--duration:${i?17:14}s;--delay:${i?-5:0}s;--face:${i?-1:1}">${image(key)}</span>`;
    const duration=i?17:14;
    return `<span class="scene-flight-lane" style="--lane-left:${i?22:8}%;--distance:${i?44:58}%;--flight-y:${layout.height+(i?35:0)}px;--duration:${duration}s;--cycle:${duration*2}s;--delay:${i?-5:0}s"><span class="scene-traveler${i?' scene-traveler-reverse':''}"><span class="scene-flyer scene-day-flyer">${image(key)}</span></span></span>`;
  }
  function contents(p){
    const position=orbit(),sky=position.kind,creatures=p==='night'?['moth','firefly']:['dragonfly-flying','butterfly-flying'];
    return `${p==='night'?'<span class="scene-stars">✦ · ✧ · ✦</span>':''}<span class="scene-celestial" style="--orbit-left:${position.left};--orbit-top:${position.top}">${image(sky)}</span>${creatures.map((key,i)=>flyerMarkup(key,i,p)).join('')}${Array.from({length:layout.grass},(_,i)=>`<img src="assets/icons/grasshopper.webp" class="scene-grasshopper" style="--x:${(layout.grass===2?[16,74]:[12,45,78])[i]}%;--face:${i?-1:1}" width="34" height="30" alt="" draggable="false">`).join('')}`;
  }
  function markup(){layout=pick();const p=period();return `<div id="login-scene" class="login-scene" data-period="${p}" aria-hidden="true">${contents(p)}</div>`;}
  function stop(){if(timer!==null){clearTimeout(timer);timer=null;}removeVisibility?.();removeVisibility=null;active=null;}
  function bind(root){
    stop();const sky=root.querySelector('.login-sky'),host=root.querySelector('#login-scene');if(!sky||!host)return;
    if(!layout)layout=pick();active={sky,host};let shown=null;
    const update=()=>{
      if(!active)return;
      const p=period();sky.setAttribute('data-period',p);
      if(p!==shown){shown=p;host.setAttribute('data-period',p);host.innerHTML=contents(p);host.querySelectorAll('img').forEach(img=>img.onerror=()=>{img.hidden=true;});}
      const position=orbit(),body=host.querySelector?.('.scene-celestial');
      if(body?.style){body.style.setProperty('--orbit-left',position.left);body.style.setProperty('--orbit-top',position.top);}
      if(timer!==null)clearTimeout(timer);
      timer=setTimeout(update,10000-(Date.now()%10000));
    };
    update();
    if(typeof document!=='undefined'&&document.addEventListener){
      const visible=()=>{if(!document.hidden)update();};document.addEventListener('visibilitychange',visible);removeVisibility=()=>document.removeEventListener('visibilitychange',visible);
    }
  }
  return {period,orbit,markup,bind,stop};
})();
