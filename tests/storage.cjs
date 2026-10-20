const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const old='[{"score":80,"date":"old"}]',disk=new Map([['garden-history',old]]);let fail=false;
const window={dispatchEvent(){}};
vm.runInNewContext(fs.readFileSync(__dirname+'/../storage.js','utf8'),{window,CustomEvent:class{},localStorage:{getItem:k=>disk.get(k)??null,removeItem:k=>disk.delete(k),setItem:(k,v)=>{if(fail)throw Error('quota');disk.set(k,v);}}});
const store=window.GardenStorage;assert.equal(store.get('garden-history'),old);fail=true;
assert.throws(()=>store.set('garden-history','new'));assert.equal(disk.get('garden-history'),old);assert.equal(store.get('garden-history'),'new');assert.equal(store.pending,1);assert(store.message);
assert.throws(()=>store.set('dictation-items','edited'));assert.equal(store.pending,2);assert.equal(store.retry(),false);
fail=false;assert.equal(store.retry(),true);assert.equal(disk.get('garden-history'),'new');assert.equal(disk.get('dictation-items'),'edited');assert.equal(store.pending,0);assert.equal(store.message,'');
// A failed import must not leave newly introduced keys in the retry queue.
fail=true;assert.throws(()=>store.transaction({'dictation-items':'imported','new-key':'new'}));assert.equal(store.get('dictation-items'),'edited');assert.equal(store.get('new-key'),null);
fail=false;store.retry();assert.equal(disk.get('dictation-items'),'edited');assert.equal(disk.has('new-key'),false);
store.transaction({'garden-history':'committed','dictation-items':'committed'});assert.equal(disk.get('garden-history'),'committed');assert.equal(store.pending,0);
console.log('PASS: original data preserved on quota failure, pending overlay available for backup, batched retry, no schema/key migration.');
