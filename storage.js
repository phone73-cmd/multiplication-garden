/* Preserve all existing localStorage keys and JSON formats. Failed writes stay in memory. */
window.GardenStorage=(()=>{
  const pending=new Map();let message='';
  const signal=()=>window.dispatchEvent(new CustomEvent('garden-storage',{detail:{pending:pending.size,message}}));
  const write=(key,value)=>value===null?localStorage.removeItem(key):localStorage.setItem(key,value);
  function set(key,value){
    try{write(key,value);pending.delete(key);if(!pending.size)message='';signal();}
    catch(error){pending.set(key,value);message='일부 내용을 기기에 저장하지 못했어요. 이 창을 닫기 전에 다시 저장하거나 학습 데이터를 백업해 주세요.';signal();throw error;}
  }
  function get(key){if(pending.has(key))return pending.get(key);return localStorage.getItem(key);}
  function retry(){for(const [key,value]of [...pending]){try{set(key,value);}catch{}}return pending.size===0;}
  function transaction(data){
    const before=new Map(Object.keys(data).map(key=>[key,localStorage.getItem(key)])),queued=new Map(pending),recovery=new Map();
    try{for(const [key,value]of Object.entries(data))write(key,value);}
    catch(error){
      for(const [key,value]of before){try{write(key,value);}catch{recovery.set(key,value);}}
      pending.clear();for(const [key,value]of recovery)pending.set(key,value);for(const [key,value]of queued)pending.set(key,value);
      message=pending.size?'원래 데이터의 저장을 마치지 못했어요. 창을 닫기 전에 다시 저장하거나 백업해 주세요.':'변경 내용을 저장하지 못해 이전 데이터를 유지했어요.';signal();throw error;
    }
    for(const key of before.keys())pending.delete(key);if(!pending.size)message='';signal();
  }
  function warn(text){message=text;signal();}
  // Show errors once in a persistent, quiet footer rather than repeating popups.
  return {set,get,retry,transaction,warn,get pending(){return pending.size;},get message(){return message;}};
})();
