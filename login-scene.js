/* Local-time decoration for the login flower garden. Uses only existing illustrated assets. */
window.GardenScene=(()=>{
  const prefix='assets/login-scene/';let timer=null,layout=null,active=null,removeVisibility=null;
  const period=(date=new Date())=>{const h=date.getHours();return h>=6&&h<16?'day':h>=16&&h<19?'dusk':'night';};
  function orbit(date=new Date()){
    const minute=date.getHours()*60+date.getMinutes()+date.getSeconds()/60;
    const day=minute>=360&&minute<1140;
    const progress=day?(minute-360)/780:((minute<360?minute+1440:minute)-1140)/660;
    return {kind:day?'sun':'moon',progress,left:`calc(${progress*100}% + ${42-84*progress}px)`,top:`${10+28*(1-Math.sin(Math.PI*progress))}px`};
  }
  function pick(){return {grass:Math.random()<.5?2:3,height:40+Math.floor(Math.random()*22),fireflies:Math.random()<.5?1:2,clouds:Array.from({length:2},()=>[.65,.8,1][Math.floor(Math.random()*3)])};}
  function image(key,cls=''){return `<img src="${prefix+key}.webp" class="${cls}" width="64" height="64" alt="" draggable="false" decoding="async">`;}
  function flyerMarkup(key,i,p){
    const firefly=key==='firefly',nearFlowers=key==='moth'||key==='butterfly-flying';
    const duration=firefly?(i?23:19):key==='moth'?18:i?17:14;
    const reverse=firefly?i===1:key==='butterfly-flying';
    const left=firefly?(i?22:8):key==='moth'?12:i?22:8;
    const distance=firefly?(i?44:58):key==='moth'?52:i?44:58;
    const y=nearFlowers?'calc(100% - 142px)':`${layout.height+(firefly?35:0)}px`;
    const delay=firefly?(i?-11:-4):i?-5:0;
    return `<span class="scene-flight-lane" data-creature="${key}" style="--lane-left:${left}%;--distance:${distance}%;--flight-y:${y};--duration:${duration}s;--cycle:${duration*2}s;--delay:${delay}s"><span class="scene-traveler${reverse?' scene-traveler-reverse':''}"><span class="scene-flyer scene-day-flyer${firefly?' scene-firefly':''}">${image(key)}</span></span></span>`;
  }
  function contents(p){
    const position=orbit(),sky=position.kind;
    const flyers=p==='night'?flyerMarkup('moth',0,p)+Array.from({length:layout.fireflies},(_,i)=>flyerMarkup('firefly',i,p)).join(''):flyerMarkup('dragonfly-flying',0,p)+flyerMarkup('butterfly-flying',1,p);
    return `${p==='night'?'<span class="scene-stars">✦ · ✧ · ✦</span>':''}<span class="scene-celestial" style="--orbit-left:${position.left};--orbit-top:${position.top}">${image(sky)}</span><span class="scene-cloud scene-cloud-one" style="--cloud-opacity:${layout.clouds[0]}">${image('cloud')}</span><span class="scene-cloud scene-cloud-two" style="--cloud-opacity:${layout.clouds[1]}">${image('cloud')}</span>${flyers}${Array.from({length:layout.grass},(_,i)=>`<img src="assets/icons/grasshopper.webp" class="scene-grasshopper" style="--x:${(layout.grass===2?[16,74]:[12,45,78])[i]}%;--face:${i?-1:1}" width="34" height="30" alt="" draggable="false">`).join('')}`;
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
