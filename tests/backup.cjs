const fs=require('fs'),vm=require('vm'),assert=require('assert');
const source=fs.readFileSync(__dirname+'/../study.js','utf8');
async function run(kind){
 const notice={},downloads=[],storage=new Map([['garden-history',JSON.stringify([{score:80,date:'2026-10-17'}])]]);let shares=0,checks=0,blob;
 const context=vm.createContext({document:{querySelector:selector=>selector==='#backup-notice'?notice:{},body:{appendChild(){}},createElement:()=>({click(){downloads.push(this.download)},remove(){}})},navigator:{userAgent:kind==='desktop'?'Chrome Mac':'iPhone',canShare(){checks++;if(kind==='canShare-error')throw Object.assign(Error(),{name:'NotAllowedError'});return true;},async share(){shares++;if(kind==='share-error')throw Object.assign(Error(),{name:'NotAllowedError'});if(kind==='cancel')throw Object.assign(Error(),{name:'AbortError'});}},Blob,File:kind==='no-file'?undefined:File,URL:{createObjectURL:value=>{blob=value;return 'blob:test'},revokeObjectURL(){}},localStorage:{getItem:key=>storage.get(key)??null},setTimeout(){}});
 vm.runInContext(source,context);await vm.runInContext('exportStudy()',context);
 if(kind==='cancel'){assert.equal(downloads.length,0);assert.equal(notice.textContent,'내보내기를 취소했어요.');}
 else if(kind==='shared'){assert.equal(shares,1);assert.equal(downloads.length,0);assert(notice.textContent.includes('공유창'));}
 else{assert.equal(downloads.length,1,kind+': '+notice.textContent);assert(!notice.textContent.includes('만들지 못'));assert.equal(JSON.parse(await blob.text()).data['garden-history'][0].score,80);context.backupText=await blob.text();assert.equal(vm.runInContext('validStudyBackup(backupText)["garden-history"][0].score',context),80);}
 if(kind==='desktop'){assert.equal(shares,0);assert.equal(checks,0);}
 return {kind,downloads:downloads.length,shares};
}
(async()=>{const results=[];for(const kind of ['desktop','no-file','canShare-error','share-error','cancel','shared'])results.push(await run(kind));console.log(JSON.stringify({result:'passed',cases:results,roundtrip:'generated JSON accepted by importer'}));})().catch(e=>{console.error(e);process.exit(1)});
